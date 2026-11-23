import type { IntakeDemoId } from "@/shell/intake/types";
import type { Company, Contact, Deal, Pack } from "@/verticals/types";
import { addActivity, DAY, iso, touch } from "./helpers";
import type { Action, World } from "./types";

export type IntakeDemoState = {
  submitted: boolean;
  companyId: string | null;
  contactId: string | null;
  dealId: string | null;
  formValues: Record<string, string>;
  /** Selected review items (e.g. shortlisted ATS candidates or verified items). */
  selectedItemIds: string[];
  reviewed: boolean;
  outreachSent: boolean;
  outreachSubject: string | null;
  outreachBody: string | null;
  /** Selected off-platform follow-up options (appointment slot or chosen candidates). */
  selectedOptionIds: string[];
  followupCompleted: boolean;
  completionReviewed: boolean;
};

export type IntakeState = Record<IntakeDemoId, IntakeDemoState>;

export type IntakeAction =
  | { t: "intake.submit"; demoId: IntakeDemoId; at: number; values?: Record<string, string> }
  | { t: "intake.toggleItem"; demoId: IntakeDemoId; itemId: string }
  | { t: "intake.review"; demoId: IntakeDemoId; at: number }
  | { t: "intake.sendOutreach"; demoId: IntakeDemoId; at: number; subject?: string; body?: string }
  | { t: "intake.toggleOption"; demoId: IntakeDemoId; optionId: string }
  | { t: "intake.completeFollowup"; demoId: IntakeDemoId; optionIds?: string[]; at: number }
  | { t: "intake.reviewCompletion"; demoId: IntakeDemoId };

function emptyDemoState(): IntakeDemoState {
  return {
    submitted: false,
    companyId: null,
    contactId: null,
    dealId: null,
    formValues: {},
    selectedItemIds: [],
    reviewed: false,
    outreachSent: false,
    outreachSubject: null,
    outreachBody: null,
    selectedOptionIds: [],
    followupCompleted: false,
    completionReviewed: false,
  };
}

export function seedIntake(pack: Pack): IntakeState {
  const build = (demoId: IntakeDemoId): IntakeDemoState => {
    const cfg = pack.demos.intake?.[demoId];
    if (!cfg) return emptyDemoState();
    const defaults = cfg.integrationCard.items.filter((i) => i.defaultSelected).map((i) => i.id);
    const defaultOptions = [...cfg.followup.defaultOptionIds];
    return {
      ...emptyDemoState(),
      selectedItemIds: defaults,
      selectedOptionIds: defaultOptions,
    };
  };
  return {
    "referral-intake": build("referral-intake"),
    "staffing-job-orders": build("staffing-job-orders"),
  };
}

export function isIntakeAction(a: Action): a is IntakeAction {
  return a.t.startsWith("intake.");
}

function stageLabel(pack: Pack, deal: Deal, stageId: string): string {
  const stages = deal.pipelineStages ?? pack.stages;
  return stages.find((s) => s.id === stageId)?.label ?? stageId;
}

