import type { AnalyticsReportSpec } from "../analytics-types";
import { itServiceDeskReport } from "./customer-agent";
import { itIncidentMttrReport } from "./incident-comms";

/**
 * Shared declarative Analytics reports for Professional & IT Services (Quillon Technology Partners).
 * Rendered via `src/shell/analytics/lazy.tsx` (0 KB added to initial shell JS).
 *
 * Penguin marker boundary:
 * - `it-assessment-funnel` (I6): PURE native HubSpot report (0 Penguin markers)
 * - `it-tier-win-rate` (I2): PURE native HubSpot report (0 Penguin markers)
 * - `it-signal-pipeline` (I4): Native report + ONLY 1 Penguin marker on `creditsOutcome` (`credits-outcome-bridge`)
 * - `it-incident-mttr` (I5): PURE native HubSpot report (0 Penguin markers)
 * - `it-service-desk-analytics` (I1): Native report + ONLY 1 Penguin marker on `creditsOutcome` (`credits-outcome-bridge`)
 */

export const itAssessmentFunnelReport: AnalyticsReportSpec = {
  id: "it-assessment-funnel",
  title: "Assessments to Proposals to Deals",
  subtitle: "Quillon Technology Partners · 90-day security & IT assessment lead generation funnel by practice area",
  badge: "Marketing & Sales Funnel",
  badgeTone: "green",
  demoIds: ["lead-capture"],
  backLink: { to: "/tasks", label: "Back to Tasks" },
  completeFlag: "lc.reportSeen",
  filter: {
    label: "Practice area",
    defaultOptionId: "all",
    options: [
      { id: "all", label: "All practices (3)" },
      {
        id: "security",
        label: "Security & Compliance",
        kpis: [
          { id: "requests", label: "Assessment Requests", value: "38", delta: "+31% QoQ", note: "Incl. Alderbrook Family Medicine", tone: "blue" },
          { id: "completed", label: "Findings Reports Sent", value: "29", delta: "76.3% completion", note: "Avg 4.2 days from form to report", tone: "teal" },
          { id: "proposals", label: "Proposals Created", value: "21", delta: "72.4% of findings", note: "Direct quote handoff in HubSpot", tone: "green" },
          { id: "won", label: "Closed-Won ARR", value: "$684,000", delta: "11 deals won", note: "52.4% proposal-to-win rate", tone: "green" },
        ],
        breakdowns: [
          {
            id: "security-funnel",
            title: "Security & Compliance Assessment Funnel",
            subtitle: "Web form submission -> findings report -> proposal quote -> signed deal",
            kind: "funnel",
            badge: "28.9% end-to-end",
            badgeTone: "green",
            rows: [
              { label: "Free security assessments requested", value: 38, displayValue: "38 leads", pct: 100, tone: "blue" },
              { label: "Qualified & discovery call completed", value: 31, displayValue: "31 (81.6%)", pct: 82, tone: "teal" },
              { label: "Findings report emailed to prospect", value: 29, displayValue: "29 (76.3%)", pct: 76, tone: "amber" },
              { label: "Proposal quote generated from findings", value: 21, displayValue: "21 (55.3%)", pct: 55, tone: "orange" },
              { label: "Closed-won managed security deals", value: 11, displayValue: "11 ($684K ARR)", pct: 29, tone: "green" },
            ],
          },
        ],
      },
      {
        id: "managed-it",
        label: "Managed IT Services",
        kpis: [
          { id: "requests", label: "Assessment Requests", value: "26", delta: "+18% QoQ", note: "Mid-market 50–250 user firms", tone: "blue" },
          { id: "completed", label: "Findings Reports Sent", value: "19", delta: "73.1% completion", note: "Avg 5.1 days from form to report", tone: "teal" },
          { id: "proposals", label: "Proposals Created", value: "14", delta: "73.7% of findings", note: "Priced from Quillon tier rate card", tone: "green" },
          { id: "won", label: "Closed-Won ARR", value: "$512,000", delta: "6 deals won", note: "42.9% proposal-to-win rate", tone: "green" },
        ],
      },
      {
        id: "cloud",
        label: "Cloud & Projects",
        kpis: [
          { id: "requests", label: "Assessment Requests", value: "14", delta: "+12% QoQ", note: "Migrations & infrastructure reviews", tone: "blue" },
          { id: "completed", label: "Findings Reports Sent", value: "10", delta: "71.4% completion", note: "Scoped by Solutions Architects", tone: "teal" },
          { id: "proposals", label: "Proposals Created", value: "7", delta: "70.0% of findings", note: "SOW & milestone billing", tone: "green" },
          { id: "won", label: "Closed-Won Revenue", value: "$218,000", delta: "3 deals won", note: "42.9% proposal-to-win rate", tone: "green" },
        ],
      },
    ],
  },
  kpis: [
    { id: "requests", label: "Assessments Requested", value: "78", delta: "+24% QoQ", note: "Captured via Request an assessment form", tone: "blue" },
    { id: "completed", label: "Findings Reports Sent", value: "58", delta: "74.4% rate", note: "Emailed & logged on HubSpot timeline", tone: "teal" },
    { id: "proposals", label: "Proposals Generated", value: "42", delta: "72.4% of reports", note: "Avg $114K proposed annual value", tone: "green" },
    { id: "won", label: "Closed-Won Pipeline", value: "$1,414,000", delta: "20 deals won", note: "47.6% proposal-to-close conversion", tone: "green" },
  ],
  breakdowns: [
    {
      id: "assessment-to-deal-funnel",
      title: "Assessments -> Findings -> Proposals -> Signed Deals",
      subtitle: "90-day conversion across all Quillon assessment landing page leads",
      kind: "funnel",
      badge: "25.6% lead-to-win",
      badgeTone: "green",
      rows: [
        { label: "Free assessments requested (web form)", value: 78, displayValue: "78 leads", pct: 100, tone: "blue" },
        { label: "Scored >= 40 & routed to practice consultant", value: 64, displayValue: "64 (82.1%)", pct: 82, tone: "teal" },
        { label: "Assessment call & findings report emailed", value: 58, displayValue: "58 (74.4%)", pct: 74, tone: "amber" },
        { label: "Proposal quote created from findings", value: 42, displayValue: "42 (53.8%)", pct: 54, tone: "orange" },
        { label: "Deals signed (Closed Won)", value: 20, displayValue: "20 ($1.41M)", pct: 26, tone: "green" },
      ],
    },
    {
      id: "practice-conversion",
      title: "Proposal-to-Win Conversion by Practice Area",
      subtitle: "Security & compliance assessments convert fastest due to cyber-insurance deadlines",
      kind: "bars",
      badge: "3 practices",
      badgeTone: "teal",
      rows: [
        { label: "Security & Compliance", value: 52.4, displayValue: "52.4% win", meta: "11 won · $684K", pct: 95, tone: "green" },
        { label: "Managed IT Services", value: 42.9, displayValue: "42.9% win", meta: "6 won · $512K", pct: 78, tone: "teal" },
        { label: "Cloud & Infrastructure Projects", value: 42.9, displayValue: "42.9% win", meta: "3 won · $218K", pct: 78, tone: "blue" },
      ],
    },
  ],
  table: {
    title: "Recent Assessment-to-Proposal Opportunities",
    subtitle: "Tracked end-to-end from Request an assessment form to HubSpot Quote",
    columns: [
      { key: "account", label: "Account & Contact" },
      { key: "practice", label: "Practice", tag: true },
      { key: "score", label: "Lead Score", align: "right" },
      { key: "stage", label: "Funnel Stage", tag: true },
      { key: "amount", label: "Proposal Value", align: "right" },
    ],
    rows: [
      {
        id: "alderbrook",
        linkTo: "/quotes/q-lead-proposal",
        cells: {
          account: "Alderbrook Family Medicine · Priya Raman",
          practice: "Security & Compliance",
          score: "86",
          stage: "Proposal Sent",
          amount: "$133,980",
        },
        tones: { practice: "purple", stage: "blue" },
      },
      {
        id: "kingsmead",
        linkTo: "/deals/dl-kingsmead",
        cells: {
          account: "Kingsmead Wealth Advisors · Julian Kingsmead",
          practice: "Security & Compliance",
          score: "88",
          stage: "Signed",
          amount: "$37,080",
        },
        tones: { practice: "purple", stage: "green" },
      },
      {
        id: "pennywell",
        linkTo: "/deals/dl-pennywell",
        cells: {
          account: "Pennywell Home Health · Lionel Abara",
          practice: "Managed IT + Compliance",
          score: "82",
          stage: "Proposal Sent",
          amount: "$410,580",
        },
        tones: { practice: "teal", stage: "blue" },
      },
      {
        id: "pellham",
        linkTo: "/deals/dl-pellham",
        cells: {
          account: "Pellham Freight Brokers · Odette Pellham",
          practice: "Security & Compliance",
          score: "74",
          stage: "Findings Emailed",
          amount: "$7,500",
        },
        tones: { practice: "purple", stage: "amber" },
      },
    ],
  },
};

