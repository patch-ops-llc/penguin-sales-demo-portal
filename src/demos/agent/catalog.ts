import type { AgentProviderId, SampleTurn } from "@/lib/agent/types";
import type { Pack } from "@/verticals/types";
import { guidedQuoteSample } from "./tools";

/**
 * Agent-run demos: a motion the portal already has, driven through the model instead of the Next
 * button. Each entry names the tools the model may call and the scripted walk the mock provider
 * (and the Option C fallback) replays. The guided quote runs in the A2 side dock; the headless
 * flows run on the full-stage Claude surface and cut to HubSpot only to show the record that changed.
 */
export type AgentDemoId = "agent-guided-quote" | "agent-campaign" | "agent-deal-follow-up" | "agent-renewal";

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
  /** The provider the surface picks first when more than one is live. */
  defaultProvider?: AgentProviderId;
  /** Verticals whose pack carries this demo's content. Unset means every vertical. */
  verticals?: readonly string[];
  sample: (pack: Pack) => SampleTurn[];
};

const SHARED_WRITE_TOOLS = ["log_email", "create_task", "save_report"] as const;

const flowSample = (id: Exclude<AgentDemoId, "agent-guided-quote">) => (pack: Pack): SampleTurn[] => pack.demos.flows?.flows[id]?.turns ?? [];

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
  "agent-campaign": {
    id: "agent-campaign",
    title: "Campaign from Claude",
    baseDemo: "marketing-studio",
    goal: "Find what worked, then build, draft, schedule, and measure a campaign to engaged mid-market SaaS contacts.",
    tools: ["get_campaign_attribution", "create_segment", "create_campaign", "add_asset", "schedule_email", "get_campaign_performance", "save_report"],
    maxToolRounds: 6,
    defaultProvider: "anthropic",
    verticals: ["saas"],
    sample: flowSample("agent-campaign"),
  },
  "agent-deal-follow-up": {
    id: "agent-deal-follow-up",
    title: "Deal follow-up from Claude",
    baseDemo: "guided-quote",
    goal: "Work today's most important deal: brief me, follow up with the champion, keep the deal record current, and report the pipeline.",
    tools: ["get_focus_list", "get_deal_brief", "update_deal", "get_pipeline_by_stage", ...SHARED_WRITE_TOOLS],
    maxToolRounds: 6,
    defaultProvider: "anthropic",
    verticals: ["saas"],
    sample: flowSample("agent-deal-follow-up"),
  },
  "agent-renewal": {
    id: "agent-renewal",
    title: "Renewal from Claude",
    baseDemo: "renewal-churn-risk",
    goal: "Find the renewals at risk, reach out to the nearest one, resolve what the customer reports as a Service Hub ticket, and report risk by month.",
    tools: ["get_renewals_at_risk", "get_account_brief", "add_note", "create_ticket", "search_past_tickets", "reply_on_ticket", "close_ticket", "get_renewal_risk_breakdown", ...SHARED_WRITE_TOOLS],
    maxToolRounds: 6,
    defaultProvider: "anthropic",
    verticals: ["saas"],
    sample: flowSample("agent-renewal"),
  },
};

export function getAgentDemo(id: string): AgentDemo | null {
  return (AGENT_DEMOS as Record<string, AgentDemo>)[id] ?? null;
}

/** Whether a sample is a headless flow: turns opened by the person's own message rather than the demo goal. */
export function isFlowSample(sample: readonly SampleTurn[]): boolean {
  return sample.some((t) => typeof t.user === "string");
}

/**
 * Which sample turn comes next. Guided-quote samples advance one per assistant message; flow
 * samples advance one per message from the person, so a closing line after the tools ran does not
 * skip ahead.
 */
export function sampleIndex(sample: readonly SampleTurn[], messages: readonly { role: string }[]): number {
  return isFlowSample(sample) ? messages.filter((m) => m.role === "user").length : messages.filter((m) => m.role === "assistant").length;
}
