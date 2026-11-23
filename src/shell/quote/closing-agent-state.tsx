"use client";

import { useShell } from "@/store/store";
import { labelsOf } from "@/verticals/labels";
import type { Quote } from "@/verticals/types";
import { initials } from "../format";
import { useQuoteSettings } from "./settings";

export const CLOSING_AGENT_BRAND = "#33475b";

const names = (stored: string): string[] => JSON.parse(stored) as string[];

/**
 * The closing agent's settings for one quote: whether it is on, and the quote-specific knowledge files.
 * `library` is the pack's sample files; a file a rep picked from their device is kept by name only.
 */
export function useClosingAgent(quote: Pick<Quote, "id">) {
  const { pack } = useShell();
  const s = useQuoteSettings(quote);
  const library = labelsOf(pack).pack.agent.files;
  const added = names(s.get("agent.files", "[]"));
  return {
    on: s.get("agent", "1") === "1",
    setOn: (on: boolean) => s.set("agent", on ? "1" : "0"),
    library,
    added,
    setAdded: (next: string[]) => s.set("agent.files", JSON.stringify(next)),
    /** The files the knowledge score was last worked out from. */
    scored: names(s.get("agent.scored", "[]")),
    setScored: (next: string[]) => s.set("agent.scored", JSON.stringify(next)),
  };
}

export function AgentAvatar({ name, size, online }: { name: string; size: number; online?: boolean }) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-full bg-white font-bold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        color: CLOSING_AGENT_BRAND,
        boxShadow: `0 0 0 2px ${CLOSING_AGENT_BRAND}`,
      }}
      aria-hidden="true"
    >
      {initials(name)}
      {online ? <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#00bda5]" /> : null}
    </span>
  );
}
