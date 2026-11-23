import type { ErpStockItem, GqLineTemplate, GqOption, Pack } from "../types";
import { itCustomerAgent } from "./customer-agent";
import { incidentCommsConfig } from "./incident-comms";
import { ENGINEER_RATE, MARGIN_FLOOR_PCT, product } from "./rate-card";

// Per-demo content for Professional and IT services: hero records, rate-card rules, presets, and prepared output.
// The demo templates in src/demos read everything vertical-specific from here.

const TIERS = [
  { id: "essentials", code: "ESS", label: "Essentials", hint: "$85 per user a month. Help desk in business hours", hours: 40, lead: 14 },
  { id: "complete", code: "CMP", label: "Complete", hint: "$125 per user a month. 24x7 help desk and onsite visits", hours: 60, lead: 21 },
  { id: "plus", code: "PLS", label: "Complete Plus", hint: "$165 per user a month. Adds a named engineer and quarterly planning", hours: 80, lead: 28 },
];

// A site count carries the onboarding hours and price for each service tier, so the onboarding
// line can look them up by both answers: "{sites.onb{tier.code}}".
function sitesOption(count: number, extraHours: number, lead: number): GqOption {
  const attrs: Record<string, string | number> = { lead };
  for (const tier of TIERS) {
    attrs[`hours${tier.code}`] = tier.hours + extraHours;
    attrs[`onb${tier.code}`] = (tier.hours + extraHours) * ENGINEER_RATE;
  }
  return { id: String(count), label: count === 1 ? "1 site" : `${count} sites`, ...(count > 1 ? { hint: "A managed firewall and a cutover visit at each" } : {}), attrs };
}

const SITE_COUNTS = [1, 3, 5];

// One managed network line per site count, because the quantity is the number of sites, not users.
const networkLines: GqLineTemplate[] = SITE_COUNTS.map((count) => ({
  role: "Network",
  sku: "QT-NET-SITE",
  name: "Managed network and firewall, per site",
  description: "Firewall, switching, and wireless monitored and patched at each site. Price per site, per year.",
  price: { base: product("QT-NET-SITE").price, add: [], multiply: ["term.mult"] },
  costRatio: 0.5,
  lead: { base: 0, add: [] },
  qtyPerUnit: 1,
  qtyFixed: count,
  when: { sites: [String(count)] },
  timing: "Billed monthly",
  recurring: true,
}));

/** What the customer has on contract, or what the practice has free: the text of the Available column. */
function service(sku: string, usage: string, contractPrice: number, lastOrdered: string, usualQty: number): ErpStockItem {
  const p = product(sku);
  return { sku, name: p.name, onHand: 0, usage, leadDays: p.leadDays, contractPrice, listPrice: p.price, unitCost: p.cost, lastOrdered, usualQty, timing: p.timing, ...(p.recurring ? { recurring: true } : {}) };
}

function hardware(sku: string, contractPrice: number, lastOrdered: string, usualQty: number): ErpStockItem {
  const p = product(sku);
  return { sku, name: p.name, onHand: p.onHand, leadDays: p.leadDays, contractPrice, listPrice: p.price, unitCost: p.cost, lastOrdered, usualQty, timing: p.timing };
}

const SIGN_OFF = "Tessa Marlow\nQuillon Technology Partners";

