import "server-only";
import { readSse, safeErrorText } from "../sse";
import type { AgentEvent, AgentMessage, CompleteRequest, Provider, ToolCall } from "../types";

const URL = "https://api.openai.com/v1/responses";

type Item = Record<string, unknown>;

/** Rebuilds the conversation as Responses API input items. Tool results are `function_call_output` items. */
function toInput(messages: AgentMessage[]): Item[] {
  const out: Item[] = [];
  for (const m of messages) {
    if (m.role === "user") {
      out.push({ role: "user", content: m.text });
    } else if (m.role === "assistant") {
      // Stateless mode: the model's own output items (including encrypted reasoning) are replayed verbatim.
      if (m.opaque?.provider === "openai" && Array.isArray(m.opaque.data) && m.opaque.data.length > 0) {
        out.push(...(m.opaque.data as Item[]));
        continue;
      }
      if (m.text.trim()) out.push({ type: "message", role: "assistant", content: [{ type: "output_text", text: m.text }] });
      for (const call of m.toolCalls) out.push({ type: "function_call", call_id: call.id, name: call.name, arguments: JSON.stringify(call.args) });
    } else {
      for (const r of m.results) out.push({ type: "function_call_output", call_id: r.id, output: JSON.stringify(r.result ?? null) });
    }
  }
  return out;
}

export function openaiProvider(apiKey: string): Provider {
  return {
    id: "openai",
    async *complete(request: CompleteRequest): AsyncIterable<AgentEvent> {
      const body = {
        model: request.model,
        instructions: request.system,
        input: toInput(request.messages),
        tools: request.tools.map((t) => ({ type: "function", name: t.name, description: t.description, parameters: t.parameters, strict: false })),
        max_output_tokens: request.maxTokens,
        // Nothing is kept on the vendor's side between turns; reasoning comes back encrypted and is echoed next turn.
        store: false,
        reasoning: { effort: "low" },
        stream: true,
      };

      const response = await fetch(URL, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
        signal: request.signal,
      });
      if (!response.ok || !response.body) {
        const text = await response.text().catch(() => "");
        yield { type: "error", message: `OpenAI ${response.status}: ${safeErrorText(text)}` };
        return;
      }

      const items: Item[] = [];
      const pending = new Map<string, { callId: string; name: string; args: string }>();
      let usage = { inputTokens: 0, outputTokens: 0, cachedInputTokens: 0 };
      let stopReason: "end" | "tool_use" | "max_tokens" | "other" = "end";
      let sawToolCall = false;

      for await (const record of readSse(response.body)) {
        let data: Record<string, unknown>;
        try {
          data = JSON.parse(record.data);
        } catch {
          continue;
        }
        const type = String(data.type ?? record.event ?? "");
        switch (type) {
          case "response.output_text.delta": {
            const text = String(data.delta ?? "");
            if (text) yield { type: "text_delta", text };
            break;
          }
          case "response.output_item.added": {
            const item = data.item as Item | undefined;
            if (item?.type === "function_call") {
              pending.set(String(item.id), { callId: String(item.call_id), name: String(item.name), args: "" });
            }
            break;
          }
          case "response.function_call_arguments.delta": {
            const entry = pending.get(String(data.item_id));
            if (entry) entry.args += String(data.delta ?? "");
            break;
          }
          case "response.output_item.done": {
            const item = data.item as Item | undefined;
            if (!item) break;
            items.push(item);
            if (item.type === "function_call") {
              const entry = pending.get(String(item.id));
              const raw = typeof item.arguments === "string" && item.arguments ? item.arguments : (entry?.args ?? "{}");
              let args: Record<string, unknown> = {};
              try {
                args = JSON.parse(raw) as Record<string, unknown>;
              } catch {
                args = {};
              }
              const call: ToolCall = { id: String(item.call_id), name: String(item.name), args };
              sawToolCall = true;
              yield { type: "tool_call", call };
            }
            break;
          }
          case "response.completed": {
            const res = data.response as { usage?: Record<string, unknown>; status?: string; incomplete_details?: { reason?: string } } | undefined;
            const u = res?.usage ?? {};
            usage = {
              inputTokens: Number(u.input_tokens ?? 0),
              outputTokens: Number(u.output_tokens ?? 0),
              cachedInputTokens: Number((u.input_tokens_details as { cached_tokens?: number } | undefined)?.cached_tokens ?? 0),
            };
            break;
          }
          case "response.incomplete": {
            const res = data.response as { incomplete_details?: { reason?: string } } | undefined;
            stopReason = res?.incomplete_details?.reason === "max_output_tokens" ? "max_tokens" : "other";
            break;
          }
          case "response.failed":
          case "error": {
            const err = (data.response as { error?: { message?: string } } | undefined)?.error ?? (data.error as { message?: string } | undefined) ?? data;
            yield { type: "error", message: `OpenAI: ${safeErrorText(String((err as { message?: string }).message ?? "stream error"))}` };
            return;
          }
          default:
            break;
        }
      }

      if (sawToolCall && stopReason === "end") stopReason = "tool_use";
      yield { type: "usage", usage };
      yield { type: "opaque", opaque: { provider: "openai", data: items } };
      yield { type: "done", stopReason };
    },
  };
}
