import type { DemoId } from "../catalog";
import type { Extension } from "../types";

/**
 * Native HubSpot versus built by Penguin, per demo, for Professional and IT services.
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
    { id: "pricing-models", name: "Recurring and one-time line items, billing frequency", by: "native" },
    { id: "quote-editor", name: "Quote editor and templates", by: "native" },
    { id: "quote-page", name: "Buyer-facing quote page and e-signature", by: "native" },
    { id: "tier-win-rate-report", name: "Win rate & average discount by service tier report", by: "native" },
    {
      id: "guided-selling",
      name: "Guided selling",
      by: "penguin",
      note: "Discovery questions and rate-card rules that turn users, sites, service tier, and security add-on into managed service lines and a sized onboarding project.",
    },
  ],
  "discount-approval": [
    { id: "quote-editor", name: "Quote editor and discount fields", by: "native" },
    { id: "quote-approval-status", name: "Quote approval rules, set in Settings: conditions, approvers, request, lock, and approve", by: "native" },
    { id: "approval-record", name: "Approval activity: who requested and who approved", by: "native" },
    { id: "margin-rule", name: "Unit cost, margin, and Quote margin %", by: "native" },
    { id: "notifications", name: "Notifications and approval tasks", by: "native" },
    { id: "tier-win-rate-report", name: "Win rate & average discount by service tier report", by: "native" },
    {
      id: "erp-cost-feed",
      name: "Loaded cost per hour fed from the PSA",
      by: "penguin",
      note: "Keeps the loaded cost of every role and service current from the PSA, so the margin HubSpot shows is real.",
    },
    // HubSpot's own quote approval rules are native and carry no marker. The marker is on what the rule reads:
    // the rate-card floor of each role and the flag on a line priced below it.
    {
      id: "floor-price-rule",
      name: "Rate-card floor and the Below floor price flag",
      by: "penguin",
      note: "Sets each role's rate-card floor from its loaded cost in the PSA and flags every line priced below it. HubSpot's own approval rule reads the flag.",
    },
  ],
  "back-office": [
    { id: "company-record", name: "Company record and properties", by: "native" },
    { id: "quote-editor", name: "Quote editor", by: "native" },
    {
      id: "erp-synced-fields",
      name: "Synced PSA fields",
      by: "penguin",
      note: "Account number, contract renewal date, open balance, and account status kept in sync from the PSA, so lists, reports, and workflows can use them.",
    },
    {
      id: "erp-card",
      name: "Services and finance card",
      by: "penguin",
      note: "Contracts, invoices, unbilled work, engineer capacity, and hardware stock read live from the PSA and the finance system when the record opens, plus Add to change order at the customer's contract rates.",
    },
  ],
  "lead-capture": [
    { id: "forms", name: "Forms and form submissions", by: "native" },
    { id: "enrichment", name: "Company enrichment", by: "native" },
    { id: "lead-scoring", name: "Lead scoring", by: "native" },
    { id: "workflows", name: "Workflows, owner assignment, tasks, deal creation", by: "native" },
    { id: "notifications", name: "Notifications and the Slack alert", by: "native" },
    { id: "findings-proposal", name: "Assessment findings email, proposal quote handoff, and funnel report", by: "native" },
    {
      id: "why-this-score",
      name: "Why this score card",
      by: "penguin",
      note: "Shows the reasons behind the score beside it, so the consultant knows why the request is worth the call.",
    },
    // Open decision, as in Manufacturing: routing seen in live portals is native workflow branching. Set by: "native" to unmark.
    {
      id: "territory-routing",
      name: "Practice area and region routing action",
      by: "penguin",
      note: "A custom workflow action that routes by practice area, then region, from one rule table.",
    },
  ],
  "email-to-deal": [
    { id: "inbox", name: "Shared inbox", by: "native" },
    { id: "deal-record", name: "Deal, line items, and associations", by: "native" },
    { id: "timeline", name: "Email and attachment on the timeline", by: "native" },
    {
      id: "rfq-parser",
      name: "Purchase order and RFP parsing and review card",
      by: "penguin",
      note: "Reads the email and the attached purchase order or RFP summary, matches each line to hardware, licences, and services in the product library, and flags only the lines it is unsure of.",
    },
  ],
  "ai-prospecting": [
    { id: "prospecting-agent", name: "Breeze Prospecting Agent", by: "native" },
    { id: "why-now", name: "Why now summary: Reason To Reach Out and Signals Summary", by: "native" },
    { id: "buying-group", name: "Buying group and buying roles", by: "native" },
    { id: "outreach-drafts", name: "Outreach drafts, with nothing sent until a person approves", by: "native" },
    { id: "meeting-booking", name: "HubSpot meeting link confirmation and automatic deal creation", by: "native" },
    { id: "signal-pipeline-report", name: "Pipeline by technology signal type report", by: "native" },
    {
      id: "erp-signal",
      name: "End-of-support signal from the PSA",
      by: "penguin",
      note: "A buying signal HubSpot cannot see by itself: equipment nearing end of support, fed in from the managed asset inventory in the PSA.",
    },
    {
      id: "credits-outcome-bridge",
      name: "HubSpot Credits-to-Outcome Attribution Panel",
      by: "penguin",
      note: "Connects Breeze Prospecting Agent credit spend directly to technology-signal meetings booked and managed IT pipeline created.",
    },
  ],
  "incident-comms": [
    { id: "incident-ticket", name: "HubSpot Service Hub incident ticket, pipeline stages, and SLA timer", by: "native" },
    { id: "impacted-company-associations", name: "Multi-company ticket associations for impacted managed clients", by: "native" },
    { id: "batch-customer-notifications", name: "Batch customer outage alerts and live status update emails", by: "native" },
    { id: "post-incident-summary", name: "Post-incident summary publication and ticket closure", by: "native" },
    { id: "incident-mttr-dashboard", name: "Service Hub Incidents, MTTR & Customers Affected dashboard", by: "native" },
    {
      id: "rmm-outage-resolver",
      name: "RMM / Monitoring Outage Trigger & Impacted-Asset Resolver",
      by: "penguin",
      note: "Ingests the Datadog/RMM outage webhook, resolves affected firewall serials in the PSA CMDB, and attaches every impacted managed company to the HubSpot incident ticket.",
    },
  ],
  "customer-agent": [
    { id: "breeze-customer-agent", name: "Breeze Customer Agent across IT Portal Chat and Service Desk Email", by: "native" },
    { id: "it-kb", name: "IT Knowledge Base resolution for password resets, MFA, and runbooks", by: "native" },
    { id: "help-desk-tickets", name: "Help Desk workspace, Tickets, and AI summary handoff to L2 engineers", by: "native" },
    { id: "service-analytics", name: "Service Analytics dashboard: tickets by channel, auto-resolution rate, and FRT", by: "native" },
    {
      id: "psa-rmm-lookup",
      name: "PSA / RMM Account Plan & Ticket-Status Action",
      by: "penguin",
      note: "Queries ConnectWise PSA and RMM live inside Help Desk to verify SLA tier, open ticket status (INC/REQ), and firewall telemetry before Breeze resolves or escalates.",
    },
    {
      id: "credits-outcome-bridge",
      name: "HubSpot Credits-to-Outcome Attribution Panel",
      by: "penguin",
      note: "Maps Breeze credit burn directly to deflected L1 tickets, reclaimed MSP engineer hours, and 15-minute P1 SLA compliance.",
    },
  ],
  "contract-renewal": [
    { id: "renewal-120d-workflow", name: "120-day contract renewal workflow, Renewal deal creation, and AM task", by: "native" },
    { id: "qbr-meeting-booking", name: "HubSpot Meetings QBR scheduling and automatic deal/timeline sync", by: "native" },
    { id: "quote-editor-acceptance", name: "Native Quote editor, published quote link, and client acceptance", by: "native" },
    { id: "renewal-pipeline-report", name: "Native HubSpot Analytics report: Renewal pipeline & at-risk ARR", by: "native" },
    {
      id: "psa-contract-sync",
      name: "PSA Agreement & Contract-Date Roll-Forward Sync",
      by: "penguin",
      note: "Writes the renewed 12-month contract end date, updated managed user count, and new monthly billing rate back to the ConnectWise PSA agreement when the renewal closes.",
    },
  ],
};
