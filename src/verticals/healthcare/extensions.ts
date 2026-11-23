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
  "ai-prospecting": [
    { id: "prospecting-agent", name: "Breeze Prospecting Agent and flagged referring-practice queue", by: "native" },
    { id: "why-now", name: "Why now summary across new physician, clinic location, and referral signals", by: "native" },
    { id: "buying-group", name: "Buying group and practice roles (referring physicians and office manager)", by: "native" },
    { id: "outreach-drafts", name: "Role-tailored outreach drafts, liaison review, approval, and send", by: "native" },
    { id: "meeting-booking", name: "Lunch-and-learn meeting booking logged to company and contact timelines", by: "native" },
    { id: "referral-report", name: "Before/after referral volume report by referring practice", by: "native" },
    {
      id: "erp-signal",
      name: "Referral-Volume Signal Feed",
      by: "penguin",
      note: "Ingests aggregated, non-PHI quarterly referral volume counts from EHR/claims analytics so Breeze flags referral drops alongside new providers and clinic openings.",
    },
    {
      id: "credits-outcome-bridge",
      name: "HubSpot Credits & Outcomes Attribution",
      by: "penguin",
      note: "Connects Breeze Prospecting Agent enrichment and outreach credits directly to booked lunch-and-learns and recovered quarterly referral volume.",
    },
  ],
  "patient-reactivation": [
    { id: "dynamic-segment", name: "Dynamic active segment for overdue annual-visit contacts (> 12 months)", by: "native" },
    { id: "reminder-series", name: "Automated 3-touch HIPAA-safe reminder email series preview and approval", by: "native" },
    { id: "appointment-booking", name: "Annual wellness visit booking logged to the contact timeline", by: "native" },
    { id: "auto-removal", name: "Automatic segment removal and touch suppression once booked", by: "native" },
    { id: "reactivation-report", name: "Reactivation rate and visits booked by clinic location report", by: "native" },
    {
      id: "ehr-eligibility-sync",
      name: "EHR Annual-Visit Eligibility Sync",
      by: "penguin",
      note: "Syncs non-PHI last-visit-bucket and annual-visit-overdue flags from practice management into HubSpot so dynamic segments stay current without storing clinical notes or MRNs.",
    },
  ],
  "referral-intake": [
    { id: "referral-form", name: "Referring-clinic intake form and contact/deal capture", by: "native" },
    { id: "referral-pipeline", name: "Specialty clinic referral deal pipeline and intake stages", by: "native" },
    { id: "referral-routing", name: "Automated location and specialty routing workflow to intake coordinator", by: "native" },
    { id: "coordinator-outreach", name: "Coordinator outreach email and patient self-scheduling link", by: "native" },
    { id: "referral-analytics", name: "Native HubSpot referral-to-appointment funnel report by specialty & location", by: "native" },
    {
      id: "ehr-referral-sync",
      name: "Referring-Provider Directory & EHR Referral Sync",
      by: "penguin",
      note: "Validates referring clinician NPI and practice status from the provider directory, then syncs non-PHI scheduled appointment status back to the referring clinic's EHR.",
    },
  ],
  "staffing-job-orders": [
    { id: "staffing-form", name: "Hospital travel-RN staffing request form and job-order capture", by: "native" },
    { id: "job-order-pipeline", name: "Healthcare staffing job-order deal pipeline and placement revenue tracking", by: "native" },
    { id: "recruiter-routing", name: "Automated specialty routing and task assignment to healthcare recruiter", by: "native" },
    { id: "shortlist-outreach", name: "Recruiter shortlist email outreach and hiring-manager selection timeline", by: "native" },
    { id: "staffing-analytics", name: "Native HubSpot fill-rate and time-to-fill analytics report by specialty", by: "native" },
    {
      id: "ats-shortlist-card",
      name: "ATS / VMS Shortlist & Credentialing Card",
      by: "penguin",
      note: "Pulls pre-credentialed travel-RN profiles, Joint Commission & license verification, and shift availability from Bullhorn ATS / VMS directly onto the HubSpot job-order deal.",
    },
  ],
  "customer-agent": [
    { id: "breeze-customer-agent", name: "Breeze Customer Agent: clinic patient chat widget & 24/7 after-hours coverage", by: "native" },
    { id: "clinic-kb", name: "Knowledge Base lookup for accepted insurance, parking, and visit prep", by: "native" },
    { id: "scheduling-link", name: "HubSpot scheduling link & contact timeline appointment logging", by: "native" },
    { id: "help-desk-tickets", name: "Help Desk workspace, Tickets, and AI handoff summary for clinic staff", by: "native" },
    { id: "service-analytics", name: "Service Analytics dashboard: resolutions, after-hours coverage, and handoffs", by: "native" },
    {
      id: "ehr-scheduling-guardrail",
      name: "EHR / Practice Scheduling Sync & HIPAA Clinical-Guardrail Action",
      by: "penguin",
      note: "Reads live non-PHI clinic appointment slots from the Practice EHR, enforces strict zero-medical-advice clinical handoff rules, and queues nurse callbacks without storing clinical PHI in HubSpot.",
    },
    {
      id: "credits-outcome-bridge",
      name: "HubSpot Credits-to-Outcome Attribution Panel",
      by: "penguin",
      note: "Maps Breeze credit usage directly to confirmed outpatient visits booked via AI and front-desk hours reclaimed under a HIPAA/BAA-ready posture.",
    },
  ],
};
