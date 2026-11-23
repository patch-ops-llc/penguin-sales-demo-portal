import type { ContractRenewalConfig, PremiumToSubscriptionConfig, RenewalChurnRiskConfig, RenewalsDemoId } from "@/shell/renewals/types";
import type { Deal, Pack, Quote } from "@/verticals/types";
import { quoteTotals } from "../quote-math";
import { addActivity, DAY, iso, touch } from "./helpers";
import type { Action, World } from "./types";

export type RenewalsDemoState = {
  /** S3: Premium deal marked Closed Won. */
  premiumClosed: boolean;
  /** S3: Selected billing frequency on off-platform checkout. */
  billingOptionId: string | null;
  /** S3: Off-platform checkout paid & Subscription deal created. */
  checkoutCompleted: boolean;
  /** S3: Created subscription deal id. */
  subscriptionDealId: string | null;
  /** S3: Billing sync verified on Subscription deal. */
  syncVerified: boolean;
  /** S3: CS owner assigned + onboarding kickoff tasks created. */
  csAssigned: boolean;
  /** S3: Dual pipelines handoff reviewed. */
  pipelinesReviewed: boolean;

  /** S4 / I3: 90-day or 120-day renewal workflow triggered. */
  triggered: boolean;
  /** S4 / I3: Created renewal deal id. */
  renewalDealId: string | null;
  /** S4: Account flagged at-risk from Account Health Score card & retention quote created. */
  atRiskFlagged: boolean;
  /** S4 / I3: Created renewal quote id. */
  renewalQuoteId: string | null;
  /** I3: Selected QBR slot on off-platform scheduler. */
  qbrSlotId: string | null;
  /** I3: QBR booked with client. */
  qbrBooked: boolean;
  /** S4 / I3: Buyer accepted the renewal quote. */
  quoteAccepted: boolean;
  /** S4: Closed-won renewal deal reviewed. */
  renewalVerified: boolean;
  /** I3: PSA agreement & contract end-date roll-forward synced. */
  psaSynced: boolean;
};

export type RenewalsState = Record<RenewalsDemoId, RenewalsDemoState>;

export type RenewalsAction =
  | { t: "ren.closePremium"; at: number }
  | { t: "ren.selectBillingOption"; optionId: string }
  | { t: "ren.completeCheckout"; optionId?: string; at: number }
  | { t: "ren.verifySync"; at: number }
  | { t: "ren.assignCs"; at: number }
  | { t: "ren.reviewPipelines" }
  | { t: "ren.trigger"; demoId: "renewal-churn-risk" | "contract-renewal"; at: number }
  | { t: "ren.flagAtRiskAndQuote"; at: number }
  | { t: "ren.selectQbrSlot"; slotId: string }
  | { t: "ren.bookQbr"; slotId?: string; at: number }
  | { t: "ren.createContractQuote"; at: number }
  | { t: "ren.verifyClosedRenewal" }
  | { t: "ren.syncPsa"; at: number };

function emptyState(): RenewalsDemoState {
  return {
    premiumClosed: false,
    billingOptionId: null,
    checkoutCompleted: false,
    subscriptionDealId: null,
    syncVerified: false,
    csAssigned: false,
    pipelinesReviewed: false,
    triggered: false,
    renewalDealId: null,
    atRiskFlagged: false,
    renewalQuoteId: null,
    qbrSlotId: null,
    qbrBooked: false,
    quoteAccepted: false,
    renewalVerified: false,
    psaSynced: false,
  };
}

export function seedRenewals(pack: Pack): RenewalsState {
  const s3Cfg = pack.demos.renewals?.["premium-to-subscription"] as PremiumToSubscriptionConfig | undefined;
  const i3Cfg = pack.demos.renewals?.["contract-renewal"] as ContractRenewalConfig | undefined;
  return {
    "premium-to-subscription": {
      ...emptyState(),
      billingOptionId: s3Cfg?.checkout.defaultBillingOptionId ?? null,
    },
    "renewal-churn-risk": emptyState(),
    "contract-renewal": {
      ...emptyState(),
      qbrSlotId: i3Cfg?.qbr.defaultSlotId ?? null,
    },
  };
}

