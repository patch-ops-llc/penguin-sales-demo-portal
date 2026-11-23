"use client";

import { nowMs } from "@/lib/format";
import { useShell } from "@/store/store";
import { Ext } from "../ext";
import { date, money } from "../format";
import { Icon } from "../icons";
import { ownerName } from "../pages/lists";
import { A, Button, Card, cx, Tag } from "../ui";
import type { ContractRenewalConfig, PremiumToSubscriptionConfig, RenewalChurnRiskConfig } from "./types";

/**
 * Embedded Company Record panel: renders the custom Penguin Account Health Score Card
 * for `renewal-churn-risk` (SaaS #4) — blending live product usage telemetry + open support tickets.
 */
export function RenewalsCompanyPanel({ companyId }: { companyId: string }) {
  const { pack, world, dispatch, navigate } = useShell();
  const raw = pack.demos.renewals?.["renewal-churn-risk"];
  const cfg = raw?.mode === "health-churn" ? (raw as RenewalChurnRiskConfig) : undefined;
  if (!cfg || cfg.companyId !== companyId) return null;

  const st = world.renewals["renewal-churn-risk"];
  const hc = cfg.healthCard;
  const maxSeats = Math.max(...hc.usageTrend.map((p) => p.licensedSeats), 1);

  return (
    <Ext id={hc.extId}>
      <Card
        title={
          <span className="flex flex-wrap items-center gap-2">
            <span>{hc.title}</span>
            <Tag tone={st.quoteAccepted ? "green" : "red"}>
              {st.quoteAccepted ? "Retention Secured" : `${hc.score} / 100 · ${hc.riskLabel}`}
            </Tag>
          </span>
        }
        right={<span className="whitespace-nowrap pr-10 text-[12px] text-ink-muted">{hc.syncedLabel}</span>}
        testId="account-health-score-card"
      >
        <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)]">
          {/* Health Score Gauge */}
          <div
            className={cx(
              "flex flex-col justify-between rounded-[10px] border p-4",
              st.quoteAccepted ? "border-[#bfe3cd] bg-[#f4fbf6]" : "border-[#f3bdb7] bg-[#fff6f5]",
            )}
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Composite Health</p>
              <p
                className={cx("mt-1 text-[34px] font-bold tabular-nums leading-none", st.quoteAccepted ? "text-[#0b5b2b]" : "text-[#99201a]")}
                data-testid="health-score-value"
              >
                {st.quoteAccepted ? "76" : String(hc.score)}
                <span className="text-[15px] font-normal text-ink-muted">/100</span>
              </p>
              <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white/80 ring-1 ring-black/5">
                <div
                  className={cx("h-full rounded-full transition-[width]", st.quoteAccepted ? "bg-[#0b7a4b]" : "bg-[#dc2626]")}
                  style={{ width: `${st.quoteAccepted ? 76 : hc.score}%` }}
                />
              </div>
            </div>
            <p className="mt-3 text-[12px] leading-snug text-ink-muted">{hc.thresholdLabel}</p>
          </div>

          {/* Usage telemetry + Open tickets */}
          <div className="space-y-3">
            <p className="text-[13px] leading-snug text-ink">{hc.summary}</p>

            {/* Declining seat usage trend */}
            <div className="rounded-[8px] border border-line-soft bg-[#fafafa] p-3" data-testid="health-usage-trend">
              <div className="flex items-center justify-between text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">
                <span>Active Seat Telemetry (Last 90 Days)</span>
                <span className="text-[#99201a]">-48% active seats</span>
              </div>
              <div className="mt-2.5 space-y-2">
                {hc.usageTrend.map((pt) => {
                  const pctVal = Math.round((pt.activeSeats / maxSeats) * 100);
                  const low = pctVal < 55;
                  return (
                    <div key={pt.label} className="grid grid-cols-[95px_minmax(0,1fr)_90px] items-center gap-2.5 text-[12px]">
                      <span className="text-ink-muted">{pt.label}</span>
                      <div className="h-2 overflow-hidden rounded-full bg-[#e6eaef]">
                        <div
                          className={cx("h-full rounded-full", low ? "bg-[#dc2626]" : "bg-[#0b6e6e]")}
                          style={{ width: `${pctVal}%` }}
                        />
                      </div>
                      <span className={cx("text-right font-semibold tabular-nums", low ? "text-[#99201a]" : "text-ink")}>
                        {pt.activeSeats}/{pt.licensedSeats} ({pctVal}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2 Open Support Tickets */}
            <div className="rounded-[8px] border border-line-soft bg-white p-3" data-testid="health-open-tickets">
              <p className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">
                Open HubSpot Support Tickets ({hc.openTickets.length})
              </p>
              <ul className="mt-2 space-y-1.5">
                {hc.openTickets.map((tk) => (
                  <li key={tk.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[6px] bg-[#fafafa] px-2.5 py-1.5 text-[12.5px]">
                    <span className="font-medium text-ink">
                      <span className="font-mono text-[11.5px] text-ink-muted">{tk.number}</span> · {tk.subject}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Tag tone={tk.priority === "Urgent" ? "red" : "amber"}>{tk.priority}</Tag>
                      <span className="text-[11.5px] text-ink-muted">{tk.ageLabel}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Explainable score factors */}
        <div className="mt-4 grid gap-2 border-t border-line-soft pt-3.5 sm:grid-cols-2" data-testid="health-factors">
          {hc.factors.map((f) => (
            <div key={f.id} className="rounded-[8px] border border-line-soft bg-[#fafafa] px-3 py-2 text-[12.5px]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-ink">{f.label}</span>
                <Tag tone={f.tone}>{f.impact}</Tag>
              </div>
              <p className="mt-0.5 text-[12px] text-ink-muted">
                <strong className="text-ink">{f.metric}</strong> · {f.source}
              </p>
            </div>
          ))}
        </div>

        {/* Action footer */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-3.5">
          <p className="max-w-[540px] text-[12.5px] text-ink-muted">
            <strong className="text-ink">Recommended playbook:</strong> {hc.recommendedPlaybook}
          </p>
          {!st.triggered ? (
            <Button size="sm" variant="secondary" onClick={() => navigate("/renewals/renewal-churn-risk/trigger")}>
              Run 90-day trigger first
            </Button>
          ) : !st.atRiskFlagged ? (
            <Button
              variant="primary"
              size="sm"
              data-testid="health-flag-and-quote"
              onClick={() => {
                dispatch({ t: "ren.flagAtRiskAndQuote", at: nowMs() });
                navigate(`/quotes/${cfg.quote.quoteId}`);
              }}
            >
              Flag At-Risk &amp; build retention quote <Icon name="arrowRight" size={14} />
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Tag tone={st.quoteAccepted ? "green" : "amber"}>
                {st.quoteAccepted ? "Renewed Won" : "Flagged At-Risk · Quote Drafted"}
              </Tag>
              <Button
                variant="primary"
                size="sm"
                data-testid="health-open-retention-quote"
                onClick={() => navigate(`/quotes/${cfg.quote.quoteId}`)}
              >
                Open retention quote <Icon name="arrowRight" size={14} />
              </Button>
            </div>
          )}
        </div>
      </Card>
    </Ext>
  );
}

/**
 * Embedded Deal Record panels for all 3 Renewals demos:
 * - S3 (`premium-to-subscription`): Billing Checkout & Subscription Sync (`extId: billing-subscription-sync`) + native CS Handoff
 * - S4 (`renewal-churn-risk`): Native 90-Day Renewal Status & Closed-Won Confirmation (0 Penguin markers)
 * - I3 (`contract-renewal`): Native 120-Day Renewal & QBR Handoff + PSA Agreement Roll-Forward Sync (`extId: psa-contract-sync`)
 */
export function RenewalsDealPanel({ dealId }: { dealId: string }) {
  const { pack, world, dispatch, navigate } = useShell();
  const renewals = pack.demos.renewals;
  if (!renewals) return null;

  // --- S3: Premium to Subscription ---
  const s3Raw = renewals["premium-to-subscription"];
  const s3 = s3Raw?.mode === "dual-pipeline" ? (s3Raw as PremiumToSubscriptionConfig) : undefined;
  if (s3 && (dealId === s3.premiumDealId || dealId === s3.subscriptionDeal.dealId)) {
    const st = world.renewals["premium-to-subscription"];
    const csOwner = pack.personas.find((p) => p.id === s3.csOwnerId);
    const opt = s3.checkout.billingOptions.find((o) => o.id === st.billingOptionId) ?? s3.checkout.billingOptions[0];
    const subMrr = opt?.mrr ?? s3.subscriptionDeal.mrr;
    const subArr = opt?.annualTotal ?? s3.subscriptionDeal.arr;
    const csTasks = world.tasks.filter((t) => t.dealId === s3.subscriptionDeal.dealId);

    if (dealId === s3.premiumDealId) {
      return (
        <Card
          title="Premium-to-Subscription Handoff"
          right={<Tag tone={st.premiumClosed ? "green" : "amber"}>{st.premiumClosed ? "Closed Won" : "Open"}</Tag>}
          testId="s3-premium-deal-panel"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 text-[13px]">
            <p className="text-ink-muted">
              {st.checkoutCompleted
                ? "Customer completed billing checkout and the Subscription deal is live in the Subscription Pipeline."
                : st.premiumClosed
                  ? "Premium deal is Closed Won. Customer billing checkout link is ready."
                  : "Close this Premium deal Won to dispatch the off-platform billing checkout link."}
            </p>
            {!st.premiumClosed ? (
              <Button variant="primary" size="sm" onClick={() => dispatch({ t: "ren.closePremium", at: nowMs() })}>
                Mark Closed Won
              </Button>
            ) : !st.checkoutCompleted ? (
              <Button variant="primary" size="sm" onClick={() => navigate("/renewals-app/premium-to-subscription/checkout")}>
                Open billing checkout <Icon name="external" size={13} />
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => navigate(`/deals/${s3.subscriptionDeal.dealId}`)}>
                Open Subscription deal <Icon name="arrowRight" size={13} />
              </Button>
            )}
          </div>
        </Card>
      );
    }

    // Subscription deal record (S3): ONLY the Billing Checkout & Subscription Sync card carries a Penguin pin!
    return (
      <div className="space-y-4">
        <Ext id={s3.syncCard.extId}>
          <Card
            title={
              <span className="flex flex-wrap items-center gap-2">
                <span>{s3.syncCard.title}</span>
                <Tag tone="purple">{s3.syncCard.badge}</Tag>
              </span>
            }
            right={<span className="whitespace-nowrap pr-10 text-[12px] text-ink-muted">{s3.syncCard.sourceLabel}</span>}
            testId="s3-billing-sync-card"
          >
            <p className="text-[13px] text-ink-muted">{s3.syncCard.summary}</p>
            <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-[8px] border border-line-soft bg-[#fafafa] p-2.5">
                <dt className="text-[11px] uppercase tracking-wide text-ink-muted">Subscription ID</dt>
                <dd className="mt-0.5 font-mono text-[13px] font-semibold">{s3.checkout.subscriptionNumber}</dd>
              </div>
              <div className="rounded-[8px] border border-line-soft bg-[#fafafa] p-2.5">
                <dt className="text-[11px] uppercase tracking-wide text-ink-muted">Start Date</dt>
                <dd className="mt-0.5 text-[13px] font-semibold">{date(s3.subscriptionDeal.startDate)}</dd>
              </div>
              <div className="rounded-[8px] border border-line-soft bg-[#fafafa] p-2.5">
                <dt className="text-[11px] uppercase tracking-wide text-ink-muted">Renewal Date</dt>
                <dd className="mt-0.5 text-[13px] font-semibold">{date(s3.subscriptionDeal.renewalDate)}</dd>
              </div>
              <div className="rounded-[8px] border border-[#bfe3cd] bg-[#f4fbf6] p-2.5">
                <dt className="text-[11px] uppercase tracking-wide text-[#0b5b2b]">Synced MRR / ARR</dt>
                <dd className="mt-0.5 text-[13px] font-bold tabular-nums text-[#0b5b2b]">
                  {money(subMrr)}/mo · {money(subArr)}
                </dd>
              </div>
            </dl>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-3 text-[12.5px]">
              <span className="text-ink-muted">
                Webhook <code className="rounded bg-[#f1f5f9] px-1.5 py-0.5 text-[11.5px]">{s3.checkout.webhookEventId}</code> · Paid via {s3.checkout.paymentMethodLabel} ({s3.checkout.paymentMethodLast4})
              </span>
              {!st.syncVerified ? (
                <Button
                  variant="primary"
                  size="sm"
                  data-testid="s3-confirm-sync-btn"
                  onClick={() => dispatch({ t: "ren.verifySync", at: nowMs() })}
                >
                  <Icon name="check" size={14} /> Confirm billing sync
                </Button>
              ) : (
                <span data-testid="s3-sync-verified-tag">
                  <Tag tone="green">Sync verified</Tag>
                </span>
              )}
            </div>
          </Card>
        </Ext>

        {/* Native HubSpot Customer Success Handoff card — ZERO Penguin markers */}
        <Card
          title="Customer Success Handoff & Kickoff Tasks"
          right={<Tag tone={st.csAssigned ? "green" : "blue"}>{st.csAssigned ? "Assigned & Tasks Created" : "Native HubSpot Workflow"}</Tag>}
          testId="s3-cs-handoff-card"
        >
          <p className="text-[13px] text-ink-muted">
            Workflow: <strong className="text-ink">{s3.csHandoff.workflowName}</strong> — assigns CS owner ({csOwner?.name}) and generates onboarding kickoff tasks automatically.
          </p>
          {st.csAssigned ? (
            <div className="hs-pop mt-3 space-y-2.5" data-testid="s3-cs-assigned-panel">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-[#bfe3cd] bg-[#f4fbf6] px-3.5 py-2.5 text-[13px]">
                <span className="font-semibold text-[#0b5b2b]">
                  CS Owner: {csOwner?.name} · {csTasks.length} kickoff tasks active
                </span>
                <span className="text-[12px] text-ink-muted">Slack alert posted to {s3.csHandoff.slackChannel}</span>
              </div>
              <ul className="space-y-1.5 text-[12.5px]">
                {csTasks.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2 rounded-[6px] border border-line-soft bg-white px-3 py-2">
                    <span className="font-medium text-ink">{t.title}</span>
                    <span className="flex items-center gap-2">
                      <Tag tone={t.priority === "High" ? "red" : "amber"}>{t.priority}</Tag>
                      <span className="text-ink-muted">Due {date(t.dueAt)}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  variant="primary"
                  size="sm"
                  data-testid="s3-back-to-pipelines"
                  onClick={() => navigate("/renewals/premium-to-subscription/pipelines")}
                >
                  Review dual pipelines <Icon name="arrowRight" size={14} />
                </Button>
                <A to={`/reports/${s3.reportId}`} className="hs-link text-[12.5px]" data-testid="s3-open-report-btn">
                  Jump to MRR &amp; renewals report
                </A>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-line-soft bg-[#fafafa] px-3.5 py-3">
              <span className="text-[12.5px] text-ink-muted">
                Ready to assign <strong>{csOwner?.name}</strong> and create {s3.csHandoff.tasks.length} onboarding kickoff tasks.
              </span>
              <Button
                variant="primary"
                size="sm"
                data-testid="s3-assign-cs-btn"
                onClick={() => dispatch({ t: "ren.assignCs", at: nowMs() })}
              >
                Assign CS owner &amp; create kickoff tasks
              </Button>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // --- S4: Renewal and Churn Risk (Native HubSpot Deal card — ZERO Penguin markers) ---
  const s4Raw = renewals["renewal-churn-risk"];
  const s4 = s4Raw?.mode === "health-churn" ? (s4Raw as RenewalChurnRiskConfig) : undefined;
  if (s4 && dealId === s4.renewalDeal.dealId) {
    const st = world.renewals["renewal-churn-risk"];
    return (
      <Card
        title="90-Day Renewal & Retention Status"
        right={<Tag tone={st.quoteAccepted ? "green" : st.atRiskFlagged ? "amber" : "blue"}>{st.quoteAccepted ? "Renewed Won" : st.atRiskFlagged ? "At-Risk Playbook Active" : "90-Day Triggered"}</Tag>}
        testId="s4-renewal-deal-panel"
      >
        {st.quoteAccepted ? (
          <div className="space-y-3" data-testid="s4-renewal-closed-panel">
            <div className="rounded-[8px] border border-[#bfe3cd] bg-[#f4fbf6] px-4 py-3 text-[13px]">
              <p className="flex items-center gap-2 font-semibold text-[#0b5b2b]">
                <Icon name="check" size={15} strokeWidth={2.5} /> Renewal deal closed won — at-risk ARR retained
              </p>
              <p className="mt-1 text-ink-muted">
                Colette Byrne accepted retention quote {s4.quote.number} (15% approved retention discount). CSM renewal task closed automatically.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                data-testid="s4-open-report-btn"
                onClick={() => {
                  dispatch({ t: "ren.verifyClosedRenewal" });
                  navigate(`/reports/${s4.reportId}`);
                }}
              >
                Open Renewal Forecast report <Icon name="arrowRight" size={14} />
              </Button>
              <A to={`/companies/${s4.companyId}`} className="hs-link text-[12.5px]">
                View updated Account Health
              </A>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 text-[13px]">
            <p className="text-ink-muted">
              {st.atRiskFlagged
                ? `Retention quote ${s4.quote.number} drafted with ${s4.quote.retentionDiscountPct}% discount (requires Deal Desk approval >${s4.quote.approvalThresholdPct}%).`
                : "90-day renewal workflow triggered. Inspect the Account Health Score on the Company record before preparing the renewal quote."}
            </p>
            {st.atRiskFlagged ? (
              <Button variant="primary" size="sm" onClick={() => navigate(`/quotes/${s4.quote.quoteId}`)}>
                Open retention quote <Icon name="arrowRight" size={14} />
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={() => navigate(`/companies/${s4.companyId}`)}>
                Inspect Account Health <Icon name="arrowRight" size={14} />
              </Button>
            )}
          </div>
        )}
      </Card>
    );
  }

  // --- I3: Contract Renewal Management ---
  const i3Raw = renewals["contract-renewal"];
  const i3 = i3Raw?.mode === "contract-qbr" ? (i3Raw as ContractRenewalConfig) : undefined;
  if (i3 && dealId === i3.renewalDeal.dealId) {
    const st = world.renewals["contract-renewal"];
    const slot = i3.qbr.slots.find((s) => s.id === (st.qbrSlotId ?? i3.qbr.defaultSlotId)) ?? i3.qbr.slots[0];
    const psa = i3.psaSync;
    const owner = ownerName(pack, i3.ownerId);

    return (
      <div className="space-y-4">
        {/* Native HubSpot 120-Day Renewal & QBR Handoff — ZERO Penguin markers */}
        <Card
          title="120-Day Renewal & QBR Handoff"
          right={<Tag tone={st.quoteAccepted ? "green" : st.qbrBooked ? "blue" : "amber"}>{st.quoteAccepted ? "Renewal Accepted" : st.qbrBooked ? "QBR Booked" : "QBR Pending"}</Tag>}
          testId="i3-native-renewal-card"
        >
          <div className="space-y-2.5 text-[13px]">
            <p className="text-ink-muted">
              Account Manager: <strong className="text-ink">{owner}</strong> · {i3.workflow.name} created this renewal deal and QBR task 120 days before contract end.
            </p>
            {st.qbrBooked ? (
              <div className="rounded-[8px] border border-[#cde0f5] bg-[#f4f8fd] px-3.5 py-2.5 text-[12.5px]">
                <p className="font-semibold text-[#0b4a78]">
                  QBR Booked: {slot.day} · {slot.time} {slot.tz} ({slot.location})
                </p>
                <p className="mt-0.5 text-ink-muted">
                  Confirmed scope: renew Managed IT Complete for {psa.renewedSeats} users (+{psa.renewedSeats - psa.previousSeats} field-service users) across {psa.renewedSites} sites ({money(psa.renewedArr)} ARR).
                </p>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {!st.qbrBooked ? (
                <Button variant="primary" size="sm" onClick={() => navigate("/renewals-app/contract-renewal/qbr")}>
                  Open off-platform QBR booking <Icon name="external" size={13} />
                </Button>
              ) : !st.renewalQuoteId ? (
                <Button
                  variant="primary"
                  size="sm"
                  data-testid="i3-create-quote-btn"
                  onClick={() => {
                    dispatch({ t: "ren.createContractQuote", at: nowMs() });
                    navigate(`/quotes/${i3.quote.quoteId}`);
                  }}
                >
                  Create renewal quote <Icon name="arrowRight" size={14} />
                </Button>
              ) : !st.quoteAccepted ? (
                <Button variant="primary" size="sm" onClick={() => navigate(`/quotes/${i3.quote.quoteId}`)}>
                  Open renewal quote ({i3.quote.number}) <Icon name="arrowRight" size={14} />
                </Button>
              ) : (
                <Tag tone="green">Quote {i3.quote.number} accepted by client</Tag>
              )}
            </div>
          </div>
        </Card>

        {/* Custom Penguin PSA Agreement & Contract-Date Roll-Forward Sync — ONLY Penguin marker in I3 */}
        <Ext id={psa.extId}>
          <Card
            title={
              <span className="flex flex-wrap items-center gap-2">
                <span>{psa.title}</span>
                <Tag tone={st.psaSynced ? "green" : "purple"}>
                  {st.psaSynced ? "Agreement Rolled Forward" : psa.systemLabel}
                </Tag>
              </span>
            }
            right={<span className="whitespace-nowrap pr-10 font-mono text-[12px] text-ink-muted">{psa.agreementId}</span>}
            testId="i3-psa-sync-card"
          >
            <p className="text-[13px] text-ink-muted">{psa.syncNote}</p>
            <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-[8px] border border-line-soft bg-[#fafafa] p-2.5">
                <dt className="text-[11px] uppercase tracking-wide text-ink-muted">Agreement</dt>
                <dd className="mt-0.5 font-mono text-[13px] font-semibold">{psa.agreementId}</dd>
              </div>
              <div className="rounded-[8px] border border-line-soft bg-[#fafafa] p-2.5">
                <dt className="text-[11px] uppercase tracking-wide text-ink-muted">Prior End Date</dt>
                <dd className={cx("mt-0.5 text-[13px] font-semibold", st.psaSynced && "text-ink-muted line-through")}>
                  {date(psa.previousEndDate)}
                </dd>
              </div>
              <div
                className={cx(
                  "rounded-[8px] border p-2.5",
                  st.psaSynced ? "border-[#bfe3cd] bg-[#f4fbf6]" : "border-line-soft bg-[#fafafa]",
                )}
              >
                <dt className="text-[11px] uppercase tracking-wide text-ink-muted">New End Date</dt>
                <dd
                  className={cx("mt-0.5 text-[13px] font-bold", st.psaSynced ? "text-[#0b5b2b]" : "text-ink-muted")}
                  data-testid="i3-psa-rolled-date"
                >
                  {st.psaSynced ? date(psa.rolledEndDate) : `Pending (${psa.termLabel})`}
                </dd>
              </div>
              <div className="rounded-[8px] border border-line-soft bg-[#fafafa] p-2.5">
                <dt className="text-[11px] uppercase tracking-wide text-ink-muted">Managed Users</dt>
                <dd className="mt-0.5 text-[13px] font-semibold tabular-nums" data-testid="i3-psa-seats">
                  {st.psaSynced ? `${psa.renewedSeats} users (+${psa.renewedSeats - psa.previousSeats})` : `${psa.previousSeats} → ${psa.renewedSeats} users`}
                </dd>
              </div>
            </dl>

            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-3">
              {st.psaSynced ? (
                <>
                  <p className="flex items-center gap-1.5 text-[13px] font-semibold text-[#0b5b2b]" data-testid="i3-psa-synced-banner">
                    <Icon name="check" size={15} strokeWidth={2.5} /> PSA agreement {psa.agreementId} updated to {date(psa.rolledEndDate)} · {money(psa.renewedArr)} ARR
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    data-testid="i3-open-report-btn"
                    onClick={() => navigate(`/reports/${i3.reportId}`)}
                  >
                    Open Renewal Pipeline report <Icon name="arrowRight" size={14} />
                  </Button>
                </>
              ) : st.quoteAccepted ? (
                <>
                  <span className="text-[12.5px] text-ink-muted">
                    Renewal quote accepted. Write the new 12-month end date &amp; {psa.renewedSeats} seats back to {psa.systemLabel}.
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    data-testid="i3-sync-psa-btn"
                    onClick={() => dispatch({ t: "ren.syncPsa", at: nowMs() })}
                  >
                    <Icon name="sync" size={14} /> Sync PSA agreement &amp; roll end date
                  </Button>
                </>
              ) : (
                <span className="text-[12.5px] text-ink-muted">
                  Awaiting client acceptance of {i3.quote.number} before rolling contract end date forward in {psa.systemLabel}.
                </span>
              )}
            </div>
          </Card>
        </Ext>
      </div>
    );
  }

  return null;
}
