import type { AnalyticsReportSpec, PqlTrialConfig } from "../types";

/**
 * SaaS #2 (`pql-trial-prospecting`): Product-qualified leads from free trials.
 * Demo company: Lumenstack (fictional B2B SaaS analytics platform).
 * Trial prospect: Alderwave Logistics (100% fictional, `*.example` addresses).
 *
 * Strict Penguin marker boundary:
 * - `by: "penguin"` ONLY on `product-usage-sync` (Product Usage Event Sync)
 *   and `credits-outcome-bridge` (HubSpot Credits & Outcomes Attribution).
 * - ZERO Penguin markers on native contact timeline, lead scoring, Breeze Prospecting Agent,
 *   buying group, outreach approval, meeting booking, deal creation, or native Analytics report.
 */
export const pqlTrialConfig: PqlTrialConfig = {
  companyId: "co-alderwave",
  contactId: "ct-nadia",
  signal: {
    id: "sg-alderwave-pql",
    companyId: "co-alderwave",
    title: "Free-trial PQL milestone: 5 teammates + Snowflake connected",
    source: "Product Usage Event Sync",
    at: "@-5mi",
    strength: "High",
    summary: "Alderwave Logistics invited 5 teammates and connected their Snowflake Production DW on Day 6 of a 14-day free trial. Lead score jumped from 42 to 88 (PQL).",
    hero: true,
  },
  initialScore: 42,
  pqlScore: 88,
  initialLifecycle: "Lead",
  pqlLifecycle: "Marketing Qualified Lead",
  pqlLeadStatus: "Product Qualified (PQL)",
  trialApp: {
    workspaceName: "Alderwave Logistics — Free Trial",
    workspaceUrl: "https://app.lumenstack.example/workspaces/alderwave-trial/activation",
    planLabel: "14-Day Free Trial · Day 6",
    trialDayLabel: "Day 6 of 14 · 6 active users",
    headline: "Team activation milestone reached inside the free trial",
    intro:
      "Nadia Osei signed up for a self-serve Lumenstack trial six days ago. Her team just crossed the two highest-converting product milestones: inviting five teammates and connecting their production Snowflake warehouse.",
    milestones: [
      {
        id: "ms-workspace",
        label: "Workspace created & sample dashboards explored",
        detail: "Nadia Osei launched the regional freight KPI template on Day 1.",
        status: "done",
        metric: "Day 1",
      },
      {
        id: "ms-invites",
        label: "Invited 5 teammates across Ops & Engineering",
        detail: "Operations analysts, logistics leads, and data engineers joined the shared trial workspace.",
        status: "trigger",
        metric: "5 / 5 seats",
      },
      {
        id: "ms-datasource",
        label: "Connected first production data source (Snowflake)",
        detail: "Live sync active on SNOWFLAKE_PROD_FREIGHT (1.4M rows indexed, 3 scheduled dashboards).",
        status: "trigger",
        metric: "Snowflake DW",
      },
      {
        id: "ms-dashboards",
        label: "Shared executive dashboards published",
        detail: "3 recurring Monday morning dispatch & margin views shared internally.",
        status: "done",
        metric: "3 active",
      },
    ],
    ctaLabel: "Complete trial milestone & stream to HubSpot",
    syncCard: {
      extId: "product-usage-sync",
      title: "Product Usage Event Sync",
      badge: "Telemetry -> HubSpot",
      subtitle:
        "Custom Penguin event bridge streams in-app trial activation milestones into HubSpot contact timelines, lead scoring properties, and Breeze Prospecting signals.",
      eventName: "trial.milestone.pql_reached",
      fields: [
        { label: "Event stream", value: "Lumenstack Telemetry -> HubSpot CRM" },
        { label: "Workspace ID", value: "ws_alderwave_trial_092" },
        { label: "Milestone rule", value: ">= 5 teammates + live warehouse source" },
        { label: "Lead score delta", value: "42 -> 88 (+46 pts · PQL threshold 80)" },
      ],
      footnote: "Native HubSpot lead scoring and Breeze Prospecting Agent react automatically once the custom usage event lands.",
    },
  },
  prospecting: {
    companyId: "co-alderwave",
    signalDetail: {
      fed: {
        extId: "product-usage-sync",
        title: "Product Usage Event Sync",
        source: "Free-trial telemetry",
        detail:
          "Alderwave Logistics crossed Lumenstack's PQL activation threshold on Day 6: 6 active trial users (5 teammates invited) and a live Snowflake Production DW connection.",
        bars: [
          { label: "Day 1 trial sign-up (single user)", value: 1, unit: "active user" },
          { label: "Day 4 dashboard setup", value: 3, unit: "active users" },
          { label: "Day 6 PQL milestone (Snowflake + 5 invites)", value: 6, unit: "active users", now: true },
        ],
        footnote: "Streamed from Lumenstack product telemetry via Penguin Product Usage Event Sync.",
      },
      native: {
        title: "Lead score promoted to 88 (PQL) & pricing views",
        source: "HubSpot CRM & Breeze",
        detail:
          "HubSpot native lead scoring promoted Nadia Osei from 42 to 88 (Product Qualified). Two Alderwave contacts also visited the Growth & SSO pricing page in the past 24 hours.",
        footnote: "Detected natively by HubSpot lead scoring and Breeze Prospecting Agent.",
      },
    },
    whyNow: {
      headline: "Alderwave Logistics hit PQL activation in 6 days with Snowflake live and 6 active trial users",
      points: [
        {
          label: "Team activation",
          detail: "Nadia Osei invited 5 teammates across operations and engineering, hitting 6 active trial users in week one.",
          source: "Product Usage Event Sync",
        },
        {
          label: "Production data live",
          detail: "Connected Snowflake Production DW (1.4M rows) and scheduled 3 recurring Monday dispatch dashboards.",
          source: "Product Usage Event Sync",
        },
        {
          label: "PQL score threshold",
          detail: "HubSpot lead score rose from 42 to 88 (above the 80-point PQL threshold) with repeat Growth pricing visits.",
          source: "HubSpot Lead Scoring",
        },
        {
          label: "Buying committee ready",
          detail: "Breeze identified Engineering and Finance decision-makers needed to convert from trial to an annual Growth plan.",
          source: "Breeze Research",
        },
      ],
    },
    buyingGroup: [
      {
        id: "bg-nadia",
        name: "Nadia Osei",
        title: "Head of Data Operations",
        role: "Trial Champion",
        email: "nadia.osei@alderwavelogistics.example",
        contactId: "ct-nadia",
        why: "Started the free trial, connected Snowflake Production DW, and invited 5 teammates this week.",
      },
      {
        id: "bg-graham",
        name: "Graham Kowalski",
        title: "VP of Engineering",
        role: "Technical Buyer",
        email: "graham.kowalski@alderwavelogistics.example",
        contactId: null,
        why: "Owns Snowflake governance, SSO/SCIM requirements, and production BI vendor sign-off.",
      },
      {
        id: "bg-sonia",
        name: "Sonia Subramanian",
        title: "Director of Finance & Procurement",
        role: "Budget Holder",
        email: "sonia.subramanian@alderwavelogistics.example",
        contactId: null,
        why: "Reviews annual software agreements over $25K and approves Growth plan budgets.",
      },
    ],
    drafts: {
      "bg-nadia": [
        {
          tone: "Consultative",
          subject: "Your Snowflake dashboards are live — quick path to Growth before trial ends",
          body: "Hi Nadia,\n\nSaw that your team already connected Snowflake and brought five colleagues into the Alderwave workspace in your first week — that is faster than almost any trial we see.\n\nBefore your 14-day trial wraps up, I would love to spend 20 minutes helping you lock in scheduled Monday exports, SSO for the wider ops team, and clean migration of the three dashboards you already built into a 50-seat Growth plan.\n\nI included my calendar link below if Tuesday or Thursday works for you and Graham.\n\nBest,\nJordan Avery\nAccount Executive, Lumenstack",
        },
        {
          tone: "Direct",
          subject: "Keeping your Alderwave trial dashboards running after Day 14",
          body: "Hi Nadia,\n\nYour team hit full activation on Day 6 with Snowflake synced and six active users. On Growth, those exact dashboards roll straight into production with zero rework plus annual seat pricing.\n\nCan we grab 20 minutes this week to map out your seat count and SSO setup?\n\nBest,\nJordan Avery\nLumenstack",
        },
        {
          tone: "Brief",
          subject: "Alderwave trial + Snowflake setup",
          body: "Hi Nadia,\n\nGreat seeing Snowflake live in your Lumenstack trial. Want to grab 20 minutes to review Growth plan options and keep your 3 scheduled dashboards running seamlessly?\n\nJordan Avery\nLumenstack",
        },
      ],
      "bg-graham": [
        {
          tone: "Consultative",
          subject: "Snowflake + SSO architecture for Alderwave's Lumenstack trial",
          body: "Hi Graham,\n\nNadia Osei and five members of the Alderwave operations and data team connected Snowflake to a Lumenstack trial workspace this week and published three live dispatch dashboards.\n\nAhead of a production rollout, engineering leaders usually want to review our read-only Snowflake service-role permissions, Okta SSO/SCIM provisioning, and audit log. Happy to walk through our security pack in 20 minutes with you and Nadia.\n\nBest,\nJordan Avery\nAccount Executive, Lumenstack",
        },
        {
          tone: "Direct",
          subject: "Security & SSO review for Alderwave's active Lumenstack trial",
          body: "Hi Graham,\n\nYour team already has Snowflake streaming into Lumenstack during their free trial. I can share our SOC 2 report, Snowflake role docs, and Okta SCIM guide ahead of a short technical review.\n\nWould Tuesday or Thursday work for a 20-minute walkthrough?\n\nBest,\nJordan Avery",
        },
        {
          tone: "Brief",
          subject: "Lumenstack security overview for Alderwave",
          body: "Hi Graham,\n\nNadia's team has Snowflake connected in their Lumenstack trial. Want me to send over our SSO/SCIM and warehouse permissions overview?\n\nJordan Avery\nLumenstack",
        },
      ],
      "bg-sonia": [
        {
          tone: "Consultative",
          subject: "Predictable annual pricing as Alderwave moves from free trial to Growth",
          body: "Hi Sonia,\n\nI work with Nadia Osei's data operations team at Lumenstack, where six Alderwave users have connected Snowflake in a free trial this week.\n\nIf the team moves forward before trial expiry, we can bundle 50 Growth seats with the Security pack at locked annual pricing so your Q2 forecast stays predictable. Happy to share a one-page pricing summary ahead of our call with Nadia.\n\nBest,\nJordan Avery\nAccount Executive, Lumenstack",
        },
        {
          tone: "Direct",
          subject: "Lumenstack Growth plan budget summary for Alderwave",
          body: "Hi Sonia,\n\nNadia's team is actively piloting Lumenstack on live Snowflake data. I put together a straightforward 50-seat Growth + Security pack estimate ($51,000/yr) in case you are reviewing Q2 software spend.\n\nHappy to join a quick call with Nadia this week.\n\nJordan Avery",
        },
        {
          tone: "Brief",
          subject: "Introduction: Lumenstack trial at Alderwave",
          body: "Hi Sonia,\n\nIntroducing myself as Nadia's team wraps up their Lumenstack free trial. Let me know if a one-page annual pricing summary would help for budget planning.\n\nJordan Avery\nLumenstack",
        },
      ],
    },
    followUp: { title: "Follow up on Alderwave Logistics PQL trial conversion", dueInDays: 2 },
    offPlatformMeeting: {
      inboxEmail: "nadia.osei@alderwavelogistics.example",
      recipientName: "Nadia Osei",
      recipientTitle: "Head of Data Operations",
      practiceName: "Alderwave Logistics",
      senderName: "Jordan Avery",
      senderTitle: "Account Executive, Lumenstack",
      meetingTitle: "Alderwave Trial-to-Growth Architecture & Pricing Review",
      meetingLocation: "Zoom (auto-generated via HubSpot Meetings)",
      meetingDuration: "20 min · Trial Conversion",
      bookingUrl: "https://meetings.lumenstack.example/jordan-avery/alderwave-pql-review",
      agenda: [
        "Migrate all 3 live Snowflake trial dashboards to production Growth workspace",
        "Confirm 50 Growth seats + Security pack (Okta SSO & audit log)",
        "Review annual billing terms before Day 14 trial expiry",
      ],
      slots: [
        { id: "slot-1", day: "Tue, Nov 24", time: "10:30 AM", tz: "ET" },
        { id: "slot-2", day: "Wed, Nov 25", time: "2:00 PM", tz: "ET" },
        { id: "slot-3", day: "Thu, Nov 26", time: "11:00 AM", tz: "ET" },
      ],
      defaultSlotId: "slot-1",
      channelLabel: "Prospect Email Inbox & HubSpot Meetings",
      inboxHeader: "Alderwave Mail",
      inboxBreadcrumb: "Inbox › Lumenstack Free Trial Follow-up",
      openButtonLabel: "Open prospect inbox & book meeting",
      bookedButtonLabel: "View booked demo & deal",
      slotPrompt: "Pick a time for your trial-to-paid review",
      confirmButtonLabel: "Book meeting & open deal",
      confirmedHeadline: "Trial conversion meeting booked",
      reportButtonLabel: "View trial-to-paid report",
      createsDeal: {
        id: "dl-alderwave-pql",
        name: "Alderwave Logistics: Growth Plan (Trial Conversion)",
        amount: 51000,
        stage: "qualified",
        closeInDays: 14,
        type: "New business",
        lineItems: [
          { sku: "LS-GRO-SEAT", qty: 50 },
          { sku: "LS-SEC-PACK", qty: 1 },
        ],
      },
    },
    reportId: "trial-to-paid",
    reportButtonLabel: "View trial-to-paid report",
  },
};

