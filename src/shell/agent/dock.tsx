"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PenguinMark } from "@/components/brand";
import { getAgentDemo } from "@/demos/agent/catalog";
import { answerScripted, focusFor, focusPathOf, scriptedTurn } from "@/demos/agent/scripted";
import { confirmTools } from "@/demos/agent/tools";
import { track } from "@/lib/beacon";
import type { AgentMessage, AgentProviderId, ToolCall } from "@/lib/agent/types";
import { agentTurns, pendingConfirmation } from "@/store/slices/agent";
import { useShell } from "@/store/store";
import { Ext } from "../ext";
import { Icon } from "../icons";
import { cx } from "../ui";
import { fetchAgentStatus, streamTurn, TurnRefused, type AgentStatus } from "./client";

const PROVIDER_ORDER: AgentProviderId[] = ["anthropic", "openai", "xai", "mock"];

type Draft = { text: string; calls: ToolCall[]; done: Record<string, "ok" | "error"> };
const EMPTY_DRAFT: Draft = { text: "", calls: [], done: {} };

function describeCall(call: ToolCall, result: unknown): string {
  const r = (result ?? {}) as Record<string, unknown>;
  const a = call.args ?? {};
  switch (call.name) {
    case "get_deal":
      return "Read the deal";
    case "get_guided_quote_state":
      return "Read the Guided quote questions";
    case "list_products":
      return "Looked up products";
    case "guided_quote_select":
      return `Answered ${String(a.field)}: ${String(a.option)}`;
    case "guided_quote_set_quantity":
      return `Set quantity ${String(a.quantity)}`;
    case "guided_quote_set_need_by":
      return `Set need-by: ${String(a.needBy)}`;
    case "guided_quote_generate":
      return "Ran the rate card";
    case "create_quote":
      return r.number ? `Created quote ${String(r.number)}` : "Created the quote";
    case "get_quote":
      return "Read the quote";
    case "apply_discount":
      return `Applied ${String(a.percent)}% discount`;
    case "request_approval":
      return "Requested approval";
    case "send_quote":
      return r.declined ? "Send declined by the rep" : "Sent the quote to the buyer";
    case "log_activity":
      return `Logged a ${String(a.kind)}`;
    case "get_complaint":
      return "Read the complaint and the SLA policy";
    case "ingest_complaint":
      return "Opened the ticket and sent the 24h acknowledgement";
    case "open_ticket":
      return "Opened the ticket record";
    case "escalate_ticket":
      return "Escalated under the SLA rule";
    case "send_resolution_letter":
      return r.declined ? "Letter held by the rep" : "Sent the resolution letter";
    case "resolve_ticket":
      return "Closed the ticket with the root cause";
    case "get_loan_application":
      return "Read the application and the LOS packet";
    case "submit_loan_application":
      return "Opened the loan deal in the pipeline";
    case "set_missing_docs":
      return Array.isArray(a.itemIds) ? `Flagged ${a.itemIds.length} missing documents` : "Flagged the missing documents";
    case "confirm_los_checklist":
      return "Confirmed the LOS checklist";
    case "start_doc_reminder_sequence":
      return r.declined ? "Reminder held by the rep" : "Started the reminder sequence";
    case "complete_document_packet":
      return "Recorded the borrower's uploads";
    case "verify_funded_deal":
      return "Verified the funded deal";
    default:
      return call.name.replace(/_/g, " ");
  }
}

/** What the approval card says the agent is about to do. */
function describeConfirm(call: ToolCall): string {
  switch (call.name) {
    case "send_quote":
      return "send the quote to the buyer";
    case "send_resolution_letter":
      return "send the formal resolution letter to the complainant";
    case "start_doc_reminder_sequence":
      return "email the borrower and start the reminder sequence";
    default:
      return describeCall(call, undefined).toLowerCase();
  }
}

