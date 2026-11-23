"use client";

import { useState } from "react";
import { nowMs } from "@/lib/format";
import { useShell } from "@/store/store";
import { Icon } from "../icons";
import { Avatar, Button, colorFor, cx, Tag } from "../ui";
import { OffPlatformFrame } from "./off-platform";

/**
 * Off-platform practice email inbox & lunch-and-learn scheduling screen for AI Prospecting (H3).
 * Native HubSpot outreach email delivery + native HubSpot Meetings link — ZERO Penguin markers.
 */
export function ProspectMeetingOffPlatformPage() {
  const { pack, world, dispatch, navigate } = useShell();
  const config = pack.demos.aiProspecting;
  const meeting = config.offPlatformMeeting;
  const [selectedSlotId, setSelectedSlotId] = useState(meeting?.defaultSlotId ?? "slot-1");

  if (!meeting) return null;

  const booked = world.ap.meetingBooked;
  const activeSlotId = booked && world.ap.meetingSlotId ? world.ap.meetingSlotId : selectedSlotId;
  const activeSlot = meeting.slots.find((s) => s.id === activeSlotId) ?? meeting.slots[0];
  const primaryMember = config.buyingGroup.find((m) => m.name === meeting.recipientName) ?? config.buyingGroup[0];
  const draft = config.drafts[primaryMember.id]?.[world.ap.version] ?? config.drafts[primaryMember.id]?.[0];
  const emailBody = world.ap.edits[primaryMember.id] ?? draft?.body ?? "";
  const emailSubject = draft?.subject ?? meeting.meetingTitle;

  const confirmBooking = () => {
    dispatch({ t: "ap.bookMeeting", slotId: activeSlot.id, at: nowMs() });
  };

  return (
    <OffPlatformFrame
      channelLabel="Practice Email Inbox & Scheduling"
      url={meeting.bookingUrl}
      backTo="/prospecting"
      backLabel="Back to Prospecting"
      testId="offplatform-prospect-meeting"
      action={
        booked && config.reportId ? (
          <Button variant="primary" size="sm" data-testid="ap-go-report-top" onClick={() => navigate(`/reports/${config.reportId}`)}>
            View referral volume report <Icon name="arrowRight" size={14} />
          </Button>
        ) : undefined
      }
    >
      <div className="min-h-full bg-[#f4f6f9] p-6">
        <div className="mx-auto grid max-w-[1120px] gap-6 lg:grid-cols-[minmax(0,1fr)_410px]">
          {/* Left: Practice Email Inbox showing the delivered Breeze outreach */}
          <div className="overflow-hidden rounded-[12px] border border-[#d6dde6] bg-white shadow-sm" data-testid="ap-practice-inbox">
            <div className="flex items-center justify-between border-b border-line-soft bg-[#0f3d56] px-5 py-3 text-white">
              <div className="flex items-center gap-2.5">
                <Icon name="email" size={16} />
                <span className="text-[14px] font-semibold">Practice Mail</span>
                <span className="text-[12px] text-white/75">&middot; {meeting.inboxEmail}</span>
              </div>
              <Tag tone="green">Delivered from HubSpot</Tag>
            </div>

            <div className="border-b border-line-soft bg-[#fafbfd] px-5 py-3.5">
              <p className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Inbox &rsaquo; Referral Liaison Outreach</p>
              <h1 className="mt-1 text-[18px] font-semibold text-ink" data-testid="ap-inbox-subject">
                {emailSubject}
              </h1>
              <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[12.5px] text-ink-muted">
                <span className="flex items-center gap-2 text-ink">
                  <Avatar name={meeting.senderName} color={colorFor(meeting.senderName)} size={24} />
                  <strong>{meeting.senderName}</strong> ({meeting.senderTitle})
                </span>
                <span>&rarr;</span>
                <span>
                  To: <strong>{meeting.recipientName}</strong> ({meeting.recipientTitle}, {meeting.practiceName})
                </span>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="whitespace-pre-line text-[13.5px] leading-relaxed text-[#243447]" data-testid="ap-inbox-body">
                {emailBody}
              </div>

              <div className="rounded-[10px] border border-[#cfe0ea] bg-[#f4f9fc] p-4">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[#0f3d56]">Included HubSpot Meetings Link</p>
                <p className="mt-1 text-[14px] font-semibold text-ink">{meeting.meetingTitle}</p>
                <p className="mt-0.5 text-[12.5px] text-ink-muted">
                  {meeting.meetingDuration} &middot; {meeting.meetingLocation}
                </p>
                <ul className="mt-2.5 space-y-1 text-[12.5px] text-[#243447]">
                  {meeting.agenda.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Icon name="check" size={14} className="mt-0.5 shrink-0 text-[#0b7a4b]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {meeting.complianceNote ? (
                <div className="flex items-start gap-2 rounded-[8px] border border-[#b9e1dc] bg-[#f1faf8] px-3.5 py-2.5 text-[12px] text-[#00514f]">
                  <Icon name="shield" size={15} className="mt-0.5 shrink-0" />
                  <span>{meeting.complianceNote}</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Right: Native HubSpot Meetings lunch-and-learn slot picker */}
          <div className="overflow-hidden rounded-[12px] border border-[#d6dde6] bg-white shadow-sm" data-testid="ap-meeting-scheduler">
            <div className="border-b border-line-soft bg-[#fafbfd] px-5 py-4">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-[#0f3d56]">
                  <Icon name="meeting" size={14} /> HubSpot Meetings
                </span>
                <Tag tone={booked ? "green" : "blue"}>{booked ? "Booked" : meeting.meetingDuration}</Tag>
              </div>
              <h2 className="mt-1.5 text-[17px] font-bold text-ink">{meeting.meetingTitle}</h2>
              <p className="mt-0.5 text-[12.5px] text-ink-muted">{meeting.meetingLocation}</p>
            </div>

            <div className="p-5">
              {booked ? (
                <div className="hs-pop space-y-4" data-testid="ap-meeting-confirmed">
                  <div className="rounded-[10px] border border-[#bfe3cd] bg-[#f0faf4] p-4">
                    <p className="flex items-center gap-2 text-[15px] font-bold text-[#0b5b2b]">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0b7a4b] text-white">
                        <Icon name="check" size={14} strokeWidth={2.4} />
                      </span>
                      Lunch-and-learn confirmed
                    </p>
                    <p className="mt-2 text-[13.5px] font-semibold text-ink">
                      {activeSlot.day} &middot; {activeSlot.time} {activeSlot.tz}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-ink-muted">{meeting.meetingLocation}</p>
                  </div>

                  <div className="rounded-[8px] border border-line-soft bg-[#fafafa] p-3.5 text-[12.5px]">
                    <p className="font-semibold uppercase tracking-wide text-[11px] text-ink-muted">Logged in HubSpot CRM</p>
                    <ul className="mt-2 space-y-1.5 text-ink">
                      <li className="flex items-start gap-2">
                        <Icon name="check" size={14} className="mt-0.5 shrink-0 text-[#0b5b2b]" />
                        Meeting logged on {meeting.practiceName} &amp; buying-group timelines
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon name="check" size={14} className="mt-0.5 shrink-0 text-[#0b5b2b]" />
                        Attendees: {config.buyingGroup.map((m) => m.name).join(", ")}
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon name="check" size={14} className="mt-0.5 shrink-0 text-[#0b5b2b]" />
                        Calendar invite sent to {meeting.senderName} &amp; practice staff
                      </li>
                    </ul>
                  </div>

                  {config.reportId ? (
                    <Button variant="primary" className="w-full" data-testid="ap-go-report" onClick={() => navigate(`/reports/${config.reportId}`)}>
                      View referral volume report <Icon name="arrowRight" size={15} />
                    </Button>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">Select a lunch-and-learn time</p>
                    <div className="mt-2.5 space-y-2" role="radiogroup" aria-label="Lunch-and-learn time slots">
                      {meeting.slots.map((slot) => {
                        const selected = slot.id === activeSlot.id;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            data-testid={`ap-slot-${slot.id}`}
                            aria-pressed={selected}
                            onClick={() => setSelectedSlotId(slot.id)}
                            className={cx(
                              "flex w-full items-center justify-between rounded-[8px] border px-3.5 py-3 text-left text-[13px] transition-colors",
                              selected ? "border-hs-orange bg-[#fff7f2] ring-1 ring-hs-orange" : "border-line hover:bg-[#fafafa]",
                            )}
                          >
                            <span className="font-semibold text-ink">{slot.day}</span>
                            <span className="tabular-nums text-ink-muted">
                              {slot.time} {slot.tz}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-[8px] border border-line-soft bg-[#fafafa] px-3.5 py-2.5 text-[12.5px]">
                    <p className="text-ink-muted">Booking for</p>
                    <p className="mt-0.5 font-semibold text-ink">
                      {meeting.recipientName} &amp; {meeting.practiceName} providers
                    </p>
                    <p className="text-[12px] text-ink-muted">{meeting.inboxEmail}</p>
                  </div>

                  <Button variant="primary" className="w-full" data-testid="ap-book-meeting" onClick={confirmBooking}>
                    <Icon name="check" size={15} /> Confirm lunch-and-learn
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </OffPlatformFrame>
  );
}
