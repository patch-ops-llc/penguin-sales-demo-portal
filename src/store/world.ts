import { generateLines, isComplete, pruneSelections } from "@/demos/guided-quote/rules";
import { labelsOf } from "@/verticals/labels";
import type { Activity, Company, Contact, Deal, InboxThread, LineItem, Notification, Pack, Quote, Task } from "@/verticals/types";
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
  seq: number;
};

export type Action =
  | { t: "flag"; k: string }
  | { t: "ui"; k: string; v: string }
  | { t: "persona"; id: string }
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
  | { t: "quote.editLines"; id: string; lines: Record<string, { qty?: number; unitPrice?: number; discountPct?: number }> }
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
  | { t: "ap.send"; at: number };

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
      // Playing the second person is a demo step in its own right.
      const rule = pack.demos.discountApproval;
      if (a.id === rule.approverId && w.quotes.some((q) => q.id === rule.quoteId && q.approval)) w.flags["da.asApprover"] = true;
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
    case "quote.editLines": {
      const quote = w.quotes.find((q) => q.id === a.id);
      if (!quote || quote.status === "Sent" || quote.status === "Accepted") return;
      const next = quote.lineItems.map((l) => {
        const edit = a.lines[l.sku] ?? {};
        return {
          ...l,
          qty: edit.qty !== undefined ? Math.max(1, Math.round(Number(edit.qty) || 1)) : l.qty,
          unitPrice: edit.unitPrice !== undefined ? Math.max(0, Math.round((Number(edit.unitPrice) || 0) * 100) / 100) : l.unitPrice,
          discountPct: edit.discountPct !== undefined ? clampPct(edit.discountPct, 100) : unitDiscountPct(quote, l),
        };
      });
      if (quote.lineItems.every((l, i) => l.qty === next[i].qty && l.unitPrice === next[i].unitPrice && unitDiscountPct(quote, l) === next[i].discountPct)) return;
      quote.lineItems = next;
      if (next.every((l) => l.discountPct === next[0].discountPct)) {
        // One discount on every line reads as the quote's discount.
        quote.discountPct = next[0]?.discountPct ?? 0;
        for (const l of next) delete (l as LineItem).discountPct;
      } else {
        quote.discountPct = Math.round(quoteTotals(quote).discountPct * 10) / 10;
      }
      quote.status = "Draft";
      delete quote.approval;
      return;
    }
    case "quote.requestApproval": {
      const quote = w.quotes.find((q) => q.id === a.id);
      const rule = pack.demos.discountApproval;
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
      if (!quote || (quote.status !== "Draft" && quote.status !== "Approved")) return;
      if (approvalReasons(quote, pack.demos.discountApproval).length > 0 && quote.status !== "Approved") return;
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
        lineItems.push({ sku: product.sku, name: product.name, qty: l.qty, unitPrice: product.price, unitCost: product.cost, leadDays: product.leadDays, ...(product.timing ? { timing: product.timing } : {}), ...(product.recurring ? { recurring: true } : {}) });
      }
      const at = iso(a.at);
      const deal: Deal = {
        id: `dl-${thread.id}`,
        name: parsed.dealName,
        companyId: thread.companyId,
        contactIds: [thread.contactId],
        ownerId: w.persona,
        stage: pack.demos.emailToDeal.dealStage,
        amount: lineItems.reduce((sum, l) => sum + l.qty * l.unitPrice, 0),
        closeDate: iso(a.at + parsed.closeInDays * DAY),
        createdAt: at,
        lastActivityAt: at,
        type: "Existing business",
        lineItems,
        source: "Created from an email",
        isNew: true,
      };
      w.deals.unshift(deal);
      const ids = { contactIds: [thread.contactId], companyIds: [thread.companyId], dealIds: [deal.id] };
      addActivity(w, { at: thread.at, type: "email", title: `Email from ${thread.from.name}: ${thread.subject}`, body: thread.preview, byId: null, ...ids, ...(thread.attachment ? { attachment: thread.attachment.name } : {}) });
      addActivity(w, { at, type: "deal", title: "Deal created from email", body: `${lineItems.length} line items from the parsed request. Company and contact associated.`, byId: w.persona, ...ids });
      touch(w, at, { companyId: thread.companyId, contactIds: [thread.contactId] });
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
  }
}

/** Rebuilds the world from the seed and the list of actions. */
export function replay(seed: World, actions: Action[], pack: Pack): World {
  const world = structuredClone(seed);
  for (const action of actions) mutate(world, action, pack);
  return world;
}
