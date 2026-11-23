import type { AnalyticsReportSpec } from "../analytics-types";

/**
 * Shared declarative Analytics reports for Financial Services growth flows (Wave 3 PR 3.2):
 * - `loan-application-conversion` (F2): PURE native HubSpot report (0 Penguin markers)
 * - `branch-launch-attribution` (F5): PURE native HubSpot report (0 Penguin markers)
 * - `fintech-signal-pipeline` (F4): Native report + ONLY 1 Penguin marker on `creditsOutcome` (`credits-outcome-bridge`)
 *
 * Kept in a dedicated file (`reports-growth.ts`) to stay conflict-free alongside parallel PR 3.1.
 */

export const loanApplicationConversionReport: AnalyticsReportSpec = {
  id: "loan-application-conversion",
  title: "Application-to-Funded Conversion & Pipeline",
  subtitle: "Fernhill Capital · Commercial Loan Origination conversion, stage velocity, and approval rate (90 days)",
  badge: "Sales & Origination Reporting",
  badgeTone: "green",
  demoIds: ["loan-application-pipeline"],
  backLink: { to: "/deals/dl-intake-loan", label: "Back to Loan Deal" },
  completeFlag: "intake.loan-application-pipeline.reportSeen",
  filter: {
    label: "Loan amount tier",
    defaultOptionId: "all",
    options: [
      { id: "all", label: "All applications (94)" },
      {
        id: "high-amount",
        label: "High-Amount (>$500K)",
        kpis: [
          { id: "submitted", label: "Applications Submitted", value: "22", delta: "+29% QoQ", note: "Incl. APP-2027-4102 Harborline", tone: "blue" },
          { id: "approval", label: "Approval Rate", value: "72.7%", delta: "+6.4 pts", note: "Senior Credit Officer >$500K rule", tone: "green" },
          { id: "velocity", label: "Median Time to Fund", value: "6.4 days", delta: "-4.1 days", note: "Auto doc-reminders cut doc wait", tone: "teal" },
          { id: "funded", label: "Funded Principal", value: "$11,480,000", delta: "16 loans funded", note: "$717.5K average funded loan", tone: "green" },
        ],
        table: {
          title: "High-Amount Commercial Applications (>$500K)",
          columns: [
            { key: "ref", label: "Application & Borrower" },
            { key: "tier", label: "Tier", tag: true },
            { key: "docs", label: "Doc Turnaround", align: "right" },
            { key: "stage", label: "Stage", tag: true },
            { key: "amount", label: "Principal", align: "right" },
          ],
          rows: [
            {
              id: "harborline-hi",
              linkTo: "/deals/dl-intake-loan",
              cells: {
                ref: "APP-2027-4102 · Harborline Cold Freight LLC",
                tier: "High-Amount",
                docs: "1.4 days",
                stage: "Approved & Funded",
                amount: "$640,000",
              },
              tones: { tier: "purple", stage: "green" },
            },
            {
              id: "lindenhurst-hi",
              linkTo: "/deals/dl-lindenhurst",
              cells: {
                ref: "APP-2027-4088 · Lindenhurst Imaging Associates",
                tier: "High-Amount",
                docs: "2.1 days",
                stage: "Underwriting Review",
                amount: "$1,150,000",
              },
              tones: { tier: "purple", stage: "blue" },
            },
            {
              id: "northmere-hi",
              linkTo: "/deals/dl-northmere",
              cells: {
                ref: "APP-2027-4051 · Northmere Crane & Rigging",
                tier: "High-Amount",
                docs: "1.9 days",
                stage: "Approved & Funded",
                amount: "$940,000",
              },
              tones: { tier: "purple", stage: "green" },
            },
          ],
        },
      },
      {
        id: "mid-market",
        label: "Mid-Market ($250K–$500K)",
        kpis: [
          { id: "submitted", label: "Applications Submitted", value: "41", delta: "+21% QoQ", note: "Direct & equipment vendor portal", tone: "blue" },
          { id: "approval", label: "Approval Rate", value: "68.3%", delta: "+4.8 pts", note: "Standard regional credit desk", tone: "green" },
          { id: "velocity", label: "Median Time to Fund", value: "4.8 days", delta: "-3.2 days", note: "Automated missing-doc sequences", tone: "teal" },
          { id: "funded", label: "Funded Principal", value: "$10,220,000", delta: "28 loans funded", note: "$365K average funded loan", tone: "green" },
        ],
      },
      {
        id: "small-ticket",
        label: "Small-Ticket (<$250K)",
        kpis: [
          { id: "submitted", label: "Applications Submitted", value: "31", delta: "+15% QoQ", note: "Fast-track fleet & shop equipment", tone: "blue" },
          { id: "approval", label: "Approval Rate", value: "64.5%", delta: "+3.9 pts", note: "Small-ticket desk turnaround", tone: "green" },
          { id: "velocity", label: "Median Time to Fund", value: "3.1 days", delta: "-2.4 days", note: "Digital doc upload & e-sign", tone: "teal" },
          { id: "funded", label: "Funded Principal", value: "$3,460,000", delta: "20 loans funded", note: "$173K average funded loan", tone: "green" },
        ],
      },
    ],
  },
  kpis: [
    { id: "submitted", label: "Applications Submitted", value: "94", delta: "+22% QoQ", note: "Captured via online commercial portal", tone: "blue" },
    { id: "approval", label: "Application-to-Funded", value: "68.1%", delta: "+5.1 pts YoY", note: "64 of 94 applications funded", tone: "green" },
    { id: "velocity", label: "Median Time to Fund", value: "4.9 days", delta: "-3.4 days", note: "Doc reminders cut doc wait by 72%", tone: "teal" },
    { id: "funded", label: "Funded Loan Volume", value: "$25,160,000", delta: "64 loans funded", note: "Incl. $640K Harborline Cold Freight", tone: "green" },
  ],
  breakdowns: [
    {
      id: "loan-conversion-funnel",
      title: "Application-to-Funded Conversion Funnel",
      subtitle: "Commercial Loan Origination pipeline over the last 90 days",
      kind: "funnel",
      badge: "68.1% funded",
      badgeTone: "green",
      rows: [
        { label: "Online loan applications submitted", value: 94, displayValue: "94 apps", pct: 100, tone: "blue" },
        { label: "Credit bureau & LOS pre-check cleared", value: 84, displayValue: "84 (89.4%)", pct: 89, tone: "teal" },
        { label: "All missing documents received (auto-sequence)", value: 76, displayValue: "76 (80.9%)", pct: 81, tone: "amber" },
        { label: "Underwriting approved & offer issued", value: 69, displayValue: "69 (73.4%)", pct: 73, tone: "orange" },
        { label: "Approved & Funded (Closed Won)", value: 64, displayValue: "64 ($25.2M)", pct: 68, tone: "green" },
      ],
    },
    {
      id: "stage-dwell-time",
      title: "Median Time in Stage (Days)",
      subtitle: "Automated HubSpot missing-document reminders keep packets moving into underwriting",
      kind: "bars",
      badge: "4.9d total median",
      badgeTone: "teal",
      rows: [
        { label: "Application Received -> LOS Check", value: 0.4, displayValue: "0.4 days", meta: "Automated intake routing", pct: 16, tone: "blue" },
        { label: "Documents Requested (Auto-Sequence)", value: 1.8, displayValue: "1.8 days", meta: "Down from 6.4d manual", pct: 72, tone: "amber" },
        { label: "Underwriting Review & Credit Sign-Off", value: 1.6, displayValue: "1.6 days", meta: "High-amount SLA < 48 hrs", pct: 64, tone: "teal" },
        { label: "Closing & Wire Funding", value: 1.1, displayValue: "1.1 days", meta: "Synced to Commercial LOS", pct: 44, tone: "green" },
      ],
    },
  ],
  table: {
    title: "Recent Commercial Loan Applications",
    subtitle: "Masked synthetic application references only (100% fictional borrowers)",
    columns: [
      { key: "ref", label: "Application & Borrower" },
      { key: "tier", label: "Amount Tier", tag: true },
      { key: "docs", label: "Doc Turnaround", align: "right" },
      { key: "stage", label: "Pipeline Stage", tag: true },
      { key: "amount", label: "Principal", align: "right" },
    ],
    rows: [
      {
        id: "harborline",
        linkTo: "/deals/dl-intake-loan",
        cells: {
          ref: "APP-2027-4102 · Harborline Cold Freight LLC",
          tier: "High-Amount",
          docs: "1.4 days",
          stage: "Approved & Funded",
          amount: "$640,000",
        },
        tones: { tier: "purple", stage: "green" },
      },
      {
        id: "quenby",
        linkTo: "/deals/dl-quenby",
        cells: {
          ref: "APP-2027-4095 · Quenby Print & Packaging",
          tier: "High-Amount",
          docs: "2.0 days",
          stage: "Documents Requested",
          amount: "$620,000",
        },
        tones: { tier: "purple", stage: "amber" },
      },
      {
        id: "brackenridge",
        linkTo: "/deals/dl-brackenridge",
        cells: {
          ref: "APP-2027-4079 · Brackenridge Brewing",
          tier: "Mid-Market",
          docs: "1.6 days",
          stage: "Approved & Funded",
          amount: "$355,000",
        },
        tones: { tier: "teal", stage: "green" },
      },
      {
        id: "wintergreen",
        linkTo: "/deals/dl-wintergreen",
        cells: {
          ref: "APP-2027-4064 · Wintergreen Landscape Supply",
          tier: "Mid-Market",
          docs: "1.3 days",
          stage: "Approved & Funded",
          amount: "$268,000",
        },
        tones: { tier: "teal", stage: "green" },
      },
      {
        id: "saffron",
        linkTo: "/deals/dl-saffron",
        cells: {
          ref: "APP-2027-4047 · Saffron Ridge Vineyards",
          tier: "Small-Ticket",
          docs: "1.1 days",
          stage: "Underwriting Review",
          amount: "$185,000",
        },
        tones: { tier: "blue", stage: "blue" },
      },
    ],
  },
};

