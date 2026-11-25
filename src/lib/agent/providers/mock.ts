import type { AgentEvent, CompleteRequest, Provider } from "../types";

/**
 * Deterministic provider for CI and local work. It never touches the network: it replays the demo's
 * sample turns through the same streaming path a real vendor would, so the route, the event protocol,
 * the caps, and the tool mapping are all exercised without a key or any spend.
 */
export function mockProvider(): Provider {
  return {
    id: "mock",
    async *complete(request: CompleteRequest): AsyncIterable<AgentEvent> {
      const turn = request.messages.filter((m) => m.role === "assistant").length;
      const sample = request.sample ?? [];
      const step = sample[turn] ?? { text: "That completes the sample run." };
      const allowed = new Set(request.tools.map((t) => t.name));

      // Text arrives in a few pieces, as it would from a vendor.
      for (const piece of step.text.match(/.{1,24}(\s|$)/g) ?? [step.text]) {
        yield { type: "text_delta", text: piece };
      }
      let n = 0;
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
