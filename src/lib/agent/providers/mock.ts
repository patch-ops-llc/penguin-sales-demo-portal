import type { AgentEvent, AgentMessage, CompleteRequest, Provider, SampleTurn } from "../types";

/**
 * Deterministic provider for CI and local work. It never touches the network: it replays the demo's
 * sample turns through the same streaming path a real vendor would, so the route, the event protocol,
 * the caps, and the tool mapping are all exercised without a key or any spend.
 */
export function mockProvider(): Provider {
  return {
    id: "mock",
    async *complete(request: CompleteRequest): AsyncIterable<AgentEvent> {
      const step = pick(request.sample ?? [], request.messages);
      const allowed = new Set(request.tools.map((t) => t.name));

      // Text arrives in a few pieces, as it would from a vendor.
      for (const piece of step.text.match(/.{1,24}(\s|$)/g) ?? [step.text]) {
        yield { type: "text_delta", text: piece };
      }
      let n = 0;
      const turn = request.messages.filter((m) => m.role === "assistant").length;
      for (const call of step.toolCalls ?? []) {
        if (!allowed.has(call.name)) continue;
        n += 1;
        yield { type: "tool_call", call: { id: `mock-${turn}-${n}`, name: call.name, args: call.args } };
      }
      const inputTokens = Math.round(JSON.stringify(request.messages).length / 4) + Math.round(request.system.length / 4);
      const outputTokens = Math.round(step.text.length / 4) + 24 * n;
      yield { type: "usage", usage: { inputTokens, outputTokens, cachedInputTokens: 0 } };
      yield { type: "done", stopReason: n > 0 ? "tool_use" : "end" };
    },
  };
}

const END: SampleTurn = { text: "That completes the sample run." };

/**
 * Guided-quote samples advance one turn per assistant message. Flow samples (turns that carry the
 * person's own message) advance per user message, and once a turn's tools have run the mock
 * answers with the turn's closing line instead of skipping ahead to a question nobody asked.
 */
function pick(sample: SampleTurn[], messages: AgentMessage[]): SampleTurn {
  if (!sample.some((t) => typeof t.user === "string")) return sample[messages.filter((m) => m.role === "assistant").length] ?? END;
  let lastUser = -1;
  for (let i = 0; i < messages.length; i++) if (messages[i].role === "user") lastUser = i;
  const turn = messages.filter((m) => m.role === "user").length - 1;
  const step = sample[turn];
  if (!step) return END;
  const since = messages.slice(lastUser + 1);
  if (!since.some((m) => m.role === "assistant")) return step;
  const declined = since.some((m) => m.role === "tool" && m.results.some((r) => Boolean((r.result as { declined?: unknown } | null)?.declined)));
  return { text: declined ? "Understood. Nothing was changed in HubSpot. Tell me what to adjust." : (step.done ?? "Done.") };
}
