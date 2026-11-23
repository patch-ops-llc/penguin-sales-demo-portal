"use client";

import { useState } from "react";
import { useShell } from "@/store/store";
import {
  isServiceDeskConfig,
  type AnalyticsCreditsOutcome,
  type FintechCustomerAgentConfig,
  type ServiceChannel,
  type ServiceDeskCustomerAgentConfig,
} from "@/verticals/types";
import { Ext } from "../ext";
import { num } from "../format";
import { Icon, Sparkle } from "../icons";
import { A, AiPill, Button, Card, cx, Empty, Tag } from "../ui";

/**
 * Service Hub Analytics Dashboard.
 * Native HubSpot KPIs, channel charts, trend charts, and handoff reasons carry NO Penguin marker.
 * When a vertical configures `creditsOutcome` (Healthcare & IT Services), ONLY that custom
 * Credits-to-Outcome Attribution panel carries the pulsing Penguin pin.
 */
export function ServiceDashboardPage() {
  const { pack } = useShell();
  const cfg = pack.demos.customerAgent;

  if (!cfg) {
    return (
      <div className="p-10">
        <Card>
          <Empty title="Service Dashboard is not configured for this vertical">
            Switch to Healthcare, IT Services, or Financial Services to view Breeze Customer Agent analytics.
          </Empty>
        </Card>
      </div>
    );
  }

  if (isServiceDeskConfig(cfg)) {
    return <ServiceDeskDashboard cfg={cfg} />;
  }
  return <FintechServiceDashboard cfg={cfg} />;
}

