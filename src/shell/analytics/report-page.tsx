"use client";

import { useState } from "react";
import { useShell } from "@/store/store";
import type {
  AnalyticsBreakdownPanel,
  AnalyticsCreditsOutcome,
  AnalyticsKpi,
  AnalyticsReportSpec,
  AnalyticsTable,
  AnalyticsTone,
} from "@/verticals/analytics-types";
import { Ext } from "../ext";
import { num } from "../format";
import { Icon } from "../icons";
import { A, AiPill, Button, Card, cx, Empty, Tag } from "../ui";

const KPI_CARD_STYLES: Partial<Record<AnalyticsTone, string>> = {
  green: "border-[#bfe3cd] bg-[#f8fdf9]",
  amber: "border-[#f3d48c] bg-[#fffcf4]",
  red: "border-[#f3bdb7] bg-[#fff8f7]",
};

const KPI_VALUE_STYLES: Partial<Record<AnalyticsTone, string>> = {
  green: "text-[#0b5b2b]",
  amber: "text-[#8a5600]",
  red: "text-[#99201a]",
};

const KPI_DELTA_STYLES: Partial<Record<AnalyticsTone, string>> = {
  green: "text-[#0b5b2b]",
  amber: "text-[#8a5600]",
  red: "text-[#99201a]",
  blue: "text-[#0b4a78]",
  teal: "text-[#00514f]",
  orange: "text-[#a03400]",
  purple: "text-penguin-strong",
  pink: "text-breeze",
  neutral: "text-ink-muted",
};

const BAR_COLORS: Record<AnalyticsTone, string> = {
  neutral: "bg-[#334155]",
  green: "bg-[#0b7a4b]",
  amber: "bg-[#d97706]",
  red: "bg-[#dc2626]",
  blue: "bg-[#2563eb]",
  teal: "bg-[#0b6e6e]",
  orange: "bg-hs-orange",
  purple: "bg-penguin",
  pink: "bg-breeze",
};

const FUNNEL_PALETTE = ["bg-[#334155]", "bg-[#0b6e6e]", "bg-[#2563eb]", "bg-[#d20587]", "bg-hs-orange", "bg-[#0b7a4b]"];

function KpiStrip({ kpis }: { kpis: AnalyticsKpi[] }) {
  const cols = kpis.length === 3 ? "sm:grid-cols-3" : kpis.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4";
  return (
    <div className={cx("grid gap-4", cols)} data-testid="analytics-kpi-grid">
      {kpis.map((kpi) => {
        const tone = kpi.tone ?? "neutral";
        return (
          <Card key={kpi.id} testId={`analytics-kpi-${kpi.id}`} className={KPI_CARD_STYLES[tone]}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">{kpi.label}</p>
              {kpi.delta ? <span className={cx("shrink-0 text-[12px] font-semibold", KPI_DELTA_STYLES[tone])}>{kpi.delta}</span> : null}
            </div>
            <p className={cx("mt-1.5 text-[28px] font-bold tabular-nums leading-none", KPI_VALUE_STYLES[tone] ?? "text-ink")} data-testid={`analytics-kpi-value-${kpi.id}`}>
              {kpi.value}
            </p>
            {kpi.note ? <p className="mt-2 text-[12.5px] leading-snug text-ink-muted">{kpi.note}</p> : null}
          </Card>
        );
      })}
    </div>
  );
}

