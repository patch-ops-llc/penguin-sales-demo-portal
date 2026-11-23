import type { DemoId } from "../catalog";
import type { Extension } from "../types";

/**
 * Native HubSpot versus built by Penguin for Healthcare (Crestline Clinical Staffing).
 *
 * Penguin branding rule:
 * - Native HubSpot capabilities (Campaigns, Social Calendar, Brand Voice, Ads tracking,
 *   Forms, Contact Timeline, Follow-up Workflows, Social Inbox/Monitoring, and Marketing/Ads
 *   Insights dashboards) carry NO Penguin marker (`by: "native"`).
 * - Only genuinely custom extensions Penguin builds carry the pulsing Penguin marker
 *   (`by: "penguin"`): here, the custom Staffing ATS / VMS placement revenue attribution feed
 *   that brings filled travel-RN shifts and net placement margin back into HubSpot campaign ROI.
 */
export const extensions: Partial<Record<DemoId, Extension[]>> = {
  "social-ads": [
    { id: "campaigns", name: "Marketing Campaigns: goal, target audience, and budget", by: "native" },
    { id: "social-calendar", name: "Social publishing calendar across LinkedIn, Facebook, Instagram, and X", by: "native" },
    { id: "brand-voice", name: "Brand Voice profile and post draft approval workflow", by: "native" },
    { id: "ads-tracking", name: "Google Ads and LinkedIn Ads tracking with automatic UTM attribution", by: "native" },
    { id: "forms", name: "Landing page form capture and contact/company creation", by: "native" },
    { id: "contact-timeline", name: "Contact timeline with ad clicks, social engagement, and form submissions", by: "native" },
    { id: "followup-workflow", name: "Automated follow-up email and rep notification workflow", by: "native" },
    { id: "social-inbox", name: "Social monitoring inbox for comments and messages across channels", by: "native" },
    { id: "insights-dashboard", name: "Marketing and Ads Insights dashboard: spend, leads, CPL, and pipeline", by: "native" },
    {
      id: "ats-placement-attribution",
      name: "Staffing ATS / VMS placement revenue attribution feed",
      by: "penguin",
      note: "Syncs filled travel-RN shifts, billable hours, and net placement margin from Bullhorn/VMS back into HubSpot campaign ROI so marketing sees verified placement revenue alongside pipeline.",
    },
  ],
  "post-visit-feedback": [
    { id: "post-visit-survey", name: "Post-visit CSAT feedback survey (service experience only, zero PHI)", by: "native" },
    { id: "low-score-workflow", name: "Low-score automation workflow (CSAT <= 3 opens Service Hub ticket)", by: "native" },
    { id: "service-hub-ticket", name: "Service Hub ticket pipeline, SLA tracking, and location-manager assignment", by: "native" },
    { id: "manager-outreach", name: "Location manager outreach email, follow-up notes, and ticket resolution", by: "native" },
    { id: "satisfaction-analytics", name: "Native Service Hub Analytics report: satisfaction & resolution speed by location", by: "native" },
    {
      id: "ehr-visit-trigger",
      name: "EHR Visit-Completion Trigger",
      by: "penguin",
      note: "Listens for outpatient checkout events in the practice management / EHR system (non-PHI site code and checkout token only) and triggers the HubSpot post-visit CSAT survey automatically.",
    },
  ],
};
