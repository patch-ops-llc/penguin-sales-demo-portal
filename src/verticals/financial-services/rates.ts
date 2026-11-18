// Fernhill Capital's rate card, shared by the seeded records and the Guided quote rules so that
// a generated proposal and a seeded one always agree.

export const TERMS = [36, 48, 60, 72];

/** Monthly payment per dollar financed, for a fixed annual rate over a term in months. */
export function factor(annualRatePct: number, months: number): number {
  const monthly = annualRatePct / 1200;
  return Math.round((monthly / (1 - (1 + monthly) ** -months)) * 1e6) / 1e6;
}

/** Fixed annual rate by credit tier. */
export const TIER_RATE = { a: 7.25, b: 8.75, c: 10.5 };

/** The rate Calloway Aggregates holds on its master line. */
export const LINE_RATE = 6.9;

/** A program's payment as a multiple of the equipment finance agreement payment at the same rate. */
export const PROGRAM_MULTIPLIER: Record<string, number> = {
  "FC-EFA-PMT": 1,
  "FC-EFU-PMT": 1.06,
  "FC-FMV-PMT": 0.88,
  "FC-TRAC-PMT": 0.93,
  "FC-SLB-PMT": 1.03,
};

export function monthlyPayment(sku: string, months: number, financed: number, annualRatePct: number = TIER_RATE.a): number {
  const multiplier = PROGRAM_MULTIPLIER[sku];
  if (!multiplier) throw new Error(`Unknown financing program in seed: ${sku}`);
  return Math.round(financed * factor(annualRatePct, months) * multiplier);
}

/** Funding cost, principal and cost of funds, as a share of the payment. It sets each program's floor. */
export const FUNDING_COST = 0.9;

/** The documentation fee steps up with the equipment cost. */
export function docFee(equipmentCost: number): number {
  return equipmentCost < 100_000 ? 395 : equipmentCost < 250_000 ? 495 : equipmentCost < 500_000 ? 695 : 895;
}

/** A site inspection applies to equipment costing this much or more. */
export const INSPECTION_FROM = 250_000;

export function usd(value: number): string {
  return `$${value.toLocaleString("en-US")}`;
}
