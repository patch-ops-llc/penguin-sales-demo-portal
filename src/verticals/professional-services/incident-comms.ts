import type { AnalyticsReportSpec, TicketsDemoConfig } from "../types";

/**
 * IT Services #5 (`incident-comms`): Incident communication for Quillon Technology Partners.
 *
 * Guardrails:
 * - 100% fictional MSP accounts, people, domains (`*.example`), devices, and metrics.
 * - Penguin marker (`by: "penguin"`) ONLY on `rmm-outage-resolver` (RMM / Monitoring Outage Trigger
 *   & Impacted-Asset Resolver). ZERO Penguin markers on native incident ticket, impacted-company
 *   associations, batch customer notifications, status updates, post-incident summary, or MTTR report.
 */
export const incidentCommsConfig: TicketsDemoConfig = {
  demoId: "incident-comms",
  mode: "incident",
  pipelineName: "Managed IT Incidents",
  stages: [
    { id: "investigating", label: "Investigating (SEV-1)" },
    { id: "notified-mitigating", label: "Customers Notified" },
    { id: "resolved", label: "Resolved & Summary Sent", closed: true },
  ],
  ticket: {
    id: "tkt-it-inc-1",
    number: "INC-9042",
    subject: "SEV-1: Southeast Core VPN & Firewall Gateway Degradation (RDU-GW-02)",
    category: "Network & Edge Firewall",
    locationLabel: "Southeast Core POP (NC / SC / GA)",
    sourceLabel: "Datadog / Quillon RMM Watch",
    priority: "Urgent",
    ownerId: "soledad",
    contactId: "ct-vivian",
    companyId: "co-orielpark",
    initialStageId: "investigating",
    inProgressStageId: "notified-mitigating",
    resolvedStageId: "resolved",
    summary:
      "Upstream carrier BGP flap at Quillon's Southeast Core POP (RDU-GW-02) caused 41.8% packet loss and dropped 14 of 19 managed site-to-site IPsec VPN tunnels across 4 managed IT clients. Auto-opened in HubSpot Service Hub with all impacted companies mapped.",
  },
  queueSeeds: [
    {
      id: "tkt-it-inc-seed-1",
      number: "INC-9039",
      subject: "Microsoft 365 Exchange Online mail-flow delay (Midwest tenants)",
      pipeline: "Managed IT Incidents",
      stageId: "resolved",
      priority: "High",
      ownerId: "grant",
      contactId: "ct-august",
      companyId: "co-calderwood",
      locationOrCategory: "Cloud & Email · Midwest",
      createdAt: "@-2d",
      slaLabel: "Resolved in 38m",
    },
    {
      id: "tkt-it-inc-seed-2",
      number: "INC-9036",
      subject: "Secondary ISP circuit failover flap at Richmond distribution hub",
      pipeline: "Managed IT Incidents",
      stageId: "resolved",
      priority: "High",
      ownerId: "soledad",
      contactId: "ct-freya",
      companyId: "co-ravensworth",
      locationOrCategory: "Managed Network · Virginia",
      createdAt: "@-5d",
      slaLabel: "Resolved in 52m",
    },
    {
      id: "tkt-it-inc-seed-3",
      number: "INC-9031",
      subject: "EDR agent signature sync warning across 18 advisory workstations",
      pipeline: "Managed IT Incidents",
      stageId: "resolved",
      priority: "Medium",
      ownerId: "imani",
      contactId: "ct-julian",
      companyId: "co-kingsmead",
      locationOrCategory: "Endpoint Security · Midwest",
      createdAt: "@-9d",
      slaLabel: "Resolved in 29m",
    },
  ],
  sla: {
    priority: "Urgent",
    targetLabel: "15-min P1 customer alert SLA · 60-min MTTR target",
    dueLabel: "Alert SLA: 9m left",
    elapsedPct: 38,
    overdue: false,
  },
  impactedAccounts: [
    {
      companyId: "co-orielpark",
      companyName: "Oriel Park Senior Living",
      tier: "Managed Network & Help Desk",
      affectedAssets: "FW-ATL-01 + 6 GA/SC community VPN spokes",
      primaryContactName: "Vivian Achterberg",
      primaryContactEmail: "vivian.achterberg@orielparkseniorliving.example",
    },
    {
      companyId: "co-thornbury",
      companyName: "Thornbury Legal Group",
      tier: "Managed IT Complete + Compliance",
      affectedAssets: "FW-CLT-01 + 2 Charlotte/Raleigh IPsec tunnels",
      primaryContactName: "Rashid Mahmoud",
      primaryContactEmail: "rashid.mahmoud@thornburylegalgroup.example",
    },
    {
      companyId: "co-wexcombe",
      companyName: "Wexcombe Plastics",
      tier: "Managed IT Complete",
      affectedAssets: "FW-GVL-01 & FW-GRR-02 (Greenville/Greer plants)",
      primaryContactName: "Joel Banerjee",
      primaryContactEmail: "joel.banerjee@wexcombeplastics.example",
    },
    {
      companyId: "co-fenwick",
      companyName: "Fenwick Lane Pediatrics",
      tier: "Managed IT Essentials",
      affectedAssets: "FW-DUR-01 + 4 Durham clinic VPN spokes",
      primaryContactName: "Rosalind Mbeki",
      primaryContactEmail: "rosalind.mbeki@fenwicklanepediatrics.example",
    },
  ],
  offPlatform: {
    channelLabel: "RMM / Network Monitoring Console",
    windowTitle: "Quillon NOC · Datadog & RMM Outage Monitor",
    address: "noc-monitor.quillontech.example/alerts/MON-2026-9941",
    brandName: "Quillon Network Operations Center",
    brandSubtitle: "24x7 Managed Infrastructure Monitoring",
    headline: "Regional Firewall & VPN Gateway Degradation",
    intro: "Packet loss spiked above 40% on Southeast Core POP gateway RDU-GW-02, interrupting managed IPsec VPN tunnels across four client environments.",
    triggerExt: {
      extId: "rmm-outage-resolver",
      title: "RMM / Monitoring Outage Trigger & Impacted-Asset Resolver",
      badge: "4 Clients Mapped",
      badgeTone: "purple",
      subtitle:
        "Custom Penguin middleware ingests the Datadog/RMM outage webhook, resolves affected firewall serials in the PSA CMDB, and attaches all 4 impacted managed companies to the HubSpot incident ticket.",
      fields: [
        { label: "Monitor source", value: "Datadog + Quillon RMM Watch" },
        { label: "Alert ref", value: "MON-2026-9941 · SEV-1 Core POP" },
        { label: "Assets matched", value: "14 VPN tunnels across 4 managed companies" },
        { label: "HubSpot action", value: "Open INC-9042 & attach impacted accounts" },
      ],
      footnote: "Only the external RMM outage webhook and asset-to-company CMDB resolver are custom-built; the incident ticket and customer broadcasts are native Service Hub.",
    },
    incident: {
      monitorTool: "Datadog / Quillon RMM Watch",
      alertId: "MON-2026-9941",
      severity: "SEV-1",
      serviceName: "Southeast Core VPN & Firewall Gateway (RDU-GW-02)",
      detectedAtLabel: "Today · 11:04 AM ET (Automated SNMP + BGP probe)",
      summary:
        "Upstream fiber carrier BGP session instability on RDU-GW-02 triggered 41.8% packet loss and Phase-2 IPsec tunnel drops across 14 managed branch gateways serving 4 Southeast MSP clients.",
      metrics: [
        { label: "Gateway Packet Loss", value: "41.8%" },
        { label: "VPN Tunnels Down", value: "14 / 19" },
        { label: "Impacted Accounts", value: "4 Clients" },
      ],
      ctaLabel: "Trigger HubSpot incident ticket & map accounts",
    },
  },
  secondaryOffPlatform: {
    channelLabel: "Customer Outage Notification Email",
    windowTitle: "Oriel Park Mail · Quillon Service Status Alert",
    address: "mail.orielparkseniorliving.example/inbox/inc-9042-notice",
    fromName: "Quillon Network Operations",
    fromEmail: "status@quillontech.example",
    toName: "Vivian Achterberg (and 3 other impacted IT contacts)",
    toEmail: "vivian.achterberg@orielparkseniorliving.example",
    subject: "[INC-9042] Proactive Alert: Southeast VPN Gateway Degradation — Mitigation Underway",
    badge: "Batch Alert Sent · 4 Accounts",
    body:
      "Hello Vivian,\n\nQuillon's 24x7 monitoring detected upstream carrier packet loss affecting our Southeast Core VPN gateway (RDU-GW-02) at 11:04 AM ET. Your Atlanta HQ firewall (FW-ATL-01) and six Georgia/South Carolina community VPN tunnels are currently experiencing intermittent latency.\n\nCurrent action: Senior Network Architect Soledad Ruiz is rerouting BGP traffic onto our secondary carrier circuit now. No action is needed from your team.\n\nWe will send the next live status update within 20 minutes or as soon as all tunnels stabilize.\n\n— Quillon Technology Partners NOC · Reference INC-9042",
    footnote: "Delivered directly from HubSpot Service Hub to the primary IT contact on each associated managed company.",
    ctaLabel: "Return to incident ticket INC-9042",
  },
  outreach: {
    heading: "Live Recovery Update & Post-Incident Summary",
    channelLabel: "Recovery Status & Summary Email",
    recipientLabel: "All 4 Impacted Managed Companies (Vivian Achterberg, Rashid Mahmoud, Joel Banerjee, Rosalind Mbeki)",
    subject: "[INC-9042 RESOLVED] Southeast VPN Gateway Restored + Post-Incident Summary",
    defaultBody:
      "Hello everyone,\n\nUpdate at 11:36 AM ET: Traffic on Southeast Core POP gateway RDU-GW-02 has been shifted to our clean secondary fiber carrier and all 14 affected site-to-site IPsec VPN tunnels across Oriel Park Senior Living, Thornbury Legal Group, Wexcombe Plastics, and Fenwick Lane Pediatrics are back online with normal latency (< 16 ms).\n\nRoot cause: Upstream carrier BGP route flap (11:04–11:32 AM ET, 32-minute total duration). Preventative action: Automated BGP dampen threshold tightened and carrier circuit escalation logged.\n\nA downloadable post-incident summary has been attached to your account timeline in HubSpot.\n\n— Soledad Ruiz, Solutions Architect, Quillon Technology Partners",
    followUpNote:
      "Verified 0.0% packet loss for 15 consecutive minutes across FW-ATL-01, FW-CLT-01, FW-GVL-01, FW-GRR-02, and FW-DUR-01. Published post-incident summary to all 4 impacted managed companies; 0 inbound panic tickets opened thanks to proactive 6-minute notification.",
    sendButtonLabel: "Send recovery update to 4 accounts",
    resolveButtonLabel: "Publish summary & close incident",
    resolutionSummary: "Resolved in 32m MTTR · Post-incident summary sent to 4 accounts",
  },
  externalCard: {
    extId: "rmm-outage-resolver",
    title: "RMM / Monitoring Outage Trigger & Asset Resolver",
    badge: "Datadog + PSA CMDB",
    badgeTone: "purple",
    subtitle: "Matched RDU-GW-02 gateway telemetry against PSA firewall serials to auto-link all 4 impacted managed companies.",
    fields: [
      { label: "Alert ref", value: "MON-2026-9941 (SEV-1)" },
      { label: "Core POP", value: "RDU-GW-02 · Southeast Fiber" },
      { label: "Resolved tunnels", value: "14 IPsec peers -> 4 companies" },
      { label: "Proactive alert", value: "Sent 6m after detection (15m SLA)" },
    ],
  },
  workflowNote: {
    name: "Service | Major Incident -> Impacted Account Comms",
    trigger: "SEV-1/SEV-2 monitoring ticket opened in Managed IT Incidents",
    action: "Assign to Soledad Ruiz, start 15-min P1 customer alert SLA, and stage batch outage notice for all associated accounts.",
  },
  reportId: "it-incident-mttr",
  reportButtonLabel: "Incidents & MTTR Report",
};

