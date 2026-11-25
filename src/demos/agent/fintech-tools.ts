import type { SampleTurn } from "@/lib/agent/types";
import { getTicketRun } from "@/store/slices/tickets";
import type { Action, World } from "@/store/slices/types";
import type { Pack } from "@/verticals/types";
import { apply, fail, ok, personaName, str, strList, type ToolSpec } from "./bridge";

/**
 * Financial services tool sets. Each tool dispatches the very Actions the clicked demo's buttons
 * dispatch (`tk.*` for the complaint ticket, `intake.*` for the loan pipeline), so the agent's run
 * and the rep's run leave the same ticket, deal, timeline, and report behind.
 */

// ---------- Complaint to SLA ticket ----------

const COMPLAINT = "complaint-sla" as const;

const complaintCfg = (pack: Pack) => pack.demos.tickets?.[COMPLAINT];

function complaintView(w: World, pack: Pack) {
  const cfg = complaintCfg(pack)!;
  const run = getTicketRun(w, COMPLAINT);
  const t = cfg.ticket;
  const contact = w.contacts.find((c) => c.id === t.contactId);
  const company = w.companies.find((c) => c.id === t.companyId);
  const stage = (id: string | null) => (id ? (cfg.stages.find((s) => s.id === id)?.label ?? id) : null);
  return {
    ticket: {
      id: t.id,
      number: t.number,
      subject: t.subject,
      category: t.category,
      priority: t.priority,
      pipeline: cfg.pipelineName,
      stage: run.intakeSubmitted ? stage(run.stageId) : "Not yet opened",
      owner: personaName(pack, t.ownerId),
      contact: contact ? { id: contact.id, name: `${contact.firstName} ${contact.lastName}`, title: contact.title, email: contact.email } : null,
      company: company ? { id: company.id, name: company.name } : null,
      summary: t.summary,
    },
    sla: cfg.sla
      ? {
          target: cfg.sla.targetLabel,
          status: cfg.sla.dueLabel,
          overdue: cfg.sla.overdue === true,
          escalationRule: cfg.sla.escalationRuleLabel ?? null,
          escalateTo: cfg.sla.escalationOwnerId ? personaName(pack, cfg.sla.escalationOwnerId) : null,
        }
      : null,
    state: { ingested: run.intakeSubmitted, opened: run.ticketOpened, escalated: run.escalated, resolutionLetterSent: run.outreachSent, resolved: run.resolved },
    timeline: run.timeline.slice(0, 8).map((e) => ({ at: e.at, kind: e.kind, title: e.title, actor: e.actor })),
  };
}

const needComplaint = (pack: Pack) => (complaintCfg(pack) ? null : fail("This portal has no complaint pipeline."));

