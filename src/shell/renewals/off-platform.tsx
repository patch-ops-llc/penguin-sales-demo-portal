"use client";

import { nowMs } from "@/lib/format";
import { useShell } from "@/store/store";
import { date, money } from "../format";
import { Icon } from "../icons";
import { A, Avatar, Button, cx, Tag } from "../ui";
import type { ContractRenewalConfig, PremiumToSubscriptionConfig } from "./types";

function OffPlatformChrome({
  channelLabel,
  windowTitle,
  url,
  returnTo,
  returnLabel = "Return to HubSpot",
  testId,
  children,
}: {
  channelLabel: string;
  windowTitle: string;
  url: string;
  returnTo: string;
  returnLabel?: string;
  testId: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#dfe3e8] p-4" data-testid={testId}>
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 text-[12.5px]">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-[#1e293b] px-3 py-1 text-[11.5px] font-semibold text-white"
            data-testid="renewals-offplatform-pill"
          >
            <Icon name="external" size={12} /> Off-platform view
          </span>
          <span className="font-medium text-[#334155]">{channelLabel}</span>
        </div>
        <A
          to={returnTo}
          data-testid="renewals-return-hubspot"
          className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-[#94a3b8] bg-white px-3 text-[12.5px] font-semibold text-[#1e293b] hover:border-[#1e293b]"
        >
          <Icon name="arrowLeft" size={14} /> {returnLabel}
        </A>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] border border-[#b8c0cc] bg-white shadow-[0_12px_36px_rgba(15,23,42,0.14)]">
        <div className="flex items-center gap-3 border-b border-[#e2e8f0] bg-[#f1f5f9] px-4 py-2">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </span>
          <span className="text-[12px] font-semibold text-[#475569]">{windowTitle}</span>
          <span className="flex h-7 flex-1 items-center gap-2 truncate rounded-full bg-white px-3 text-[12px] text-[#64748b] ring-1 ring-[#cbd5e1]">
            <Icon name="lock" size={11} className="shrink-0" />
            <span className="truncate">{url}</span>
          </span>
        </div>
        <div className="hs-scroll min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/**
 * Off-platform external billing checkout screen for SaaS #3 (`premium-to-subscription`).
 * Completing payment fires the billing webhook that auto-creates the Subscription deal in HubSpot.
 * ZERO Penguin markers on this external screen.
 */
export function BillingCheckoutView({ cfg }: { cfg: PremiumToSubscriptionConfig }) {
  const { world, dispatch, navigate } = useShell();
  const st = world.renewals["premium-to-subscription"];
  const co = cfg.checkout;
  const company = world.companies.find((c) => c.id === cfg.companyId);
  const contact = world.contacts.find((c) => c.id === cfg.contactId);
  const activeOptionId = st.billingOptionId ?? co.defaultBillingOptionId;
  const activeOption = co.billingOptions.find((o) => o.id === activeOptionId) ?? co.billingOptions[0];

  return (
    <OffPlatformChrome
      channelLabel={co.channelLabel}
      windowTitle={co.brandName}
      url={co.url}
      returnTo={st.checkoutCompleted ? `/deals/${cfg.subscriptionDeal.dealId}` : "/renewals/premium-to-subscription/pipelines"}
      returnLabel={st.checkoutCompleted ? "Open Subscription deal in HubSpot" : "Return to HubSpot"}
      testId="renewals-billing-checkout"
    >
      <div className="min-h-full bg-[#f4f7fa]">
        <header className="flex items-center justify-between px-10 py-3.5 text-white" style={{ background: co.accentColor }}>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] bg-white/15 text-[13px] font-bold">
              {co.brandShort}
            </span>
            <p className="text-[16px] font-bold tracking-tight">{co.brandName}</p>
          </div>
          <span className="rounded-full bg-white/15 px-3 py-1 text-[12px] font-semibold">
            Secure Subscription Checkout
          </span>
        </header>

        <div className="mx-auto grid max-w-[1040px] grid-cols-[1fr_440px] gap-8 px-10 py-8">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dff4f0] px-3 py-1 text-[12px] font-semibold text-[#00514f]">
              <Icon name="creditCard" size={13} /> Order from Closed-Won Premium Deal
            </span>
            <h1 className="mt-3 text-[26px] font-bold leading-tight text-[#0f172a]">
              Activate {company?.name ?? "Thistledown Veterinary Network"} Subscription
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-[#475569]">
              Prepared for <strong className="text-[#0f172a]">{contact ? `${contact.firstName} ${contact.lastName}` : "Callum Reyes"}</strong> ({co.billingEmail}). Completing payment activates your {co.seatCount}-seat workspace and fires a live billing webhook into HubSpot.
            </p>

            <div className="mt-6 rounded-[12px] border border-[#d5dde5] bg-white p-5">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">Billing Cadence</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {co.billingOptions.map((opt) => {
                  const selected = opt.id === activeOption.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={st.checkoutCompleted}
                      aria-pressed={selected}
                      data-testid={`billing-option-${opt.id}`}
                      onClick={() => dispatch({ t: "ren.selectBillingOption", optionId: opt.id })}
                      className={cx(
                        "rounded-[10px] border p-3.5 text-left transition-colors",
                        selected ? "border-[#0b6e6e] bg-[#f1faf8]" : "border-[#cbd5e1] bg-white hover:border-[#0f172a]",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13.5px] font-bold text-[#0f172a]">{opt.label}</span>
                        {opt.badge ? <Tag tone="green">{opt.badge}</Tag> : null}
                      </div>
                      <p className="mt-1.5 text-[18px] font-bold tabular-nums text-[#0f172a]">
                        {money(opt.mrr)}<span className="text-[12px] font-normal text-[#64748b]">/mo</span>
                      </p>
                      <p className="mt-0.5 text-[12px] text-[#475569]">{opt.billingNote}</p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 border-t border-[#e2e8f0] pt-4 text-[13px]">
                <p className="font-semibold text-[#0f172a]">Subscription Schedule</p>
                <dl className="mt-2 grid grid-cols-3 gap-3">
                  <div className="rounded-[8px] bg-[#f8fafc] p-2.5">
                    <dt className="text-[11px] uppercase tracking-wide text-[#64748b]">Plan</dt>
                    <dd className="mt-0.5 font-semibold text-[#0f172a]">{co.planName}</dd>
                  </div>
                  <div className="rounded-[8px] bg-[#f8fafc] p-2.5">
                    <dt className="text-[11px] uppercase tracking-wide text-[#64748b]">Start Date</dt>
                    <dd className="mt-0.5 font-semibold text-[#0f172a]">{date(cfg.subscriptionDeal.startDate)}</dd>
                  </div>
                  <div className="rounded-[8px] bg-[#f8fafc] p-2.5">
                    <dt className="text-[11px] uppercase tracking-wide text-[#64748b]">Renewal Date</dt>
                    <dd className="mt-0.5 font-semibold text-[#0f172a]">{date(cfg.subscriptionDeal.renewalDate)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          <div className="rounded-[12px] border border-[#d5dde5] bg-white p-6 shadow-[0_8px_28px_rgba(15,23,42,0.08)]">
            {st.checkoutCompleted ? (
              <div className="hs-pop" data-testid="checkout-completed-panel">
                <p className="flex items-center gap-2 text-[19px] font-bold text-[#0b5b2b]">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#1a7f5a] text-white">
                    <Icon name="check" size={16} strokeWidth={2.5} />
                  </span>
                  Payment Confirmed
                </p>
                <p className="mt-2 text-[13.5px] text-[#475569]">
                  Subscription <strong className="text-[#0f172a]">{co.subscriptionNumber}</strong> is now active. Billing webhook <code className="rounded bg-[#f1f5f9] px-1.5 py-0.5 text-[12px]">{co.webhookEventId}</code> fired to HubSpot.
                </p>

                <div className="mt-5 rounded-[8px] border border-[#bfe3cd] bg-[#f4fbf6] p-4 text-[13px]">
                  <p className="text-[11.5px] font-semibold uppercase tracking-wide text-[#0b5b2b]">Synced to HubSpot</p>
                  <ul className="mt-2 space-y-1.5 text-[#1e293b]">
                    <li className="flex gap-2">
                      <Icon name="check" size={14} className="mt-0.5 shrink-0 text-[#0b5b2b]" />
                      <span>Created Subscription deal in <strong>{cfg.subscriptionPipelineName}</strong></span>
                    </li>
                    <li className="flex gap-2">
                      <Icon name="check" size={14} className="mt-0.5 shrink-0 text-[#0b5b2b]" />
                      <span>Start {date(cfg.subscriptionDeal.startDate)} · Renewal {date(cfg.subscriptionDeal.renewalDate)}</span>
                    </li>
                    <li className="flex gap-2">
                      <Icon name="check" size={14} className="mt-0.5 shrink-0 text-[#0b5b2b]" />
                      <span>MRR {money(activeOption.mrr)}/mo · ARR {money(activeOption.annualTotal)}</span>
                    </li>
                  </ul>
                </div>

                <Button
                  variant="primary"
                  className="mt-5 w-full"
                  data-testid="checkout-open-sub-deal"
                  onClick={() => navigate(`/deals/${cfg.subscriptionDeal.dealId}`)}
                >
                  Open Subscription deal in HubSpot <Icon name="arrowRight" size={15} />
                </Button>
              </div>
            ) : (
              <div data-testid="checkout-payment-form">
                <h2 className="text-[17px] font-bold text-[#0f172a]">Payment Summary</h2>
                <dl className="mt-4 divide-y divide-[#e2e8f0] text-[13.5px]">
                  <div className="flex justify-between py-2">
                    <dt className="text-[#475569]">{co.planName} ({co.seatCount} seats)</dt>
                    <dd className="font-semibold tabular-nums text-[#0f172a]">{money(activeOption.mrr)}/mo</dd>
                  </div>
                  <div className="flex justify-between py-2">
                    <dt className="text-[#475569]">Billing cadence</dt>
                    <dd className="font-semibold text-[#0f172a]">{activeOption.label}</dd>
                  </div>
                  <div className="flex justify-between py-2.5 text-[15px] font-bold">
                    <dt className="text-[#0f172a]">Total due today</dt>
                    <dd className="tabular-nums text-[#0f172a]" data-testid="checkout-total-due">{money(activeOption.annualTotal)}</dd>
                  </div>
                </dl>

                <div className="mt-4 rounded-[8px] border border-[#cbd5e1] bg-[#f8fafc] p-3.5 text-[13px]">
                  <p className="text-[11.5px] font-semibold uppercase tracking-wide text-[#64748b]">Saved Payment Method</p>
                  <p className="mt-1 flex items-center justify-between font-semibold text-[#0f172a]">
                    <span className="flex items-center gap-2">
                      <Icon name="creditCard" size={15} /> {co.paymentMethodLabel}
                    </span>
                    <span className="font-mono text-[12.5px] text-[#475569]">{co.paymentMethodLast4}</span>
                  </p>
                  <p className="mt-1 text-[12px] text-[#64748b]">Billing receipt sent to {co.billingEmail}</p>
                </div>

                <Button
                  variant="dark"
                  className="mt-5 w-full"
                  style={{ background: co.accentColor }}
                  data-testid="checkout-complete-btn"
                  onClick={() => dispatch({ t: "ren.completeCheckout", optionId: activeOption.id, at: nowMs() })}
                >
                  <Icon name="lock" size={14} /> Complete payment ({money(activeOption.annualTotal)})
                </Button>
                <p className="mt-2.5 text-center text-[11.5px] text-[#64748b]">
                  Sample synthetic billing account ({co.paymentMethodLast4}) · No real charge
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </OffPlatformChrome>
  );
}

/**
 * Off-platform client inbox + QBR meeting scheduler for IT Services #3 (`contract-renewal`).
 * ZERO Penguin markers on this external screen.
 */
export function QbrSchedulerView({ cfg }: { cfg: ContractRenewalConfig }) {
  const { pack, world, dispatch, navigate } = useShell();
  const st = world.renewals["contract-renewal"];
  const qbr = cfg.qbr;
  const sender = pack.personas.find((p) => p.id === cfg.ownerId);
  const selectedSlotId = st.qbrSlotId ?? qbr.defaultSlotId;
  const selectedSlot = qbr.slots.find((s) => s.id === selectedSlotId) ?? qbr.slots[0];

  return (
    <OffPlatformChrome
      channelLabel={qbr.channelLabel}
      windowTitle={qbr.windowTitle}
      url={qbr.url}
      returnTo={`/deals/${cfg.renewalDeal.dealId}`}
      returnLabel="Return to HubSpot"
      testId="renewals-qbr-scheduler"
    >
      <div className="grid min-h-full grid-cols-[185px_minmax(0,1fr)_410px] bg-white">
        <aside className="border-r border-[#e2e8f0] bg-[#f8fafc] p-3">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-[7px] bg-[#1e293b] text-[12px] font-bold text-white">
              {qbr.inboxInitial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-[#0f172a]">{qbr.inboxBrand}</p>
              <p className="truncate text-[11px] text-[#64748b]">{qbr.inboxOwnerEmail}</p>
            </div>
          </div>
          <ul className="mt-4 space-y-1 text-[12.5px]">
            <li className="flex items-center justify-between rounded-[6px] bg-[#e2e8f0] px-2.5 py-1.5 font-semibold text-[#0f172a]">
              <span>Inbox</span>
              <span className="rounded-full bg-[#2563eb] px-1.5 py-0.5 text-[10.5px] font-bold text-white">1</span>
            </li>
            <li className="px-2.5 py-1.5 text-[#64748b]">Starred</li>
            <li className="px-2.5 py-1.5 text-[#64748b]">Sent</li>
            <li className="px-2.5 py-1.5 text-[#64748b]">Archive</li>
          </ul>
          <div className="mt-5 border-t border-[#e2e8f0] pt-3">
            <p className="px-2 text-[10.5px] font-semibold uppercase tracking-wide text-[#94a3b8]">Recent threads</p>
            <ul className="mt-2 space-y-2">
              {qbr.noiseEmails.map((m) => (
                <li key={m.id} className="rounded-[6px] px-2 py-1.5 text-[11.5px] text-[#475569]">
                  <p className="truncate font-semibold text-[#334155]">{m.from}</p>
                  <p className="truncate text-[#64748b]">{m.subject}</p>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <article className="border-r border-[#e2e8f0] px-7 py-6">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#dbeafe] px-2.5 py-0.5 text-[11px] font-bold text-[#1d4ed8]">QBR invite</span>
            <span className="text-[12px] text-[#64748b]">120-day renewal check-in · HubSpot Meetings</span>
          </div>
          <h1 className="mt-2 text-[20px] font-bold leading-snug text-[#0f172a]">{qbr.emailSubject}</h1>
          <div className="mt-3 flex items-center gap-2.5 border-b border-[#e2e8f0] pb-4 text-[12.5px]">
            <Avatar name={sender?.name ?? "Account Manager"} color={sender?.color ?? "#1565c0"} size={32} />
            <div>
              <p className="font-semibold text-[#0f172a]">
                {sender?.name} <span className="font-normal text-[#64748b]">&lt;{sender?.email}&gt;</span>
              </p>
              <p className="text-[#64748b]">
                To: {qbr.inboxOwnerName} &lt;{qbr.inboxOwnerEmail}&gt;
              </p>
            </div>
          </div>

          <p className="mt-5 whitespace-pre-line text-[14px] leading-relaxed text-[#1e293b]">{qbr.emailBody}</p>

          <div className="mt-5 rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[#475569]">QBR Agenda ({qbr.durationLabel})</p>
            <ul className="mt-2 space-y-1.5 text-[13px] text-[#1e293b]">
              {qbr.agenda.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Icon name="check" size={14} className="mt-0.5 shrink-0 text-[#0b6e6e]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </article>

        <aside className="bg-[#f8fafc] p-6" data-testid="qbr-slot-picker">
          <div className="rounded-[12px] border border-[#cbd5e1] bg-white p-5 shadow-sm">
            <p className="text-[15px] font-bold text-[#0f172a]">{qbr.meetingTitle}</p>
            <p className="mt-1 text-[12.5px] text-[#64748b]">Hosted by {sender?.name} · {qbr.durationLabel}</p>

            {st.qbrBooked ? (
              <div className="hs-pop mt-5 rounded-[10px] border border-[#bfe3cd] bg-[#f0faf4] p-4" data-testid="qbr-confirmed-panel">
                <p className="flex items-center gap-2 text-[15px] font-bold text-[#0b5b2b]">
                  <Icon name="check" size={17} strokeWidth={2.5} /> QBR Meeting Confirmed
                </p>
                <p className="mt-1.5 text-[13.5px] font-semibold text-[#0f172a]">
                  {selectedSlot.day} · {selectedSlot.time} {selectedSlot.tz}
                </p>
                <p className="mt-0.5 text-[12.5px] text-[#475569]">{selectedSlot.location}</p>
                <ul className="mt-3 space-y-1.5 border-t border-[#bfe3cd] pt-3 text-[12.5px] text-[#1e293b]">
                  <li className="flex gap-2">
                    <Icon name="check" size={14} className="mt-0.5 shrink-0 text-[#0b5b2b]" />
                    <span>Logged on Nell Okonkwo &amp; Eastlake Mechanical deal timeline</span>
                  </li>
                  <li className="flex gap-2">
                    <Icon name="check" size={14} className="mt-0.5 shrink-0 text-[#0b5b2b]" />
                    <span>Renewal deal stage moved to <strong>QBR Scheduled</strong></span>
                  </li>
                </ul>
                <Button
                  variant="primary"
                  className="mt-4 w-full"
                  data-testid="qbr-open-deal"
                  onClick={() => navigate(`/deals/${cfg.renewalDeal.dealId}`)}
                >
                  Open renewal deal in HubSpot <Icon name="arrowRight" size={15} />
                </Button>
              </div>
            ) : (
              <div className="mt-5">
                <p className="text-[11.5px] font-semibold uppercase tracking-wide text-[#64748b]">Choose a QBR time slot</p>
                <div className="mt-2.5 space-y-2.5">
                  {qbr.slots.map((slot) => {
                    const active = slot.id === selectedSlot.id;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        aria-pressed={active}
                        data-testid={`qbr-slot-${slot.id}`}
                        onClick={() => dispatch({ t: "ren.selectQbrSlot", slotId: slot.id })}
                        className={cx(
                          "block w-full rounded-[8px] border px-3.5 py-3 text-left transition-colors",
                          active ? "border-hs-orange bg-[#fff7f2]" : "border-[#cbd5e1] bg-white hover:border-[#0f172a]",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[13.5px] font-semibold text-[#0f172a]">{slot.day}</span>
                          <span className={cx("text-[11.5px] font-semibold", active ? "text-hs-orange" : "text-[#94a3b8]")}>
                            {active ? "Selected" : "Select"}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[12.5px] font-medium text-[#334155]">
                          {slot.time} {slot.tz}
                        </p>
                        <p className="mt-0.5 text-[11.5px] text-[#64748b]">{slot.location}</p>
                      </button>
                    );
                  })}
                </div>
                <Button
                  variant="primary"
                  className="mt-4 w-full"
                  data-testid="qbr-confirm-btn"
                  onClick={() => dispatch({ t: "ren.bookQbr", slotId: selectedSlot.id, at: nowMs() })}
                >
                  <Icon name="meeting" size={15} /> Confirm QBR meeting
                </Button>
                <p className="mt-2 text-center text-[11.5px] text-[#64748b]">
                  Syncs natively to HubSpot Meetings &amp; Deal timeline
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </OffPlatformChrome>
  );
}
