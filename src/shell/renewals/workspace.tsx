"use client";

import { useState } from "react";
import { nowMs } from "@/lib/format";
import { useShell } from "@/store/store";
import { date, money } from "../format";
import { Icon } from "../icons";
import { A, Button, Card, cx, Empty, Tag } from "../ui";
import { ownerName } from "../pages/lists";
import type { ContractRenewalConfig, PremiumToSubscriptionConfig, RenewalChurnRiskConfig } from "./types";

/**
 * Native HubSpot Dual-Pipeline Deals view (Premium Pipeline -> Subscription Pipeline) for SaaS #3.
 * Strictly native HubSpot UI — ZERO Penguin markers.
 */
export function DualPipelinesView({ cfg }: { cfg: PremiumToSubscriptionConfig }) {
  const { world, pack, dispatch, navigate } = useShell();
  const st = world.renewals["premium-to-subscription"];
  const [focus, setFocus] = useState<"both" | "premium" | "subscription">("both");

  const premDeal = world.deals.find((d) => d.id === cfg.premiumDealId);
  const subDeal = world.deals.find((d) => d.id === cfg.subscriptionDeal.dealId);
  const company = world.companies.find((c) => c.id === cfg.companyId);
  const contact = world.contacts.find((c) => c.id === cfg.contactId);
  const aeName = ownerName(pack, cfg.aeOwnerId);
  const csName = ownerName(pack, cfg.csOwnerId);
  const opt = cfg.checkout.billingOptions.find((o) => o.id === st.billingOptionId) ?? cfg.checkout.billingOptions[0];
  const subMrr = opt?.mrr ?? cfg.subscriptionDeal.mrr;
  const subArr = opt?.annualTotal ?? cfg.subscriptionDeal.arr;

  const premStageLabel = (id: string) => cfg.premiumStages.find((s) => s.id === id)?.label ?? id;
  const subStageLabel = (id: string) => cfg.subscriptionStages.find((s) => s.id === id)?.label ?? id;

  const premiumTotalMrr = cfg.premiumPeers.reduce((s, p) => s + p.mrr, 0) + (premDeal ? Math.round(premDeal.amount / 12) : cfg.subscriptionDeal.mrr);
  const subTotalMrr = cfg.subscriptionPeers.reduce((s, p) => s + p.mrr, 0) + (subDeal ? subMrr : 0);
  const csTasks = world.tasks.filter((t) => t.dealId === cfg.subscriptionDeal.dealId);

  return (
    <div className="min-h-full pb-8" data-testid="renewals-dual-pipelines">
      <header className="border-b border-line bg-white px-6 py-4">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#eef5f5] text-link">
              <Icon name="board" size={19} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[18px] font-semibold leading-tight">Dual-Pipeline Deals: Premium &amp; Subscription</h1>
                <Tag tone="blue">Native Multi-Pipeline</Tag>
              </div>
              <p className="mt-0.5 text-[12.5px] text-ink-muted">
                {pack.portal.company} · Closed-won Premium deals hand off cleanly into active Subscription deals with start/renewal dates, MRR, and CS onboarding
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex overflow-hidden rounded-[6px] border border-line bg-white" role="group" aria-label="Pipeline view">
              {(
                [
                  { id: "both", label: "Side by side" },
                  { id: "premium", label: cfg.premiumPipelineName },
                  { id: "subscription", label: cfg.subscriptionPipelineName },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  data-testid={`pipeline-focus-${tab.id}`}
                  aria-pressed={focus === tab.id}
                  onClick={() => setFocus(tab.id)}
                  className={cx(
                    "h-8 px-3 text-[12.5px] font-semibold transition-colors",
                    focus === tab.id ? "bg-ink text-white" : "text-ink hover:bg-[#f2f2f2]",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {st.csAssigned ? (
              <Button
                variant="primary"
                size="sm"
                data-testid="ren-open-mrr-report"
                onClick={() => {
                  dispatch({ t: "ren.reviewPipelines" });
                  navigate(`/reports/${cfg.reportId}`);
                }}
              >
                Open MRR &amp; renewals report <Icon name="arrowRight" size={14} />
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1240px] space-y-5 px-6 pt-5">
        {/* Native KPI strip */}
        <div className="grid grid-cols-4 gap-4" data-testid="dual-pipeline-kpis">
          <Card>
            <p className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Premium Pipeline MRR</p>
            <p className="mt-1 text-[24px] font-bold tabular-nums">{money(premiumTotalMrr)}<span className="text-[13px] font-normal text-ink-muted">/mo</span></p>
            <p className="mt-1 text-[12px] text-ink-muted">{cfg.premiumPeers.length + 1} deals in conversion motion</p>
          </Card>
          <Card className={st.checkoutCompleted ? "border-[#bfe3cd] bg-[#f8fdf9]" : undefined}>
            <p className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Active Subscription MRR</p>
            <p className="mt-1 text-[24px] font-bold tabular-nums text-[#0b5b2b]" data-testid="sub-pipeline-mrr">
              {money(subTotalMrr)}<span className="text-[13px] font-normal text-ink-muted">/mo</span>
            </p>
            <p className="mt-1 text-[12px] text-ink-muted">
              {subDeal ? `+${money(subMrr)}/mo newly activated` : "Updates automatically after billing checkout"}
            </p>
          </Card>
          <Card>
            <p className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Handoff Status</p>
            <p className="mt-1 text-[18px] font-bold">
              {st.csAssigned ? "CS Owner & Tasks Active" : st.checkoutCompleted ? "Subscription Created" : st.premiumClosed ? "Awaiting Checkout" : "Commercial Review"}
            </p>
            <p className="mt-1 text-[12px] text-ink-muted">
              {st.csAssigned ? `${csName} · ${csTasks.length} kickoff tasks` : `${company?.name ?? "Thistledown"} (${contact?.firstName ?? "Callum"} ${contact?.lastName ?? "Reyes"})`}
            </p>
          </Card>
          <Card>
            <p className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Next Action</p>
            {!st.premiumClosed ? (
              <Button
                variant="primary"
                size="sm"
                className="mt-2 w-full"
                data-testid="ren-close-premium-btn"
                onClick={() => {
                  dispatch({ t: "ren.closePremium", at: nowMs() });
                }}
              >
                Mark Closed Won &amp; send checkout
              </Button>
            ) : !st.checkoutCompleted ? (
              <Button
                variant="primary"
                size="sm"
                className="mt-2 w-full"
                data-testid="ren-open-checkout-btn"
                onClick={() => navigate("/renewals-app/premium-to-subscription/checkout")}
              >
                Open billing checkout <Icon name="external" size={13} />
              </Button>
            ) : !st.csAssigned ? (
              <Button
                variant="primary"
                size="sm"
                className="mt-2 w-full"
                data-testid="ren-open-sub-deal-btn"
                onClick={() => navigate(`/deals/${cfg.subscriptionDeal.dealId}`)}
              >
                Inspect Subscription deal <Icon name="arrowRight" size={13} />
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                className="mt-2 w-full"
                data-testid="ren-view-sub-deal-btn"
                onClick={() => navigate(`/deals/${cfg.subscriptionDeal.dealId}`)}
              >
                View Subscription deal
              </Button>
            )}
          </Card>
        </div>

        {/* Dual Pipelines grid */}
        <div className={cx("grid gap-5", focus === "both" ? "lg:grid-cols-2" : "grid-cols-1")}>
          {focus !== "subscription" ? (
            <Card
              title={
                <span className="flex items-center gap-2">
                  <span>{cfg.premiumPipelineName}</span>
                  <Tag tone="blue">{cfg.premiumPeers.length + 1} deals</Tag>
                </span>
              }
              right={<span className="text-[12px] text-ink-muted">Sales-assisted upgrade motion</span>}
              testId="pipeline-card-premium"
            >
              <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[11.5px] text-ink-muted">
                {cfg.premiumStages.map((s, idx) => (
                  <span key={s.id} className="inline-flex items-center gap-1">
                    {idx > 0 ? <Icon name="chevronRight" size={11} /> : null}
                    <span className="rounded bg-[#f1f3f5] px-2 py-0.5 font-medium text-ink">{s.label}</span>
                  </span>
                ))}
              </div>
              <div className="space-y-2.5">
                {/* Hero Premium Deal */}
                <div
                  className={cx(
                    "rounded-[8px] border p-3.5 transition-colors",
                    st.premiumClosed ? "border-[#bfe3cd] bg-[#f4fbf6]" : "border-hs-orange/60 bg-[#fff9f5]",
                  )}
                  data-testid="hero-premium-deal-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <A to={`/deals/${cfg.premiumDealId}`} className="hs-link text-[14px]">
                          {premDeal?.name ?? "Thistledown Veterinary Network: Premium Pilot Upgrade"}
                        </A>
                        <span data-testid="hero-premium-stage-tag">
                          <Tag tone={st.premiumClosed ? "green" : "amber"}>
                            {premStageLabel(premDeal?.stage ?? cfg.premiumOpenStageId)}
                          </Tag>
                        </span>
                      </div>
                      <p className="mt-1 text-[12.5px] text-ink-muted">
                        {company?.name} · Owner: {aeName} · {cfg.checkout.seatCount} Growth seats
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[14.5px] font-bold tabular-nums">{money(premDeal?.amount ?? subArr)}</p>
                      <p className="text-[11.5px] text-ink-muted">{money(Math.round((premDeal?.amount ?? subArr) / 12))}/mo MRR</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-2.5">
                    <span className="text-[12px] text-ink-muted">
                      {st.premiumClosed
                        ? "Closed Won · External checkout link sent to Callum Reyes"
                        : "Ready to close won and trigger off-platform billing checkout"}
                    </span>
                    {!st.premiumClosed ? (
                      <Button
                        variant="primary"
                        size="sm"
                        data-testid="hero-close-premium-action"
                        onClick={() => dispatch({ t: "ren.closePremium", at: nowMs() })}
                      >
                        Mark Closed Won &amp; send checkout link
                      </Button>
                    ) : !st.checkoutCompleted ? (
                      <Button
                        variant="primary"
                        size="sm"
                        data-testid="hero-open-checkout-action"
                        onClick={() => navigate("/renewals-app/premium-to-subscription/checkout")}
                      >
                        Go to billing checkout <Icon name="external" size={13} />
                      </Button>
                    ) : (
                      <Tag tone="green">Checkout paid · Handed off</Tag>
                    )}
                  </div>
                </div>

                {/* Peer Premium Deals */}
                {cfg.premiumPeers.map((peer) => (
                  <div key={peer.id} className="flex items-center justify-between gap-3 rounded-[8px] border border-line-soft bg-white px-3.5 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-semibold">{peer.dealName}</p>
                      <p className="mt-0.5 text-[12px] text-ink-muted">
                        {peer.companyName} · {peer.ownerName}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Tag tone={peer.badgeTone ?? "neutral"}>{premStageLabel(peer.stageId)}</Tag>
                      <div className="text-right">
                        <p className="text-[13px] font-semibold tabular-nums">{money(peer.arr)}</p>
                        <p className="text-[11px] text-ink-muted">{money(peer.mrr)}/mo</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {focus !== "premium" ? (
            <Card
              title={
                <span className="flex items-center gap-2">
                  <span>{cfg.subscriptionPipelineName}</span>
                  <Tag tone="green">{cfg.subscriptionPeers.length + (subDeal ? 1 : 0)} active</Tag>
                </span>
              }
              right={<span className="text-[12px] text-ink-muted">Auto-created on billing checkout</span>}
              testId="pipeline-card-subscription"
            >
              <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[11.5px] text-ink-muted">
                {cfg.subscriptionStages.map((s, idx) => (
                  <span key={s.id} className="inline-flex items-center gap-1">
                    {idx > 0 ? <Icon name="chevronRight" size={11} /> : null}
                    <span className="rounded bg-[#eef6f1] px-2 py-0.5 font-medium text-[#0b5b2b]">{s.label}</span>
                  </span>
                ))}
              </div>
              <div className="space-y-2.5">
                {subDeal ? (
                  <div className="hs-pop rounded-[8px] border border-[#bfe3cd] bg-[#f4fbf6] p-3.5" data-testid="hero-subscription-deal-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <A to={`/deals/${subDeal.id}`} className="hs-link text-[14px]">
                            {subDeal.name}
                          </A>
                          <Tag tone="orange">New</Tag>
                          <Tag tone="green">{subStageLabel(subDeal.stage)}</Tag>
                        </div>
                        <p className="mt-1 text-[12.5px] text-ink-muted">
                          Owner: <strong className="text-ink">{ownerName(pack, subDeal.ownerId)}</strong> · Start {date(cfg.subscriptionDeal.startDate)} · Renews {date(cfg.subscriptionDeal.renewalDate)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[14.5px] font-bold tabular-nums text-[#0b5b2b]">{money(subMrr)}/mo</p>
                        <p className="text-[11.5px] text-ink-muted">{money(subArr)} ARR</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#d6ecd9] pt-2.5 text-[12px]">
                      <span className="text-[#0b5b2b]">
                        {st.csAssigned
                          ? `CS handoff complete · ${csName} assigned · ${csTasks.length} onboarding kickoff tasks created`
                          : "Created automatically from billing webhook with start & renewal dates"}
                      </span>
                      <A to={`/deals/${subDeal.id}`} className="hs-link" data-testid="hero-sub-deal-link">
                        Open deal record
                      </A>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[8px] border border-dashed border-line bg-[#fafafa] px-4 py-4 text-[13px] text-ink-muted" data-testid="sub-pipeline-waiting">
                    <p className="font-semibold text-ink">Waiting for Thistledown Veterinary Network billing checkout</p>
                    <p className="mt-1">
                      Once the customer pays through the external billing tool, the subscription deal is created here automatically with start date, renewal date, and MRR.
                    </p>
                  </div>
                )}

                {cfg.subscriptionPeers.map((peer) => (
                  <div key={peer.id} className="flex items-center justify-between gap-3 rounded-[8px] border border-line-soft bg-white px-3.5 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-semibold">{peer.dealName}</p>
                      <p className="mt-0.5 text-[12px] text-ink-muted">
                        {peer.companyName} · CS: {peer.ownerName}
                        {peer.renewalDate ? ` · Renews ${date(peer.renewalDate)}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Tag tone={peer.badgeTone ?? "green"}>{subStageLabel(peer.stageId)}</Tag>
                      <div className="text-right">
                        <p className="text-[13px] font-semibold tabular-nums">{money(peer.mrr)}/mo</p>
                        <p className="text-[11px] text-ink-muted">{money(peer.arr)} ARR</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Native HubSpot 90-day / 120-day Renewal Workflow Trigger & Queue view (used by S4 and I3).
 * Strictly native HubSpot UI — ZERO Penguin markers.
 */
export function RenewalTriggerView({
  demoId,
  cfg,
}: {
  demoId: "renewal-churn-risk" | "contract-renewal";
  cfg: RenewalChurnRiskConfig | ContractRenewalConfig;
}) {
  const { world, pack, dispatch, navigate } = useShell();
  const st = world.renewals[demoId];
  const wf = cfg.workflow;
  const rd = cfg.renewalDeal;
  const ownerId = cfg.mode === "health-churn" ? cfg.csmOwnerId : cfg.ownerId;
  const owner = pack.personas.find((p) => p.id === ownerId);
  const nextPath = cfg.mode === "health-churn" ? `/companies/${cfg.companyId}` : "/renewals-app/contract-renewal/qbr";
  const nextLabel = cfg.mode === "health-churn" ? "Open Account Health on Company" : "Open off-platform QBR booking";

  return (
    <div className="min-h-full pb-8" data-testid={`renewals-trigger-${demoId}`}>
      <header className="border-b border-line bg-white px-6 py-4">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#eef5f5] text-link">
              <Icon name="workflow" size={19} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[18px] font-semibold leading-tight">{wf.name}</h1>
                <Tag tone="green">Workflow is on</Tag>
                <Tag tone="blue">Native HubSpot Automation</Tag>
              </div>
              <p className="mt-0.5 text-[12.5px] text-ink-muted">
                {wf.triggerSummary} · {wf.enrolledCount + (st.triggered ? 1 : 0)} enrolled · Assigned owner: {owner?.name ?? ownerId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {st.triggered ? (
              <Button variant="primary" size="sm" data-testid="ren-trigger-continue" onClick={() => navigate(nextPath)}>
                {nextLabel} <Icon name="arrowRight" size={14} />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                data-testid="ren-trigger-run"
                onClick={() => dispatch({ t: "ren.trigger", demoId, at: nowMs() })}
              >
                <Icon name="workflow" size={14} /> Run {wf.noticeDays}-day renewal trigger
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] space-y-5 px-6 pt-5">
        {/* Native workflow steps preview */}
        <Card
          title="Automated Renewal Workflow Steps"
          right={<Tag tone="neutral">{wf.noticeDays}-day lead time</Tag>}
          testId="ren-workflow-card"
        >
          <div className="grid gap-3 md:grid-cols-4">
            <div className={cx("rounded-[8px] border p-3", st.triggered ? "border-hs-orange bg-[#fff7f2]" : "border-line bg-[#fafafa]")}>
              <p className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-muted">1. Enrollment Trigger</p>
              <p className="mt-1 text-[13px] font-semibold">{wf.triggerSummary}</p>
            </div>
            {wf.actions.map((act, idx) => (
              <div
                key={act}
                className={cx("rounded-[8px] border p-3", st.triggered ? "border-[#bfe3cd] bg-[#f4fbf6]" : "border-line bg-white")}
              >
                <p className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-muted">
                  {idx + 2}. Workflow Action
                </p>
                <p className="mt-1 text-[13px] font-semibold">{act}</p>
              </div>
            ))}
          </div>

          {st.triggered ? (
            <div className="hs-pop mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-[#bfe3cd] bg-[#f0faf4] px-4 py-3" data-testid="ren-trigger-confirmed">
              <div>
                <p className="flex items-center gap-2 text-[13.5px] font-semibold text-[#0b5b2b]">
                  <Icon name="check" size={15} strokeWidth={2.5} /> {wf.noticeDays}-day renewal deal &amp; task created
                </p>
                <p className="mt-0.5 text-[12.5px] text-ink-muted">
                  Deal: <A to={`/deals/${rd.dealId}`} className="hs-link">{rd.name}</A> ({money(rd.arr)} ARR) · Task assigned to {owner?.name} · Slack alert sent to {rd.slackChannel}
                </p>
              </div>
              <Button variant="primary" size="sm" data-testid="ren-trigger-next" onClick={() => navigate(nextPath)}>
                {nextLabel} <Icon name="arrowRight" size={14} />
              </Button>
            </div>
          ) : null}
        </Card>

        {/* Renewing accounts queue */}
        <Card
          title={`Upcoming Renewals (${wf.noticeDays}-Day Window)`}
          right={<span className="text-[12px] text-ink-muted">{cfg.queue.length} contracts tracked</span>}
          pad={false}
          testId="ren-queue-card"
        >
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-y border-line-soft bg-[#fafafa] text-left text-[11.5px] uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-2.5 font-semibold">Account</th>
                <th className="px-4 py-2.5 font-semibold">Current Agreement</th>
                <th className="px-4 py-2.5 text-right font-semibold">ARR</th>
                <th className="px-4 py-2.5 text-right font-semibold">Renewal Date</th>
                <th className="px-4 py-2.5 font-semibold">Owner</th>
                <th className="px-4 py-2.5 font-semibold">Workflow Status</th>
              </tr>
            </thead>
            <tbody>
              {cfg.queue.map((row) => {
                const activeHero = row.isHero && st.triggered;
                return (
                  <tr
                    key={row.id}
                    data-testid={`ren-queue-row-${row.id}`}
                    className={cx("border-b border-line-soft last:border-b-0", row.isHero && "bg-[#fffaf6]")}
                  >
                    <td className="px-4 py-3 font-semibold">
                      {row.companyId ? (
                        <A to={`/companies/${row.companyId}`} className="hs-link">
                          {row.companyName}
                        </A>
                      ) : (
                        row.companyName
                      )}
                      {row.isHero ? <span className="ml-2"><Tag tone="orange">T-{row.daysToRenewal} days</Tag></span> : null}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{row.planName}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{money(row.arr)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{date(row.renewalDate)}</td>
                    <td className="px-4 py-3">{row.ownerName}</td>
                    <td className="px-4 py-3">
                      <Tag tone={activeHero ? "green" : row.statusTone}>
                        {activeHero ? "Renewal Deal Created" : row.status}
                      </Tag>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

export function RenewalsIndexView() {
  const { pack } = useShell();
  const entries = Object.entries(pack.demos.renewals ?? {});
  if (entries.length === 0) {
    return (
      <div className="p-10">
        <Card>
          <Empty title="No renewal workflows are configured for this portal">
            <A to="/deals" className="hs-link">
              Go to Deals
            </A>
          </Empty>
        </Card>
      </div>
    );
  }
  return (
    <div className="min-h-full pb-8" data-testid="renewals-index">
      <header className="border-b border-line bg-white px-6 py-4">
        <div className="mx-auto flex max-w-[1100px] items-center gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#eef5f5] text-link">
            <Icon name="lifecycle" size={19} />
          </span>
          <div>
            <h1 className="text-[18px] font-semibold">Renewals &amp; Subscriptions</h1>
            <p className="text-[12.5px] text-ink-muted">{pack.portal.company} · Pipelines, renewal triggers, and retention motions</p>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1100px] gap-4 px-6 pt-5 md:grid-cols-2">
        {entries.map(([id, cfg]) => {
          if (!cfg) return null;
          const to = cfg.mode === "dual-pipeline" ? `/renewals/${id}/pipelines` : `/renewals/${id}/trigger`;
          const title =
            cfg.mode === "dual-pipeline"
              ? "Premium to Subscription Pipeline"
              : cfg.mode === "health-churn"
                ? "90-Day Renewal & Churn Risk"
                : "120-Day Contract Renewal Management";
          const desc =
            cfg.mode === "dual-pipeline"
              ? "Dual-pipeline conversion from Premium Closed Won through external billing checkout into active Subscription MRR."
              : cfg.mode === "health-churn"
                ? "90-day renewal workflow, Account Health Score telemetry, at-risk retention quote approval, and forecast reporting."
                : "120-day contract trigger, client QBR booking, renewal quote acceptance, and PSA contract end-date roll-forward.";
          return (
            <Card key={id}>
              <h2 className="text-[15.5px] font-semibold">{title}</h2>
              <p className="mt-1.5 text-[13px] text-ink-muted">{desc}</p>
              <div className="mt-4 border-t border-line-soft pt-3">
                <A to={to} className="hs-link text-[13px]">
                  Open workspace
                </A>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