export const COMPLAINT_TOOLS: ToolSpec[] = [
  {
    name: "get_complaint",
    run: (_args, { w, pack }) => {
      const cfg = complaintCfg(pack);
      if (!cfg) return fail("This portal has no complaint pipeline.");
      const s = cfg.offPlatform.sla;
      return ok({
        intake: s ? { channel: s.channel, from: s.fromName, fromEmail: s.fromEmail, to: s.toEmail, subject: s.subject, body: s.body, category: s.category, referenceId: s.referenceId } : null,
        ...complaintView(w, pack),
        queue: cfg.queueSeeds.map((q) => ({ number: q.number, subject: q.subject, priority: q.priority, stage: cfg.stages.find((st) => st.id === q.stageId)?.label ?? q.stageId, sla: q.slaLabel, owner: personaName(pack, q.ownerId) })),
      });
    },
  },
  {
    name: "ingest_complaint",
    run: (_args, { w, pack, now }) => {
      const missing = needComplaint(pack);
      if (missing) return missing;
      if (getTicketRun(w, COMPLAINT).intakeSubmitted) return fail("The complaint is already ingested. Read the ticket with get_complaint.");
      return apply([{ t: "tk.submitIntake", demoId: COMPLAINT, at: now }], w, pack, () => complaintView(w, pack));
    },
  },
  {
    name: "open_ticket",
    run: (_args, { w, pack }) => {
      const missing = needComplaint(pack);
      if (missing) return missing;
      if (!getTicketRun(w, COMPLAINT).intakeSubmitted) return fail("Ingest the complaint first.");
      return apply([{ t: "tk.openTicket", demoId: COMPLAINT }], w, pack, () => complaintView(w, pack));
    },
  },
  {
    name: "escalate_ticket",
    run: (_args, { w, pack, now }) => {
      const missing = needComplaint(pack);
      if (missing) return missing;
      const run = getTicketRun(w, COMPLAINT);
      if (!run.intakeSubmitted) return fail("Ingest the complaint first.");
      if (run.escalated) return fail("The ticket is already escalated.");
      return apply([{ t: "tk.escalate", demoId: COMPLAINT, at: now }], w, pack, () => complaintView(w, pack));
    },
  },
  {
    name: "send_resolution_letter",
    confirm: true,
    run: (args, { w, pack, now }) => {
      const cfg = complaintCfg(pack);
      if (!cfg) return fail("This portal has no complaint pipeline.");
      const run = getTicketRun(w, COMPLAINT);
      if (!run.intakeSubmitted) return fail("Ingest the complaint first.");
      if (run.outreachSent) return fail("The resolution letter has already been sent.");
      const text = str(args.text).slice(0, 4000) || undefined;
      return apply([{ t: "tk.sendOutreach", demoId: COMPLAINT, at: now, ...(text ? { text } : {}) }], w, pack, () => ({
        sent: true,
        to: cfg.outreach.recipientLabel,
        subject: cfg.outreach.subject,
        ...complaintView(w, pack),
      }));
    },
  },
  {
    name: "resolve_ticket",
    run: (args, { w, pack, now }) => {
      const missing = needComplaint(pack);
      if (missing) return missing;
      const run = getTicketRun(w, COMPLAINT);
      if (!run.intakeSubmitted) return fail("Ingest the complaint first.");
      if (!run.outreachSent) return fail("Send the resolution letter before closing the ticket.");
      if (run.resolved) return fail("The ticket is already resolved.");
      const note = str(args.note).slice(0, 1200) || undefined;
      return apply([{ t: "tk.resolve", demoId: COMPLAINT, at: now, ...(note ? { note } : {}) }], w, pack, () => complaintView(w, pack));
    },
  },
];

export function complaintSample(pack: Pack): SampleTurn[] {
  const cfg = complaintCfg(pack);
  if (!cfg) return [];
  const t = cfg.ticket;
  const from = cfg.offPlatform.sla?.fromName.split(" (")[0] ?? "the complainant";
  const contact = pack.contacts.find((c) => c.id === t.contactId);
  const first = contact?.firstName ?? from;
  const escalateTo = personaName(pack, cfg.sla?.escalationOwnerId, "the compliance lead");
  return [
    { text: `Reading ${from}'s complaint and the SLA policy on the ${cfg.pipelineName} pipeline.`, toolCalls: [{ name: "get_complaint", args: {} }] },
    {
      text: `Ingesting it now. This opens ${t.number} as ${t.priority}, sends the 24-hour written acknowledgement to ${first}, and starts the SLA clock.`,
      toolCalls: [{ name: "ingest_complaint", args: {} }, { name: "open_ticket", args: {} }],
    },
    { text: `The SLA timer is past its warning threshold, so the overdue rule applies. Escalating to ${escalateTo}.`, toolCalls: [{ name: "escalate_ticket", args: {} }] },
    {
      text: `${escalateTo}'s review confirms the fee was charged in error. The formal resolution letter is drafted on the ticket. Approve and I will send it to ${first}.`,
      toolCalls: [{ name: "send_resolution_letter", args: {} }],
    },
    { text: `Letter sent. Logging the root-cause note and closing ${t.number} inside the regulatory SLA.`, toolCalls: [{ name: "resolve_ticket", args: {} }] },
  ];
}

// ---------- Loan application pipeline ----------

const LOAN = "loan-application-pipeline" as const;

const loanCfg = (pack: Pack) => pack.demos.intake?.[LOAN];

