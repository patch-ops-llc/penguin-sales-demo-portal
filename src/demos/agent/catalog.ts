import type { SampleTurn } from "@/lib/agent/types";
import type { Pack } from "@/verticals/types";
import { guidedQuoteSample } from "./tools";

/**
 * Agent-run demos: a motion the portal already has, driven through the model instead of the Next
 * button. Each entry names the tools the model may call and the scripted walk the mock provider
 * (and the Option C fallback) replays. The browser-side workspace that shows these lands in PR A2.
 */
export type AgentDemoId = "agent-guided-quote";

export type AgentDemo = {
  id: AgentDemoId;
  title: string;
  /** The clicked demo this is the agent version of, for the Penguin end card and the beacon. */
  baseDemo: string;
  /** What the model is asked to accomplish, in the rep's words. Prepended to the first user turn when it is empty. */
  goal: string;
  /** Tool names the model may call in this demo. Anything else is refused server-side. */
  tools: readonly string[];
  /** Hard cap on model calls in one request, so a confused model cannot loop. */
  maxToolRounds: number;
  sample: (pack: Pack) => SampleTurn[];
};

export const AGENT_DEMOS: Record<AgentDemoId, AgentDemo> = {
  "agent-guided-quote": {
    id: "agent-guided-quote",
    title: "Guided quote, agent-run",
    baseDemo: "guided-quote",
    goal: "Draft the quote for this deal from the buyer's discovery answers, check the lead time against the need-by date, create it on the deal, and get it ready to send.",
    tools: [
      "get_deal",
      "get_guided_quote_state",
      "list_products",
      "guided_quote_select",
      "guided_quote_set_quantity",
      "guided_quote_set_need_by",
      "guided_quote_generate",
      "create_quote",
      "get_quote",
      "apply_discount",
      "request_approval",
      "send_quote",
      "log_activity",
    ],
    maxToolRounds: 8,
    sample: guidedQuoteSample,
  },
};

export function getAgentDemo(id: string): AgentDemo | null {
  return (AGENT_DEMOS as Record<string, AgentDemo>)[id] ?? null;
}
