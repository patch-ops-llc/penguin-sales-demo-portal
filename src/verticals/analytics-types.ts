import type { DemoId } from "./catalog";

export type AnalyticsTone = "neutral" | "green" | "amber" | "red" | "blue" | "teal" | "orange" | "purple" | "pink";

export type AnalyticsKpi = {
  id: string;
  label: string;
  value: string;
  delta?: string;
  note?: string;
  tone?: AnalyticsTone;
};

export type AnalyticsBreakdownRow = {
  label: string;
  value: number;
  displayValue: string;
  meta?: string;
  /** Explicit bar fill percentage (0-100). Defaults to relative share of the panel's maximum value. */
  pct?: number;
  tone?: AnalyticsTone;
};

export type AnalyticsBreakdownPanel = {
  id: string;
  title: string;
  subtitle?: string;
  kind: "funnel" | "bars";
  badge?: string;
  badgeTone?: AnalyticsTone;
  rows: AnalyticsBreakdownRow[];
};

export type AnalyticsTableColumn = {
  key: string;
  label: string;
  align?: "left" | "right";
  /** Render cell values in this column as HubSpot status/category tags. */
  tag?: boolean;
};

export type AnalyticsTableRow = {
  id: string;
  cells: Record<string, string>;
  /** Optional tone overrides for tag columns, keyed by column key. */
  tones?: Record<string, AnalyticsTone>;
  /** Optional shell-relative route (e.g. "/deals/dl-123") linked on the first column. */
  linkTo?: string;
};

export type AnalyticsTable = {
  title: string;
  subtitle?: string;
  columns: AnalyticsTableColumn[];
  rows: AnalyticsTableRow[];
};

export type AnalyticsCreditsBreakdownRow = {
  action: string;
  credits: number;
  outcomes: string;
  sharePct: number;
};

/**
 * Optional custom Penguin-built HubSpot Credits & Outcomes attribution panel.
 * Rendered inside `<Ext id={extId}>` — the ONLY section on a report page that may carry
 * a pulsing Penguin marker (when registered with `by: "penguin"` in the vertical's extensions.ts).
 */
export type AnalyticsCreditsOutcome = {
  extId: string;
  title?: string;
  badge?: string;
  creditsUsed: number;
  creditsAllocated?: number;
  primaryMetricLabel: string;
  primaryMetricValue: string;
  secondaryMetricLabel: string;
  secondaryMetricValue: string;
  summary: string;
  breakdown: AnalyticsCreditsBreakdownRow[];
};

/**
 * One interactive filter slice (e.g. channel, location, specialty, tier, or signal).
 * Selecting a pill swaps the active slice client-side with zero network calls;
 * omitted properties fall back to the report's base fields.
 */
export type AnalyticsFilterOption = {
  id: string;
  label: string;
  kpis?: AnalyticsKpi[];
  breakdowns?: AnalyticsBreakdownPanel[];
  table?: AnalyticsTable;
  creditsOutcome?: AnalyticsCreditsOutcome;
};

export type AnalyticsFilterGroup = {
  label: string;
  options: AnalyticsFilterOption[];
  defaultOptionId?: string;
};

export type AnalyticsReportSpec = {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeTone?: AnalyticsTone;
  /** Demo(s) that navigate to this report; used for automatic lazy preloading on demo entry. */
  demoId?: DemoId;
  demoIds?: DemoId[];
  backLink?: { to: string; label: string };
  /** Optional world flag dispatched when the presenter clicks "Complete review". */
  completeFlag?: string;
  filter?: AnalyticsFilterGroup;
  kpis: AnalyticsKpi[];
  breakdowns: AnalyticsBreakdownPanel[];
  table: AnalyticsTable;
  creditsOutcome?: AnalyticsCreditsOutcome;
};
