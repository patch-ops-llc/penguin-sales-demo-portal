import type { DemoId } from "../catalog";
import type { Extension } from "../types";

/**
 * Native HubSpot versus built by Penguin, per demo, for SaaS and software.
 *
 * Same rules as Manufacturing's file: this is the single place to change the split.
 *   by: "penguin"  the element gets the Penguin callout in the demo, and is listed under
 *                  "Built by Penguin" on the end card. `note` is the one line the prospect reads.
 *   by: "native"   no marker in the demo. Listed under "Native HubSpot" on the end card.
 *
 * Only what Penguin would have to build is marked (product plan, section 1.5). Ids of Penguin
 * elements match the <Ext id="..."> wrappers in the screens, which are shared by every vertical.
 */
const AGENT_SURFACE: Extension = {
  id: "agent-workspace",
  name: "Claude as the surface",
  by: "penguin",
  note: "The whole screen is a Claude conversation. The person asks, approves, and types; HubSpot is never opened to do the work, only to show the record that changed.",
};

const AGENT_BRIDGE: Extension = {
  id: "agent-tool-bridge",
  name: "Tool bridge: every model action is a HubSpot action",
  by: "penguin",
  note: "Each tool call lands as the same HubSpot action a click would: logged, reversible, governed by the portal's rules. Every write shows its change and waits for approval.",
};

