import type { AnalyticsReportSpec } from "../analytics-types";

/**
 * Declarative report specs for Lumenstack (SaaS & software).
 * Rendered by the shared lazy-loaded Analytics module (`/reports/:reportId`).
 */
export const reports: Record<string, AnalyticsReportSpec> = {
  "signal-pipeline": {
    id: "signal-pipeline",
    title: "Signal-Sourced Pipeline & Credits ROI",
    subtitle: "Breeze Prospecting Agent pipeline attribution across product-usage, funding, and web intent signals · Last 30 days",
    badge: "Live attribution",
    badgeTone: "green",
    demoId: "ai-prospecting",
    backLink: { to: "/prospecting", label: "Back to Prospecting" },
    filter: {
      label: "Signal",
      defaultOptionId: "all",
      options: [
        {
          id: "all",
          label: "All signals",
        },
        {
          id: "seat-cap",
          label: "Seat-cap usage",
          kpis: [
            { id: "accounts", label: "Signaled Accounts", value: "18", delta: "+6 MoM", note: "Accounts above 85% seat utilization", tone: "teal" },
            { id: "meetings", label: "Meetings Booked", value: "11", delta: "61% conv.", note: "Role-tailored buying-group outreach", tone: "green" },
            { id: "pipeline", label: "Sourced Pipeline", value: "$428,000", delta: "+24%", note: "Expansion & upgrade deals created", tone: "green" },
            { id: "win-rate", label: "Avg Deal Size", value: "$38,900", delta: "2.1x baseline", note: "Higher ACV when triggered by usage cap", tone: "blue" },
          ],
          breakdowns: [
            {
              id: "funnel",
              title: "Seat-Cap Signal Funnel",
              kind: "funnel",
              badge: "Seat-cap only",
              badgeTone: "teal",
              rows: [
                { label: "Usage-Cap Signals Fired", value: 18, displayValue: "18", pct: 100 },
                { label: "Buying Groups Enriched", value: 16, displayValue: "16", meta: "89%", pct: 89 },
                { label: "Outreach Approved & Sent", value: 14, displayValue: "14", meta: "78%", pct: 78 },
                { label: "Discovery Meetings Booked", value: 11, displayValue: "11", meta: "61%", pct: 61 },
                { label: "Expansion Deals Opened", value: 8, displayValue: "8", meta: "44%", pct: 44 },
              ],
            },
            {
              id: "by-tier",
              title: "Seat-Cap Pipeline by Current Plan",
              kind: "bars",
              rows: [
                { label: "Growth -> Enterprise", value: 246000, displayValue: "$246,000", meta: "4 deals", tone: "orange" },
                { label: "Starter -> Growth", value: 134000, displayValue: "$134,000", meta: "3 deals", tone: "teal" },
                { label: "AI Assistant Add-on", value: 48000, displayValue: "$48,000", meta: "1 deal", tone: "blue" },
              ],
            },
          ],
          table: {
            title: "Seat-Cap Signaled Accounts",
            columns: [
              { key: "account", label: "Account" },
              { key: "signal", label: "Triggering signal", tag: true },
              { key: "contacts", label: "Buying group", align: "right" },
              { key: "stage", label: "Status", tag: true },
              { key: "pipeline", label: "Pipeline", align: "right" },
            ],
            rows: [
              {
                id: "vireo",
                linkTo: "/companies/co-vireo",
                cells: { account: "Vireo Mobility", signal: "Seat-cap usage", contacts: "3", stage: "Meeting booked", pipeline: "$96,000" },
                tones: { signal: "teal", stage: "green" },
              },
              {
                id: "quarry",
                linkTo: "/companies/co-quarry",
                cells: { account: "Quarrystone Outfitters", signal: "Seat-cap usage", contacts: "4", stage: "Expansion quote", pipeline: "$152,000" },
                tones: { signal: "teal", stage: "green" },
              },
              {
                id: "kittering",
                linkTo: "/companies/co-kittering",
                cells: { account: "Kittering Home Goods", signal: "Seat-cap usage", contacts: "3", stage: "Outreach sent", pipeline: "$64,000" },
                tones: { signal: "teal", stage: "blue" },
              },
            ],
          },
          creditsOutcome: {
            extId: "credits-outcome-bridge",
            title: "HubSpot Credits & Outcomes Attribution",
            badge: "Seat-Cap Cohort",
            creditsUsed: 142,
            creditsAllocated: 600,
            primaryMetricLabel: "Pipeline / 1K credits",
            primaryMetricValue: "$3.0M",
            secondaryMetricLabel: "Credits / meeting",
            secondaryMetricValue: "13 cr",
            summary: "Ties Breeze Prospecting Agent seat-cap enrichment and draft credits directly to expansion meetings and CRM pipeline.",
            breakdown: [
              { action: "Usage-signal buying group enrichment", credits: 64, outcomes: "16 buying committees mapped", sharePct: 45 },
              { action: "Role-tailored expansion outreach drafts", credits: 52, outcomes: "14 approved sequences sent", sharePct: 37 },
              { action: "Account research & Why Now summaries", credits: 26, outcomes: "11 meetings booked", sharePct: 18 },
            ],
          },
        },
        {
          id: "funding",
          label: "Funding & hiring",
          kpis: [
            { id: "accounts", label: "Signaled Accounts", value: "14", delta: "+4 MoM", note: "Series B/C rounds or new data leaders", tone: "blue" },
            { id: "meetings", label: "Meetings Booked", value: "7", delta: "50% conv.", note: "Executive & VP Data outreach", tone: "green" },
            { id: "pipeline", label: "Sourced Pipeline", value: "$312,000", delta: "+19%", note: "Net-new mid-market & enterprise deals", tone: "green" },
            { id: "win-rate", label: "Avg Deal Size", value: "$44,600", delta: "1.9x baseline", note: "Multi-team platform deployments", tone: "blue" },
          ],
          breakdowns: [
            {
              id: "funnel",
              title: "Funding & Hiring Signal Funnel",
              kind: "funnel",
              badge: "Funding & hiring",
              badgeTone: "blue",
              rows: [
                { label: "News & Hiring Signals", value: 14, displayValue: "14", pct: 100 },
                { label: "Buying Groups Enriched", value: 12, displayValue: "12", meta: "86%", pct: 86 },
                { label: "Outreach Approved & Sent", value: 10, displayValue: "10", meta: "71%", pct: 71 },
                { label: "Discovery Meetings Booked", value: 7, displayValue: "7", meta: "50%", pct: 50 },
                { label: "New Business Deals Opened", value: 5, displayValue: "5", meta: "36%", pct: 36 },
              ],
            },
            {
              id: "by-tier",
              title: "Pipeline by Trigger Type",
              kind: "bars",
              rows: [
                { label: "Series B / C Funding Round", value: 194000, displayValue: "$194,000", meta: "3 deals", tone: "blue" },
                { label: "New Head of Data / Analytics", value: 118000, displayValue: "$118,000", meta: "2 deals", tone: "purple" },
              ],
            },
          ],
          table: {
            title: "Funding & Hiring Signaled Accounts",
            columns: [
              { key: "account", label: "Account" },
              { key: "signal", label: "Triggering signal", tag: true },
              { key: "contacts", label: "Buying group", align: "right" },
              { key: "stage", label: "Status", tag: true },
              { key: "pipeline", label: "Pipeline", align: "right" },
            ],
            rows: [
              {
                id: "brambleside",
                linkTo: "/companies/co-brambleside",
                cells: { account: "Brambleside Insurance Mutual", signal: "Head of Data hire", contacts: "3", stage: "Discovery", pipeline: "$118,000" },
                tones: { signal: "blue", stage: "green" },
              },
              {
                id: "kestrel",
                linkTo: "/companies/co-kestrel",
                cells: { account: "Kestrel Ops", signal: "Series C prep", contacts: "3", stage: "Meeting booked", pipeline: "$98,400" },
                tones: { signal: "blue", stage: "green" },
              },
            ],
          },
          creditsOutcome: {
            extId: "credits-outcome-bridge",
            title: "HubSpot Credits & Outcomes Attribution",
            badge: "Funding Cohort",
            creditsUsed: 108,
            creditsAllocated: 600,
            primaryMetricLabel: "Pipeline / 1K credits",
            primaryMetricValue: "$2.9M",
            secondaryMetricLabel: "Credits / meeting",
            secondaryMetricValue: "15 cr",
            summary: "Attributes Breeze executive-research and outreach credits on funded accounts directly to booked meetings and pipeline.",
            breakdown: [
              { action: "Executive buying committee discovery", credits: 48, outcomes: "12 leadership groups mapped", sharePct: 44 },
              { action: "Personalized outreach sequence drafts", credits: 40, outcomes: "10 approved campaigns", sharePct: 37 },
              { action: "Account news & signal synthesis", credits: 20, outcomes: "7 meetings booked", sharePct: 19 },
            ],
          },
        },
        {
          id: "pricing",
          label: "Pricing intent",
          kpis: [
            { id: "accounts", label: "Signaled Accounts", value: "12", delta: "+3 MoM", note: "Repeat Enterprise pricing page visits", tone: "amber" },
            { id: "meetings", label: "Meetings Booked", value: "6", delta: "50% conv.", note: "Same-day AE follow-up", tone: "green" },
            { id: "pipeline", label: "Sourced Pipeline", value: "$186,000", delta: "+14%", note: "High-intent Enterprise evaluations", tone: "green" },
            { id: "win-rate", label: "Avg Deal Size", value: "$31,000", delta: "1.5x baseline", note: "Fastest cycle time (19 days)", tone: "blue" },
          ],
          breakdowns: [
            {
              id: "funnel",
              title: "Pricing Intent Signal Funnel",
              kind: "funnel",
              badge: "Web intent",
              badgeTone: "amber",
              rows: [
                { label: "Pricing Page Surges", value: 12, displayValue: "12", pct: 100 },
                { label: "Buying Groups Enriched", value: 11, displayValue: "11", meta: "92%", pct: 92 },
                { label: "Outreach Approved & Sent", value: 9, displayValue: "9", meta: "75%", pct: 75 },
                { label: "Discovery Meetings Booked", value: 6, displayValue: "6", meta: "50%", pct: 50 },
                { label: "Deals Opened", value: 4, displayValue: "4", meta: "33%", pct: 33 },
              ],
            },
            {
              id: "by-tier",
              title: "Pipeline by Page Viewed",
              kind: "bars",
              rows: [
                { label: "Enterprise Security & SSO Pricing", value: 122000, displayValue: "$122,000", meta: "2 deals", tone: "orange" },
                { label: "Growth Plan Calculator", value: 64000, displayValue: "$64,000", meta: "2 deals", tone: "amber" },
              ],
            },
          ],
          table: {
            title: "Pricing Intent Signaled Accounts",
            columns: [
              { key: "account", label: "Account" },
              { key: "signal", label: "Triggering signal", tag: true },
              { key: "contacts", label: "Buying group", align: "right" },
              { key: "stage", label: "Status", tag: true },
              { key: "pipeline", label: "Pipeline", align: "right" },
            ],
            rows: [
              {
                id: "saltmarsh",
                linkTo: "/companies/co-saltmarsh",
                cells: { account: "Saltmarsh Hospitality Group", signal: "Pricing intent", contacts: "3", stage: "Proposal sent", pipeline: "$122,000" },
                tones: { signal: "amber", stage: "green" },
              },
              {
                id: "ostrander",
                linkTo: "/companies/co-ostrander",
                cells: { account: "Ostrander Biologics", signal: "Quote re-opened", contacts: "2", stage: "Evaluation", pipeline: "$64,000" },
                tones: { signal: "amber", stage: "blue" },
              },
            ],
          },
          creditsOutcome: {
            extId: "credits-outcome-bridge",
            title: "HubSpot Credits & Outcomes Attribution",
            badge: "Intent Cohort",
            creditsUsed: 74,
            creditsAllocated: 600,
            primaryMetricLabel: "Pipeline / 1K credits",
            primaryMetricValue: "$2.5M",
            secondaryMetricLabel: "Credits / meeting",
            secondaryMetricValue: "12 cr",
            summary: "Tracks Breeze credit usage on high-intent pricing visitors through booked meetings and evaluation pipeline.",
            breakdown: [
              { action: "Visitor account & role enrichment", credits: 32, outcomes: "11 accounts matched", sharePct: 43 },
              { action: "Intent-tailored email drafts", credits: 28, outcomes: "9 sequences sent", sharePct: 38 },
              { action: "Rep call-prep brief generation", credits: 14, outcomes: "6 meetings booked", sharePct: 19 },
            ],
          },
        },
      ],
    },
    kpis: [
      { id: "accounts", label: "Signaled Accounts", value: "44", delta: "+13 MoM", note: "Across product usage, funding, and web intent", tone: "teal" },
      { id: "meetings", label: "Meetings Booked", value: "24", delta: "54.5% conv.", note: "Human-approved Breeze outreach", tone: "green" },
      { id: "pipeline", label: "Sourced Pipeline", value: "$926,000", delta: "+21%", note: "17 active opportunities in HubSpot", tone: "green" },
      { id: "win-rate", label: "Avg Deal Size", value: "$38,580", delta: "1.8x baseline", note: "Multi-threaded buying groups", tone: "blue" },
    ],
    breakdowns: [
      {
        id: "funnel",
        title: "Signal-to-Pipeline Funnel",
        kind: "funnel",
        badge: "30-day cohort",
        badgeTone: "green",
        rows: [
          { label: "Buying Signals Detected", value: 44, displayValue: "44", pct: 100 },
          { label: "Buying Groups Enriched", value: 39, displayValue: "39", meta: "89%", pct: 89 },
          { label: "Rep-Approved Outreach Sent", value: 33, displayValue: "33", meta: "75%", pct: 75 },
          { label: "Discovery Meetings Booked", value: 24, displayValue: "24", meta: "55%", pct: 55 },
          { label: "Pipeline Deals Created", value: 17, displayValue: "17", meta: "39%", pct: 39 },
        ],
      },
      {
        id: "by-signal",
        title: "Attributed Pipeline by Signal Source",
        kind: "bars",
        rows: [
          { label: "Seat-cap usage (Product sync)", value: 428000, displayValue: "$428,000", meta: "11 mtgs", tone: "teal" },
          { label: "Funding & executive hiring", value: 312000, displayValue: "$312,000", meta: "7 mtgs", tone: "blue" },
          { label: "Enterprise pricing intent", value: 186000, displayValue: "$186,000", meta: "6 mtgs", tone: "orange" },
        ],
      },
    ],
    table: {
      title: "Top Signal-Sourced Accounts",
      subtitle: "Click any account to open the HubSpot company record",
      columns: [
        { key: "account", label: "Account" },
        { key: "signal", label: "Triggering signal", tag: true },
        { key: "contacts", label: "Buying group", align: "right" },
        { key: "stage", label: "Status", tag: true },
        { key: "pipeline", label: "Pipeline", align: "right" },
      ],
      rows: [
        {
          id: "quarry",
          linkTo: "/companies/co-quarry",
          cells: { account: "Quarrystone Outfitters", signal: "Seat-cap usage", contacts: "4", stage: "Expansion quote", pipeline: "$152,000" },
          tones: { signal: "teal", stage: "green" },
        },
        {
          id: "saltmarsh",
          linkTo: "/companies/co-saltmarsh",
          cells: { account: "Saltmarsh Hospitality Group", signal: "Pricing intent", contacts: "3", stage: "Proposal sent", pipeline: "$122,000" },
          tones: { signal: "amber", stage: "green" },
        },
        {
          id: "brambleside",
          linkTo: "/companies/co-brambleside",
          cells: { account: "Brambleside Insurance Mutual", signal: "Head of Data hire", contacts: "3", stage: "Discovery", pipeline: "$118,000" },
          tones: { signal: "blue", stage: "green" },
        },
        {
          id: "vireo",
          linkTo: "/companies/co-vireo",
          cells: { account: "Vireo Mobility", signal: "Seat-cap usage", contacts: "3", stage: "Meeting booked", pipeline: "$96,000" },
          tones: { signal: "teal", stage: "green" },
        },
        {
          id: "kittering",
          linkTo: "/companies/co-kittering",
          cells: { account: "Kittering Home Goods", signal: "Seat-cap usage", contacts: "3", stage: "Outreach sent", pipeline: "$64,000" },
          tones: { signal: "teal", stage: "blue" },
        },
      ],
    },
    creditsOutcome: {
      extId: "credits-outcome-bridge",
      title: "HubSpot Credits & Outcomes Attribution",
      badge: "Credits-to-Outcome Model",
      creditsUsed: 324,
      creditsAllocated: 600,
      primaryMetricLabel: "Pipeline / 1K credits",
      primaryMetricValue: "$2.9M",
      secondaryMetricLabel: "Credits / meeting",
      secondaryMetricValue: "14 cr",
      summary: "Connects Breeze Prospecting Agent enrichment, buying-group research, and outreach credit burn directly to booked meetings and pipeline.",
      breakdown: [
        { action: "Buying-committee enrichment & role mapping", credits: 144, outcomes: "39 buying groups built", sharePct: 44 },
        { action: "Role-tailored outreach drafts", credits: 120, outcomes: "33 approved sequences sent", sharePct: 37 },
        { action: "Account signal synthesis & call prep", credits: 60, outcomes: "24 meetings booked", sharePct: 19 },
      ],
    },
  },
  "expansion-mrr": {
    id: "expansion-mrr",
    title: "Expansion MRR by Account",
    subtitle: "Native HubSpot Revenue reporting across seat upgrades, AI add-on attach, and mid-term plan expansions · Q4",
    badge: "Native HubSpot report",
    badgeTone: "blue",
    demoId: "back-office",
    backLink: { to: "/companies/co-quarry", label: "Back to Quarrystone Outfitters" },
    filter: {
      label: "Plan tier",
      defaultOptionId: "all",
      options: [
        { id: "all", label: "All tiers" },
        {
          id: "growth",
          label: "Growth",
          kpis: [
            { id: "exp-mrr", label: "Expansion MRR", value: "$19,400", delta: "+22% QoQ", note: "Growth seat & AI Assistant add-ons", tone: "green" },
            { id: "nrr", label: "Net Revenue Retention", value: "121%", delta: "+4 pts", note: "Driven by seat-cap triggers", tone: "green" },
            { id: "accounts", label: "Expanded Accounts", value: "9", delta: "75% of cohort", note: "Average +28 seats added", tone: "blue" },
            { id: "cycle", label: "Quote-to-Close", value: "6.4 days", delta: "-3.1 days", note: "Zero re-keying from billing", tone: "teal" },
          ],
          table: {
            title: "Growth Tier Expansion Accounts",
            columns: [
              { key: "account", label: "Account" },
              { key: "tier", label: "Current tier", tag: true },
              { key: "seats", label: "Seat utilization", align: "right" },
              { key: "addMrr", label: "Expansion MRR", align: "right" },
            ],
            rows: [
              {
                id: "quarry",
                linkTo: "/companies/co-quarry",
                cells: { account: "Quarrystone Outfitters", tier: "Growth", seats: "97 / 100", addMrr: "$6,450" },
                tones: { tier: "blue" },
              },
              {
                id: "marlowe",
                linkTo: "/companies/co-marlowe",
                cells: { account: "Marlowe Ridge Health", tier: "Growth", seats: "88 / 90", addMrr: "$7,950" },
                tones: { tier: "blue" },
              },
              {
                id: "kittering",
                linkTo: "/companies/co-kittering",
                cells: { account: "Kittering Home Goods", tier: "Growth", seats: "43 / 45", addMrr: "$5,000" },
                tones: { tier: "blue" },
              },
            ],
          },
        },
        {
          id: "enterprise",
          label: "Enterprise",
          kpis: [
            { id: "exp-mrr", label: "Expansion MRR", value: "$14,800", delta: "+17% QoQ", note: "Multi-site & Security pack upgrades", tone: "green" },
            { id: "nrr", label: "Net Revenue Retention", value: "126%", delta: "+5 pts", note: "Zero Enterprise churn in Q4", tone: "green" },
            { id: "accounts", label: "Expanded Accounts", value: "4", delta: "80% of cohort", note: "Includes Premium Support attach", tone: "blue" },
            { id: "cycle", label: "Quote-to-Close", value: "11.2 days", delta: "-2.4 days", note: "Deal-desk approval under 1 day", tone: "teal" },
          ],
          table: {
            title: "Enterprise Tier Expansion Accounts",
            columns: [
              { key: "account", label: "Account" },
              { key: "tier", label: "Current tier", tag: true },
              { key: "seats", label: "Seat utilization", align: "right" },
              { key: "addMrr", label: "Expansion MRR", align: "right" },
            ],
            rows: [
              {
                id: "saltmarsh",
                linkTo: "/companies/co-saltmarsh",
                cells: { account: "Saltmarsh Hospitality Group", tier: "Enterprise", seats: "212 / 220", addMrr: "$9,200" },
                tones: { tier: "purple" },
              },
              {
                id: "fallowfield",
                linkTo: "/companies/co-fallowfield",
                cells: { account: "Fallowfield Energy Cooperative", tier: "Enterprise", seats: "144 / 150", addMrr: "$5,600" },
                tones: { tier: "purple" },
              },
            ],
          },
        },
      ],
    },
    kpis: [
      { id: "exp-mrr", label: "Expansion MRR", value: "$34,200", delta: "+19% QoQ", note: "$410.4K annualized expansion ARR", tone: "green" },
      { id: "nrr", label: "Net Revenue Retention", value: "123%", delta: "+4.5 pts", note: "Across 13 expanded accounts", tone: "green" },
      { id: "accounts", label: "Expanded Accounts", value: "13", delta: "76% of alerted", note: "Triggered by seat utilization >= 90%", tone: "blue" },
      { id: "cycle", label: "Quote-to-Close", value: "8.1 days", delta: "-2.8 days", note: "Built directly from billing usage", tone: "teal" },
    ],
    breakdowns: [
      {
        id: "motion",
        title: "Expansion MRR by Motion",
        kind: "bars",
        rows: [
          { label: "Additional Platform Seats", value: 18400, displayValue: "$18,400", meta: "54%", tone: "orange" },
          { label: "AI Assistant Add-on Attach", value: 9600, displayValue: "$9,600", meta: "28%", tone: "pink" },
          { label: "Security & Warehouse Packs", value: 6200, displayValue: "$6,200", meta: "18%", tone: "teal" },
        ],
      },
      {
        id: "tier-funnel",
        title: "Expansion Pipeline by Tier",
        kind: "bars",
        rows: [
          { label: "Growth Accounts", value: 19400, displayValue: "$19,400", meta: "9 accounts", tone: "blue" },
          { label: "Enterprise Accounts", value: 14800, displayValue: "$14,800", meta: "4 accounts", tone: "purple" },
        ],
      },
    ],
    table: {
      title: "Active Expansion Accounts",
      columns: [
        { key: "account", label: "Account" },
        { key: "tier", label: "Current tier", tag: true },
        { key: "seats", label: "Seat utilization", align: "right" },
        { key: "addMrr", label: "Expansion MRR", align: "right" },
      ],
      rows: [
        {
          id: "saltmarsh",
          linkTo: "/companies/co-saltmarsh",
          cells: { account: "Saltmarsh Hospitality Group", tier: "Enterprise", seats: "212 / 220", addMrr: "$9,200" },
          tones: { tier: "purple" },
        },
        {
          id: "marlowe",
          linkTo: "/companies/co-marlowe",
          cells: { account: "Marlowe Ridge Health", tier: "Growth", seats: "88 / 90", addMrr: "$7,950" },
          tones: { tier: "blue" },
        },
        {
          id: "quarry",
          linkTo: "/companies/co-quarry",
          cells: { account: "Quarrystone Outfitters", tier: "Growth", seats: "97 / 100", addMrr: "$6,450" },
          tones: { tier: "blue" },
        },
        {
          id: "fallowfield",
          linkTo: "/companies/co-fallowfield",
          cells: { account: "Fallowfield Energy Cooperative", tier: "Enterprise", seats: "144 / 150", addMrr: "$5,600" },
          tones: { tier: "purple" },
        },
        {
          id: "kittering",
          linkTo: "/companies/co-kittering",
          cells: { account: "Kittering Home Goods", tier: "Growth", seats: "43 / 45", addMrr: "$5,000" },
          tones: { tier: "blue" },
        },
      ],
    },
  },
};
