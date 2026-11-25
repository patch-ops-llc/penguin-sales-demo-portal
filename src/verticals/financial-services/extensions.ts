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
export const extensions: Partial<Record<DemoId, Extension[]>> = {
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
    // HubSpot's own quote approval rules are native and carry no marker. The marker is on what the rule reads:
    // the per-program floor price and the flag on a line priced below it.
    {
      id: "floor-price-rule",
      name: "Per-program floor price and the Below floor price flag",
      by: "penguin",
      note: "Sets each program's floor price from the cost of funds and flags every line priced below it. HubSpot's own approval rule reads the flag.",
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
    { id: "meeting-booking", name: "HubSpot meeting link confirmation and automatic deal creation", by: "native" },
    { id: "signal-pipeline-report", name: "Signal-to-Pipeline Attribution report", by: "native" },
    {
      id: "erp-signal",
      name: "Maturity signal from loan servicing",
      by: "penguin",
      note: "A buying signal HubSpot cannot see by itself: a facility nearing maturity, fed in from the loan servicing system.",
    },
    {
      id: "credits-outcome-bridge",
      name: "HubSpot Credits-to-Outcome Attribution Panel",
      by: "penguin",
      note: "Connects Breeze Prospecting Agent credit spend directly to executive meetings booked and commercial financing pipeline created.",
    },
  ],
  "loan-application-pipeline": [
    { id: "loan-application-form", name: "Online commercial loan application form with explicit consent capture", by: "native" },
    { id: "loan-origination-pipeline", name: "Commercial Loan Origination pipeline, stage routing, and underwriter assignment", by: "native" },
    { id: "missing-doc-sequence", name: "Automated borrower missing-document reminder sequence with auto-unenrollment", by: "native" },
    { id: "loan-conversion-report", name: "Application-to-Funded Conversion & Pipeline analytics report", by: "native" },
    {
      id: "los-document-completeness",
      name: "Loan Origination System (LOS) & Document Completeness Card",
      by: "penguin",
      note: "Reads live underwriting packet completeness, bureau pre-checks, and missing-document status from Fernhill's Commercial LOS directly inside the HubSpot Deal.",
    },
  ],
  "agent-loan-pipeline": [
    { id: "loan-application-form", name: "Online commercial loan application form with explicit consent capture", by: "native" },
    { id: "loan-origination-pipeline", name: "Commercial Loan Origination pipeline, stage routing, and underwriter assignment", by: "native" },
    { id: "missing-doc-sequence", name: "Automated borrower missing-document reminder sequence with auto-unenrollment", by: "native" },
    { id: "loan-conversion-report", name: "Application-to-Funded Conversion & Pipeline analytics report", by: "native" },
    {
      id: "los-document-completeness",
      name: "LOS & Document Completeness Card (shared with the clicked demo)",
      by: "penguin",
      note: "Reads live underwriting packet completeness and missing-document status from Fernhill's Commercial LOS inside the HubSpot Deal. The agent reads and writes it through the same actions.",
    },
    {
      id: "agent-workspace",
      name: "Agent workspace",
      by: "penguin",
      note: "A chat panel inside HubSpot where the rep briefs Claude or OpenAI. The model is the head; HubSpot stays the body.",
    },
    {
      id: "agent-tool-bridge",
      name: "Tool bridge: every model action is a HubSpot action",
      by: "penguin",
      note: "Each tool call lands as the same HubSpot action a rep's click would: the deal, the LOS checklist, the sequence, the funded stage. Emailing the borrower waits for the rep.",
    },
  ],
  "branch-launch-campaign": [
    { id: "geo-segment", name: "Dynamic geo-targeted commercial segment (<= 25 mi radius)", by: "native" },
    { id: "marketing-studio", name: "HubSpot Marketing Studio email, local paid ads, and social calendar", by: "native" },
    { id: "branch-landing-page", name: "UTM-attributed branch appointment landing page and RM task creation", by: "native" },
    { id: "branch-attribution-report", name: "Campaign Attribution & New Accounts marketing analytics report", by: "native" },
    {
      id: "core-banking-geo-sync",
      name: "Core-Banking Geo-Eligibility & Product-Holding Segment Sync",
      by: "penguin",
      note: "Syncs non-balance branch proximity and commercial product-eligibility flags from Fernhill's core banking platform into HubSpot lists — zero balances or PII exposed.",
    },
  ],
  "customer-agent": [
    { id: "breeze-customer-agent", name: "Breeze Customer Agent across chat, email, and voice", by: "native" },
    { id: "help-desk", name: "Service Hub Help Desk and ticket pipelines", by: "native" },
    { id: "omnichannel-timeline", name: "Unified contact timeline with call transcripts and cross-channel history", by: "native" },
    { id: "human-handoff", name: "AI-to-human handoff rules with structured conversation summaries", by: "native" },
    { id: "service-dashboard", name: "Service Hub analytics dashboard and HubSpot credits reporting", by: "native" },
    {
      id: "core-banking-lookup",
      name: "Core-banking ledger and transfer lookup action",
      by: "penguin",
      note: "Custom Breeze Customer Agent action and Help Desk card that reads live ACH transfer status, clearing windows, and commercial card charges from Fernhill's core banking system.",
    },
    {
      id: "core-banking-unlock",
      name: "Core-banking step-up verification and account controls",
      by: "penguin",
      note: "Custom security connector that verifies authorized signers against Fernhill's identity store, unlocks MFA lockouts, and places protective wire and card holds on suspected fraud.",
    },
  ],
  "client-onboarding": [
    { id: "closed-won-onboarding-workflow", name: "Closed-won facility workflow & automated 48h document reminders", by: "native" },
    { id: "kyc-onboarding-ticket", name: "Service Hub Client Onboarding ticket pipeline & KYC/KYB checklist", by: "native" },
    { id: "document-collection-emails", name: "Document request portal emails & compliance approval sign-off", by: "native" },
    { id: "onboarding-analytics", name: "Client Onboarding Time & KYC Completion native report", by: "native" },
    {
      id: "kyc-verification-connector",
      name: "KYC / KYB Document Verification Connector",
      by: "penguin",
      note: "Custom compliance connector that reads live external KYC/KYB identity, FinCEN beneficial-ownership, and OFAC sanctions verification results directly onto the Service Hub onboarding ticket.",
    },
  ],
  "complaint-sla": [
    { id: "complaint-intake-ticket", name: "Dedicated complaint email intake & Service Hub categorization", by: "native" },
    { id: "auto-24h-acknowledgement", name: "Automated 24-hour regulatory written acknowledgement email", by: "native" },
    { id: "priority-sla-escalation", name: "Priority SLA countdown timer & overdue manager escalation workflow", by: "native" },
    { id: "resolution-letter-audit", name: "Formal written resolution letter & HubSpot ticket audit timeline", by: "native" },
    { id: "complaint-sla-analytics", name: "Complaints by Type, Resolution Time & SLA Compliance native report", by: "native" },
    {
      id: "complaint-register-export",
      name: "Regulatory Complaint Register Export & Audit Feed",
      by: "penguin",
      note: "Custom compliance archive bridge that exports immutable complaint timestamps, root-cause codes, escalation records, and resolution letters to Fernhill's exam-ready regulatory register.",
    },
  ],
  "agent-complaint-sla": [
    { id: "complaint-intake-ticket", name: "Dedicated complaint email intake & Service Hub categorization", by: "native" },
    { id: "auto-24h-acknowledgement", name: "Automated 24-hour regulatory written acknowledgement email", by: "native" },
    { id: "priority-sla-escalation", name: "Priority SLA countdown timer & overdue manager escalation workflow", by: "native" },
    { id: "resolution-letter-audit", name: "Formal written resolution letter & HubSpot ticket audit timeline", by: "native" },
    { id: "complaint-sla-analytics", name: "Complaints by Type, Resolution Time & SLA Compliance native report", by: "native" },
    {
      id: "complaint-register-export",
      name: "Regulatory Complaint Register Export & Audit Feed (shared with the clicked demo)",
      by: "penguin",
      note: "Custom compliance archive bridge that mirrors complaint timestamps, root-cause codes, escalation records, and resolution letters to Fernhill's regulatory register. The agent's actions land in it the same way.",
    },
    {
      id: "agent-workspace",
      name: "Agent workspace",
      by: "penguin",
      note: "A chat panel inside HubSpot where the rep briefs OpenAI or Claude. The model is the head; Service Hub stays the body.",
    },
    {
      id: "agent-tool-bridge",
      name: "Tool bridge: every model action is a HubSpot action",
      by: "penguin",
      note: "Each tool call lands as the same Service Hub action a rep's click would: the ticket, the acknowledgement, the escalation, the letter, the close. Sending the letter waits for the rep.",
    },
  ],
};