/**
 * Shared native HubSpot Analytics report (`/reports/it-incident-mttr`):
 * Incidents, MTTR & customers affected. ZERO Penguin markers (`creditsOutcome` intentionally omitted).
 */
export const itIncidentMttrReport: AnalyticsReportSpec = {
  id: "it-incident-mttr",
  title: "Incidents, MTTR & Customers Affected",
  subtitle: "Quillon Technology Partners · 90-day Service Hub incident volume, mean time to resolve, and proactive customer communication",
  badge: "Service Hub Reporting",
  badgeTone: "green",
  demoId: "incident-comms",
  backLink: { to: "/tickets", label: "Back to Incidents" },
  completeFlag: "tk.incident-comms.reportReviewed",
  filter: {
    label: "Severity",
    defaultOptionId: "all",
    options: [
      { id: "all", label: "All incidents (18)" },
      {
        id: "sev1",
        label: "SEV-1 Critical (4)",
        kpis: [
          { id: "incidents", label: "SEV-1 Incidents (90d)", value: "4", delta: "-2 vs prior", note: "Includes INC-9042 (RDU-GW-02)", tone: "amber" },
          { id: "mttr", label: "Median MTTR", value: "36 min", delta: "-19 min faster", note: "Target: under 60 minutes", tone: "green" },
          { id: "affected", label: "Customers Affected", value: "15", delta: "3.8 avg / inc", note: "100% notified inside 15m SLA", tone: "teal" },
          { id: "proactive", label: "Proactive Notice Rate", value: "100%", delta: "6m avg notice", note: "Before first inbound client call", tone: "green" },
        ],
        table: {
          title: "SEV-1 Critical Incidents — Last 90 Days",
          subtitle: "Linked to Service Hub incident tickets",
          columns: [
            { key: "incident", label: "Incident" },
            { key: "category", label: "Infrastructure", tag: true },
            { key: "customers", label: "Clients Affected", align: "right" },
            { key: "notice", label: "First Notice", align: "right" },
            { key: "mttr", label: "MTTR", align: "right" },
            { key: "status", label: "Status", tag: true },
          ],
          rows: [
            {
              id: "inc-9042",
              linkTo: "/tickets/tkt-it-inc-1",
              cells: {
                incident: "INC-9042 · Southeast Core VPN Gateway (RDU-GW-02)",
                category: "Network & VPN",
                customers: "4 accounts",
                notice: "6 min",
                mttr: "32 min",
                status: "Resolved",
              },
              tones: { category: "red", status: "green" },
            },
            {
              id: "inc-9028",
              cells: {
                incident: "INC-9028 · Regional DNS Resolver Timeout (CLT-DNS-01)",
                category: "Core DNS",
                customers: "5 accounts",
                notice: "5 min",
                mttr: "34 min",
                status: "Resolved",
              },
              tones: { category: "orange", status: "green" },
            },
            {
              id: "inc-9014",
              cells: {
                incident: "INC-9014 · Cloud Backup Vault Auth Latency",
                category: "Backup & DR",
                customers: "3 accounts",
                notice: "8 min",
                mttr: "41 min",
                status: "Resolved",
              },
              tones: { category: "blue", status: "green" },
            },
            {
              id: "inc-9003",
              cells: {
                incident: "INC-9003 · Midwest Fiber Ring Cutover Flap",
                category: "Network & VPN",
                customers: "3 accounts",
                notice: "7 min",
                mttr: "39 min",
                status: "Resolved",
              },
              tones: { category: "red", status: "green" },
            },
          ],
        },
      },
      {
        id: "sev2",
        label: "SEV-2 Degraded (14)",
        kpis: [
          { id: "incidents", label: "SEV-2 Incidents (90d)", value: "14", delta: "-3 vs prior", note: "Single-tenant or non-critical services", tone: "blue" },
          { id: "mttr", label: "Median MTTR", value: "44 min", delta: "-12 min faster", note: "Target: under 90 minutes", tone: "green" },
          { id: "affected", label: "Customers Affected", value: "46", delta: "3.3 avg / inc", note: "Batch updates sent via Service Hub", tone: "teal" },
          { id: "proactive", label: "Proactive Notice Rate", value: "92.8%", delta: "+6.4 pts", note: "Cut inbound help-desk spikes by 68%", tone: "green" },
        ],
      },
    ],
  },
  kpis: [
    { id: "incidents", label: "Total Incidents (90d)", value: "18", delta: "-21% QoQ", note: "4 SEV-1 critical · 14 SEV-2 degraded", tone: "neutral" },
    { id: "mttr", label: "Median MTTR", value: "41 min", delta: "-15 min faster", note: "INC-9042 resolved in 32 minutes", tone: "green" },
    { id: "affected", label: "Customers Affected (90d)", value: "61", delta: "3.4 avg / inc", note: "Auto-mapped from RMM to HubSpot", tone: "teal" },
    { id: "proactive", label: "Proactive Notice Rate", value: "94.4%", delta: "-68% call surge", note: "Notified before first client ticket", tone: "green" },
  ],
  breakdowns: [
    {
      id: "incidents-by-category",
      title: "Incidents & MTTR by Infrastructure Category",
      subtitle: "90-day breakdown across Quillon's managed infrastructure stack",
      kind: "bars",
      badge: "18 incidents",
      badgeTone: "teal",
      rows: [
        { label: "Managed Network, Firewall & VPN", value: 7, displayValue: "7 incidents", meta: "37m avg MTTR · 25 accounts", tone: "orange" },
        { label: "Microsoft 365 & Cloud Identity", value: 5, displayValue: "5 incidents", meta: "42m avg MTTR · 19 accounts", tone: "blue" },
        { label: "Endpoint Security & EDR Sync", value: 4, displayValue: "4 incidents", meta: "35m avg MTTR · 11 accounts", tone: "teal" },
        { label: "Managed Backup & DR Storage", value: 2, displayValue: "2 incidents", meta: "51m avg MTTR · 6 accounts", tone: "amber" },
      ],
    },
    {
      id: "incident-comms-funnel",
      title: "Incident Communication & SLA Attainment",
      subtitle: "Share of incidents meeting every proactive communication milestone",
      kind: "funnel",
      badge: "94.4% proactive",
      badgeTone: "green",
      rows: [
        { label: "RMM alerts mapped to HubSpot incident tickets", value: 18, displayValue: "18 (100%)", pct: 100, tone: "blue" },
        { label: "Proactive batch customer alert sent inside 15m SLA", value: 17, displayValue: "17 (94.4%)", pct: 94, tone: "teal" },
        { label: "Resolved within MTTR target (< 60m SEV-1 / < 90m SEV-2)", value: 17, displayValue: "17 (94.4%)", pct: 94, tone: "orange" },
        { label: "Post-incident summary published to client timelines", value: 18, displayValue: "18 (100%)", pct: 100, tone: "green" },
      ],
    },
  ],
  table: {
    title: "Recent Managed IT Incidents & Affected Accounts",
    subtitle: "90-day Service Hub incident log",
    columns: [
      { key: "incident", label: "Incident" },
      { key: "category", label: "Category", tag: true },
      { key: "customers", label: "Clients Affected", align: "right" },
      { key: "notice", label: "First Notice", align: "right" },
      { key: "mttr", label: "MTTR", align: "right" },
      { key: "status", label: "Status", tag: true },
    ],
    rows: [
      {
        id: "inc-9042",
        linkTo: "/tickets/tkt-it-inc-1",
        cells: {
          incident: "INC-9042 · Southeast Core VPN Gateway (RDU-GW-02)",
          category: "SEV-1 · Network",
          customers: "4 accounts",
          notice: "6 min",
          mttr: "32 min",
          status: "Resolved",
        },
        tones: { category: "red", status: "green" },
      },
      {
        id: "inc-9039",
        cells: {
          incident: "INC-9039 · M365 Exchange Online Mail-Flow Delay",
          category: "SEV-2 · Cloud",
          customers: "5 accounts",
          notice: "9 min",
          mttr: "38 min",
          status: "Resolved",
        },
        tones: { category: "blue", status: "green" },
      },
      {
        id: "inc-9036",
        cells: {
          incident: "INC-9036 · Richmond Branch ISP Failover Flap",
          category: "SEV-2 · Network",
          customers: "2 accounts",
          notice: "11 min",
          mttr: "52 min",
          status: "Resolved",
        },
        tones: { category: "amber", status: "green" },
      },
      {
        id: "inc-9031",
        cells: {
          incident: "INC-9031 · EDR Agent Signature Sync Warning",
          category: "SEV-2 · Security",
          customers: "3 accounts",
          notice: "8 min",
          mttr: "29 min",
          status: "Resolved",
        },
        tones: { category: "teal", status: "green" },
      },
    ],
  },
};
