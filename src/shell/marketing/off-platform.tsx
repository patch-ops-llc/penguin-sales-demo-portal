"use client";

import { useState } from "react";
import { nowMs } from "@/lib/format";
import { useShell } from "@/store/store";
import { Icon } from "../icons";
import { A, Avatar, Button, cx, Tag } from "../ui";

/**
 * Shared non-HubSpot top bar for all off-platform screens in Flow 1.
 * Clearly distinguishes the screen as happening outside HubSpot and always gives an obvious way back.
 */
function OffPlatformChrome({
  badge,
  windowTitle,
  address,
  returnTo,
  returnLabel,
  children,
  testId,
}: {
  badge: string;
  windowTitle: string;
  address: string;
  returnTo: string;
  returnLabel: string;
  children: React.ReactNode;
  testId: string;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#dfe3e8] p-4" data-testid={testId}>
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 text-[12.5px]">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1e293b] px-3 py-1 text-[11.5px] font-semibold text-white">
            <Icon name="external" size={12} /> Off-platform view
          </span>
          <span className="font-medium text-[#334155]">{badge}</span>
        </div>
        <A
          to={returnTo}
          data-testid="off-platform-return"
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
          <span className="flex h-7 flex-1 items-center gap-2 rounded-full bg-white px-3 text-[12px] text-[#64748b] ring-1 ring-[#cbd5e1]">
            <Icon name="lock" size={11} /> {address}
          </span>
        </div>
        <div className="hs-scroll min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

const NOISE_EMAILS = [
  { id: "noise-1", from: "Board Prep · Kestrel Ops", subject: "Q4 Board Deck — metrics alignment needed by Friday", time: "9:42 AM", preview: "Finance and RevOps ARR retention slides still differ by 1.4%..." },
  { id: "noise-2", from: "Marcus Bennett", subject: "Snowflake warehouse costs + self-serve requests", time: "Yesterday", preview: "Got 19 new ad-hoc dashboard requests from GTM leads this week." },
  { id: "noise-3", from: "Priya Nair", subject: "FY27 software consolidation tracker", time: "2 days ago", preview: "Flagged 3 overlapping analytics tools we can review before renewal." },
];

/**
 * Step 9 (Off-platform): Prospect's email inbox showing Lumenstack's tailored outreach arriving.
 */
export function OffPlatformInboxPage() {
  const { pack, world, dispatch, navigate } = useShell();
  const config = pack.demos.marketingStudio;
  if (!config) return null;

  const primary = config.outreach.find((o) => o.contactId === config.primaryContactId) ?? config.outreach[0];
  const marketer = config.marketer;
  const contact = world.contacts.find((c) => c.id === config.primaryContactId);

  return (
    <OffPlatformChrome
      badge="Elena Morales's email inbox (Kestrel Ops) — outside HubSpot"
      windowTitle="Kestrel Mail"
      address="mail.kestrelops.example/inbox"
      returnTo="/marketing/studio"
      returnLabel="Return to HubSpot"
      testId="off-platform-inbox"
    >
      <div className="grid min-h-full grid-cols-[190px_290px_minmax(0,1fr)] bg-white">
        <aside className="border-r border-[#e2e8f0] bg-[#f8fafc] p-3">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-[7px] bg-[#1e293b] text-[12px] font-bold text-white">K</span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-[#0f172a]">Kestrel Mail</p>
              <p className="truncate text-[11px] text-[#64748b]">{contact?.email}</p>
            </div>
          </div>
          <ul className="mt-4 space-y-1 text-[13px]">
            <li className="flex items-center justify-between rounded-[6px] bg-[#e2e8f0] px-2.5 py-1.5 font-semibold text-[#0f172a]">
              <span>Inbox</span>
              <span className="rounded-full bg-[#2563eb] px-1.5 py-0.5 text-[10.5px] font-bold text-white">1</span>
            </li>
            <li className="px-2.5 py-1.5 text-[#64748b]">Starred</li>
            <li className="px-2.5 py-1.5 text-[#64748b]">Sent</li>
            <li className="px-2.5 py-1.5 text-[#64748b]">Archive</li>
          </ul>
        </aside>

        <section className="border-r border-[#e2e8f0] bg-white">
          <p className="border-b border-[#e2e8f0] px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">Primary Inbox</p>
          <ul className="divide-y divide-[#eef2f6]">
            <li className="border-l-4 border-[#2563eb] bg-[#eff6ff] px-3.5 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-bold text-[#0f172a]">{marketer?.name ?? "Maya Chen"} · Lumenstack</span>
                <span className="text-[11px] font-semibold text-[#2563eb]">Just now</span>
              </div>
              <p className="mt-0.5 truncate text-[12.5px] font-semibold text-[#0f172a]">{primary.subject}</p>
              <p className="mt-0.5 truncate text-[12px] text-[#475569]">{primary.previewText}</p>
            </li>
            {NOISE_EMAILS.map((m) => (
              <li key={m.id} className="px-3.5 py-3 text-[#475569]">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[12.5px] font-semibold">{m.from}</span>
                  <span className="shrink-0 text-[11px] text-[#94a3b8]">{m.time}</span>
                </div>
                <p className="mt-0.5 truncate text-[12.5px]">{m.subject}</p>
                <p className="mt-0.5 truncate text-[11.5px] text-[#94a3b8]">{m.preview}</p>
              </li>
            ))}
          </ul>
        </section>

        <article className="px-8 py-6">
          <div className="flex items-start justify-between gap-4 border-b border-[#e2e8f0] pb-4">
            <div>
              <h1 className="text-[20px] font-bold leading-snug text-[#0f172a]">{primary.subject}</h1>
              <div className="mt-2 flex items-center gap-2.5 text-[12.5px] text-[#475569]">
                <Avatar name={marketer?.name ?? "Maya Chen"} color={marketer?.color ?? "#c23b5e"} size={30} />
                <div>
                  <p className="font-semibold text-[#0f172a]">
                    {marketer?.name ?? "Maya Chen"} <span className="font-normal text-[#64748b]">&lt;{marketer?.email}&gt;</span>
                  </p>
                  <p className="text-[12px] text-[#64748b]">To: Elena Morales &lt;{contact?.email}&gt;</p>
                </div>
              </div>
            </div>
            <Tag tone="blue">Tailored by role & company</Tag>
          </div>

          <div className="mt-5 max-w-[660px] text-[14.5px] leading-relaxed text-[#1e293b]">
            <p className="whitespace-pre-line">{primary.body}</p>
            <div className="mt-6 rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] p-5">
              <p className="text-[11.5px] font-semibold uppercase tracking-wide text-[#64748b]">Featured Resource · 18-page PDF</p>
              <p className="mt-1 text-[16px] font-bold text-[#0f172a]">{config.sourceAsset.title}</p>
              <p className="mt-1 text-[13px] text-[#475569]">{config.sourceAsset.subtitle}</p>
              <Button
                variant="primary"
                className="mt-4"
                data-testid="ms-email-cta"
                onClick={() => {
                  dispatch({ t: "ms.clickEmail", at: nowMs() });
                  navigate("/marketing/off-platform/landing");
                }}
              >
                {primary.ctaLabel} <Icon name="arrowRight" size={15} />
              </Button>
            </div>
          </div>
        </article>
      </div>
    </OffPlatformChrome>
  );
}

/**
 * Step 10 (Off-platform): Buyer-facing Lumenstack landing page where Elena submits the form to download the ebook.
 */
export function OffPlatformLandingPage() {
  const { pack, world, dispatch, navigate } = useShell();
  const config = pack.demos.marketingStudio;
  const contact = world.contacts.find((c) => c.id === config?.primaryContactId);
  const [firstName, setFirstName] = useState(contact?.firstName ?? "Elena");
  const [lastName, setLastName] = useState(contact?.lastName ?? "Morales");
  const [email, setEmail] = useState(contact?.email ?? "elena.morales@kestrelops.example");
  const [companyName, setCompanyName] = useState("Kestrel Ops");
  const [title, setTitle] = useState(contact?.title ?? "VP of Revenue Operations");

  if (!config) return null;
  const lp = config.landingPage;
  const converted = world.ms.converted;

  return (
    <OffPlatformChrome
      badge="Buyer landing page — outside HubSpot"
      windowTitle="Lumenstack Resources"
      address={`https://${lp.url}`}
      returnTo={converted ? `/contacts/${config.primaryContactId}` : "/marketing/studio"}
      returnLabel="Return to HubSpot"
      testId="off-platform-landing"
    >
      <div className="min-h-full bg-[#f4f7fa]">
        <header className="flex items-center justify-between bg-[#16324a] px-10 py-4 text-white">
          <p className="text-[18px] font-bold tracking-tight">Lumenstack</p>
          <p className="flex gap-6 text-[13px] text-white/75">
            <span>Product</span>
            <span>Benchmarks</span>
            <span>Customers</span>
            <span className="font-semibold text-white">Resources</span>
          </p>
        </header>

        <div className="mx-auto grid max-w-[1040px] grid-cols-[1fr_430px] gap-10 px-10 py-10">
          <div>
            <span className="inline-block rounded-full bg-[#e0f2fe] px-3 py-1 text-[11.5px] font-bold tracking-wide text-[#0369a1]">
              {lp.eyebrow}
            </span>
            <h1 className="mt-3 text-[32px] font-bold leading-tight tracking-tight text-[#0f172a]">{lp.headline}</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-[#475569]">{lp.subheadline}</p>

            <ul className="mt-6 space-y-2.5 text-[14px] text-[#1e293b]">
              {lp.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2.5">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#dcfce7] text-[#15803d]">
                    <Icon name="check" size={12} strokeWidth={2.6} />
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="mt-7 flex items-center gap-4 rounded-[12px] border border-[#cbd5e1] bg-white p-4">
              <div className="flex h-20 w-16 shrink-0 flex-col justify-between rounded-[6px] bg-gradient-to-br from-[#16324a] to-[#0b6e6e] p-2 text-white">
                <span className="text-[8px] font-bold uppercase tracking-wider text-white/75">2027 Guide</span>
                <span className="text-[9px] font-bold leading-tight">SaaS Analytics</span>
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-[#0f172a]">{config.sourceAsset.title}</p>
                <p className="mt-0.5 text-[12.5px] text-[#475569]">
                  {config.sourceAsset.format} · {config.sourceAsset.fileSize} · Instant PDF download
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[12px] border border-[#cbd5e1] bg-white p-6 shadow-[0_8px_28px_rgba(15,23,42,0.08)]">
            {converted ? (
              <div className="hs-pop" data-testid="ms-landing-submitted">
                <p className="flex items-center gap-2 text-[18px] font-bold text-[#0f172a]">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#15803d] text-white">
                    <Icon name="check" size={16} strokeWidth={2.4} />
                  </span>
                  {lp.confirmationHeadline}
                </p>
                <p className="mt-2 text-[13.5px] text-[#475569]">{lp.confirmationBody}</p>
                <div className="mt-4 rounded-[8px] border border-line-soft bg-[#f8fafc] p-4">
                  <p className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Meanwhile, in HubSpot</p>
                  <ul className="mt-2 space-y-1.5 text-[12.5px]">
                    {[
                      "Email open, click, and form download logged on Elena's timeline",
                      "Lifecycle stage moved: Lead -> Marketing Qualified Lead",
                      "Jordan Avery notified in HubSpot & #sales-west-icp",
                      "High-priority follow-up task created (due in 2 hours)",
                    ].map((line) => (
                      <li key={line} className="flex gap-2">
                        <Icon name="check" size={14} className="mt-0.5 shrink-0 text-[#0b5b2b]" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant="primary"
                    className="mt-4 w-full"
                    data-testid="ms-back-to-contact"
                    onClick={() => navigate(`/contacts/${config.primaryContactId}`)}
                  >
                    View converted contact in HubSpot <Icon name="arrowRight" size={15} />
                  </Button>
                </div>
              </div>
            ) : (
              <form
                data-testid="ms-landing-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  dispatch({ t: "ms.convert", at: nowMs() });
                }}
              >
                <h2 className="text-[18px] font-bold text-[#0f172a]">{lp.formTitle}</h2>
                <p className="mt-1 text-[12.5px] text-[#64748b]">Progressive fields pre-filled for known ICP visitors.</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <label className="block text-[12.5px]">
                    <span className="font-semibold text-[#1e293b]">First name</span>
                    <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1 h-9 w-full rounded-[6px] border border-[#cbd5e1] px-3 text-[13.5px]" />
                  </label>
                  <label className="block text-[12.5px]">
                    <span className="font-semibold text-[#1e293b]">Last name</span>
                    <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1 h-9 w-full rounded-[6px] border border-[#cbd5e1] px-3 text-[13.5px]" />
                  </label>
                  <label className="col-span-2 block text-[12.5px]">
                    <span className="font-semibold text-[#1e293b]">Work email</span>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-9 w-full rounded-[6px] border border-[#cbd5e1] px-3 text-[13.5px]" />
                  </label>
                  <label className="block text-[12.5px]">
                    <span className="font-semibold text-[#1e293b]">Company</span>
                    <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1 h-9 w-full rounded-[6px] border border-[#cbd5e1] px-3 text-[13.5px]" />
                  </label>
                  <label className="block text-[12.5px]">
                    <span className="font-semibold text-[#1e293b]">Job title</span>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 h-9 w-full rounded-[6px] border border-[#cbd5e1] px-3 text-[13.5px]" />
                  </label>
                </div>
                <Button type="submit" variant="dark" className="mt-5 w-full !bg-[#16324a] hover:!bg-[#0f2436]" data-testid="ms-landing-submit">
                  <Icon name="download" size={15} /> {lp.submitLabel}
                </Button>
                <p className="mt-2.5 text-center text-[11.5px] text-[#64748b]">Instant PDF access · Tracked back to HubSpot Marketing Studio</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </OffPlatformChrome>
  );
}

/**
 * Step 13 (Off-platform): Rep's follow-up email arrives in Elena's inbox and she books a 20-min meeting.
 */
export function OffPlatformMeetingPage() {
  const { pack, world, dispatch, navigate } = useShell();
  const config = pack.demos.marketingStudio;
  if (!config) return null;

  const rep = pack.personas.find((p) => p.id === config.repId);
  const contact = world.contacts.find((c) => c.id === config.primaryContactId);
  const selectedSlotId = world.ms.meetingSlotId ?? config.repFollowUp.defaultSlotId;
  const selectedSlot = config.repFollowUp.meetingSlots.find((s) => s.id === selectedSlotId) ?? config.repFollowUp.meetingSlots[0];
  const booked = world.ms.meetingBooked;

  return (
    <OffPlatformChrome
      badge="Elena Morales's inbox & meeting booking — outside HubSpot"
      windowTitle="Kestrel Mail · Follow-up & Scheduler"
      address="mail.kestrelops.example/inbox/thread/jordan-avery"
      returnTo={booked && world.ms.dealId ? `/deals/${world.ms.dealId}` : "/tasks"}
      returnLabel="Return to HubSpot"
      testId="off-platform-meeting"
    >
      <div className="grid min-h-full grid-cols-[minmax(0,1fr)_410px] bg-white">
        <article className="border-r border-[#e2e8f0] px-8 py-6">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#dbeafe] px-2.5 py-0.5 text-[11px] font-bold text-[#1d4ed8]">New email</span>
            <span className="text-[12px] text-[#64748b]">Just now · From assigned Lumenstack AE</span>
          </div>
          <h1 className="mt-2 text-[20px] font-bold text-[#0f172a]">{config.repFollowUp.emailSubject}</h1>
          <div className="mt-3 flex items-center gap-2.5 border-b border-[#e2e8f0] pb-4 text-[12.5px]">
            <Avatar name={rep?.name ?? "Jordan Avery"} color={rep?.color ?? "#0b6e6e"} size={32} />
            <div>
              <p className="font-semibold text-[#0f172a]">
                {rep?.name ?? "Jordan Avery"} <span className="font-normal text-[#64748b]">&lt;{rep?.email}&gt;</span>
              </p>
              <p className="text-[#64748b]">To: Elena Morales &lt;{contact?.email}&gt;</p>
            </div>
          </div>

          <p className="mt-5 whitespace-pre-line text-[14.5px] leading-relaxed text-[#1e293b]">{config.repFollowUp.emailBody}</p>
        </article>

        <aside className="bg-[#f8fafc] p-6">
          <div className="rounded-[12px] border border-[#cbd5e1] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <Avatar name={rep?.name ?? "Jordan Avery"} color={rep?.color ?? "#0b6e6e"} size={38} />
              <div className="min-w-0">
                <p className="text-[14.5px] font-bold text-[#0f172a]">{config.repFollowUp.meetingTitle}</p>
                <p className="text-[12px] text-[#64748b]">{config.repFollowUp.meetingDuration}</p>
              </div>
            </div>

            {booked ? (
              <div className="hs-pop mt-5 rounded-[10px] border border-[#bfe3cd] bg-[#f0faf4] p-4" data-testid="ms-meeting-confirmed">
                <p className="flex items-center gap-2 text-[15px] font-bold text-[#0b5b2b]">
                  <Icon name="check" size={17} strokeWidth={2.5} /> Meeting confirmed
                </p>
                <p className="mt-1.5 text-[13.5px] font-semibold text-[#0f172a]">
                  {selectedSlot.day} · {selectedSlot.time} {selectedSlot.tz}
                </p>
                <p className="mt-1 text-[12.5px] text-[#475569]">
                  Calendar invite sent to Elena Morales & Jordan Avery. HubSpot logged the meeting and created the Kestrel Ops deal ($98,400).
                </p>
                <Button
                  variant="primary"
                  className="mt-4 w-full"
                  data-testid="ms-back-to-deal"
                  onClick={() => navigate(`/deals/${world.ms.dealId ?? config.deal.id}`)}
                >
                  View created deal in HubSpot <Icon name="arrowRight" size={15} />
                </Button>
              </div>
            ) : (
              <div className="mt-5">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">Pick a time with Jordan Avery</p>
                <div className="mt-2.5 space-y-2">
                  {config.repFollowUp.meetingSlots.map((slot) => {
                    const active = slot.id === selectedSlotId;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        data-testid={`ms-slot-${slot.id}`}
                        onClick={() => dispatch({ t: "ms.selectSlot", slotId: slot.id })}
                        className={cx(
                          "flex w-full items-center justify-between rounded-[8px] border px-3.5 py-2.5 text-left text-[13.5px] transition-colors",
                          active ? "border-hs-orange bg-[#fff7f2] font-semibold text-[#0f172a]" : "border-[#cbd5e1] bg-white hover:border-[#0f172a]",
                        )}
                      >
                        <span>{slot.day}</span>
                        <span>
                          {slot.time} {slot.tz}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <Button
                  variant="primary"
                  icon="meeting"
                  className="mt-4 w-full"
                  data-testid="ms-confirm-meeting"
                  onClick={() => dispatch({ t: "ms.bookMeeting", slotId: selectedSlotId, at: nowMs() })}
                >
                  Confirm 20-min meeting
                </Button>
                <p className="mt-2 text-center text-[11.5px] text-[#64748b]">Automatically logs meeting & opens a Discovery deal in HubSpot</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </OffPlatformChrome>
  );
}
