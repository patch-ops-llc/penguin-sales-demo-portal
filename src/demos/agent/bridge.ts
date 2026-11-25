import type { Action, World } from "@/store/slices/types";
import { mutate } from "@/store/world";
import type { Pack } from "@/verticals/types";

/**
 * Shared shapes for every tool set. A tool here is its name, whether the rep confirms it, and a
 * handler over the store; the text the model reads lives server-side in `@/lib/agent/tool-docs`.
 */
export type ToolContext = { w: World; pack: Pack; now: number };
export type ToolOutcome = { actions: Action[]; result: unknown; error?: string };
export type ToolHandler = (args: Record<string, unknown>, ctx: ToolContext) => ToolOutcome;
export type ToolSpec = { name: string; confirm?: boolean; run: ToolHandler };

export const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
export const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() && Number.isFinite(Number(v)) ? Number(v) : null);
export const strList = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").map((x) => x.trim()).filter(Boolean) : []);

export const fail = (error: string): ToolOutcome => ({ actions: [], result: null, error });
export const ok = (result: unknown): ToolOutcome => ({ actions: [], result });

/** Applies the actions to the caller's copy of the world, then reads the result from the new state. */
export function apply(actions: Action[], w: World, pack: Pack, read: () => unknown): ToolOutcome {
  for (const a of actions) mutate(w, a, pack);
  return { actions, result: read() };
}

export function personaName(pack: Pack, id: string | undefined | null, fallback = "the owner"): string {
  return pack.personas.find((p) => p.id === id)?.name ?? fallback;
}
