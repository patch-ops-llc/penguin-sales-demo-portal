import "server-only";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import type { AgentMessage, AgentProviderId } from "./types";

export type LimitCheck = { ok: true } | { ok: false; code: "rate_limited" | "run_cap" | "budget_exhausted"; message: string };

/** Per-user sliding window, same shape as the sign-in throttle. Resets with the process, which is fine for a cap this soft. */
const recentTurns = new Map<string, number[]>();

export function checkUserRate(userId: string, now = Date.now()): LimitCheck {
  const limit = env.agentUserTurnsPerMinute;
  const window = 60_000;
  const times = (recentTurns.get(userId) ?? []).filter((t) => now - t < window);
  if (times.length >= limit) {
    recentTurns.set(userId, times);
    return { ok: false, code: "rate_limited", message: `Limit of ${limit} agent turns per minute reached. Wait a moment and try again.` };
  }
  times.push(now);
  recentTurns.set(userId, times);
  if (recentTurns.size > 5000) {
    for (const [key, value] of recentTurns) if (value.every((t) => now - t >= window)) recentTurns.delete(key);
  }
  return { ok: true };
}

/** How many turns this user can still start in the current window, for the status route. Does not record a turn. */
export function userTurnsLeft(userId: string, now = Date.now()): number {
  const times = (recentTurns.get(userId) ?? []).filter((t) => now - t < 60_000);
  return Math.max(0, env.agentUserTurnsPerMinute - times.length);
}

/** A single demo run may not loop forever: the number of model turns already in the history is the counter. */
export function checkRunCap(messages: AgentMessage[]): LimitCheck {
  const limit = env.agentSessionMaxTurns;
  const turns = messages.filter((m) => m.role === "assistant").length;
  if (turns >= limit) {
    return { ok: false, code: "run_cap", message: `This run reached its cap of ${limit} agent turns. Reset the demo to start a fresh run.` };
  }
  return { ok: true };
}

/** Spend recorded since the process started, so a burst of parallel turns cannot slip under the database total. */
const sessionSpend = new Map<string, { day: string; usd: number }>();

function utcDay(now: Date): string {
  return now.toISOString().slice(0, 10);
}

export function recordSpend(provider: AgentProviderId, usd: number, now = new Date()): void {
  const day = utcDay(now);
  const current = sessionSpend.get(provider);
  if (!current || current.day !== day) sessionSpend.set(provider, { day, usd });
  else current.usd += usd;
}

/** Today's spend for a provider, from the agent_turn rows written by the route. Never throws. */
export async function spentTodayUsd(provider: AgentProviderId, now = new Date()): Promise<number> {
  const start = new Date(`${utcDay(now)}T00:00:00.000Z`);
  let fromDb = 0;
  try {
    const rows = await db.accessEvent.findMany({ where: { type: "agent_turn", at: { gte: start } }, select: { meta: true } });
    for (const row of rows) {
      const meta = row.meta as { provider?: string; costUsd?: number } | null;
      if (meta?.provider === provider && typeof meta.costUsd === "number") fromDb += meta.costUsd;
    }
  } catch (error) {
    console.error("[agent] Failed to read today's spend:", error);
  }
  const local = sessionSpend.get(provider);
  const inMemory = local && local.day === utcDay(now) ? local.usd : 0;
  return Math.max(fromDb, inMemory);
}

export async function checkDailyBudget(provider: AgentProviderId, now = new Date()): Promise<LimitCheck> {
  if (provider === "mock") return { ok: true };
  const spent = await spentTodayUsd(provider, now);
  if (spent >= env.agentDailyBudgetUsd) {
    return {
      ok: false,
      code: "budget_exhausted",
      message: `Today's live-agent budget for this provider is used up. The demo continues in scripted mode.`,
    };
  }
  return { ok: true };
}
