import type { DemoId } from "../catalog";
import type { Extension } from "../types";

/**
 * Native HubSpot versus built by Penguin, per demo, for Manufacturing.
 *
 * This file is the single place to change that split. For each element:
 *   by: "penguin"  the element gets the Penguin callout in the demo, and is listed under
 *                  "Built by Penguin" on the end card. `note` is the one line the prospect reads.
 *   by: "native"   no marker in the demo. Listed under "Native HubSpot" on the end card.
 *
 * The split below is the proposal from the product plan (section 1.5). It still has to be
 * confirmed against a current HubSpot Enterprise portal, so expect flags here to flip.
 * Ids of Penguin elements match the <Ext id="..."> wrappers in the screens.
 */
export const extensions: Record<DemoId, Extension[]> = {
  "guided-quote": [
    { id: "deal-record", name: "Deal record and pipeline", by: "native" },
    { id: "products-line-items", name: "Product library and line items", by: "native" },
    { id: "quote-editor", name: "Quote editor and template", by: "native" },
    { id: "quote-page", name: "Buyer-facing quote page", by: "native" },
    {
      id: "guided-selling",
      name: "Guided selling",
      by: "penguin",
      note: "Requirement and compatibility rules that turn a few answers into the right line items, with pricing and lead times from the ERP.",
    },
  ],
  "discount-approval": [
    { id: "quote-editor", name: "Quote editor", by: "native" },
    { id: "quote-approval-status", name: "Quote approval status and lock", by: "native" },
    { id: "notifications", name: "Notifications", by: "native" },
    {
      id: "margin-rule",
      name: "Margin-aware approval rule",
      by: "penguin",
      note: "The approval rule checks margin as well as discount, using unit cost synced from the ERP.",
    },
    {
      id: "approval-context",
      name: "Approval context card",
      by: "penguin",
      note: "Discount, margin after discount, and the customer's order history on one card, with one-click approval.",
    },
  ],
  "back-office": [
    { id: "company-record", name: "Company record and properties", by: "native" },
    { id: "quote-editor", name: "Quote editor", by: "native" },
    {
      id: "erp-synced-fields",
      name: "Synced ERP fields",
      by: "penguin",
      note: "Three fields kept in sync from the ERP, so lists, reports, and workflows can use them.",
    },
    {
      id: "erp-card",
      name: "ERP card",
      by: "penguin",
      note: "Orders, open invoices, and stock read live from the ERP when the record opens, plus Add to quote at the contract price.",
    },
  ],
  "lead-capture": [
    { id: "forms", name: "Forms and form submissions", by: "native" },
    { id: "enrichment", name: "Company enrichment", by: "native" },
    { id: "lead-scoring", name: "Lead scoring", by: "native" },
    { id: "workflows", name: "Workflows, owner assignment, tasks, deal creation", by: "native" },
    { id: "notifications", name: "Notifications and the Slack alert", by: "native" },
    {
      id: "why-this-score",
      name: "Why this score card",
      by: "penguin",
      note: "Shows the reasons behind the score beside it, so the rep knows why the lead is worth the call.",
    },
    {
      id: "territory-routing",
      name: "Territory routing action",
      by: "penguin",
      note: "A custom workflow action that routes by territory and product line from one rule table.",
    },
  ],
  "email-to-deal": [
    { id: "inbox", name: "Shared inbox", by: "native" },
    { id: "deal-record", name: "Deal, line items, and associations", by: "native" },
    { id: "timeline", name: "Email and attachment on the timeline", by: "native" },
    {
      id: "rfq-parser",
      name: "RFQ parsing and review card",
      by: "penguin",
      note: "Reads the email and its attachment, matches parts to the product library, and flags only the lines it is unsure of.",
    },
  ],
  "ai-prospecting": [
    { id: "prospecting-agent", name: "Breeze Prospecting Agent", by: "native" },
    { id: "buying-group", name: "Buying group", by: "native" },
    { id: "outreach-drafts", name: "Outreach drafts, approval, and send", by: "native" },
    {
      id: "erp-signal",
      name: "Reorder-gap signal from the ERP",
      by: "penguin",
      note: "A buying signal HubSpot cannot see by itself: the customer's reorder gap, fed in from ERP order history.",
    },
  ],
};
