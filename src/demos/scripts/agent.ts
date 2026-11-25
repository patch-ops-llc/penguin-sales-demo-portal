import { answerScripted, scriptedTurn } from "@/demos/agent/scripted";
import { confirmTools } from "@/demos/agent/tools";
import { agentTurns, pendingConfirmation } from "@/store/slices/agent";
import { flag, has, type DemoScript, type StepCtx } from "./types";

const dealPath = ({ pack }: StepCtx) => `/deals/${pack.demos.guidedQuote.dealId}`;
const quotePath = ({ w, pack }: StepCtx) => (w.gq.quoteId ? `/quotes/${w.gq.quoteId}` : dealPath({ w, pack }));
const sent = ({ w }: StepCtx) => w.quotes.some((q) => q.id === w.gq.quoteId && (q.status === "Sent" || q.status === "Accepted"));

/**
 * The guided quote, run by the model instead of the rep's clicks. Each step is one turn of the
 * conversation. The rep can type to the live model in the Agent panel; Next plays the scripted
 * turn through the same tool bridge, so the demo runs the same way with no key at all.
 */
export const agentGuidedQuote: DemoScript = {
  id: "agent-guided-quote",
  steps: [
    {
      id: "brief",
      title: "Brief the agent",
      hint: "Agent panel: send the opening message (or press Next to play it). The agent reads the deal and the discovery questions",
      path: dealPath,
      done: ({ w }) => agentTurns(w) >= 1,
      script: (c, now) => scriptedTurn(c, now),
    },
    {
      id: "discover",
      title: "The agent answers discovery and prices it",
      hint: "Watch the Guided quote tab: each answer and the rate-card run is a tool call landing as a HubSpot action",
      path: dealPath,
      done: ({ w }) => w.gq.lines.length > 0 || w.gq.quoteId !== null,
      script: (c, now) => scriptedTurn(c, now),
    },
    {
      id: "create",
      title: "The agent creates the quote",
      hint: "The quote appears on the deal with the generated lines",
      path: dealPath,
      done: ({ w }) => w.gq.quoteId !== null,
      script: (c, now) => scriptedTurn(c, now),
    },
    {
      id: "ask",
      title: "The agent asks before sending",
      hint: "Nothing reaches the buyer without a click: the send waits for approval in the Agent panel",
      path: dealPath,
      done: (c) => pendingConfirmation(c.w, confirmTools()).length > 0 || sent(c),
      script: (c, now) => scriptedTurn(c, now),
    },
    {
      id: "approve",
      title: "Approve the send",
      hint: "Click Approve in the Agent panel. The quote is published, the deal moves to Quote sent",
      path: dealPath,
      after: quotePath,
      done: sent,
      script: (c, now) => answerScripted(c, true, now),
    },
    {
      id: "deal",
      title: "See it on the deal",
      hint: "Click Exit. Amount, stage, and timeline were all written by the agent through HubSpot's own actions",
      path: quotePath,
      after: dealPath,
      done: (c) => has(c, "gq.dealSeen"),
      script: ({ pack }) => [{ t: "ui", k: `tab.${pack.demos.guidedQuote.dealId}`, v: "activities" }, flag("gq.dealSeen")],
    },
  ],
};
