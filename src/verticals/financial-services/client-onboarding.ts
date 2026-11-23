import type { AnalyticsReportSpec, TicketsDemoConfig } from "../types";

/**
 * Fintech #3 (`client-onboarding`): Client Onboarding & Document Collection (KYC/KYB checklist).
 * Pure pack + config reuse of `src/shell/tickets/lazy.tsx` (`mode: "checklist"`).
 * Zero KB added to initial shell JS.
 *
 * Guardrails:
 * - 100% fictional companies, people, `*.example` emails, `555-01xx` phones, and masked synthetic IDs
 *   (`EIN •••• 7419`, `Acct •••• 6029`). Zero real PII, SSNs, TINs, or bank routing numbers.
 * - Strict Penguin marker boundary: `by: "penguin"` ONLY on `kyc-verification-connector`
 *   (KYC / KYB Document Verification Connector). ZERO Penguin markers on closed-won workflow,
 *   onboarding ticket, KYC/KYB checklist, automated reminders, compliance approval, or native report.
 */
export const clientOnboardingConfig: TicketsDemoConfig = {
  demoId: "client-onboarding",
  mode: "checklist",
  pipelineName: "Client Onboarding & KYC",
  stages: [
    { id: "docs-requested", label: "Documents Requested" },
    { id: "compliance-review", label: "Compliance Review" },
    { id: "onboarding-complete", label: "Onboarding Complete", closed: true },
  ],
  ticket: {
    id: "tkt-fin-onb-1",
    number: "KYC-4812",
    subject: "Kelbrook Waste Services: Commercial KYC/KYB Onboarding & Funding Docs",
    category: "Commercial KYB & Collateral Docs",
    locationLabel: "East Region · TRAC Lease ($810K)",
    sourceLabel: "Closed-Won Facility Workflow",
    priority: "High",
    ownerId: "dana",
    contactId: "ct-clyde",
    companyId: "co-kelbrook",
    dealId: "dl-kelbrook",
    initialStageId: "docs-requested",
    inProgressStageId: "compliance-review",
    resolvedStageId: "onboarding-complete",
    summary:
      "Closed-won TRAC lease ($810,000 collection truck facility) automatically opened this KYC/KYB onboarding ticket, scheduled automated 48-hour missing-document reminders, and assigned compliance review prior to funding release.",
    complianceNote:
      "Synthetic demo identifiers only (EIN •••• 7419 · Acct •••• 6029 · Ref KYC-2026-4812). Zero real SSNs, TINs, or bank account numbers.",
  },
  queueSeeds: [
    {
      id: "tkt-fin-onb-seed-1",
      number: "KYC-4809",
      subject: "Brackenridge Brewing: KYB Beneficial Ownership & Loss-Payee Cert",
      pipeline: "Client Onboarding & KYC",
      stageId: "compliance-review",
      priority: "Medium",
      ownerId: "dana",
      contactId: "ct-sabine",
      companyId: "co-brackenridge",
      locationOrCategory: "East · Equipment Finance",
      createdAt: "@-3d",
      slaLabel: "Day 3 of 5 SLA",
      scoreLabel: "3/4 verified",
    },
    {
      id: "tkt-fin-onb-seed-2",
      number: "KYC-4804",
      subject: "Wintergreen Landscape Supply: Commercial KYC & Fleet Title Packet",
      pipeline: "Client Onboarding & KYC",
      stageId: "onboarding-complete",
      priority: "Low",
      ownerId: "elena",
      contactId: "ct-halle",
      companyId: "co-wintergreen",
      locationOrCategory: "Central · TRAC Lease",
      createdAt: "@-8d",
      slaLabel: "Cleared in 3.4d",
      scoreLabel: "4/4 verified",
    },
    {
      id: "tkt-fin-onb-seed-3",
      number: "KYC-4798",
      subject: "Marrowstone Marine Services: KYB Entity Verification & ACH Mandate",
      pipeline: "Client Onboarding & KYC",
      stageId: "onboarding-complete",
      priority: "High",
      ownerId: "marcus",
      contactId: "ct-ewan",
      companyId: "co-marrowstone",
      locationOrCategory: "West · Equipment Finance",
      createdAt: "@-14d",
      slaLabel: "Cleared in 4.1d",
      scoreLabel: "4/4 verified",
    },
  ],
  sla: {
    priority: "High",
    targetLabel: "5-day KYC/KYB clearance SLA · Automated 48h doc reminders",
    dueLabel: "Day 2 of 5 SLA",
    elapsedPct: 36,
    overdue: false,
  },
  checklist: [
    {
      id: "kyc-entity-id",
      label: "Authorized signer ID & corporate KYB formation filing",
      category: "Identity & KYB",
      ownerLabel: "Ruth Adeyemi (Compliance)",
      status: "pending",
      required: true,
      detail: "Confirm articles of incorporation (EIN •••• 7419) and officer ID verification for Clyde Kelbrook.",
      verificationSource: "KYC/KYB Verification Connector (IDV-8841)",
    },
    {
      id: "kyb-ubo-form",
      label: "Beneficial ownership certification (FinCEN CDD 25%+ owners)",
      category: "Beneficial Ownership",
      ownerLabel: "Ruth Adeyemi (Compliance)",
      status: "pending",
      required: true,
      detail: "Signed beneficial-ownership attestation listing all control persons with >= 25% equity (masked synthetic IDs).",
      verificationSource: "Client document portal · OFAC clear",
    },
    {
      id: "kyc-master-agreement",
      label: "Executed Master TRAC Agreement & ACH settlement mandate",
      category: "Agreements & Funding",
      ownerLabel: "Dana Whitlock (RM)",
      status: "pending",
      required: true,
      detail: "Countersigned schedule MLA-4812-01 and pre-authorized ACH debit form (Acct •••• 6029).",
      verificationSource: "Client document portal",
    },
    {
      id: "kyc-loss-payee",
      label: "Equipment insurance certificate naming Fernhill Capital loss payee",
      category: "Collateral Protection",
      ownerLabel: "Dana Whitlock (RM)",
      status: "pending",
      required: true,
      detail: "Full replacement value coverage confirmed across six collection trucks prior to wire release.",
      verificationSource: "Automated 48h reminder fulfilled",
    },
  ],
  offPlatform: {
    channelLabel: "Client Document Collection Portal",
    windowTitle: "Fernhill Capital · Secure KYC/KYB Document Upload Portal",
    address: "onboarding.fernhillcapital.example/portal/kyc-4812",
    brandName: "Fernhill Capital Client Onboarding",
    brandSubtitle: "Commercial KYC / KYB Document Collection & Automated Reminders",
    headline: "Upload your KYC/KYB compliance packet for Kelbrook Waste Services",
    intro:
      "When your $810,000 collection truck TRAC facility closed won, HubSpot opened Onboarding Ticket KYC-4812 and dispatched an automated 48-hour follow-up reminder so your team can securely upload the four required documents in one step.",
    complianceNote:
      "Fictional demo data · Zero real PII: Synthetic masked identifiers only (EIN •••• 7419, Acct •••• 6029). Never enter real SSNs, TINs, or bank routing numbers.",
    checklist: {
      kind: "doc-request",
      fromName: "Fernhill Capital Onboarding Desk",
      fromEmail: "onboarding@fernhillcapital.example",
      toName: "Clyde Kelbrook",
      toEmail: "clyde.kelbrook@kelbrookwasteservices.example",
      subject: "Reminder (48h): Upload KYC/KYB & loss-payee documents for TRAC Facility KYC-4812",
      body: "Hi Clyde,\n\nThank you for choosing Fernhill Capital for your six-truck fleet expansion. This automated 48-hour reminder lists the four compliance and funding items needed to move Kelbrook Waste Services into final Compliance Review.\n\nOnce you submit the packet below, our automated reminders pause immediately and your Relationship Manager Dana Whitlock and Compliance Officer Ruth Adeyemi will finalize clearance inside our 5-day onboarding SLA.\n\nBest regards,\nFernhill Capital Commercial Onboarding",
      requestedItems: [
        {
          id: "doc-kyb-formation",
          label: "Authorized Signer ID & NY Corporate Formation Filing (EIN •••• 7419)",
          fileName: "kelbrook-kyb-formation-7419.pdf",
          size: "612 KB",
        },
        {
          id: "doc-ubo-cdd",
          label: "Signed Beneficial Ownership Certification (FinCEN CDD)",
          fileName: "kelbrook-ubo-attestation.pdf",
          size: "340 KB",
        },
        {
          id: "doc-mla-ach",
          label: "Executed Master TRAC Agreement & ACH Mandate (Acct •••• 6029)",
          fileName: "kelbrook-mla-4812-signed.pdf",
          size: "1.2 MB",
        },
        {
          id: "doc-loss-payee",
          label: "Equipment Loss-Payee Insurance Certificate (6 Collection Trucks)",
          fileName: "kelbrook-loss-payee-coi.pdf",
          size: "285 KB",
        },
      ],
      ctaLabel: "Submit KYC/KYB documents to Fernhill Capital",
      completedBanner: "All four KYC/KYB documents uploaded and synced directly to Onboarding Ticket KYC-4812.",
    },
  },
  outreach: {
    heading: "Compliance Approval & Onboarding Completion Notice",
    channelLabel: "Compliance Approval Email",
    recipientLabel: "Clyde Kelbrook (clyde.kelbrook@kelbrookwasteservices.example)",
    subject: "[KYC-4812] Compliance Approved — Kelbrook Waste Services Onboarding Complete",
    defaultBody:
      "Hi Clyde,\n\nGood news — Compliance Officer Ruth Adeyemi has completed review of Kelbrook Waste Services' KYC/KYB packet (Ref KYC-2026-4812). Entity verification, FinCEN beneficial ownership certification, OFAC screening, signed TRAC schedule MLA-4812-01, and your loss-payee insurance certificate are all approved.\n\nYour onboarding ticket is now marked Onboarding Complete (cleared in 3.2 days against our 5-day SLA), automated document reminders have been stopped, and funding disbursement to the truck dealer is queued for tomorrow morning.\n\nWarm regards,\nDana Whitlock\nRelationship Manager, East · Fernhill Capital",
    followUpNote:
      "Compliance review signed off by Ruth Adeyemi (Ref IDV-2026-8841, OFAC/PEP clear, EIN •••• 7419 verified). Automated 48h follow-up workflow stopped; ticket moved to Onboarding Complete in 3.2 days and funding release authorized.",
    sendButtonLabel: "Send compliance approval email",
    resolveButtonLabel: "Approve & mark Onboarding Complete",
    resolutionSummary: "Compliance approved · Onboarding Complete in 3.2 days (5d SLA met)",
  },
  externalCard: {
    extId: "kyc-verification-connector",
    title: "KYC / KYB Document Verification Connector",
    badge: "Compliance Sync",
    badgeTone: "purple",
    subtitle:
      "Custom Penguin integration checks external KYC/KYB identity, beneficial ownership, and OFAC sanctions verification status directly on the HubSpot onboarding ticket.",
    fields: [
      { label: "Verification ref", value: "IDV-2026-8841 · EIN •••• 7419" },
      { label: "Entity & UBO check", value: "Passed · 2 beneficial owners verified" },
      { label: "OFAC / watchlist", value: "Clear · Automated sanctions screen" },
      { label: "Auto-reminder sync", value: "48h follow-up cadence satisfied" },
    ],
    footnote: "Only the external KYC/KYB identity-verification feed is custom-built by Penguin; the ticket, checklist, reminders, compliance sign-off, and report are native HubSpot.",
  },
  workflowNote: {
    name: "Service | Closed-Won Facility -> KYC/KYB Onboarding & 48h Reminders",
    trigger: "Deal moves to Funded / Closed Won (dl-kelbrook · $810,000 TRAC Lease)",
    action: "Open KYC-4812 with 4 KYC/KYB checklist items, enroll borrower in automated 48h missing-doc reminders, and route to Compliance Review.",
  },
  reportId: "fintech-client-onboarding",
  reportButtonLabel: "Onboarding Time & Completion Report",
};