export function isRenewalsAction(a: Action): a is RenewalsAction {
  return a.t.startsWith("ren.");
}

function getS3(pack: Pack): PremiumToSubscriptionConfig | undefined {
  const cfg = pack.demos.renewals?.["premium-to-subscription"];
  return cfg?.mode === "dual-pipeline" ? cfg : undefined;
}

function getS4(pack: Pack): RenewalChurnRiskConfig | undefined {
  const cfg = pack.demos.renewals?.["renewal-churn-risk"];
  return cfg?.mode === "health-churn" ? cfg : undefined;
}

function getI3(pack: Pack): ContractRenewalConfig | undefined {
  const cfg = pack.demos.renewals?.["contract-renewal"];
  return cfg?.mode === "contract-qbr" ? cfg : undefined;
}

function createRenewalQuote(
  w: World,
  spec: {
    id: string;
    number: string;
    title: string;
    dealId: string;
    companyId: string;
    contactId: string;
    ownerId: string;
    lineItems: Quote["lineItems"];
    discountPct: number;
    origin: string;
    at: number;
  },
): Quote {
  const existing = w.quotes.find((q) => q.id === spec.id);
  if (existing) return existing;
  const at = iso(spec.at);
  const quote: Quote = {
    id: spec.id,
    number: spec.number,
    title: spec.title,
    dealId: spec.dealId,
    companyId: spec.companyId,
    contactId: spec.contactId,
    ownerId: spec.ownerId,
    status: "Draft",
    lineItems: spec.lineItems.map((l) => ({ ...l })),
    discountPct: spec.discountPct,
    createdAt: at,
    validUntil: iso(spec.at + 30 * DAY),
    origin: spec.origin,
    isNew: true,
  };
  w.quotes.unshift(quote);
  // Use one-click Accept on the buyer page for smooth renewal acceptance.
  w.ui[`q.${quote.id}.accept`] = "accept";
  return quote;
}

/**
 * Called by quoting slice when `quote.accept` fires so renewal deals close cleanly
 * the moment the buyer accepts the published renewal quote.
 */
export function syncRenewalOnQuoteAccepted(w: World, quote: Quote, pack: Pack, at: string): void {
  const s4 = getS4(pack);
  if (s4 && quote.id === s4.quote.quoteId) {
    const deal = w.deals.find((d) => d.id === s4.renewalDeal.dealId);
    if (deal) {
      deal.stage = s4.renewalDeal.wonStageId;
      deal.amount = quoteTotals(quote).total;
      deal.lastActivityAt = at;
    }
    const task = w.tasks.find((t) => t.id === "tk-ren-s4");
    if (task) task.status = "done";
    w.renewals["renewal-churn-risk"].quoteAccepted = true;
    addActivity(w, {
      at,
      type: "deal",
      title: `Renewal deal closed won: ${s4.renewalDeal.name}`,
      body: `Buyer accepted ${quote.number} (${quoteTotals(quote).total.toLocaleString("en-US", { style: "currency", currency: "USD" })} retained ARR). Account moved off At-Risk watch.`,
      byId: null,
      contactIds: [s4.contactId],
      companyIds: [s4.companyId],
      dealIds: [s4.renewalDeal.dealId],
    });
    return;
  }

  const i3 = getI3(pack);
  if (i3 && quote.id === i3.quote.quoteId) {
    const deal = w.deals.find((d) => d.id === i3.renewalDeal.dealId);
    if (deal) {
      deal.stage = i3.renewalDeal.wonStageId;
      deal.amount = quoteTotals(quote).total;
      deal.lastActivityAt = at;
    }
    const task = w.tasks.find((t) => t.id === "tk-ren-i3");
    if (task) task.status = "done";
    w.renewals["contract-renewal"].quoteAccepted = true;
    addActivity(w, {
      at,
      type: "deal",
      title: `Renewal deal closed won: ${i3.renewalDeal.name}`,
      body: `Client accepted ${quote.number} (${quoteTotals(quote).total.toLocaleString("en-US", { style: "currency", currency: "USD" })} ARR). Ready for PSA agreement roll-forward sync.`,
      byId: null,
      contactIds: [i3.contactId],
      companyIds: [i3.companyId],
      dealIds: [i3.renewalDeal.dealId],
    });
  }
}