export const demos: Pack["demos"] = {
  // ---------- Guided quote: a managed services proposal ----------
  guidedQuote: {
    dealId: "dl-ashgrove",
    contactId: "ct-maya",
    intro: "Answer four discovery questions about the customer's environment. The rate card follows: managed services per user and per site, and a one-time onboarding project sized for the tier and the number of sites.",
    fields: [
      {
        id: "tier",
        label: "Service tier",
        help: "Sets the per-user rate and the size of the onboarding project.",
        options: TIERS.map((t) => ({ id: t.id, label: t.label, hint: t.hint, attrs: { code: t.code, price: product(`QT-MS-${t.code}`).price, lead: t.lead } })),
      },
      {
        id: "security",
        label: "Security add-on",
        options: [
          { id: "none", label: "None", attrs: { lead: 0 } },
          { id: "mdr", label: "Managed detection and response", hint: "$18 per user a month", attrs: { code: "MDR", name: "Managed detection and response, per user", text: "Endpoint detection watched around the clock, with response by Quillon's security team.", price: product("QT-SEC-MDR").price, lead: 3 } },
          { id: "cpl", label: "Security and compliance pack", hint: "$29 per user a month. Includes detection and response", attrs: { code: "CPL", name: "Security and compliance pack, per user", text: "Detection and response, a yearly risk assessment, policy templates, and security awareness training.", price: product("QT-SEC-CPL").price, lead: 7 } },
        ],
      },
      {
        id: "sites",
        label: "Sites",
        help: "Each site gets a managed firewall. More sites add cutover visits to onboarding.",
        options: [sitesOption(1, 0, 0), sitesOption(3, 24, 7), sitesOption(5, 48, 14)],
      },
      {
        id: "term",
        label: "Contract term",
        options: [
          { id: "12", label: "12 months", attrs: { mult: 1 } },
          { id: "24", label: "24 months", hint: "4% off managed services", attrs: { mult: 0.96 } },
          { id: "36", label: "36 months", hint: "8% off managed services", attrs: { mult: 0.92 } },
        ],
      },
    ],
    quantity: { label: "Users", options: [25, 50, 100, 250] },
    needBy: {
      label: "Service start date",
      options: [
        { id: "2w", label: "In 2 weeks", days: 14 },
        { id: "4w", label: "In 4 weeks", days: 28 },
        { id: "8w", label: "In 8 weeks", days: 56 },
      ],
    },
    constraints: [
      { when: { tier: ["essentials"] }, field: "security", disable: ["cpl"], reason: "The Security and compliance pack needs Complete or Complete Plus" },
      { when: { sites: ["5"] }, field: "tier", disable: ["essentials"], reason: "Essentials covers up to three sites" },
    ],
    lines: [
      {
        role: "Managed IT",
        sku: "QT-MS-{tier.code}",
        name: "Managed IT {tier.label}, per user",
        description: "Term: {term.label}. Price per user, per year.",
        price: { base: 0, add: ["tier.price"], multiply: ["term.mult"] },
        costRatio: 0.62,
        lead: { base: 0, add: [] },
        qtyPerUnit: 1,
        volume: true,
        timing: "Billed monthly",
        recurring: true,
      },
      {
        role: "Security",
        sku: "QT-SEC-{security.code}",
        name: "{security.name}",
        description: "{security.text}",
        price: { base: 0, add: ["security.price"], multiply: ["term.mult"] },
        costRatio: 0.55,
        lead: { base: 0, add: [] },
        qtyPerUnit: 1,
        when: { security: ["mdr", "cpl"] },
        volume: true,
        timing: "Billed monthly",
        recurring: true,
      },
      ...networkLines,
      {
        role: "Onboarding",
        sku: "QT-ONB-{tier.code}",
        name: "Onboarding project, {tier.label}",
        description: `{sites.hours{tier.code}} hours at the rate card's systems engineer rate of $${ENGINEER_RATE} an hour: discovery, move to Quillon's tools, and cutover at {sites.label}.`,
        price: { base: 0, add: ["sites.onb{tier.code}"], multiply: [] },
        costRatio: 0.73,
        lead: { base: 0, add: ["tier.lead", "sites.lead", "security.lead"] },
        qtyPerUnit: 1,
        qtyFixed: 1,
        timing: "One-time",
      },
    ],
    notes: [
      { when: { security: ["cpl"] }, text: "Security and compliance pack: the first risk assessment is part of onboarding and adds a week." },
      { when: { sites: ["3", "5"] }, text: "More than one site: each site gets a managed firewall and its own cutover visit." },
      { when: { term: ["24", "36"] }, text: "Multi-year term: managed service rates are held for the full term." },
    ],
    quantityBreaks: [
      { from: 100, multiplier: 0.95, note: "Volume tier, 100 to 249 users: 5% off per-user rates." },
      { from: 250, multiplier: 0.9, note: "Volume tier, 250 users or more: 10% off per-user rates." },
    ],
    scripted: { selections: { tier: "complete", security: "mdr", sites: "3", term: "36" }, quantity: 100, needBy: "8w" },
    quoteTitle: "Ashgrove Design Partners: Managed IT proposal",
    reportId: "it-tier-win-rate",
    reportLabel: "Tier win-rate report",
    labels: {
      source: "Rates from the rate card",
      timing: "Billing",
      leadCheck: "Onboarding takes {lead} days. Service start wanted {need} ({days} days).",
    },
  },

  // ---------- Discount approval: a blended rate under the rate-card floor ----------
  discountApproval: {
    quoteId: "q-5241",
    thresholdPct: 10,
    marginFloorPct: MARGIN_FLOOR_PCT,
    approverId: "omar",
    scriptedDiscountPct: 12,
    reportId: "it-tier-win-rate",
    reportLabel: "Tier win-rate report",
    labels: {
      ruleFloor: "an hourly rate under its rate-card floor",
      costFeed: "Loaded cost per hour on every line is synced from the PSA. Last sync {when}.",
    },
  },

  // ---------- Back-office data in HubSpot ----------
  backOffice: {
    companyId: "co-wexcombe",
    contactId: "ct-joel",
    systemLabel: "Services and finance",
    syncedAt: "@-2mi",
    orders: [
      {
        id: "agr-20418",
        number: "AGR-20418",
        date: "@-269d",
        status: "Active",
        po: "12 months",
        total: 238_160,
        lines: [
          { sku: "QT-MS-CMP", name: "Managed IT Complete, per user, per year", qty: 140, unitPrice: 1440 },
          { sku: "QT-SEC-MDR", name: "Managed detection and response, per user, per year", qty: 140, unitPrice: 204 },
          { sku: "QT-NET-SITE", name: "Managed network and firewall, Greenville and Greer", qty: 2, unitPrice: 4000 },
        ],
      },
      {
        id: "prj-3108",
        number: "PRJ-3108",
        date: "@-41d",
        status: "In progress",
        po: "Time and materials",
        total: 31_280,
        lines: [
          { sku: "QT-PS-ENG", name: "Warehouse wireless refresh: systems engineer hours. 46 worked and not yet billed", qty: 120, unitPrice: 158 },
          { sku: "QT-HW-AP", name: "Wireless access point", qty: 18, unitPrice: 520 },
          { sku: "QT-HW-SW24", name: "Managed switch, 24-port PoE", qty: 2, unitPrice: 1480 },
        ],
      },
      {
        id: "prj-2874",
        number: "PRJ-2874",
        date: "@-420d",
        status: "Completed",
        po: "Time and materials",
        total: 12_512,
        lines: [
          { sku: "QT-PS-ENG", name: "Greer plant office move: systems engineer hours", qty: 64, unitPrice: 158 },
          { sku: "QT-PS-PM", name: "Greer plant office move: project manager hours", qty: 16, unitPrice: 150 },
        ],
      },
      {
        id: "agr-17722",
        number: "AGR-17722",
        date: "@-999d",
        status: "Upgraded",
        po: "24 months",
        total: 115_200,
        lines: [{ sku: "QT-MS-ESS", name: "Managed IT Essentials, per user, per year. Replaced by AGR-20418", qty: 120, unitPrice: 960 }],
      },
    ],
    invoices: [
      { id: "inv-61190", number: "INV-61190", date: "@-8d", dueDate: "@+22d", amount: 19_847, balance: 19_847, status: "Open" },
      { id: "inv-60733", number: "INV-60733", date: "@-38d", dueDate: "@-8d", amount: 19_847, balance: 0, status: "Paid" },
      { id: "inv-60512", number: "INV-60512", date: "@-40d", dueDate: "@-10d", amount: 12_320, balance: 0, status: "Paid" },
      { id: "inv-60301", number: "INV-60301", date: "@-69d", dueDate: "@-39d", amount: 19_847, balance: 0, status: "Paid" },
    ],
    stock: [
      service("QT-MS-CMP", "140 on contract", 1440, "@-269d", 25),
      service("QT-SEC-MDR", "140 on contract", 204, "@-269d", 25),
      service("QT-PS-ENG", "64 hours this month", 158, "@-41d", 20),
      service("QT-PS-SNR", "12 hours this month", 187, "", 8),
      hardware("QT-HW-LT14", 1215, "@-130d", 25),
      hardware("QT-HW-DOCK", 205, "@-130d", 25),
      hardware("QT-HW-AP", 510, "@-41d", 4),
    ],
    scriptedSkus: ["QT-MS-CMP", "QT-SEC-MDR", "QT-HW-LT14", "QT-PS-ENG"],
    scriptedOrderId: "agr-20418",
    quoteTitle: "Wexcombe Plastics: Change order, 25 new users",
    dealName: "Wexcombe Plastics: Change order, 25 new users",
    labels: {
      live: "Live from the PSA and the finance system, read {when}",
      tabs: { orders: "Contracts", balance: "Invoices and unbilled work", stock: "Capacity and stock" },
      orders: { number: "Contract", date: "Start date", po: "Term", status: "Status", total: "Contract value" },
      balance: { open: "Open invoices", overdue: "Overdue", limit: "Unbilled work", status: "Account status" },
      stock: { onHand: "Available", none: "On order", timing: "Timing", contract: "Contract rate", list: "Rate card", last: "Last ordered" },
      add: {
        button: "Add to change order",
        help: "Starts a change order at this customer's contract rates.",
        lineNote: "Contract rate from the PSA",
        origin: "Created from the Services and finance card",
        dealType: "Change order",
      },
    },
  },

  // ---------- Lead capture to pipeline ----------
  leadCapture: {
    site: {
      company: "Quillon Technology Partners",
      url: "www.quillontech.example/request-an-assessment",
      headline: "Find out where your IT stands",
      sub: "Tell us what you want looked at. The right practice for your region replies within one business day.",
      formTitle: "Request an assessment",
      interests: ["Security and compliance", "Managed IT services", "Cloud and infrastructure projects"],
      nav: ["Managed IT", "Security", "Projects", "Request an assessment"],
      interestLabel: "What should we assess?",
      messageLabel: "What is prompting this?",
      submit: "Request an assessment",
      thanks: {
        routed: "A consultant from the right practice will reply within one business day.",
        nurture: "We have sent our IT health checklist to your inbox.",
      },
    },
    presets: [
      {
        id: "hot",
        label: "Alderbrook Family Medicine",
        outcome: "Strong fit: security practice",
        form: {
          firstName: "Priya",
          lastName: "Raman",
          email: "priya.raman@alderbrookfamilymedicine.example",
          phone: "(555) 0177-4420",
          title: "Chief Operating Officer",
          company: "Alderbrook Family Medicine",
          interest: "Security and compliance",
          message: "Our cyber insurance renews in 60 days and the carrier now requires multi-factor sign-in and endpoint detection on every device at our 8 clinics. We need an assessment and a plan before the renewal.",
        },
        company: {
          domain: "alderbrookfamilymedicine.example",
          industry: "Healthcare",
          city: "Greensboro",
          state: "NC",
          employees: 260,
          revenue: 41_000_000,
          phone: "(555) 0177-4400",
          description: "Family medicine group with eight clinics in the Piedmont Triad.",
          territory: "Southeast",
          type: "Prospect",
          extra: [
            { label: "Locations", value: "8" },
            { label: "Technologies detected", value: "Cloud productivity suite, hosted practice management" },
          ],
        },
        score: 86,
        reasons: [
          { label: "Practice fit", points: 24, detail: "Healthcare, 260 employees, 8 locations" },
          { label: "Urgency", points: 22, detail: "Cyber insurance renewal in 60 days" },
          { label: "Buying intent", points: 20, detail: "Read the cyber insurance checklist 3 times in the last 7 days" },
          { label: "Request detail", points: 20, detail: "Named the requirement, the sites, and the deadline" },
        ],
        route: { branchId: "field", ownerId: "imani", summary: "Practice area: Security and compliance. Region: Southeast. Owner: Imani Okoro" },
        task: { title: "Follow up on new inquiry: Alderbrook Family Medicine", dueInMinutes: 60, notes: "Hot assessment request from Alderbrook Family Medicine. Score 86. Cyber insurance renews in 60 days and the carrier requires multi-factor sign-in and endpoint detection at 8 clinics." },
        deal: { name: "Alderbrook Family Medicine: Security assessment and managed security", amount: 98_000 },
        alert: { channel: "#practice-security", text: "New assessment request: Priya Raman, Alderbrook Family Medicine. Score 86. Security and compliance, Southeast. Assigned to Imani Okoro. Call within 1 hour." },
      },
      {
        id: "mid",
        label: "Harrowgate Construction Group",
        outcome: "Medium fit: managed services practice",
        form: {
          firstName: "Dale",
          lastName: "Kowalczyk",
          email: "dale.kowalczyk@harrowgateconstructiongroup.example",
          phone: "(555) 0152-3318",
          title: "Controller",
          company: "Harrowgate Construction Group",
          interest: "Managed IT services",
          message: "Our IT administrator leaves at the end of next month and we do not plan to replace him. We are looking for someone to take over support for the office and four job-site trailers.",
        },
        company: {
          domain: "harrowgateconstructiongroup.example",
          industry: "Construction",
          city: "Louisville",
          state: "KY",
          employees: 85,
          revenue: 38_000_000,
          phone: "(555) 0152-3300",
          description: "Commercial general contractor working across Kentucky and southern Indiana.",
          territory: "Midwest",
          type: "Prospect",
          extra: [
            { label: "Locations", value: "1 office, 4 job sites" },
            { label: "Technologies detected", value: "On-premises file server, cloud email" },
          ],
        },
        score: 58,
        reasons: [
          { label: "Practice fit", points: 18, detail: "Construction, 85 employees" },
          { label: "Urgency", points: 16, detail: "IT administrator leaves next month" },
          { label: "Buying intent", points: 8, detail: "1 visit to the managed IT pricing page" },
          { label: "Request detail", points: 16, detail: "Scope given, no budget or start date" },
        ],
        route: { branchId: "inside", ownerId: "grant", summary: "Practice area: Managed IT services. Region: Midwest. Owner: Grant Lavelle" },
        task: { title: "Follow up on new inquiry: Harrowgate Construction Group", dueInMinutes: 480, notes: "IT administrator leaves next month and will not be replaced. Office plus four job-site trailers, 85 people. Score 58." },
        deal: { name: "Harrowgate Construction Group: Managed IT", amount: 127_500 },
        alert: { channel: "#practice-managed-services", text: "New assessment request: Dale Kowalczyk, Harrowgate Construction Group. Score 58. Managed IT services, Midwest. Assigned to Grant Lavelle. Call today." },
      },
      {
        id: "low",
        label: "Pinecone Yoga Studio",
        outcome: "Poor fit: sent to nurture",
        form: {
          firstName: "Lena",
          lastName: "Fischer",
          email: "lena.fischer@pineconeyogastudio.example",
          phone: "(555) 0119-7742",
          title: "Owner",
          company: "Pinecone Yoga Studio",
          interest: "Managed IT services",
          message: "Our Wi-Fi keeps dropping during classes. Do you fix that kind of thing?",
        },
        company: {
          domain: "pineconeyogastudio.example",
          industry: "Fitness",
          city: "Asheville",
          state: "NC",
          employees: 4,
          revenue: 0,
          phone: "(555) 0119-7700",
          description: "Yoga studio with one location.",
          territory: "Southeast",
          type: "Other",
          extra: [{ label: "Locations", value: "1" }],
        },
        score: 18,
        reasons: [
          { label: "Practice fit", points: 3, detail: "4 employees, below the 20-user minimum" },
          { label: "Urgency", points: 5, detail: "No date given" },
          { label: "Buying intent", points: 0, detail: "No visits before the form" },
          { label: "Request detail", points: 10, detail: "One problem described" },
        ],
        route: { branchId: "nurture", ownerId: null, summary: "Score under 40: nurture. No owner assigned" },
      },
    ],
    scriptedPresetId: "hot",
    workflowId: "wf-assessment-routing",
    dealStage: "new-rfq",
    assessmentFollowUp: {
      channelLabel: "Security Assessment Findings & Proposal Handoff",
      windowTitle: "Quillon Security Practice · Assessment Findings Report",
      inboxAddress: "assessments.quillontech.example/reports/alderbrook-2026-sec",
      senderName: "Imani Okoro",
      senderTitle: "Security Consultant, Southeast",
      senderEmail: "imani.okoro@quillontech.example",
      callSummaryTitle: "Discovery & Clinic Risk Walk-Through Complete (45 min)",
      callSummaryBody:
        "Imani Okoro completed the technical discovery call with COO Priya Raman and Alderbrook's clinic administrator across all 8 Piedmont Triad locations. Three gaps block cyber-insurance renewal in 60 days.",
      emailSubject: "Alderbrook Family Medicine — Security Assessment Findings & 60-Day Remediation Plan",
      emailPreview: "Three priority controls required before your cyber-insurance renewal in 60 days, plus a tailored proposal.",
      emailBody:
        "Hi Priya,\n\nThank you for walking through all eight clinics with us today. Attached is your Security Assessment Findings Report highlighting the three controls your cyber insurance carrier requires before renewal in 60 days:\n\n1. Enforce phishing-resistant MFA across all 260 Microsoft 365 & EHR logins (currently 41% coverage).\n2. Deploy 24x7 Managed Detection & Response (MDR) across all 8 clinic workstations and servers.\n3. Replace unmanaged clinic routers with centrally monitored firewalls and segmented clinical Wi-Fi.\n\nI have also prepared a tailored proposal in HubSpot covering Security & Compliance for 260 users, managed firewalls for 8 sites, and fixed-fee onboarding.\n\n— Imani Okoro, Security Consultant, Quillon Technology Partners",
      attachmentName: "Alderbrook_Security_Assessment_Findings_2026.pdf",
      attachmentMeta: "PDF · 14 pages · Executive summary + 8-clinic remediation roadmap",
      findings: [
        {
          id: "f-mfa",
          severity: "Critical",
          title: "Identity & MFA coverage at 41%",
          detail: "153 of 260 clinic accounts lack MFA on Microsoft 365 and hosted EHR sign-in.",
          remediation: "Enforce conditional MFA + SSO in Week 1",
        },
        {
          id: "f-mdr",
          severity: "High",
          title: "No 24x7 Managed Detection & Response (MDR)",
          detail: "Standard antivirus only; insurer now mandates continuous EDR telemetry and SOC response.",
          remediation: "Roll out Security & Compliance Pack across 260 users",
        },
        {
          id: "f-fw",
          severity: "High",
          title: "Unmanaged clinic edge routers",
          detail: "Eight Piedmont Triad offices run standalone routers with no centralized firmware patching.",
          remediation: "Deploy managed firewalls at all 8 clinics",
        },
        {
          id: "f-train",
          severity: "Medium",
          title: "Missing annual security awareness log",
          detail: "No documented HIPAA / phishing simulation evidence for cyber-insurance underwriters.",
          remediation: "Include automated training & yearly risk assessment",
        },
      ],
      proposalTitle: "Alderbrook Family Medicine: Security & Compliance Remediation Proposal",
      proposalStage: "quote-sent",
      proposalLines: [
        { sku: "QT-SEC-CPL", qty: 260, note: "24x7 MDR, MFA rollout, annual risk assessment & awareness training (260 users)" },
        { sku: "QT-NET-SITE", qty: 8, note: "Managed edge firewall, patching & clinical Wi-Fi segmentation (8 clinics)" },
        { sku: "QT-ONB-CMP", qty: 1, note: "Fixed-fee security remediation & 8-clinic cutover inside 60-day renewal window" },
      ],
      reportId: "it-assessment-funnel",
      reportLabel: "Assessments to proposals funnel",
    },
  },

  // ---------- Email to deal ----------
  emailToDeal: {
    sampleIds: ["th-fenwick-po", "th-stonewick-rfp", "th-brookmere-request"],
    scriptedThreadId: "th-fenwick-po",
    dealStage: "new-rfq",
    labels: {
      empty: "Purchase orders and RFPs from customers land here.",
      flagged: "No exact match. Pick the right item:",
      confirm: "Confirm the flagged item first.",
      total: "Deal amount at the rate card",
      dealType: "Existing business",
    },
  },

  // ---------- AI prospecting ----------
  aiProspecting: {
    companyId: "co-orielpark",
    signalDetail: {
      fed: {
        title: "22 network devices reach end of support in 120 days",
        source: "PSA asset inventory",
        detail: "14 switches and 8 firewalls at six communities stop receiving security updates in 120 days.",
        bars: [
          { label: "Network devices under management", value: 41, unit: "devices" },
          { label: "Reaching end of support in 120 days", value: 22, unit: "devices", now: true },
        ],
        footnote: "Calculated from the managed asset inventory in the PSA.",
      },
      native: {
        title: "New Chief Information Officer appointed",
        source: "Company news",
        detail: "Ingrid Solberg joined this month as the company's first Chief Information Officer.",
        footnote: "Found by Breeze from public company news.",
      },
    },
    whyNow: {
      headline: "Oriel Park Senior Living has a new CIO, three newly acquired communities, and 22 network devices that reach end of support in 120 days.",
      points: [
        { label: "End of support", detail: "14 switches and 8 firewalls at six communities stop receiving security updates in 120 days.", source: "PSA asset inventory" },
        { label: "New CIO", detail: "Ingrid Solberg started this month as the company's first Chief Information Officer.", source: "Company news" },
        { label: "Acquisition", detail: "Bought three communities in South Carolina last quarter. Their networks are not yet under management.", source: "Company news" },
        { label: "Renewal", detail: "The managed network and help desk contract renews in 148 days.", source: "PSA contracts" },
      ],
    },
    buyingGroup: [
      { id: "bg-ingrid", name: "Ingrid Solberg", title: "Chief Information Officer", role: "Decision Maker", email: "ingrid.solberg@orielparkseniorliving.example", contactId: null, why: "Started this month. Owns the technology budget and the plan for the acquired communities." },
      { id: "bg-vivian", name: "Vivian Achterberg", title: "Director of IT", role: "Champion", email: "vivian.achterberg@orielparkseniorliving.example", contactId: "ct-vivian", why: "Day-to-day contact for two years. Asked for help planning the new communities six days ago." },
      { id: "bg-desmond", name: "Desmond Farrow", title: "Procurement Manager", role: "Budget Holder", email: "desmond.farrow@orielparkseniorliving.example", contactId: "ct-desmond", why: "Signs hardware purchases. Last contacted four months ago about next year's price list." },
    ],
    drafts: {
      "bg-ingrid": [
        {
          tone: "Direct",
          subject: "Your network: 22 devices reach end of support in 120 days",
          body: `Hi Ingrid,\n\nWelcome to Oriel Park. Quillon manages the network and help desk for your nine communities, and I look after the account.\n\nOne item for your first weeks: 14 switches and 8 firewalls at six communities reach end of support in 120 days. After that they stop receiving security updates. The three communities you acquired in South Carolina are not on the managed network yet either.\n\nI would like to walk you through a refresh plan that covers both. Do you have 30 minutes next week?\n\n${SIGN_OFF}`,
        },
        {
          tone: "Consultative",
          subject: "A network plan for your first 90 days",
          body: `Hi Ingrid,\n\nCongratulations on the new role. I manage Oriel Park's account at Quillon, where we look after the network and help desk for your nine communities.\n\nNew technology leaders often ask us for one picture of what is in place and what needs attention. For Oriel Park, two things stand out: network equipment at six communities reaches end of support in 120 days, and the three acquired communities still run on their own networks.\n\nI can bring the asset inventory and a draft plan, and adjust it to your priorities. Would that be useful?\n\n${SIGN_OFF}`,
        },
        {
          tone: "Brief",
          subject: "Introduction: Quillon Technology Partners",
          body: `Hi Ingrid,\n\nWelcome to Oriel Park. Quillon manages your network and help desk. 22 of your network devices reach end of support in 120 days, and I would like to show you the plan. Is there a good time next week?\n\n${SIGN_OFF}`,
        },
      ],
      "bg-vivian": [
        {
          tone: "Direct",
          subject: "End of support at six communities, and the new sites",
          body: `Hi Vivian,\n\nOur asset inventory shows 14 switches and 8 firewalls at six communities reaching end of support in 120 days. That lines up with the three South Carolina communities you asked about last week.\n\nI suggest one project: replace the equipment and bring the new communities onto the managed network at the same time, so your team has one cutover to plan around.\n\nCan we meet this week to scope it before you brief Ingrid?\n\n${SIGN_OFF}`,
        },
        {
          tone: "Consultative",
          subject: "Planning the network refresh with you",
          body: `Hi Vivian,\n\nYou mentioned the three new communities come onto your network this year. While looking at that, we found that the switches and firewalls at six existing communities reach end of support in 120 days.\n\nDoing both together usually costs less engineer time than two projects, and it gives you one standard build across all twelve communities. I can send the device list by community so you can check it against what you see on site.\n\nWould you like it before your first planning session with Ingrid?\n\n${SIGN_OFF}`,
        },
        {
          tone: "Brief",
          subject: "Device list for the refresh",
          body: `Hi Vivian,\n\n22 switches and firewalls at six communities reach end of support in 120 days. Shall I send the list by community, with a draft plan that includes the three new sites?\n\n${SIGN_OFF}`,
        },
      ],
      "bg-desmond": [
        {
          tone: "Direct",
          subject: "Hardware for a network refresh this year",
          body: `Hi Desmond,\n\nA heads-up for your budget: 14 switches and 8 firewalls across six Oriel Park communities reach end of support in 120 days and will need replacing.\n\nI can send current pricing for the replacements, with the lead time on each, so nothing is ordered late.\n\nWould a price list by community help?\n\n${SIGN_OFF}`,
        },
        {
          tone: "Consultative",
          subject: "Getting ahead of the network hardware order",
          body: `Hi Desmond,\n\nWe last spoke about next year's hardware price list. Since then our inventory has flagged 22 switches and firewalls at six communities that reach end of support in 120 days.\n\nOrdering them as one purchase, together with equipment for the three new communities, gives you one purchase order and one delivery schedule. I can prepare the list with quantities by community for your review.\n\nWhen would you want it?\n\n${SIGN_OFF}`,
        },
        {
          tone: "Brief",
          subject: "Price list for replacement network hardware",
          body: `Hi Desmond,\n\n22 switches and firewalls at Oriel Park reach end of support in 120 days. Would you like a price list with lead times?\n\n${SIGN_OFF}`,
        },
      ],
    },
    followUp: { title: "Follow up with the Oriel Park Senior Living buying group", dueInDays: 3 },
    offPlatformMeeting: {
      inboxEmail: "ingrid.solberg@orielparkseniorliving.example",
      recipientName: "Ingrid Solberg",
      recipientTitle: "Chief Information Officer",
      practiceName: "Oriel Park Senior Living (12 Communities)",
      senderName: "Tessa Marlow",
      senderTitle: "Account Executive, Southeast · Quillon Technology Partners",
      meetingTitle: "Network Refresh & 3-Site Acquisition Scope Review",
      meetingLocation: "Microsoft Teams (with Solutions Architect Soledad Ruiz)",
      meetingDuration: "30 minutes",
      bookingUrl: "meetings.quillontech.example/tessa-marlow/network-refresh-review",
      agenda: [
        "Walk through the 22 switches and firewalls reaching end of support in 120 days across 6 communities",
        "Review standardization options for the 3 newly acquired South Carolina communities",
        "Align one combined hardware order and cutover schedule ahead of the 148-day contract renewal",
      ],
      slots: [
        { id: "slot-tue", day: "Tue, Nov 24", time: "10:00 AM", tz: "ET" },
        { id: "slot-wed", day: "Wed, Nov 25", time: "2:30 PM", tz: "ET" },
        { id: "slot-thu", day: "Thu, Nov 26", time: "11:00 AM", tz: "ET" },
      ],
      defaultSlotId: "slot-tue",
      complianceNote: "Booked through HubSpot Meetings — syncs calendar invite, logs meeting on Ingrid Solberg, and opens the refresh deal in Services pipeline.",
      channelLabel: "CIO Inbox & Meeting Confirmation",
      mailClientName: "Oriel Park Mail",
      inboxBreadcrumb: "Oriel Park Executive Inbox · Managed IT Refresh",
      openButtonLabel: "View CIO reply & meeting booking",
      bookedButtonLabel: "Meeting confirmed — view CIO inbox",
      slotHeading: "Pick a slot on Tessa Marlow's HubSpot calendar",
      confirmButtonLabel: "Confirm refresh review meeting",
      confirmedHeadline: "Refresh review confirmed & synced to HubSpot",
      bookingForLabel: "Booked for",
      dealCreated: {
        id: "dl-oriel-refresh",
        name: "Oriel Park Senior Living: 22-Device Network Refresh & 3-Site Rollout",
        amount: 194_000,
        stage: "qualified",
      },
    },
    reportId: "it-signal-pipeline",
    reportLabel: "View pipeline by signal report",
  },

  // ---------- Customer Agent: IT service desk (Chat, Email & L2 Escalation) ----------
  customerAgent: itCustomerAgent,

  // ---------- Tickets: IT Services #5 (Incident communication) ----------
  tickets: {
    "incident-comms": incidentCommsConfig,
  },
};
