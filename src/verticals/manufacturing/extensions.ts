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
 * The split follows the product plan (section 1.5), corrected against live HubSpot portals
 * (docs/hubspot-portal-reference.md, section 6.7): only what Penguin would have to build is
 * marked. Flags still open for the user's decision are noted beside the entry.
 * Ids of Penguin elements match the <Ext id="..."> wrappers in the screens.
 */
export const extensions: Partial<Record<DemoId, Extension[]>> = {
  "guided-quote": [
    { id: "deal-record", name: "Deal record and pipeline", by: "native" },
    { id: "products-line-items", name: "Product library and line items", by: "native" },
    { id: "price-books", name: "Price books and customer-specific pricing", by: "native" },
    { id: "pricing-models", name: "Volume tiers, bundles, and optional lines", by: "native" },
    { id: "quote-editor", name: "Quote editor and templates", by: "native" },
    { id: "quote-page", name: "Buyer-facing quote page and e-signature", by: "native" },
    {
      id: "guided-selling",
      name: "Guided selling",
      by: "penguin",
      note: "Discovery questions and compatibility rules that turn a few answers into the right line items, with lead times from the ERP.",
    },
  ],
  "discount-approval": [
    { id: "quote-editor", name: "Quote editor and discount fields", by: "native" },
    { id: "quote-approval-status", name: "Quote approval rules, set in Settings: conditions, approvers, request, lock, and approve", by: "native" },
    // Unit cost, margin, and the quote margin rollup are native or configuration, so they carry no marker.
    { id: "margin-rule", name: "Unit cost, margin, and Quote margin %", by: "native" },
    { id: "notifications", name: "Notifications and approval tasks", by: "native" },
    {
      id: "erp-cost-feed",
      name: "Unit cost fed from the ERP",
      by: "penguin",
      note: "Keeps unit cost on every product and line item current from the ERP, so the margin HubSpot shows is real.",
    },
    {
      id: "floor-price-rule",
      name: "Per-product floor price and the Below floor price flag",
      by: "penguin",
      note: "Sets each product's floor price from its ERP unit cost and flags every line priced below it. HubSpot's own approval rule reads the flag.",
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
    // Open decision: live portals sync ERP data into records instead of reading it live into a card. Kept as planned.
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
    // Open decision: routing seen in live portals is native workflow branching. Kept marked as planned; set by: "native" to unmark.
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
    // Open decision: the shipped example of intake is from files, not an inbox. Kept as email parsing.
    {
      id: "rfq-parser",
      name: "RFQ parsing and review card",
      by: "penguin",
      note: "Reads the email and its attachment, matches parts to the product library, and flags only the lines it is unsure of.",
    },
  ],
  "ai-prospecting": [
    { id: "prospecting-agent", name: "Breeze Prospecting Agent", by: "native" },
    { id: "why-now", name: "Why now summary: Reason To Reach Out and Signals Summary", by: "native" },
    { id: "buying-group", name: "Buying group and buying roles", by: "native" },
    { id: "outreach-drafts", name: "Outreach drafts, approval, and send", by: "native" },
    {
      id: "erp-signal",
      name: "Reorder-gap signal from the ERP",
      by: "penguin",
      note: "A buying signal HubSpot cannot see by itself: the customer's reorder gap, fed in from ERP order history.",
    },
  ],
};
