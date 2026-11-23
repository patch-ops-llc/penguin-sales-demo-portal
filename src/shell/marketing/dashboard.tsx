"use client";

import { useState } from "react";
import { useShell } from "@/store/store";
import { Ext } from "../ext";
import { compactMoney, money, num } from "../format";
import { Icon } from "../icons";
import { A, AiPill, Button, Card, cx, Empty, Tag } from "../ui";

/**
 * Step 15: Campaign Performance Dashboard.
 *
 * Native HubSpot sections (NO Penguin marker):
 * - Top KPIs (Leads, MQLs, Meetings Booked, Attributed Pipeline)
 * - Campaign Conversion Funnel
 * - Channel Performance & Content Remix Asset Attribution
 *
 * Built by Penguin (wrapped in <Ext id="credits-outcome-bridge">):
 * - HubSpot Credits-to-Pipeline Outcome Attribution card tying Marketing Studio & Breeze
 *   credits directly to booked meetings, cost-per-meeting, and attributed pipeline.
 */
export function MarketingDashboardPage() {
  const { pack, world, dispatch } = useShell();
  const config = pack.demos.marketingStudio;
  const [scope, setScope] = useState<"all" | "kestrel">("all");

  if (!config) {
    return (
      <div className="p-10">
        <Card>
          <Empty title="Campaign dashboard is available in the SaaS demo">Switch to Lumenstack to view the Marketing Studio performance dashboard.</Empty>
        </Card>
      </div>
    );
  }

  const base = config.dashboard.baseline;
  const convertedAdd = world.ms.converted ? 1 : 0;
  const meetingAdd = world.ms.meetingBooked ? 1 : 0;
  const dealAmount = world.ms.meetingBooked ? (world.deals.find((d) => d.id === world.ms.dealId)?.amount ?? config.deal.amount) : 0;
  const liveCreditsAdd = world.ms.meetingBooked ? 32 : world.ms.converted ? 18 : 0;

  const totalLeads = scope === "kestrel" ? (convertedAdd ? 1 : 0) : base.leads + convertedAdd;
  const totalMqls = scope === "kestrel" ? (convertedAdd ? 1 : 0) : base.mqls + convertedAdd;
  const totalMeetings = scope === "kestrel" ? meetingAdd : base.meetings + meetingAdd;
  const totalPipeline = scope === "kestrel" ? dealAmount : base.pipeline + dealAmount;
  const totalCredits = scope === "kestrel" ? (world.ms.meetingBooked ? 32 : 24) : base.creditsUsed + liveCreditsAdd;
  const pipelinePer1kCredits = totalCredits > 0 ? Math.round((totalPipeline / totalCredits) * 1000) : 0;
  const creditsPerMeeting = totalMeetings > 0 ? Math.round(totalCredits / totalMeetings) : 0;

  const funnel = [
    { label: "Tier 1 ICP Accounts Reached", value: scope === "kestrel" ? 1 : base.accountsReached, pct: 100, color: "bg-[#334155]" },
    { label: "Buying Contacts Engaged", value: scope === "kestrel" ? 3 : base.contactsEngaged + convertedAdd, pct: 74, color: "bg-[#0b6e6e]" },
    { label: "Playbook Conversions (Leads)", value: totalLeads, pct: 52, color: "bg-[#2563eb]" },
    { label: "Marketing Qualified Leads (MQLs)", value: totalMqls, pct: 34, color: "bg-[#d20587]" },
    { label: "Meetings Booked", value: totalMeetings, pct: 19, color: "bg-hs-orange" },
  ];

  const maxChannelPipeline = Math.max(...config.dashboard.channels.map((c) => c.pipeline), 1);
  const reviewed = world.flags["ms.dashboardReviewed"] === true;

  return (
    <div className="min-h-full pb-8" data-testid="marketing-dashboard-page">
      <header className="border-b border-line bg-white px-6 py-4">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#eef5f5] text-link">
              <Icon name="chart" size={19} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[18px] font-semibold leading-tight">Campaign Performance Dashboard</h1>
                <Tag tone="green">Live attribution</Tag>
              </div>
              <p className="mt-0.5 text-[12.5px] text-ink-muted">{config.campaignName}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex overflow-hidden rounded-[6px] border border-line bg-white" role="group" aria-label="Dashboard scope">
              <button
                type="button"
                data-testid="ms-scope-all"
                aria-pressed={scope === "all"}
                onClick={() => setScope("all")}
                className={cx("h-8 px-3 text-[12.5px] font-semibold", scope === "all" ? "bg-ink text-white" : "hover:bg-[#f0f0f0]")}
              >
                All ICP Accounts ({base.accountsReached})
              </button>
              <button
                type="button"
                data-testid="ms-scope-kestrel"
                aria-pressed={scope === "kestrel"}
                onClick={() => setScope("kestrel")}
                className={cx("h-8 px-3 text-[12.5px] font-semibold", scope === "kestrel" ? "bg-ink text-white" : "hover:bg-[#f0f0f0]")}
              >
                Kestrel Ops Only
              </button>
            </div>

            <A to="/marketing/studio" className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-line bg-white px-3 text-[12.5px] font-semibold hover:bg-[#f5f5f5]">
              Marketing Studio
            </A>
            {!reviewed ? (
              <Button variant="primary" size="sm" data-testid="ms-finish-dashboard" onClick={() => dispatch({ t: "flag", k: "ms.dashboardReviewed" })}>
                <Icon name="check" size={14} /> Complete review
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] space-y-5 px-6 pt-5">
        {/* Native HubSpot KPI strip */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="ms-kpi-grid">
          <Card testId="ms-kpi-leads">
            <p className="text-[12px] font-semibold text-ink-muted">Leads Generated</p>
            <p className="mt-1 text-[28px] font-bold leading-none">{num(totalLeads)}</p>
            <p className="mt-2 text-[12px] text-[#0b5b2b]">{convertedAdd ? "+1 live from Kestrel Ops" : "From 42 Tier 1 ICP accounts"}</p>
          </Card>
          <Card testId="ms-kpi-mqls">
            <p className="text-[12px] font-semibold text-ink-muted">Marketing Qualified Leads</p>
            <p className="mt-1 text-[28px] font-bold leading-none">{num(totalMqls)}</p>
            <p className="mt-2 text-[12px] text-ink-muted">{totalLeads > 0 ? `${Math.round((totalMqls / totalLeads) * 100)}% MQL rate` : "0% MQL rate"}</p>
          </Card>
          <Card testId="ms-kpi-meetings">
            <p className="text-[12px] font-semibold text-ink-muted">Meetings Booked</p>
            <p className="mt-1 text-[28px] font-bold leading-none">{num(totalMeetings)}</p>
            <p className="mt-2 text-[12px] text-[#0b5b2b]">{meetingAdd ? "+1 booked with Elena Morales" : "Via rep follow-up links"}</p>
          </Card>
          <Card testId="ms-kpi-pipeline">
            <p className="text-[12px] font-semibold text-ink-muted">Attributed Pipeline</p>
            <p className="mt-1 text-[28px] font-bold leading-none">{money(totalPipeline)}</p>
            <p className="mt-2 text-[12px] text-[#0b5b2b]">
              {dealAmount > 0 ? (
                <A to={`/deals/${world.ms.dealId ?? config.deal.id}`} className="hs-link">
                  Includes {money(dealAmount)} Kestrel Ops deal
                </A>
              ) : (
                "Active Discovery & Solution Fit deals"
              )}
            </p>
          </Card>
        </div>

        {/* Custom Penguin Extension: HubSpot Credits-to-Pipeline Outcome Attribution */}
        <Ext id="credits-outcome-bridge">
          <Card
            title={
              <span className="flex items-center gap-2">
                <span>HubSpot Credits-to-Pipeline Outcome Attribution</span>
                <AiPill />
              </span>
            }
            right={<Tag tone="purple">Credits-to-Outcome Model</Tag>}
            testId="ms-credits-card"
          >
            <div className="grid gap-5 lg:grid-cols-[310px_minmax(0,1fr)]">
              <div className="space-y-3 rounded-[10px] border border-penguin/25 bg-penguin-soft/35 p-4">
                <div>
                  <p className="text-[11.5px] font-semibold uppercase tracking-wide text-penguin-strong">Credits Consumed</p>
                  <p className="mt-0.5 text-[28px] font-bold text-ink" data-testid="ms-credits-used">
                    {num(totalCredits)} credits
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 border-t border-penguin/20 pt-3">
                  <div>
                    <p className="text-[11.5px] text-ink-muted">Pipeline / 1K credits</p>
                    <p className="mt-0.5 text-[17px] font-bold text-[#0b5b2b]">{compactMoney(pipelinePer1kCredits)}</p>
                  </div>
                  <div>
                    <p className="text-[11.5px] text-ink-muted">Credits / meeting</p>
                    <p className="mt-0.5 text-[17px] font-bold text-ink">{creditsPerMeeting > 0 ? `${creditsPerMeeting} cr` : "--"}</p>
                  </div>
                </div>
                <p className="text-[12px] leading-snug text-ink-muted">
                  Ties Marketing Studio, Content Remix, and Breeze enrichment credit burn directly to meetings booked and CRM pipeline.
                </p>
              </div>

              <div>
                <p className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Where HubSpot Credits created pipeline</p>
                <ul className="mt-2 space-y-2.5">
                  {config.dashboard.creditBreakdown.map((row) => (
                    <li key={row.action} className="rounded-[8px] border border-line-soft bg-white px-3.5 py-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
                        <span className="font-semibold">{row.action}</span>
                        <span className="font-semibold text-penguin-strong">{row.credits} credits</span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-3">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#ece8fa]">
                          <div className="h-full rounded-full bg-penguin" style={{ width: `${row.sharePct}%` }} />
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

        {/* Native HubSpot Funnel & Channel Breakdown */}
        <div className="grid gap-5 lg:grid-cols-2">
          <Card title="Campaign Conversion Funnel">
            <div className="space-y-3">
              {funnel.map((step) => (
                <div key={step.label}>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-medium">{step.label}</span>
                    <span className="font-bold tabular-nums">{num(step.value)}</span>
                  </div>
                  <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-[#eef1f4]">
                    <div className={cx("h-full rounded-full", step.color)} style={{ width: `${step.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Attributed Pipeline by Channel">
            <div className="space-y-3.5">
              {config.dashboard.channels.map((ch) => (
                <div key={ch.channel}>
                  <div className="flex items-baseline justify-between gap-2 text-[13px]">
                    <span className="font-semibold">{ch.channel}</span>
                    <span className="text-[12px] text-ink-muted">
                      {ch.leads} leads · {ch.meetings} mtgs · <strong className="text-ink">{money(ch.pipeline)}</strong>
                    </span>
                  </div>
                  <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-[#eef1f4]">
                    <div className="h-full rounded-full bg-hs-orange" style={{ width: `${Math.round((ch.pipeline / maxChannelPipeline) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Native HubSpot Content Remix Asset Performance Table */}
        <Card title="Content Remix Asset Performance" pad={false}>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-y border-line-soft bg-[#fafafa] text-left text-[11.5px] uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-2.5 font-semibold">Format</th>
                <th className="px-4 py-2.5 font-semibold">Remixed asset</th>
                <th className="px-4 py-2.5 text-right font-semibold">Views</th>
                <th className="px-4 py-2.5 text-right font-semibold">Clicks</th>
                <th className="px-4 py-2.5 text-right font-semibold">Conversions</th>
                <th className="px-4 py-2.5 text-right font-semibold">Influenced pipeline</th>
              </tr>
            </thead>
            <tbody>
              {config.dashboard.assets.map((row) => (
                <tr key={row.format} className="border-b border-line-soft last:border-b-0">
                  <td className="px-4 py-2.5">
                    <Tag tone="blue">{row.format}</Tag>
                  </td>
                  <td className="px-4 py-2.5 font-semibold">{row.title}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{num(row.views)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{num(row.clicks)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{num(row.conversions)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{money(row.influencedPipeline)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