function ToolChip({ call, state, result }: { call: ToolCall; state: "ok" | "error" | "pending" | "waiting"; result?: unknown }) {
  const error = state === "error" ? String((result as { error?: string } | undefined)?.error ?? "failed") : null;
  return (
    <li
      className={cx(
        "flex items-start gap-1.5 rounded-[6px] border px-2 py-1 text-[12px] leading-snug",
        state === "error" ? "border-[#f2b8b5] bg-[#fdf1f0] text-[#8a1f1a]" : state === "waiting" ? "border-[#e9c46a] bg-[#fff8e6] text-[#7a5a00]" : "border-penguin/30 bg-penguin-soft/60 text-penguin-strong",
      )}
      data-testid={`agent-tool-${call.name}`}
      data-state={state}
      title={error ?? call.name}
    >
      {state === "pending" ? (
        <span className="mt-[3px] inline-block h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-penguin" aria-hidden="true" />
      ) : (
        <Icon name={state === "error" ? "warning" : state === "waiting" ? "lock" : "check"} size={13} className="mt-0.5 shrink-0" />
      )}
      <span className="min-w-0">
        <span className="font-semibold">{describeCall(call, result)}</span>
        <span className="ml-1 font-mono text-[10.5px] opacity-70">{call.name}</span>
        {error ? <span className="block text-[11.5px]">{error}</span> : null}
      </span>
    </li>
  );
}

/**
 * The agent workspace: a Penguin-built panel beside the HubSpot screens where the rep talks to
 * the model. The model's tool calls arrive as store actions, so what it does shows up in the real
 * deal, Guided quote, and quote screens as it happens. With no live provider the same panel plays
 * the scripted transcript through the same tool bridge.
 */
