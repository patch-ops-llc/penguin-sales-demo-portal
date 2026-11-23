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
      note: "Subscriptions, invoices, and seat usage read live from billing and product usage when the record opens, plus Add to expansion quote at the contract price.",
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
};