export const itTierWinRateReport: AnalyticsReportSpec = {
  id: "it-tier-win-rate",
  title: "Win Rate & Average Discount by Service Tier",
  subtitle: "Quillon Technology Partners · Managed services proposals across Essentials, Complete, and Complete Plus (12 months)",
  badge: "Sales & CPQ Reporting",
  badgeTone: "green",
  demoIds: ["guided-quote", "discount-approval"],
  backLink: { to: "/deals/dl-ashgrove", label: "Back to Proposal Deal" },
  filter: {
    label: "Service tier",
    defaultOptionId: "all",
    options: [
      { id: "all", label: "All tiers (3)" },
      {
        id: "essentials",
        label: "Essentials ($85/user)",
        kpis: [
          { id: "win-rate", label: "Essentials Win Rate", value: "31.4%", delta: "+2.1 pts YoY", note: "11 of 35 proposals signed", tone: "blue" },
          { id: "avg-discount", label: "Avg Discount", value: "4.2%", delta: "Lowest tier disc", note: "98% closed above 20% margin floor", tone: "green" },
          { id: "avg-arr", label: "Avg Proposal ARR", value: "$74,800", delta: "72 avg users", note: "Business-hours desk · 1–3 sites", tone: "neutral" },
          { id: "approval-time", label: "Approval Turnaround", value: "1.1 hrs", delta: "6% needed review", note: "Fastest quote-to-signature path", tone: "teal" },
        ],
        table: {
          title: "Essentials Tier Proposals",
          columns: [
            { key: "deal", label: "Account & Proposal" },
            { key: "tier", label: "Tier", tag: true },
            { key: "users", label: "Users", align: "right" },
            { key: "discount", label: "Discount", align: "right" },
            { key: "arr", label: "Annual Value", align: "right" },
            { key: "outcome", label: "Outcome", tag: true },
          ],
          rows: [
            {
              id: "fenwick",
              linkTo: "/deals/dl-fenwick",
              cells: { deal: "Fenwick Lane Pediatrics", tier: "Essentials", users: "70", discount: "0.0%", arr: "$88,200", outcome: "Signed" },
              tones: { tier: "blue", outcome: "green" },
            },
            {
              id: "tidemark",
              linkTo: "/deals/dl-tidemark",
              cells: { deal: "Tidemark Dental Studios", tier: "Essentials", users: "55", discount: "5.0%", arr: "$75,300", outcome: "Scoping" },
              tones: { tier: "blue", outcome: "amber" },
            },
          ],
        },
      },
      {
        id: "complete",
        label: "Complete ($125/user)",
        kpis: [
          { id: "win-rate", label: "Complete Win Rate", value: "46.2%", delta: "+6.8 pts YoY", note: "36 of 78 proposals signed", tone: "green" },
          { id: "avg-discount", label: "Avg Discount", value: "6.8%", delta: "-1.9 pts YoY", note: "94% closed above 20% margin floor", tone: "green" },
          { id: "avg-arr", label: "Avg Proposal ARR", value: "$162,400", delta: "128 avg users", note: "24x7 desk + onsite + MDR/Compliance", tone: "teal" },
          { id: "approval-time", label: "Approval Turnaround", value: "1.7 hrs", delta: "22% needed review", note: "Omar Haddad 1-click HubSpot approvals", tone: "teal" },
        ],
        table: {
          title: "Complete Tier Proposals",
          columns: [
            { key: "deal", label: "Account & Proposal" },
            { key: "tier", label: "Tier", tag: true },
            { key: "users", label: "Users", align: "right" },
            { key: "discount", label: "Discount", align: "right" },
            { key: "arr", label: "Annual Value", align: "right" },
            { key: "outcome", label: "Outcome", tag: true },
          ],
          rows: [
            {
              id: "ashgrove",
              linkTo: "/deals/dl-ashgrove",
              cells: { deal: "Ashgrove Design Partners", tier: "Complete", users: "100", discount: "8.0% (36m)", arr: "$161,592", outcome: "Active Proposal" },
              tones: { tier: "teal", outcome: "blue" },
            },
            {
              id: "wexcombe",
              linkTo: "/deals/dl-wexcombe-complete",
              cells: { deal: "Wexcombe Plastics", tier: "Complete", users: "140", discount: "4.0%", arr: "$238,160", outcome: "Signed" },
              tones: { tier: "teal", outcome: "green" },
            },
            {
              id: "pennywell",
              linkTo: "/deals/dl-pennywell",
              cells: { deal: "Pennywell Home Health", tier: "Complete", users: "210", discount: "8.0%", arr: "$410,580", outcome: "Proposal Sent" },
              tones: { tier: "teal", outcome: "blue" },
            },
          ],
        },
      },
      {
        id: "plus",
        label: "Complete Plus ($165/user)",
        kpis: [
          { id: "win-rate", label: "Complete Plus Win Rate", value: "52.9%", delta: "+7.4 pts YoY", note: "18 of 34 proposals signed", tone: "green" },
          { id: "avg-discount", label: "Avg Discount", value: "8.1%", delta: "-1.4 pts YoY", note: "89% closed above 20% margin floor", tone: "amber" },
          { id: "avg-arr", label: "Avg Proposal ARR", value: "$312,600", delta: "220 avg users", note: "Named engineer + quarterly planning", tone: "teal" },
          { id: "approval-time", label: "Approval Turnaround", value: "2.3 hrs", delta: "38% needed review", note: "Practice lead floor check enforced", tone: "blue" },
        ],
        table: {
          title: "Complete Plus Tier Proposals",
          columns: [
            { key: "deal", label: "Account & Proposal" },
            { key: "tier", label: "Tier", tag: true },
            { key: "users", label: "Users", align: "right" },
            { key: "discount", label: "Discount", align: "right" },
            { key: "arr", label: "Annual Value", align: "right" },
            { key: "outcome", label: "Outcome", tag: true },
          ],
          rows: [
            {
              id: "sablewood",
              linkTo: "/deals/dl-sablewood",
              cells: { deal: "Sablewood Furniture Company", tier: "Complete Plus", users: "280", discount: "8.0%", arr: "$636,080", outcome: "Contract Review" },
              tones: { tier: "purple", outcome: "blue" },
            },
            {
              id: "thornbury",
              linkTo: "/deals/dl-thornbury",
              cells: { deal: "Thornbury Legal Group (SOW)", tier: "Complete Plus", users: "150", discount: "12.0% (Approved)", arr: "$59,664", outcome: "Approval Flow" },
              tones: { tier: "purple", outcome: "amber" },
            },
          ],
        },
      },
    ],
  },
  kpis: [
    { id: "win-rate", label: "Blended Tier Win Rate", value: "44.2%", delta: "+5.4 pts YoY", note: "65 of 147 managed services proposals won", tone: "green" },
    { id: "avg-discount", label: "Avg Approved Discount", value: "6.4%", delta: "-1.8 pts YoY", note: "93.8% closed above 20% rate-card floor", tone: "green" },
    { id: "avg-arr", label: "Avg Proposal ARR", value: "$168,400", delta: "+14% YoY", note: "Complete & Complete Plus drive 84% of ARR", tone: "teal" },
    { id: "approval-time", label: "Practice Approval Speed", value: "1.8 hrs", delta: "-62% vs email", note: "Native HubSpot quote approval rules", tone: "blue" },
  ],
  breakdowns: [
    {
      id: "win-rate-by-tier",
      title: "Proposal Win Rate by Managed Service Tier",
      subtitle: "Higher tiers with 24x7 help desk and MDR win at higher rates than Essentials",
      kind: "bars",
      badge: "147 proposals",
      badgeTone: "green",
      rows: [
        { label: "Complete Plus ($165/user/mo)", value: 52.9, displayValue: "52.9% win", meta: "18 / 34 won", pct: 95, tone: "purple" },
        { label: "Complete ($125/user/mo)", value: 46.2, displayValue: "46.2% win", meta: "36 / 78 won", pct: 83, tone: "teal" },
        { label: "Essentials ($85/user/mo)", value: 31.4, displayValue: "31.4% win", meta: "11 / 35 won", pct: 56, tone: "blue" },
      ],
    },
    {
      id: "discount-by-tier",
      title: "Average Discount & Margin Floor Compliance by Tier",
      subtitle: "Rate-card approval rules keep average discounting well below the 10% threshold",
      kind: "bars",
      badge: "10% threshold",
      badgeTone: "amber",
      rows: [
        { label: "Essentials — 4.2% avg discount", value: 4.2, displayValue: "4.2% avg", meta: "98% above 20% floor", pct: 42, tone: "green" },
        { label: "Complete — 6.8% avg discount", value: 6.8, displayValue: "6.8% avg", meta: "94% above 20% floor", pct: 68, tone: "teal" },
        { label: "Complete Plus — 8.1% avg discount", value: 8.1, displayValue: "8.1% avg", meta: "89% above 20% floor", pct: 81, tone: "amber" },
      ],
    },
  ],
  table: {
    title: "Managed Services Proposals & Rate-Card Approvals",
    subtitle: "Active and closed proposals across Quillon's three service tiers",
    columns: [
      { key: "deal", label: "Account & Proposal" },
      { key: "tier", label: "Service Tier", tag: true },
      { key: "users", label: "Users", align: "right" },
      { key: "discount", label: "Discount", align: "right" },
      { key: "arr", label: "Proposal Value", align: "right" },
      { key: "outcome", label: "Stage", tag: true },
    ],
    rows: [
      {
        id: "ashgrove",
        linkTo: "/deals/dl-ashgrove",
        cells: { deal: "Ashgrove Design Partners", tier: "Complete", users: "100", discount: "8.0% (36m)", arr: "$175,452", outcome: "Guided Proposal" },
        tones: { tier: "teal", outcome: "blue" },
      },
      {
        id: "thornbury",
        linkTo: "/quotes/q-5241",
        cells: { deal: "Thornbury Legal Group (Migration SOW)", tier: "Complete Plus", users: "150", discount: "12.0% (Approval)", arr: "$59,664", outcome: "Practice Review" },
        tones: { tier: "purple", outcome: "amber" },
      },
      {
        id: "sablewood",
        linkTo: "/deals/dl-sablewood",
        cells: { deal: "Sablewood Furniture Company", tier: "Complete Plus", users: "280", discount: "8.0%", arr: "$636,080", outcome: "Contract Review" },
        tones: { tier: "purple", outcome: "blue" },
      },
      {
        id: "wexcombe",
        linkTo: "/deals/dl-wexcombe-complete",
        cells: { deal: "Wexcombe Plastics", tier: "Complete", users: "140", discount: "4.0%", arr: "$238,160", outcome: "Signed" },
        tones: { tier: "teal", outcome: "green" },
      },
      {
        id: "fenwick",
        linkTo: "/deals/dl-fenwick",
        cells: { deal: "Fenwick Lane Pediatrics", tier: "Essentials", users: "70", discount: "0.0%", arr: "$88,200", outcome: "Signed" },
        tones: { tier: "blue", outcome: "green" },
      },
    ],
  },
};

