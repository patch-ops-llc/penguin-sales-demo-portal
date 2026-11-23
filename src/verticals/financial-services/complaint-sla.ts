import type { AnalyticsReportSpec, TicketsDemoConfig } from "../types";

/**
 * Fintech #6 (`complaint-sla`): Regulatory Complaint Handling with SLA.
 * Pure pack + config reuse of `src/shell/tickets/lazy.tsx` (`mode: "sla"`).
 * Zero KB added to initial shell JS.
 *
 * Guardrails:
 * - 100% fictional borrowers, people, `*.example` emails, `555-01xx` phones, and masked synthetic
 *   identifiers (`Acct •••• 1960`, `Ref CMP-2026-7304`). Zero real PII, SSNs, or account numbers.
 * - Strict Penguin marker boundary: `by: "penguin"` ONLY on `complaint-register-export`
 *   (Regulatory Complaint Register Export & Audit Feed). ZERO Penguin markers on intake, ticket,
 *   24h auto-acknowledgement email, SLA countdown timer, overdue escalation, resolution letter,
 *   or native SLA Compliance report.
 */
export const complaintSlaConfig: TicketsDemoConfig = {
  demoId: "complaint-sla",
  mode: "sla",
  pipelineName: "Regulatory Complaints & SLA",
  stages: [
    { id: "ack-sent", label: "24h Ack Sent" },
    { id: "sla-escalated", label: "Manager Escalated" },
    { id: "resolution-review", label: "Resolution Sent" },
    { id: "resolved-archived", label: "Resolved & Archived", closed: true },
  ],
  ticket: {
    id: "tkt-fin-sla-1",
    number: "CMP-7304",
    subject: "Regulatory Complaint: Duplicate $685 Late Fee on Facility •••• 1960",
    category: "Fee & Billing Dispute",
    locationLabel: "Commercial Servicing · East · Acct •••• 1960",
    sourceLabel: "Regulated Complaint Email Intake",
    priority: "Urgent",
    ownerId: "dana",
    contactId: "ct-marisol",
    companyId: "co-ironbark",
    dealId: "dl-ironbark-plant",
    initialStageId: "ack-sent",
    escalatedStageId: "sla-escalated",
    inProgressStageId: "resolution-review",
    resolvedStageId: "resolved-archived",
    summary:
      "Controller Marisol Quint reported a duplicate $685 late-fee debit on Equipment Facility •••• 1960 despite an on-time ACH settlement (Ref ACH-884021). HubSpot dispatched the mandatory 24-hour written acknowledgement email on intake and started the 5-business-day regulatory resolution SLA timer.",
    complianceNote:
      "Immutable regulatory audit trail · Masked synthetic Acct •••• 1960 (Ref CMP-2026-7304). Zero real SSNs, TINs, or bank routing numbers.",
  },
  queueSeeds: [
    {
      id: "tkt-fin-sla-seed-1",
      number: "CMP-7301",
      subject: "Quenby Print and Packaging: Payoff quote per-diem calculation inquiry",
      pipeline: "Regulatory Complaints & SLA",
      stageId: "resolution-review",
      priority: "High",
      ownerId: "elena",
      contactId: "ct-ansel",
      companyId: "co-quenby",
      locationOrCategory: "Payoff & Lien Release · Central",
      createdAt: "@-2d",
      slaLabel: "Due in 1d 6h",
    },
    {
      id: "tkt-fin-sla-seed-2",
      number: "CMP-7296",
      subject: "Dunmore Tool and Die: UCC-3 lien termination filing delay after payoff",
      pipeline: "Regulatory Complaints & SLA",
      stageId: "resolved-archived",
      priority: "High",
      ownerId: "dana",
      contactId: "ct-patrice",
      companyId: "co-dunmore",
      locationOrCategory: "Payoff & Lien Release · East",
      createdAt: "@-6d",
      slaLabel: "Resolved in 2.4d",
    },
    {
      id: "tkt-fin-sla-seed-3",
      number: "CMP-7289",
      subject: "Northmere Crane and Rigging: ACH autopay debit date mismatch notice",
      pipeline: "Regulatory Complaints & SLA",
      stageId: "resolved-archived",
      priority: "Medium",
      ownerId: "marcus",
      contactId: "ct-rolf",
      companyId: "co-northmere",
      locationOrCategory: "Servicing & ACH · West",
      createdAt: "@-11d",
      slaLabel: "Resolved in 1.8d",
    },
  ],
  sla: {
    priority: "Urgent",
    targetLabel: "24h written ack (Met · 4m) · 5-day regulatory resolution SLA",
    dueLabel: "SLA Overdue — Escalate",
    elapsedPct: 100,
    overdue: true,
    escalationOwnerId: "ruth",
    escalationRuleLabel:
      "Auto-escalate Urgent regulatory complaints exceeding SLA warning threshold to Senior Credit & Compliance Officer Ruth Adeyemi",
    escalationNote:
      "Escalated to Ruth Adeyemi (Senior Credit & Compliance Officer) with timestamped 24h acknowledgement proof and $685 fee-reversal authorization.",
  },
  offPlatform: {
    channelLabel: "Regulated Complaint Intake Email",
    windowTitle: "Ironbark Mail · Formal Complaint to Fernhill Capital",
    address: "mail.ironbarkpavinggrading.example/sent/cmp-2026-7304",
    brandName: "Ironbark Paving and Grading",
    brandSubtitle: "Borrower Servicing Correspondence",
    headline: "Formal Billing Complaint — Duplicate Late Fee on Facility •••• 1960",
    intro:
      "Sending a formal billing complaint to complaints@fernhillcapital.example creates an Urgent Service Hub ticket, automatically dispatches a mandatory 24-hour written acknowledgement email, and starts the 5-day regulatory SLA countdown timer.",
    complianceNote:
      "Fictional demo data · Zero real PII: Synthetic masked reference Acct •••• 1960 and Case CMP-2026-7304.",
    sla: {
      channel: "Email",
      fromName: "Marisol Quint (Controller, Ironbark Paving)",
      fromEmail: "marisol.quint@ironbarkpavinggrading.example",
      toEmail: "complaints@fernhillcapital.example",
      subject: "Formal Complaint: Duplicate $685 Late Fee Assessed on Facility •••• 1960",
      body: "Hello Fernhill Capital Servicing & Compliance Team,\n\nI am writing to file a formal billing complaint regarding our Asphalt Plant Equipment Facility (Account •••• 1960, Statement STM-2611).\n\nOur monthly ACH installment settled on time on the 1st of the month (bank trace confirmation ACH-884021), yet our statement reflects a duplicate $685.00 late-fee assessment. Please acknowledge receipt in writing, reverse the erroneous $685.00 charge, and confirm that no negative servicing or bureau remark has been recorded against Ironbark Paving and Grading.\n\nRegards,\nMarisol Quint\nController, Ironbark Paving and Grading\n(555) 0143-5259",
      category: "Fee & Billing Dispute",
      referenceId: "CMP-2026-7304",
      ctaLabel: "Ingest complaint & send 24h auto-acknowledgement",
    },
  },
  secondaryOffPlatform: {
    channelLabel: "Borrower Inbox · Formal Resolution Letter",
    windowTitle: "Ironbark Mail · Fernhill Capital Written Resolution Letter (CMP-7304)",
    address: "mail.ironbarkpavinggrading.example/inbox/cmp-7304-resolution",
    fromName: "Fernhill Capital Regulatory Compliance",
    fromEmail: "compliance@fernhillcapital.example",
    toName: "Marisol Quint",
    toEmail: "marisol.quint@ironbarkpavinggrading.example",
    subject: "[CMP-7304] Formal Written Resolution & $685.00 Fee Reversal Confirmation",
    badge: "Preview resolution letter",
    body: "Dear Ms. Quint,\n\nThank you for bringing the Statement STM-2611 late-fee assessment on Facility •••• 1960 to our attention. Following our automated written acknowledgement issued within 4 minutes of your message (Ref CMP-2026-7304), Senior Credit & Compliance Officer Ruth Adeyemi completed a full servicing audit.\n\nFindings & Corrective Action:\n• Root cause (Code RC-ACH-04): Your on-time ACH payment (trace ACH-884021) experienced a one-day holiday batch-posting lag in our servicing ledger.\n• Credit issued: Credit memo CR-2026-7304 for $685.00 has been posted to Facility •••• 1960, reducing your balance immediately.\n• Standing confirmed: Ironbark Paving and Grading remains in Current standing with zero adverse credit or bureau reporting.\n\nIf you have any questions about this resolution, please reply directly to this letter or call our Compliance Desk at (555) 0190-4410.\n\nSincerely,\nRuth Adeyemi — Senior Credit & Compliance Officer\nDana Whitlock — Relationship Manager, East\nFernhill Capital",
    footnote:
      "Written resolution letter logged natively on Service Hub Ticket CMP-7304 and mirrored to Fernhill Capital's immutable regulatory complaint register.",
    ctaLabel: "Return to complaint ticket CMP-7304",
  },
  outreach: {
    heading: "Formal Written Resolution Letter & Audit Closure",
    channelLabel: "Formal Resolution Letter",
    recipientLabel: "Marisol Quint (marisol.quint@ironbarkpavinggrading.example)",
    subject: "[CMP-7304] Formal Written Resolution & $685.00 Fee Reversal Confirmation",
    defaultBody:
      "Dear Marisol,\n\nFollowing our written acknowledgement of Complaint CMP-7304 and Senior Compliance Officer Ruth Adeyemi's review, we have confirmed your ACH payment (trace ACH-884021) settled on time and reversed the erroneous $685.00 late fee via Credit Memo CR-2026-7304 on Facility •••• 1960.\n\nWe also confirm your account remains in Current standing with zero adverse credit reporting. A copy of this formal written resolution letter has been archived in our compliance log for your records.\n\nSincerely,\nDana Whitlock & Ruth Adeyemi\nFernhill Capital",
    followUpNote:
      "Root-cause code RC-ACH-04 (ACH bank-holiday batch posting lag) documented on audit trail. $685.00 fee reversal CR-2026-7304 verified on Facility •••• 1960; written resolution letter delivered inside 5-day regulatory SLA and signed off by Ruth Adeyemi.",
    sendButtonLabel: "Send formal resolution letter",
    resolveButtonLabel: "Log audit trail & close complaint",
    resolutionSummary: "Resolved & archived · 24h ack met · $685 reversal confirmed",
  },
  externalCard: {
    extId: "complaint-register-export",
    title: "Regulatory Complaint Register Export & Audit Feed",
    badge: "Immutable Archive",
    badgeTone: "purple",
    subtitle:
      "Custom Penguin compliance bridge mirrors immutable complaint timestamps, root-cause codes, escalation logs, and resolution letters from HubSpot to Fernhill's regulatory exam archive.",
    fields: [
      { label: "Register entry", value: "REG-2026-7304 · Reg Z / UDAAP Log" },
      { label: "24h ack timestamp", value: "Sent +4m post-intake (Compliant)" },
      { label: "Root-cause code", value: "RC-ACH-04 · Holiday posting lag" },
      { label: "Archive proof", value: "WORM-7304-A9F2 · Exam-ready export" },
    ],
    footnote: "Only the external regulatory archive export is custom-built by Penguin; ticket intake, 24h auto-ack, SLA timer, manager escalation, resolution letter, and SLA report are native HubSpot.",
  },
  workflowNote: {
    name: "Service | Regulatory Complaint -> 24h Auto-Ack & Priority SLA",
    trigger: "Complaint received at complaints@fernhillcapital.example (Ref CMP-2026-7304)",
    action: "Open Urgent ticket CMP-7304, auto-send 24h written acknowledgement email to Marisol Quint, and start 5-day regulatory SLA escalation timer.",
  },
  reportId: "fintech-complaint-sla",
  reportButtonLabel: "SLA Compliance & Resolution Report",
};

