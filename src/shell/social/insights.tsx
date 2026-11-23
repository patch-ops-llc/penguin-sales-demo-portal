"use client";

import { useMemo, useState } from "react";
import { useShell } from "@/store/store";
import { Ext } from "../ext";
import { compactMoney, money, num, relative } from "../format";
import { Icon } from "../icons";
import { A, Button, Card, cx, Empty, Tag } from "../ui";
import type { CampaignInsightRow } from "./types";

const CHANNELS: ("All" | CampaignInsightRow["channel"])[] = [
  "All",
  "Google Search Ads",
  "LinkedIn Paid Social",
  "Facebook & Instagram",
  "Organic Social",
  "X",
];

/**
 * HubSpot Marketing > Insights dashboard (Step 13 of Flow 3).
 * Native HubSpot Marketing & Ads Insights carries NO Penguin marker.
 * Only the bottom Staffing ATS / VMS Placement Revenue Attribution card carries a Penguin marker
 * (`ats-placement-attribution`), representing the custom ATS/VMS ROI sync Penguin would build.
 */
export function InsightsPage() {
  const { pack, world, dispatch, setEndCardOpen } = useShell();
  const cfg = pack.demos.socialAds;
  const [channel, setChannel] = useState<"All" | CampaignInsightRow["channel"]>("All");

  const rows = useMemo(() => {
    if (!cfg) return [];
    // Live session attribution: once Rachel Morales submits in Step 8, add her lead & $168k deal to LinkedIn Paid Social.
    return cfg.insights.map((r) =>
      world.sa.submitted && r.id === "in-linkedin-q1"
        ? { ...r, clicks: r.clicks + 1, leads: r.leads + 1, mqls: r.mqls + 1, pipeline: r.pipeline + cfg.landingPage.lead.dealAmount }
        : r,
    );
  }, [cfg, world.sa.submitted]);

  if (!cfg) {
    return (
      <div className="p-10">
        <Card>
          <Empty title="Marketing Insights is not part of this vertical's demos">
            <A to="/deals" className="hs-link">
              Go to deals
            </A>
          </Empty>
        </Card>
      </div>
    );
  }

  const filtered = channel === "All" ? rows : rows.filter((r) => r.channel === channel);
  const totals = filtered.reduce(
    (acc, r) => ({
      spend: acc.spend + r.spend,
      clicks: acc.clicks + r.clicks,
      leads: acc.leads + r.leads,
      mqls: acc.mqls + r.mqls,
      pipeline: acc.pipeline + r.pipeline,
      placements: acc.placements + r.filledPlacements,
      placementRevenue: acc.placementRevenue + r.placementRevenue,
    }),
    { spend: 0, clicks: 0, leads: 0, mqls: 0, pipeline: 0, placements: 0, placementRevenue: 0 },
  );
  const cpl = totals.leads > 0 ? Math.round(totals.spend / totals.leads) : 0;
  const roas = totals.spend > 0 ? (totals.pipeline / totals.spend).toFixed(1) : "—";
  const placementRoas = totals.spend > 0 ? (totals.placementRevenue / totals.spend).toFixed(1) : "—";

  // Aggregate by channel for visual bar comparison
  const byChannel = CHANNELS.filter((c): c is CampaignInsightRow["channel"] => c !== "All").map((ch) => {
    const list = rows.filter((r) => r.channel === ch);
    return {
      channel: ch,
      spend: list.reduce((s, r) => s + r.spend, 0),
      leads: list.reduce((s, r) => s + r.leads, 0),
      pipeline: list.reduce((s, r) => s + r.pipeline, 0),
      placements: list.reduce((s, r) => s + r.filledPlacements, 0),
      placementRevenue: list.reduce((s, r) => s + r.placementRevenue, 0),
    };
  });
  const maxPipeline = Math.max(...byChannel.map((c) => c.pipeline), 1);

  return (
    <div className="min-h-full px-6 py-5" data-testid="insights-page">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">Marketing &rsaquo; Reports &amp; Insights</p>
          <h1 className="mt-0.5 text-[24px] font-semibold tracking-tight">Social &amp; Paid Ads Insights</h1>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            Simulated Q1 healthcare staffing campaign data &mdash; ad spend, leads, cost per lead, and job-order pipeline by campaign and channel.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tag tone="amber">Simulated ads &amp; social dataset</Tag>
          <Button
            variant="primary"
            data-testid="insights-finish"
            onClick={() => {
              dispatch({ t: "sa.seenInsights" });
              setEndCardOpen(true);
            }}
          >
            Wrap up demo <Icon name="check" size={15} />
          </Button>
        </div>
      </div>

      {world.sa.submitted ? (
        <div className="mt-3 flex items-center gap-2 rounded-[8px] border border-[#b7e2c4] bg-[#eefaf1] px-4 py-2 text-[13px] text-[#0b5b2b]" data-testid="insights-live-update">
          <Icon name="check" size={15} />
          <span>
            Live session update: <strong>Rachel Morales (Cedar Valley Medical Center)</strong> added <strong>+1 Lead</strong> and{" "}
            <strong>+{money(cfg.landingPage.lead.dealAmount)} pipeline</strong> to <strong>LinkedIn Paid Social</strong>.
          </span>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2" data-testid="insights-channel-filters">
        {CHANNELS.map((ch) => (
          <button
            key={ch}
            type="button"
            data-testid={`insights-filter-${ch.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
            onClick={() => setChannel(ch)}
            className={cx(
              "h-8 rounded-full border px-3.5 text-[12.5px] font-semibold transition-colors",
              channel === ch ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:border-ink",
            )}
          >
            {ch === "All" ? "All channels" : ch}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-5 gap-3.5" data-testid="insights-kpis">
        <Card>
          <p className="text-[12px] font-medium text-ink-muted">Ad spend</p>
          <p className="mt-1 text-[24px] font-bold tabular-nums" data-testid="kpi-spend">
            {money(totals.spend)}
          </p>
          <p className="mt-1 text-[11.5px] text-ink-muted">{num(totals.clicks)} ad &amp; social clicks</p>
        </Card>
        <Card>
          <p className="text-[12px] font-medium text-ink-muted">Staffing leads</p>
          <p className="mt-1 text-[24px] font-bold tabular-nums" data-testid="kpi-leads">
            {num(totals.leads)}
          </p>
          <p className="mt-1 text-[11.5px] text-ink-muted">{num(totals.mqls)} hospital MQLs</p>
        </Card>
        <Card>
          <p className="text-[12px] font-medium text-ink-muted">Cost per lead (CPL)</p>
          <p className="mt-1 text-[24px] font-bold tabular-nums" data-testid="kpi-cpl">
            {totals.spend > 0 ? money(cpl) : "$0"}
          </p>
          <p className="mt-1 text-[11.5px] text-[#0b5b2b]">14% under Q1 target ($310)</p>
        </Card>
        <Card>
          <p className="text-[12px] font-medium text-ink-muted">Attributed pipeline</p>
          <p className="mt-1 text-[24px] font-bold tabular-nums text-[#00514f]" data-testid="kpi-pipeline">
            {money(totals.pipeline)}
          </p>
          <p className="mt-1 text-[11.5px] text-ink-muted">Across {filtered.length} campaign {filtered.length === 1 ? "line" : "lines"}</p>
        </Card>
        <Card>
          <p className="text-[12px] font-medium text-ink-muted">Pipeline / spend</p>
          <p className="mt-1 text-[24px] font-bold tabular-nums">{roas === "—" ? roas : `${roas}x`}</p>
          <p className="mt-1 text-[11.5px] text-ink-muted">Multi-touch HubSpot attribution</p>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-[380px_minmax(0,1fr)] gap-4">
        <Card title="Pipeline & leads by channel" testId="insights-channel-chart">
          <div className="space-y-3.5">
            {byChannel.map((row) => {
              const pct = Math.max(4, Math.round((row.pipeline / maxPipeline) * 100));
              const active = channel === "All" || channel === row.channel;
              return (
                <button
                  key={row.channel}
                  type="button"
                  onClick={() => setChannel(channel === row.channel ? "All" : row.channel)}
                  className={cx("block w-full text-left transition-opacity", !active && "opacity-40")}
                >
                  <div className="flex items-baseline justify-between text-[12.5px]">
                    <span className="font-semibold">{row.channel}</span>
                    <span className="tabular-nums text-ink-muted">
                      <strong className="text-ink">{compactMoney(row.pipeline)}</strong> &middot; {row.leads} leads
                    </span>
                  </div>
                  <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-[#ececec]">
                    <div
                      className={cx("h-full rounded-full", row.channel === "Google Search Ads" ? "bg-[#1a73e8]" : row.channel === "LinkedIn Paid Social" ? "bg-[#0a66c2]" : row.channel === "Organic Social" ? "bg-[#1a7f5a]" : "bg-[#ff4800]")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-[11.5px] text-ink-muted">
                    Spend: {money(row.spend)} &middot; CPL: {row.leads > 0 && row.spend > 0 ? money(Math.round(row.spend / row.leads)) : "$0 (organic)"}
                  </p>
                </button>
              );
            })}
          </div>
        </Card>

        <Card title="Campaign & channel breakdown" pad={false} testId="insights-table">
          <div className="overflow-x-auto border-t border-line-soft">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-line-soft bg-[#fafafa] text-left text-[11.5px] uppercase tracking-wide text-ink-muted">
                  <th className="px-4 py-2.5 font-semibold">Campaign</th>
                  <th className="px-3 py-2.5 font-semibold">Channel</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Spend</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Clicks</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Leads</th>
                  <th className="px-3 py-2.5 text-right font-semibold">CPL</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Pipeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {filtered.map((r) => (
                  <tr key={r.id} className={cx("hover:bg-[#fafafa]", world.sa.submitted && r.id === "in-linkedin-q1" && "bg-[#f3fbf5]")}>
                    <td className="px-4 py-2.5 font-semibold">{r.campaign}</td>
                    <td className="px-3 py-2.5 text-ink-muted">{r.channel}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{money(r.spend)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{num(r.clicks)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{num(r.leads)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{r.spend > 0 && r.leads > 0 ? money(Math.round(r.spend / r.leads)) : "$0"}</td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-[#00514f]">{money(r.pipeline)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Custom Penguin extension: ATS / VMS placement revenue attribution synced back into HubSpot ROI */}
      <Ext id="ats-placement-attribution" className="mt-4">
        <Card
          title={
            <span className="flex items-center gap-2">
              <Icon name="sync" size={16} className="text-penguin" />
              Staffing ATS / VMS Placement Revenue Attribution
            </span>
          }
          right={
            <span className="text-[12px] text-ink-muted">
              Synced from <strong>{cfg.atsSyncMeta.systemName}</strong> &middot; {relative(cfg.atsSyncMeta.syncedAt)}
            </span>
          }
          testId="ats-attribution-card"
        >
          <p className="text-[13px] text-ink-muted">
            HubSpot natively tracks ad spend, clicks, leads, and job-order pipeline. This custom Penguin integration feeds back verified filled travel-RN shifts and placement margin from {cfg.atsSyncMeta.systemName} so marketing can measure true filled revenue by campaign.
          </p>
          <div className="mt-3 grid grid-cols-5 gap-3">
            <div className="rounded-[8px] border border-line-soft bg-[#fafafa] p-3">
              <p className="text-[11.5px] text-ink-muted">Filled RN placements</p>
              <p className="mt-0.5 text-[20px] font-bold tabular-nums">{totals.placements}</p>
            </div>
            <div className="rounded-[8px] border border-line-soft bg-[#fafafa] p-3">
              <p className="text-[11.5px] text-ink-muted">Verified placement revenue</p>
              <p className="mt-0.5 text-[20px] font-bold tabular-nums text-[#0b5b2b]">{money(totals.placementRevenue)}</p>
            </div>
            <div className="rounded-[8px] border border-line-soft bg-[#fafafa] p-3">
              <p className="text-[11.5px] text-ink-muted">Avg. bill rate</p>
              <p className="mt-0.5 text-[20px] font-bold tabular-nums">${cfg.atsSyncMeta.avgBillRate}/hr</p>
            </div>
            <div className="rounded-[8px] border border-line-soft bg-[#fafafa] p-3">
              <p className="text-[11.5px] text-ink-muted">Net staffing margin</p>
              <p className="mt-0.5 text-[20px] font-bold tabular-nums">{cfg.atsSyncMeta.avgMarginPct}%</p>
            </div>
            <div className="rounded-[8px] border border-line-soft bg-[#fafafa] p-3">
              <p className="text-[11.5px] text-ink-muted">Verified placement ROAS</p>
              <p className="mt-0.5 text-[20px] font-bold tabular-nums">{placementRoas === "—" ? placementRoas : `${placementRoas}x`}</p>
            </div>
          </div>
        </Card>
      </Ext>
    </div>
  );
}
