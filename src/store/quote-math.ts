import type { DiscountApprovalConfig, LineItem, Quote, QuoteStatus } from "@/verticals/types";

type Priced = Pick<Quote, "lineItems" | "discountPct">;

const round2 = (value: number) => Math.round(value * 100) / 100;

export function subtotal(lines: LineItem[]): number {
  return lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0);
}

export function costOf(lines: LineItem[]): number {
  return lines.reduce((sum, l) => sum + l.qty * l.unitCost, 0);
}

/** HubSpot discounts line by line. A quote with no unit discounts set carries its total discount on every line. */
export function unitDiscountPct(quote: Priced, line: LineItem): number {
  return line.discountPct ?? quote.discountPct;
}

/** Unit price after the line's unit discount. */
export function netUnitPrice(quote: Priced, line: LineItem): number {
  return round2(line.unitPrice * (1 - unitDiscountPct(quote, line) / 100));
}

/** Net price of the line: quantity at the discounted unit price. */
export function lineNet(quote: Priced, line: LineItem): number {
  return round2(line.qty * line.unitPrice * (1 - unitDiscountPct(quote, line) / 100));
}

/** Margin of one line after its discount, in percent. */
export function lineMarginPct(quote: Priced, line: LineItem): number {
  const net = line.unitPrice * (1 - unitDiscountPct(quote, line) / 100);
  return net > 0 ? ((net - line.unitCost) / net) * 100 : 0;
}

export function quoteTotals(quote: Priced) {
  const sub = subtotal(quote.lineItems);
  const total = round2(quote.lineItems.reduce((sum, l) => sum + lineNet(quote, l), 0));
  const discount = round2(sub - total);
  const discountPct = sub > 0 ? round2((discount / sub) * 100) : 0;
  const cost = costOf(quote.lineItems);
  const marginPct = total > 0 ? ((total - cost) / total) * 100 : 0;
  const maxLead = quote.lineItems.reduce((max, l) => Math.max(max, l.leadDays), 0);
  return { subtotal: sub, discount, discountPct, total, cost, marginPct, maxLead };
}

/** A product's floor price: the lowest unit price allowed without approval, set from its unit cost and the minimum margin. */
export function floorPrice(line: LineItem, rule: DiscountApprovalConfig): number {
  return Math.ceil((line.unitCost / (1 - rule.marginFloorPct / 100)) * 100) / 100;
}

/** Lines whose unit price after discount is under their floor price. */
export function linesBelowFloor(quote: Priced, rule: DiscountApprovalConfig): LineItem[] {
  return quote.lineItems.filter((l) => unitDiscountPct(quote, l) > 0 && l.unitPrice * (1 - unitDiscountPct(quote, l) / 100) < floorPrice(l, rule));
}

/** The selected option of the approval rule's terms list, when the vertical has one. */
export function quoteTerms(quote: Pick<Quote, "termsId">, rule: DiscountApprovalConfig) {
  if (!rule.terms) return undefined;
  return rule.terms.options.find((o) => o.id === (quote.termsId ?? rule.terms!.defaultId));
}

export type ApprovalCondition = {
  id: "discount" | "floor" | "terms";
  /** The filter as HubSpot's approval settings word it: property, operator, value. */
  property: string;
  operator: string;
  value: string;
  /** Set when the quote meets the condition. */
  reason?: string;
};

/**
 * The quote approval rule: real logic, so 8% sails through and 18% locks. The rule is HubSpot's own standard
 * approval, set in Settings > Objects > Quotes > Approvals as a list of filters on quote and line item properties.
 * What Penguin adds is the data one filter reads: each product's floor price and the "Below floor price" flag on a line.
 */
export function approvalConditions(quote: Priced & Pick<Quote, "termsId">, rule: DiscountApprovalConfig): ApprovalCondition[] {
  const below = linesBelowFloor(quote, rule).length;
  const conditions: ApprovalCondition[] = [
    {
      id: "discount",
      property: "Total discount percent",
      operator: "is greater than",
      value: `${rule.thresholdPct}%`,
      reason: quoteTotals(quote).discountPct > rule.thresholdPct ? `${rule.labels?.discount ?? "Discount"} over ${rule.thresholdPct}%` : undefined,
    },
    {
      id: "floor",
      property: "Line item: Below floor price",
      operator: "is equal to",
      value: "True",
      reason: below > 0 ? `${below} ${below === 1 ? "line" : "lines"} below floor price` : undefined,
    },
  ];
  if (rule.terms) {
    const terms = quoteTerms(quote, rule);
    conditions.push({
      id: "terms",
      property: rule.terms.label,
      operator: "is none of",
      value: rule.terms.options.filter((o) => o.standard).map((o) => o.label).join(", "),
      reason: terms && !terms.standard ? rule.terms.reason.replace("{term}", terms.label) : undefined,
    });
  }
  return conditions;
}

/** Why a quote needs approval: the conditions of the approval rule it meets. Empty list means no approval needed. */
export function approvalReasons(quote: Priced & Pick<Quote, "termsId">, rule: DiscountApprovalConfig): string[] {
  return approvalConditions(quote, rule).flatMap((c) => (c.reason ? [c.reason] : []));
}

/** A quote can be shared when it needs no approval, or the approval covers the current discount. */
export function isLocked(quote: Quote, rule: DiscountApprovalConfig): boolean {
  if (quote.status === "Sent" || quote.status === "Accepted") return false;
  if (approvalReasons(quote, rule).length === 0) return false;
  return !(quote.approval?.status === "approved" && quote.approval.discountPct === quote.discountPct);
}

/** Splits a quote's total after discount into what repeats every year and what is charged once. */
export function recurringTotals(quote: Priced): { annual: number; oneTime: number } | null {
  const recurring = quote.lineItems.filter((l) => l.recurring);
  if (recurring.length === 0) return null;
  const annual = round2(recurring.reduce((sum, l) => sum + lineNet(quote, l), 0));
  return { annual, oneTime: round2(quoteTotals(quote).total - annual) };
}

/** The reasons as the end of a sentence: "discount over 10%, 3 lines below floor price". */
export function reasonList(reasons: string[]): string {
  return reasons.map((r) => r.charAt(0).toLowerCase() + r.slice(1)).join(", ");
}

/** The status as HubSpot words it: a quote that has been shared is "Published". */
export function quoteStatusLabel(status: QuoteStatus): string {
  return status === "Sent" ? "Published" : status;
}

/** The dot beside a quote's status: gray for drafts, yellow while it waits on someone, red for changes, green once accepted. */
export function quoteStatusColor(status: QuoteStatus): string {
  switch (status) {
    case "Accepted":
      return "#00bda5";
    case "Changes requested":
      return "#f2545b";
    case "Draft":
      return "#b0b9c6";
    default:
      return "#f5c26b";
  }
}
