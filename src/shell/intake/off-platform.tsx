"use client";

import { useState } from "react";
import { nowMs } from "@/lib/format";
import { useShell } from "@/store/store";
import { Icon } from "../icons";
import { A, Avatar, Button, cx, Tag } from "../ui";
import type { IntakeDemoId } from "./types";

function OffPlatformIntakeChrome({
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
            data-testid="intake-offplatform-pill"
          >
            <Icon name="external" size={12} /> Off-platform view
          </span>
          <span className="font-medium text-[#334155]">{channelLabel}</span>
        </div>
        <A
          to={returnTo}
          data-testid="intake-return-hubspot"
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

/** Step 1 (Off-platform): External intake submission portal (referring clinic, hospital staffing, or loan application). */
export function IntakeSubmitPage({ demoId }: { demoId: IntakeDemoId }) {
  const { pack, world, dispatch, navigate } = useShell();
  const cfg = pack.demos.intake?.[demoId];
  const st = world.intake[demoId];

  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const field of cfg?.portal.fields ?? []) {
      init[field.id] = st.formValues[field.id] ?? field.defaultValue;
    }
    return init;
  });

  if (!cfg) return null;
  const p = cfg.portal;
  const dealId = st.dealId ?? cfg.createdRecords.dealId;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ t: "intake.submit", demoId, at: nowMs(), values });
  };

  return (
    <OffPlatformIntakeChrome
      channelLabel={p.channelLabel}
      windowTitle={p.brandName}
      url={p.url}
      returnTo={st.submitted ? `/deals/${dealId}` : "/deals"}
      returnLabel={st.submitted ? p.returnToHubSpotLabel : "Return to HubSpot"}
      testId={`intake-submit-${demoId}`}
    >
      <div className="min-h-full bg-[#f4f7fa]">
        <header className="flex items-center justify-between px-10 py-3.5 text-white" style={{ background: p.accentColor }}>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] bg-white/15 text-[13px] font-bold">
              {p.brandShort}
            </span>
            <p className="text-[17px] font-bold tracking-tight">{p.brandName}</p>
          </div>
          <div className="flex items-center gap-5 text-[12.5px] text-white/85">
            {p.navItems.map((item, idx) => (
              <span key={item} className={idx === p.navItems.length - 1 ? "rounded-full bg-white/15 px-3 py-1 font-semibold text-white" : undefined}>
                {item}
              </span>
            ))}
          </div>
        </header>

        <div className="mx-auto grid max-w-[1060px] grid-cols-[1fr_470px] gap-10 px-10 py-8">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dff4f0] px-3 py-1 text-[12px] font-semibold text-[#00514f]">
              <Icon name="shield" size={13} /> {p.eyebrow}
            </span>
            <h1 className="mt-3 text-[30px] font-bold leading-tight tracking-tight text-[#0f2c42]">{p.headline}</h1>
            <p className="mt-3 text-[14.5px] leading-relaxed text-[#425869]">{p.subheadline}</p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {p.metrics.map((m) => (
                <div key={m.label} className="rounded-[10px] border border-[#d5dde5] bg-white p-3.5">
                  <p className="text-[21px] font-bold text-[#0f2c42]">{m.value}</p>
                  <p className="mt-0.5 text-[12px] leading-snug text-[#536878]">{m.label}</p>
                </div>
              ))}
            </div>

            <ul className="mt-6 space-y-2.5 text-[13.5px] text-[#243447]">
              {p.proofPoints.map((pt) => (
                <li key={pt} className="flex items-start gap-2">
                  <Icon name="check" size={16} className="mt-0.5 shrink-0 text-[#1a7f5a]" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex items-start gap-2.5 rounded-[8px] border border-[#b9e1dc] bg-[#f1faf8] px-4 py-3 text-[12.5px] text-[#00514f]">
              <Icon name="shield" size={16} className="mt-0.5 shrink-0" />
              <span>{p.complianceNotice}</span>
            </div>
          </div>

          <div className="rounded-[12px] border border-[#d5dde5] bg-white p-6 shadow-[0_8px_28px_rgba(15,61,86,0.1)]">
            {st.submitted ? (
              <div className="hs-pop" data-testid="intake-submitted">
                <p className="flex items-center gap-2 text-[19px] font-bold text-[#0f2c42]">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#1a7f5a] text-white">
                    <Icon name="check" size={16} strokeWidth={2.4} />
                  </span>
                  {p.confirmationHeadline}
                </p>
                <p className="mt-2 text-[13.5px] text-[#425869]">{p.confirmationSummary}</p>

                <div className="mt-5 rounded-[8px] border border-line-soft bg-[#fafafa] p-4 text-ink">
                  <p className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Captured in HubSpot</p>
                  <ul className="mt-2.5 space-y-1.5 text-[13px]">
                    {p.capturedBullets.map((line) => (
                      <li key={line} className="flex gap-2">
                        <Icon name="check" size={14} className="mt-0.5 shrink-0 text-[#0b5b2b]" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant="primary"
                    className="mt-4 w-full"
                    data-testid="intake-view-deal"
                    onClick={() => navigate(`/deals/${dealId}`)}
                  >
                    {p.returnToHubSpotLabel} <Icon name="arrowRight" size={15} />
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} data-testid="intake-submit-form">
                <h2 className="text-[18px] font-bold text-[#0f2c42]">{p.formTitle}</h2>
                <p className="mt-1 text-[12.5px] text-[#536878]">{p.formSubtitle}</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
                  {p.fields.map((field) => {
                    const spanClass = field.span === 2 || field.kind === "textarea" ? "col-span-2" : "col-span-1";
                    const val = values[field.id] ?? field.defaultValue;
                    return (
                      <label key={field.id} className={cx("block", spanClass)}>
                        <span className="font-semibold text-[#243447]">{field.label}</span>
                        {field.kind === "textarea" ? (
                          <textarea
                            value={val}
                            onChange={(e) => setValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
                            rows={3}
                            data-testid={`intake-field-${field.id}`}
                            className="mt-1 w-full resize-none rounded-[6px] border border-[#c5ced8] px-3 py-2 text-[13px]"
                          />
                        ) : field.kind === "select" && field.options ? (
                          <select
                            value={val}
                            onChange={(e) => setValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
                            data-testid={`intake-field-${field.id}`}
                            className="mt-1 h-9 w-full rounded-[6px] border border-[#c5ced8] bg-white px-2.5 text-[13px]"
                          >
                            {field.options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            value={val}
                            onChange={(e) => setValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
                            data-testid={`intake-field-${field.id}`}
                            className="mt-1 h-9 w-full rounded-[6px] border border-[#c5ced8] px-3 text-[13px]"
                          />
                        )}
                      </label>
                    );
                  })}
                </div>
                <Button
                  type="submit"
                  variant="dark"
                  className="mt-5 w-full"
                  style={{ background: p.accentColor }}
                  data-testid="intake-submit-btn"
                >
                  {p.submitLabel}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </OffPlatformIntakeChrome>
  );
}

/** Step 4 (Off-platform): Recipient email inbox + interactive slot scheduling or candidate shortlist selection. */
export function IntakeFollowupPage({ demoId }: { demoId: IntakeDemoId }) {
  const { pack, world, dispatch, navigate } = useShell();
  const cfg = pack.demos.intake?.[demoId];
  const st = world.intake[demoId];
  if (!cfg) return null;

  const fu = cfg.followup;
  const sender = pack.personas.find((p) => p.id === cfg.outreach.senderId);
  const dealId = st.dealId ?? cfg.createdRecords.dealId;
  const subject = st.outreachSubject ?? cfg.outreach.subject;
  const body = st.outreachBody ?? cfg.outreach.body;
  const selectedIds = st.selectedOptionIds.length > 0 ? st.selectedOptionIds : fu.defaultOptionIds;
  const selectedOptions = fu.options.filter((o) => selectedIds.includes(o.id));
  const completed = st.followupCompleted;

  return (
    <OffPlatformIntakeChrome
      channelLabel={fu.channelLabel}
      windowTitle={fu.windowTitle}
      url={fu.address}
      returnTo={`/deals/${dealId}`}
      returnLabel="Return to HubSpot"
      testId={`intake-followup-${demoId}`}
    >
      <div className="grid min-h-full grid-cols-[185px_minmax(0,1fr)_420px] bg-white">
        <aside className="border-r border-[#e2e8f0] bg-[#f8fafc] p-3">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-[7px] bg-[#1e293b] text-[12px] font-bold text-white">
              {fu.inboxInitial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-[#0f172a]">{fu.inboxBrand}</p>
              <p className="truncate text-[11px] text-[#64748b]">{fu.inboxOwnerEmail}</p>
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
              {fu.noiseEmails.map((m) => (
                <li key={m.id} className="rounded-[6px] px-2 py-1.5 text-[11.5px] text-[#475569]">
                  <p className="truncate font-semibold text-[#334155]">{m.from}</p>
                  <p className="truncate text-[#64748b]">{m.subject}</p>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <article className="border-r border-[#e2e8f0] px-7 py-6" data-testid="intake-followup-inbox">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#dbeafe] px-2.5 py-0.5 text-[11px] font-bold text-[#1d4ed8]">New email</span>
            <span className="text-[12px] text-[#64748b]">Just now · Sent from HubSpot CRM</span>
          </div>
          <h1 className="mt-2 text-[20px] font-bold leading-snug text-[#0f172a]">{subject}</h1>
          <div className="mt-3 flex items-center gap-2.5 border-b border-[#e2e8f0] pb-4 text-[12.5px]">
            <Avatar name={sender?.name ?? "Coordinator"} color={sender?.color ?? "#0b6e6e"} size={32} />
            <div>
              <p className="font-semibold text-[#0f172a]">
                {sender?.name ?? "Coordinator"} <span className="font-normal text-[#64748b]">&lt;{sender?.email}&gt;</span>
              </p>
              <p className="text-[#64748b]">
                To: {fu.inboxOwnerName} &lt;{fu.inboxOwnerEmail}&gt;
              </p>
            </div>
          </div>

          <p className="mt-5 whitespace-pre-line text-[14px] leading-relaxed text-[#1e293b]">{body}</p>
        </article>

        <aside className="bg-[#f8fafc] p-6" data-testid="intake-followup-picker">
          <div className="rounded-[12px] border border-[#cbd5e1] bg-white p-5 shadow-sm">
            <p className="text-[15px] font-bold text-[#0f172a]">{fu.panelTitle}</p>
            <p className="mt-1 text-[12.5px] text-[#64748b]">{fu.panelSubtitle}</p>

            {completed ? (
              <div className="hs-pop mt-5 rounded-[10px] border border-[#bfe3cd] bg-[#f0faf4] p-4" data-testid="intake-followup-confirmed">
                <p className="flex items-center gap-2 text-[15px] font-bold text-[#0b5b2b]">
                  <Icon name="check" size={17} strokeWidth={2.5} /> {fu.confirmedHeadline}
                </p>
                <p className="mt-1.5 text-[13px] font-semibold text-[#0f172a]">
                  {selectedOptions.map((o) => o.title).join(" · ")}
                </p>
                <p className="mt-1 text-[12.5px] text-[#475569]">{fu.confirmedBody}</p>
                <ul className="mt-3 space-y-1.5 border-t border-[#bfe3cd] pt-3 text-[12.5px] text-[#1e293b]">
                  {fu.hubSpotSyncBullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <Icon name="check" size={14} className="mt-0.5 shrink-0 text-[#0b5b2b]" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant="primary"
                  className="mt-4 w-full"
                  data-testid="intake-followup-return-deal"
                  onClick={() => navigate(`/deals/${dealId}`)}
                >
                  {fu.returnButtonLabel} <Icon name="arrowRight" size={15} />
                </Button>
              </div>
            ) : (
              <div className="mt-5">
                <p className="text-[11.5px] font-semibold uppercase tracking-wide text-[#64748b]">{fu.optionsHeading}</p>
                <div className="mt-2.5 space-y-2.5">
                  {fu.options.map((opt) => {
                    const active = selectedIds.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        aria-pressed={active}
                        data-testid={`intake-option-${opt.id}`}
                        onClick={() => dispatch({ t: "intake.toggleOption", demoId, optionId: opt.id })}
                        className={cx(
                          "block w-full rounded-[8px] border px-3.5 py-3 text-left transition-colors",
                          active ? "border-hs-orange bg-[#fff7f2]" : "border-[#cbd5e1] bg-white hover:border-[#0f172a]",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[13.5px] font-semibold text-[#0f172a]">{opt.title}</p>
                            <p className="mt-0.5 text-[12px] text-[#475569]">{opt.subtitle}</p>
                          </div>
                          {opt.badge ? <Tag tone={opt.badgeTone ?? "green"}>{opt.badge}</Tag> : null}
                        </div>
                        <div className="mt-1.5 flex items-center justify-between gap-2 text-[11.5px] text-[#64748b]">
                          <span>{opt.meta}</span>
                          <span className={cx("font-semibold", active ? "text-hs-orange" : "text-[#94a3b8]")}>
                            {active ? "Selected" : fu.selectionMode === "multi" ? "Click to select" : "Select"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <Button
                  variant="primary"
                  className="mt-4 w-full"
                  data-testid="intake-followup-confirm"
                  onClick={() => dispatch({ t: "intake.completeFollowup", demoId, optionIds: selectedIds, at: nowMs() })}
                >
                  <Icon name="check" size={15} /> {fu.confirmButtonLabel}
                </Button>
                <p className="mt-2 text-center text-[11.5px] text-[#64748b]">
                  Updates the HubSpot deal stage &amp; timeline automatically
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </OffPlatformIntakeChrome>
  );
}