export function AgentDock() {
  const { pack, world, changes, vertical, demo: demoId, dispatch, navigate } = useShell();
  const demo = getAgentDemo(demoId);
  const [status, setStatus] = useState<AgentStatus | null | "loading">("loading");
  const [picked, setPicked] = useState<AgentProviderId | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [usage, setUsage] = useState({ tokens: 0, costUsd: 0 });
  const [notice, setNotice] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);
  const latest = useRef({ world, changes });
  useEffect(() => {
    latest.current = { world, changes };
  });

  useEffect(() => {
    let cancelled = false;
    fetchAgentStatus().then((s) => {
      if (!cancelled) setStatus(s);
    });
    return () => {
      cancelled = true;
      abort.current?.abort();
    };
  }, []);

  const available = useMemo(() => {
    const ids = status && status !== "loading" ? status.providers.map((p) => p.id) : [];
    // The demo's default provider leads when it is on; the rest keep the house order.
    const order = demo ? [demo.defaultProvider, ...PROVIDER_ORDER.filter((id) => id !== demo.defaultProvider)] : PROVIDER_ORDER;
    return order.filter((id) => ids.includes(id));
  }, [status, demo]);
  const sampleLength = useMemo(() => demo?.sample(pack).length ?? 0, [demo, pack]);
  const provider: AgentProviderId | null = world.ag.provider && available.includes(world.ag.provider) ? world.ag.provider : picked && available.includes(picked) ? picked : (available[0] ?? null);
  const providerInfo = status && status !== "loading" ? status.providers.find((p) => p.id === provider) : undefined;
  const scripted = status !== "loading" && (provider === null || world.ag.fallback !== null);
  const gated = useMemo(() => confirmTools(), []);
  const pending = pendingConfirmation(world, gated);
  const turns = agentTurns(world);
  const messages = world.ag.messages;
  const results = useMemo(() => {
    const map = new Map<string, unknown>();
    for (const m of messages) if (m.role === "tool") for (const r of m.results) map.set(r.id, r.result);
    return map;
  }, [messages]);
  const actionCount = useMemo(() => messages.reduce((n, m) => (m.role === "tool" ? n + m.results.filter((r) => !(r.result as { error?: unknown } | null)?.error && !(r.result as { declined?: unknown } | null)?.declined).length : n), 0), [messages]);

  useEffect(() => {
    const el = list.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, draft, busy, pending.length]);

  const playScripted = useCallback(
    (approve: boolean | null) => {
      const { world: w } = latest.current;
      const ctx = { w, pack };
      const now = Date.now();
      if (!demo) return;
      const actions = approve === null ? scriptedTurn(ctx, now, demo.id) : answerScripted(ctx, approve, now, demo.id);
      if (actions.length === 0) return;
      dispatch(actions);
      const path = focusPathOf(actions, pack, w);
      if (path) navigate(path);
    },
    [pack, demo, dispatch, navigate],
  );

  const fallBack = useCallback(
    (reason: string) => {
      setNotice(reason);
      if (latest.current.world.ag.fallback === null) {
        dispatch({ t: "agent.fallback", reason });
        track({ type: "agent_fallback", vertical, demo: demoId });
      }
    },
    [dispatch, vertical, demoId],
  );

  const runLive = useCallback(
    async (live: AgentProviderId, text: string | null, approve: Record<string, boolean> | undefined) => {
      const { world: w, changes: log } = latest.current;
      const user: AgentMessage | null = text ? { role: "user", text } : null;
      const history = [...w.ag.messages, ...(user ? [user] : [])];
      const actions = [...log, ...(user ? [{ t: "agent.message" as const, message: user }] : [])];
      const first: { t: "agent.provider"; id: AgentProviderId }[] = w.ag.provider ? [] : [{ t: "agent.provider", id: live }];
      dispatch([...first, ...(user ? [{ t: "agent.message" as const, message: user }] : [])]);
      setBusy(true);
      setNotice(null);
      setDraft(EMPTY_DRAFT);
      const controller = new AbortController();
      abort.current = controller;
      let quoteId = w.gq.quoteId;
      // Once a quote goes out, the screen stays on it for the rest of the turn.
      let hold = false;
      try {
        for await (const e of streamTurn({ provider: live, demo: demoId, vertical, messages: history, actions, approve, signal: controller.signal })) {
          switch (e.event) {
            case "text_delta":
              setDraft((d) => ({ ...d, text: d.text + e.data.text }));
              break;
            case "tool_call":
              setDraft((d) => ({ ...d, calls: [...d.calls, e.data.call] }));
              break;
            case "tool_result": {
              const id = (e.data.result as { id?: unknown } | null)?.id;
              if (e.data.name === "create_quote" && typeof id === "string") quoteId = id;
              const focus = focusFor(e.data.name, pack, quoteId);
              dispatch([...e.data.actions, ...focus.actions]);
              if (!hold) navigate(focus.path);
              if (e.data.actions.some((a) => a.t === "quote.send")) hold = true;
              setDraft((d) => ({ ...d, done: { ...d.done, [e.data.id]: e.data.error ? "error" : "ok" } }));
              break;
            }
            case "message":
              dispatch({ t: "agent.message", message: e.data.message });
              if (e.data.message.role === "assistant") setDraft(EMPTY_DRAFT);
              break;
            case "usage":
              setUsage((u) => ({ tokens: u.tokens + e.data.inputTokens + e.data.outputTokens, costUsd: u.costUsd + e.data.costUsd }));
              break;
            case "error":
              fallBack(`${e.data.message} The scripted transcript continues from here.`);
              break;
            default:
              break;
          }
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        if (error instanceof TurnRefused) fallBack(`${error.message} The scripted transcript continues from here.`);
        else fallBack("The live model could not be reached. The scripted transcript continues from here.");
      } finally {
        if (abort.current === controller) abort.current = null;
        setBusy(false);
        setDraft(EMPTY_DRAFT);
      }
    },
    [pack, vertical, demoId, dispatch, navigate, fallBack],
  );

  const send = useCallback(
    (text: string | null, approve?: Record<string, boolean>) => {
      if (busy) return;
      if (scripted || !provider) {
        playScripted(approve ? Object.values(approve).every(Boolean) : null);
        return;
      }
      void runLive(provider, text, approve);
    },
    [busy, scripted, provider, playScripted, runLive],
  );

  const submit = () => {
    const text = input.trim();
    if (!text || busy || scripted) return;
    setInput("");
    send(text);
  };

  const decide = (approve: boolean) => {
    if (pending.length === 0) return;
    send(null, Object.fromEntries(pending.map((c) => [c.id, approve])));
  };

  if (!demo) return null;

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="flex w-10 shrink-0 flex-col items-center gap-2 border-l border-[#3b2a7a] bg-[#1c1340] pt-3 text-white hover:bg-[#241a4f]"
        title="Show the agent panel"
        data-testid="agent-dock-expand"
        style={{ fontFamily: "var(--font-penguin)" }}
      >
        <PenguinMark size={18} />
        <span className="text-[11px] font-semibold [writing-mode:vertical-rl]">Agent</span>
      </button>
    );
  }

  const recipient = demo.recipient(pack);

  return (
    <aside className="flex w-[380px] shrink-0 flex-col border-l border-[#3b2a7a] bg-white text-ink" style={{ fontFamily: "var(--font-penguin)" }} data-testid="agent-dock" aria-label="Agent workspace">
      <Ext id="agent-workspace" className="shrink-0">
        <header className="flex items-center gap-2 bg-[#1c1340] px-3 py-2.5 text-white">
          <PenguinMark size={20} className="shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-bold leading-tight">Agent</p>
            <p className="truncate text-[11px] text-white/70">{pack.portal.company} · {pack.vertical.name}</p>
          </div>
          {available.length > 0 ? (
            <label className="flex items-center gap-1 text-[11px] text-white/80">
              <span className="sr-only">Model provider</span>
              <select
                value={provider ?? ""}
                onChange={(e) => {
                  const id = e.target.value as AgentProviderId;
                  setPicked(id);
                  dispatch({ t: "agent.provider", id });
                }}
                disabled={busy}
                className="h-7 max-w-[150px] rounded-[6px] border border-white/25 bg-white/10 px-1.5 text-[12px] font-semibold text-white outline-none focus:border-white/60 [&>option]:text-ink"
                data-testid="agent-provider"
              >
                {available.map((id) => {
                  const p = status !== "loading" && status ? status.providers.find((x) => x.id === id) : undefined;
                  return (
                    <option key={id} value={id}>
                      {p?.label ?? id}
                    </option>
                  );
                })}
              </select>
            </label>
          ) : null}
          <button type="button" onClick={() => setCollapsed(true)} className="rounded p-1 text-white/70 hover:bg-white/15 hover:text-white" title="Hide the agent panel" aria-label="Hide the agent panel" data-testid="agent-dock-collapse">
            <Icon name="chevronRight" size={16} />
          </button>
        </header>
      </Ext>

      <Ext id="agent-tool-bridge" className="shrink-0">
        <div className="flex items-center gap-2 border-b border-line-soft bg-penguin-soft/50 px-3 py-1.5 text-[11.5px] text-penguin-strong" data-testid="agent-tool-bridge">
          <Icon name="sync" size={13} className="shrink-0" />
          <span className="min-w-0 flex-1 truncate">
            Tool bridge: <strong data-testid="agent-action-count">{actionCount}</strong> HubSpot action{actionCount === 1 ? "" : "s"} this run
            {providerInfo && !scripted ? <span className="text-penguin-strong/70"> · {providerInfo.model}</span> : null}
          </span>
          {scripted ? (
            <span className="shrink-0 rounded-full border border-[#e9c46a] bg-[#fff8e6] px-2 py-0.5 text-[10.5px] font-semibold text-[#7a5a00]" data-testid="agent-mode-scripted">
              Scripted transcript
            </span>
          ) : (
            <span className="shrink-0 rounded-full border border-[#9fd3b9] bg-[#e8f7ef] px-2 py-0.5 text-[10.5px] font-semibold text-[#0b5b45]" data-testid="agent-mode-live">
              Live
            </span>
          )}
        </div>
      </Ext>

      <div ref={list} className="hs-scroll min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3" data-testid="agent-messages">
        {messages.length === 0 && !busy ? (
          <div className="rounded-[10px] border border-dashed border-line p-3 text-[12.5px] leading-snug text-ink-muted" data-testid="agent-intro">
            <p className="font-semibold text-ink">{demo.title}</p>
            <p className="mt-1">{demo.intro(pack)}</p>
            {scripted ? <p className="mt-2 text-[12px]">{status === null ? "The agent service is unavailable." : "No live model is configured on this portal."} The scripted transcript plays the same tool calls.</p> : null}
          </div>
        ) : null}

        {messages.map((m, i) => {
          if (m.role === "user") {
            return (
              <div key={i} className="flex justify-end" data-testid="agent-msg-user">
                <p className="max-w-[88%] whitespace-pre-wrap rounded-[12px] rounded-br-[4px] bg-[#1c1340] px-3 py-2 text-[13px] leading-snug text-white">{m.text}</p>
              </div>
            );
          }
          if (m.role === "tool") return null;
          const waiting = i === messages.length - 1 && pending.length > 0;
          return (
            <div key={i} className="flex gap-2" data-testid="agent-msg-assistant">
              <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-penguin text-white">
                <PenguinMark size={12} />
              </span>
              <div className="min-w-0 flex-1">
                {m.text.trim() ? <p className="whitespace-pre-wrap rounded-[12px] rounded-tl-[4px] bg-hs-bg px-3 py-2 text-[13px] leading-snug">{m.text}</p> : null}
                {m.toolCalls.length > 0 ? (
                  <ul className="mt-1.5 space-y-1">
                    {m.toolCalls.map((c) => {
                      const r = results.get(c.id);
                      const state = results.has(c.id) ? ((r as { error?: unknown } | null)?.error ? "error" : "ok") : waiting && gated.includes(c.name) ? "waiting" : "pending";
                      return <ToolChip key={c.id} call={c} state={state} result={r} />;
                    })}
                  </ul>
                ) : null}
              </div>
            </div>
          );
        })}

        {busy ? (
          <div className="flex gap-2" data-testid="agent-msg-streaming">
            <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-penguin text-white">
              <PenguinMark size={12} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="whitespace-pre-wrap rounded-[12px] rounded-tl-[4px] bg-hs-bg px-3 py-2 text-[13px] leading-snug">
                {draft.text || <span className="text-ink-muted">Thinking…</span>}
                <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-penguin align-middle" aria-hidden="true" />
              </p>
              {draft.calls.length > 0 ? (
                <ul className="mt-1.5 space-y-1">
                  {draft.calls.map((c) => (
                    <ToolChip key={c.id} call={c} state={draft.done[c.id] ?? "pending"} />
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        ) : null}

        {pending.length > 0 && !busy ? (
          <div className="rounded-[10px] border border-[#e9c46a] bg-[#fff8e6] p-3" data-testid="agent-confirm">
            <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#7a5a00]">
              <Icon name="lock" size={14} /> Waiting for your approval
            </p>
            <p className="mt-1 text-[12.5px] leading-snug text-ink">
              The agent wants to {pending.map((c) => describeConfirm(c)).join(" and ")}
              {recipient ? ` (${recipient})` : ""}. Nothing goes out until you say so.
            </p>
            <div className="mt-2.5 flex gap-2">
              <button type="button" onClick={() => decide(true)} className="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-penguin px-3 text-[12.5px] font-semibold text-white hover:bg-penguin-strong" data-testid="agent-approve">
                <Icon name="check" size={14} /> Approve
              </button>
              <button type="button" onClick={() => decide(false)} className="inline-flex h-8 items-center rounded-[6px] border border-ink bg-white px-3 text-[12.5px] font-semibold hover:bg-[#f5f5f5]" data-testid="agent-decline">
                Not now
              </button>
            </div>
          </div>
        ) : null}

        {notice ? (
          <p className="rounded-[8px] border border-[#e9c46a] bg-[#fff8e6] px-3 py-2 text-[12px] leading-snug text-[#7a5a00]" data-testid="agent-notice">
            {notice}
          </p>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-line-soft p-3">
        {messages.length === 0 && !busy && !scripted ? (
          <button
            type="button"
            onClick={() => send(demo.goal)}
            className="mb-2 w-full rounded-[8px] border border-penguin/40 bg-penguin-soft/50 px-3 py-2 text-left text-[12.5px] leading-snug text-penguin-strong hover:bg-penguin-soft"
            data-testid="agent-suggest"
          >
            <span className="font-semibold">Try: </span>
            {demo.goal}
          </button>
        ) : null}
        {scripted ? (
          <button
            type="button"
            onClick={() => send(null)}
            disabled={busy || turns >= sampleLength || pending.length > 0}
            className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[6px] bg-penguin text-[13px] font-semibold text-white hover:bg-penguin-strong disabled:bg-[#e6e6e6] disabled:text-[#8a8a8a]"
            data-testid="agent-play"
          >
            <Icon name="arrowRight" size={15} /> Play the next turn
          </button>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={2}
              placeholder={busy ? "Working…" : pending.length > 0 ? "Answer above, or tell the agent what to change" : "Tell the agent what to do"}
              disabled={busy}
              className="hs-scroll min-h-[40px] flex-1 resize-none rounded-[8px] border border-line px-3 py-2 text-[13px] leading-snug outline-none focus:border-penguin disabled:bg-hs-bg"
              data-testid="agent-input"
            />
            <button
              type="button"
              onClick={submit}
              disabled={busy || !input.trim()}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-penguin text-white hover:bg-penguin-strong disabled:bg-[#e6e6e6] disabled:text-[#8a8a8a]"
              aria-label="Send"
              data-testid="agent-send"
            >
              <Icon name="send" size={16} />
            </button>
          </div>
        )}
        <p className="mt-2 flex items-center justify-between text-[10.5px] text-ink-muted">
          <span data-testid="agent-usage">{scripted ? "No model calls made" : `${usage.tokens.toLocaleString("en-US")} tokens · ~$${usage.costUsd.toFixed(4)}`}</span>
          <span>Fictional data. Sending always waits for you.</span>
        </p>
      </div>
    </aside>
  );
}
