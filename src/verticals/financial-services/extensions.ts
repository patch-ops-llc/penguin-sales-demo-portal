import type { DemoId } from "../catalog";
import type { Extension } from "../types";

/**
 * Native HubSpot versus built by Penguin, per demo, for Financial services and fintech.
 *
 * Same rules as Manufacturing's file: this is the single place to change the split.
 *   by: "penguin"  the element gets the Penguin callout in the demo, and is listed under
 *                  "Built by Penguin" on the end card. `note` is the one line the prospect reads.
 *   by: "native"   no marker in the demo. Listed under "Native HubSpot" on the end card.
 *
 * Only what Penguin would have to build is marked (product plan, section 1.5). Ids of Penguin
 * elements match the <Ext id="..."> wrappers in the screens, which are shared by every vertical.
 */
export const extensions: Record<DemoId, Extension[]> = {
  "guided-quote": [
    { id: "deal-record", name: "Deal record and pipeline", by: "native" },
    { id: "products-line-items", name: "Product library and line items", by: "native" },
    { id: "pricing-models", name: "Fees, optional lines, and payment schedules on line items", by: "native" },
    { id: "quote-editor", name: "Quote editor and templates", by: "native" },
    { id: "quote-page", name: "Buyer-facing quote page and e-signature", by: "native" },
    {
      id: "guided-selling",
      name: "Guided selling",
      by: "penguin",
      note: "Discovery questions and pricing rules that turn equipment cost, term, down payment, and credit tier into the payment and the fees, from the current rate card.",
    },
  ],
  "discount-approval": [
    { id: "quote-editor", name: "Quote editor and discount fields", by: "native" },
    { id: "quote-approval-status", name: "Quote approval rules: rate exception limit, request, status, lock, and approve", by: "native" },
    { id: "approval-record", name: "Approval activity: who requested and who approved", by: "native" },
    { id: "margin-rule", name: "Unit cost, margin, and Quote margin %", by: "native" },
    { id: "notifications", name: "Notifications and approval tasks", by: "native" },
    {
      id: "erp-cost-feed",
      name: "Cost of funds fed from the treasury system",
      by: "penguin",
      note: "Keeps the cost of funds on every program and line item current from the treasury system, so the margin HubSpot shows is real.",
    },
    // Marked in every vertical, as the plan has it. HubSpot's own quote approval rules are native and carry no marker;
    // if the per-line floor check should count as one of them, set by: "native".
    {
      id: "floor-price-rule",
      name: "Per-program floor-price rule",
      by: "penguin",
      note: "Checks every line against its program's floor price, set from the cost of funds, and sends the proposal for approval when a line falls below it.",
    },
  ],
  "back-office": [
    { id: "company-record", name: "Company record and properties", by: "native" },
    { id: "quote-editor", name: "Quote editor", by: "native" },
    {
      id: "erp-synced-fields",
      name: "Synced servicing fields",
      by: "penguin",
      note: "Customer number, next maturity date, outstanding balance, and account status kept in sync from loan servicing, so lists, reports, and workflows can use them.",
    },
    {
      id: "erp-card",
      name: "Loan servicing card",
      by: "penguin",
      note: "Facilities, payments, and available credit read live from loan servicing when the record opens, plus Add to financing proposal at the pricing the customer's line holds.",
    },
  ],
  "lead-capture": [
    { id: "forms", name: "Forms, form submissions, and consent captured on the form", by: "native" },
    { id: "consent", name: "Consent stored on the contact record", by: "native" },
    { id: "enrichment", name: "Company enrichment", by: "native" },
    { id: "lead-scoring", name: "Lead scoring", by: "native" },
    { id: "workflows", name: "Workflows, owner assignment, tasks, deal creation", by: "native" },
    { id: "notifications", name: "Notifications and the Slack alert", by: "native" },
    {
      id: "why-this-score",
      name: "Why this score card",
      by: "penguin",
      note: "Shows the reasons behind the score beside it, so the relationship manager knows why the inquiry is worth the call.",
    },
    // Open decision, as in Manufacturing: routing seen in live portals is native workflow branching. Set by: "native" to unmark.
    {
      id: "territory-routing",
      name: "Region and deal size routing action",
      by: "penguin",
      note: "A custom workflow action that routes by region and deal size from one rule table.",
    },
  ],
  "email-to-deal": [
    { id: "inbox", name: "Shared inbox", by: "native" },
    { id: "deal-record", name: "Deal, line items, and associations", by: "native" },
    { id: "timeline", name: "Email and attachment on the timeline", by: "native" },
    {
      id: "rfq-parser",
      name: "Funding request parsing and review card",
      by: "penguin",
      note: "Reads the vendor's or broker's email and the attached invoice, works out the amount to finance, matches it to a program, and flags only the lines it is unsure of.",
    },
  ],
  "ai-prospecting": [
    { id: "prospecting-agent", name: "Breeze Prospecting Agent", by: "native" },
    { id: "why-now", name: "Why now summary: Reason To Reach Out and Signals Summary", by: "native" },
    { id: "buying-group", name: "Buying group and buying roles", by: "native" },
    { id: "outreach-drafts", name: "Outreach drafts, with nothing sent until a person approves", by: "native" },
    {
      id: "erp-signal",
      name: "Maturity signal from loan servicing",
      by: "penguin",
      note: "A buying signal HubSpot cannot see by itself: a facility nearing maturity, fed in from the loan servicing system.",
    },
  ],
};
