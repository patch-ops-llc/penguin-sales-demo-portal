import { flag, has, type DemoScript } from "./types";

export const branchLaunchCampaign: DemoScript = {
  id: "branch-launch-campaign",
  steps: [
    {
      id: "segment",
      title: "Review geo-targeted segment",
      hint: "Segment: inspect non-balance core-banking proximity sync & Charlotte segment, then click Preview multi-channel campaign",
      path: () => "/branch-launch/segment",
      done: ({ w }) => w.bl.segmentReviewed,
      script: () => [{ t: "bl.reviewSegment" }],
    },
    {
      id: "studio",
      title: "Launch multi-channel campaign",
      hint: "Marketing Studio: preview launch email, paid local ads & social calendar, then click Approve & launch campaign",
      path: () => "/branch-launch/studio",
      done: ({ w }) => w.bl.campaignLaunched,
      script: (_c, now) => [{ t: "bl.launchCampaign", at: now }],
    },
    {
      id: "prospect-engagement",
      title: "Prospect engages launch email",
      hint: "Off-platform prospect view: review launch email & geo-targeted ad, then click Book branch appointment",
      path: () => "/offplatform/branch-launch",
      done: ({ w }) => w.bl.bookingOpened,
      script: () => [{ t: "bl.openBooking" }],
    },
    {
      id: "book-appointment",
      title: "Book branch appointment",
      hint: "Off-platform landing page: pick consultation topic & slot, then click Confirm branch appointment",
      path: () => "/offplatform/branch-launch",
      done: ({ w }) => w.bl.booked,
      script: ({ pack }, now) => [
        {
          t: "bl.bookAppointment",
          slotId: pack.demos.branchLaunch?.landingPage.defaultSlotId ?? "slot-tue",
          topic: pack.demos.branchLaunch?.landingPage.defaultTopic,
          at: now,
        },
      ],
    },
    {
      id: "verify-attribution",
      title: "Verify CRM attribution & task",
      hint: "HubSpot Campaign: confirm booked appointment, timeline & RM task, then click Open attribution report",
      path: () => "/branch-launch/segment",
      done: ({ w }) => w.bl.attributionVerified,
      script: () => [{ t: "bl.verifyAttribution" }],
    },
    {
      id: "report",
      title: "Review attribution report",
      hint: "Reports: filter Leads, Appointments & New Accounts by channel, then click Complete review",
      path: ({ pack }) => `/reports/${pack.demos.branchLaunch?.reportId ?? "branch-launch-attribution"}`,
      done: (c) => has(c, "bl.reportSeen"),
      script: () => [flag("bl.reportSeen")],
    },
  ],
};
