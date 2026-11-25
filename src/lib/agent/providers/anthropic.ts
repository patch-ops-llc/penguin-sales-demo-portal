import "server-only";
import { readSse, safeErrorText } from "../sse";
import type { AgentEvent, AgentMessage, CompleteRequest, Provider, ToolCall } from "../types";

const URL = "https://api.anthropic.com/v1/messages";
const VERSION = "2023-06-01";

type Block = Record<string, unknown>;

/** Rebuilds the conversation in Anthropic's shape. Tool results travel as user content blocks. */
function toMessages(messages: AgentMessage[]): { role: "user" | "assistant"; content: unknown }[] {
  const out: { role: "user" | "assistant"; content: unknown }[] = [];
  for (const m of messages) {
    if (m.role === "user") {
      out.push({ role: "user", content: m.text });
    } else if (m.role === "assistant") {
      if (m.opaque?.provider === "anthropic" && Array.isArray(m.opaque.data) && m.opaque.data.length > 0) {
        out.push({ role: "assistant", content: m.opaque.data });
        continue;
      }
      const blocks: Block[] = [];
      if (m.text.trim()) blocks.push({ type: "text", text: m.text });
      for (const call of m.toolCalls) blocks.push({ type: "tool_use", id: call.id, name: call.name, input: call.args });
      if (blocks.length > 0) out.push({ role: "assistant", content: blocks });
    } else {
      out.push({
        role: "user",
        content: m.results.map((r) => ({ type: "tool_result", tool_use_id: r.id, content: JSON.stringify(r.result ?? null) })),
      });
    }
  }
  return out;
}

export function anthropicProvider(apiKey: string): Provider {
  return {
    id: "anthropic",
    async *complete(request: CompleteRequest): AsyncIterable<AgentEvent> {
      const tools = request.tools.map((t, i) => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters,
        // The tool list is the same on every turn, so it is cached along with the system prompt.
        ...(i === request.tools.length - 1 ? { cache_control: { type: "ephemeral" } } : {}),
      }));
      const body = {
        model: request.model,
        max_tokens: request.maxTokens,
        system: [{ type: "text", text: request.system, cache_control: { type: "ephemeral" } }],
        tools,
        messages: toMessages(request.messages),
        stream: true,
      };

      const response = await fetch(URL, {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": VERSION },
        body: JSON.stringify(body),
        signal: request.signal,
      });
      if (!response.ok || !response.body) {
        const text = await response.text().catch(() => "");
        yield { type: "error", message: `Anthropic ${response.status}: ${safeErrorText(text)}` };
        return;
      }

      // Every content block is kept verbatim so thinking blocks and their signatures can be echoed back next turn.
      const blocks: Block[] = [];
      const partialJson: Record<number, string> = {};
      let inputTokens = 0;
      let cachedInputTokens = 0;
      let outputTokens = 0;
      let stopReason: "end" | "tool_use" | "max_tokens" | "other" = "other";

      for await (const record of readSse(response.body)) {
        let data: Record<string, unknown>;
        try {
          data = JSON.parse(record.data);
        } catch {
          continue;
        }
        const type = (record.event ?? data.type) as string;
        switch (type) {
          case "message_start": {
            const usage = (data.message as { usage?: Record<string, number> } | undefined)?.usage ?? {};
            // Anthropic reports uncached, cache-read and cache-write tokens separately; we keep the total plus the cached part.
            cachedInputTokens = usage.cache_read_input_tokens ?? 0;
            inputTokens = (usage.input_tokens ?? 0) + cachedInputTokens + (usage.cache_creation_input_tokens ?? 0);
            break;
          }
          case "content_block_start": {
            const index = data.index as number;
            const block = { ...(data.content_block as Block) };
            if (block.type === "tool_use") partialJson[index] = "";
            if (block.type === "text") block.text = "";
            blocks[index] = block;
            break;
          }
          case "content_block_delta": {
            const index = data.index as number;
            const delta = data.delta as Block;
            const block = blocks[index];
            if (!block) break;
            if (delta.type === "text_delta") {
              const text = String(delta.text ?? "");
              block.text = `${block.text ?? ""}${text}`;
              yield { type: "text_delta", text };
            } else if (delta.type === "input_json_delta") {
              partialJson[index] = `${partialJson[index] ?? ""}${String(delta.partial_json ?? "")}`;
            } else if (delta.type === "thinking_delta") {
              block.thinking = `${block.thinking ?? ""}${String(delta.thinking ?? "")}`;
            } else if (delta.type === "signature_delta") {
              block.signature = `${block.signature ?? ""}${String(delta.signature ?? "")}`;
            }
            break;
          }
          case "content_block_stop": {
            const index = data.index as number;
            const block = blocks[index];
            if (block?.type === "tool_use") {
              let args: Record<string, unknown> = {};
              try {
                args = partialJson[index] ? (JSON.parse(partialJson[index]) as Record<string, unknown>) : {};
              } catch {
                args = {};
              }
              block.input = args;
              const call: ToolCall = { id: String(block.id), name: String(block.name), args };
              yield { type: "tool_call", call };
            }
            break;
          }
          case "message_delta": {
            const reason = (data.delta as Block | undefined)?.stop_reason;
            stopReason = reason === "end_turn" ? "end" : reason === "tool_use" ? "tool_use" : reason === "max_tokens" ? "max_tokens" : "other";
            outputTokens = ((data.usage as Record<string, number> | undefined)?.output_tokens ?? outputTokens) || outputTokens;
            break;
          }
          case "error": {
            const message = (data.error as { message?: string } | undefined)?.message ?? "stream error";
            yield { type: "error", message: `Anthropic: ${safeErrorText(message)}` };
            return;
          }
          default:
            break;
        }
      }

      yield { type: "usage", usage: { inputTokens, outputTokens, cachedInputTokens } };
      // An empty text block is rejected when echoed back, so it is dropped from what we keep.
      const kept = blocks.filter((b) => b && !(b.type === "text" && !String(b.text ?? "").trim()));
      yield { type: "opaque", opaque: { provider: "anthropic", data: kept } };
      yield { type: "done", stopReason };
    },
  };
}