export function applyRenewals(w: World, a: RenewalsAction, pack: Pack): void {
  switch (a.t) {
    case "ren.closePremium": {
      const cfg = getS3(pack);
      if (!cfg) return;
      const st = w.renewals["premium-to-subscription"];
      if (st.premiumClosed) return;
      const at = iso(a.at);
      const deal = w.deals.find((d) => d.id === cfg.premiumDealId);
      if (deal) {
        deal.stage = cfg.premiumWonStageId;
        deal.lastActivityAt = at;
      }
      addActivity(w, {
        at,
        type: "deal",
        title: "Premium deal closed won",
        body: `${deal?.name ?? "Premium deal"} moved to Closed Won in ${cfg.premiumPipelineName}. External billing checkout link dispatched to customer.`,
        byId: cfg.aeOwnerId,
        contactIds: [cfg.contactId],
        companyIds: [cfg.companyId],
        dealIds: [cfg.premiumDealId],
      });
      touch(w, at, { companyId: cfg.companyId, contactIds: [cfg.contactId], dealId: cfg.premiumDealId });
      st.premiumClosed = true;
      return;
    }

    case "ren.selectBillingOption": {
      w.renewals["premium-to-subscription"].billingOptionId = a.optionId;
      return;
    }

    case "ren.completeCheckout": {
      const cfg = getS3(pack);
      if (!cfg) return;
      const st = w.renewals["premium-to-subscription"];
      if (st.checkoutCompleted) return;
      const at = iso(a.at);
      st.premiumClosed = true;
      const premDeal = w.deals.find((d) => d.id === cfg.premiumDealId);
      if (premDeal) premDeal.stage = cfg.premiumWonStageId;

      const optId = a.optionId ?? st.billingOptionId ?? cfg.checkout.defaultBillingOptionId;
      st.billingOptionId = optId;
      const opt = cfg.checkout.billingOptions.find((o) => o.id === optId) ?? cfg.checkout.billingOptions[0];

      const subSpec = cfg.subscriptionDeal;
      if (!w.deals.some((d) => d.id === subSpec.dealId)) {
        const subDeal: Deal = {
          id: subSpec.dealId,
          name: subSpec.name,
          companyId: cfg.companyId,
          contactIds: [cfg.contactId],
          ownerId: cfg.aeOwnerId,
          stage: cfg.subscriptionInitialStageId,
          amount: opt ? opt.annualTotal : subSpec.arr,
          closeDate: subSpec.renewalDate,
          createdAt: at,
          lastActivityAt: at,
          type: "New subscription",
          source: "Billing webhook sync",
          lineItems: subSpec.lineItems.map((l) => ({ ...l })),
          pipelineName: cfg.subscriptionPipelineName,
          pipelineStages: cfg.subscriptionStages,
          isNew: true,
        };
        w.deals.unshift(subDeal);
      }

      const co = w.companies.find((c) => c.id === cfg.companyId);
      if (co) {
        co.type = "Customer";
        co.lifecycle = "Customer";
        co.lastActivityAt = at;
      }

      addActivity(w, {
        at,
        type: "sync",
        title: `Billing webhook received (${cfg.checkout.webhookEventId})`,
        body: `Subscription ${cfg.checkout.subscriptionNumber} activated (${opt?.label ?? "Annual"}, $${(opt?.mrr ?? subSpec.mrr).toLocaleString()}/mo MRR). Created Subscription deal with start & renewal dates.`,
        byId: null,
        contactIds: [cfg.contactId],
        companyIds: [cfg.companyId],
        dealIds: [subSpec.dealId, cfg.premiumDealId],
        linkPath: `/deals/${subSpec.dealId}`,
        linkLabel: "Open Subscription deal",
      });
      touch(w, at, { companyId: cfg.companyId, contactIds: [cfg.contactId], dealId: subSpec.dealId });
      st.checkoutCompleted = true;
      st.subscriptionDealId = subSpec.dealId;
      return;
    }

    case "ren.verifySync": {
      const cfg = getS3(pack);
      if (!cfg) return;
      const st = w.renewals["premium-to-subscription"];
      if (!st.checkoutCompleted || st.syncVerified) return;
      st.syncVerified = true;
      return;
    }

    case "ren.assignCs": {
      const cfg = getS3(pack);
      if (!cfg) return;
      const st = w.renewals["premium-to-subscription"];
      if (!st.checkoutCompleted || st.csAssigned) return;
      st.syncVerified = true;
      const at = iso(a.at);
      const csOwner = pack.personas.find((p) => p.id === cfg.csOwnerId);
      const subDeal = w.deals.find((d) => d.id === cfg.subscriptionDeal.dealId);
      if (subDeal) {
        subDeal.ownerId = cfg.csOwnerId;
        subDeal.stage = cfg.subscriptionHandoffStageId;
        subDeal.lastActivityAt = at;
      }
      const co = w.companies.find((c) => c.id === cfg.companyId);
      if (co) co.ownerId = cfg.csOwnerId;

      for (const taskSpec of cfg.csHandoff.tasks) {
        if (!w.tasks.some((t) => t.id === taskSpec.id)) {
          w.tasks.unshift({
            id: taskSpec.id,
            title: taskSpec.title,
            type: taskSpec.type,
            priority: taskSpec.priority,
            dueAt: iso(a.at + taskSpec.dueInDays * DAY),
            ownerId: cfg.csOwnerId,
            status: "open",
            contactId: cfg.contactId,
            companyId: cfg.companyId,
            dealId: cfg.subscriptionDeal.dealId,
            notes: taskSpec.notes,
            isNew: true,
          });
        }
      }

      w.notifications.unshift({
        id: "nt-ren-s3-cs",
        personaId: cfg.csOwnerId,
        at,
        kind: "task",
        title: `New Subscription account assigned: ${co?.name ?? "Customer"}`,
        body: `${cfg.csHandoff.tasks.length} onboarding kickoff tasks created for ${csOwner?.name ?? "Customer Success"}.`,
        path: `/deals/${cfg.subscriptionDeal.dealId}`,
        read: false,
        slack: { channel: cfg.csHandoff.slackChannel, text: cfg.csHandoff.slackText },
      });

      addActivity(w, {
        at,
        type: "workflow",
        title: `Workflow ran: ${cfg.csHandoff.workflowName}`,
        body: `Assigned CS owner ${csOwner?.name ?? cfg.csOwnerId} and created ${cfg.csHandoff.tasks.length} onboarding kickoff tasks.`,
        byId: null,
        contactIds: [cfg.contactId],
        companyIds: [cfg.companyId],
        dealIds: [cfg.subscriptionDeal.dealId],
      });
      touch(w, at, { companyId: cfg.companyId, contactIds: [cfg.contactId], dealId: cfg.subscriptionDeal.dealId });
      st.csAssigned = true;
      return;
    }

    case "ren.reviewPipelines": {
      const st = w.renewals["premium-to-subscription"];
      if (!st.csAssigned) return;
      st.pipelinesReviewed = true;
      return;
    }

    case "ren.trigger": {
      const at = iso(a.at);
      if (a.demoId === "renewal-churn-risk") {
        const cfg = getS4(pack);
        if (!cfg) return;
        const st = w.renewals["renewal-churn-risk"];
        if (st.triggered) return;
        const rd = cfg.renewalDeal;
        if (!w.deals.some((d) => d.id === rd.dealId)) {
          w.deals.unshift({
            id: rd.dealId,
            name: rd.name,
            companyId: cfg.companyId,
            contactIds: [cfg.contactId],
            ownerId: cfg.csmOwnerId,
            stage: rd.initialStageId,
            amount: rd.arr,
            closeDate: rd.closeDate,
            createdAt: at,
            lastActivityAt: at,
            type: "Renewal",
            source: cfg.workflow.name,
            lineItems: rd.lineItems.map((l) => ({ ...l })),
            pipelineName: rd.pipelineName,
            pipelineStages: rd.stages,
            isNew: true,
          });
        }
        if (!w.tasks.some((t) => t.id === "tk-ren-s4")) {
          w.tasks.unshift({
            id: "tk-ren-s4",
            title: rd.taskTitle,
            type: "Call",
            priority: "High",
            dueAt: iso(a.at + 2 * DAY),
            ownerId: cfg.csmOwnerId,
            status: "open",
            contactId: cfg.contactId,
            companyId: cfg.companyId,
            dealId: rd.dealId,
            notes: rd.taskNotes,
            isNew: true,
          });
        }
        w.notifications.unshift({
          id: "nt-ren-s4-csm",
          personaId: cfg.csmOwnerId,
          at,
          kind: "task",
          title: `90-day renewal triggered (At-Risk): ${rd.name}`,
          body: rd.taskNotes,
          path: `/companies/${cfg.companyId}`,
          read: false,
          slack: { channel: rd.slackChannel, text: rd.slackText },
        });
        addActivity(w, {
          at,
          type: "workflow",
          title: `Workflow ran: ${cfg.workflow.name}`,
          body: `Created renewal deal ${rd.name} (${rd.arr.toLocaleString("en-US", { style: "currency", currency: "USD" })} ARR) and high-priority CSM review task.`,
          byId: null,
          contactIds: [cfg.contactId],
          companyIds: [cfg.companyId],
          dealIds: [rd.dealId],
        });
        touch(w, at, { companyId: cfg.companyId, contactIds: [cfg.contactId], dealId: rd.dealId });
        w.persona = cfg.csmOwnerId;
        st.triggered = true;
        st.renewalDealId = rd.dealId;
        return;
      }

      const cfg = getI3(pack);
      if (!cfg) return;
      const st = w.renewals["contract-renewal"];
      if (st.triggered) return;
      const rd = cfg.renewalDeal;
      if (!w.deals.some((d) => d.id === rd.dealId)) {
        w.deals.unshift({
          id: rd.dealId,
          name: rd.name,
          companyId: cfg.companyId,
          contactIds: [cfg.contactId],
          ownerId: cfg.ownerId,
          stage: rd.initialStageId,
          amount: rd.arr,
          closeDate: rd.closeDate,
          createdAt: at,
          lastActivityAt: at,
          type: "Renewal",
          source: cfg.workflow.name,
          lineItems: rd.lineItems.map((l) => ({ ...l })),
          pipelineName: rd.pipelineName,
          pipelineStages: rd.stages,
          isNew: true,
        });
      }
      if (!w.tasks.some((t) => t.id === "tk-ren-i3")) {
        w.tasks.unshift({
          id: "tk-ren-i3",
          title: rd.taskTitle,
          type: "Call",
          priority: "High",
          dueAt: iso(a.at + 3 * DAY),
          ownerId: cfg.ownerId,
          status: "open",
          contactId: cfg.contactId,
          companyId: cfg.companyId,
          dealId: rd.dealId,
          notes: rd.taskNotes,
          isNew: true,
        });
      }
      w.notifications.unshift({
        id: "nt-ren-i3-am",
        personaId: cfg.ownerId,
        at,
        kind: "task",
        title: `120-day contract renewal created: ${rd.name}`,
        body: rd.taskNotes,
        path: `/deals/${rd.dealId}`,
        read: false,
        slack: { channel: rd.slackChannel, text: rd.slackText },
      });
      addActivity(w, {
        at,
        type: "workflow",
        title: `Workflow ran: ${cfg.workflow.name}`,
        body: `Created renewal deal ${rd.name} (${rd.arr.toLocaleString("en-US", { style: "currency", currency: "USD" })} ARR) and account manager QBR task 120 days before contract end.`,
        byId: null,
        contactIds: [cfg.contactId],
        companyIds: [cfg.companyId],
        dealIds: [rd.dealId],
      });
      touch(w, at, { companyId: cfg.companyId, contactIds: [cfg.contactId], dealId: rd.dealId });
      w.persona = cfg.ownerId;
      st.triggered = true;
      st.renewalDealId = rd.dealId;
      return;
    }

    case "ren.flagAtRiskAndQuote": {
      const cfg = getS4(pack);
      if (!cfg) return;
      const st = w.renewals["renewal-churn-risk"];
      if (!st.triggered || st.atRiskFlagged) return;
      const at = iso(a.at);
      const co = w.companies.find((c) => c.id === cfg.companyId);
      if (co) {
        const extra = (co.extra ?? []).filter((e) => e.label !== "Renewal Risk");
        extra.push({ label: "Renewal Risk", value: `At Risk (Health ${cfg.healthCard.score}/100)` });
        co.extra = extra;
      }
      const deal = w.deals.find((d) => d.id === cfg.renewalDeal.dealId);
      if (deal) {
        deal.stage = cfg.renewalDeal.quoteStageId;
        deal.lastActivityAt = at;
      }
      const quote = createRenewalQuote(w, {
        id: cfg.quote.quoteId,
        number: cfg.quote.number,
        title: cfg.quote.title,
        dealId: cfg.renewalDeal.dealId,
        companyId: cfg.companyId,
        contactId: cfg.contactId,
        ownerId: cfg.csmOwnerId,
        lineItems: cfg.quote.lineItems,
        discountPct: cfg.quote.retentionDiscountPct,
        origin: "Created from Account Health retention playbook",
        at: a.at,
      });
      addActivity(w, {
        at,
        type: "quote",
        title: `At-risk retention quote ${quote.number} created (${cfg.quote.retentionDiscountPct}% discount)`,
        body: `Flagged ${co?.name ?? "account"} as At Risk (Health Score ${cfg.healthCard.score}/100). Prepared retention renewal quote requiring Deal Desk approval (>${cfg.quote.approvalThresholdPct}%).`,
        byId: cfg.csmOwnerId,
        contactIds: [cfg.contactId],
        companyIds: [cfg.companyId],
        dealIds: [cfg.renewalDeal.dealId],
        linkPath: `/quotes/${quote.id}`,
        linkLabel: "Open renewal quote",
      });
      touch(w, at, { companyId: cfg.companyId, contactIds: [cfg.contactId], dealId: cfg.renewalDeal.dealId });
      st.atRiskFlagged = true;
      st.renewalQuoteId = quote.id;
      return;
    }

    case "ren.selectQbrSlot": {
      w.renewals["contract-renewal"].qbrSlotId = a.slotId;
      return;
    }

    case "ren.bookQbr": {
      const cfg = getI3(pack);
      if (!cfg) return;
      const st = w.renewals["contract-renewal"];
      if (!st.triggered || st.qbrBooked) return;
      const slotId = a.slotId ?? st.qbrSlotId ?? cfg.qbr.defaultSlotId;
      st.qbrSlotId = slotId;
      const slot = cfg.qbr.slots.find((s) => s.id === slotId) ?? cfg.qbr.slots[0];
      const at = iso(a.at);
      const deal = w.deals.find((d) => d.id === cfg.renewalDeal.dealId);
      if (deal) {
        deal.stage = cfg.renewalDeal.qbrStageId;
        deal.lastActivityAt = at;
      }
      addActivity(w, {
        at,
        type: "meeting",
        title: `QBR booked: ${cfg.qbr.meetingTitle}`,
        body: `${cfg.qbr.inboxOwnerName} confirmed ${slot.day} at ${slot.time} ${slot.tz} (${slot.location}). Renewal agenda & 15-user expansion synced to deal timeline.`,
        byId: cfg.ownerId,
        contactIds: [cfg.contactId],
        companyIds: [cfg.companyId],
        dealIds: [cfg.renewalDeal.dealId],
      });
      touch(w, at, { companyId: cfg.companyId, contactIds: [cfg.contactId], dealId: cfg.renewalDeal.dealId });
      st.qbrBooked = true;
      return;
    }

    case "ren.createContractQuote": {
      const cfg = getI3(pack);
      if (!cfg) return;
      const st = w.renewals["contract-renewal"];
      if (!st.qbrBooked || st.renewalQuoteId) return;
      const at = iso(a.at);
      const quote = createRenewalQuote(w, {
        id: cfg.quote.quoteId,
        number: cfg.quote.number,
        title: cfg.quote.title,
        dealId: cfg.renewalDeal.dealId,
        companyId: cfg.companyId,
        contactId: cfg.contactId,
        ownerId: cfg.ownerId,
        lineItems: cfg.quote.lineItems,
        discountPct: 0,
        origin: "Created from 120-day contract renewal deal",
        at: a.at,
      });
      addActivity(w, {
        at,
        type: "quote",
        title: `Renewal quote ${quote.number} created`,
        body: `Prepared ${cfg.psaSync.termLabel} renewal quote covering ${cfg.psaSync.renewedSeats} users and ${cfg.psaSync.renewedSites} sites (${quoteTotals(quote).total.toLocaleString("en-US", { style: "currency", currency: "USD" })} ARR).`,
        byId: cfg.ownerId,
        contactIds: [cfg.contactId],
        companyIds: [cfg.companyId],
        dealIds: [cfg.renewalDeal.dealId],
        linkPath: `/quotes/${quote.id}`,
        linkLabel: "Open renewal quote",
      });
      touch(w, at, { companyId: cfg.companyId, contactIds: [cfg.contactId], dealId: cfg.renewalDeal.dealId });
      st.renewalQuoteId = quote.id;
      return;
    }

    case "ren.verifyClosedRenewal": {
      const st = w.renewals["renewal-churn-risk"];
      if (!st.quoteAccepted) return;
      st.renewalVerified = true;
      return;
    }

    case "ren.syncPsa": {
      const cfg = getI3(pack);
      if (!cfg) return;
      const st = w.renewals["contract-renewal"];
      if (!st.quoteAccepted || st.psaSynced) return;
      const at = iso(a.at);
      const co = w.companies.find((c) => c.id === cfg.companyId);
      if (co) {
        const extra = (co.extra ?? []).filter((e) => e.label !== "PSA Contract End Date" && e.label !== "PSA Agreement");
        extra.push(
          { label: "PSA Agreement", value: `${cfg.psaSync.agreementId} (${cfg.psaSync.renewedSeats} users)` },
          { label: "PSA Contract End Date", value: cfg.psaSync.rolledEndDate.slice(0, 10) },
        );
        co.extra = extra;
        co.lastActivityAt = at;
      }
      addActivity(w, {
        at,
        type: "sync",
        title: `PSA Agreement ${cfg.psaSync.agreementId} rolled forward`,
        body: `Synced renewed ${cfg.psaSync.termLabel} contract end date and updated seat count (${cfg.psaSync.previousSeats} → ${cfg.psaSync.renewedSeats} users, ${cfg.psaSync.renewedArr.toLocaleString("en-US", { style: "currency", currency: "USD" })} ARR) back to ${cfg.psaSync.systemLabel}.`,
        byId: cfg.ownerId,
        contactIds: [cfg.contactId],
        companyIds: [cfg.companyId],
        dealIds: [cfg.renewalDeal.dealId],
      });
      touch(w, at, { companyId: cfg.companyId, contactIds: [cfg.contactId], dealId: cfg.renewalDeal.dealId });
      st.psaSynced = true;
      return;
    }
  }
}
