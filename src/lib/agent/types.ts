// Vendor-neutral shapes for agent demos. The browser and every provider adapter speak these,
// so switching between Claude and OpenAI (and xAI later) changes nothing outside the adapter.

export type AgentProviderId = "anthropic" | "openai" | "xai" | "mock";

/** A tool the model may call: a name, a description, and a JSON Schema for its arguments. */
export type ToolDef = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  /** Send-class tools: the browser asks the rep to approve before the action is dispatched. */
  confirm?: boolean;
};

export type ToolCall = { id: string; name: string; args: Record<string, unknown> };
export type ToolResult = { id: string; name: string; result: unknown };

/**
 * Vendor-specific content a provider needs echoed back on later turns (Claude thinking blocks with
 * their signatures, OpenAI encrypted reasoning items). Opaque to us; replayed only to the same provider.
 */
export type Opaque = { provider: AgentProviderId; data: unknown };

export type AgentMessage =
  | { role: "user"; text: string }
  | { role: "assistant"; text: string; toolCalls: ToolCall[]; opaque?: Opaque }
  | { role: "tool"; results: ToolResult[] };

export type Usage = { inputTokens: number; outputTokens: number; cachedInputTokens: number };

/** What a provider streams back, normalized. The route re-emits these as server-sent events. */
export type AgentEvent =
  | { type: "text_delta"; text: string }
  | { type: "tool_call"; call: ToolCall }
  | { type: "usage"; usage: Usage }
  | { type: "opaque"; opaque: Opaque }
  | { type: "done"; stopReason: "end" | "tool_use" | "max_tokens" | "other" }
  | { type: "error"; message: string };

/** One prepared assistant turn for sample mode: what the scripted assistant says and which tools it calls. */
export type SampleTurn = {
  /** The message that opens this turn, when the person starts it. Omitted when the turn continues after an approval. */
  user?: string;
  text: string;
  toolCalls?: { name: string; args: Record<string, unknown> }[];
  /** What the assistant says once this turn's tools have run (flows only). */
  done?: string;
};

export type CompleteRequest = {
  model: string;
  system: string;
  messages: AgentMessage[];
  tools: ToolDef[];
  maxTokens: number;
  signal: AbortSignal;
  /** Used only by the mock provider, which replays these instead of calling a vendor. */
  sample?: SampleTurn[];
};

export type Provider = {
  id: AgentProviderId;
  complete(request: CompleteRequest): AsyncIterable<AgentEvent>;
};
