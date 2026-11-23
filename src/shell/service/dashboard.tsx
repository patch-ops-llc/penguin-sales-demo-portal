"use client";

import { useState } from "react";
import { useShell } from "@/store/store";
import type { ServiceChannel } from "@/verticals/types";
import { num } from "../format";
import { Icon, Sparkle } from "../icons";
import { A, Button, Card, cx, Empty, Tag } from "../ui";

/**
 * Native HubSpot Service Hub Analytics Dashboard (Step 12).
 * Carries NO Penguin marker: channel volume, autonomous resolution rate (70%+), human handoffs,
 * and HubSpot Breeze credits reporting are all native HubSpot Service Hub reporting.
 */
export function ServiceDashboardPage() {
  const { pack, world, dispatch, setEndCardOpen } = useShell();
  const cfg = pack.demos.customerAgent;
  const [periodId, setPeriodId] = useState<"7d" | "30d" | "90d">("30d");
  const [channelFilter, setChannelFilter] = useState<"all" | ServiceChannel>("all");

  if (!cfg) {
    return (
      <div className="p-10">
        <Card>
          <Empty title="Service Dashboard is configured for Financial services">
            Switch to Fernhill Capital (Financial services and fintech) to view Breeze Customer Agent analytics.
          </Empty>
        </Card>
      </div>
    );
  }

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

  // SVG trend line geometry
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
  const areaPath = `M ${xAt(0).toFixed(1)},${(H - padB).toFixed(1)} ` + period.trend.map((pt, i) => `L ${xAt(i).toFixed(1)},${yAt(pt.resolutionPct).toFixed(1)}`).join(" ") + ` L ${xAt(period.trend.length - 1).toFixed(1)},${(H - padB).toFixed(1)} Z`;

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
