import { generateLines, isComplete, pruneSelections } from "@/demos/guided-quote/rules";
import { labelsOf } from "@/verticals/labels";
import type { Activity, ApprovalFilterId, Company, Contact, Deal, DiscountApprovalConfig, InboxThread, LineItem, Notification, Pack, Quote, Task } from "@/verticals/types";
import { approvalReasons, quoteTotals, unitDiscountPct } from "./quote-math";

/**
 * The world is everything a rep can change during a session: the seeded records plus demo state.
 * It is always rebuilt as seed + list of actions, so reset is "drop the list" and stepping back
 * is "replay a shorter list". Nothing here is ever sent to the server.
 */
export type World = {
  companies: Company[];
  contacts: Contact[];
  deals: Deal[];
  quotes: Quote[];
  tasks: Task[];
  notifications: Notification[];
  activities: Activity[];
  threads: InboxThread[];
  persona: string;
  /** View state a scripted step may need to set, such as the open tab on a record. */
  ui: Record<string, string>;
  /** One-way markers for "the rep has seen this", used to work out the current step. */
  flags: Record<string, true>;
  gq: { sel: Record<string, string>; quantity: number | null; needBy: string | null; lines: LineItem[]; quoteId: string | null };
  bo: { picked: string[]; quoteId: string | null; dealId: string | null };
  lc: { presetId: string; contactId: string; companyId: string; dealId: string | null; taskId: string | null; ownerId: string | null } | null;
  ed: { matches: Record<string, string>; deals: Record<string, string>; quotes: Record<string, string> };
  ap: { drafted: boolean; version: number; edits: Record<string, string>; sent: boolean };
  ca: {
    chatSent: boolean;
    chatMessage: string | null;
    chatMatched: boolean;
    chatVerified: boolean;
    chatResolved: boolean;
    emailSent: boolean;
    emailReplied: boolean;
    voiceCalled: boolean;
    voiceUnlocked: boolean;
    timelineReviewed: boolean;
    fraudHandedOff: boolean;
    ticketReviewed: boolean;
    repReplied: boolean;
    repReplyText: string | null;
    dashboardReviewed: boolean;
  };
  sa: {
    campaignOpened: boolean;
    calendarPlanned: boolean;
    approvedPostIds: string[];
    postEdits: Record<string, string>;
    statusReviewed: boolean;
    googleSeen: boolean;
    socialAdClicked: boolean;
    landingSeen: boolean;
    submitted: boolean;
    contactId: string | null;
    companyId: string | null;
    dealId: string | null;
    contactSeen: boolean;
    timelineSeen: boolean;
    followupSent: boolean;
    replies: Record<string, { text: string; at: string }>;
    insightsSeen: boolean;
  };
  /** What the rep has changed in the quote approval rule. Parts left unset are the pack's. */
  approvalRule: ApprovalRuleEdit;
  seq: number;
};

/** What the approval flow can ask of a step's approvers. The first is HubSpot's wording for every approver. */
export const APPROVERS_REQUIRED = ["All approvers", "Any approvers", "Sequential"];

export type ApprovalRuleEdit = { thresholdPct?: number; filters?: ApprovalFilterId[]; approverId?: string; required?: string };

/**
 * The quote approval rule in force: the pack's, with what the rep has changed in the approval workflow.
 * Everything that checks a quote against the rule reads this, so an edit shows at once.
 */
export function ruleOf(pack: Pack, w: Pick<World, "approvalRule">): DiscountApprovalConfig {
  const base = pack.demos.discountApproval;
  const { thresholdPct, filters, approverId } = w.approvalRule;
  return { ...base, thresholdPct: thresholdPct ?? base.thresholdPct, filters: filters ?? base.filters, approverId: approverId ?? base.approverId };
}

export type Action =
  | { t: "flag"; k: string }
  | { t: "ui"; k: string; v: string }
  | { t: "persona"; id: string }
  | { t: "approval.rule"; edit: ApprovalRuleEdit | null }
  | { t: "notif.read"; id: string }
  | { t: "task.toggle"; id: string }
  | { t: "log"; kind: "note" | "email" | "call" | "meeting" | "task"; text: string; contactIds: string[]; companyIds: string[]; dealIds: string[]; at: number }
  | { t: "gq.select"; field: string; value: string }
  | { t: "gq.quantity"; value: number }
  | { t: "gq.needBy"; value: string }
  | { t: "gq.generate" }
  | { t: "gq.createQuote"; at: number }
  | { t: "quote.discount"; id: string; pct: number }
  | { t: "quote.terms"; id: string; termsId: string }
  | { t: "quote.setLines"; id: string; lines: LineItem[] }
  | { t: "quote.create"; dealId: string; at: number }
  | { t: "quote.requestApproval"; id: string; at: number; note?: string }
  | { t: "quote.approve"; id: string; at: number; message?: string }
  | { t: "quote.requestChanges"; id: string; at: number; feedback: string }
  | { t: "quote.send"; id: string; at: number }
  | { t: "quote.accept"; id: string; at: number }
  | { t: "bo.pick"; sku: string }
  | { t: "bo.addToQuote"; at: number }
  | { t: "lc.submit"; presetId: string; at: number }
  | { t: "ed.open"; threadId: string }
  | { t: "ed.match"; threadId: string; lineId: string; sku: string }
  | { t: "ed.createDeal"; threadId: string; at: number }
  | { t: "ed.createQuote"; threadId: string; at: number }
  | { t: "ap.draft" }
  | { t: "ap.version"; v: number }
  | { t: "ap.edit"; memberId: string; text: string }
  | { t: "ap.send"; at: number }
  | { t: "ca.chatSend"; message?: string; at: number }
  | { t: "ca.chatMatch" }
  | { t: "ca.chatVerify" }
  | { t: "ca.chatResolve"; at: number }
  | { t: "ca.emailSend"; at: number }
  | { t: "ca.emailReply"; at: number }
  | { t: "ca.voiceCall"; at: number }
  | { t: "ca.voiceUnlock"; at: number }
  | { t: "ca.reviewTimeline" }
  | { t: "ca.fraudHandoff"; at: number }
  | { t: "ca.reviewTicket" }
  | { t: "ca.repReply"; text: string; at: number }
  | { t: "ca.reviewDashboard" }
  | { t: "sa.openCampaign" }
  | { t: "sa.planCalendar" }
  | { t: "sa.editPost"; postId: string; copy: string }
  | { t: "sa.approvePost"; postId: string }
  | { t: "sa.approveAllDrafts" }
  | { t: "sa.reviewStatus" }
  | { t: "sa.seenGoogle" }
  | { t: "sa.clickSocialAd" }
  | { t: "sa.seenLanding" }
  | { t: "sa.submitForm"; at: number; overrides?: { firstName?: string; lastName?: string; email?: string; companyName?: string; rolesNeeded?: string; notes?: string } }
  | { t: "sa.seenContact" }
  | { t: "sa.seenTimeline" }
  | { t: "sa.sendFollowup"; at: number }
  | { t: "sa.replyInbox"; threadId: string; text: string; at: number }
  | { t: "sa.seenInsights" };

