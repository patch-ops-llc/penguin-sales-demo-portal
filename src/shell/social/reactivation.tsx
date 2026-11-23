"use client";

import { useState } from "react";
import { nowMs } from "@/lib/format";
import { useShell } from "@/store/store";
import { Ext } from "../ext";
import { num, relative } from "../format";
import { Icon } from "../icons";
import { A, Avatar, Button, Card, colorFor, cx, Empty, LineTabs, Tag } from "../ui";
import { OffPlatformFrame } from "./off-platform";

/**
 * HubSpot Marketing > Patient Reactivation workspace (H4):
 * - /reactivation/segment (Steps 1 & 5: EHR Annual-Visit Eligibility Sync [Penguin] + native Overdue > 12 mo dynamic segment)
 * - /reactivation/emails (Step 2: native 3-touch reminder email series preview & approval)
 *
 * Penguin marker rule:
 * ONLY the custom EHR Annual-Visit Eligibility Sync card carries `<Ext id="ehr-eligibility-sync">`.
 * Dynamic segment, reminder email series, auto-removal confirmation, and timeline preview have ZERO Penguin markers.
 */
export function PatientReactivationPage({ sub = "segment" }: { sub?: string }) {
  const { pack, world, dispatch, navigate } = useShell();
  const cfg = pack.demos.patientReactivation;
  const tab = sub === "emails" ? "emails" : "segment";

  const [locationFilter, setLocationFilter] = useState("all");
  const [selectedTouchId, setSelectedTouchId] = useState(cfg?.touches[0]?.id ?? "touch-1");

  if (!cfg) {
    return (
      <div className="p-10">
        <Card>
          <Empty title="Patient reactivation is not part of this vertical's demos">
            <A to="/deals" className="hs-link">
              Go to deals
            </A>
          </Empty>
        </Card>
      </div>
    );
  }

  const booked = world.pr.booked;
  const activeSlot = cfg.offPlatform.slots.find((s) => s.id === world.pr.bookedSlotId) ?? cfg.offPlatform.slots[0];
  const heroPatient = cfg.patients.find((p) => p.hero) ?? cfg.patients[0];
  const activePatients = cfg.patients.filter((p) => !(booked && p.hero));
  const filteredPatients = activePatients.filter((p) => locationFilter === "all" || p.clinicLocation === locationFilter);
  const liveTotalCount = cfg.totalOverdueCount - (booked ? 1 : 0);
  const activeTouch = cfg.touches.find((t) => t.id === selectedTouchId) ?? cfg.touches[0];

  const heroTimeline = world.activities
    .filter((a) => a.contactIds?.includes(cfg.heroContactId))
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
    .slice(0, 3);

  const openEmails = () => {
    dispatch({ t: "pr.reviewSegment" });
    navigate("/reactivation/emails");
  };

  const approveSeries = () => {
    dispatch({ t: "pr.approveSeries", at: nowMs() });
  };

  const openReport = () => {
    dispatch({ t: "pr.verifyRemoval" });
    navigate(`/reports/${cfg.reportId}`);
  };

  return (
    <div className="min-h-full px-6 py-5" data-testid="reactivation-page">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">Marketing &rsaquo; Patient Reactivation</p>
          <h1 className="mt-0.5 text-[24px] font-semibold tracking-tight">{cfg.segmentName}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tag tone="teal">Zero-PHI Token Mode</Tag>
          <Tag tone={booked ? "green" : "blue"}>{num(liveTotalCount)} active in segment</Tag>
        </div>
      </div>

      <LineTabs
        className="mt-4"
        value={tab}
        onChange={(next) => navigate(`/reactivation/${next}`)}
        tabs={[
          { id: "segment", label: `Overdue Segment (${num(liveTotalCount)})`, testId: "pr-tab-segment" },
          { id: "emails", label: `3-Touch Reminder Series`, testId: "pr-tab-emails" },
        ]}
      />

      {tab === "segment" ? (
        <div className="mt-4 space-y-4" data-testid="pr-segment-view">
          {/* Step 5 native auto-removal banner (ZERO Penguin markers) */}
          {booked ? (
            <div className="rounded-[10px] border border-[#bfe3cd] bg-[#f0faf4] p-4" data-testid="pr-auto-removed-banner">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-[15px] font-semibold text-[#0b5b2b]">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0b7a4b] text-white">
                      <Icon name="check" size={14} strokeWidth={2.4} />
                    </span>
                    Automatic segment removal completed: {heroPatient.name} removed from &ldquo;{cfg.segmentName}&rdquo;
                  </p>
                  <p className="mt-1 text-[13px] text-ink-muted">
                    Booked {cfg.offPlatform.visitTypeLabel} at <strong>{cfg.offPlatform.clinicLocation}</strong> ({activeSlot.day} &middot; {activeSlot.time}{" "}
                    {activeSlot.tz}). Active count dropped from {num(cfg.totalOverdueCount)} to{" "}
                    <strong data-testid="pr-active-count">{num(liveTotalCount)}</strong>; Touches 2 &amp; 3 automatically suppressed.
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <A
                    to={`/contacts/${cfg.heroContactId}`}
                    data-testid="pr-view-contact"
                    className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-line bg-white px-3 text-[12.5px] font-semibold text-ink hover:bg-[#f5f5f5]"
                  >
                    Inspect contact timeline
                  </A>
                  <Button variant="primary" size="sm" data-testid="pr-go-report" onClick={openReport}>
                    Open reactivation report <Icon name="arrowRight" size={14} />
                  </Button>
                </div>
              </div>

              {heroTimeline.length > 0 ? (
                <div className="mt-3 grid gap-2 border-t border-[#cde9d7] pt-3 md:grid-cols-3" data-testid="pr-timeline-summary">
                  {heroTimeline.map((item) => (
                    <div key={item.id} className="rounded-[8px] border border-[#d6ecde] bg-white px-3 py-2 text-[12px]">
                      <p className="font-semibold text-ink">{item.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-ink-muted">{item.body}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* ONLY Penguin marker in Patient Reactivation: Custom EHR Annual-Visit Eligibility Sync */}
          <Ext id="ehr-eligibility-sync">
            <Card
              title="EHR Annual-Visit Eligibility Sync"
              right={<Tag tone="purple">{cfg.ehrSync.systemName} &middot; Non-PHI</Tag>}
              testId="pr-ehr-sync-card"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-[13.5px] text-ink">
                    Synced <strong>{num(cfg.ehrSync.syncedCount)}</strong> overdue eligibility tokens across{" "}
                    <strong>{cfg.ehrSync.locationsCount} clinic locations</strong> &middot; Updated {relative(cfg.ehrSync.syncedAt).toLowerCase()}.
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Synced non-PHI tokens:</span>
                    {cfg.ehrSync.nonPhiFields.map((field) => (
                      <code key={field} className="rounded bg-[#f3effc] px-2 py-0.5 text-[11.5px] font-medium text-penguin-strong">
                        {field}
                      </code>
                    ))}
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-[8px] border border-[#b9e1dc] bg-[#f1faf8] px-3.5 py-2.5 text-[12px] text-[#00514f] max-w-[360px]">
                  <Icon name="shield" size={15} className="mt-0.5 shrink-0" />
                  <span>{cfg.ehrSync.guardrailNote}</span>
                </div>
              </div>
            </Card>
          </Ext>

          {/* Native HubSpot Dynamic Segment (ZERO Penguin markers) */}
          <Card
            title="Dynamic Active List Criteria & Members"
            right={
              !booked ? (
                <Button variant="primary" size="sm" data-testid="pr-go-emails" onClick={openEmails}>
                  Build 3-touch reminder series <Icon name="arrowRight" size={14} />
                </Button>
              ) : (
                <Tag tone="green">Live dynamic list</Tag>
              )
            }
            pad={false}
            testId="pr-segment-card"
          >
            <div className="flex flex-wrap items-center gap-2 border-y border-line-soft bg-[#fafafa] px-5 py-3">
              <span className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">List filters:</span>
              {cfg.segmentCriteria.map((rule) => (
                <span key={rule} className="rounded-full border border-line bg-white px-2.5 py-0.5 text-[12px] font-medium text-ink">
                  {rule}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-5 py-2.5">
              <div className="flex flex-wrap items-center gap-1.5" data-testid="pr-location-filters">
                <button
                  type="button"
                  onClick={() => setLocationFilter("all")}
                  className={cx(
                    "h-7 rounded-full px-3 text-[12px] font-semibold",
                    locationFilter === "all" ? "bg-ink text-white" : "bg-hs-bg/75 text-ink hover:bg-hs-bg",
                  )}
                >
                  All locations ({activePatients.length} sample)
                </button>
                {cfg.locations.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setLocationFilter(loc)}
                    className={cx(
                      "h-7 rounded-full px-3 text-[12px] font-semibold",
                      locationFilter === loc ? "bg-ink text-white" : "bg-hs-bg/75 text-ink hover:bg-hs-bg",
                    )}
                  >
                    {loc}
                  </button>
                ))}
              </div>
              <span className="text-[12px] text-ink-muted">Showing {filteredPatients.length} of {num(liveTotalCount)} overdue members</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[13px]" data-testid="pr-segment-table">
                <thead>
                  <tr className="border-b border-line-soft bg-[#fafafa] text-left text-[11.5px] uppercase tracking-wide text-ink-muted">
                    <th className="px-5 py-2.5 font-semibold">Contact (fictional)</th>
                    <th className="px-4 py-2.5 font-semibold">Preferred clinic</th>
                    <th className="px-4 py-2.5 font-semibold">Last visit bucket</th>
                    <th className="px-4 py-2.5 font-semibold">Eligibility token</th>
                    <th className="px-4 py-2.5 font-semibold">Reminder opt-in</th>
                    <th className="px-5 py-2.5 font-semibold">Segment status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((p) => (
                    <tr key={p.id} data-testid={`pr-row-${p.id}`} className="border-b border-line-soft last:border-b-0">
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={p.name} color={colorFor(p.id)} size={26} />
                          <div>
                            {p.contactId ? (
                              <A to={`/contacts/${p.contactId}`} className="hs-link font-semibold">
                                {p.name}
                              </A>
                            ) : (
                              <span className="font-semibold">{p.name}</span>
                            )}
                            <span className="block text-[11.5px] text-ink-muted">{p.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">{p.clinicLocation}</td>
                      <td className="px-4 py-2.5 tabular-nums text-ink-muted">{p.lastVisitBucket}</td>
                      <td className="px-4 py-2.5">
                        <Tag tone="amber">{p.overdueFlag}</Tag>
                      </td>
                      <td className="px-4 py-2.5 text-ink-muted">{p.optInChannel}</td>
                      <td className="px-5 py-2.5">
                        <Tag tone="blue">In dynamic segment</Tag>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        /* Step 2: Native 3-Touch Reminder Email Series Preview & Approval (ZERO Penguin markers) */
        <div className="mt-4 space-y-4" data-testid="pr-emails-view">
          {world.pr.seriesApproved ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#bfe3cd] bg-[#f0faf4] px-4 py-3" data-testid="pr-series-approved">
              <div className="flex items-center gap-2.5 text-[13.5px]">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0b7a4b] text-white">
                  <Icon name="check" size={14} strokeWidth={2.4} />
                </span>
                <span>
                  <strong>3-touch reminder series approved and active.</strong> Touch 1 sent to {num(cfg.totalOverdueCount)} contacts in &ldquo;{cfg.segmentName}&rdquo;.
                </span>
              </div>
              <Button variant="primary" size="sm" data-testid="pr-open-inbox" onClick={() => navigate("/offplatform/patient-booking")}>
                Preview patient reminder inbox <Icon name="arrowRight" size={14} />
              </Button>
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
            <Card title="3-Touch Reminder Cadence" pad={false}>
              <div className="divide-y divide-line-soft border-t border-line-soft">
                {cfg.touches.map((touch) => {
                  const selected = touch.id === activeTouch.id;
                  return (
                    <button
                      key={touch.id}
                      type="button"
                      data-testid={`pr-touch-${touch.touchNumber}`}
                      onClick={() => setSelectedTouchId(touch.id)}
                      className={cx(
                        "block w-full px-4 py-3.5 text-left transition-colors",
                        selected ? "border-l-[3px] border-l-hs-orange bg-[#fff7f2]" : "hover:bg-[#fafafa]",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] font-bold uppercase tracking-wide text-ink-muted">
                          Touch {touch.touchNumber} &middot; {touch.dayLabel}
                        </span>
                        <Tag tone={world.pr.seriesApproved ? "green" : "amber"}>{world.pr.seriesApproved ? "Approved" : "Ready"}</Tag>
                      </div>
                      <p className="mt-1 text-[13.5px] font-semibold leading-snug text-ink">{touch.subject}</p>
                      <p className="mt-1 text-[12px] text-ink-muted">{touch.condition}</p>
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-line-soft bg-[#fafafa] p-4 text-[12.5px]">
                <p className="font-semibold text-ink">Goal &amp; auto-suppression rule</p>
                <p className="mt-1 text-ink-muted">
                  When a contact books an annual visit, HubSpot automatically removes them from <strong>{cfg.segmentName}</strong> and skips remaining touches.
                </p>
              </div>
            </Card>

            <Card
              title={`Touch ${activeTouch.touchNumber} Preview (${activeTouch.dayLabel})`}
              right={<Tag tone="teal">HIPAA-Safe Copy Verified</Tag>}
              testId="pr-email-preview"
            >
              <dl className="space-y-1.5 border-b border-line-soft pb-3 text-[13px]">
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 text-ink-muted">Audience</dt>
                  <dd className="font-medium">
                    {cfg.segmentName} ({num(liveTotalCount)} contacts)
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 text-ink-muted">Subject</dt>
                  <dd className="font-semibold" data-testid="pr-preview-subject">
                    {activeTouch.subject}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 text-ink-muted">Preview</dt>
                  <dd className="text-ink-muted">{activeTouch.previewText}</dd>
                </div>
              </dl>

              <div className="mt-4 rounded-[10px] border border-line bg-[#fafbfd] p-5">
                <div className="flex items-center justify-between border-b border-line-soft pb-3">
                  <span className="text-[14px] font-bold text-[#0f3d56]">Crestline Specialty Clinics</span>
                  <span className="text-[11.5px] text-ink-muted">Annual Wellness Reminder</span>
                </div>
                <div className="mt-4 whitespace-pre-line text-[13.5px] leading-relaxed text-[#243447]">{activeTouch.body}</div>
                <div className="mt-5">
                  <span className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#0f3d56] px-4 py-2 text-[13px] font-semibold text-white">
                    {activeTouch.ctaLabel} <Icon name="arrowRight" size={14} />
                  </span>
                </div>
                <p className="mt-4 border-t border-line-soft pt-3 text-[11.5px] text-ink-muted">{cfg.hipaaNotice}</p>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <span className="text-[12.5px] text-ink-muted">Personalization uses only first name and preferred clinic location (zero clinical PHI).</span>
                {!world.pr.seriesApproved ? (
                  <Button variant="primary" data-testid="pr-approve-series" onClick={approveSeries}>
                    <Icon name="check" size={15} /> Approve &amp; activate series
                  </Button>
                ) : (
                  <Button variant="primary" data-testid="pr-open-inbox-footer" onClick={() => navigate("/offplatform/patient-booking")}>
                    Open patient reminder inbox <Icon name="arrowRight" size={14} />
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Off-platform Patient Reminder Inbox (Step 3) & Clinic Annual-Visit Booking (Step 4).
 * ZERO Penguin markers.
 */
export function PatientBookingOffPlatformPage() {
  const { pack, world, dispatch, navigate } = useShell();
  const cfg = pack.demos.patientReactivation;
  const [selectedSlotId, setSelectedSlotId] = useState(cfg?.offPlatform.defaultSlotId ?? "slot-1");

  if (!cfg) return null;
  const op = cfg.offPlatform;
  const touch1 = cfg.touches[0];
  const bookingOpen = world.pr.bookingOpened;
  const booked = world.pr.booked;
  const activeSlotId = booked && world.pr.bookedSlotId ? world.pr.bookedSlotId : selectedSlotId;
  const activeSlot = op.slots.find((s) => s.id === activeSlotId) ?? op.slots[0];

  const personalizedBody = touch1.body
    .replaceAll("{{contact.firstname}}", op.patientFirstName)
    .replaceAll("{{contact.preferred_clinic}}", op.clinicLocation);
  const personalizedSubject = touch1.subject.replaceAll("{{contact.firstname}}", op.patientFirstName);

  return (
    <OffPlatformFrame
      channelLabel={bookingOpen ? "Clinic Online Scheduling" : "Patient Email Inbox"}
      url={bookingOpen ? op.bookingUrl : `https://mail.patientmail.example/inbox/${op.patientFirstName.toLowerCase()}`}
      backTo="/reactivation/segment"
      backLabel={booked ? "Verify segment removal in HubSpot" : "Back to Reactivation"}
      testId="offplatform-patient-booking"
      action={
        booked ? (
          <Button variant="primary" size="sm" data-testid="pr-verify-segment-top" onClick={() => navigate("/reactivation/segment")}>
            Verify segment removal <Icon name="arrowRight" size={14} />
          </Button>
        ) : undefined
      }
    >
      {!bookingOpen ? (
        /* Step 3: Patient receives Touch 1 reminder email in personal inbox */
        <div className="min-h-full bg-[#f4f6f9] p-6" data-testid="pr-patient-inbox">
          <div className="mx-auto max-w-[820px] overflow-hidden rounded-[12px] border border-[#d6dde6] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-line-soft bg-[#0f3d56] px-5 py-3 text-white">
              <div className="flex items-center gap-2.5">
                <Icon name="email" size={16} />
                <span className="text-[14px] font-semibold">Patient Mail</span>
                <span className="text-[12px] text-white/75">&middot; {op.inboxEmail}</span>
              </div>
              <Tag tone="blue">Touch 1 of 3</Tag>
            </div>

            <div className="border-b border-line-soft bg-[#fafbfd] px-6 py-4">
              <h1 className="text-[19px] font-semibold text-ink" data-testid="pr-inbox-subject">
                {personalizedSubject}
              </h1>
              <p className="mt-1 text-[12.5px] text-ink-muted">
                From: <strong className="text-ink">{op.senderName}</strong> &lt;{op.senderEmail}&gt; &middot; To: {op.patientFullName} &lt;{op.inboxEmail}&gt;
              </p>
            </div>

            <div className="p-6">
              <div className="rounded-[10px] border border-[#dbe6ee] bg-white p-6 shadow-[0_2px_10px_rgba(15,61,86,0.06)]">
                <div className="flex items-center justify-between border-b border-line-soft pb-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#0f3d56] text-[12px] font-bold text-white">CS</span>
                    <div>
                      <p className="text-[14px] font-bold text-[#0f3d56]">Crestline Specialty Clinics</p>
                      <p className="text-[11.5px] text-ink-muted">{op.clinicLocation}</p>
                    </div>
                  </div>
                  <Tag tone="teal">Annual Wellness</Tag>
                </div>

                <div className="mt-4 whitespace-pre-line text-[14px] leading-relaxed text-[#243447]">{personalizedBody}</div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Button variant="primary" data-testid="pr-open-scheduler" onClick={() => dispatch({ t: "pr.openBooking" })}>
                    {touch1.ctaLabel} <Icon name="arrowRight" size={15} />
                  </Button>
                  <span className="text-[12px] text-ink-muted">Takes under 30 seconds &middot; No login required</span>
                </div>

                <p className="mt-5 border-t border-line-soft pt-3 text-[11.5px] text-ink-muted">{cfg.hipaaNotice}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Step 4: Patient books annual wellness visit online */
        <div className="min-h-full bg-[#f4f7fa] p-6" data-testid="pr-clinic-scheduler">
          <div className="mx-auto max-w-[880px] overflow-hidden rounded-[12px] border border-[#d6dde6] bg-white shadow-sm">
            <div className="flex items-center justify-between bg-[#0f3d56] px-6 py-4 text-white">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#2f9d8f] text-[12px] font-bold">CS</span>
                <div>
                  <p className="text-[16px] font-bold leading-tight">Crestline Specialty Clinics &middot; Online Scheduling</p>
                  <p className="text-[12px] text-white/80">
                    {op.clinicLocation} &middot; {op.clinicAddress}
                  </p>
                </div>
              </div>
              <Tag tone={booked ? "green" : "teal"}>{booked ? "Visit Confirmed" : op.visitTypeLabel}</Tag>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-[1fr_340px]">
              <div className="space-y-4">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">Patient &amp; Clinic Details (Non-PHI)</p>
                  <h2 className="mt-1 text-[20px] font-bold text-[#0f3d56]">Schedule Your Annual Wellness Visit</h2>
                  <p className="mt-1 text-[13.5px] text-ink-muted">
                    Welcome back, <strong>{op.patientFullName}</strong>. Pick a convenient time at <strong>{op.clinicLocation}</strong>.
                  </p>
                </div>

                {booked ? (
                  <div className="hs-pop space-y-4" data-testid="pr-booking-confirmed">
                    <div className="rounded-[10px] border border-[#bfe3cd] bg-[#f0faf4] p-4">
                      <p className="flex items-center gap-2 text-[16px] font-bold text-[#0b5b2b]">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0b7a4b] text-white">
                          <Icon name="check" size={14} strokeWidth={2.4} />
                        </span>
                        Annual wellness visit confirmed
                      </p>
                      <p className="mt-2 text-[14px] font-semibold text-ink">
                        {activeSlot.day} &middot; {activeSlot.time} {activeSlot.tz}
                      </p>
                      <p className="mt-0.5 text-[13px] text-ink-muted">
                        {op.clinicLocation} &middot; {activeSlot.providerRole}
                      </p>
                    </div>

                    <div className="rounded-[8px] border border-line-soft bg-[#fafafa] p-4 text-[13px]">
                      <p className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">What updated in HubSpot</p>
                      <ul className="mt-2 space-y-1.5">
                        <li className="flex items-start gap-2">
                          <Icon name="check" size={14} className="mt-0.5 shrink-0 text-[#0b5b2b]" />
                          Contact updated: Annual visit status &rarr; Scheduled — Annual Wellness
                        </li>
                        <li className="flex items-start gap-2">
                          <Icon name="check" size={14} className="mt-0.5 shrink-0 text-[#0b5b2b]" />
                          Automatically removed from &ldquo;{cfg.segmentName}&rdquo; dynamic segment
                        </li>
                        <li className="flex items-start gap-2">
                          <Icon name="check" size={14} className="mt-0.5 shrink-0 text-[#0b5b2b]" />
                          Touches 2 &amp; 3 suppressed so no duplicate reminders go out
                        </li>
                      </ul>
                    </div>

                    <Button variant="primary" data-testid="pr-verify-segment" onClick={() => navigate("/reactivation/segment")}>
                      Verify segment removal in HubSpot <Icon name="arrowRight" size={15} />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2" role="radiogroup" aria-label="Annual wellness visit slots">
                      {op.slots.map((slot) => {
                        const selected = slot.id === activeSlot.id;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            data-testid={`pr-slot-${slot.id}`}
                            aria-pressed={selected}
                            onClick={() => setSelectedSlotId(slot.id)}
                            className={cx(
                              "flex w-full items-center justify-between rounded-[8px] border px-4 py-3 text-left transition-colors",
                              selected ? "border-[#0f3d56] bg-[#eef5f9] ring-1 ring-[#0f3d56]" : "border-line hover:bg-[#fafafa]",
                            )}
                          >
                            <div>
                              <p className="text-[13.5px] font-semibold text-ink">{slot.day}</p>
                              <p className="text-[12px] text-ink-muted">{slot.providerRole}</p>
                            </div>
                            <span className="text-[13.5px] font-semibold tabular-nums text-[#0f3d56]">
                              {slot.time} {slot.tz}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <Button
                      variant="primary"
                      data-testid="pr-confirm-booking"
                      onClick={() => dispatch({ t: "pr.bookVisit", slotId: activeSlot.id, at: nowMs() })}
                    >
                      <Icon name="check" size={15} /> Confirm appointment
                    </Button>
                  </>
                )}
              </div>

              <aside className="space-y-3">
                <div className="rounded-[10px] border border-line-soft bg-[#fafafa] p-4 text-[12.5px]">
                  <p className="font-semibold text-ink">Appointment summary</p>
                  <dl className="mt-2.5 space-y-2">
                    <div>
                      <dt className="text-ink-muted">Visit type</dt>
                      <dd className="font-medium text-ink">{op.visitTypeLabel}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-muted">Clinic location</dt>
                      <dd className="font-medium text-ink">{op.clinicLocation}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-muted">Selected slot</dt>
                      <dd className="font-medium text-ink">
                        {activeSlot.day} &middot; {activeSlot.time} {activeSlot.tz}
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="flex items-start gap-2 rounded-[8px] border border-[#b9e1dc] bg-[#f1faf8] px-3.5 py-3 text-[12px] text-[#00514f]">
                  <Icon name="shield" size={15} className="mt-0.5 shrink-0" />
                  <span>Zero-PHI booking sync: only clinic location, slot confirmation, and scheduling status update HubSpot.</span>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </OffPlatformFrame>
  );
}
