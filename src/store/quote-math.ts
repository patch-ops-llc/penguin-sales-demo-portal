import type { DiscountApprovalConfig, LineItem, Quote } from "@/verticals/types";

export function subtotal(lines: LineItem[]): number {
  return lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0);
}

export function costOf(lines: LineItem[]): number {
  return lines.reduce((sum, l) => sum + l.qty * l.unitCost, 0);
}

export function quoteTotals(quote: Pick<Quote, "lineItems" | "discountPct">) {
  const sub = subtotal(quote.lineItems);
  const discount = Math.round(sub * quote.discountPct) / 100;
  const total = sub - discount;
  const cost = costOf(quote.lineItems);
  const marginPct = total > 0 ? ((total - cost) / total) * 100 : 0;
  const maxLead = quote.lineItems.reduce((max, l) => Math.max(max, l.leadDays), 0);
  return { subtotal: sub, discount, total, cost, marginPct, maxLead };
}

/** A product's floor price: the lowest unit price allowed without approval, set from its unit cost and the minimum margin. */
export function floorPrice(line: LineItem, rule: DiscountApprovalConfig): number {
  return Math.ceil((line.unitCost / (1 - rule.marginFloorPct / 100)) * 100) / 100;
}

/** Lines whose unit price after the quote discount is under their floor price. */
export function linesBelowFloor(quote: Pick<Quote, "lineItems" | "discountPct">, rule: DiscountApprovalConfig): LineItem[] {
  if (quote.discountPct <= 0) return [];
  return quote.lineItems.filter((l) => l.unitPrice * (1 - quote.discountPct / 100) < floorPrice(l, rule));
}

/** The selected option of the approval rule's terms list, when the vertical has one. */
export function quoteTerms(quote: Pick<Quote, "termsId">, rule: DiscountApprovalConfig) {
  if (!rule.terms) return undefined;
  return rule.terms.options.find((o) => o.id === (quote.termsId ?? rule.terms!.defaultId));
}

/**
 * The approval rule: real logic, so 8% sails through and 18% locks. Empty list means no approval needed.
 * The discount limit is HubSpot's own approval setting. The floor-price check is the Penguin rule.
 */
export function approvalReasons(quote: Pick<Quote, "lineItems" | "discountPct" | "termsId">, rule: DiscountApprovalConfig): string[] {
  const reasons: string[] = [];
  if (quote.discountPct > rule.thresholdPct) reasons.push(`Discount over ${rule.thresholdPct}%`);
  const below = linesBelowFloor(quote, rule).length;
  if (below > 0) reasons.push(`${below} ${below === 1 ? "line" : "lines"} below floor price`);
  const terms = quoteTerms(quote, rule);
  if (rule.terms && terms && !terms.standard) reasons.push(rule.terms.reason.replace("{term}", terms.label));
  return reasons;
}

/** A quote can be sent when it needs no approval, or the approval covers the current discount. */
export function isLocked(quote: Quote, rule: DiscountApprovalConfig): boolean {
  if (quote.status === "Sent" || quote.status === "Accepted") return false;
  if (approvalReasons(quote, rule).length === 0) return false;
  return !(quote.approval?.status === "approved" && quote.approval.discountPct === quote.discountPct);
}

/** Splits a quote's total after discount into what repeats every year and what is charged once. */
export function recurringTotals(quote: Pick<Quote, "lineItems" | "discountPct">): { annual: number; oneTime: number } | null {
  const recurring = quote.lineItems.filter((l) => l.recurring);
  if (recurring.length === 0) return null;
  const net = (lines: LineItem[]) => Math.round(subtotal(lines) * (100 - quote.discountPct)) / 100;
  const annual = net(recurring);
  return { annual, oneTime: quoteTotals(quote).total - annual };
}