function BreakdownCard({ panel }: { panel: AnalyticsBreakdownPanel }) {
  const maxVal = Math.max(...panel.rows.map((r) => r.value), 1);
  return (
    <Card
      title={panel.title}
      right={panel.badge ? <Tag tone={panel.badgeTone ?? "neutral"}>{panel.badge}</Tag> : undefined}
      testId={`analytics-panel-${panel.id}`}
    >
      {panel.subtitle ? <p className="mb-3 text-[12.5px] text-ink-muted">{panel.subtitle}</p> : null}
      <div className="space-y-3">
        {panel.rows.map((row, idx) => {
          const computedPct = row.pct ?? (row.value <= 0 ? 0 : Math.round((row.value / maxVal) * 100));
          const widthPct = computedPct <= 0 ? 0 : Math.max(4, Math.min(100, computedPct));
          const barColor = row.tone ? BAR_COLORS[row.tone] : panel.kind === "funnel" ? FUNNEL_PALETTE[idx % FUNNEL_PALETTE.length] : "bg-hs-orange";
          return (
            <div key={row.label} data-testid={`analytics-row-${panel.id}-${idx}`}>
              <div className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="font-medium text-ink">
                  {panel.kind === "funnel" ? <span className="mr-1.5 text-[11.5px] font-semibold text-ink-muted">{idx + 1}.</span> : null}
                  {row.label}
                </span>
                <span className="shrink-0 tabular-nums text-ink-muted">
                  {row.meta ? <span className="mr-2 text-[12px]">{row.meta}</span> : null}
                  <strong className="text-ink">{row.displayValue}</strong>
                </span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[#eef1f4]">
                <div className={cx("h-full rounded-full transition-[width] duration-200", barColor)} style={{ width: `${widthPct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function DetailTableCard({ table }: { table: AnalyticsTable }) {
  return (
    <Card
      title={
        <div>
          <span>{table.title}</span>
          {table.subtitle ? <span className="ml-2 text-[12px] font-normal text-ink-muted">{table.subtitle}</span> : null}
        </div>
      }
      pad={false}
      testId="analytics-table-card"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-y border-line-soft bg-[#fafafa] text-left text-[11.5px] uppercase tracking-wide text-ink-muted">
              {table.columns.map((col) => (
                <th key={col.key} className={cx("px-4 py-2.5 font-semibold", col.align === "right" && "text-right")}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr key={row.id} data-testid={`analytics-table-row-${row.id}`} className="border-b border-line-soft last:border-b-0">
                {table.columns.map((col, colIndex) => {
                  const raw = row.cells[col.key] ?? "--";
                  const isFirst = colIndex === 0;
                  return (
                    <td
                      key={col.key}
                      className={cx(
                        "px-4 py-2.5",
                        col.align === "right" && "text-right tabular-nums",
                        isFirst && !col.tag && "font-semibold",
                      )}
                    >
                      {col.tag ? (
                        <Tag tone={row.tones?.[col.key] ?? "neutral"}>{raw}</Tag>
                      ) : isFirst && row.linkTo ? (
                        <A to={row.linkTo} className="hs-link">
                          {raw}
                        </A>
                      ) : (
                        raw
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/**
 * Custom Penguin-built HubSpot Credits & Outcomes Attribution panel.
 * This is the ONLY section on a shared analytics report wrapped in `<Ext>`.
 */
function CreditsOutcomePanel({ credits }: { credits: AnalyticsCreditsOutcome }) {
  const allocatedPct = credits.creditsAllocated ? Math.min(100, Math.round((credits.creditsUsed / credits.creditsAllocated) * 100)) : null;
  return (
    <Ext id={credits.extId}>
      <Card
        title={
          <span className="flex items-center gap-2">
            <span>{credits.title ?? "HubSpot Credits & Outcomes Attribution"}</span>
            <AiPill />
          </span>
        }
        right={<Tag tone="purple">{credits.badge ?? "Credits-to-Outcome Model"}</Tag>}
        testId="analytics-credits-card"
      >
        <div className="grid gap-5 lg:grid-cols-[310px_minmax(0,1fr)]">
          <div className="space-y-3 rounded-[10px] border border-penguin/25 bg-penguin-soft/35 p-4">
            <div>
              <p className="text-[11.5px] font-semibold uppercase tracking-wide text-penguin-strong">Credits Consumed</p>
              <p className="mt-0.5 text-[28px] font-bold tabular-nums text-ink" data-testid="analytics-credits-used">
                {num(credits.creditsUsed)} credits
                {credits.creditsAllocated ? <span className="text-[14px] font-normal text-ink-muted"> / {num(credits.creditsAllocated)}</span> : null}
              </p>
              {allocatedPct !== null ? (
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e4def8]">
                  <div className="h-full rounded-full bg-penguin" style={{ width: `${allocatedPct}%` }} />
                </div>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-penguin/20 pt-3">
              <div>
                <p className="text-[11.5px] text-ink-muted">{credits.primaryMetricLabel}</p>
                <p className="mt-0.5 text-[17px] font-bold tabular-nums text-[#0b5b2b]">{credits.primaryMetricValue}</p>
              </div>
              <div>
                <p className="text-[11.5px] text-ink-muted">{credits.secondaryMetricLabel}</p>
                <p className="mt-0.5 text-[17px] font-bold tabular-nums text-ink">{credits.secondaryMetricValue}</p>
              </div>
            </div>
            <p className="text-[12px] leading-snug text-ink-muted">{credits.summary}</p>
          </div>

          <div>
            <p className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Credit burn tied to CRM outcomes</p>
            <ul className="mt-2 space-y-2.5">
              {credits.breakdown.map((row) => (
                <li key={row.action} className="rounded-[8px] border border-line-soft bg-white px-3.5 py-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
                    <span className="font-semibold">{row.action}</span>
                    <span className="font-semibold tabular-nums text-penguin-strong">{num(row.credits)} credits</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#ece8fa]">
                      <div className="h-full rounded-full bg-penguin" style={{ width: `${Math.max(4, Math.min(100, row.sharePct))}%` }} />
                    </div>
                    <span className="text-[12px] text-ink-muted">{row.outcomes}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </Ext>
  );
}

function ReportDashboard({ spec, allReports }: { spec: AnalyticsReportSpec; allReports: AnalyticsReportSpec[] }) {
  const { world, dispatch } = useShell();
  const defaultOptionId = spec.filter?.defaultOptionId ?? spec.filter?.options[0]?.id ?? "";
  const [selectedFilterId, setSelectedFilterId] = useState(defaultOptionId);

  const activeSlice = spec.filter?.options.find((opt) => opt.id === selectedFilterId) ?? spec.filter?.options[0];
  const kpis = activeSlice?.kpis ?? spec.kpis;
  const breakdowns = activeSlice?.breakdowns ?? spec.breakdowns;
  const table = activeSlice?.table ?? spec.table;
  const creditsOutcome = activeSlice?.creditsOutcome ?? spec.creditsOutcome;
  const reviewed = spec.completeFlag ? world.flags[spec.completeFlag] === true : true;

  return (
    <div className="min-h-full pb-8" data-testid="analytics-report-page" data-report-id={spec.id}>
      <header className="border-b border-line bg-white px-6 py-4">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#eef5f5] text-link">
              <Icon name="chart" size={19} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[18px] font-semibold leading-tight" data-testid="analytics-report-title">
                  {spec.title}
                </h1>
                {spec.badge ? <Tag tone={spec.badgeTone ?? "green"}>{spec.badge}</Tag> : null}
              </div>
              <p className="mt-0.5 text-[12.5px] text-ink-muted">{spec.subtitle}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {spec.backLink ? (
              <A to={spec.backLink.to} className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-line bg-white px-3 text-[12.5px] font-semibold hover:bg-[#f5f5f5]">
                {spec.backLink.label}
              </A>
            ) : null}
            {allReports.length > 1 ? (
              <A to="/reports" data-testid="analytics-all-reports" className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-line bg-white px-3 text-[12.5px] font-semibold hover:bg-[#f5f5f5]">
                All reports ({allReports.length})
              </A>
            ) : null}
            {spec.completeFlag && !reviewed ? (
              <Button variant="primary" size="sm" data-testid="analytics-complete-review" onClick={() => dispatch({ t: "flag", k: spec.completeFlag! })}>
                <Icon name="check" size={14} /> Complete review
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] space-y-5 px-6 pt-5">
        {spec.filter && spec.filter.options.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 rounded-[10px] border border-line-soft bg-white px-4 py-2.5" data-testid="analytics-filter-bar">
            <span className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
              <Icon name="filter" size={13} />
              {spec.filter.label}:
            </span>
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={`Filter by ${spec.filter.label}`}>
              {spec.filter.options.map((opt) => {
                const active = opt.id === (activeSlice?.id ?? defaultOptionId);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    data-testid={`analytics-filter-${opt.id}`}
                    aria-pressed={active}
                    onClick={() => setSelectedFilterId(opt.id)}
                    className={cx(
                      "inline-flex h-7 items-center rounded-full px-3 text-[12.5px] font-semibold transition-colors",
                      active ? "bg-ink text-white" : "bg-hs-bg/75 text-ink hover:bg-hs-bg",
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Native HubSpot KPI strip (NO Penguin marker) */}
        <KpiStrip kpis={kpis} />

        {/* Native HubSpot Funnel / Breakdown panels (NO Penguin marker) */}
        {breakdowns.length > 0 ? (
          <div className={cx("grid gap-5", breakdowns.length > 1 ? "lg:grid-cols-2" : "grid-cols-1")} data-testid="analytics-breakdowns">
            {breakdowns.map((panel) => (
              <BreakdownCard key={panel.id} panel={panel} />
            ))}
          </div>
        ) : null}

        {/* Native HubSpot Detail table (NO Penguin marker) */}
        <DetailTableCard table={table} />

        {/* Optional Penguin-built HubSpot Credits & Outcomes Attribution (ONLY Penguin marker) */}
        {creditsOutcome ? <CreditsOutcomePanel credits={creditsOutcome} /> : null}
      </div>
    </div>
  );
}

function ReportsIndex({ reports }: { reports: AnalyticsReportSpec[] }) {
  const { pack } = useShell();
  if (reports.length === 0) {
    return (
      <div className="p-10">
        <Card>
          <Empty title="No custom reports are configured for this portal yet">
            <A to="/deals" className="hs-link">
              Return to Deals
            </A>
          </Empty>
        </Card>
      </div>
    );
  }
  return (
    <div className="min-h-full pb-8" data-testid="analytics-reports-index">
      <header className="border-b border-line bg-white px-6 py-4">
        <div className="mx-auto flex max-w-[1200px] items-center gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#eef5f5] text-link">
            <Icon name="chart" size={19} />
          </span>
          <div>
            <h1 className="text-[18px] font-semibold leading-tight">Reports &amp; Dashboards</h1>
            <p className="mt-0.5 text-[12.5px] text-ink-muted">{pack.portal.company} · HubSpot Reporting</p>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1200px] gap-4 px-6 pt-5 md:grid-cols-2">
        {reports.map((report) => (
          <Card key={report.id} testId={`report-card-${report.id}`}>
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-[15.5px] font-semibold">{report.title}</h2>
              {report.creditsOutcome ? <Tag tone="purple">Includes Credits ROI</Tag> : report.badge ? <Tag tone={report.badgeTone ?? "green"}>{report.badge}</Tag> : null}
            </div>
            <p className="mt-1.5 text-[13px] leading-snug text-ink-muted">{report.subtitle}</p>
            <div className="mt-4 flex items-center justify-between border-t border-line-soft pt-3 text-[12.5px]">
              <span className="text-ink-muted">
                {report.kpis.length} KPIs · {report.breakdowns.length} charts · {report.table.rows.length} rows
              </span>
              <A to={`/reports/${report.id}`} data-testid={`open-report-${report.id}`} className="hs-link">
                Open report
              </A>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsRouteView({ reportId }: { reportId?: string }) {
  const { pack } = useShell();
  const reportsMap = pack.reports ?? {};
  const allReports = Object.values(reportsMap);

  if (!reportId) return <ReportsIndex reports={allReports} />;

  const spec = reportsMap[reportId];
  if (!spec) {
    return (
      <div className="p-10" data-testid="analytics-report-missing">
        <Card>
          <Empty title="That report is not part of this portal">
            {allReports.length > 0 ? (
              <A to="/reports" className="hs-link">
                Browse available reports
              </A>
            ) : (
              <A to="/deals" className="hs-link">
                Go to deals
              </A>
            )}
          </Empty>
        </Card>
      </div>
    );
  }

  return <ReportDashboard key={spec.id} spec={spec} allReports={allReports} />;
}