/**
 * Shared native HubSpot Analytics report (`/reports/fintech-complaint-sla`):
 * Regulatory SLA Compliance & Resolution Time report. ZERO Penguin markers (`creditsOutcome` omitted).
 */
export const complaintSlaReport: AnalyticsReportSpec = {
  id: "fintech-complaint-sla",
  title: "Complaints by Type, Resolution Time & SLA Compliance",
  subtitle: "Fernhill Capital Service Hub Regulatory Complaints pipeline · 24h acknowledgement attainment, 5-day SLA compliance, and resolution speed · Q4",
  badge: "Native HubSpot report",
  badgeTone: "green",
  demoId: "complaint-sla",
  backLink: { to: "/tickets", label: "Back to Complaint Tickets" },
  completeFlag: "tk.complaint-sla.reportReviewed",
  filter: {
    label: "Complaint category",
    defaultOptionId: "all",
    options: [
      { id: "all", label: "All categories (34)" },
      {
        id: "billing",
        label: "Fee & Billing Dispute (14)",
        kpis: [
          { id: "sla", label: "SLA Compliance Rate", value: "96.4%", delta: "+4.2 pts QoQ", note: "Includes CMP-7304 ($685 reversal)", tone: "green" },
          { id: "ack", label: "24h Auto-Ack Rate", value: "100%", delta: "Avg 5 min", note: "Written receipt dispatched on intake", tone: "green" },
          { id: "resolution", label: "Avg Resolution Time", value: "2.3 days", delta: "-1.2d faster", note: "Target: under 5.0 business days", tone: "teal" },
          { id: "escalations", label: "Manager Escalations", value: "3", delta: "100% closed", note: "All audited by Compliance Officer", tone: "blue" },
        ],
        table: {
          title: "Fee & Billing Dispute Complaint Log",
          columns: [
            { key: "ticket", label: "Complaint Ticket" },
            { key: "category", label: "Category", tag: true },
            { key: "ack", label: "24h Ack", align: "right" },
            { key: "resolution", label: "Resolution Time", align: "right" },
            { key: "sla", label: "SLA Status", tag: true },
          ],
          rows: [
            {
              id: "cmp-7304",
              linkTo: "/tickets/tkt-fin-sla-1",
              cells: {
                ticket: "CMP-7304 · Ironbark Paving (Duplicate late fee •••• 1960)",
                category: "Fee & Billing Dispute",
                ack: "4 min",
                resolution: "2.1 days",
                sla: "Met · Archived",
              },
              tones: { category: "orange", sla: "green" },
            },
            {
              id: "cmp-7281",
              linkTo: "/companies/co-calloway",
              cells: {
                ticket: "CMP-7281 · Calloway Aggregates (Doc fee credit inquiry)",
                category: "Fee & Billing Dispute",
                ack: "6 min",
                resolution: "2.5 days",
                sla: "Met · Archived",
              },
              tones: { category: "orange", sla: "green" },
            },
          ],
        },
      },
      {
        id: "payoff",
        label: "Payoff & Lien Release (9)",
        kpis: [
          { id: "sla", label: "SLA Compliance Rate", value: "97.8%", delta: "+2.9 pts QoQ", note: "Per-diem & UCC-3 releases tracked", tone: "green" },
          { id: "ack", label: "24h Auto-Ack Rate", value: "100%", delta: "Avg 7 min", note: "Zero missed acknowledgements", tone: "green" },
          { id: "resolution", label: "Avg Resolution Time", value: "2.8 days", delta: "-0.9d faster", note: "Target: under 5.0 business days", tone: "teal" },
          { id: "escalations", label: "Manager Escalations", value: "1", delta: "100% closed", note: "Lien filing expedited same day", tone: "blue" },
        ],
        table: {
          title: "Payoff & Lien Release Complaint Log",
          columns: [
            { key: "ticket", label: "Complaint Ticket" },
            { key: "category", label: "Category", tag: true },
            { key: "ack", label: "24h Ack", align: "right" },
            { key: "resolution", label: "Resolution Time", align: "right" },
            { key: "sla", label: "SLA Status", tag: true },
          ],
          rows: [
            {
              id: "cmp-7301",
              linkTo: "/companies/co-quenby",
              cells: {
                ticket: "CMP-7301 · Quenby Print (Payoff per-diem calculation)",
                category: "Payoff & Lien Release",
                ack: "5 min",
                resolution: "In review (Day 2)",
                sla: "On Track",
              },
              tones: { category: "blue", sla: "amber" },
            },
            {
              id: "cmp-7296",
              linkTo: "/companies/co-dunmore",
              cells: {
                ticket: "CMP-7296 · Dunmore Tool & Die (UCC-3 termination filing)",
                category: "Payoff & Lien Release",
                ack: "8 min",
                resolution: "2.4 days",
                sla: "Met · Archived",
              },
              tones: { category: "blue", sla: "green" },
            },
          ],
        },
      },
      {
        id: "ach",
        label: "Servicing & ACH (7)",
        kpis: [
          { id: "sla", label: "SLA Compliance Rate", value: "100%", delta: "+5.0 pts QoQ", note: "7 of 7 resolved inside SLA", tone: "green" },
          { id: "ack", label: "24h Auto-Ack Rate", value: "100%", delta: "Avg 6 min", note: "Automated servicing receipt", tone: "green" },
          { id: "resolution", label: "Avg Resolution Time", value: "2.1 days", delta: "-1.4d faster", note: "Fastest complaint category", tone: "teal" },
          { id: "escalations", label: "Manager Escalations", value: "1", delta: "100% closed", note: "Autopay schedule realigned", tone: "blue" },
        ],
        table: {
          title: "Servicing & ACH Complaint Log",
          columns: [
            { key: "ticket", label: "Complaint Ticket" },
            { key: "category", label: "Category", tag: true },
            { key: "ack", label: "24h Ack", align: "right" },
            { key: "resolution", label: "Resolution Time", align: "right" },
            { key: "sla", label: "SLA Status", tag: true },
          ],
          rows: [
            {
              id: "cmp-7289",
              linkTo: "/companies/co-northmere",
              cells: {
                ticket: "CMP-7289 · Northmere Crane (ACH autopay debit date)",
                category: "Servicing & ACH",
                ack: "6 min",
                resolution: "1.8 days",
                sla: "Met · Archived",
              },
              tones: { category: "teal", sla: "green" },
            },
          ],
        },
      },
      {
        id: "bureau",
        label: "Credit Reporting (4)",
        kpis: [
          { id: "sla", label: "SLA Compliance Rate", value: "95.0%", delta: "+2.1 pts QoQ", note: "Commercial trade-line audits", tone: "green" },
          { id: "ack", label: "24h Auto-Ack Rate", value: "100%", delta: "Avg 5 min", note: "Mandatory written receipt", tone: "green" },
          { id: "resolution", label: "Avg Resolution Time", value: "3.4 days", delta: "-0.8d faster", note: "Includes bureau correction proof", tone: "teal" },
          { id: "escalations", label: "Manager Escalations", value: "0", delta: "0 overdue", note: "Handled inside compliance SLA", tone: "blue" },
        ],
        table: {
          title: "Credit Reporting Complaint Log",
          columns: [
            { key: "ticket", label: "Complaint Ticket" },
            { key: "category", label: "Category", tag: true },
            { key: "ack", label: "24h Ack", align: "right" },
            { key: "resolution", label: "Resolution Time", align: "right" },
            { key: "sla", label: "SLA Status", tag: true },
          ],
          rows: [
            {
              id: "cmp-7274",
              linkTo: "/companies/co-tidewater",
              cells: {
                ticket: "CMP-7274 · Tidewater Cold Storage (Paid trade-line update)",
                category: "Credit Reporting",
                ack: "5 min",
                resolution: "3.4 days",
                sla: "Met · Archived",
              },
              tones: { category: "purple", sla: "green" },
            },
          ],
        },
      },
    ],
  },
  kpis: [
    { id: "sla", label: "SLA Compliance Rate", value: "97.1%", delta: "+3.4 pts QoQ", note: "33 of 34 complaints resolved within 5d SLA", tone: "green" },
    { id: "ack", label: "24h Auto-Ack Rate", value: "100%", delta: "Avg 6 min", note: "Automated written acknowledgement on intake", tone: "green" },
    { id: "resolution", label: "Avg Resolution Time", value: "2.6 days", delta: "-1.1d faster", note: "Target: under 5.0 business days", tone: "teal" },
    { id: "escalations", label: "Manager Escalations", value: "5", delta: "100% closed", note: "Includes CMP-7304 escalated & archived", tone: "blue" },
  ],
  breakdowns: [
    {
      id: "complaints-by-type",
      title: "Complaint Volume & Avg Resolution Time by Type",
      subtitle: "Q4 regulatory complaints logged across Fernhill Capital servicing channels",
      kind: "bars",
      badge: "34 complaints",
      badgeTone: "amber",
      rows: [
        { label: "Fee & Billing Dispute", value: 14, displayValue: "14 cases", meta: "2.3d avg · 96.4% SLA", tone: "orange" },
        { label: "Payoff & Lien Release", value: 9, displayValue: "9 cases", meta: "2.8d avg · 97.8% SLA", tone: "blue" },
        { label: "Servicing & ACH Processing", value: 7, displayValue: "7 cases", meta: "2.1d avg · 100% SLA", tone: "teal" },
        { label: "Credit Bureau Reporting", value: 4, displayValue: "4 cases", meta: "3.4d avg · 95.0% SLA", tone: "purple" },
      ],
    },
    {
      id: "sla-milestone-funnel",
      title: "Regulatory SLA & Audit Trail Attainment",
      subtitle: "Share of complaints meeting every regulatory servicing milestone",
      kind: "funnel",
      badge: "97.1% SLA met",
      badgeTone: "green",
      rows: [
        { label: "Complaints Categorized & Logged in Service Hub", value: 34, displayValue: "34 (100%)", pct: 100, tone: "blue" },
        { label: "24h Written Acknowledgement Email Dispatched", value: 34, displayValue: "34 (100%)", pct: 100, tone: "teal" },
        { label: "Resolved Within 5-Business-Day SLA Target", value: 33, displayValue: "33 (97.1%)", pct: 97, tone: "orange" },
        { label: "Resolution Letter Archived to Regulatory Register", value: 34, displayValue: "34 (100%)", pct: 100, tone: "green" },
      ],
    },
  ],
  table: {
    title: "Regulatory Complaint Log & SLA Audit Status",
    subtitle: "Click any complaint or borrower to inspect the HubSpot record",
    columns: [
      { key: "ticket", label: "Complaint Ticket" },
      { key: "category", label: "Category", tag: true },
      { key: "ack", label: "24h Ack", align: "right" },
      { key: "resolution", label: "Resolution Time", align: "right" },
      { key: "sla", label: "SLA Status", tag: true },
    ],
    rows: [
      {
        id: "cmp-7304",
        linkTo: "/tickets/tkt-fin-sla-1",
        cells: {
          ticket: "CMP-7304 · Ironbark Paving (Duplicate late fee •••• 1960)",
          category: "Fee & Billing Dispute",
          ack: "4 min",
          resolution: "2.1 days",
          sla: "Met · Archived",
        },
        tones: { category: "orange", sla: "green" },
      },
      {
        id: "cmp-7301",
        linkTo: "/companies/co-quenby",
        cells: {
          ticket: "CMP-7301 · Quenby Print (Payoff per-diem calculation)",
          category: "Payoff & Lien Release",
          ack: "5 min",
          resolution: "In review (Day 2)",
          sla: "On Track",
        },
        tones: { category: "blue", sla: "amber" },
      },
      {
        id: "cmp-7296",
        linkTo: "/companies/co-dunmore",
        cells: {
          ticket: "CMP-7296 · Dunmore Tool & Die (UCC-3 termination filing)",
          category: "Payoff & Lien Release",
          ack: "8 min",
          resolution: "2.4 days",
          sla: "Met · Archived",
        },
        tones: { category: "blue", sla: "green" },
      },
      {
        id: "cmp-7289",
        linkTo: "/companies/co-northmere",
        cells: {
          ticket: "CMP-7289 · Northmere Crane (ACH autopay debit date)",
          category: "Servicing & ACH",
          ack: "6 min",
          resolution: "1.8 days",
          sla: "Met · Archived",
        },
        tones: { category: "teal", sla: "green" },
      },
      {
        id: "cmp-7274",
        linkTo: "/companies/co-tidewater",
        cells: {
          ticket: "CMP-7274 · Tidewater Cold Storage (Paid trade-line update)",
          category: "Credit Reporting",
          ack: "5 min",
          resolution: "3.4 days",
          sla: "Met · Archived",
        },
        tones: { category: "purple", sla: "green" },
      },
    ],
  },
};
