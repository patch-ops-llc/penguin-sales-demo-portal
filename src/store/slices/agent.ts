import type { AgentMessage, AgentProviderId, ToolCall } from "@/lib/agent/types";
import type { Action, World } from "./types";

/**
 * The agent transcript lives in the world like everything else the rep changes, so Reset drops it,
 * Back truncates it, and a reload replays it. The server never keeps it: each turn sends it back.
 */
export type AgentState = {
  messages: AgentMessage[];
  /** The provider the rep picked for this run, or null before the first turn. */
  provider: AgentProviderId | null;
  /** Set when a live turn could not run and the scripted transcript took over. */
  fallback: string | null;
};

export type AgentAction =
  | { t: "agent.message"; message: AgentMessage }
  | { t: "agent.provider"; id: AgentProviderId }
  | { t: "agent.fallback"; reason: string };

export function seedAgent(): AgentState {
  return { messages: [], provider: null, fallback: null };
}

export function isAgentAction(a: Action): a is AgentAction {
  return a.t.startsWith("agent.");
}

export function applyAgent(w: World, a: AgentAction): void {
  switch (a.t) {
    case "agent.message":
      w.ag.messages.push(a.message);
      return;
    case "agent.provider":
      w.ag.provider = a.id;
      return;
    case "agent.fallback":
      w.ag.fallback = a.reason;
      return;
  }
}

/** Number of model turns so far: the index of the next sample turn. */
export function agentTurns(w: Pick<World, "ag">): number {
  return w.ag.messages.filter((m) => m.role === "assistant").length;
}

/** Number of messages the person has sent: the index of the next flow turn. */
export function askedTurns(w: Pick<World, "ag">): number {
  return w.ag.messages.filter((m) => m.role === "user").length;
}

/** Tool calls the model made that still wait on the rep's answer: the last message is the model's and no results followed. */
export function pendingConfirmation(w: Pick<World, "ag">, confirmTools: readonly string[]): ToolCall[] {
  const last = w.ag.messages[w.ag.messages.length - 1];
  if (!last || last.role !== "assistant") return [];
  return last.toolCalls.filter((c) => confirmTools.includes(c.name));
}
