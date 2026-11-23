import type { DemoId } from "../catalog";
import type { Extension } from "../types";

/**
 * Native HubSpot versus built by Penguin, per demo, for AEC (Meridian Civil & Builders).
 *
 * Strict Penguin marker rule:
 *   by: "penguin"  ONLY on genuinely custom Penguin-built extensions/integrations (pulsing pin + end card).
 *   by: "native"   NO marker in the demo (listed under "Native HubSpot" on the end card).
 *
 * Ids of Penguin elements match the <Ext id="..."> wrappers in the shared screens.
 */
export const extensions: Partial<Record<DemoId, Extension[]>> = {
  "guided-quote": [
    { id: "deal-record", name: "Deal record and preconstruction pipeline", by: "native" },
    { id: "products-line-items", name: "CSI division product library and line items", by: "native" },
    { id: "price-books", name: "MSA rate books and division unit pricing", by: "native" },
    { id: "pricing-models", name: "Volume tiers, general conditions, and optional lines", by: "native" },
    { id: "quote-editor", name: "Quote editor and commercial bid templates", by: "native" },
    { id: "quote-page", name: "Branded buyer quote page and e-signature", by: "native" },
    {
      id: "guided-selling",
      name: "Guided commercial estimating & division BOM",
      by: "penguin",
      note: "Discovery questions and CSI division rules that turn project scope (sitework, structural, MEP, delivery method) into priced line items with Procore mobilization lead times.",
    },
  ],
  "discount-approval": [
    { id: "quote-editor", name: "Quote editor and value-engineering discount fields", by: "native" },
    { id: "quote-approval-status", name: "Quote approval rules in Settings: thresholds, VP Estimating approver, lock, and approve", by: "native" },
    { id: "approval-record", name: "Approval activity: who requested and who approved", by: "native" },
    { id: "margin-rule", name: "Unit cost, gross margin, and Quote margin %", by: "native" },
    { id: "notifications", name: "Notifications and approval tasks", by: "native" },
    {
      id: "erp-cost-feed",
      name: "Subcontractor & material cost feed from Procore & Sage Intacct",
      by: "penguin",
      note: "Keeps subcontractor and material unit cost current from Sage Intacct estimating, so the gross margin HubSpot checks is real.",
    },
    {
      id: "floor-price-rule",
      name: "Subcontractor cost floor and Below floor price flag",
      by: "penguin",
      note: "Calculates each division item's floor price from live subcontractor cost and flags lines below margin floor for HubSpot's native approval workflow.",
    },
  ],
  "back-office": [
    { id: "company-record", name: "Company record and CRM properties", by: "native" },
    { id: "quote-editor", name: "Change-order quote editor", by: "native" },
    {
      id: "erp-synced-fields",
      name: "Synced Procore & Sage Intacct job fields",
      by: "penguin",
      note: "Job account, last commitment date, open progress billing, and bonding/credit status synced from Procore and Sage Intacct for HubSpot lists and workflows.",
    },
    {
      id: "erp-card",
      name: "Procore & Sage Intacct job-costing sync card",
      by: "penguin",
      note: "Active commitments, change orders, AIA progress billings, retainage, and MSA unit rates read live from Procore and Sage Intacct inside HubSpot, with one-click Add to change-order quote.",
    },
  ],
  "lead-capture": [
    { id: "forms", name: "RFP & bid-invite intake form and submissions", by: "native" },
    { id: "enrichment", name: "Company & municipal agency enrichment", by: "native" },
    { id: "lead-scoring", name: "Bid-fit lead scoring", by: "native" },
    { id: "workflows", name: "Workflows, estimating owner assignment, tasks, and deal creation", by: "native" },
    { id: "notifications", name: "Notifications and estimating channel Slack alert", by: "native" },
    {
      id: "why-this-score",
      name: "Why this score card",
      by: "penguin",
      note: "Explains the bid-fit score beside the contact so the estimator sees capital-program fit, bond size, and bid deadline at a glance.",
    },
    {
      id: "territory-routing",
      name: "Division & bond-tier routing action",
      by: "penguin",
      note: "A custom workflow action that routes municipal and commercial RFPs to the right Civil or Commercial estimator from one division table.",
    },
  ],
  "email-to-deal": [
    { id: "inbox", name: "Shared estimating inbox", by: "native" },
    { id: "deal-record", name: "Deal, CSI line items, bid date, and associations", by: "native" },
    { id: "timeline", name: "Bid inquiry email and ITB attachment on the timeline", by: "native" },
    {
      id: "rfq-parser",
      name: "Bid inquiry & ITB parsing review card",
      by: "penguin",
      note: "Parses owner-rep bid emails and attached ITB summaries, extracts scope and bid-due dates, matches CSI divisions, and flags only ambiguous items.",
    },
  ],
  "ai-prospecting": [
    { id: "prospecting-agent", name: "Breeze Prospecting Agent", by: "native" },
    { id: "why-now", name: "Why now summary: Reason To Reach Out and Signals Summary", by: "native" },
    { id: "buying-group", name: "Project owner & architect buying group and roles", by: "native" },
    { id: "outreach-drafts", name: "Role-tailored outreach drafts, approval, and send", by: "native" },
    {
      id: "erp-signal",
      name: "Municipal building-permit & RFP signal feed",
      by: "penguin",
      note: "Ingests municipal building-permit filings and public capital-improvement RFP notices into HubSpot so Breeze surfaces projects before bid day.",
    },
  ],
};
