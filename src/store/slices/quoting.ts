import { generateLines, isComplete, pruneSelections } from "@/demos/guided-quote/rules";
import type { LineItem, Pack } from "@/verticals/types";
import { approvalReasons, quoteTotals, unitDiscountPct } from "../quote-math";
import { addActivity, clampPct, iso, newQuote, nextDealQuoteId, quoteName, ruleOf, touch } from "./helpers";
import type { Action, World } from "./types";

export type GuidedQuoteState = {
  sel: Record<string, string>;
  quantity: number | null;
  needBy: string | null;
  lines: LineItem[];
  quoteId: string | null;
};

export type QuotingAction =
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
  | { t: "quote.accept"; id: string; at: number };

export function seedGuidedQuote(): GuidedQuoteState {
  return { sel: {}, quantity: null, needBy: null, lines: [], quoteId: null };
}

export function isQuotingAction(a: Action): a is QuotingAction {
  return a.t.startsWith("gq.") || a.t.startsWith("quote.");
}

export function applyQuoting(w: World, a: QuotingAction, pack: Pack): void {
  switch (a.t) {
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
      newQuote(w, {
        id: nextDealQuoteId(w, deal.id),
        title: deal.name,
        dealId: deal.id,
        companyId: deal.companyId,
        contactId: deal.contactIds[0] ?? "",
        lineItems: deal.lineItems,
        origin: "Created from the deal",
        at: a.at,
      });
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
  }
}
