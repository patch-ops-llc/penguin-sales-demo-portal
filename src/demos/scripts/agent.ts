import { answerScripted, scriptedTurn } from "@/demos/agent/scripted";
import { confirmTools } from "@/demos/agent/tools";
import { agentTurns, pendingConfirmation } from "@/store/slices/agent";
import { getTicketRun } from "@/store/slices/tickets";
import { intakeReportFlag } from "./intake";
import { ticketReportFlag } from "./tickets";
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

// ---------- Financial services ----------

const complaintTicketPath = ({ pack }: StepCtx) => `/tickets/${pack.demos.tickets?.["complaint-sla"]?.ticket.id ?? ""}`;
const complaintIntakePath = () => "/ticket-app/complaint-sla/intake";
const complaintReportPath = ({ pack }: StepCtx) => `/reports/${pack.demos.tickets?.["complaint-sla"]?.reportId ?? ""}`;
const complaintRun = ({ w }: StepCtx) => getTicketRun(w, "complaint-sla");

/**
 * The regulatory complaint, run by the model. Same `tk.*` actions as the clicked complaint-sla
 * demo, so the ticket, the SLA timer, the escalation, the letter, and the report are identical.
 */
export const agentComplaintSla: DemoScript = {
  id: "agent-complaint-sla",
  steps: [
    {
      id: "brief",
      title: "Brief the agent",
      hint: "Agent panel: send the opening message (or press Next to play it). The agent reads the complaint email and the SLA policy",
      path: complaintIntakePath,
      done: ({ w }) => agentTurns(w) >= 1,
      script: (c, now) => scriptedTurn(c, now, "agent-complaint-sla"),
    },
    {
      id: "ingest",
      title: "The agent opens the ticket with its SLA",
      hint: "Watch the ticket: the 24h acknowledgement and the SLA timer land as Service Hub actions",
      path: complaintIntakePath,
      after: complaintTicketPath,
      done: (c) => complaintRun(c).intakeSubmitted,
      script: (c, now) => scriptedTurn(c, now, "agent-complaint-sla"),
    },
    {
      id: "escalate",
      title: "The agent escalates under the SLA rule",
      hint: "The overdue rule reassigns the ticket to the compliance lead; the timeline records it",
      path: complaintTicketPath,
      done: (c) => complaintRun(c).escalated,
      script: (c, now) => scriptedTurn(c, now, "agent-complaint-sla"),
    },
    {
      id: "ask",
      title: "The agent asks before the letter goes out",
      hint: "Nothing reaches the complainant without a click: the letter waits for approval in the Agent panel",
      path: complaintTicketPath,
      done: (c) => pendingConfirmation(c.w, confirmTools()).length > 0 || complaintRun(c).outreachSent,
      script: (c, now) => scriptedTurn(c, now, "agent-complaint-sla"),
    },
    {
      id: "approve",
      title: "Approve the resolution letter",
      hint: "Click Approve in the Agent panel. The letter is sent and logged on the ticket",
      path: complaintTicketPath,
      done: (c) => complaintRun(c).outreachSent,
      script: (c, now) => answerScripted(c, true, now, "agent-complaint-sla"),
    },
    {
      id: "resolve",
      title: "The agent closes the ticket",
      hint: "Root cause logged, ticket resolved inside the SLA, follow-up task completed",
      path: complaintTicketPath,
      done: (c) => complaintRun(c).resolved,
      script: (c, now) => scriptedTurn(c, now, "agent-complaint-sla"),
    },
    {
      id: "report",
      title: "Review the SLA compliance report",
      hint: "Reports: SLA compliance and resolution time now include this ticket, then click Complete review",
      path: complaintTicketPath,
      after: complaintReportPath,
      done: (c) => has(c, ticketReportFlag("complaint-sla")),
      script: () => [flag(ticketReportFlag("complaint-sla"))],
    },
  ],
};

const LOAN = "loan-application-pipeline" as const;
const loanDealPath = ({ w, pack }: StepCtx) => `/deals/${w.intake[LOAN].dealId ?? pack.demos.intake?.[LOAN]?.createdRecords.dealId ?? ""}`;
const loanPortalPath = () => `/intake/${LOAN}/submit`;
const loanReportPath = ({ pack }: StepCtx) => `/reports/${pack.demos.intake?.[LOAN]?.reportId ?? ""}`;
const loanState = ({ w }: StepCtx) => w.intake[LOAN];

/**
 * The loan application pipeline, run by the model. Same `intake.*` actions as the clicked
 * loan-application-pipeline demo: the deal, the LOS card, the sequence, and the report match.
 */
export const agentLoanPipeline: DemoScript = {
  id: "agent-loan-pipeline",
  steps: [
    {
      id: "brief",
      title: "Brief the agent",
      hint: "Agent panel: send the opening message (or press Next to play it). The agent reads the portal application and the LOS packet",
      path: loanPortalPath,
      done: ({ w }) => agentTurns(w) >= 1,
      script: (c, now) => scriptedTurn(c, now, "agent-loan-pipeline"),
    },
    {
      id: "ingest",
      title: "The agent opens the loan deal",
      hint: "Watch the pipeline: company, signer, and deal are created and routed to the underwriter",
      path: loanPortalPath,
      after: loanDealPath,
      done: (c) => loanState(c).submitted,
      script: (c, now) => scriptedTurn(c, now, "agent-loan-pipeline"),
    },
    {
      id: "checklist",
      title: "The agent confirms the LOS checklist",
      hint: "The missing documents are flagged on the LOS card and the deal moves to underwriting review",
      path: loanDealPath,
      done: (c) => loanState(c).reviewed,
      script: (c, now) => scriptedTurn(c, now, "agent-loan-pipeline"),
    },
    {
      id: "ask",
      title: "The agent asks before the email goes out",
      hint: "Nothing reaches the borrower without a click: the reminder sequence waits for approval in the Agent panel",
      path: loanDealPath,
      done: (c) => pendingConfirmation(c.w, confirmTools()).length > 0 || loanState(c).outreachSent,
      script: (c, now) => scriptedTurn(c, now, "agent-loan-pipeline"),
    },
    {
      id: "approve",
      title: "Approve the reminder sequence",
      hint: "Click Approve in the Agent panel. The request goes out and the deal moves to Documents Requested",
      path: loanDealPath,
      done: (c) => loanState(c).outreachSent,
      script: (c, now) => answerScripted(c, true, now, "agent-loan-pipeline"),
    },
    {
      id: "funded",
      title: "The agent records the uploads and funds",
      hint: "The borrower's documents land, the packet completes, and the deal reaches Approved & Funded",
      path: loanDealPath,
      done: (c) => loanState(c).completionReviewed,
      script: (c, now) => scriptedTurn(c, now, "agent-loan-pipeline"),
    },
    {
      id: "report",
      title: "Review the conversion report",
      hint: "Reports: Application-to-Funded Conversion now includes this loan, then click Complete review",
      path: loanDealPath,
      after: loanReportPath,
      done: (c) => has(c, intakeReportFlag(LOAN)),
      script: () => [flag(intakeReportFlag(LOAN))],
    },
  ],
};
