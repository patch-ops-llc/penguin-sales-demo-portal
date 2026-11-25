import { readSse } from "@/lib/agent/sse";
import type { AgentMessage, AgentProviderId, ToolCall } from "@/lib/agent/types";
import type { Action } from "@/store/world";

/** What /api/agent/status reports. Ids, labels, and model names only. */
export type AgentStatus = {
  live: boolean;
  providers: { id: AgentProviderId; label: string; model: string }[];
  demos: { id: string; title: string; baseDemo: string }[];
  limits: { sessionMaxTurns: number; userTurnsPerMinute: number };
};

export async function fetchAgentStatus(): Promise<AgentStatus | null> {
  try {
    const response = await fetch("/api/agent/status", { credentials: "same-origin" });
    if (!response.ok) return null;
    return (await response.json()) as AgentStatus;
  } catch {
    return null;
  }
}

/** The events the turn route streams, as the panel consumes them. */
export type TurnEvent =
  | { event: "text_delta"; data: { text: string } }
  | { event: "tool_call"; data: { call: ToolCall } }
  | { event: "tool_result"; data: { id: string; name: string; result: unknown; error?: string; actions: Action[] } }
  | { event: "confirm"; data: { calls: ToolCall[] } }
  | { event: "message"; data: { message: AgentMessage } }
  | { event: "usage"; data: { provider: AgentProviderId; model: string; round: number; inputTokens: number; outputTokens: number; cachedInputTokens: number; costUsd: number } }
  | { event: "done"; data: { reason: "end" | "confirm" | "max_tokens" | "loop_cap" | "error" } }
  | { event: "error"; data: { error: string; message: string; fallback: "scripted" } };

export type TurnRequest = {
  provider: AgentProviderId;
  demo: string;
  vertical: string;
  messages: AgentMessage[];
  actions: Action[];
  approve?: Record<string, boolean>;
  signal?: AbortSignal;
};

export class TurnRefused extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

/** Streams one turn. Throws TurnRefused when the server answers with JSON instead of a stream. */
export async function* streamTurn(request: TurnRequest): AsyncGenerator<TurnEvent> {
  const { signal, ...body } = request;
  const response = await fetch("/api/agent/turn", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...body, now: Date.now() }),
    signal,
  });
  if (!response.ok || !response.body) {
    let code = "request_failed";
    let message = `The agent request failed (${response.status}).`;
    try {
      const json = (await response.json()) as { error?: string; message?: string };
      code = json.error ?? code;
      message = json.message ?? message;
    } catch {
      // No JSON body: the status is all we know.
    }
    throw new TurnRefused(response.status, code, message);
  }
  for await (const record of readSse(response.body)) {
    try {
      yield { event: record.event ?? "message", data: JSON.parse(record.data) } as TurnEvent;
    } catch {
      // A malformed record is skipped; the stream's `done` still arrives.
    }
  }
}