/**
 * Shared native HubSpot Analytics report (`/reports/fintech-client-onboarding`):
 * Onboarding Time & Completion report. ZERO Penguin markers (`creditsOutcome` intentionally omitted).
 */
export const clientOnboardingReport: AnalyticsReportSpec = {
  id: "fintech-client-onboarding",
  title: "Client Onboarding Time & KYC Completion",
  subtitle: "Fernhill Capital Service Hub Client Onboarding pipeline · KYC/KYB cycle time, outstanding document items, and compliance approval rate · Q4",
  badge: "Native HubSpot report",
  badgeTone: "green",
  demoId: "client-onboarding",
  backLink: { to: "/tickets", label: "Back to KYC Onboarding Tickets" },
  completeFlag: "tk.client-onboarding.reportReviewed",
  filter: {
    label: "Financing program",
    defaultOptionId: "all",
    options: [
      { id: "all", label: "All programs (24)" },
      {
        id: "trac",
        label: "TRAC & Fleet (9)",
        kpis: [
          { id: "time", label: "Avg Onboarding Time", value: "3.4 days", delta: "-1.6d vs 5d SLA", note: "Includes Kelbrook Waste (3.2 days)", tone: "green" },
          { id: "completion", label: "KYC Completion Rate", value: "100%", delta: "9 of 9 cleared", note: "Zero stalled fleet disbursements", tone: "green" },
          { id: "outstanding", label: "Outstanding Doc Items", value: "1", delta: "48h reminder set", note: "Auto-nudged via HubSpot workflow", tone: "blue" },
          { id: "firstpass", label: "First-Pass Compliance", value: "94.4%", delta: "+6.8% QoQ", note: "Clean UBO + title packet uploads", tone: "teal" },
        ],
        table: {
          title: "TRAC & Fleet Client Onboarding Status",
          columns: [
            { key: "client", label: "Borrower" },
            { key: "program", label: "Program", tag: true },
            { key: "rm", label: "Owner" },
            { key: "days", label: "Time to Complete", align: "right" },
            { key: "outstanding", label: "Open Docs", align: "right" },
            { key: "status", label: "Status", tag: true },
          ],
          rows: [
            {
              id: "onb-kelbrook",
              linkTo: "/tickets/tkt-fin-onb-1",
              cells: {
                client: "Kelbrook Waste Services",
                program: "TRAC Lease",
                rm: "Dana Whitlock",
                days: "3.2 days",
                outstanding: "0 / 4",
                status: "Onboarding Complete",
              },
              tones: { program: "blue", status: "green" },
            },
            {
              id: "onb-wintergreen",
              linkTo: "/companies/co-wintergreen",
              cells: {
                client: "Wintergreen Landscape Supply",
                program: "TRAC Lease",
                rm: "Elena Sokolova",
                days: "3.4 days",
                outstanding: "0 / 4",
                status: "Onboarding Complete",
              },
              tones: { program: "blue", status: "green" },
            },
          ],
        },
      },
      {
        id: "efa",
        label: "Equipment Finance (11)",
        kpis: [
          { id: "time", label: "Avg Onboarding Time", value: "3.9 days", delta: "-1.1d vs 5d SLA", note: "Target: under 5.0 business days", tone: "green" },
          { id: "completion", label: "KYC Completion Rate", value: "90.9%", delta: "10 of 11 cleared", note: "1 packet in final Compliance Review", tone: "green" },
          { id: "outstanding", label: "Outstanding Doc Items", value: "2", delta: "1 awaiting COI", note: "Automated 48h reminders active", tone: "amber" },
          { id: "firstpass", label: "First-Pass Compliance", value: "90.0%", delta: "+5.1% QoQ", note: "OFAC & FinCEN CDD verified", tone: "teal" },
        ],
        table: {
          title: "Equipment Finance Client Onboarding Status",
          columns: [
            { key: "client", label: "Borrower" },
            { key: "program", label: "Program", tag: true },
            { key: "rm", label: "Owner" },
            { key: "days", label: "Time to Complete", align: "right" },
            { key: "outstanding", label: "Open Docs", align: "right" },
            { key: "status", label: "Status", tag: true },
          ],
          rows: [
            {
              id: "onb-brackenridge",
              linkTo: "/companies/co-brackenridge",
              cells: {
                client: "Brackenridge Brewing",
                program: "Equipment Finance",
                rm: "Dana Whitlock",
                days: "Day 3 (in review)",
                outstanding: "1 / 4",
                status: "Compliance Review",
              },
              tones: { program: "teal", status: "amber" },
            },
            {
              id: "onb-marrowstone",
              linkTo: "/companies/co-marrowstone",
              cells: {
                client: "Marrowstone Marine Services",
                program: "Equipment Finance",
                rm: "Marcus Bell",
                days: "4.1 days",
                outstanding: "0 / 4",
                status: "Onboarding Complete",
              },
              tones: { program: "teal", status: "green" },
            },
          ],
        },
      },
      {
        id: "fmv",
        label: "FMV Lease (4)",
        kpis: [
          { id: "time", label: "Avg Onboarding Time", value: "4.3 days", delta: "-0.7d vs 5d SLA", note: "Healthcare & imaging leases", tone: "green" },
          { id: "completion", label: "KYC Completion Rate", value: "100%", delta: "4 of 4 cleared", note: "All site inspections & UBO signed", tone: "green" },
          { id: "outstanding", label: "Outstanding Doc Items", value: "1", delta: "Reminder queued", note: "Loss-payee addendum", tone: "blue" },
          { id: "firstpass", label: "First-Pass Compliance", value: "87.5%", delta: "+4.2% QoQ", note: "Multi-entity ownership trees", tone: "teal" },
        ],
        table: {
          title: "FMV Lease Client Onboarding Status",
          columns: [
            { key: "client", label: "Borrower" },
            { key: "program", label: "Program", tag: true },
            { key: "rm", label: "Owner" },
            { key: "days", label: "Time to Complete", align: "right" },
            { key: "outstanding", label: "Open Docs", align: "right" },
            { key: "status", label: "Status", tag: true },
          ],
          rows: [
            {
              id: "onb-halewood",
              linkTo: "/companies/co-halewood",
              cells: {
                client: "Halewood Surgical Center",
                program: "FMV Lease",
                rm: "Marcus Bell",
                days: "4.3 days",
                outstanding: "0 / 4",
                status: "Onboarding Complete",
              },
              tones: { program: "purple", status: "green" },
            },
          ],
        },
      },
    ],
  },
  kpis: [
    { id: "time", label: "Avg Onboarding Time", value: "3.8 days", delta: "-1.2d vs 5d SLA", note: "Across 24 closed-won commercial facilities", tone: "green" },
    { id: "completion", label: "KYC Completion Rate", value: "95.8%", delta: "+6.4% QoQ", note: "23 of 24 cleared inside 5-day target", tone: "green" },
    { id: "outstanding", label: "Outstanding Doc Items", value: "4", delta: "Auto-reminded", note: "48h HubSpot workflow nudges active", tone: "blue" },
    { id: "firstpass", label: "First-Pass Compliance", value: "91.7%", delta: "+5.9% QoQ", note: "Verified before Compliance Officer sign-off", tone: "teal" },
  ],
  breakdowns: [
    {
      id: "time-by-program",
      title: "Average Onboarding Time by Financing Program",
      subtitle: "Business days from Closed-Won to Compliance Approved / Onboarding Complete",
      kind: "bars",
      badge: "5.0d SLA target",
      badgeTone: "green",
      rows: [
        { label: "TRAC & Fleet Leases", value: 3.4, displayValue: "3.4 days", meta: "9 clients", pct: 68, tone: "blue" },
        { label: "Equipment Finance Agreements", value: 3.9, displayValue: "3.9 days", meta: "11 clients", pct: 78, tone: "teal" },
        { label: "FMV Equipment Leases", value: 4.3, displayValue: "4.3 days", meta: "4 clients", pct: 86, tone: "purple" },
      ],
    },
    {
      id: "kyc-funnel",
      title: "KYC / KYB Onboarding Stage Funnel",
      subtitle: "Q4 closed-won commercial borrowers progressing through Service Hub",
      kind: "funnel",
      badge: "24 facilities",
      badgeTone: "blue",
      rows: [
        { label: "Closed-Won Deals Opening KYC Ticket", value: 24, displayValue: "24 (100%)", pct: 100, tone: "blue" },
        { label: "Document Packet Submitted via Portal", value: 24, displayValue: "24 (100%)", pct: 100, tone: "teal" },
        { label: "KYC / KYB & OFAC Verification Passed", value: 23, displayValue: "23 (95.8%)", pct: 96, tone: "orange" },
        { label: "Compliance Approved -> Onboarding Complete", value: 23, displayValue: "23 (95.8%)", pct: 96, tone: "green" },
      ],
    },
  ],
  table: {
    title: "Client Onboarding & Outstanding Document Status",
    subtitle: "Click any borrower or ticket to inspect the HubSpot record",
    columns: [
      { key: "client", label: "Borrower" },
      { key: "program", label: "Program", tag: true },
      { key: "rm", label: "Owner" },
      { key: "days", label: "Time to Complete", align: "right" },
      { key: "outstanding", label: "Open Docs", align: "right" },
      { key: "status", label: "Status", tag: true },
    ],
    rows: [
      {
        id: "onb-kelbrook",
        linkTo: "/tickets/tkt-fin-onb-1",
        cells: {
          client: "Kelbrook Waste Services",
          program: "TRAC Lease",
          rm: "Dana Whitlock",
          days: "3.2 days",
          outstanding: "0 / 4",
          status: "Onboarding Complete",
        },
        tones: { program: "blue", status: "green" },
      },
      {
        id: "onb-brackenridge",
        linkTo: "/companies/co-brackenridge",
        cells: {
          client: "Brackenridge Brewing",
          program: "Equipment Finance",
          rm: "Dana Whitlock",
          days: "Day 3 (in review)",
          outstanding: "1 / 4",
          status: "Compliance Review",
        },
        tones: { program: "teal", status: "amber" },
      },
      {
        id: "onb-wintergreen",
        linkTo: "/companies/co-wintergreen",
        cells: {
          client: "Wintergreen Landscape Supply",
          program: "TRAC Lease",
          rm: "Elena Sokolova",
          days: "3.4 days",
          outstanding: "0 / 4",
          status: "Onboarding Complete",
        },
        tones: { program: "blue", status: "green" },
      },
      {
        id: "onb-marrowstone",
        linkTo: "/companies/co-marrowstone",
        cells: {
          client: "Marrowstone Marine Services",
          program: "Equipment Finance",
          rm: "Marcus Bell",
          days: "4.1 days",
          outstanding: "0 / 4",
          status: "Onboarding Complete",
        },
        tones: { program: "teal", status: "green" },
      },
      {
        id: "onb-halewood",
        linkTo: "/companies/co-halewood",
        cells: {
          client: "Halewood Surgical Center",
          program: "FMV Lease",
          rm: "Marcus Bell",
          days: "4.3 days",
          outstanding: "0 / 4",
          status: "Onboarding Complete",
        },
        tones: { program: "purple", status: "green" },
      },
    ],
  },
};
