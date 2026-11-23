import { getTicketRun } from "@/store/slices/tickets";
import type { DemoId } from "@/verticals/catalog";
import type { TicketMode, TicketsDemoConfig } from "@/verticals/types";
import { flag, has, type DemoScript, type Step, type StepCtx } from "./types";

function cfgOf(c: StepCtx, demoId: DemoId): TicketsDemoConfig | undefined {
  return c.pack.demos.tickets?.[demoId];
}

export function ticketReportFlag(demoId: DemoId): string {
  return `tk.${demoId}.reportReviewed`;
}

/**
 * Parameterized storyboard factory for the reusable Tickets workspace (`src/shell/tickets/`).
 * Supports all four workspace modes (`feedback`, `checklist`, `sla`, `incident`) so Waves 2-3
 * can register `customer-onboarding`, `client-onboarding`, `complaint-sla`, and `incident-comms`
 * in one line each with zero custom script duplication.
 */
export function createTicketsScript(demoId: DemoId, mode: TicketMode): DemoScript {
  const reportFlag = ticketReportFlag(demoId);
  const ticketPath = (c: StepCtx) => `/tickets/${cfgOf(c, demoId)?.ticket.id ?? "ticket"}`;
  const reportPath = (c: StepCtx) => `/reports/${cfgOf(c, demoId)?.reportId ?? ""}`;

  const reportStep: Step = {
    id: "analytics-report",
    title: "Review satisfaction & resolution speed report",
    hint: (c) => `Reports: filter by location or segment, then click Complete review (${cfgOf(c, demoId)?.reportButtonLabel ?? "Analytics"})`,
    path: reportPath,
    done: (c) => has(c, reportFlag),
    script: () => [flag(reportFlag)],
  };

  if (mode === "feedback") {
    return {
      id: demoId,
      steps: [
        {
          id: "post-visit-survey",
          title: "Patient submits low post-visit rating (off-platform)",
          hint: "Off-platform survey triggered at clinic checkout: select 2/5 wait-time friction and click Submit feedback",
          path: () => `/ticket-app/${demoId}/intake`,
          done: ({ w }) => getTicketRun(w, demoId).intakeSubmitted,
          script: (_c, now) => [{ t: "tk.submitIntake", demoId, at: now }],
        },
        {
          id: "ticket-routed",
          title: "Inspect auto-opened Service Hub ticket routed to manager",
          hint: (c) => `Service Hub Tickets: low-score workflow opened ${cfgOf(c, demoId)?.ticket.number ?? "the ticket"} — click it to open`,
          path: () => "/tickets",
          done: ({ w }) => getTicketRun(w, demoId).ticketOpened,
          script: () => [{ t: "tk.openTicket", demoId }],
        },
        {
          id: "manager-outreach",
          title: "Location manager sends empathetic outreach",
          hint: (c) => `Ticket workspace: review non-PHI wait-time feedback and SLA target, then click ${cfgOf(c, demoId)?.outreach.sendButtonLabel ?? "Send outreach"}`,
          path: ticketPath,
          done: ({ w }) => getTicketRun(w, demoId).outreachSent,
          script: (_c, now) => [{ t: "tk.sendOutreach", demoId, at: now }],
        },
        {
          id: "resolve-ticket",
          title: "Log operational follow-up & resolve ticket",
          hint: (c) => `Ticket workspace: record operational fix and click ${cfgOf(c, demoId)?.outreach.resolveButtonLabel ?? "Log note & resolve ticket"}`,
          path: ticketPath,
          done: ({ w }) => getTicketRun(w, demoId).resolved,
          script: (_c, now) => [{ t: "tk.resolve", demoId, at: now }],
        },
        reportStep,
      ],
    };
  }

  if (mode === "checklist") {
    return {
      id: demoId,
      steps: [
        {
          id: "open-onboarding-ticket",
          title: "Open closed-won onboarding ticket",
          hint: "Service Hub Tickets: closed-won workflow created the onboarding ticket — click to open",
          path: () => "/tickets",
          done: ({ w }) => getTicketRun(w, demoId).ticketOpened,
          script: () => [{ t: "tk.openTicket", demoId }],
        },
        {
          id: "offplatform-intake",
          title: "Customer confirms kickoff (off-platform)",
          hint: "Off-platform portal: review kickoff & requested items, then submit",
          path: () => `/ticket-app/${demoId}/intake`,
          done: ({ w }) => getTicketRun(w, demoId).intakeSubmitted,
          script: (_c, now) => [{ t: "tk.submitIntake", demoId, at: now }],
        },
        {
          id: "verify-checklist",
          title: "Verify onboarding checklist items",
          hint: "Ticket workspace: check off received items and verify completion",
          path: ticketPath,
          done: (c) => {
            const required = cfgOf(c, demoId)?.checklist?.filter((i) => i.required) ?? [];
            const doneIds = getTicketRun(c.w, demoId).completedChecklistIds;
            return required.length > 0 && required.every((i) => doneIds.includes(i.id));
          },
          script: (_c, now) => [{ t: "tk.completeChecklist", demoId, at: now }],
        },
        {
          id: "signoff-resolve",
          title: "Send sign-off & close ticket",
          hint: "Ticket workspace: send confirmation and close the onboarding ticket",
          path: ticketPath,
          done: ({ w }) => getTicketRun(w, demoId).resolved,
          script: (_c, now) => [
            { t: "tk.sendOutreach", demoId, at: now - 1_000 },
            { t: "tk.resolve", demoId, at: now },
          ],
        },
        {
          id: "post-csat",
          title: "Customer completes onboarding CSAT",
          hint: "Off-platform CSAT survey triggered on ticket completion: review rating and continue to report",
          when: (pack) => Boolean(pack.demos.tickets?.[demoId]?.secondaryOffPlatform),
          path: () => `/ticket-app/${demoId}/outreach`,
          done: ({ w }) => getTicketRun(w, demoId).secondarySeen,
          script: () => [{ t: "tk.seenSecondary", demoId }],
        },
        { ...reportStep, title: "Review onboarding time & status report" },
      ],
    };
  }

  if (mode === "sla") {
    return {
      id: demoId,
      steps: [
        {
          id: "complaint-intake",
          title: "Log multi-channel complaint (off-platform)",
          hint: "Off-platform intake: submit complaint to create a categorized Service Hub ticket with SLA due date",
          path: () => `/ticket-app/${demoId}/intake`,
          done: ({ w }) => getTicketRun(w, demoId).intakeSubmitted,
          script: (_c, now) => [{ t: "tk.submitIntake", demoId, at: now }],
        },
        {
          id: "open-sla-ticket",
          title: "Open priority ticket & inspect SLA timer",
          hint: "Service Hub Tickets: review priority SLA due date and open the ticket",
          path: () => "/tickets",
          done: ({ w }) => getTicketRun(w, demoId).ticketOpened,
          script: () => [{ t: "tk.openTicket", demoId }],
        },
        {
          id: "escalate-overdue",
          title: "Escalate overdue ticket to manager",
          hint: "Ticket workspace: trigger overdue SLA escalation to assign manager review",
          path: ticketPath,
          done: ({ w }) => getTicketRun(w, demoId).escalated,
          script: (_c, now) => [{ t: "tk.escalate", demoId, at: now }],
        },
        {
          id: "send-resolution-letter",
          title: "Send resolution letter & close ticket",
          hint: "Ticket workspace: send formal resolution letter and resolve ticket",
          path: ticketPath,
          done: ({ w }) => getTicketRun(w, demoId).resolved,
          script: (_c, now) => [
            { t: "tk.sendOutreach", demoId, at: now - 1_000 },
            { t: "tk.resolve", demoId, at: now },
          ],
        },
        { ...reportStep, title: "Review complaint SLA compliance report" },
      ],
    };
  }

  // mode === "incident"
  return {
    id: demoId,
    steps: [
      {
        id: "monitoring-alert",
        title: "Monitoring tool flags outage (off-platform)",
        hint: "Off-platform monitoring console: trigger HubSpot incident ticket & map impacted accounts",
        path: () => `/ticket-app/${demoId}/intake`,
        done: ({ w }) => getTicketRun(w, demoId).intakeSubmitted,
        script: (_c, now) => [{ t: "tk.submitIntake", demoId, at: now }],
      },
      {
        id: "open-incident",
        title: "Open incident ticket & impacted companies",
        hint: "Service Hub Tickets: open the incident ticket to review impacted managed companies",
        path: () => "/tickets",
        done: ({ w }) => getTicketRun(w, demoId).ticketOpened,
        script: () => [{ t: "tk.openTicket", demoId }],
      },
      {
        id: "broadcast-customers",
        title: "Broadcast alert to impacted accounts",
        hint: "Ticket workspace: notify all affected managed companies and preview customer status email",
        path: ticketPath,
        done: (c) => {
          const accounts = cfgOf(c, demoId)?.impactedAccounts ?? [];
          return accounts.length > 0 && getTicketRun(c.w, demoId).notifiedCompanyIds.length >= accounts.length;
        },
        script: (_c, now) => [{ t: "tk.broadcast", demoId, at: now }],
      },
      {
        id: "close-incident",
        title: "Post recovery update & close incident",
        hint: "Ticket workspace: send recovery status update and publish post-incident summary",
        path: ticketPath,
        done: ({ w }) => getTicketRun(w, demoId).resolved,
        script: (_c, now) => [
          { t: "tk.sendOutreach", demoId, at: now - 1_000 },
          { t: "tk.resolve", demoId, at: now },
        ],
      },
      { ...reportStep, title: "Review incident MTTR & impacted accounts" },
    ],
  };
}

export const postVisitFeedback = createTicketsScript("post-visit-feedback", "feedback");
export const incidentComms = createTicketsScript("incident-comms", "incident");
export const customerOnboarding = createTicketsScript("customer-onboarding", "checklist");