function loanView(w: World, pack: Pack) {
  const cfg = loanCfg(pack)!;
  const st = w.intake[LOAN];
  const rec = cfg.createdRecords;
  const deal = st.dealId ? w.deals.find((d) => d.id === st.dealId) : undefined;
  const stages = deal?.pipelineStages ?? cfg.pipelineStages ?? pack.stages;
  const ic = cfg.integrationCard;
  return {
    borrower: { company: rec.companyName, signer: `${rec.contactFirstName} ${rec.contactLastName}`, signerTitle: rec.contactTitle, email: rec.contactEmail, requestedAmount: rec.dealAmount, dealName: rec.dealName, underwriter: personaName(pack, rec.ownerId) },
    deal: deal ? { id: deal.id, stage: stages.find((s) => s.id === deal.stage)?.label ?? deal.stage, amount: deal.amount, closeDate: deal.closeDate, pipeline: deal.pipelineName ?? cfg.pipelineName ?? null } : null,
    los: {
      system: ic.systemName,
      status: ic.badge,
      items: ic.items.map((i) => ({ id: i.id, title: i.title, status: i.badge, missing: i.selectable === true, inReminderSequence: i.selectable === true && st.selectedItemIds.includes(i.id) })),
    },
    uploadsAvailable: cfg.followup.options.map((o) => ({ id: o.id, title: o.title, note: o.meta })),
    state: { applicationIngested: st.submitted, checklistConfirmed: st.reviewed, reminderSequenceStarted: st.outreachSent, documentsReceived: st.followupCompleted, fundingVerified: st.completionReviewed },
  };
}

export const LOAN_TOOLS: ToolSpec[] = [
  {
    name: "get_loan_application",
    run: (_args, { w, pack }) => {
      const cfg = loanCfg(pack);
      if (!cfg) return fail("This portal has no loan pipeline.");
      return ok({
        application: { portal: cfg.portal.url, form: cfg.portal.formTitle, fields: cfg.portal.fields.map((f) => ({ id: f.id, label: f.label, value: f.defaultValue })) },
        pipeline: { name: cfg.pipelineName ?? null, stages: (cfg.pipelineStages ?? pack.stages).map((s) => s.label) },
        ...loanView(w, pack),
      });
    },
  },
  {
    name: "submit_loan_application",
    run: (_args, { w, pack, now }) => {
      if (!loanCfg(pack)) return fail("This portal has no loan pipeline.");
      if (w.intake[LOAN].submitted) return fail("The application is already in the pipeline. Read it with get_loan_application.");
      return apply([{ t: "intake.submit", demoId: LOAN, at: now }], w, pack, () => loanView(w, pack));
    },
  },
  {
    name: "set_missing_docs",
    run: (args, { w, pack }) => {
      const cfg = loanCfg(pack);
      if (!cfg) return fail("This portal has no loan pipeline.");
      const st = w.intake[LOAN];
      if (!st.submitted) return fail("Submit the application first.");
      const selectable = cfg.integrationCard.items.filter((i) => i.selectable).map((i) => i.id);
      const wanted = strList(args.itemIds);
      const bad = wanted.filter((id) => !selectable.includes(id));
      if (bad.length > 0) return fail(`Not missing documents: ${bad.join(", ")}. Choose from ${selectable.join(", ")}.`);
      if (wanted.length === 0) return fail("Choose at least one missing document.");
      const actions: Action[] = [];
      // Add first so the slice's minimum-of-one rule never blocks a removal.
      for (const id of selectable) if (wanted.includes(id) && !st.selectedItemIds.includes(id)) actions.push({ t: "intake.toggleItem", demoId: LOAN, itemId: id });
      for (const id of selectable) if (!wanted.includes(id) && st.selectedItemIds.includes(id)) actions.push({ t: "intake.toggleItem", demoId: LOAN, itemId: id });
      return apply(actions, w, pack, () => loanView(w, pack).los);
    },
  },
  {
    name: "confirm_los_checklist",
    run: (_args, { w, pack, now }) => {
      if (!loanCfg(pack)) return fail("This portal has no loan pipeline.");
      const st = w.intake[LOAN];
      if (!st.submitted) return fail("Submit the application first.");
      if (st.reviewed) return fail("The checklist is already confirmed.");
      return apply([{ t: "intake.review", demoId: LOAN, at: now }], w, pack, () => loanView(w, pack));
    },
  },
  {
    name: "start_doc_reminder_sequence",
    confirm: true,
    run: (args, { w, pack, now }) => {
      const cfg = loanCfg(pack);
      if (!cfg) return fail("This portal has no loan pipeline.");
      const st = w.intake[LOAN];
      if (!st.submitted) return fail("Submit the application first.");
      if (st.outreachSent) return fail("The reminder sequence is already running.");
      const subject = str(args.subject).slice(0, 200) || undefined;
      const body = str(args.body).slice(0, 4000) || undefined;
      return apply([{ t: "intake.sendOutreach", demoId: LOAN, at: now, ...(subject ? { subject } : {}), ...(body ? { body } : {}) }], w, pack, () => ({
        sent: true,
        to: `${cfg.outreach.recipientName} <${cfg.outreach.recipientEmail}>`,
        subject: st.outreachSubject,
        ...loanView(w, pack),
      }));
    },
  },
  {
    name: "complete_document_packet",
    run: (args, { w, pack, now }) => {
      const cfg = loanCfg(pack);
      if (!cfg) return fail("This portal has no loan pipeline.");
      const st = w.intake[LOAN];
      if (!st.submitted) return fail("Submit the application first.");
      if (!st.outreachSent) return fail("Start the document reminder sequence before recording uploads.");
      if (st.followupCompleted) return fail("The document packet is already complete.");
      const valid = cfg.followup.options.map((o) => o.id);
      const wanted = strList(args.uploadIds);
      const bad = wanted.filter((id) => !valid.includes(id));
      if (bad.length > 0) return fail(`Unknown uploads: ${bad.join(", ")}. Choose from ${valid.join(", ")}.`);
      const min = cfg.followup.minSelections ?? 1;
      if (wanted.length > 0 && wanted.length < min) return fail(`At least ${min} uploads are needed to complete the packet.`);
      const optionIds = wanted.length > 0 ? wanted : cfg.followup.defaultOptionIds;
      return apply([{ t: "intake.completeFollowup", demoId: LOAN, optionIds, at: now }], w, pack, () => loanView(w, pack));
    },
  },
  {
    name: "verify_funded_deal",
    run: (_args, { w, pack }) => {
      if (!loanCfg(pack)) return fail("This portal has no loan pipeline.");
      const st = w.intake[LOAN];
      if (!st.followupCompleted) return fail("The document packet is not complete yet.");
      return apply([{ t: "intake.reviewCompletion", demoId: LOAN }], w, pack, () => loanView(w, pack));
    },
  },
];