function CreditsOutcomeAttributionCard({ credits }: { credits: AnalyticsCreditsOutcome }) {
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
        testId="service-credits-outcome-card"
      >
        <div className="grid gap-5 lg:grid-cols-[310px_minmax(0,1fr)]">
          <div className="space-y-3 rounded-[10px] border border-penguin/25 bg-penguin-soft/35 p-4">
            <div>
              <p className="text-[11.5px] font-semibold uppercase tracking-wide text-penguin-strong">Credits Consumed</p>
              <p className="mt-0.5 text-[28px] font-bold tabular-nums text-ink" data-testid="service-credits-outcome-used">
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
            <p className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Credit burn tied to Service outcomes</p>
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

function ServiceDeskDashboard({ cfg }: { cfg: ServiceDeskCustomerAgentConfig }) {
  const { world, dispatch, setEndCardOpen } = useShell();
  const [periodId, setPeriodId] = useState<"7d" | "30d" | "90d">("30d");
  const [channelFilter, setChannelFilter] = useState<string>("all");

  const period = cfg.dashboard.periods[periodId];
  const goalPct = cfg.dashboard.goalPct;
  const selectedChannel = channelFilter === "all" ? null : period.channels.find((c) => c.label === channelFilter) ?? null;

  const totalConversations = selectedChannel ? selectedChannel.volume : period.totalConversations;
  const autonomousResolved = selectedChannel ? selectedChannel.resolved : period.autonomousResolved;
  const handoffs = selectedChannel ? selectedChannel.handoffs : period.handoffs;
  const resolutionRatePct = selectedChannel ? selectedChannel.resolutionPct : period.resolutionRatePct;
  const handoffRatePct = Number(((handoffs / Math.max(totalConversations, 1)) * 100).toFixed(1));
  const maxChannelVol = Math.max(...period.channels.map((c) => c.volume), 1);

  const sessionResolved = Number(world.ca.chatResolved) + Number(world.ca.emailReplied);
  const sessionHandoffs = Number(world.ca.fraudHandedOff);

  const W = 440;
  const H = 165;
  const padL = 36;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const minY = 55;
  const maxY = 88;
  const xAt = (i: number) => padL + (i / Math.max(period.trend.length - 1, 1)) * (W - padL - padR);
  const yAt = (pct: number) => padT + ((maxY - pct) / (maxY - minY)) * (H - padT - padB);
  const goalY = yAt(goalPct);
  const linePoints = period.trend.map((pt, i) => `${xAt(i).toFixed(1)},${yAt(pt.resolutionPct).toFixed(1)}`).join(" ");
  const areaPath =
    `M ${xAt(0).toFixed(1)},${(H - padB).toFixed(1)} ` +
    period.trend.map((pt, i) => `L ${xAt(i).toFixed(1)},${yAt(pt.resolutionPct).toFixed(1)}`).join(" ") +
    ` L ${xAt(period.trend.length - 1).toFixed(1)},${(H - padB).toFixed(1)} Z`;

  return (
    <div className="mx-auto max-w-[1260px] space-y-5 px-6 py-5" data-testid="service-dashboard-page">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-breeze-soft text-breeze">
              <Sparkle size={15} />
            </span>
            <h1 className="text-[20px] font-semibold tracking-tight">{cfg.dashboard.title}</h1>
          </div>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            {cfg.dashboard.subtitle}
            {sessionResolved + sessionHandoffs > 0 ? ` · Includes ${sessionResolved} autonomous & ${sessionHandoffs} handoff from this session` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-[6px] border border-line bg-white p-0.5">
            {(["7d", "30d", "90d"] as const).map((pid) => (
              <button
                key={pid}
                type="button"
                onClick={() => setPeriodId(pid)}
                data-testid={`dash-period-${pid}`}
                className={cx("rounded-[4px] px-3 py-1 text-[12.5px] font-semibold", periodId === pid ? "bg-ink text-white" : "text-ink-muted hover:text-ink")}
              >
                {cfg.dashboard.periods[pid].label}
              </button>
            ))}
          </div>

          <div className="inline-flex overflow-hidden rounded-[6px] border border-line bg-white p-0.5">
            <button
              type="button"
              onClick={() => setChannelFilter("all")}
              data-testid="dash-channel-all"
              className={cx("rounded-[4px] px-2.5 py-1 text-[12.5px] font-semibold", channelFilter === "all" ? "bg-hs-orange text-white" : "text-ink-muted hover:text-ink")}
            >
              All
            </button>
            {period.channels.map((ch) => (
              <button
                key={ch.label}
                type="button"
                onClick={() => setChannelFilter(ch.label)}
                data-testid={`dash-channel-${ch.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                className={cx("rounded-[4px] px-2.5 py-1 text-[12.5px] font-semibold", channelFilter === ch.label ? "bg-hs-orange text-white" : "text-ink-muted hover:text-ink")}
              >
                {ch.label}
              </button>
            ))}
          </div>

          {cfg.dashboard.reportId ? (
            <A
              to={`/reports/${cfg.dashboard.reportId}`}
              data-testid="dash-open-report"
              className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-line bg-white px-3 text-[12.5px] font-semibold text-ink hover:bg-[#f5f5f5]"
            >
              Full Report
            </A>
          ) : null}

          {!world.ca.dashboardReviewed ? (
            <Button
              variant="primary"
              size="sm"
              data-testid="dash-complete-btn"
              onClick={() => {
                dispatch({ t: "ca.reviewDashboard" });
                setEndCardOpen(true);
              }}
            >
              Finish &amp; wrap up
            </Button>
          ) : (
            <A to="/service" className="hs-link text-[13px]">
              Back to Help Desk
            </A>
          )}
        </div>
      </header>

      {/* Native HubSpot KPI Row — ZERO Penguin markers */}
      <div className="grid grid-cols-4 gap-4" data-testid="service-kpi-grid">
        <Card testId="kpi-volume">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
            {cfg.mode === "clinic-front-desk" ? "Patient Inquiries" : "Service Desk Tickets"}
          </p>
          <p className="mt-1.5 text-[28px] font-bold tabular-nums leading-none">{num(totalConversations)}</p>
          <p className="mt-2 text-[12.5px] text-ink-muted">
            {selectedChannel ? `${selectedChannel.label} · avg ${selectedChannel.avgSeconds}s handle` : `Avg handle ${period.avgHandleSeconds}s · CSAT ${period.csat}/5`}
          </p>
        </Card>

        <Card testId="kpi-resolution" className="border-[#bfe3cd] bg-[#f8fdf9]">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[#0b5b2b]">Auto-Resolution Rate</p>
            <Tag tone="green">{goalPct}%+ target</Tag>
          </div>
          <p className="mt-1.5 text-[28px] font-bold tabular-nums leading-none text-[#0b5b2b]" data-testid="kpi-resolution-value">
            {resolutionRatePct.toFixed(1)}%
          </p>
          <p className="mt-2 text-[12.5px] text-[#1e5c3a]">
            {num(autonomousResolved)} resolved autonomously · {period.resolutionDelta}
          </p>
        </Card>

        {cfg.dashboard.highlightKpi === "after-hours" ? (
          <Card testId="kpi-highlight">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">After-Hours Coverage</p>
              <Tag tone="teal">6 PM – 8 AM</Tag>
            </div>
            <p className="mt-1.5 text-[28px] font-bold tabular-nums leading-none" data-testid="kpi-highlight-value">
              {(period.afterHoursPct ?? 62.8).toFixed(1)}%
            </p>
            <p className="mt-2 text-[12.5px] text-ink-muted">
              {num(period.afterHoursCount ?? 0)} inquiries handled while clinic phones closed
            </p>
          </Card>
        ) : (
          <Card testId="kpi-highlight">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">Median First Response</p>
              <Tag tone="teal">SLA Compliant</Tag>
            </div>
            <p className="mt-1.5 text-[28px] font-bold tabular-nums leading-none" data-testid="kpi-highlight-value">
              {selectedChannel ? `${selectedChannel.avgSeconds}s` : `${period.medianFrtSeconds ?? 42}s`}
            </p>
            <p className="mt-2 text-[12.5px] text-ink-muted">
              AI FRT · L2 escalated tickets avg {period.humanFrtLabel ?? "11m"} (15m P1 SLA)
            </p>
          </Card>
        )}

        <Card testId="kpi-handoffs">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
            {cfg.mode === "clinic-front-desk" ? "Staff Clinical Handoffs" : "L2 Engineer Handoffs"}
          </p>
          <p className="mt-1.5 text-[28px] font-bold tabular-nums leading-none">{num(handoffs)}</p>
          <p className="mt-2 text-[12.5px] text-ink-muted">
            {handoffRatePct}% of volume · {cfg.mode === "clinic-front-desk" ? "0% medical advice given" : "100% with AI diagnostic summary"}
          </p>
        </Card>
      </div>

      {/* Native Charts Grid — ZERO Penguin markers */}
      <div className="grid grid-cols-2 gap-4" data-testid="service-charts-grid">
        <Card
          title={cfg.mode === "clinic-front-desk" ? "Volume & Resolution by Shift Window" : "Tickets & Auto-Resolution by Channel"}
          right={<Tag>Click a bar to filter</Tag>}
          testId="chart-channels"
        >
          <div className="space-y-4">
            {period.channels.map((ch) => {
              const totalW = Math.round((ch.volume / maxChannelVol) * 100);
              const resolvedW = Math.round((ch.resolved / ch.volume) * 100);
              const active = channelFilter === ch.label;
              return (
                <button
                  key={ch.label}
                  type="button"
                  onClick={() => setChannelFilter(active ? "all" : ch.label)}
                  data-testid={`chart-bar-${ch.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                  className={cx("block w-full rounded-[8px] border p-3 text-left transition-colors", active ? "border-hs-orange bg-[#fff9f6]" : "border-line-soft hover:border-line")}
                >
                  <div className="flex items-baseline justify-between gap-2 text-[13px]">
                    <span className="font-semibold">{ch.label}</span>
                    <span className="tabular-nums text-ink-muted">
                      <strong className="text-ink">{num(ch.volume)}</strong> total · <strong className="text-[#0b5b2b]">{ch.resolutionPct.toFixed(1)}%</strong> autonomous ({num(ch.resolved)}) · {num(ch.handoffs)} handoffs
                    </span>
                  </div>
                  <div className="mt-2 h-3.5 overflow-hidden rounded-full bg-[#eef1f4]">
                    <div className="flex h-full overflow-hidden rounded-full" style={{ width: `${totalW}%` }}>
                      <span className="h-full bg-[#0b7a4b]" style={{ width: `${resolvedW}%` }} />
                      <span className="h-full bg-[#f59e0b]" style={{ width: `${100 - resolvedW}%` }} />
                    </div>
                  </div>
                </button>
              );
            })}
            <div className="flex items-center gap-4 pt-1 text-[12px] text-ink-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#0b7a4b]" /> Autonomous resolution (Breeze Customer Agent)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" /> Handed off to human staff
              </span>
            </div>
          </div>
        </Card>

        <Card title="Autonomous Resolution Rate Trend" right={<Tag tone="green">{goalPct}% benchmark</Tag>} testId="chart-trend">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-[185px] w-full" role="img" aria-label="Autonomous resolution rate trend">
            {[60, 70, 80].map((tick) => {
              const y = yAt(tick);
              return (
                <g key={tick}>
                  <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="#ececec" strokeWidth="1" />
                  <text x={padL - 6} y={y + 4} textAnchor="end" className="fill-[#6b7280] text-[10px]">
                    {tick}%
                  </text>
                </g>
              );
            })}
            <line x1={padL} x2={W - padR} y1={goalY} y2={goalY} stroke="#0b7a4b" strokeWidth="1.25" strokeDasharray="4 4" />
            <text x={padL + 4} y={goalY - 5} textAnchor="start" className="fill-[#0b7a4b] text-[10px] font-semibold">
              {goalPct}% goal
            </text>
            <path d={areaPath} fill="#d20587" fillOpacity="0.1" />
            <polyline fill="none" stroke="#d20587" strokeWidth="2.5" strokeLinejoin="round" points={linePoints} />
            {period.trend.map((pt, i) => {
              const x = xAt(i);
              const y = yAt(pt.resolutionPct);
              return (
                <g key={pt.label}>
                  <circle cx={x} cy={y} r="4" fill="#fff" stroke="#d20587" strokeWidth="2.5" />
                  <text x={x} y={y - 9} textAnchor="middle" className="fill-[#141414] text-[10px] font-semibold">
                    {pt.resolutionPct}%
                  </text>
                  <text x={x} y={H - 8} textAnchor="middle" className="fill-[#5f5f5f] text-[10.5px]">
                    {pt.label}
                  </text>
                </g>
              );
            })}
          </svg>
          <p className="mt-1 text-[12px] text-ink-muted">{cfg.dashboard.trendFootnote}</p>
        </Card>

        <Card title="Human Handoffs by Escalation Reason" right={<Tag tone="orange">{num(period.handoffs)} total</Tag>} testId="chart-handoffs">
          <div className="space-y-3">
            {period.handoffReasons.map((item) => (
              <div key={item.reason}>
                <div className="flex items-baseline justify-between text-[13px]">
                  <span className="font-medium">{item.reason}</span>
                  <span className="tabular-nums text-ink-muted">
                    <strong className="text-ink">{num(item.count)}</strong> ({item.pct}%)
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[#eef1f4]">
                  <div className="h-full rounded-full bg-[#ff7a45]" style={{ width: `${Math.min(100, item.pct * 2)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-[8px] border border-line-soft bg-[#fafafa] px-3.5 py-2.5 text-[12.5px]">
            <span className="text-ink-muted">Latest escalated ticket with AI summary:</span>
            <A to={`/service/tickets/${cfg.escalationCase.ticketId}`} className="hs-link">
              {cfg.escalationCase.ticketNumber}
            </A>
          </div>
        </Card>

        <Card title="Native HubSpot Credits Summary" right={<Tag tone="blue">{num(period.creditsAllocated - period.creditsUsed)} remaining</Tag>} testId="chart-credits">
          <div className="grid grid-cols-2 gap-3">
            {period.channels.map((ch) => (
              <div key={ch.label} className="rounded-[8px] border border-line-soft bg-[#fafafa] p-3">
                <p className="text-[12px] font-semibold text-ink-muted">{ch.label}</p>
                <p className="mt-1 text-[22px] font-bold tabular-nums">{num(ch.credits)}</p>
                <p className="mt-0.5 text-[11.5px] text-ink-muted">1 credit / autonomous resolution</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-[8px] border border-line-soft bg-white p-3 text-[12.5px] text-ink-muted">
            <p className="flex items-center gap-1.5 font-semibold text-ink">
              <Icon name="info" size={14} className="text-link" /> HubSpot Credits accounting
            </p>
            <p className="mt-1 leading-relaxed">{cfg.dashboard.creditModelNote}</p>
          </div>
        </Card>
      </div>

      {/* Custom Penguin Credits-to-Outcome Attribution Panel — ONLY Penguin marker on Dashboard */}
      {cfg.dashboard.creditsOutcome ? <CreditsOutcomeAttributionCard credits={cfg.dashboard.creditsOutcome} /> : null}
    </div>
  );
}

function FintechServiceDashboard({ cfg }: { cfg: FintechCustomerAgentConfig }) {
  const { world, dispatch, setEndCardOpen } = useShell();
  const [periodId, setPeriodId] = useState<"7d" | "30d" | "90d">("30d");
  const [channelFilter, setChannelFilter] = useState<"all" | ServiceChannel>("all");

  const period = cfg.dashboard.periods[periodId];
  const goalPct = cfg.dashboard.goalPct;
  const selectedChannel = channelFilter === "all" ? null : period.channels.find((c) => c.channel === channelFilter) ?? null;

  const totalConversations = selectedChannel ? selectedChannel.volume : period.totalConversations;
  const autonomousResolved = selectedChannel ? selectedChannel.resolved : period.autonomousResolved;
  const handoffs = selectedChannel ? selectedChannel.handoffs : period.handoffs;
  const resolutionRatePct = selectedChannel ? selectedChannel.resolutionPct : period.resolutionRatePct;
  const handoffRatePct = Number(((handoffs / Math.max(totalConversations, 1)) * 100).toFixed(1));
  const creditsUsed = selectedChannel ? selectedChannel.credits : period.creditsUsed;
  const creditsPct = Math.min(100, Math.round((period.creditsUsed / period.creditsAllocated) * 100));

  const sessionResolved = Number(world.ca.chatResolved) + Number(world.ca.emailReplied) + Number(world.ca.voiceUnlocked);
  const sessionHandoffs = Number(world.ca.fraudHandedOff);

  const maxChannelVol = Math.max(...period.channels.map((c) => c.volume), 1);

  const W = 440;
  const H = 165;
  const padL = 36;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const minY = 55;
  const maxY = 85;
  const xAt = (i: number) => padL + (i / Math.max(period.trend.length - 1, 1)) * (W - padL - padR);
  const yAt = (pct: number) => padT + ((maxY - pct) / (maxY - minY)) * (H - padT - padB);
  const goalY = yAt(goalPct);
  const linePoints = period.trend.map((pt, i) => `${xAt(i).toFixed(1)},${yAt(pt.resolutionPct).toFixed(1)}`).join(" ");
  const areaPath =
    `M ${xAt(0).toFixed(1)},${(H - padB).toFixed(1)} ` +
    period.trend.map((pt, i) => `L ${xAt(i).toFixed(1)},${yAt(pt.resolutionPct).toFixed(1)}`).join(" ") +
    ` L ${xAt(period.trend.length - 1).toFixed(1)},${(H - padB).toFixed(1)} Z`;

  return (
    <div className="mx-auto max-w-[1260px] px-6 py-5" data-testid="service-dashboard-page">
      {/* Header & Interactive Filters */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-breeze-soft text-breeze">
              <Sparkle size={15} />
            </span>
            <h1 className="text-[20px] font-semibold tracking-tight">Service Hub · Customer Agent Dashboard</h1>
          </div>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            Omnichannel performance across Chat, Email, and Voice · Fernhill Capital
            {sessionResolved + sessionHandoffs > 0 ? ` · Includes ${sessionResolved} autonomous & ${sessionHandoffs} handoff from this session` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period filter */}
          <div className="inline-flex overflow-hidden rounded-[6px] border border-line bg-white p-0.5">
            {(["7d", "30d", "90d"] as const).map((pid) => (
              <button
                key={pid}
                type="button"
                onClick={() => setPeriodId(pid)}
                data-testid={`dash-period-${pid}`}
                className={cx("rounded-[4px] px-3 py-1 text-[12.5px] font-semibold", periodId === pid ? "bg-ink text-white" : "text-ink-muted hover:text-ink")}
              >
                {cfg.dashboard.periods[pid].label}
              </button>
            ))}
          </div>

          {/* Channel filter */}
          <div className="inline-flex overflow-hidden rounded-[6px] border border-line bg-white p-0.5">
            {(["all", "chat", "email", "voice"] as const).map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setChannelFilter(ch)}
                data-testid={`dash-channel-${ch}`}
                className={cx("rounded-[4px] px-2.5 py-1 text-[12.5px] font-semibold capitalize", channelFilter === ch ? "bg-hs-orange text-white" : "text-ink-muted hover:text-ink")}
              >
                {ch === "all" ? "All channels" : ch}
              </button>
            ))}
          </div>

          {!world.ca.dashboardReviewed ? (
            <Button
              variant="primary"
              size="sm"
              data-testid="dash-complete-btn"
              onClick={() => {
                dispatch({ t: "ca.reviewDashboard" });
                setEndCardOpen(true);
              }}
            >
              Finish &amp; wrap up
            </Button>
          ) : (
            <A to="/service" className="hs-link text-[13px]">
              Back to Help Desk
            </A>
          )}
        </div>
      </header>

      {/* Top KPI Row */}
      <div className="mt-5 grid grid-cols-4 gap-4">
        <Card testId="kpi-volume">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">Total Conversations</p>
          <p className="mt-1.5 text-[28px] font-bold tabular-nums leading-none">{num(totalConversations)}</p>
          <p className="mt-2 text-[12.5px] text-ink-muted">
            {selectedChannel ? `${selectedChannel.label} · avg ${selectedChannel.avgSeconds}s handle` : `Avg handle time ${period.avgHandleSeconds}s · CSAT ${period.csat}/5`}
          </p>
        </Card>

        <Card testId="kpi-resolution" className="border-[#bfe3cd] bg-[#f8fdf9]">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[#0b5b2b]">Autonomous Resolution</p>
            <Tag tone="green">{goalPct}%+ target</Tag>
          </div>
          <p className="mt-1.5 text-[28px] font-bold tabular-nums leading-none text-[#0b5b2b]" data-testid="kpi-resolution-value">
            {resolutionRatePct.toFixed(1)}%
          </p>
          <p className="mt-2 text-[12.5px] text-[#1e5c3a]">
            {num(autonomousResolved)} resolved without human · {period.resolutionDelta}
          </p>
        </Card>

        <Card testId="kpi-handoffs">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">Human Handoffs</p>
          <p className="mt-1.5 text-[28px] font-bold tabular-nums leading-none">{num(handoffs)}</p>
          <p className="mt-2 text-[12.5px] text-ink-muted">
            {handoffRatePct}% of volume · 100% delivered with AI summary
          </p>
        </Card>

        <Card testId="kpi-credits">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">HubSpot Credits Used</p>
            <Tag tone="blue">{creditsPct}% of plan</Tag>
          </div>
          <p className="mt-1.5 text-[28px] font-bold tabular-nums leading-none" data-testid="kpi-credits-value">
            {num(creditsUsed)}
            {!selectedChannel ? <span className="text-[15px] font-normal text-ink-muted"> / {num(period.creditsAllocated)}</span> : null}
          </p>
          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-[#e6eaee]">
            <div className="h-full rounded-full bg-hs-orange" style={{ width: `${selectedChannel ? Math.round((selectedChannel.credits / period.creditsUsed) * 100) : creditsPct}%` }} />
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        {/* Chart 1: Volume by Channel */}
        <Card title="Volume & Autonomous Resolution by Channel" right={<Tag>Click a channel to filter</Tag>} testId="chart-channels">
          <div className="space-y-4">
            {period.channels.map((ch) => {
              const totalW = Math.round((ch.volume / maxChannelVol) * 100);
              const resolvedW = Math.round((ch.resolved / ch.volume) * 100);
              const active = channelFilter === ch.channel;
              return (
                <button
                  key={ch.channel}
                  type="button"
                  onClick={() => setChannelFilter(active ? "all" : ch.channel)}
                  data-testid={`chart-bar-${ch.channel}`}
                  className={cx("block w-full rounded-[8px] border p-3 text-left transition-colors", active ? "border-hs-orange bg-[#fff9f6]" : "border-line-soft hover:border-line")}
                >
                  <div className="flex items-baseline justify-between gap-2 text-[13px]">
                    <span className="font-semibold">{ch.label}</span>
                    <span className="tabular-nums text-ink-muted">
                      <strong className="text-ink">{num(ch.volume)}</strong> total · <strong className="text-[#0b5b2b]">{ch.resolutionPct.toFixed(1)}%</strong> autonomous ({num(ch.resolved)}) · {num(ch.handoffs)} handoffs
                    </span>
                  </div>
                  <div className="mt-2 h-3.5 overflow-hidden rounded-full bg-[#eef1f4]">
                    <div className="flex h-full overflow-hidden rounded-full" style={{ width: `${totalW}%` }}>
                      <span className="h-full bg-[#0b7a4b]" style={{ width: `${resolvedW}%` }} title={`Resolved by AI: ${ch.resolved}`} />
                      <span className="h-full bg-[#f59e0b]" style={{ width: `${100 - resolvedW}%` }} title={`Human handoffs: ${ch.handoffs}`} />
                    </div>
                  </div>
                </button>
              );
            })}
            <div className="flex items-center gap-4 pt-1 text-[12px] text-ink-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#0b7a4b]" /> Autonomous resolution (Breeze Customer Agent)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" /> Handed off to human rep
              </span>
            </div>
          </div>
        </Card>

        {/* Chart 2: Autonomous Resolution Rate Trend */}
        <Card title="Autonomous Resolution Rate Trend" right={<Tag tone="green">{goalPct}% benchmark</Tag>} testId="chart-trend">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-[185px] w-full" role="img" aria-label="Autonomous resolution rate trend">
            {[60, 70, 80].map((tick) => {
              const y = yAt(tick);
              return (
                <g key={tick}>
                  <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="#ececec" strokeWidth="1" />
                  <text x={padL - 6} y={y + 4} textAnchor="end" className="fill-[#6b7280] text-[10px]">
                    {tick}%
                  </text>
                </g>
              );
            })}
            {/* 70% Benchmark Line */}
            <line x1={padL} x2={W - padR} y1={goalY} y2={goalY} stroke="#0b7a4b" strokeWidth="1.25" strokeDasharray="4 4" />
            <text x={padL + 4} y={goalY - 5} textAnchor="start" className="fill-[#0b7a4b] text-[10px] font-semibold">
              {goalPct}% goal
            </text>
            {/* Area + Line */}
            <path d={areaPath} fill="#d20587" fillOpacity="0.1" />
            <polyline fill="none" stroke="#d20587" strokeWidth="2.5" strokeLinejoin="round" points={linePoints} />
            {period.trend.map((pt, i) => {
              const x = xAt(i);
              const y = yAt(pt.resolutionPct);
              return (
                <g key={pt.label}>
                  <circle cx={x} cy={y} r="4" fill="#fff" stroke="#d20587" strokeWidth="2.5" />
                  <text x={x} y={y - 9} textAnchor="middle" className="fill-[#141414] text-[10px] font-semibold">
                    {pt.resolutionPct}%
                  </text>
                  <text x={x} y={H - 8} textAnchor="middle" className="fill-[#5f5f5f] text-[10.5px]">
                    {pt.label}
                  </text>
                </g>
              );
            })}
          </svg>
          <p className="mt-1 text-[12px] text-ink-muted">
            Autonomous resolution climbed steadily above 70% as Fernhill added transfer lookup, card dispute, and MFA unlock playbooks.
          </p>
        </Card>

        {/* Chart 3: Human Handoff Reasons */}
        <Card title="Human Handoffs by Escalation Reason" right={<Tag tone="orange">{num(period.handoffs)} total</Tag>} testId="chart-handoffs">
          <div className="space-y-3">
            {period.handoffReasons.map((item) => (
              <div key={item.reason}>
                <div className="flex items-baseline justify-between text-[13px]">
                  <span className="font-medium">{item.reason}</span>
                  <span className="tabular-nums text-ink-muted">
                    <strong className="text-ink">{num(item.count)}</strong> ({item.pct}%)
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[#eef1f4]">
                  <div className="h-full rounded-full bg-[#ff7a45]" style={{ width: `${item.pct * 2.4}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-[8px] border border-line-soft bg-[#fafafa] px-3.5 py-2.5 text-[12.5px]">
            <span className="text-ink-muted">Latest escalated ticket with unified history:</span>
            <A to={`/service/tickets/${cfg.fraudCase.ticketId}`} className="hs-link">
              {cfg.fraudCase.ticketNumber} (Dunmore Tool and Die)
            </A>
          </div>
        </Card>

        {/* Chart 4: HubSpot Credits Used */}
        <Card title="HubSpot Credits Used by Channel" right={<Tag tone="blue">{num(period.creditsAllocated - period.creditsUsed)} remaining</Tag>} testId="chart-credits">
          <div className="grid grid-cols-3 gap-3">
            {period.channels.map((ch) => (
              <div key={ch.channel} className="rounded-[8px] border border-line-soft bg-[#fafafa] p-3">
                <p className="text-[12px] font-semibold text-ink-muted">{ch.label.split(" ")[0]}</p>
                <p className="mt-1 text-[22px] font-bold tabular-nums">{num(ch.credits)}</p>
                <p className="mt-0.5 text-[11.5px] text-ink-muted">
                  {ch.channel === "voice" ? "2 credits / voice resolution" : "1 credit / resolution"}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-[8px] border border-line-soft bg-white p-3 text-[12.5px] text-ink-muted">
            <p className="flex items-center gap-1.5 font-semibold text-ink">
              <Icon name="info" size={14} className="text-link" /> HubSpot Credits accounting
            </p>
            <p className="mt-1 leading-relaxed">{cfg.dashboard.creditModelNote}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
