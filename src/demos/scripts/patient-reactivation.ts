import { flag, has, type DemoScript } from "./types";

export const patientReactivation: DemoScript = {
  id: "patient-reactivation",
  steps: [
    {
      id: "segment",
      title: "Review overdue patient segment",
      hint: "Segment: inspect non-PHI EHR eligibility sync and Overdue > 12 months list, then click Build reminder series",
      path: () => "/reactivation/segment",
      done: ({ w }) => w.pr.segmentReviewed,
      script: () => [{ t: "pr.reviewSegment" }],
    },
    {
      id: "approve-series",
      title: "Approve reminder email series",
      hint: "Email series: preview the 3 HIPAA-safe reminder touches, then click Approve & activate series",
      path: () => "/reactivation/emails",
      done: ({ w }) => w.pr.seriesApproved,
      script: (_c, now) => [{ t: "pr.approveSeries", at: now }],
    },
    {
      id: "patient-inbox",
      title: "Patient opens reminder email",
      hint: "Off-platform patient inbox: review Touch 1 and click Schedule my annual visit",
      path: () => "/offplatform/patient-booking",
      done: ({ w }) => w.pr.bookingOpened,
      script: () => [{ t: "pr.openBooking" }],
    },
    {
      id: "patient-book",
      title: "Patient books annual visit",
      hint: "Off-platform clinic booking: select a visit slot and click Confirm appointment",
      path: () => "/offplatform/patient-booking",
      done: ({ w }) => w.pr.booked,
      script: ({ pack }, now) => [
        { t: "pr.bookVisit", slotId: pack.demos.patientReactivation?.offPlatform.defaultSlotId ?? "slot-1", at: now },
      ],
    },
    {
      id: "segment-removed",
      title: "Confirm automatic removal",
      hint: "Dynamic segment: see Camila Reyes auto-removed with timeline updates, then click Open reactivation report",
      path: () => "/reactivation/segment",
      done: ({ w }) => w.pr.removalVerified,
      script: () => [{ t: "pr.verifyRemoval" }],
    },
    {
      id: "report",
      title: "Review reactivation report",
      hint: "Reports: filter reactivation rate and visits booked by clinic location, then click Complete review",
      path: ({ pack }) => `/reports/${pack.demos.patientReactivation?.reportId ?? "patient-reactivation"}`,
      done: (c) => has(c, "pr.reportSeen"),
      script: () => [flag("pr.reportSeen")],
    },
  ],
};