export function applyIntake(w: World, a: IntakeAction, pack: Pack): void {
  const cfg = pack.demos.intake?.[a.demoId];
  if (!cfg) return;
  const st = w.intake[a.demoId];

  switch (a.t) {
    case "intake.submit": {
      if (st.submitted) return;
      const at = iso(a.at);
      const rec = cfg.createdRecords;
      const values: Record<string, string> = {};
      for (const f of cfg.portal.fields) {
        values[f.id] = a.values?.[f.id]?.trim() || f.defaultValue;
      }

      const bound = (bind: NonNullable<(typeof cfg.portal.fields)[number]["bind"]>): string | undefined => {
        const field = cfg.portal.fields.find((f) => f.bind === bind);
        return field ? values[field.id] : undefined;
      };

      const companyName = bound("companyName") || rec.companyName;
      const firstName = bound("firstName") || rec.contactFirstName;
      const lastName = bound("lastName") || rec.contactLastName;
      const email = bound("email") || rec.contactEmail;
      const specialty = bound("specialty");
      const notes = bound("notes");

      if (!w.companies.some((c) => c.id === rec.companyId)) {
        const company: Company = {
          id: rec.companyId,
          name: companyName,
          domain: rec.companyDomain,
          industry: rec.companyIndustry,
          type: "Customer",
          city: rec.companyCity,
          state: rec.companyState,
          employees: rec.companyEmployees,
          revenue: rec.companyRevenue,
          phone: rec.companyPhone,
          ownerId: rec.ownerId,
          lifecycle: "Opportunity",
          createdAt: at,
          lastActivityAt: at,
          territory: rec.companyTerritory,
          description: rec.companyDescription,
          isNew: true,
        };
        w.companies.unshift(company);
      }

      if (!w.contacts.some((c) => c.id === rec.contactId)) {
        const contact: Contact = {
          id: rec.contactId,
          firstName,
          lastName,
          email,
          phone: rec.contactPhone,
          title: rec.contactTitle,
          companyId: rec.companyId,
          ownerId: rec.ownerId,
          lifecycle: rec.contactLifecycle,
          leadStatus: "In progress",
          createdAt: at,
          lastActivityAt: at,
          source: rec.contactSource,
          extra: rec.contactExtra,
          isNew: true,
        };
        w.contacts.unshift(contact);
      }

      if (!w.deals.some((d) => d.id === rec.dealId)) {
        const deal: Deal = {
          id: rec.dealId,
          name: rec.dealName,
          companyId: rec.companyId,
          contactIds: [rec.contactId],
          ownerId: rec.ownerId,
          stage: cfg.stageIds.initial,
          amount: rec.dealAmount,
          closeDate: iso(a.at + rec.dealCloseInDays * DAY),
          createdAt: at,
          lastActivityAt: at,
          type: rec.dealType,
          source: rec.dealSource,
          lineItems: rec.lineItems.map((l) => ({ ...l })),
          ...(cfg.pipelineName ? { pipelineName: cfg.pipelineName } : {}),
          ...(cfg.pipelineStages ? { pipelineStages: cfg.pipelineStages } : {}),
          isNew: true,
        };
        w.deals.unshift(deal);
      }

      const ids = { contactIds: [rec.contactId], companyIds: [rec.companyId], dealIds: [rec.dealId] };
      const owner = pack.personas.find((p) => p.id === rec.ownerId);

      addActivity(w, {
        at: iso(a.at - 3_000),
        type: "form",
        title: `Form submission: ${cfg.portal.formTitle}`,
        body: [companyName, specialty, notes].filter(Boolean).join(" · "),
        byId: null,
        ...ids,
      });
      addActivity(w, {
        at,
        type: "workflow",
        title: `Workflow ran: ${rec.routingRuleLabel}`,
        body: `${rec.routingSummary}. Assigned to ${owner?.name ?? rec.ownerId}.`,
        byId: null,
        ...ids,
        ...(rec.workflowId ? { linkPath: `/workflows/${rec.workflowId}`, linkLabel: "View workflow" } : {}),
      });

      w.tasks.unshift({
        id: `tk-intake-${a.demoId}`,
        title: rec.taskTitle,
        type: "To-do",
        priority: "High",
        dueAt: iso(a.at + 4 * 3_600_000),
        ownerId: rec.ownerId,
        status: "open",
        contactId: rec.contactId,
        companyId: rec.companyId,
        dealId: rec.dealId,
        notes: rec.taskNotes,
        isNew: true,
      });

      w.notifications.unshift({
        id: `nt-intake-owner-${a.demoId}`,
        personaId: rec.ownerId,
        at,
        kind: "lead",
        title: `New intake assigned: ${rec.dealName}`,
        body: rec.routingSummary,
        path: `/deals/${rec.dealId}`,
        read: false,
        slack: { channel: rec.slackChannel, text: rec.slackText },
      });

      touch(w, at, { companyId: rec.companyId, contactIds: [rec.contactId], dealId: rec.dealId });
      w.persona = rec.ownerId;
      st.submitted = true;
      st.companyId = rec.companyId;
      st.contactId = rec.contactId;
      st.dealId = rec.dealId;
      st.formValues = values;
      return;
    }

    case "intake.toggleItem": {
      const exists = st.selectedItemIds.includes(a.itemId);
      if (exists) {
        if (st.selectedItemIds.length <= 1) return;
        st.selectedItemIds = st.selectedItemIds.filter((id) => id !== a.itemId);
      } else {
        st.selectedItemIds = [...st.selectedItemIds, a.itemId];
      }
      return;
    }

    case "intake.review": {
      if (!st.submitted || st.reviewed) return;
      const deal = w.deals.find((d) => d.id === st.dealId);
      const at = iso(a.at);
      if (deal && cfg.stageIds.reviewed !== deal.stage) {
        deal.stage = cfg.stageIds.reviewed;
        deal.lastActivityAt = at;
      }
      const chosen = cfg.integrationCard.items.filter((i) => !i.selectable || st.selectedItemIds.includes(i.id));
      addActivity(w, {
        at,
        type: "sync",
        title: `${cfg.integrationCard.title}: verified`,
        body: `${cfg.integrationCard.confirmedStatusText} (${chosen.map((c) => c.title).join(", ")}).`,
        byId: cfg.createdRecords.ownerId,
        contactIds: st.contactId ? [st.contactId] : [],
        companyIds: st.companyId ? [st.companyId] : [],
        dealIds: st.dealId ? [st.dealId] : [],
      });
      st.reviewed = true;
      return;
    }

    case "intake.sendOutreach": {
      if (!st.submitted || st.outreachSent) return;
      st.reviewed = true;
      const at = iso(a.at);
      const subject = a.subject?.trim() || cfg.outreach.subject;
      const body = a.body?.trim() || cfg.outreach.body;
      const deal = w.deals.find((d) => d.id === st.dealId);
      if (deal) {
        deal.stage = cfg.stageIds.outreachSent;
        deal.lastActivityAt = at;
      }
      addActivity(w, {
        at,
        type: "email",
        title: `Email sent: ${subject}`,
        body: `To ${cfg.outreach.recipientName} <${cfg.outreach.recipientEmail}>. ${cfg.outreach.sentConfirmation}`,
        byId: cfg.outreach.senderId,
        contactIds: st.contactId ? [st.contactId] : [],
        companyIds: st.companyId ? [st.companyId] : [],
        dealIds: st.dealId ? [st.dealId] : [],
      });
      touch(w, at, { companyId: st.companyId, contactIds: st.contactId ? [st.contactId] : [], dealId: st.dealId });
      st.outreachSent = true;
      st.outreachSubject = subject;
      st.outreachBody = body;
      return;
    }

    case "intake.toggleOption": {
      if (cfg.followup.selectionMode === "single") {
        st.selectedOptionIds = [a.optionId];
        return;
      }
      const exists = st.selectedOptionIds.includes(a.optionId);
      const min = cfg.followup.minSelections ?? 1;
      if (exists) {
        if (st.selectedOptionIds.length <= min) return;
        st.selectedOptionIds = st.selectedOptionIds.filter((id) => id !== a.optionId);
      } else {
        st.selectedOptionIds = [...st.selectedOptionIds, a.optionId];
      }
      return;
    }

    case "intake.completeFollowup": {
      if (!st.submitted || st.followupCompleted) return;
      st.reviewed = true;
      st.outreachSent = true;
      const optionIds =
        a.optionIds && a.optionIds.length > 0
          ? a.optionIds
          : st.selectedOptionIds.length > 0
            ? st.selectedOptionIds
            : cfg.followup.defaultOptionIds;
      st.selectedOptionIds = [...optionIds];
      const chosenOptions = cfg.followup.options.filter((o) => optionIds.includes(o.id));
      const at = iso(a.at);
      const deal = w.deals.find((d) => d.id === st.dealId);

      if (deal) {
        deal.stage = cfg.stageIds.completed;
        deal.lastActivityAt = at;
        if (cfg.createdRecords.completedLineItems) {
          deal.lineItems = cfg.createdRecords.completedLineItems.map((l) => ({ ...l }));
        }
        if (cfg.createdRecords.completedAmount !== undefined) {
          deal.amount = cfg.createdRecords.completedAmount;
        }
      }

      const task = w.tasks.find((t) => t.id === `tk-intake-${a.demoId}`);
      if (task) task.status = "done";

      const stageName = deal ? stageLabel(pack, deal, cfg.stageIds.completed) : cfg.completion.stageLabel;
      addActivity(w, {
        at: iso(a.at - 2_000),
        type: cfg.mode === "scheduling" ? "meeting" : "deal",
        title: `${cfg.followup.confirmedHeadline}: ${chosenOptions.map((o) => o.title).join(", ")}`,
        body: `Deal moved to ${stageName}. ${cfg.completion.summary}`,
        byId: null,
        contactIds: st.contactId ? [st.contactId] : [],
        companyIds: st.companyId ? [st.companyId] : [],
        dealIds: st.dealId ? [st.dealId] : [],
      });
      addActivity(w, {
        at,
        type: "sync",
        title: cfg.integrationCard.completedSyncTitle,
        body: cfg.integrationCard.completedSyncDetail,
        byId: null,
        contactIds: st.contactId ? [st.contactId] : [],
        companyIds: st.companyId ? [st.companyId] : [],
        dealIds: st.dealId ? [st.dealId] : [],
      });

      touch(w, at, { companyId: st.companyId, contactIds: st.contactId ? [st.contactId] : [], dealId: st.dealId });
      st.followupCompleted = true;
      return;
    }

    case "intake.reviewCompletion": {
      if (!st.followupCompleted) return;
      st.completionReviewed = true;
      return;
    }
  }
}