export const extensions: Partial<Record<DemoId, Extension[]>> = {
  "guided-quote": [
    { id: "deal-record", name: "Deal record and pipeline", by: "native" },
    { id: "products-line-items", name: "Product library and line items", by: "native" },
    { id: "recurring-billing", name: "Recurring billing: term and billing frequency on a line item", by: "native" },
    { id: "pricing-models", name: "Volume tiers, bundles, and optional lines", by: "native" },
    { id: "quote-editor", name: "Quote editor and templates", by: "native" },
    { id: "quote-page", name: "Buyer-facing quote page and e-signature", by: "native" },
    {
      id: "guided-selling",
      name: "Guided selling",
      by: "penguin",
      note: "Discovery questions and packaging rules that turn plan, seats, add-ons, and term into the right subscription lines, priced from the billing system.",
    },
  ],
  "discount-approval": [
    { id: "quote-editor", name: "Quote editor and discount fields", by: "native" },
    { id: "quote-approval-status", name: "Quote approval rules, set in Settings: conditions, approvers, request, lock, and approve", by: "native" },
    { id: "margin-rule", name: "Unit cost, margin, and Quote margin %", by: "native" },
    // Open decision: confirm HubSpot's approval settings can trigger on payment terms. Set by: "penguin" to mark it.
    { id: "terms-rule", name: "Approval on non-standard payment terms", by: "native" },
    { id: "notifications", name: "Notifications and approval tasks", by: "native" },
    {
      id: "erp-cost-feed",
      name: "Cost to serve fed from the finance system",
      by: "penguin",
      note: "Keeps cost to serve on every product and line item current from the finance system, so the margin HubSpot shows is real.",
    },
    {
      id: "floor-price-rule",
      name: "Per-product floor price and the Below floor price flag",
      by: "penguin",
      note: "Holds each product's floor price, set by the deal desk, and flags every line priced below it. HubSpot's own approval rule reads the flag.",
    },
  ],
  "back-office": [
    { id: "company-record", name: "Company record and properties", by: "native" },
    { id: "quote-editor", name: "Quote editor", by: "native" },
    { id: "expansion-mrr-report", name: "Native Expansion MRR by account report", by: "native" },
    {
      id: "erp-synced-fields",
      name: "Synced billing fields",
      by: "penguin",
      note: "Account number, renewal date, open balance, and payment status kept in sync from the billing system, so lists, reports, and workflows can use them.",
    },
    {
      id: "erp-card",
      name: "Billing and usage card",
      by: "penguin",
      note: "Subscriptions, invoices, seat-limit alerts, and seat usage read live from billing and product usage when the record opens, plus Add to expansion quote at the contract price.",
    },
  ],
  "lead-capture": [
    { id: "forms", name: "Forms and form submissions", by: "native" },
    { id: "enrichment", name: "Company enrichment, including employee count and tech stack", by: "native" },
    { id: "lead-scoring", name: "Lead scoring", by: "native" },
    { id: "workflows", name: "Workflows, owner assignment, tasks, deal creation", by: "native" },
    { id: "notifications", name: "Notifications and the Slack alert", by: "native" },
    {
      id: "why-this-score",
      name: "Why this score card",
      by: "penguin",
      note: "Shows the reasons behind the score beside it, so the rep knows why the lead is worth the call.",
    },
    // Open decision, as in Manufacturing: routing seen in live portals is native workflow branching. Set by: "native" to unmark.
    {
      id: "territory-routing",
      name: "Segment and territory routing action",
      by: "penguin",
      note: "A custom workflow action that routes by segment, then territory, from one rule table.",
    },
  ],
  "email-to-deal": [],
  "ai-prospecting": [
    { id: "prospecting-agent", name: "Breeze Prospecting Agent", by: "native" },
    { id: "why-now", name: "Why now summary: Reason To Reach Out and Signals Summary", by: "native" },
    { id: "buying-group", name: "Buying group and buying roles", by: "native" },
    { id: "outreach-drafts", name: "Outreach drafts, approval, and send", by: "native" },
    {
      id: "erp-signal",
      name: "Seat-cap signal from product usage",
      by: "penguin",
      note: "A buying signal HubSpot cannot see by itself: people hitting the seat cap, fed in from product usage data.",
    },
  ],
  "marketing-studio": [
    { id: "ms-workspace", name: "Marketing Studio campaign brief and AI campaign plan", by: "native" },
    { id: "ms-brand-voice", name: "Brand Voice configuration applied across generated assets", by: "native" },
    { id: "ms-content-remix", name: "Content Remix: one source ebook remixed into email, blog, social, and landing page", by: "native" },
    { id: "ms-approvals-scheduling", name: "Asset review, approval, and role-tailored ICP outreach scheduling", by: "native" },
    { id: "ms-crm-conversion", name: "Contact conversion, activity timeline, lifecycle stage transitions, tasks, and deal creation", by: "native" },
    { id: "ms-campaign-dashboard", name: "HubSpot Campaign Performance Dashboard: leads, meetings, and attributed pipeline", by: "native" },
    {
      id: "icp-fit-scoring",
      name: "Custom ICP Fit & Buying Committee Card",
      by: "penguin",
      note: "Scores SaaS accounts across firmographics, Snowflake/Okta tech stack, and buying-committee coverage, flagging Tier 1 ICP matches directly on the company record.",
    },
    {
      id: "credits-outcome-bridge",
      name: "HubSpot Credits-to-Pipeline Outcome Attribution",
      by: "penguin",
      note: "Connects HubSpot Credits consumed by Marketing Studio and Breeze actions directly to booked meetings, cost-per-meeting, and attributed pipeline.",
    },
  ],
  "pql-trial-prospecting": [
    { id: "pql-contact-timeline", name: "Contact timeline and native lead scoring promotion to PQL", by: "native" },
    { id: "pql-prospecting-agent", name: "Breeze Prospecting Agent: buying signals and buying group discovery", by: "native" },
    { id: "pql-outreach-approval", name: "Role-tailored trial-to-paid outreach drafts, rep approval, and send", by: "native" },
    { id: "pql-meeting-deal", name: "HubSpot Meetings booking and automatic deal creation", by: "native" },
    { id: "pql-conversion-report", name: "Native Trial-to-paid conversion by source Analytics report", by: "native" },
    {
      id: "product-usage-sync",
      name: "Product Usage Event Sync",
      by: "penguin",
      note: "Streams free-trial workspace milestones (teammate invites and warehouse connections) from product telemetry into HubSpot contact timelines, lead scoring, and Breeze signals.",
    },
    {
      id: "credits-outcome-bridge",
      name: "Credits-to-Pipeline Outcome Attribution",
      by: "penguin",
      note: "Connects HubSpot Credits consumed by Breeze Prospecting Agent PQL enrichment and trial-to-paid outreach directly to booked meetings and conversion pipeline.",
    },
  ],
  "customer-onboarding": [
    { id: "onb-deal-workflow", name: "Closed-won deal-to-ticket automation and CSM assignment", by: "native" },
    { id: "onb-service-pipeline", name: "Service Hub Customer Onboarding pipeline, stages, and SLA tracking", by: "native" },
    { id: "onb-checklist-tasks", name: "Templated onboarding checklist tasks and kickoff email handoff", by: "native" },
    { id: "onb-csat-survey", name: "Post-onboarding CSAT feedback survey triggered on completion", by: "native" },
    { id: "onb-analytics-report", name: "Native Time to onboard & onboarding status Analytics report", by: "native" },
    {
      id: "product-provisioning-card",
      name: "Product Provisioning Status Card",
      by: "penguin",
      note: "Reads live Lumenstack tenant provisioning, Okta SSO/SCIM sync, and data connector health directly inside the HubSpot Service Hub onboarding ticket.",
    },
  ],
  "premium-to-subscription": [
    { id: "dual-pipelines", name: "Multiple Deals pipelines (Premium Pipeline -> Subscription Pipeline)", by: "native" },
    { id: "cs-assignment-workflow", name: "Deal-stage workflows, CS owner assignment, and onboarding kickoff tasks", by: "native" },
    { id: "mrr-subscription-report", name: "Native HubSpot Analytics report: MRR, conversion rate & upcoming renewals", by: "native" },
    {
      id: "billing-subscription-sync",
      name: "Billing Checkout & Subscription Sync",
      by: "penguin",
      note: "Webhook bridge from the external billing checkout that auto-creates the Subscription deal in HubSpot with start date, renewal date, MRR, and subscription ID.",
    },
  ],
  "renewal-churn-risk": [
    { id: "renewal-90d-workflow", name: "90-day renewal workflow, Renewal deal creation, and CSM escalation task", by: "native" },
    { id: "quote-editor", name: "Native Quote editor and line-item discount controls", by: "native" },
    { id: "quote-approval-rules", name: "Native Quote approval rules, Deal Desk notification, and one-click approve", by: "native" },
    { id: "buyer-quote-acceptance", name: "Buyer-facing quote acceptance page and renewal deal close", by: "native" },
    { id: "renewal-forecast-report", name: "Native HubSpot Analytics report: Renewal forecast & retention risk", by: "native" },
    {
      id: "account-health-score",
      name: "Account Health Score Card",
      by: "penguin",
      note: "Blends live Lumenstack seat-usage telemetry and open HubSpot Service Hub tickets into an explainable renewal risk score right on the company record.",
    },
  ],
  "agent-campaign": [
    { id: "campaign-record", name: "Marketing campaign, active list (segment), email, landing page, and social drafts", by: "native" },
    { id: "campaign-attribution", name: "Campaign attribution and contact timeline: click and form submission on the record", by: "native" },
    { id: "marketing-dashboard", name: "Marketing dashboard and saved report", by: "native" },
    AGENT_SURFACE,
    AGENT_BRIDGE,
  ],
  "agent-deal-follow-up": [
    { id: "deal-record", name: "Deal record, stage, close date, next step, tasks, and timeline (the system of record)", by: "native" },
    { id: "connected-inbox", name: "Connected inbox: sent email and the reply logged on the deal", by: "native" },
    { id: "sales-dashboard", name: "Sales dashboard and saved pipeline report", by: "native" },
    AGENT_SURFACE,
    AGENT_BRIDGE,
  ],
  "agent-renewal": [
    { id: "company-record", name: "Company record, renewal deal, notes, tasks, and timeline", by: "native" },
    { id: "service-hub-ticket", name: "Service Hub ticket: created, replied, waiting, closed, with its timeline", by: "native" },
    { id: "service-dashboard", name: "Customer success dashboard and saved renewal risk report", by: "native" },
    AGENT_SURFACE,
    AGENT_BRIDGE,
  ],
};

