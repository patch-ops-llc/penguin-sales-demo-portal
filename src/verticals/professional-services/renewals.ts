import type { ContractRenewalConfig, RenewalsDemoId } from "@/shell/renewals/types";
import type { AnalyticsReportSpec } from "../analytics-types";
import { line } from "./rate-card";

// 100% fictional IT Services Contract Renewal config for Quillon Technology Partners (IT Services #3).

const IT_RENEWAL_STAGES = [
  { id: "ren-120d", label: "120-Day Trigger", probability: 30 },
  { id: "qbr-booked", label: "QBR Scheduled", probability: 55 },
  { id: "quote-sent", label: "Renewal Quote Sent", probability: 80 },
  { id: "ren-won", label: "Renewed & Synced", probability: 100, closed: "won" as const },
];

const i3LineItems = [
  line("QT-MS-CMP", 185),
  line("QT-NET-SITE", 3),
];

const renewedArr = i3LineItems.reduce((sum, l) => sum + l.qty * l.unitPrice, 0); // 185*1500 + 3*4200 = 290,100
const renewedMrr = Math.round(renewedArr / 12); // 24,175

export const contractRenewalConfig: ContractRenewalConfig = {
  mode: "contract-qbr",
  companyId: "co-eastlake",
  contactId: "ct-nell",
  ownerId: "grant",
  workflow: {
    id: "wf-renewal",
    name: "Renewals | 120-day renewal notice",
    triggerSummary: "Managed Services Contract End Date is 120 days away",
    enrolledCount: 143,
    noticeDays: 120,
    actions: [
      "Create Renewal deal in MSP Renewal Pipeline",
      "Assign QBR booking task to Account Manager",
      "Post 120-day heads-up to #msp-renewals",
    ],
  },
  queue: [
    {
      id: "q-eastlake",
      companyId: "co-eastlake",
      companyName: "Eastlake Mechanical Contractors",
      planName: "Managed IT Complete · 170 -> 185 users, 3 sites",
      arr: renewedArr,
      mrr: renewedMrr,
      daysToRenewal: 120,
      renewalDate: "@+120d",
      ownerName: "Grant Lavelle",
      status: "Ready to trigger",
      statusTone: "amber",
      isHero: true,
    },
    {
      id: "q-wexcombe",
      companyId: "co-wexcombe",
      companyName: "Wexcombe Plastics",
      planName: "Managed IT Complete + MDR · 140 users, 2 sites",
      arr: 238160,
      mrr: 19847,
      daysToRenewal: 96,
      renewalDate: "@+96d",
      ownerName: "Tessa Marlow",
      status: "QBR Scheduled",
      statusTone: "blue",
    },
    {
      id: "q-calderwood",
      companyId: "co-calderwood",
      companyName: "Calderwood Civil Engineering",
      planName: "Managed IT Complete + MDR · 130 users, 2 sites",
      arr: 231480,
      mrr: 19290,
      daysToRenewal: 42,
      renewalDate: "@+42d",
      ownerName: "Grant Lavelle",
      status: "Quote Sent",
      statusTone: "blue",
    },
    {
      id: "q-whitlow",
      companyId: "co-whitlow",
      companyName: "Whitlow Orthopedic Clinic",
      planName: "Managed IT Complete + Compliance · 120 users, 2 sites",
      arr: 230160,
      mrr: 19180,
      daysToRenewal: 26,
      renewalDate: "@+26d",
      ownerName: "Imani Okoro",
      status: "At-Risk Review",
      statusTone: "red",
    },
  ],
  renewalDeal: {
    dealId: "dl-ren-eastlake",
    name: "Eastlake Mechanical Contractors: Managed IT Complete Renewal",
    pipelineName: "MSP Renewal Pipeline",
    stages: IT_RENEWAL_STAGES,
    initialStageId: "ren-120d",
    qbrStageId: "qbr-booked",
    quoteStageId: "quote-sent",
    wonStageId: "ren-won",
    closeDate: "@+120d",
    arr: renewedArr,
    mrr: renewedMrr,
    lineItems: i3LineItems,
    taskTitle: "Book 120-day QBR & renewal review with Nell Okonkwo",
    taskNotes: "Managed IT Complete agreement AGR-20914 ends in 120 days. Review SLA scorecard and 15 new field-service users.",
    slackChannel: "#msp-renewals",
    slackText: "120-day contract renewal opened: Eastlake Mechanical Contractors ($290,100 ARR). Assigned to Grant Lavelle for QBR scheduling.",
  },
  qbr: {
    channelLabel: "External Client Inbox & HubSpot Meetings · mail.eastlakemechanicalcontractors.example",
    windowTitle: "Eastlake Mechanical Mail — QBR Scheduler",
    url: "https://meetings.quillontech.example/grant-lavelle/eastlake-qbr",
    inboxBrand: "Eastlake Mail",
    inboxInitial: "EM",
    inboxOwnerName: "Nell Okonkwo",
    inboxOwnerEmail: "nell.okonkwo@eastlakemechanicalcontractors.example",
    emailSubject: "Eastlake Mechanical QBR & 12-Month Managed IT Renewal Planning",
    emailBody:
      "Hi Nell,\n\nOur Managed IT Complete agreement (AGR-20914) is 120 days from its annual renewal date. Before I prepare the renewal quote, I would love to run a 45-minute Quarterly Business Review with you.\n\nWe will review your 99.96% uptime SLA, the 15 new field-service users joining in St. Louis next quarter, and confirm 12-month renewal terms.\n\nPick any slot on the right and the invite will land on both our calendars automatically.\n\nBest,\nGrant Lavelle\nQuillon Technology Partners",
    meetingTitle: "Quarterly Business Review — Eastlake Mechanical",
    durationLabel: "45 min",
    agenda: [
      "SLA & Help Desk scorecard: 99.96% network uptime, 11-min P1 response",
      "Headcount alignment: 170 current users -> 185 managed users (+15 field techs)",
      "12-month Managed IT Complete renewal terms & PSA contract roll-forward",
    ],
    slots: [
      { id: "slot-tue", day: "Tuesday, Dec 1", time: "10:00 AM", tz: "CST", location: "Teams Video · Grant Lavelle + Nell Okonkwo" },
      { id: "slot-wed", day: "Wednesday, Dec 2", time: "2:00 PM", tz: "CST", location: "Teams Video · Grant Lavelle + Nell Okonkwo" },
      { id: "slot-thu", day: "Thursday, Dec 3", time: "9:30 AM", tz: "CST", location: "On-site · St. Louis HQ Conference Room B" },
    ],
    defaultSlotId: "slot-tue",
    noiseEmails: [
      { id: "n1", from: "Midwest Fleet Supply", subject: "Q4 service van maintenance schedule" },
      { id: "n2", from: "Eastlake Payroll", subject: "New field-tech onboarding batch (15 hires)" },
    ],
  },
  quote: {
    quoteId: "q-ren-eastlake",
    number: "Q-5248",
    title: "Eastlake Mechanical Contractors: Managed IT Complete Renewal (12 Months)",
    lineItems: i3LineItems,
  },
  psaSync: {
    extId: "psa-contract-sync",
    title: "PSA Agreement & Contract-Date Roll-Forward Sync",
    systemLabel: "ConnectWise PSA",
    agreementId: "AGR-20914",
    planLabel: "Managed IT Complete (3 sites)",
    previousSeats: 170,
    renewedSeats: 185,
    previousSites: 3,
    renewedSites: 3,
    previousArr: 267600,
    renewedArr,
    previousEndDate: "@+120d",
    rolledEndDate: "@+485d",
    termLabel: "12-month term",
    syncNote:
      "Writes the renewed 12-month contract end date, updated managed user count, and new monthly billing rate back to the ConnectWise PSA agreement when the renewal closes.",
  },
  reportId: "it-contract-renewals",
};

