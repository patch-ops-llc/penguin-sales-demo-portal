import { NextResponse } from "next/server";
import { getAgentDemo, type AgentDemo } from "@/demos/agent/catalog";
import { runTool } from "@/demos/agent/tools";
import { toolDef, toolDefs } from "@/lib/agent/tool-docs";
import { estimateCostUsd } from "@/lib/agent/cost";
import { checkDailyBudget, checkRunCap, checkUserRate, recordSpend } from "@/lib/agent/limits";
import { systemPrompt } from "@/lib/agent/prompt";
import { enabledProviders, isProviderId, modelFor, providerFor } from "@/lib/agent/providers";
import { safeErrorText, sseRecord } from "@/lib/agent/sse";
import type { AgentMessage, AgentProviderId, Opaque, ToolCall, ToolResult, Usage } from "@/lib/agent/types";
import { getCurrentUser, requestMeta } from "@/lib/auth";
import { env } from "@/lib/env";
import { logEvent } from "@/lib/log";
import type { Action } from "@/store/slices/types";
import { replay, seedWorld } from "@/store/world";
import { getVertical } from "@/verticals/catalog";
import { getPack } from "@/verticals/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BODY_BYTES = 512 * 1024;
const MAX_MESSAGES = 200;
const MAX_ACTIONS = 2000;
const MAX_TEXT = 4000;
const MAX_TOKENS_PER_CALL = 1024;

/**
 * One agent turn against the simulated portal.
 *
 * The browser sends the run so far (its action log and the agent transcript); the server rebuilds
 * the same World the browser has, lets the model call tools against it, and streams back text,
 * tool calls, and the store Actions each tool produced. The browser applies those Actions through
 * its own store, so Reset, Back, replay, and the Penguin markers work exactly as for a clicked demo.
 * Nothing about the run is kept on the server between requests; nothing a model says is persisted
 * unless AGENT_LOG_TRANSCRIPTS is on.
 *
 * Wire format: server-sent events, one JSON object per event. See `Emit` below for the names.
 */

type Body = {
  provider: AgentProviderId;
  demo: AgentDemo;
  vertical: string;
  messages: AgentMessage[];
  actions: Action[];
  approve: Record<string, boolean>;
  now: number;
};

type Emit =
  | { event: "text_delta"; data: { text: string } }
  | { event: "tool_call"; data: { call: ToolCall } }
  | { event: "tool_result"; data: { id: string; name: string; result: unknown; error?: string; actions: Action[] } }
  | { event: "confirm"; data: { calls: ToolCall[] } }
  | { event: "message"; data: { message: AgentMessage } }
  | { event: "usage"; data: { provider: AgentProviderId; model: string; round: number; inputTokens: number; outputTokens: number; cachedInputTokens: number; costUsd: number } }
  | { event: "done"; data: { reason: "end" | "confirm" | "max_tokens" | "loop_cap" | "error" } }
  | { event: "error"; data: { error: string; message: string; fallback: "scripted" } };

function fail(status: number, error: string, message: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error, message, fallback: "scripted", ...extra }, { status });
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseMessages(raw: unknown): AgentMessage[] | null {
  if (!Array.isArray(raw) || raw.length > MAX_MESSAGES) return null;
  const out: AgentMessage[] = [];
  for (const m of raw) {
    if (!isRecord(m)) return null;
    if (m.role === "user") {
      if (typeof m.text !== "string") return null;
      out.push({ role: "user", text: m.text.slice(0, MAX_TEXT) });
    } else if (m.role === "assistant") {
      if (typeof m.text !== "string" || !Array.isArray(m.toolCalls)) return null;
      const toolCalls: ToolCall[] = [];
      for (const c of m.toolCalls) {
        if (!isRecord(c) || typeof c.id !== "string" || typeof c.name !== "string" || !isRecord(c.args)) return null;
        toolCalls.push({ id: c.id.slice(0, 120), name: c.name.slice(0, 80), args: c.args });
      }
      let opaque: Opaque | undefined;
      if (isRecord(m.opaque) && isProviderId(m.opaque.provider)) opaque = { provider: m.opaque.provider, data: m.opaque.data };
      out.push({ role: "assistant", text: m.text, toolCalls, ...(opaque ? { opaque } : {}) });
    } else if (m.role === "tool") {
      if (!Array.isArray(m.results)) return null;
      const results: ToolResult[] = [];
      for (const r of m.results) {
        if (!isRecord(r) || typeof r.id !== "string" || typeof r.name !== "string") return null;
        results.push({ id: r.id.slice(0, 120), name: r.name.slice(0, 80), result: r.result });
      }
      out.push({ role: "tool", results });
    } else {
      return null;
    }
  }
  return out;
}