export const itSignalPipelineReport: AnalyticsReportSpec = {
  id: "it-signal-pipeline",
  title: "Pipeline by Technology Signal Type",
  subtitle: "Quillon Technology Partners · Breeze Prospecting Agent pipeline sourced from PSA asset & account signals (90 days)",
  badge: "Breeze Prospecting ROI",
  badgeTone: "purple",
  demoIds: ["ai-prospecting"],
  backLink: { to: "/prospecting", label: "Back to Prospecting" },
  completeFlag: "ap.reportSeen",
  filter: {
    label: "Technology signal",
    defaultOptionId: "all",
    options: [
      { id: "all", label: "All signals (4)" },
      {
        id: "eos",
        label: "EOS devices",
        kpis: [
          { id: "pipeline", label: "EOS Signal Pipeline", value: "$462,000", delta: "5 active deals", note: "Incl. Oriel Park 22-device refresh", tone: "green" },
          { id: "meetings", label: "Meetings Booked", value: "10", delta: "38.5% reply rate", note: "Highest-converting PSA asset signal", tone: "teal" },
          { id: "avg-deal", label: "Avg Deal Size", value: "$92,400", delta: "+31% vs cold", note: "Hardware + managed network bundle", tone: "blue" },
          { id: "credits", label: "Credits Used", value: "104", delta: "$4,442 / credit", note: "PSA asset scan + role outreach", tone: "purple" },
        ],
        table: {
          title: "End-of-Support Device Signal Opportunities",
          columns: [
            { key: "account", label: "Account" },
            { key: "signal", label: "Technology Signal", tag: true },
            { key: "contact", label: "Executive Contact" },
            { key: "stage", label: "Stage", tag: true },
            { key: "value", label: "Pipeline", align: "right" },
          ],
          rows: [
            {
              id: "oriel-eos",
              linkTo: "/companies/co-orielpark",
              cells: {
                account: "Oriel Park Senior Living",
                signal: "EOS Devices (22)",
                contact: "Ingrid Solberg (CIO)",
                stage: "Scoping",
                value: "$194,000",
              },
              tones: { signal: "orange", stage: "blue" },
            },
            {
              id: "ravensworth-eos",
              linkTo: "/deals/dl-ravensworth",
              cells: {
                account: "Ravensworth Building Supply",
                signal: "EOS Firewalls (7)",
                contact: "Freya Ravensworth (VP Ops)",
                stage: "Proposal Sent",
                value: "$128,000",
              },
              tones: { signal: "orange", stage: "blue" },
            },
          ],
        },
        creditsOutcome: {
          extId: "credits-outcome-bridge",
          title: "HubSpot Credits & Outcomes Attribution (EOS Signals)",
          badge: "Credits-to-Outcome Model",
          creditsUsed: 104,
          creditsAllocated: 500,
          primaryMetricLabel: "EOS Signal Pipeline",
          primaryMetricValue: "$462,000",
          secondaryMetricLabel: "Pipeline / Credit",
          secondaryMetricValue: "$4,442",
          summary: "PSA end-of-support triggers deliver the highest pipeline return per HubSpot Credit across all MSP signals.",
          breakdown: [
            { action: "PSA EOS asset enrichment & buying-group lookup", credits: 46, outcomes: "26 accounts enriched · 74 stakeholders", sharePct: 44 },
            { action: "Role-tailored refresh outreach drafts (CIO / IT / Procurement)", credits: 58, outcomes: "10 meetings booked · $462K pipeline", sharePct: 56 },
          ],
        },
      },
      {
        id: "cio",
        label: "New CIO / IT leadership",
        kpis: [
          { id: "pipeline", label: "New CIO Pipeline", value: "$298,000", delta: "4 active deals", note: "First-90-day executive refresh plans", tone: "green" },
          { id: "meetings", label: "Meetings Booked", value: "7", delta: "33.3% reply rate", note: "Exec briefing with Solutions Architect", tone: "teal" },
          { id: "avg-deal", label: "Avg Deal Size", value: "$74,500", delta: "+18% vs cold", note: "Multi-year managed IT & security", tone: "blue" },
          { id: "credits", label: "Credits Used", value: "76", delta: "$3,921 / credit", note: "Executive signal research & drafts", tone: "purple" },
        ],
      },
      {
        id: "acquisition",
        label: "Acquisition / expansion",
        kpis: [
          { id: "pipeline", label: "Acquisition Pipeline", value: "$246,000", delta: "3 active deals", note: "New sites & branch rollouts", tone: "green" },
          { id: "meetings", label: "Meetings Booked", value: "5", delta: "29.4% reply rate", note: "Network standardization proposals", tone: "teal" },
          { id: "avg-deal", label: "Avg Deal Size", value: "$82,000", delta: "+24% vs cold", note: "Includes multi-site onboarding", tone: "blue" },
          { id: "credits", label: "Credits Used", value: "62", delta: "$3,968 / credit", note: "M&A monitoring & outreach", tone: "purple" },
        ],
      },
      {
        id: "renewal",
        label: "Contract renewal",
        kpis: [
          { id: "pipeline", label: "Renewal Signal Pipeline", value: "$178,000", delta: "2 active deals", note: "120–150 day renewal expansion", tone: "green" },
          { id: "meetings", label: "Meetings Booked", value: "4", delta: "30.8% reply rate", note: "Paired with security add-on upsell", tone: "teal" },
          { id: "avg-deal", label: "Avg Deal Size", value: "$89,000", delta: "+19% vs cold", note: "Complete -> Complete Plus upgrades", tone: "blue" },
          { id: "credits", label: "Credits Used", value: "44", delta: "$4,045 / credit", note: "PSA renewal signal triggers", tone: "purple" },
        ],
      },
    ],
  },
  kpis: [
    { id: "pipeline", label: "Signal-Sourced Pipeline", value: "$1,184,000", delta: "+38% QoQ", note: "14 active managed IT & refresh deals", tone: "green" },
    { id: "meetings", label: "Meetings Booked", value: "26", delta: "31.7% conversion", note: "Incl. Ingrid Solberg (Oriel Park CIO)", tone: "teal" },
    { id: "avg-deal", label: "Avg Signal Deal Size", value: "$84,571", delta: "+22% vs cold", note: "Multi-signal accounts close 2.3x larger", tone: "blue" },
    { id: "credits", label: "Credits Consumed", value: "286", delta: "$4,140 / credit", note: "Tracked via Credits-to-Outcome model", tone: "purple" },
  ],
  breakdowns: [
    {
      id: "pipeline-by-signal",
      title: "Pipeline Value by Technology Signal Type",
      subtitle: "PSA end-of-support inventory + Breeze account intelligence across 90 days",
      kind: "bars",
      badge: "$1.18M total",
      badgeTone: "green",
      rows: [
        { label: "End-of-support network devices (PSA)", value: 462000, displayValue: "$462,000", meta: "5 deals · 10 meetings", tone: "orange" },
        { label: "New CIO / IT leadership hire", value: 298000, displayValue: "$298,000", meta: "4 deals · 7 meetings", tone: "purple" },
        { label: "Site acquisition / branch expansion", value: 246000, displayValue: "$246,000", meta: "3 deals · 5 meetings", tone: "teal" },
        { label: "Upcoming managed contract renewal", value: 178000, displayValue: "$178,000", meta: "2 deals · 4 meetings", tone: "blue" },
      ],
    },
    {
      id: "signal-to-deal-funnel",
      title: "Technology Signal to Pipeline Funnel",
      subtitle: "Human-in-the-loop approval before every Breeze outreach send",
      kind: "funnel",
      badge: "31.7% meeting rate",
      badgeTone: "purple",
      rows: [
        { label: "Accounts flagged by PSA & Breeze signals", value: 82, displayValue: "82 accounts", pct: 100, tone: "blue" },
        { label: "Buying groups reviewed & outreach approved by AE", value: 64, displayValue: "64 (78.0%)", pct: 78, tone: "purple" },
        { label: "Discovery / refresh meetings booked", value: 26, displayValue: "26 (31.7%)", pct: 32, tone: "teal" },
        { label: "Qualified deals opened in Services pipeline", value: 14, displayValue: "14 ($1.18M)", pct: 17, tone: "green" },
      ],
    },
  ],
  table: {
    title: "Top Signal-Sourced Managed IT Opportunities",
    subtitle: "Accounts triggered by EOS hardware, executive change, acquisition, or renewal",
    columns: [
      { key: "account", label: "Account" },
      { key: "signal", label: "Primary Signal", tag: true },
      { key: "contact", label: "Buying Group Lead" },
      { key: "stage", label: "Deal Stage", tag: true },
      { key: "value", label: "Pipeline", align: "right" },
    ],
    rows: [
      {
        id: "oriel-park",
        linkTo: "/companies/co-orielpark",
        cells: {
          account: "Oriel Park Senior Living",
          signal: "EOS Devices + New CIO",
          contact: "Ingrid Solberg (CIO)",
          stage: "Scoping",
          value: "$194,000",
        },
        tones: { signal: "orange", stage: "blue" },
      },
      {
        id: "pennywell",
        linkTo: "/deals/dl-pennywell",
        cells: {
          account: "Pennywell Home Health",
          signal: "Compliance Hire",
          contact: "Lionel Abara (COO)",
          stage: "Proposal Sent",
          value: "$410,580",
        },
        tones: { signal: "purple", stage: "blue" },
      },
      {
        id: "ravensworth",
        linkTo: "/deals/dl-ravensworth",
        cells: {
          account: "Ravensworth Building Supply",
          signal: "Branch Expansion",
          contact: "Freya Ravensworth (VP Ops)",
          stage: "Proposal Sent",
          value: "$128,000",
        },
        tones: { signal: "teal", stage: "blue" },
      },
      {
        id: "calderwood",
        linkTo: "/deals/dl-calderwood",
        cells: {
          account: "Calderwood Civil Engineering",
          signal: "Contract Renewal",
          contact: "August Calderwood (Principal)",
          stage: "Contract Review",
          value: "$214,000",
        },
        tones: { signal: "blue", stage: "green" },
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
    primaryMetricValue: "$1,184,000",
    secondaryMetricLabel: "Pipeline / Credit",
    secondaryMetricValue: "$4,140",
    summary: "Connects Breeze Prospecting Agent credit spend directly to technology-signal meetings booked and managed IT pipeline created.",
    breakdown: [
      { action: "PSA EOS asset & renewal signal enrichment", credits: 104, outcomes: "5 EOS + 2 renewal deals · $640K pipeline", sharePct: 36 },
      { action: "Buying-group discovery (CIO, IT Director, Procurement)", credits: 96, outcomes: "194 stakeholders verified across 64 accounts", sharePct: 34 },
      { action: "Role-tailored outreach drafting (human-approved)", credits: 86, outcomes: "26 executive meetings · 14 qualified deals", sharePct: 30 },
    ],
  },
};

export const professionalServicesReports: Record<string, AnalyticsReportSpec> = {
  "it-service-desk-analytics": itServiceDeskReport,
  "it-incident-mttr": itIncidentMttrReport,
  "it-assessment-funnel": itAssessmentFunnelReport,
  "it-tier-win-rate": itTierWinRateReport,
  "it-signal-pipeline": itSignalPipelineReport,
};