export function seedWorld(pack: Pack): World {
  return {
    companies: pack.companies,
    contacts: pack.contacts,
    deals: pack.deals,
    quotes: pack.quotes,
    tasks: pack.tasks,
    notifications: pack.notifications,
    activities: pack.activities,
    threads: pack.threads,
    persona: pack.defaultPersonaId,
    ui: {},
    flags: {},
    gq: { sel: {}, quantity: null, needBy: null, lines: [], quoteId: null },
    bo: { picked: [], quoteId: null, dealId: null },
    lc: null,
    ed: { matches: {}, deals: {}, quotes: {} },
    ap: { drafted: false, version: 0, edits: {}, sent: false },
    ca: {
      chatSent: false,
      chatMessage: null,
      chatMatched: false,
      chatVerified: false,
      chatResolved: false,
      emailSent: false,
      emailReplied: false,
      voiceCalled: false,
      voiceUnlocked: false,
      timelineReviewed: false,
      fraudHandedOff: false,
      ticketReviewed: false,
      repReplied: false,
      repReplyText: null,
      dashboardReviewed: false,
    },
    sa: {
      campaignOpened: false,
      calendarPlanned: false,
      approvedPostIds: [],
      postEdits: {},
      statusReviewed: false,
      googleSeen: false,
      socialAdClicked: false,
      landingSeen: false,
      submitted: false,
      contactId: null,
      companyId: null,
      dealId: null,
      contactSeen: false,
      timelineSeen: false,
      followupSent: false,
      replies: {},
      insightsSeen: false,
    },
    approvalRule: {},
    seq: 0,
  };
}

const iso = (ms: number) => new Date(ms).toISOString();
const DAY = 86_400_000;

function addActivity(w: World, activity: Omit<Activity, "id">): void {
  w.seq += 1;
  w.activities.unshift({ id: `ac-new-${w.seq}`, ...activity });
}

function touch(w: World, at: string, ids: { companyId?: string | null; contactIds?: string[]; dealId?: string | null }): void {
  const company = ids.companyId ? w.companies.find((c) => c.id === ids.companyId) : undefined;
  if (company) company.lastActivityAt = at;
  for (const id of ids.contactIds ?? []) {
    const contact = w.contacts.find((c) => c.id === id);
    if (contact) contact.lastActivityAt = at;
  }
  const deal = ids.dealId ? w.deals.find((d) => d.id === ids.dealId) : undefined;
  if (deal) deal.lastActivityAt = at;
}

const clampPct = (pct: number, steps = 10) => Math.min(60, Math.max(0, Math.round((Number(pct) || 0) * steps) / steps));

/** A quote's name, as it reads in notifications and activities. */
export const quoteName = (quote: Pick<Quote, "number" | "title">) => `${quote.number}: ${quote.title}`;

/** The id the next quote created from a deal's Quotes card will get. */
export function nextDealQuoteId(w: Pick<World, "quotes">, dealId: string): string {
  const prefix = `q-${dealId}-`;
  return `${prefix}${w.quotes.filter((q) => q.id.startsWith(prefix)).length + 1}`;
}

function nextQuoteNumber(w: World): string {
  const max = w.quotes.reduce((m, q) => Math.max(m, Number(q.number.replace(/\D/g, "")) || 0), 0);
  return `Q-${max + 1}`;
}

function newQuote(w: World, input: { id: string; title: string; dealId: string; companyId: string; contactId: string; lineItems: LineItem[]; origin: string; at: number }): Quote {
  const quote: Quote = {
    id: input.id,
    number: nextQuoteNumber(w),
    title: input.title,
    dealId: input.dealId,
    companyId: input.companyId,
    contactId: input.contactId,
    ownerId: w.persona,
    status: "Draft",
    lineItems: input.lineItems.map((l) => ({ ...l })),
    discountPct: 0,
    createdAt: iso(input.at),
    validUntil: iso(input.at + 30 * DAY),
    origin: input.origin,
    isNew: true,
  };
  w.quotes.unshift(quote);
  addActivity(w, {
    at: quote.createdAt,
    type: "quote",
    title: `Quote ${quote.number} created`,
    body: `${input.origin}. ${quote.lineItems.length} line items.`,
    byId: w.persona,
    contactIds: [input.contactId],
    companyIds: [input.companyId],
    dealIds: [input.dealId],
    linkPath: `/quotes/${quote.id}`,
    linkLabel: "View quote",
  });
  touch(w, quote.createdAt, { companyId: input.companyId, contactIds: [input.contactId], dealId: input.dealId });
  return quote;
}