async function parseBody(request: Request): Promise<Body | { error: string; message: string; status: number; extra?: Record<string, unknown> }> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) return { status: 413, error: "too_large", message: "The run is too large to send." };
  let raw: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return { status: 413, error: "too_large", message: "The run is too large to send." };
    raw = JSON.parse(text);
  } catch {
    return { status: 400, error: "invalid_request", message: "The request body is not valid JSON." };
  }
  if (!isRecord(raw)) return { status: 400, error: "invalid_request", message: "The request body must be an object." };

  if (!isProviderId(raw.provider)) return { status: 400, error: "invalid_request", message: "Unknown provider." };
  const demo = typeof raw.demo === "string" ? getAgentDemo(raw.demo) : null;
  if (!demo) return { status: 400, error: "unknown_demo", message: "Unknown agent demo." };
  const vertical = typeof raw.vertical === "string" && getVertical(raw.vertical) ? raw.vertical : null;
  if (!vertical) return { status: 400, error: "unknown_vertical", message: "Unknown vertical." };
  if (demo.verticals && !demo.verticals.includes(vertical)) return { status: 400, error: "unknown_demo", message: "That agent demo is not available in this vertical." };
  const messages = parseMessages(raw.messages ?? []);
  if (!messages) return { status: 400, error: "invalid_request", message: "The transcript is malformed." };
  const actionsRaw = raw.actions ?? [];
  if (!Array.isArray(actionsRaw) || actionsRaw.length > MAX_ACTIONS || !actionsRaw.every((a) => isRecord(a) && typeof a.t === "string")) {
    return { status: 400, error: "invalid_request", message: "The action log is malformed." };
  }
  const approve: Record<string, boolean> = {};
  if (isRecord(raw.approve)) for (const [k, v] of Object.entries(raw.approve)) if (typeof v === "boolean") approve[k.slice(0, 120)] = v;
  const now = typeof raw.now === "number" && Number.isFinite(raw.now) && Math.abs(raw.now - Date.now()) < 24 * 60 * 60 * 1000 ? raw.now : Date.now();

  return { provider: raw.provider, demo, vertical, messages, actions: actionsRaw as Action[], approve, now };
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });

  const parsed = await parseBody(request);
  if ("status" in parsed) return fail(parsed.status, parsed.error, parsed.message, parsed.extra);
  const { provider: providerId, demo, vertical, messages, actions, approve, now } = parsed;

  const provider = providerFor(providerId);
  if (!provider) return fail(409, "provider_disabled", "That provider is not available on this portal.", { providers: enabledProviders() });

  const runCap = checkRunCap(messages);
  if (!runCap.ok) return fail(429, runCap.code, runCap.message);
  const rate = checkUserRate(user.id);
  if (!rate.ok) return fail(429, rate.code, rate.message);
  const budget = await checkDailyBudget(providerId);
  if (!budget.ok) return fail(429, budget.code, budget.message);

  const pack = getPack(vertical);
  if (!pack) return fail(400, "unknown_vertical", "Unknown vertical.");
  let world;
  try {
    world = replay(seedWorld(pack), actions, pack);
  } catch {
    return fail(400, "invalid_request", "The action log could not be replayed.");
  }

  const model = modelFor(providerId);
  const system = systemPrompt(pack, demo, world.persona);
  const tools = toolDefs(demo.tools);
  const sample = providerId === "mock" ? demo.sample(pack) : undefined;
  const history: AgentMessage[] = [...messages];
  if (history.length === 0 || history.every((m) => m.role !== "user")) history.unshift({ role: "user", text: demo.goal });

  const meta = await requestMeta();
  const startedAt = Date.now();
  const encoder = new TextEncoder();
  const totals: Usage = { inputTokens: 0, outputTokens: 0, cachedInputTokens: 0 };
  let costUsd = 0;
  let rounds = 0;
  const toolNames: string[] = [];
  let status: "ok" | "confirm" | "error" | "loop_cap" | "aborted" = "ok";
  const transcript: string[] = [];

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const emit = (e: Emit) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(sseRecord(e.event, e.data)));
        } catch {
          closed = true;
        }
      };
      const ctx = { w: world, pack, now };

      const execute = (calls: ToolCall[], decisions: Record<string, boolean> | null): ToolResult[] => {
        const results: ToolResult[] = [];
        for (const call of calls) {
          const def = toolDef(call.name);
          toolNames.push(call.name);
          if (def?.confirm && decisions && decisions[call.id] !== true) {
            const result = { declined: true, message: "The rep did not confirm this action." };
            emit({ event: "tool_result", data: { id: call.id, name: call.name, result, actions: [] } });
            results.push({ id: call.id, name: call.name, result });
            continue;
          }
          const outcome = runTool(call, ctx, demo.tools);
          const result = outcome.error ? { error: outcome.error } : outcome.result;
          emit({ event: "tool_result", data: { id: call.id, name: call.name, result, ...(outcome.error ? { error: outcome.error } : {}), actions: outcome.actions } });
          results.push({ id: call.id, name: call.name, result });
        }
        return results;
      };

      try {
        // A turn that ended waiting on the rep's confirmation resumes here with their answer.
        const last = history[history.length - 1];
        if (last?.role === "assistant" && last.toolCalls.length > 0) {
          const results = execute(last.toolCalls, approve);
          const message: AgentMessage = { role: "tool", results };
          history.push(message);
          emit({ event: "message", data: { message } });
        }

        for (let round = 0; round < demo.maxToolRounds; round++) {
          rounds = round + 1;
          let text = "";
          const toolCalls: ToolCall[] = [];
          let opaque: Opaque | undefined;
          let stop: "end" | "tool_use" | "max_tokens" | "other" = "other";
          let failed = false;

          for await (const event of provider.complete({ model, system, messages: history, tools, maxTokens: MAX_TOKENS_PER_CALL, signal: request.signal, sample })) {
            if (event.type === "text_delta") {
              text += event.text;
              emit({ event: "text_delta", data: { text: event.text } });
            } else if (event.type === "tool_call") {
              toolCalls.push(event.call);
              emit({ event: "tool_call", data: { call: event.call } });
            } else if (event.type === "usage") {
              const usd = estimateCostUsd(model, event.usage);
              totals.inputTokens += event.usage.inputTokens;
              totals.outputTokens += event.usage.outputTokens;
              totals.cachedInputTokens += event.usage.cachedInputTokens;
              costUsd += usd;
              recordSpend(providerId, usd);
              emit({ event: "usage", data: { provider: providerId, model, round: rounds, ...event.usage, costUsd: usd } });
            } else if (event.type === "opaque") {
              opaque = event.opaque;
            } else if (event.type === "done") {
              stop = event.stopReason;
            } else if (event.type === "error") {
              failed = true;
              status = "error";
              emit({ event: "error", data: { error: "provider_error", message: safeErrorText(event.message), fallback: "scripted" } });
              break;
            }
          }
          if (failed) {
            emit({ event: "done", data: { reason: "error" } });
            break;
          }

          const assistant: AgentMessage = { role: "assistant", text, toolCalls, ...(opaque ? { opaque } : {}) };
          history.push(assistant);
          emit({ event: "message", data: { message: assistant } });
          if (env.agentLogTranscripts) transcript.push(text.slice(0, 2000));

          if (toolCalls.length === 0) {
            emit({ event: "done", data: { reason: stop === "max_tokens" ? "max_tokens" : "end" } });
            break;
          }
          if (toolCalls.some((c) => toolDef(c.name)?.confirm)) {
            status = "confirm";
            emit({ event: "confirm", data: { calls: toolCalls } });
            emit({ event: "done", data: { reason: "confirm" } });
            break;
          }
          const results = execute(toolCalls, null);
          const message: AgentMessage = { role: "tool", results };
          history.push(message);
          emit({ event: "message", data: { message } });

          if (round === demo.maxToolRounds - 1) {
            status = "loop_cap";
            emit({ event: "done", data: { reason: "loop_cap" } });
          }
        }
      } catch (error) {
        if (request.signal.aborted) {
          status = "aborted";
        } else {
          status = "error";
          console.error("[agent] turn failed:", error instanceof Error ? safeErrorText(error.message) : "unknown error");
          emit({ event: "error", data: { error: "turn_failed", message: "The agent turn failed.", fallback: "scripted" } });
          emit({ event: "done", data: { reason: "error" } });
        }
      } finally {
        closed = true;
        try {
          controller.close();
        } catch {
          // Already closed by the client.
        }
        await logEvent({
          type: "agent_turn",
          userId: user.id,
          email: user.email,
          sessionId: user.sessionId,
          vertical,
          demo: demo.id,
          ip: meta.ip,
          userAgent: meta.userAgent,
          meta: {
            agentDemo: demo.id,
            provider: providerId,
            model,
            rounds,
            inputTokens: totals.inputTokens,
            outputTokens: totals.outputTokens,
            cachedInputTokens: totals.cachedInputTokens,
            costUsd,
            latencyMs: Date.now() - startedAt,
            tools: toolNames,
            status,
            ...(env.agentLogTranscripts ? { transcript } : {}),
          },
        });
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
    },
  });
}