export const branchLaunchAttributionReport: AnalyticsReportSpec = {
  id: "branch-launch-attribution",
  title: "Campaign Attribution & New Accounts",
  subtitle: "Fernhill Capital · Charlotte South End Commercial Branch Launch leads, appointments, and new accounts by channel",
  badge: "Marketing Attribution",
  badgeTone: "green",
  demoIds: ["branch-launch-campaign"],
  backLink: { to: "/branch-launch/segment", label: "Back to Branch Launch" },
  completeFlag: "bl.reportSeen",
  filter: {
    label: "Launch channel",
    defaultOptionId: "all",
    options: [
      { id: "all", label: "All channels (4)" },
      {
        id: "email",
        label: "Launch Email",
        kpis: [
          { id: "leads", label: "Engaged Leads", value: "118", delta: "41.2% open rate", note: "Geo-eligible segment (<= 25 mi)", tone: "blue" },
          { id: "appointments", label: "Branch Appointments", value: "34", delta: "28.8% booking", note: "Incl. Tessa Halstead (Piedmont)", tone: "teal" },
          { id: "accounts", label: "New Commercial Accounts", value: "14", delta: "41.2% close", note: "Equipment + Treasury bundles", tone: "green" },
          { id: "pipeline", label: "Attributed Pipeline", value: "$3,840,000", delta: "48% of campaign", note: "Highest ROI regional channel", tone: "green" },
        ],
      },
      {
        id: "paid-ads",
        label: "Paid Local Ads",
        kpis: [
          { id: "leads", label: "Engaged Leads", value: "84", delta: "3.9% CTR", note: "LinkedIn + Google Local 25-mi", tone: "blue" },
          { id: "appointments", label: "Branch Appointments", value: "21", delta: "25.0% booking", note: "Net-new Charlotte CFOs & owners", tone: "teal" },
          { id: "accounts", label: "New Commercial Accounts", value: "8", delta: "38.1% close", note: "$315K avg initial facility", tone: "green" },
          { id: "pipeline", label: "Attributed Pipeline", value: "$2,520,000", delta: "31% of campaign", note: "$118 cost per booked branch visit", tone: "green" },
        ],
      },
      {
        id: "social",
        label: "Organic Social",
        kpis: [
          { id: "leads", label: "Engaged Leads", value: "42", delta: "6.4% eng rate", note: "LinkedIn, Instagram & X calendar", tone: "blue" },
          { id: "appointments", label: "Branch Appointments", value: "9", delta: "21.4% booking", note: "Office hours & suite preview posts", tone: "teal" },
          { id: "accounts", label: "New Commercial Accounts", value: "4", delta: "44.4% close", note: "High-trust local referrals", tone: "green" },
          { id: "pipeline", label: "Attributed Pipeline", value: "$1,120,000", delta: "14% of campaign", note: "Zero media spend", tone: "green" },
        ],
      },
      {
        id: "landing",
        label: "Direct Landing Page",
        kpis: [
          { id: "leads", label: "Engaged Leads", value: "19", delta: "18.4% conv", note: "Branch signage QR & local press", tone: "blue" },
          { id: "appointments", label: "Branch Appointments", value: "5", delta: "26.3% booking", note: "South End walk-up & QR bookings", tone: "teal" },
          { id: "accounts", label: "New Commercial Accounts", value: "2", delta: "40.0% close", note: "Commercial treasury signups", tone: "green" },
          { id: "pipeline", label: "Attributed Pipeline", value: "$560,000", delta: "7% of campaign", note: "Direct UTM attribution", tone: "green" },
        ],
      },
    ],
  },
  kpis: [
    { id: "leads", label: "Launch Leads Captured", value: "263", delta: "+44% vs target", note: "From 1,840 geo-eligible accounts", tone: "blue" },
    { id: "appointments", label: "Branch Appointments", value: "69", delta: "26.2% lead-to-appt", note: "Booked at 1420 South Mint St", tone: "teal" },
    { id: "accounts", label: "New Accounts Opened", value: "28", delta: "40.6% appt-to-acct", note: "Equipment finance & treasury", tone: "green" },
    { id: "pipeline", label: "Attributed Pipeline", value: "$8,040,000", delta: "18.4x ROAS", note: "Incl. $420K Piedmont Millwork", tone: "green" },
  ],
  breakdowns: [
    {
      id: "appointments-by-channel",
      title: "Branch Appointments & Attributed Pipeline by Channel",
      subtitle: "Unified HubSpot Campaign UTM attribution across all Charlotte launch assets",
      kind: "bars",
      badge: "69 appointments",
      badgeTone: "green",
      rows: [
        { label: "Geo-Targeted Launch Email", value: 34, displayValue: "34 visits", meta: "14 new accounts · $3.84M", tone: "green" },
        { label: "Paid Local Ads (LinkedIn & Google)", value: 21, displayValue: "21 visits", meta: "8 new accounts · $2.52M", tone: "blue" },
        { label: "Organic Social Calendar", value: 9, displayValue: "9 visits", meta: "4 new accounts · $1.12M", tone: "teal" },
        { label: "Branch Landing Page / QR Signage", value: 5, displayValue: "5 visits", meta: "2 new accounts · $560K", tone: "orange" },
      ],
    },
    {
      id: "branch-launch-funnel",
      title: "Charlotte Branch Launch Conversion Funnel",
      subtitle: "From non-balance geo-eligibility segment to booked visits and opened commercial accounts",
      kind: "funnel",
      badge: "28 new accounts",
      badgeTone: "teal",
      rows: [
        { label: "Geo-eligible segment reached (<= 25 mi)", value: 1840, displayValue: "1,840 accounts", pct: 100, tone: "blue" },
        { label: "Engaged launch email, local ad, or social post", value: 642, displayValue: "642 (34.9%)", pct: 58, tone: "teal" },
        { label: "Captured leads on branch landing page", value: 263, displayValue: "263 (14.3%)", pct: 36, tone: "amber" },
        { label: "In-branch consultations booked", value: 69, displayValue: "69 (26.2% of leads)", pct: 22, tone: "orange" },
        { label: "New commercial accounts opened", value: 28, displayValue: "28 ($8.04M)", pct: 12, tone: "green" },
      ],
    },
  ],
  table: {
    title: "Attributed Charlotte Branch Visits & New Commercial Accounts",
    subtitle: "Masked synthetic account references only (100% fictional Charlotte businesses)",
    columns: [
      { key: "account", label: "Business & Executive" },
      { key: "channel", label: "First-Touch Channel", tag: true },
      { key: "submarket", label: "Sub-Market" },
      { key: "status", label: "Account Status", tag: true },
      { key: "pipeline", label: "Facility / Pipeline", align: "right" },
    ],
    rows: [
      {
        id: "piedmont",
        linkTo: "/deals/dl-branch-piedmont",
        cells: {
          account: "Piedmont Millwork & Cabinetry · Tessa Halstead",
          channel: "Launch Email",
          submarket: "South End & Uptown (4.2 mi)",
          status: "Visit Booked",
          pipeline: "$420,000",
        },
        tones: { channel: "green", status: "blue" },
      },
      {
        id: "catawba",
        cells: {
          account: "Catawba Cold Logistics · Darius Okafor (ACCT-•••• 6104)",
          channel: "Paid Local Ads",
          submarket: "Gastonia & Rock Hill (14.8 mi)",
          status: "Account Opened",
          pipeline: "$685,000",
        },
        tones: { channel: "blue", status: "green" },
      },
      {
        id: "mecklenburg",
        cells: {
          account: "Mecklenburg Dental Partners · Claire Lindholm (ACCT-•••• 6119)",
          channel: "Launch Email",
          submarket: "Ballantyne & SouthPark (9.6 mi)",
          status: "Account Opened",
          pipeline: "$310,000",
        },
        tones: { channel: "green", status: "green" },
      },
      {
        id: "blueridge",
        cells: {
          account: "Blue Ridge Grading & Utilities · Rafael Mendoza (ACCT-•••• 6132)",
          channel: "Organic Social",
          submarket: "Lake Norman (19.3 mi)",
          status: "Account Opened",
          pipeline: "$540,000",
        },
        tones: { channel: "teal", status: "green" },
      },
      {
        id: "southpark",
        cells: {
          account: "SouthPark Imaging Associates · Kenji Takahashi",
          channel: "Direct Landing Page",
          submarket: "Ballantyne & SouthPark (8.4 mi)",
          status: "Visit Booked",
          pipeline: "$390,000",
        },
        tones: { channel: "orange", status: "blue" },
      },
    ],
  },
};