/** Applies one action to a world that is safe to mutate. Deterministic: timestamps come from the action. */
export function mutate(w: World, a: Action, pack: Pack): void {
  switch (a.t) {
    case "flag":
      w.flags[a.k] = true;
      return;
    case "ui":
      w.ui[a.k] = a.v;
      return;
    case "persona": {
      if (!pack.personas.some((p) => p.id === a.id)) return;
      w.persona = a.id;
      // Playing the second person is a demo step in its own right. A request stays with the approver it was sent to.
      const request = w.quotes.find((q) => q.id === pack.demos.discountApproval.quoteId)?.approval;
      if (request && a.id === request.approverId) w.flags["da.asApprover"] = true;
      return;
    }
    case "approval.rule": {
      // Null puts the pack's rule back. Requests already sent keep their approver and their reasons.
      if (!a.edit) {
        w.approvalRule = {};
        return;
      }
      const base = pack.demos.discountApproval;
      const { thresholdPct, filters, approverId, required } = a.edit;
      const next = { ...w.approvalRule };
      if (thresholdPct !== undefined && Number.isFinite(thresholdPct)) next.thresholdPct = Math.min(100, Math.max(0, Math.round(thresholdPct * 100) / 100));
      if (filters) next.filters = (["discount", "floor", "terms"] as const).filter((id) => filters.includes(id) && (id !== "terms" || Boolean(base.terms)));
      if (approverId && pack.personas.some((p) => p.id === approverId)) next.approverId = approverId;
      if (required && APPROVERS_REQUIRED.includes(required)) next.required = required;
      w.approvalRule = next;
      return;
    }
    case "notif.read": {
      const n = w.notifications.find((x) => x.id === a.id);
      if (n) n.read = true;
      return;
    }
    case "task.toggle": {
      const task = w.tasks.find((x) => x.id === a.id);
      if (task) task.status = task.status === "open" ? "done" : "open";
      return;
    }
    case "log": {
      const labels = { note: "Note", email: "Email logged", call: "Call logged", meeting: "Meeting logged", task: "Task created" };
      const at = iso(a.at);
      addActivity(w, { at, type: a.kind, title: labels[a.kind], body: a.text, byId: w.persona, contactIds: a.contactIds, companyIds: a.companyIds, dealIds: a.dealIds });
      touch(w, at, { companyId: a.companyIds[0], contactIds: a.contactIds, dealId: a.dealIds[0] });
      return;
    }

    // ----- Guided quote -----
    case "gq.select": {
      const config = pack.demos.guidedQuote;
      w.gq.sel = pruneSelections(config, { ...w.gq.sel, [a.field]: a.value });
      w.gq.lines = [];
      return;
    }
    case "gq.quantity":
      w.gq.quantity = a.value;
      w.gq.lines = [];
      return;
    case "gq.needBy":
      w.gq.needBy = a.value;
      return;
    case "gq.generate": {
      const config = pack.demos.guidedQuote;
      if (!isComplete(config, w.gq.sel, w.gq.quantity, w.gq.needBy)) return;
      w.gq.lines = generateLines(config, w.gq.sel, w.gq.quantity!);
      return;
    }
    case "gq.createQuote": {
      const config = pack.demos.guidedQuote;
      const deal = w.deals.find((d) => d.id === config.dealId);
      if (!deal || w.gq.lines.length === 0 || w.gq.quoteId) return;
      const quote = newQuote(w, {
        id: "q-guided",
        title: config.quoteTitle,
        dealId: deal.id,
        companyId: deal.companyId,
        contactId: config.contactId,
        lineItems: w.gq.lines,
        origin: "Created from Guided quote",
        at: a.at,
      });
      deal.lineItems = quote.lineItems.map((l) => ({ ...l }));
      deal.amount = quoteTotals(quote).total;
      w.gq.quoteId = quote.id;
      return;
    }

    // ----- Quotes and discount approval -----
    case "quote.discount": {
      const quote = w.quotes.find((q) => q.id === a.id);
      if (!quote || quote.status === "Sent" || quote.status === "Accepted") return;
      const pct = clampPct(a.pct);
      if (pct === quote.discountPct && quote.lineItems.every((l) => l.discountPct === undefined)) return;
      quote.discountPct = pct;
      for (const l of quote.lineItems) delete l.discountPct;
      // Changing the discount after a request or an approval sends the quote back to draft.
      quote.status = "Draft";
      delete quote.approval;
      return;
    }
    case "quote.terms": {
      const quote = w.quotes.find((q) => q.id === a.id);
      const terms = pack.demos.discountApproval.terms;
      if (!quote || !terms || quote.status === "Sent" || quote.status === "Accepted") return;
      if (!terms.options.some((o) => o.id === a.termsId) || a.termsId === (quote.termsId ?? terms.defaultId)) return;
      quote.termsId = a.termsId;
      quote.status = "Draft";
      delete quote.approval;
      return;
    }
    case "quote.create": {
      const deal = w.deals.find((d) => d.id === a.dealId);
      if (!deal) return;
      newQuote(w, { id: nextDealQuoteId(w, deal.id), title: deal.name, dealId: deal.id, companyId: deal.companyId, contactId: deal.contactIds[0] ?? "", lineItems: deal.lineItems, origin: "Created from the deal", at: a.at });
      return;
    }
    case "quote.setLines": {
      const quote = w.quotes.find((q) => q.id === a.id);
      if (!quote || quote.status === "Sent" || quote.status === "Accepted") return;
      // What the line item editor saves: the whole list, so lines can be added, cloned, removed, and repriced in one step.
      const next: LineItem[] = a.lines
        .filter((l) => l && String(l.name ?? "").trim())
        .map((l) => ({
          ...l,
          sku: String(l.sku ?? "").trim(),
          name: String(l.name).trim(),
          qty: Math.max(1, Math.round(Number(l.qty) || 1)),
          unitPrice: Math.max(0, Math.round((Number(l.unitPrice) || 0) * 100) / 100),
          unitCost: Math.max(0, Math.round((Number(l.unitCost) || 0) * 100) / 100),
          leadDays: Math.max(0, Math.round(Number(l.leadDays) || 0)),
          discountPct: clampPct(l.discountPct ?? 0, 100),
        }));
      const fields = ["sku", "name", "description", "qty", "unitPrice", "unitCost", "leadDays", "timing", "recurring"] as const;
      const unchanged =
        next.length === quote.lineItems.length &&
        quote.lineItems.every((l, i) => unitDiscountPct(quote, l) === next[i].discountPct && fields.every((f) => l[f] === next[i][f]));
      if (unchanged) return;
      quote.lineItems = next;
      if (next.every((l) => l.discountPct === next[0].discountPct)) {
        // One discount on every line reads as the quote's discount.
        quote.discountPct = next[0]?.discountPct ?? 0;
        for (const l of next) delete l.discountPct;
      } else {
        quote.discountPct = Math.round(quoteTotals(quote).discountPct * 10) / 10;
      }
      quote.status = "Draft";
      delete quote.approval;
      return;
    }
    case "quote.requestApproval": {
      const quote = w.quotes.find((q) => q.id === a.id);
      const rule = ruleOf(pack, w);
      if (!quote || (quote.status !== "Draft" && quote.status !== "Changes requested")) return;
      const reasons = approvalReasons(quote, rule);
      if (reasons.length === 0) return;
      const at = iso(a.at);
      const requester = pack.personas.find((p) => p.id === w.persona);
      const who = requester?.name ?? "A rep";
      const name = quoteName(quote);
      const note = a.note?.trim() || undefined;
      quote.status = "Pending approval";
      quote.approval = { status: "pending", requestedAt: at, requestedById: w.persona, approverId: rule.approverId, reasons, discountPct: quote.discountPct, ...(note ? { note } : {}) };
      // A second request replaces what the first round left in the bell.
      const stale = [`nt-approval-${quote.id}`, `nt-approved-${quote.id}`, `nt-changes-${quote.id}`];
      w.notifications = w.notifications.filter((n) => !stale.includes(n.id));
      w.notifications.unshift({
        id: `nt-approval-${quote.id}`,
        personaId: rule.approverId,
        at,
        kind: "approval",
        title: `${who} has requested your approval for "${name}"`,
        body: `${who} has requested approval to publish the quote "${name}". Additional notes: ${note ?? `${reasons.join(". ")}.`}`,
        path: `/quotes/${quote.id}`,
        read: false,
      });
      addActivity(w, {
        at,
        type: "quote",
        title: "Quote approval requested",
        body: `Quote ${name} was submitted for approval by ${who}. ${reasons.join(". ")}.`,
        byId: w.persona,
        contactIds: [quote.contactId],
        companyIds: [quote.companyId],
        dealIds: [quote.dealId],
        linkPath: `/quotes/${quote.id}`,
        linkLabel: "View quote",
      });
      return;
    }
    case "quote.approve": {
      const quote = w.quotes.find((q) => q.id === a.id);
      if (!quote || quote.status !== "Pending approval" || !quote.approval) return;
      const at = iso(a.at);
      const approver = pack.personas.find((p) => p.id === quote.approval!.approverId);
      const who = approver?.name ?? "The approver";
      const name = quoteName(quote);
      const feedback = a.message?.trim() || undefined;
      quote.status = "Approved";
      quote.approval = { ...quote.approval, status: "approved", decidedAt: at, ...(feedback ? { feedback } : {}) };
      const request = w.notifications.find((n) => n.id === `nt-approval-${quote.id}`);
      if (request) request.read = true;
      w.notifications.unshift({
        id: `nt-approved-${quote.id}`,
        personaId: quote.approval.requestedById,
        at,
        kind: "approved",
        title: `${who} has approved "${name}"`,
        body: `${who} has approved your request to publish the quote "${name}".${feedback ? ` ${feedback}` : ""}`,
        path: `/quotes/${quote.id}`,
        read: false,
      });
      addActivity(w, {
        at,
        type: "quote",
        title: "Quote approved",
        body: `Quote ${name} was approved by ${who}.`,
        byId: quote.approval.approverId,
        contactIds: [quote.contactId],
        companyIds: [quote.companyId],
        dealIds: [quote.dealId],
        linkPath: `/quotes/${quote.id}`,
        linkLabel: "View quote",
      });
      return;
    }
    case "quote.requestChanges": {
      const quote = w.quotes.find((q) => q.id === a.id);
      if (!quote || quote.status !== "Pending approval" || !quote.approval) return;
      const at = iso(a.at);
      const approver = pack.personas.find((p) => p.id === quote.approval!.approverId);
      const who = approver?.name ?? "The approver";
      const name = quoteName(quote);
      const feedback = a.feedback.trim();
      quote.status = "Changes requested";
      quote.approval = { ...quote.approval, status: "changes_requested", decidedAt: at, ...(feedback ? { feedback } : {}) };
      const request = w.notifications.find((n) => n.id === `nt-approval-${quote.id}`);
      if (request) request.read = true;
      w.notifications.unshift({
        id: `nt-changes-${quote.id}`,
        personaId: quote.approval.requestedById,
        at,
        kind: "approved",
        title: `${who} has requested changes to "${name}"`,
        body: `${who} has requested changes before the quote "${name}" can be published.${feedback ? ` Reason: ${feedback}` : ""}`,
        path: `/quotes/${quote.id}`,
        read: false,
      });
      addActivity(w, {
        at,
        type: "quote",
        title: "Quote changes requested",
        body: `Changes to quote ${name} were requested by ${who}.${feedback ? ` ${feedback}` : ""}`,
        byId: quote.approval.approverId,
        contactIds: [quote.contactId],
        companyIds: [quote.companyId],
        dealIds: [quote.dealId],
        linkPath: `/quotes/${quote.id}`,
        linkLabel: "View quote",
      });
      return;
    }
    case "quote.send": {
      const quote = w.quotes.find((q) => q.id === a.id);
      // A quote sent back for changes can go out once the rule in force no longer asks for approval.
      if (!quote || (quote.status !== "Draft" && quote.status !== "Approved" && quote.status !== "Changes requested")) return;
      if (approvalReasons(quote, ruleOf(pack, w)).length > 0 && quote.status !== "Approved") return;
      const at = iso(a.at);
      const contact = w.contacts.find((c) => c.id === quote.contactId);
      const totals = quoteTotals(quote);
      quote.status = "Sent";
      quote.sentAt = at;
      const deal = w.deals.find((d) => d.id === quote.dealId);
      if (deal) {
        deal.amount = totals.total;
        deal.lineItems = quote.lineItems.map((l) => ({ ...l }));
        const stage = pack.stages.find((s) => s.id === deal.stage);
        if (!stage?.closed && deal.stage !== "negotiation") deal.stage = "quote-sent";
      }
      addActivity(w, {
        at,
        type: "quote",
        title: `Quote ${quote.number} sent`,
        body: `Sent to ${contact ? `${contact.firstName} ${contact.lastName}` : "the buyer"}. Total ${totals.total.toLocaleString("en-US", { style: "currency", currency: "USD" })}.`,
        byId: w.persona,
        contactIds: [quote.contactId],
        companyIds: [quote.companyId],
        dealIds: [quote.dealId],
        linkPath: `/quotes/${quote.id}`,
        linkLabel: "View quote",
      });
      touch(w, at, { companyId: quote.companyId, contactIds: [quote.contactId], dealId: quote.dealId });
      return;
    }
    case "quote.accept": {
      const quote = w.quotes.find((q) => q.id === a.id);
      if (!quote || quote.status !== "Sent") return;
      const at = iso(a.at);
      const contact = w.contacts.find((c) => c.id === quote.contactId);
      quote.status = "Accepted";
      quote.acceptedAt = at;
      addActivity(w, {
        at,
        type: "quote",
        title: `Quote ${quote.number} accepted`,
        body: `${contact ? `${contact.firstName} ${contact.lastName}` : "The buyer"} accepted the quote on the quote page.`,
        byId: null,
        contactIds: [quote.contactId],
        companyIds: [quote.companyId],
        dealIds: [quote.dealId],
        linkPath: `/quotes/${quote.id}`,
        linkLabel: "View quote",
      });
      touch(w, at, { companyId: quote.companyId, contactIds: [quote.contactId], dealId: quote.dealId });
      return;
    }

    // ----- Back-office data -----
    case "bo.pick":
      w.bo.picked = w.bo.picked.includes(a.sku) ? w.bo.picked.filter((s) => s !== a.sku) : [...w.bo.picked, a.sku];
      return;
    case "bo.addToQuote": {
      const config = pack.demos.backOffice;
      const wording = labelsOf(pack).backOffice.add;
      if (w.bo.quoteId || w.bo.picked.length === 0) return;
      const at = iso(a.at);
      const lineItems: LineItem[] = config.stock
        .filter((s) => w.bo.picked.includes(s.sku))
        .map((s) => ({
          sku: s.sku,
          name: s.name,
          description: wording.lineNote,
          qty: s.usualQty,
          unitPrice: s.contractPrice,
          unitCost: s.unitCost,
          leadDays: s.leadDays,
          ...(s.timing ? { timing: s.timing } : {}),
          ...(s.recurring ? { recurring: true } : {}),
        }));
      const deal: Deal = {
        id: "dl-reorder",
        name: config.dealName,
        companyId: config.companyId,
        contactIds: [config.contactId],
        ownerId: w.persona,
        stage: "qualified",
        amount: lineItems.reduce((sum, l) => sum + l.qty * l.unitPrice, 0),
        closeDate: iso(a.at + 14 * DAY),
        createdAt: at,
        lastActivityAt: at,
        type: wording.dealType,
        lineItems,
        source: wording.origin,
        isNew: true,
      };
      w.deals.unshift(deal);
      const quote = newQuote(w, { id: "q-reorder", title: config.quoteTitle, dealId: deal.id, companyId: config.companyId, contactId: config.contactId, lineItems, origin: wording.origin, at: a.at });
      w.bo.quoteId = quote.id;
      w.bo.dealId = deal.id;
      return;
    }

    // ----- Lead capture -----
    case "lc.submit": {
      const config = pack.demos.leadCapture;
      const preset = config.presets.find((p) => p.id === a.presetId);
      if (!preset || w.lc) return;
      const at = iso(a.at);
      const owner = preset.route.ownerId;
      const fullName = `${preset.form.firstName} ${preset.form.lastName}`;
      const workflowName = pack.workflows.find((x) => x.id === config.workflowId)?.name ?? "Lead routing";
      const company: Company = {
        id: "co-lead",
        name: preset.form.company,
        domain: preset.company.domain,
        industry: preset.company.industry,
        type: preset.company.type,
        city: preset.company.city,
        state: preset.company.state,
        employees: preset.company.employees,
        revenue: preset.company.revenue || null,
        phone: preset.company.phone,
        ownerId: owner,
        lifecycle: owner ? "Lead" : "Subscriber",
        createdAt: at,
        lastActivityAt: at,
        description: preset.company.description,
        territory: preset.company.territory,
        enrichedAt: at,
        ...(preset.company.extra ? { extra: preset.company.extra } : {}),
        isNew: true,
      };
      const contact: Contact = {
        id: "ct-lead",
        firstName: preset.form.firstName,
        lastName: preset.form.lastName,
        email: preset.form.email,
        phone: preset.form.phone,
        title: preset.form.title,
        companyId: company.id,
        ownerId: owner,
        lifecycle: owner ? "Lead" : "Subscriber",
        leadStatus: owner ? "New" : "Nurture",
        createdAt: at,
        lastActivityAt: at,
        source: `${config.site.formTitle} form`,
        score: preset.score,
        ...(preset.contactExtra ? { extra: preset.contactExtra } : {}),
        isNew: true,
      };
      w.companies.unshift(company);
      w.contacts.unshift(contact);
      const ids = { contactIds: [contact.id], companyIds: [company.id] };
      let dealId: string | null = null;
      let taskId: string | null = null;

      if (preset.task && owner) {
        taskId = "tk-lead";
        w.tasks.unshift({
          id: taskId,
          title: preset.task.title,
          type: preset.task.title.startsWith("Call") ? "Call" : "Email",
          priority: preset.route.branchId === "field" ? "High" : "Medium",
          dueAt: iso(a.at + preset.task.dueInMinutes * 60_000),
          ownerId: owner,
          status: "open",
          contactId: contact.id,
          companyId: company.id,
          notes: preset.task.notes,
          isNew: true,
        });
      }
      if (preset.deal && owner) {
        dealId = "dl-lead";
        w.deals.unshift({
          id: dealId,
          name: preset.deal.name,
          companyId: company.id,
          contactIds: [contact.id],
          ownerId: owner,
          stage: config.dealStage,
          amount: preset.deal.amount,
          closeDate: iso(a.at + 45 * DAY),
          createdAt: at,
          lastActivityAt: at,
          type: "New business",
          lineItems: [],
          source: `${workflowName} workflow`,
          isNew: true,
        });
        const task = w.tasks.find((t) => t.id === taskId);
        if (task) task.dealId = dealId;
      }
      if (preset.alert && owner) {
        w.notifications.unshift({
          id: "nt-lead",
          personaId: owner,
          at,
          kind: "lead",
          title: "New lead assigned to you",
          body: `${fullName}, ${preset.form.company}. Score ${preset.score}. ${preset.task?.title ?? ""}`.trim(),
          path: `/contacts/${contact.id}`,
          read: false,
          slack: preset.alert,
        });
      }

      const ownerName = pack.personas.find((p) => p.id === owner)?.name;
      // Newest first on the timeline: the workflow's last step is added last.
      addActivity(w, { at, type: "form", title: `Form submission: ${config.site.formTitle}`, body: `${preset.form.interest}. "${preset.form.message}"`, byId: null, ...ids });
      addActivity(w, { at, type: "sync", title: "Company enriched", body: `${preset.company.industry}, ${preset.company.employees.toLocaleString("en-US")} employees, ${preset.company.city}, ${preset.company.state}.${(preset.company.extra ?? []).map((e) => ` ${e.label}: ${e.value}.`).join("")}`, byId: null, ...ids });
      addActivity(w, { at, type: "lifecycle", title: `Lead score set to ${preset.score}`, body: preset.reasons.filter((r) => r.points > 0).map((r) => r.label).join(", ") || "No scoring criteria met.", byId: null, ...ids });
      addActivity(w, {
        at,
        type: "workflow",
        title: `Enrolled in workflow: ${workflowName}`,
        body: `${preset.route.summary}.`,
        byId: null,
        ...ids,
        linkPath: `/workflows/${config.workflowId}`,
        linkLabel: "View in workflow",
      });
      if (dealId) addActivity(w, { at, type: "deal", title: "Deal created by workflow", body: `${preset.deal!.name} was created in ${pack.stages.find((s) => s.id === config.dealStage)?.label ?? "the first stage"}.`, byId: null, ...ids, dealIds: [dealId] });
      if (taskId) addActivity(w, { at, type: "task", title: `Task assigned to ${ownerName}`, body: preset.task!.title, byId: null, ...ids, ...(dealId ? { dealIds: [dealId] } : {}) });

      w.lc = { presetId: preset.id, contactId: contact.id, companyId: company.id, dealId, taskId, ownerId: owner };
      return;
    }

    // ----- Email to deal -----
    case "ed.open": {
      const thread = w.threads.find((t) => t.id === a.threadId);
      if (!thread) return;
      thread.unread = false;
      w.ui["inbox.thread"] = thread.id;
      return;
    }
    case "ed.match":
      w.ed.matches[`${a.threadId}:${a.lineId}`] = a.sku;
      return;
    case "ed.createDeal": {
      const thread = w.threads.find((t) => t.id === a.threadId);
      const parsed = thread?.parsed;
      if (!thread || !parsed || w.ed.deals[thread.id] || !thread.companyId || !thread.contactId) return;
      const lineItems: LineItem[] = [];
      for (const l of parsed.lines) {
        const sku = l.sku ?? w.ed.matches[`${thread.id}:${l.id}`];
        const product = pack.products.find((p) => p.sku === sku);
        if (!product) return; // An unmatched line blocks deal creation.
        const unitPrice = l.prices?.[product.sku] ?? product.price;
        lineItems.push({ sku: product.sku, name: product.name, qty: l.qty, unitPrice, unitCost: unitPrice === product.price ? product.cost : Math.round((unitPrice * product.cost) / (product.price || 1)), leadDays: product.leadDays, ...(product.timing ? { timing: product.timing } : {}), ...(product.recurring ? { recurring: true } : {}) });
      }
      const at = iso(a.at);
      const forCompany = parsed.dealFor?.companyId ?? thread.companyId;
      const forContacts = parsed.dealFor?.contactIds ?? [thread.contactId];
      const deal: Deal = {
        id: `dl-${thread.id}`,
        name: parsed.dealName,
        companyId: forCompany,
        contactIds: forContacts,
        ownerId: w.persona,
        stage: pack.demos.emailToDeal.dealStage,
        amount: lineItems.reduce((sum, l) => sum + l.qty * l.unitPrice, 0),
        closeDate: iso(a.at + parsed.closeInDays * DAY),
        createdAt: at,
        lastActivityAt: at,
        type: labelsOf(pack).email.dealType,
        lineItems,
        source: "Created from an email",
        isNew: true,
      };
      w.deals.unshift(deal);
      const ids = { contactIds: forContacts, companyIds: [forCompany], dealIds: [deal.id] };
      addActivity(w, { at: thread.at, type: "email", title: `Email from ${thread.from.name}: ${thread.subject}`, body: thread.preview, byId: null, ...ids, ...(thread.attachment ? { attachment: thread.attachment.name } : {}) });
      addActivity(w, { at, type: "deal", title: "Deal created from email", body: `${lineItems.length} line items from the parsed request. Company and contact associated.`, byId: w.persona, ...ids });
      touch(w, at, { companyId: forCompany, contactIds: forContacts });
      w.ed.deals[thread.id] = deal.id;
      return;
    }
    case "ed.createQuote": {
      const dealId = w.ed.deals[a.threadId];
      const deal = w.deals.find((d) => d.id === dealId);
      if (!deal || w.ed.quotes[a.threadId]) return;
      const quote = newQuote(w, { id: `q-${a.threadId}`, title: deal.name, dealId: deal.id, companyId: deal.companyId, contactId: deal.contactIds[0], lineItems: deal.lineItems, origin: "Created from the deal", at: a.at });
      w.ed.quotes[a.threadId] = quote.id;
      return;
    }

    // ----- AI prospecting -----
    case "ap.draft":
      w.ap.drafted = true;
      return;
    case "ap.version":
      w.ap.version = ((a.v % 3) + 3) % 3;
      w.ap.edits = {};
      return;
    case "ap.edit":
      w.ap.edits[a.memberId] = a.text;
      return;
    case "ap.send": {
      const config = pack.demos.aiProspecting;
      if (!w.ap.drafted || w.ap.sent) return;
      const at = iso(a.at);
      const contactIds: string[] = [];
      // Send order matches the buying group; the timeline shows newest first.
      for (const member of config.buyingGroup) {
        let contactId = member.contactId;
        if (!contactId) {
          const [firstName, ...rest] = member.name.split(" ");
          contactId = `ct-${member.id}`;
          w.contacts.unshift({
            id: contactId,
            firstName,
            lastName: rest.join(" "),
            email: member.email,
            phone: "",
            title: member.title,
            companyId: config.companyId,
            ownerId: w.persona,
            lifecycle: "Lead",
            leadStatus: "Attempted to contact",
            createdAt: at,
            lastActivityAt: at,
            source: "Prospecting agent",
            isNew: true,
          });
        }
        contactIds.push(contactId);
        const draft = config.drafts[member.id]?.[w.ap.version];
        addActivity(w, {
          at,
          type: "email",
          title: `Email to ${member.name}: ${draft?.subject ?? "Outreach"}`,
          body: (w.ap.edits[member.id] ?? draft?.body ?? "").split("\n\n").slice(0, 2).join(" "),
          byId: w.persona,
          contactIds: [contactId],
          companyIds: [config.companyId],
        });
      }
      w.tasks.unshift({
        id: "tk-prospecting",
        title: config.followUp.title,
        type: "Call",
        priority: "Medium",
        dueAt: iso(a.at + config.followUp.dueInDays * DAY),
        ownerId: w.persona,
        status: "open",
        companyId: config.companyId,
        contactId: contactIds[0],
        isNew: true,
      });
      touch(w, at, { companyId: config.companyId, contactIds });
      w.ap.sent = true;
      return;
    }

    // ----- Customer agent (fintech omnichannel) -----
    case "ca.chatSend": {
      const cfg = pack.demos.customerAgent;
      if (!cfg) return;
      w.ca.chatSent = true;
      w.ca.chatMessage = a.message?.trim() || cfg.chatCase.customerQuestion;
      w.ui["service.case"] = cfg.chatCase.id;
      return;
    }
    case "ca.chatMatch": {
      const cfg = pack.demos.customerAgent;
      if (!cfg) return;
      w.ca.chatSent = true;
      w.ca.chatMatched = true;
      w.ui["service.case"] = cfg.chatCase.id;
      return;
    }
    case "ca.chatVerify": {
      const cfg = pack.demos.customerAgent;
      if (!cfg) return;
      w.ca.chatSent = true;
      w.ca.chatMatched = true;
      w.ca.chatVerified = true;
      w.ui["service.case"] = cfg.chatCase.id;
      return;
    }
    case "ca.chatResolve": {
      const cfg = pack.demos.customerAgent;
      if (!cfg || w.ca.chatResolved) return;
      const at = iso(a.at);
      w.ca.chatSent = true;
      w.ca.chatMatched = true;
      w.ca.chatVerified = true;
      w.ca.chatResolved = true;
      w.ui["service.case"] = cfg.chatCase.id;
      addActivity(w, {
        at,
        type: "chat",
        title: "Chat resolved by Breeze Customer Agent — Pending transfer TXN-884192",
        body: `Verified authorized signer (${cfg.chatCase.securityCheck.auditRef}). Explained 4:00 PM ET ACH cutoff and tomorrow 8:30 AM ET settlement for $48,500 transfer to Hopworks Fabrication LLC. Logged as autonomously resolved.`,
        byId: null,
        contactIds: [cfg.chatCase.contactId],
        companyIds: [cfg.chatCase.companyId],
        linkPath: "/service",
        linkLabel: "Open in Help Desk",
      });
      touch(w, at, { companyId: cfg.chatCase.companyId, contactIds: [cfg.chatCase.contactId] });
      return;
    }
    case "ca.emailSend": {
      const cfg = pack.demos.customerAgent;
      if (!cfg) return;
      w.ca.emailSent = true;
      w.ui["service.case"] = cfg.emailCase.id;
      return;
    }
    case "ca.emailReply": {
      const cfg = pack.demos.customerAgent;
      if (!cfg || w.ca.emailReplied) return;
      const at = iso(a.at);
      w.ca.emailSent = true;
      w.ca.emailReplied = true;
      w.ui["service.case"] = cfg.emailCase.id;
      addActivity(w, {
        at,
        type: "email",
        title: `Email reply & ticket ${cfg.emailCase.ticketNumber} opened — Card dispute (•••• ${cfg.emailCase.card.last4})`,
        body: `Breeze Customer Agent matched ${cfg.emailCase.fromName}, placed a temporary freeze on card •••• ${cfg.emailCase.card.last4}, replied with dispute steps for $1,842.50 at ${cfg.emailCase.card.merchant}, and opened ${cfg.emailCase.ticketNumber}.`,
        byId: null,
        contactIds: [cfg.emailCase.contactId],
        companyIds: [cfg.emailCase.companyId],
        linkPath: "/service",
        linkLabel: "Open in Help Desk",
      });
      touch(w, at, { companyId: cfg.emailCase.companyId, contactIds: [cfg.emailCase.contactId] });
      return;
    }
    case "ca.voiceCall": {
      const cfg = pack.demos.customerAgent;
      if (!cfg) return;
      w.ca.voiceCalled = true;
      w.ui["service.case"] = cfg.voiceCase.id;
      return;
    }
    case "ca.voiceUnlock": {
      const cfg = pack.demos.customerAgent;
      if (!cfg || w.ca.voiceUnlocked) return;
      const at = iso(a.at);
      w.ca.voiceCalled = true;
      w.ca.voiceUnlocked = true;
      w.ui["service.case"] = cfg.voiceCase.id;
      const transcriptText = cfg.voiceCase.transcript.map((line) => `[${line.time}] ${line.name}: ${line.text}`).join("\n");
      addActivity(w, {
        at,
        type: "call",
        title: `Voice call transcribed & resolved — Account unlock (${cfg.voiceCase.duration})`,
        body: `${cfg.voiceCase.timelineSummary}\n\nTranscript:\n${transcriptText}`,
        byId: null,
        contactIds: [cfg.voiceCase.contactId],
        companyIds: [cfg.voiceCase.companyId],
        linkPath: "/service",
        linkLabel: "View in Help Desk",
      });
      touch(w, at, { companyId: cfg.voiceCase.companyId, contactIds: [cfg.voiceCase.contactId] });
      return;
    }
    case "ca.reviewTimeline": {
      const cfg = pack.demos.customerAgent;
      if (!cfg) return;
      w.ca.timelineReviewed = true;
      w.ui["service.case"] = cfg.fraudCase.id;
      return;
    }
    case "ca.fraudHandoff": {
      const cfg = pack.demos.customerAgent;
      if (!cfg || w.ca.fraudHandedOff) return;
      const at = iso(a.at);
      w.ca.timelineReviewed = true;
      w.ca.fraudHandedOff = true;
      w.ui["service.case"] = cfg.fraudCase.id;
      w.notifications = w.notifications.filter((n) => n.id !== "nt-fraud-handoff");
      w.notifications.unshift({
        id: "nt-fraud-handoff",
        personaId: cfg.fraudCase.ownerId,
        at,
        kind: "mention",
        title: `Urgent handoff: ${cfg.fraudCase.ticketNumber} (${cfg.fraudCase.subject})`,
        body: `Breeze Customer Agent intercepted a $64,200 unauthorized wire and escalated Patrice Dunmore's account with full chat, email, and voice history.`,
        path: `/service/tickets/${cfg.fraudCase.ticketId}`,
        read: false,
      });
      addActivity(w, {
        at,
        type: "chat",
        title: `Escalated to human specialist — ${cfg.fraudCase.ticketNumber} (Protective hold active)`,
        body: `${cfg.fraudCase.handoffSummary.headline}\nProtective hold ${cfg.fraudCase.holdDetails.holdId} placed on wire ${cfg.fraudCase.holdDetails.wireRef} ($64,200) and card •••• ${cfg.fraudCase.holdDetails.cardLast4}.`,
        byId: null,
        contactIds: [cfg.fraudCase.contactId],
        companyIds: [cfg.fraudCase.companyId],
        linkPath: `/service/tickets/${cfg.fraudCase.ticketId}`,
        linkLabel: `Open ${cfg.fraudCase.ticketNumber}`,
      });
      touch(w, at, { companyId: cfg.fraudCase.companyId, contactIds: [cfg.fraudCase.contactId] });
      return;
    }
    case "ca.reviewTicket": {
      w.ca.ticketReviewed = true;
      return;
    }
    case "ca.repReply": {
      const cfg = pack.demos.customerAgent;
      if (!cfg) return;
      const at = iso(a.at);
      w.ca.repReplied = true;
      w.ca.repReplyText = a.text.trim() || cfg.fraudCase.defaultRepReply;
      addActivity(w, {
        at,
        type: "note",
        title: `Human specialist response on ${cfg.fraudCase.ticketNumber}`,
        body: w.ca.repReplyText,
        byId: w.persona,
        contactIds: [cfg.fraudCase.contactId],
        companyIds: [cfg.fraudCase.companyId],
        linkPath: `/service/tickets/${cfg.fraudCase.ticketId}`,
        linkLabel: `Open ${cfg.fraudCase.ticketNumber}`,
      });
      touch(w, at, { companyId: cfg.fraudCase.companyId, contactIds: [cfg.fraudCase.contactId] });
      return;
    }
    case "ca.reviewDashboard": {
      w.ca.dashboardReviewed = true;
      return;
    }

    // ----- Social media and paid ads (Flow 3) -----
    case "sa.openCampaign":
      w.sa.campaignOpened = true;
      return;
    case "sa.planCalendar":
      w.sa.campaignOpened = true;
      w.sa.calendarPlanned = true;
      return;
    case "sa.editPost":
      w.sa.postEdits[a.postId] = a.copy;
      return;
    case "sa.approvePost":
      if (!w.sa.approvedPostIds.includes(a.postId)) w.sa.approvedPostIds.push(a.postId);
      return;
    case "sa.approveAllDrafts": {
      const cfg = pack.demos.socialAds;
      if (!cfg) return;
      for (const p of cfg.posts) {
        if (p.needsApproval && !w.sa.approvedPostIds.includes(p.id)) w.sa.approvedPostIds.push(p.id);
      }
      return;
    }
    case "sa.reviewStatus":
      w.sa.statusReviewed = true;
      return;
    case "sa.seenGoogle":
      w.sa.googleSeen = true;
      return;
    case "sa.clickSocialAd":
      w.sa.googleSeen = true;
      w.sa.socialAdClicked = true;
      return;
    case "sa.seenLanding":
      w.sa.landingSeen = true;
      return;
    case "sa.submitForm": {
      const cfg = pack.demos.socialAds;
      if (!cfg || w.sa.submitted) return;
      const lead = cfg.landingPage.lead;
      const firstName = a.overrides?.firstName?.trim() || lead.firstName;
      const lastName = a.overrides?.lastName?.trim() || lead.lastName;
      const email = a.overrides?.email?.trim() || lead.email;
      const companyName = a.overrides?.companyName?.trim() || lead.companyName;
      const rolesNeeded = a.overrides?.rolesNeeded?.trim() || lead.rolesNeeded;
      const notes = a.overrides?.notes?.trim() || lead.notes;
      const heroCampaign = cfg.campaigns.find((c) => c.id === cfg.heroCampaignId) ?? cfg.campaigns[0];
      const at = iso(a.at);

      const company: Company = {
        id: lead.companyId,
        name: companyName,
        domain: lead.companyDomain,
        industry: lead.companyIndustry,
        type: "Prospect",
        city: lead.companyCity,
        state: lead.companyState,
        employees: lead.companyEmployees,
        revenue: lead.companyRevenue,
        phone: "(303) 555-0100",
        ownerId: lead.assignedRepId,
        lifecycle: "Opportunity",
        createdAt: at,
        lastActivityAt: at,
        territory: "Mountain West",
        description: "320-bed regional acute care medical center serving metro Denver. Zero patient PHI stored in HubSpot.",
        extra: [{ label: "Facility tier", value: "Health system" }],
        isNew: true,
      };
      const contact: Contact = {
        id: lead.contactId,
        firstName,
        lastName,
        email,
        phone: lead.phone,
        title: lead.title,
        companyId: company.id,
        ownerId: lead.assignedRepId,
        lifecycle: "Marketing Qualified Lead",
        leadStatus: "New",
        createdAt: at,
        lastActivityAt: at,
        source: "Paid Social",
        score: 94,
        extra: [
          { label: "Campaign", value: heroCampaign?.name ?? "Q1 Travel RN & ICU Surge Staffing" },
          { label: "Original source drill-down", value: "LinkedIn Paid Social · 48-Hr ICU Shortlist" },
          { label: "UTM campaign", value: cfg.landingPage.utmCampaign },
          { label: "Staffing request", value: rolesNeeded },
          { label: "Shift window", value: lead.shiftWindow },
        ],
        isNew: true,
      };
      const icuProd = pack.products.find((p) => p.sku === "CC-RN-ICU");
      const erProd = pack.products.find((p) => p.sku === "CC-RN-ER");
      const credProd = pack.products.find((p) => p.sku === "CC-CRED-FAST");
      const lineItems: LineItem[] = [
        ...(icuProd ? [{ sku: icuProd.sku, name: icuProd.name, qty: 4, unitPrice: icuProd.price, unitCost: icuProd.cost, leadDays: icuProd.leadDays, timing: icuProd.timing }] : []),
        ...(erProd ? [{ sku: erProd.sku, name: erProd.name, qty: 2, unitPrice: erProd.price, unitCost: erProd.cost, leadDays: erProd.leadDays, timing: erProd.timing }] : []),
        ...(credProd ? [{ sku: credProd.sku, name: credProd.name, qty: 1, unitPrice: credProd.price, unitCost: credProd.cost, leadDays: credProd.leadDays, timing: credProd.timing }] : []),
      ];
      const deal: Deal = {
        id: lead.dealId,
        name: lead.dealName,
        companyId: company.id,
        contactIds: [contact.id],
        ownerId: lead.assignedRepId,
        stage: "qualified",
        amount: lineItems.length > 0 ? lineItems.reduce((sum, l) => sum + l.qty * l.unitPrice, 0) : lead.dealAmount,
        closeDate: iso(a.at + 21 * DAY),
        createdAt: at,
        lastActivityAt: at,
        type: "Job order",
        lineItems,
        source: `Paid Social · ${heroCampaign?.name ?? "Q1 Travel RN & ICU Surge Staffing"}`,
        isNew: true,
      };

      w.companies.unshift(company);
      w.contacts.unshift(contact);
      w.deals.unshift(deal);

      const ids = { contactIds: [contact.id], companyIds: [company.id], dealIds: [deal.id] };
      addActivity(w, {
        at: iso(a.at - 18 * 60_000),
        type: "lifecycle",
        title: "Paid search ad click — Google Ads",
        body: `Searched "${cfg.googleAd.query}" and clicked Sponsored ad: ${cfg.googleAd.sponsored.headline}. Campaign: ${heroCampaign?.name}.`,
        byId: null,
        contactIds: [contact.id],
        companyIds: [company.id],
      });
      addActivity(w, {
        at: iso(a.at - 9 * 60_000),
        type: "note",
        title: "Social activity — LinkedIn organic post engagement",
        body: `Viewed and liked Crestline Clinical Staffing's post "${cfg.socialFeed.organicPost.statHeadline} — Winter ICU Census Playbook" in LinkedIn feed.`,
        byId: null,
        contactIds: [contact.id],
        companyIds: [company.id],
      });
      addActivity(w, {
        at: iso(a.at - 3 * 60_000),
        type: "lifecycle",
        title: "Paid social ad click — LinkedIn Sponsored",
        body: `Clicked "${cfg.socialFeed.paidAd.ctaLabel}" on "${cfg.socialFeed.paidAd.headline}". UTM: utm_source=${cfg.landingPage.utmSource}&utm_campaign=${cfg.landingPage.utmCampaign}.`,
        byId: null,
        contactIds: [contact.id],
        companyIds: [company.id],
      });
      addActivity(w, {
        at: iso(a.at - 5_000),
        type: "form",
        title: `Form submission: ${cfg.landingPage.formTitle}`,
        body: `${rolesNeeded} · ${lead.shiftWindow}. "${notes}"`,
        byId: null,
        ...ids,
      });
      addActivity(w, {
        at,
        type: "deal",
        title: "Job-order deal created from campaign conversion",
        body: `${deal.name} ($${deal.amount.toLocaleString("en-US")}) attributed to ${heroCampaign?.name}.`,
        byId: null,
        ...ids,
        linkPath: `/deals/${deal.id}`,
        linkLabel: "View deal",
      });

      w.sa.landingSeen = true;
      w.sa.submitted = true;
      w.sa.contactId = contact.id;
      w.sa.companyId = company.id;
      w.sa.dealId = deal.id;
      return;
    }
    case "sa.seenContact":
      w.sa.contactSeen = true;
      return;
    case "sa.seenTimeline":
      w.sa.contactSeen = true;
      w.sa.timelineSeen = true;
      return;
    case "sa.sendFollowup": {
      const cfg = pack.demos.socialAds;
      if (!cfg || !w.sa.contactId || w.sa.followupSent) return;
      const lead = cfg.landingPage.lead;
      const at = iso(a.at);
      const rep = pack.personas.find((p) => p.id === lead.assignedRepId);
      const ids = { contactIds: [w.sa.contactId], companyIds: w.sa.companyId ? [w.sa.companyId] : [], dealIds: w.sa.dealId ? [w.sa.dealId] : [] };

      addActivity(w, {
        at: iso(a.at - 1_000),
        type: "email",
        title: `Automated follow-up email sent: ${cfg.landingPage.followUpEmail.subject}`,
        body: cfg.landingPage.followUpEmail.preview,
        byId: lead.assignedRepId,
        ...ids,
      });
      addActivity(w, {
        at,
        type: "workflow",
        title: `Workflow ran: Assigned rep ${rep?.name ?? "Marcus Delgado"} notified`,
        body: `High-priority call task created for ${rep?.name ?? "Marcus Delgado"} and alert posted in ${cfg.landingPage.repAlert.channel}.`,
        byId: null,
        ...ids,
        linkPath: "/workflows/wf-staffing-followup",
        linkLabel: "View workflow",
      });
      w.tasks.unshift({
        id: "tk-sa-followup",
        title: cfg.landingPage.repAlert.taskTitle,
        type: "Call",
        priority: "High",
        dueAt: iso(a.at + 2 * 3_600_000),
        ownerId: lead.assignedRepId,
        status: "open",
        contactId: w.sa.contactId,
        companyId: w.sa.companyId ?? undefined,
        dealId: w.sa.dealId ?? undefined,
        notes: "Paid Social MQL from Q1 Travel RN & ICU Surge Staffing. Deliver 48-hour shortlist.",
        isNew: true,
      });
      w.notifications.unshift({
        id: "nt-sa-rep",
        personaId: lead.assignedRepId,
        at,
        kind: "lead",
        title: `New staffing lead assigned: ${lead.firstName} ${lead.lastName}`,
        body: `${lead.companyName} (${lead.rolesNeeded}). Automated confirmation email already sent.`,
        path: `/contacts/${w.sa.contactId}`,
        read: false,
        slack: { channel: cfg.landingPage.repAlert.channel, text: cfg.landingPage.repAlert.text },
      });
      w.notifications.unshift({
        id: "nt-sa-marketer",
        personaId: pack.defaultPersonaId,
        at,
        kind: "lead",
        title: `Follow-up sent & ${rep?.name ?? "Marcus Delgado"} notified`,
        body: `${lead.firstName} ${lead.lastName} (${lead.companyName}) emailed and routed to ${rep?.name ?? "Marcus Delgado"}.`,
        path: `/contacts/${w.sa.contactId}`,
        read: false,
        slack: { channel: cfg.landingPage.repAlert.channel, text: cfg.landingPage.repAlert.text },
      });
      touch(w, at, { companyId: w.sa.companyId, contactIds: [w.sa.contactId], dealId: w.sa.dealId });
      w.sa.followupSent = true;
      return;
    }
    case "sa.replyInbox": {
      const text = a.text.trim();
      if (!text) return;
      w.sa.replies[a.threadId] = { text, at: iso(a.at) };
      if (a.threadId === "si-1") {
        const n = w.notifications.find((x) => x.id === "nt-hc-1");
        if (n) n.read = true;
      }
      return;
    }
    case "sa.seenInsights":
      w.sa.insightsSeen = true;
      return;
  }
}

/** Rebuilds the world from the seed and the list of actions. */
export function replay(seed: World, actions: Action[], pack: Pack): World {
  const world = structuredClone(seed);
  for (const action of actions) mutate(world, action, pack);
  return world;
}
