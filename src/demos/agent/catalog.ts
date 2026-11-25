import type { AgentProviderId, SampleTurn } from "@/lib/agent/types";
import type { Pack } from "@/verticals/types";
import { complaintSample, loanSample } from "./fintech-tools";
import { AGENT_BASE_DEMO, type AgentDemoId } from "./ids";
import { guidedQuoteSample } from "./tools";

export { AGENT_BASE_DEMO, baseDemoOf, isAgentDemo, type AgentDemoId } from "./ids";

/**
 * Agent-run demos: a motion the portal already has, driven through the model instead of the Next
 * button. Each entry names the tools the model may call and the scripted walk the mock provider
 * (and the Option C fallback) replays.
 */
export type AgentDemo = {
  id: AgentDemoId;
  title: string;
  /** The clicked demo this is the agent version of, for the Penguin end card and the beacon. */
  baseDemo: string;
  /** The provider the panel starts on when it is enabled; the rep can pick any other that is on. */
  defaultProvider: AgentProviderId;
  /** What the model is asked to accomplish, in the rep's words. Prepended to the first user turn when it is empty. */
  goal: string;
  /** The panel's opening line before the first turn. */
  intro: (pack: Pack) => string;
  /** The person on the other end of the confirmed step, named on the approval card. */
  recipient: (pack: Pack) => string | null;
  /** What the scripted agent says when the rep declines the confirmed step. */
  declineText: string;
  /** Tool names the model may call in this demo. Anything else is refused server-side. */
  tools: readonly string[];
  /** Hard cap on model calls in one request, so a confused model cannot loop. */
  maxToolRounds: number;
  sample: (pack: Pack) => SampleTurn[];
};

const fullName = (c: { firstName: string; lastName: string } | undefined) => (c ? `${c.firstName} ${c.lastName}` : null);

export const AGENT_DEMOS: Record<AgentDemoId, AgentDemo> = {
  "agent-guided-quote": {
    id: "agent-guided-quote",
    title: "Guided quote, agent-run",
    baseDemo: AGENT_BASE_DEMO["agent-guided-quote"],
    defaultProvider: "anthropic",
    goal: "Draft the quote for this deal from the buyer's discovery answers, check the lead time against the need-by date, create it on the deal, and get it ready to send.",
    intro: (pack) => {
      const contact = pack.contacts.find((c) => c.id === pack.demos.guidedQuote.contactId);
      return `Brief the agent and watch it work the deal through HubSpot's own actions. It reads the record, answers the discovery questions, prices the quote from the rate card, and asks before anything goes to ${contact ? contact.firstName : "the buyer"}.`;
    },
    recipient: (pack) => fullName(pack.contacts.find((c) => c.id === pack.demos.guidedQuote.contactId)),
    declineText: "Understood. The quote stays in draft on the deal. Tell me when you want it sent.",
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
  "agent-complaint-sla": {
    id: "agent-complaint-sla",
    title: "Complaint to SLA ticket, agent-run",
    baseDemo: AGENT_BASE_DEMO["agent-complaint-sla"],
    defaultProvider: "openai",
    goal: "Work the new complaint end to end: ingest it so the ticket opens with its SLA and the 24-hour acknowledgement goes out, escalate it if the SLA is overdue, send the formal resolution letter, and close the ticket with the root cause on the record.",
    intro: (pack) => {
      const cfg = pack.demos.tickets?.["complaint-sla"];
      const contact = pack.contacts.find((c) => c.id === cfg?.ticket.contactId);
      return `Brief the agent and watch it run the complaint through Service Hub's own actions. It reads the complaint, opens the ticket with its SLA, escalates under the overdue rule, and asks before the resolution letter reaches ${contact ? contact.firstName : "the complainant"}.`;
    },
    recipient: (pack) => fullName(pack.contacts.find((c) => c.id === pack.demos.tickets?.["complaint-sla"]?.ticket.contactId)),
    declineText: "Understood. The resolution letter stays as a draft on the ticket and the SLA clock keeps running. Tell me when to send it.",
    tools: ["get_complaint", "ingest_complaint", "open_ticket", "escalate_ticket", "send_resolution_letter", "resolve_ticket"],
    maxToolRounds: 8,
    sample: complaintSample,
  },
  "agent-loan-pipeline": {
    id: "agent-loan-pipeline",
    title: "Loan application pipeline, agent-run",
    baseDemo: AGENT_BASE_DEMO["agent-loan-pipeline"],
    defaultProvider: "anthropic",
    goal: "Take the new loan application through origination: open it in the pipeline, confirm the LOS checklist and flag the missing documents, start the borrower reminder sequence, then record the uploads and verify the funded deal.",
    intro: (pack) => {
      const rec = pack.demos.intake?.["loan-application-pipeline"]?.createdRecords;
      return `Brief the agent and watch it move the application through HubSpot's own actions. It reads the portal submission and the LOS packet, opens the deal, confirms the checklist, and asks before any reminder reaches ${rec ? rec.contactFirstName : "the borrower"}.`;
    },
    recipient: (pack) => {
      const rec = pack.demos.intake?.["loan-application-pipeline"]?.createdRecords;
      return rec ? `${rec.contactFirstName} ${rec.contactLastName}` : null;
    },
    declineText: "Understood. The deal stays in underwriting review and no reminder goes to the borrower. Tell me when to start the sequence.",
    tools: ["get_loan_application", "submit_loan_application", "set_missing_docs", "confirm_los_checklist", "start_doc_reminder_sequence", "complete_document_packet", "verify_funded_deal"],
    maxToolRounds: 8,
    sample: loanSample,
  },
};

export function getAgentDemo(id: string): AgentDemo | null {
  return (AGENT_DEMOS as Record<string, AgentDemo>)[id] ?? null;
}
