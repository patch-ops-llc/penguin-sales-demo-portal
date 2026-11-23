"use client";

import type { Quote } from "@/verticals/types";
import { Icon } from "../icons";
import { cx } from "../ui";
import { useClosingAgent } from "./closing-agent-state";

/** "Closing agent is on" in the editor's header. It opens the agent's panel for this quote. */
export function ClosingAgentStatus({ quote, onClick, open }: { quote: Quote; onClick: () => void; open: boolean }) {
  const { on } = useClosingAgent(quote);
  return (
    <button type="button" onClick={onClick} aria-expanded={open} className={cx("inline-flex h-8 items-center gap-1.5 rounded-[4px] px-2 hover:bg-[#f0f0f0]", on ? "text-ink" : "text-ink-muted")} data-testid="closing-agent-status">
      <Icon name="star4" size={14} /> Closing agent is {on ? "on" : "off"}
    </button>
  );
}
