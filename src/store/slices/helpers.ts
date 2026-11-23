import type { Activity, DiscountApprovalConfig, LineItem, Pack, Quote } from "@/verticals/types";
import type { World } from "./types";

export const iso = (ms: number) => new Date(ms).toISOString();
export const DAY = 86_400_000;

export function addActivity(w: World, activity: Omit<Activity, "id">): void {
  w.seq += 1;
  w.activities.unshift({ id: `ac-new-${w.seq}`, ...activity });
}

export function touch(w: World, at: string, ids: { companyId?: string | null; contactIds?: string[]; dealId?: string | null }): void {
  const company = ids.companyId ? w.companies.find((c) => c.id === ids.companyId) : undefined;
  if (company) company.lastActivityAt = at;
  for (const id of ids.contactIds ?? []) {
    const contact = w.contacts.find((c) => c.id === id);
    if (contact) contact.lastActivityAt = at;
  }
  const deal = ids.dealId ? w.deals.find((d) => d.id === ids.dealId) : undefined;
  if (deal) deal.lastActivityAt = at;
}

export const clampPct = (pct: number, steps = 10) => Math.min(60, Math.max(0, Math.round((Number(pct) || 0) * steps) / steps));

/**
 * The quote approval rule in force: the pack's, with what the rep has changed in the approval workflow.
 * Everything that checks a quote against the rule reads this, so an edit shows at once.
 */
export function ruleOf(pack: Pack, w: Pick<World, "approvalRule">): DiscountApprovalConfig {
  const base = pack.demos.discountApproval;
  const { thresholdPct, filters, approverId } = w.approvalRule;
  return { ...base, thresholdPct: thresholdPct ?? base.thresholdPct, filters: filters ?? base.filters, approverId: approverId ?? base.approverId };
}

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

export function newQuote(w: World, input: { id: string; title: string; dealId: string; companyId: string; contactId: string; lineItems: LineItem[]; origin: string; at: number }): Quote {
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