export function loanSample(pack: Pack): SampleTurn[] {
  const cfg = loanCfg(pack);
  if (!cfg) return [];
  const rec = cfg.createdRecords;
  const missing = cfg.integrationCard.items.filter((i) => i.selectable);
  const defaults = missing.filter((i) => i.defaultSelected).map((i) => i.id);
  const amount = rec.dealAmount.toLocaleString("en-US", { style: "currency", currency: pack.portal.currency || "USD", maximumFractionDigits: 0 });
  const underwriter = personaName(pack, rec.ownerId, "the underwriter");
  return [
    { text: `Reading ${rec.companyName}'s application from the portal and the LOS packet.`, toolCalls: [{ name: "get_loan_application", args: {} }] },
    {
      text: `Opening it in the ${cfg.pipelineName ?? "origination"} pipeline: the company, ${rec.contactFirstName} ${rec.contactLastName} as signer, and the ${amount} deal, routed to ${underwriter}.`,
      toolCalls: [{ name: "submit_loan_application", args: {} }],
    },
    {
      text: `The LOS shows ${missing.length} documents missing. Flagging them for the reminder sequence and confirming the underwriting checklist.`,
      toolCalls: [{ name: "set_missing_docs", args: { itemIds: defaults } }, { name: "confirm_los_checklist", args: {} }],
    },
    {
      text: `The missing-document request for ${rec.contactFirstName} is drafted from the approved template. Approve and I will start the reminder sequence.`,
      toolCalls: [{ name: "start_doc_reminder_sequence", args: {} }],
    },
    {
      text: `Sequence running and the deal is in Documents Requested. ${rec.contactFirstName}'s uploads have landed on the portal, so I am recording them, closing the packet, and verifying the funded deal.`,
      toolCalls: [{ name: "complete_document_packet", args: {} }, { name: "verify_funded_deal", args: {} }],
    },
  ];
}