/**
 * Shared Analytics report (`/reports/trial-to-paid`): Trial-to-paid conversion by source
 * + custom Penguin HubSpot Credits & Outcomes attribution card.
 *
 * Strict Penguin marker boundary:
 * - Native KPI strip, funnel/source charts, filter pills, and detail table carry ZERO Penguin markers.
 * - ONLY `creditsOutcome` (`credits-outcome-bridge`, `by: "penguin"`) carries a pulsing Penguin pin.
 */
export const trialToPaidReport: AnalyticsReportSpec = {
  id: "trial-to-paid",
  title: "Trial-to-Paid Conversion by Source",
  subtitle: "Lumenstack self-serve free trials promoted to PQL via Product Usage Event Sync and converted via Breeze Prospecting · Last 30 days",
  badge: "PQL Conversion",
  badgeTone: "green",
  demoId: "pql-trial-prospecting",
  backLink: { to: "/prospecting", label: "Back to Prospecting" },
  completeFlag: "pql.reportSeen",
  filter: {
    label: "Acquisition source",
    defaultOptionId: "all",
    options: [
      { id: "all", label: "All sources" },
      {
        id: "organic",
        label: "Organic & Docs",
        kpis: [
          { id: "trials", label: "Active Free Trials", value: "214", delta: "+18% MoM", note: "Self-serve signups from docs & search", tone: "blue" },
          { id: "pqls", label: "PQLs Promoted", value: "68", delta: "31.8% PQL rate", note: ">= 5 invites + live data source", tone: "teal" },
          { id: "conv", label: "Trial-to-Paid Conv.", value: "36.8%", delta: "+9.4 pts", note: "25 paid Growth / Enterprise deals", tone: "green" },
          { id: "pipeline", label: "PQL Pipeline Created", value: "$1.14M", delta: "+31% MoM", note: "Includes Alderwave Logistics ($51K)", tone: "green" },
        ],
        breakdowns: [
          {
            id: "funnel",
            title: "Organic & Docs Trial-to-Paid Funnel",
            kind: "funnel",
            badge: "36.8% PQL->Paid",
            badgeTone: "green",
            rows: [
              { label: "Free Trial Signups", value: 214, displayValue: "214", pct: 100 },
              { label: "Product Milestone Hit (PQL)", value: 68, displayValue: "68", meta: "31.8%", pct: 32 },
              { label: "Breeze Buying-Group Outreach", value: 61, displayValue: "61", meta: "90% of PQLs", pct: 29 },
              { label: "Conversion Meetings Booked", value: 39, displayValue: "39", meta: "57% of PQLs", pct: 18 },
              { label: "Paid Deals Opened / Won", value: 25, displayValue: "25", meta: "36.8% conv.", pct: 12 },
            ],
          },
          {
            id: "by-source",
            title: "Conversion Rate by Organic Entry Point",
            kind: "bars",
            rows: [
              { label: "Snowflake Integration Docs", value: 44, displayValue: "44.0%", meta: "11 deals", tone: "green" },
              { label: "Interactive SQL Playground", value: 35, displayValue: "35.2%", meta: "9 deals", tone: "teal" },
              { label: "Template Gallery SEO", value: 29, displayValue: "29.4%", meta: "5 deals", tone: "blue" },
            ],
          },
        ],
        table: {
          title: "Organic & Docs Converted Trial Accounts",
          columns: [
            { key: "account", label: "Account" },
            { key: "source", label: "Trial source", tag: true },
            { key: "milestone", label: "PQL Milestone" },
            { key: "score", label: "PQL Score", align: "right" },
            { key: "status", label: "Outcome", tag: true },
            { key: "arr", label: "Deal ARR", align: "right" },
          ],
          rows: [
            {
              id: "alderwave",
              linkTo: "/companies/co-alderwave",
              cells: {
                account: "Alderwave Logistics",
                source: "Organic & Docs",
                milestone: "5 invites + Snowflake DW",
                score: "88",
                status: "Deal opened",
                arr: "$51,000",
              },
              tones: { source: "teal", status: "green" },
            },
            {
              id: "wrenfield",
              linkTo: "/companies/co-wrenfield",
              cells: {
                account: "Wrenfield Robotics",
                source: "Organic & Docs",
                milestone: "6 invites + Postgres DW",
                score: "84",
                status: "Closed Won",
                arr: "$38,400",
              },
              tones: { source: "teal", status: "green" },
            },
          ],
        },
        creditsOutcome: {
          extId: "credits-outcome-bridge",
          title: "HubSpot Credits & Outcomes Attribution",
          badge: "Organic PQL Cohort",
          creditsUsed: 186,
          creditsAllocated: 600,
          primaryMetricLabel: "Pipeline / 1K credits",
          primaryMetricValue: "$6.1M",
          secondaryMetricLabel: "Credits / paid deal",
          secondaryMetricValue: "7.4 cr",
          summary: "Connects Breeze Prospecting Agent enrichment and trial-outreach credit consumption directly to organic PQL meetings and conversion ARR.",
          breakdown: [
            { action: "PQL buying-group contact discovery", credits: 84, outcomes: "68 committees enriched", sharePct: 45 },
            { action: "Milestone-tailored outreach drafts", credits: 68, outcomes: "61 rep-approved sends", sharePct: 37 },
            { action: "Account research & Why Now briefs", credits: 34, outcomes: "39 meetings / 25 deals", sharePct: 18 },
          ],
        },
      },
      {
        id: "partner",
        label: "Partner & Referral",
        kpis: [
          { id: "trials", label: "Active Free Trials", value: "96", delta: "+14% MoM", note: "Cloud warehouse & SI referrals", tone: "blue" },
          { id: "pqls", label: "PQLs Promoted", value: "38", delta: "39.6% PQL rate", note: "Highest activation velocity (Day 4)", tone: "teal" },
          { id: "conv", label: "Trial-to-Paid Conv.", value: "42.1%", delta: "+11.2 pts", note: "16 paid Growth / Enterprise deals", tone: "green" },
          { id: "pipeline", label: "PQL Pipeline Created", value: "$784K", delta: "+27% MoM", note: "Avg $49K ACV with Security pack", tone: "green" },
        ],
        table: {
          title: "Partner & Referral Converted Trial Accounts",
          columns: [
            { key: "account", label: "Account" },
            { key: "source", label: "Trial source", tag: true },
            { key: "milestone", label: "PQL Milestone" },
            { key: "score", label: "PQL Score", align: "right" },
            { key: "status", label: "Outcome", tag: true },
            { key: "arr", label: "Deal ARR", align: "right" },
          ],
          rows: [
            {
              id: "lanternfish",
              linkTo: "/companies/co-lanternfish",
              cells: {
                account: "Lanternfish Games",
                source: "Partner & Referral",
                milestone: "8 invites + BigQuery DW",
                score: "91",
                status: "Proposal Sent",
                arr: "$55,800",
              },
              tones: { source: "purple", status: "blue" },
            },
            {
              id: "pallister",
              linkTo: "/companies/co-pallister",
              cells: {
                account: "Pallister and Vane Legal",
                source: "Partner & Referral",
                milestone: "5 invites + Snowflake DW",
                score: "82",
                status: "Closed Won",
                arr: "$46,200",
              },
              tones: { source: "purple", status: "green" },
            },
          ],
        },
        creditsOutcome: {
          extId: "credits-outcome-bridge",
          title: "HubSpot Credits & Outcomes Attribution",
          badge: "Partner PQL Cohort",
          creditsUsed: 104,
          creditsAllocated: 600,
          primaryMetricLabel: "Pipeline / 1K credits",
          primaryMetricValue: "$7.5M",
          secondaryMetricLabel: "Credits / paid deal",
          secondaryMetricValue: "6.5 cr",
          summary: "Tracks Breeze Prospecting Agent credits on partner-referred free trials through booked demos and closed-won Growth upgrades.",
          breakdown: [
            { action: "PQL buying-group contact discovery", credits: 46, outcomes: "38 committees enriched", sharePct: 44 },
            { action: "Milestone-tailored outreach drafts", credits: 38, outcomes: "35 rep-approved sends", sharePct: 37 },
            { action: "Account research & Why Now briefs", credits: 20, outcomes: "24 meetings / 16 deals", sharePct: 19 },
          ],
        },
      },
      {
        id: "paid",
        label: "Paid Search & Social",
        kpis: [
          { id: "trials", label: "Active Free Trials", value: "162", delta: "+11% MoM", note: "High-intent BI & analytics keywords", tone: "blue" },
          { id: "pqls", label: "PQLs Promoted", value: "42", delta: "25.9% PQL rate", note: "Filtered out single-user tire kickers", tone: "teal" },
          { id: "conv", label: "Trial-to-Paid Conv.", value: "28.6%", delta: "+6.8 pts", note: "12 paid Starter / Growth deals", tone: "green" },
          { id: "pipeline", label: "PQL Pipeline Created", value: "$442K", delta: "+19% MoM", note: "Fastest 12-day sales cycle", tone: "green" },
        ],
        table: {
          title: "Paid Search & Social Converted Trial Accounts",
          columns: [
            { key: "account", label: "Account" },
            { key: "source", label: "Trial source", tag: true },
            { key: "milestone", label: "PQL Milestone" },
            { key: "score", label: "PQL Score", align: "right" },
            { key: "status", label: "Outcome", tag: true },
            { key: "arr", label: "Deal ARR", align: "right" },
          ],
          rows: [
            {
              id: "thistledown",
              linkTo: "/companies/co-thistledown",
              cells: {
                account: "Thistledown Veterinary Network",
                source: "Paid Search",
                milestone: "7 invites + Snowflake DW",
                score: "86",
                status: "Discovery",
                arr: "$73,500",
              },
              tones: { source: "amber", status: "blue" },
            },
          ],
        },
        creditsOutcome: {
          extId: "credits-outcome-bridge",
          title: "HubSpot Credits & Outcomes Attribution",
          badge: "Paid PQL Cohort",
          creditsUsed: 98,
          creditsAllocated: 600,
          primaryMetricLabel: "Pipeline / 1K credits",
          primaryMetricValue: "$4.5M",
          secondaryMetricLabel: "Credits / paid deal",
          secondaryMetricValue: "8.2 cr",
          summary: "Focuses Breeze credits exclusively on paid-trial accounts crossing the product-usage milestone rather than unqualified signups.",
          breakdown: [
            { action: "PQL buying-group contact discovery", credits: 44, outcomes: "42 committees enriched", sharePct: 45 },
            { action: "Milestone-tailored outreach drafts", credits: 36, outcomes: "36 rep-approved sends", sharePct: 37 },
            { action: "Account research & Why Now briefs", credits: 18, outcomes: "21 meetings / 12 deals", sharePct: 18 },
          ],
        },
      },
    ],
  },
  kpis: [
    { id: "trials", label: "Active Free Trials", value: "472", delta: "+15% MoM", note: "Self-serve 14-day Lumenstack workspaces", tone: "blue" },
    { id: "pqls", label: "PQLs Promoted", value: "148", delta: "31.4% PQL rate", note: "Triggered by 5+ invites & warehouse sync", tone: "teal" },
    { id: "conv", label: "Trial-to-Paid Conv.", value: "35.8%", delta: "+9.1 pts", note: "53 paid deals vs. 14% unassisted baseline", tone: "green" },
    { id: "pipeline", label: "PQL Pipeline Created", value: "$2.37M", delta: "+26% MoM", note: "Includes Alderwave Logistics ($51,000)", tone: "green" },
  ],
  breakdowns: [
    {
      id: "funnel",
      title: "Free-Trial to Paid Conversion Funnel",
      subtitle: "From self-serve trial signup through PQL milestone, Breeze outreach, and deal creation",
      kind: "funnel",
      badge: "30-day cohort",
      badgeTone: "green",
      rows: [
        { label: "Free Trial Signups", value: 472, displayValue: "472", pct: 100 },
        { label: "PQL Milestone Hit (Score >= 80)", value: 148, displayValue: "148", meta: "31.4%", pct: 68 },
        { label: "Breeze Buying-Group Outreach Sent", value: 132, displayValue: "132", meta: "89% of PQLs", pct: 58 },
        { label: "Conversion Meetings Booked", value: 84, displayValue: "84", meta: "57% of PQLs", pct: 44 },
        { label: "Paid Deals Created / Closed", value: 53, displayValue: "53", meta: "35.8% PQL conv.", pct: 32 },
      ],
    },
    {
      id: "by-source",
      title: "Trial-to-Paid Conversion Rate by Source",
      subtitle: "Share of Product-Qualified Leads converting to paid annual plans",
      kind: "bars",
      badge: "By acquisition source",
      badgeTone: "teal",
      rows: [
        { label: "Partner & Warehouse Referral", value: 42.1, displayValue: "42.1%", meta: "16 deals · $784K", pct: 84, tone: "purple" },
        { label: "Organic Search & Integration Docs", value: 36.8, displayValue: "36.8%", meta: "25 deals · $1.14M", pct: 74, tone: "green" },
        { label: "Paid Search & Social", value: 28.6, displayValue: "28.6%", meta: "12 deals · $442K", pct: 57, tone: "amber" },
      ],
    },
  ],
  table: {
    title: "Recent PQL Trial-to-Paid Conversions",
    subtitle: "Click any account to inspect its HubSpot company timeline",
    columns: [
      { key: "account", label: "Account" },
      { key: "source", label: "Trial source", tag: true },
      { key: "milestone", label: "PQL Milestone" },
      { key: "score", label: "PQL Score", align: "right" },
      { key: "status", label: "Outcome", tag: true },
      { key: "arr", label: "Deal ARR", align: "right" },
    ],
    rows: [
      {
        id: "alderwave",
        linkTo: "/companies/co-alderwave",
        cells: {
          account: "Alderwave Logistics",
          source: "Organic & Docs",
          milestone: "5 invites + Snowflake DW",
          score: "88",
          status: "Deal opened",
          arr: "$51,000",
        },
        tones: { source: "teal", status: "green" },
      },
      {
        id: "thistledown",
        linkTo: "/companies/co-thistledown",
        cells: {
          account: "Thistledown Veterinary Network",
          source: "Paid Search",
          milestone: "7 invites + Snowflake DW",
          score: "86",
          status: "Discovery",
          arr: "$73,500",
        },
        tones: { source: "amber", status: "blue" },
      },
      {
        id: "lanternfish",
        linkTo: "/companies/co-lanternfish",
        cells: {
          account: "Lanternfish Games",
          source: "Partner & Referral",
          milestone: "8 invites + BigQuery DW",
          score: "91",
          status: "Proposal Sent",
          arr: "$55,800",
        },
        tones: { source: "purple", status: "blue" },
      },
      {
        id: "pallister",
        linkTo: "/companies/co-pallister",
        cells: {
          account: "Pallister and Vane Legal",
          source: "Partner & Referral",
          milestone: "5 invites + Snowflake DW",
          score: "82",
          status: "Closed Won",
          arr: "$46,200",
        },
        tones: { source: "purple", status: "green" },
      },
      {
        id: "wrenfield",
        linkTo: "/companies/co-wrenfield",
        cells: {
          account: "Wrenfield Robotics",
          source: "Organic & Docs",
          milestone: "6 invites + Postgres DW",
          score: "84",
          status: "Closed Won",
          arr: "$38,400",
        },
        tones: { source: "teal", status: "green" },
      },
    ],
  },
  creditsOutcome: {
    extId: "credits-outcome-bridge",
    title: "HubSpot Credits & Outcomes Attribution",
    badge: "Credits-to-Pipeline Model",
    creditsUsed: 388,
    creditsAllocated: 600,
    primaryMetricLabel: "Pipeline / 1K credits",
    primaryMetricValue: "$6.1M",
    secondaryMetricLabel: "Credits / paid deal",
    secondaryMetricValue: "7.3 cr",
    summary:
      "Ties HubSpot Credits spent on Breeze Prospecting Agent PQL enrichment and trial-to-paid outreach directly to booked conversion meetings and ARR pipeline.",
    breakdown: [
      { action: "PQL buying-group contact discovery", credits: 174, outcomes: "148 buying committees enriched", sharePct: 45 },
      { action: "Milestone-tailored outreach drafts", credits: 142, outcomes: "132 rep-approved sequences sent", sharePct: 37 },
      { action: "Account research & Why Now briefs", credits: 72, outcomes: "84 meetings / 53 paid deals", sharePct: 18 },
    ],
  },
};
