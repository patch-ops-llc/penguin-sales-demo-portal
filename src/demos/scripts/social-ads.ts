import type { DemoScript } from "./types";

export const socialAds: DemoScript = {
  id: "social-ads",
  steps: [
    {
      id: "campaign",
      title: "Open the staffing campaign",
      hint: "Campaigns: inspect goal, audience, and $48,000 budget, then click Open social calendar",
      path: () => "/campaigns",
      done: ({ w }) => w.sa.campaignOpened,
      script: () => [{ t: "sa.openCampaign" }],
    },
    {
      id: "calendar",
      title: "Plan posts on the social calendar",
      hint: "Calendar: click Schedule month plan to queue posts by channel and date",
      path: () => "/social/calendar",
      done: ({ w }) => w.sa.calendarPlanned,
      script: () => [{ t: "sa.planCalendar" }],
    },
    {
      id: "approve",
      title: "Approve brand-voice post drafts",
      hint: "Drafts & Brand Voice: review drafts written in brand voice, then click Approve all drafts",
      path: () => "/social/drafts",
      done: ({ w, pack }) => {
        const required = pack.demos.socialAds?.posts.filter((p) => p.needsApproval) ?? [];
        return required.length > 0 && required.every((p) => w.sa.approvedPostIds.includes(p.id));
      },
      script: () => [{ t: "sa.approveAllDrafts" }],
    },
    {
      id: "status",
      title: "Review post statuses on calendar",
      hint: "Calendar: filter by Published, Scheduled, or Draft, then click Preview live ads",
      path: () => "/social/calendar",
      done: ({ w }) => w.sa.statusReviewed,
      script: () => [{ t: "sa.reviewStatus" }],
    },
    {
      id: "google-ad",
      title: "See the paid search ad in Google",
      hint: "Off-platform Google Search: click the Sponsored Crestline ad or Continue to social feed",
      path: () => "/offplatform/google-ad",
      done: ({ w }) => w.sa.googleSeen,
      script: () => [{ t: "sa.seenGoogle" }],
    },
    {
      id: "social-feed",
      title: "See the post and ad in social feed",
      hint: "Off-platform LinkedIn feed: review the organic post and click Request RN Shortlist on the paid ad",
      path: () => "/offplatform/social-feed",
      done: ({ w }) => w.sa.socialAdClicked,
      script: () => [{ t: "sa.clickSocialAd" }],
    },
    {
      id: "landing-page",
      title: "Hiring manager lands on the page",
      hint: "Off-platform landing page: review UTM tracking and click Review staffing form",
      path: () => "/offplatform/landing-page",
      done: ({ w }) => w.sa.landingSeen || w.sa.submitted,
      script: () => [{ t: "sa.seenLanding" }],
    },
    {
      id: "submit-form",
      title: "Submit the staffing request form",
      hint: "Click Submit staffing request to capture Rachel Morales as a HubSpot lead",
      path: () => "/offplatform/landing-page",
      done: ({ w }) => w.sa.submitted,
      script: (_c, now) => [{ t: "sa.submitForm", at: now }],
    },
    {
      id: "contact-created",
      title: "View contact with campaign source",
      hint: "Back in HubSpot: inspect Paid Social source and campaign, then open the Activities tab",
      path: ({ w, pack }) => `/contacts/${w.sa.contactId ?? pack.demos.socialAds?.landingPage.lead.contactId ?? ""}`,
      after: ({ w, pack }) => `/contacts/${w.sa.contactId ?? pack.demos.socialAds?.landingPage.lead.contactId ?? ""}`,
      done: ({ w }) => w.sa.contactSeen,
      script: ({ w, pack }) => {
        const contactId = w.sa.contactId ?? pack.demos.socialAds?.landingPage.lead.contactId ?? "ct-rachel";
        return [{ t: "ui", k: `tab.${contactId}`, v: "activities" }, { t: "sa.seenContact" }];
      },
    },
    {
      id: "timeline",
      title: "Inspect ad click and form timeline",
      hint: "Activities tab: see Google search click, social engagement, paid ad click, and form submission",
      path: ({ w, pack }) => `/contacts/${w.sa.contactId ?? pack.demos.socialAds?.landingPage.lead.contactId ?? ""}`,
      after: ({ w, pack }) => `/contacts/${w.sa.contactId ?? pack.demos.socialAds?.landingPage.lead.contactId ?? ""}`,
      done: ({ w }) => w.sa.timelineSeen,
      script: ({ w, pack }) => {
        const contactId = w.sa.contactId ?? pack.demos.socialAds?.landingPage.lead.contactId ?? "ct-rachel";
        return [{ t: "ui", k: `tab.${contactId}`, v: "activities" }, { t: "sa.seenTimeline" }];
      },
    },
    {
      id: "followup",
      title: "Send follow-up and notify the rep",
      hint: "Click Send follow-up & notify rep to email Rachel Morales and alert Marcus Delgado",
      path: ({ w, pack }) => `/contacts/${w.sa.contactId ?? pack.demos.socialAds?.landingPage.lead.contactId ?? ""}`,
      done: ({ w }) => w.sa.followupSent,
      script: (_c, now) => [{ t: "sa.sendFollowup", at: now }],
    },
    {
      id: "social-inbox",
      title: "Reply to comments in Social Inbox",
      hint: "Monitoring inbox: pick a comment or DM and click Send reply",
      path: () => "/social/inbox",
      done: ({ w }) => Object.keys(w.sa.replies).length > 0,
      script: ({ pack }, now) => {
        const first = pack.demos.socialAds?.inboxThreads.find((t) => !t.initialReplied) ?? pack.demos.socialAds?.inboxThreads[0];
        return first ? [{ t: "sa.replyInbox", threadId: first.id, text: first.suggestedReply, at: now }] : [];
      },
    },
    {
      id: "insights",
      title: "Review campaign Insights dashboard",
      hint: "Insights: filter by channel to see spend, leads, CPL, pipeline, and ATS placement revenue",
      path: () => "/insights",
      done: ({ w }) => w.sa.insightsSeen,
      script: () => [{ t: "sa.seenInsights" }],
    },
  ],
};