export const fintechSignalPipelineReport: AnalyticsReportSpec = {
  id: "fintech-signal-pipeline",
  title: "Signal-to-Pipeline Attribution",
  subtitle: "Fernhill Capital · Breeze Prospecting Agent financing pipeline sourced from loan servicing & market signals (90 days)",
  badge: "Breeze Prospecting ROI",
  badgeTone: "purple",
  demoIds: ["ai-prospecting"],
  backLink: { to: "/prospecting", label: "Back to Prospecting" },
  completeFlag: "ap.reportSeen",
  filter: {
    label: "Buying signal",
    defaultOptionId: "all",
    options: [
      { id: "all", label: "All signals (4)" },
      {
        id: "maturity",
        label: "Facility Maturity (Servicing)",
        kpis: [
          { id: "pipeline", label: "Maturity Signal Pipeline", value: "$3,250,000", delta: "6 active deals", note: "Incl. Tidewater $1.45M warehouse", tone: "green" },
          { id: "meetings", label: "CFO Meetings Booked", value: "12", delta: "41.4% reply rate", note: "Highest-converting RM signal", tone: "teal" },
          { id: "avg-deal", label: "Avg Financing Deal", value: "$541,667", delta: "+38% vs cold", note: "Repeat customers expand line size", tone: "blue" },
          { id: "credits", label: "Credits Consumed", value: "112", delta: "$29,018 / credit", note: "Servicing sync + buying-group drafts", tone: "purple" },
        ],
        table: {
          title: "Facility Maturity Signal Opportunities",
          columns: [
            { key: "account", label: "Account" },
            { key: "signal", label: "Trigger Signal", tag: true },
            { key: "contact", label: "Executive Lead" },
            { key: "stage", label: "Stage", tag: true },
            { key: "value", label: "Pipeline", align: "right" },
          ],
          rows: [
            {
              id: "tidewater-mat",
              linkTo: "/companies/co-tidewater",
              cells: {
                account: "Tidewater Cold Storage",
                signal: "Facility Maturity (74d)",
                contact: "Amara Nwosu (CFO)",
                stage: "Credit Review",
                value: "$1,450,000",
              },
              tones: { signal: "orange", stage: "blue" },
            },
            {
              id: "calloway-mat",
              linkTo: "/companies/co-calloway",
              cells: {
                account: "Calloway Aggregates",
                signal: "Crusher Maturity (7 mo)",
                contact: "Renee Castellan (CFO)",
                stage: "Proposal Sent",
                value: "$680,000",
              },
              tones: { signal: "orange", stage: "blue" },
            },
          ],
        },
        creditsOutcome: {
          extId: "credits-outcome-bridge",
          title: "HubSpot Credits & Outcomes Attribution (Maturity Signals)",
          badge: "Credits-to-Outcome Model",
          creditsUsed: 112,
          creditsAllocated: 500,
          primaryMetricLabel: "Maturity Pipeline",
          primaryMetricValue: "$3,250,000",
          secondaryMetricLabel: "Pipeline / Credit",
          secondaryMetricValue: "$29,018",
          summary: "Loan servicing maturity triggers yield the highest commercial financing return per HubSpot Credit.",
          breakdown: [
            { action: "Loan servicing maturity enrichment & buying-group lookup", credits: 48, outcomes: "29 accounts enriched · 84 finance leaders", sharePct: 43 },
            { action: "Compliance-reviewed role outreach drafts (CFO / Controller / Ops)", credits: 64, outcomes: "12 CFO meetings · $3.25M pipeline", sharePct: 57 },
          ],
        },
      },
      {
        id: "expansion",
        label: "Site & Fleet Expansion",
        kpis: [
          { id: "pipeline", label: "Expansion Pipeline", value: "$1,960,000", delta: "4 active deals", note: "New facilities, plants & contracts", tone: "green" },
          { id: "meetings", label: "CFO Meetings Booked", value: "8", delta: "34.8% reply rate", note: "Paired with master line options", tone: "teal" },
          { id: "avg-deal", label: "Avg Financing Deal", value: "$490,000", delta: "+24% vs cold", note: "Multi-delivery funding schedules", tone: "blue" },
          { id: "credits", label: "Credits Consumed", value: "74", delta: "$26,486 / credit", note: "Company news & hiring signals", tone: "purple" },
        ],
      },
      {
        id: "cfo-funding",
        label: "New CFO / Funding Event",
        kpis: [
          { id: "pipeline", label: "CFO / Funding Pipeline", value: "$1,420,000", delta: "3 active deals", note: "Post-raise CapEx & CFO appointments", tone: "green" },
          { id: "meetings", label: "CFO Meetings Booked", value: "6", delta: "31.6% reply rate", note: "First-90-day capital structure review", tone: "teal" },
          { id: "avg-deal", label: "Avg Financing Deal", value: "$473,333", delta: "+21% vs cold", note: "Lease vs EFA comparison decks", tone: "blue" },
          { id: "credits", label: "Credits Consumed", value: "58", delta: "$24,483 / credit", note: "Executive & funding research", tone: "purple" },
        ],
      },
      {
        id: "calculator",
        label: "Payment Calculator Intent",
        kpis: [
          { id: "pipeline", label: "Calculator Pipeline", value: "$890,000", delta: "3 active deals", note: "Repeat website payment runs", tone: "green" },
          { id: "meetings", label: "CFO Meetings Booked", value: "5", delta: "29.4% reply rate", note: "Indicative rate card follow-up", tone: "teal" },
          { id: "avg-deal", label: "Avg Financing Deal", value: "$296,667", delta: "+14% vs cold", note: "Fast-moving equipment quotes", tone: "blue" },
          { id: "credits", label: "Credits Consumed", value: "42", delta: "$21,190 / credit", note: "Website intent enrichment & drafts", tone: "purple" },
        ],
      },
    ],
  },
  kpis: [
    { id: "pipeline", label: "Signal-Sourced Pipeline", value: "$7,520,000", delta: "+42% QoQ", note: "16 active equipment finance deals", tone: "green" },
    { id: "meetings", label: "Executive Meetings Booked", value: "31", delta: "35.2% conversion", note: "Incl. Amara Nwosu (Tidewater CFO)", tone: "teal" },
    { id: "avg-deal", label: "Avg Signal Deal Size", value: "$470,000", delta: "+29% vs cold", note: "Multi-signal accounts close 2.1x larger", tone: "blue" },
    { id: "credits", label: "Credits Consumed", value: "286", delta: "$26,294 / credit", note: "Human-approved compliant outreach", tone: "purple" },
  ],
  breakdowns: [
    {
      id: "fintech-pipeline-by-signal",
      title: "Financing Pipeline by Buying Signal",
      subtitle: "Loan servicing maturity signals combined with Breeze news, executive, and web intent",
      kind: "bars",
      badge: "$7.52M total",
      badgeTone: "green",
      rows: [
        { label: "Facility maturity approaching (Loan Servicing)", value: 3250000, displayValue: "$3,250,000", meta: "6 deals · 12 meetings", tone: "orange" },
        { label: "Warehouse / site expansion announced", value: 1960000, displayValue: "$1,960,000", meta: "4 deals · 8 meetings", tone: "teal" },
        { label: "New CFO appointment / Series funding", value: 1420000, displayValue: "$1,420,000", meta: "3 deals · 6 meetings", tone: "purple" },
        { label: "Payment calculator high-intent visits", value: 890000, displayValue: "$890,000", meta: "3 deals · 5 meetings", tone: "blue" },
      ],
    },
    {
      id: "fintech-signal-funnel",
      title: "RM Signal-to-Pipeline Funnel",
      subtitle: "Every regulated outreach draft is human-approved before send",
      kind: "funnel",
      badge: "35.2% meeting rate",
      badgeTone: "purple",
      rows: [
        { label: "Accounts flagged by servicing & Breeze signals", value: 88, displayValue: "88 accounts", pct: 100, tone: "blue" },
        { label: "Buying groups reviewed & RM approved outreach", value: 71, displayValue: "71 (80.7%)", pct: 81, tone: "purple" },
        { label: "CFO / Controller financing meetings booked", value: 31, displayValue: "31 (35.2%)", pct: 35, tone: "teal" },
        { label: "Qualified financing deals opened in pipeline", value: 16, displayValue: "16 ($7.52M)", pct: 18, tone: "green" },
      ],
    },
  ],
  table: {
    title: "Top Signal-Sourced Commercial Financing Opportunities",
    subtitle: "Accounts triggered by servicing maturity, expansion news, CFO hire, or calculator intent",
    columns: [
      { key: "account", label: "Account" },
      { key: "signal", label: "Primary Signal", tag: true },
      { key: "contact", label: "Buying Group Lead" },
      { key: "stage", label: "Pipeline Stage", tag: true },
      { key: "value", label: "Pipeline", align: "right" },
    ],
    rows: [
      {
        id: "tidewater",
        linkTo: "/companies/co-tidewater",
        cells: {
          account: "Tidewater Cold Storage",
          signal: "Maturity + Expansion",
          contact: "Amara Nwosu (CFO)",
          stage: "Credit Review",
          value: "$1,450,000",
        },
        tones: { signal: "orange", stage: "blue" },
      },
      {
        id: "kelbrook",
        linkTo: "/deals/dl-kelbrook",
        cells: {
          account: "Kelbrook Waste Services",
          signal: "Municipal Expansion",
          contact: "Clyde Kelbrook (CFO)",
          stage: "Funded",
          value: "$810,000",
        },
        tones: { signal: "teal", stage: "green" },
      },
      {
        id: "lindenhurst",
        linkTo: "/deals/dl-lindenhurst",
        cells: {
          account: "Lindenhurst Imaging Associates",
          signal: "New CFO / Funding",
          contact: "Priyanka Nair (Managing Partner)",
          stage: "Documentation",
          value: "$1,150,000",
        },
        tones: { signal: "purple", stage: "blue" },
      },
      {
        id: "tallgrass",
        linkTo: "/deals/dl-tallgrass",
        cells: {
          account: "Tallgrass Grain Cooperative",
          signal: "Calculator Intent",
          contact: "Walt Jorgensen (GM)",
          stage: "Credit Review",
          value: "$540,000",
        },
        tones: { signal: "blue", stage: "blue" },
      },
    ],
  },
  creditsOutcome: {
    extId: "credits-outcome-bridge",
    title: "HubSpot Credits & Prospecting Outcomes Attribution",
    badge: "Credits-to-Outcome Model",
    creditsUsed: 286,
    creditsAllocated: 500,
    primaryMetricLabel: "Signal-Sourced Pipeline",
    primaryMetricValue: "$7,520,000",
    secondaryMetricLabel: "Pipeline / Credit",
    secondaryMetricValue: "$26,294",
    summary:
      "Ties Breeze Prospecting Agent credit spend directly to CFO meetings booked and commercial equipment financing pipeline created across Fernhill Capital.",
    breakdown: [
      { action: "Loan servicing maturity & expansion signal enrichment", credits: 112, outcomes: "6 maturity + 4 expansion deals · $5.21M", sharePct: 39 },
      { action: "Buying-group discovery (CFO, Controller, VP Operations)", credits: 94, outcomes: "213 executive stakeholders verified", sharePct: 33 },
      { action: "Compliance-reviewed role outreach drafts (human-approved)", credits: 80, outcomes: "31 executive meetings · 16 financing deals", sharePct: 28 },
    ],
  },
};

export const fintechGrowthReports: Record<string, AnalyticsReportSpec> = {
  "loan-application-conversion": loanApplicationConversionReport,
  "branch-launch-attribution": branchLaunchAttributionReport,
  "fintech-signal-pipeline": fintechSignalPipelineReport,
};