export const itRenewals: Partial<Record<RenewalsDemoId, ContractRenewalConfig>> = {
  "contract-renewal": contractRenewalConfig,
};

/** Native HubSpot Analytics report for IT Services #3 — ZERO Penguin markers (no creditsOutcome). */
export const itContractRenewalsReport: AnalyticsReportSpec = {
  id: "it-contract-renewals",
  title: "Renewal Pipeline & At-Risk ARR",
  subtitle: "Native HubSpot MSP renewal pipeline, QBR completion, and at-risk recurring revenue across managed contracts · 120-Day Window",
  badge: "Native HubSpot report",
  badgeTone: "blue",
  demoId: "contract-renewal",
  backLink: { to: "/deals/dl-ren-eastlake", label: "Back to Renewal Deal" },
  completeFlag: "renewals.contract-renewal.reportSeen",
  filter: {
    label: "Service tier",
    defaultOptionId: "all",
    options: [
      { id: "all", label: "All tiers" },
      {
        id: "complete",
        label: "Managed IT Complete",
        kpis: [
          { id: "pipeline", label: "120-Day Renewal Pipeline", value: "$989,900", delta: "4 contracts", note: "Includes Eastlake ($290.1K renewed)", tone: "green" },
          { id: "at-risk", label: "At-Risk ARR", value: "$230,160", delta: "1 contract", note: "Whitlow Orthopedic under executive review", tone: "amber" },
          { id: "ontime", label: "On-Time Renewal Rate", value: "94.6%", delta: "+5.1 pts YoY", note: "120-day trigger + QBR cadence", tone: "green" },
          { id: "net-exp", label: "Net Renewal Expansion", value: "+$38,700", delta: "104% NRR", note: "Eastlake +15 users, Wexcombe +25 users", tone: "teal" },
        ],
        table: {
          title: "Managed IT Complete Contracts (120-Day Window)",
          columns: [
            { key: "account", label: "Client" },
            { key: "tier", label: "Service Tier", tag: true },
            { key: "arr", label: "Renewal ARR", align: "right" },
            { key: "qbr", label: "QBR Status", tag: true },
            { key: "stage", label: "Renewal Stage", tag: true },
          ],
          rows: [
            {
              id: "eastlake",
              linkTo: "/deals/dl-ren-eastlake",
              cells: { account: "Eastlake Mechanical Contractors", tier: "Complete", arr: "$290,100", qbr: "Completed", stage: "Renewed & Synced" },
              tones: { tier: "blue", qbr: "green", stage: "green" },
            },
            {
              id: "wexcombe",
              linkTo: "/companies/co-wexcombe",
              cells: { account: "Wexcombe Plastics", tier: "Complete", arr: "$238,160", qbr: "Scheduled", stage: "QBR Scheduled" },
              tones: { tier: "blue", qbr: "blue", stage: "blue" },
            },
            {
              id: "calderwood",
              linkTo: "/companies/co-calderwood",
              cells: { account: "Calderwood Civil Engineering", tier: "Complete", arr: "$231,480", qbr: "Completed", stage: "Quote Sent" },
              tones: { tier: "blue", qbr: "green", stage: "blue" },
            },
            {
              id: "whitlow",
              linkTo: "/companies/co-whitlow",
              cells: { account: "Whitlow Orthopedic Clinic", tier: "Complete", arr: "$230,160", qbr: "Pending", stage: "At-Risk Review" },
              tones: { tier: "blue", qbr: "amber", stage: "red" },
            },
          ],
        },
      },
      {
        id: "essentials",
        label: "Managed IT Essentials",
        kpis: [
          { id: "pipeline", label: "120-Day Renewal Pipeline", value: "$386,400", delta: "3 contracts", note: "Essentials upgrade candidates flagged", tone: "blue" },
          { id: "at-risk", label: "At-Risk ARR", value: "$74,200", delta: "1 contract", note: "Fenwick Lane multi-site evaluation", tone: "amber" },
          { id: "ontime", label: "On-Time Renewal Rate", value: "91.2%", delta: "+3.4 pts YoY", note: "QBRs booked 90+ days ahead", tone: "green" },
          { id: "net-exp", label: "Net Renewal Expansion", value: "+$19,400", delta: "105% NRR", note: "Security MDR add-on attach at renewal", tone: "teal" },
        ],
        table: {
          title: "Managed IT Essentials Contracts (120-Day Window)",
          columns: [
            { key: "account", label: "Client" },
            { key: "tier", label: "Service Tier", tag: true },
            { key: "arr", label: "Renewal ARR", align: "right" },
            { key: "qbr", label: "QBR Status", tag: true },
            { key: "stage", label: "Renewal Stage", tag: true },
          ],
          rows: [
            {
              id: "orielpark",
              linkTo: "/companies/co-orielpark",
              cells: { account: "Oriel Park Senior Living", tier: "Essentials", arr: "$184,200", qbr: "Scheduled", stage: "QBR Scheduled" },
              tones: { tier: "teal", qbr: "blue", stage: "blue" },
            },
            {
              id: "fenwick",
              linkTo: "/companies/co-fenwick",
              cells: { account: "Fenwick Lane Pediatrics", tier: "Essentials", arr: "$74,200", qbr: "Pending", stage: "At-Risk Review" },
              tones: { tier: "teal", qbr: "amber", stage: "red" },
            },
          ],
        },
      },
    ],
  },
  kpis: [
    { id: "pipeline", label: "120-Day Renewal Pipeline", value: "$1,376,300", delta: "7 contracts", note: "$114.7K monthly recurring revenue", tone: "green" },
    { id: "at-risk", label: "At-Risk ARR", value: "$304,360", delta: "2 contracts", note: "22% of renewing ARR flagged for QBR escalation", tone: "amber" },
    { id: "ontime", label: "On-Time Renewal Rate", value: "93.4%", delta: "+4.6 pts YoY", note: "Driven by 120-day workflow + client QBRs", tone: "green" },
    { id: "net-exp", label: "Net Renewal Expansion", value: "+$58,100", delta: "104.4% NRR", note: "Eastlake rolled forward +15 managed users", tone: "teal" },
  ],
  breakdowns: [
    {
      id: "renewal-stages",
      title: "Renewal Pipeline ARR by Stage",
      kind: "funnel",
      badge: "120-day cohort",
      badgeTone: "green",
      rows: [
        { label: "120-Day Renewal Deals Created", value: 1376300, displayValue: "$1,376,300", meta: "7 deals", pct: 100 },
        { label: "QBR Scheduled / Completed", value: 1071940, displayValue: "$1,071,940", meta: "5 deals · 78%", pct: 78 },
        { label: "Renewal Quote Sent", value: 751740, displayValue: "$751,740", meta: "3 deals · 55%", pct: 55 },
        { label: "Renewed Won & PSA Rolled Forward", value: 290100, displayValue: "$290,100", meta: "Eastlake synced", pct: 32 },
      ],
    },
    {
      id: "risk-breakdown",
      title: "Renewing ARR by Retention Posture",
      kind: "bars",
      rows: [
        { label: "Renewed & PSA Rolled Forward", value: 290100, displayValue: "$290,100", meta: "1 contract", tone: "green" },
        { label: "Healthy / QBR On Track", value: 781840, displayValue: "$781,840", meta: "4 contracts", tone: "blue" },
        { label: "At-Risk (QBR Overdue / Scope Change)", value: 304360, displayValue: "$304,360", meta: "2 contracts", tone: "red" },
      ],
    },
  ],
  table: {
    title: "120-Day Contract Renewal Register",
    subtitle: "Click any contract to inspect the HubSpot deal or client record",
    columns: [
      { key: "account", label: "Client" },
      { key: "tier", label: "Service Tier", tag: true },
      { key: "arr", label: "Renewal ARR", align: "right" },
      { key: "qbr", label: "QBR Status", tag: true },
      { key: "stage", label: "Renewal Stage", tag: true },
    ],
    rows: [
      {
        id: "eastlake",
        linkTo: "/deals/dl-ren-eastlake",
        cells: { account: "Eastlake Mechanical Contractors", tier: "Complete", arr: "$290,100", qbr: "Completed", stage: "Renewed & Synced" },
        tones: { tier: "blue", qbr: "green", stage: "green" },
      },
      {
        id: "wexcombe",
        linkTo: "/companies/co-wexcombe",
        cells: { account: "Wexcombe Plastics", tier: "Complete", arr: "$238,160", qbr: "Scheduled", stage: "QBR Scheduled" },
        tones: { tier: "blue", qbr: "blue", stage: "blue" },
      },
      {
        id: "calderwood",
        linkTo: "/companies/co-calderwood",
        cells: { account: "Calderwood Civil Engineering", tier: "Complete", arr: "$231,480", qbr: "Completed", stage: "Quote Sent" },
        tones: { tier: "blue", qbr: "green", stage: "blue" },
      },
      {
        id: "whitlow",
        linkTo: "/companies/co-whitlow",
        cells: { account: "Whitlow Orthopedic Clinic", tier: "Complete", arr: "$230,160", qbr: "Pending", stage: "At-Risk Review" },
        tones: { tier: "blue", qbr: "amber", stage: "red" },
      },
      {
        id: "orielpark",
        linkTo: "/companies/co-orielpark",
        cells: { account: "Oriel Park Senior Living", tier: "Essentials", arr: "$184,200", qbr: "Scheduled", stage: "QBR Scheduled" },
        tones: { tier: "teal", qbr: "blue", stage: "blue" },
      },
    ],
  },
};
