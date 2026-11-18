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

/** The approval rule: real logic, so 8% sails through and 18% locks. Empty list means no approval needed. */
export function approvalReasons(quote: Pick<Quote, "lineItems" | "discountPct">, rule: DiscountApprovalConfig): string[] {
  const { marginPct } = quoteTotals(quote);
  const reasons: string[] = [];
  if (quote.discountPct > rule.thresholdPct) reasons.push(`Discount over ${rule.thresholdPct}%`);
  if (quote.discountPct > 0 && marginPct < rule.marginFloorPct) reasons.push(`Margin under the ${rule.marginFloorPct}% floor`);
  return reasons;
}

/** A quote can be sent when it needs no approval, or the approval covers the current discount. */
export function isLocked(quote: Quote, rule: DiscountApprovalConfig): boolean {
  if (quote.status === "Sent" || quote.status === "Accepted") return false;
  if (approvalReasons(quote, rule).length === 0) return false;
  return !(quote.approval?.status === "approved" && quote.approval.discountPct === quote.discountPct);
}
