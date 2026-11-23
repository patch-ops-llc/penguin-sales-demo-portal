import type { GqOption, Pack } from "../types";
import { customerAgent } from "./customer-agent";
import { docFee, factor, INSPECTION_FROM, LINE_RATE, monthlyPayment, TERMS, TIER_RATE, usd } from "./rates";

// Per-demo content for Financial services and fintech: hero records, pricing rules, presets, and prepared output.
// The demo templates in src/demos read everything vertical-specific from here.

const DOWN_PAYMENTS = [
  { code: "None", share: 0 },
  { code: "Ten", share: 0.1 },
  { code: "Twenty", share: 0.2 },
];

// An equipment cost carries the amount financed for each down payment, so the payment line can
// look it up by both answers: "{cost.fin{down.code}}".
function costOption(id: string, amount: number): GqOption {
  const attrs: Record<string, string | number> = { docFee: docFee(amount), lead: amount >= INSPECTION_FROM ? 3 : 0 };
  for (const { code, share } of DOWN_PAYMENTS) {
    const financed = Math.round(amount * (1 - share));
    attrs[`fin${code}`] = financed;
    attrs[`finLabel${code}`] = usd(financed);
  }
  return { id, label: usd(amount), attrs };
}

// A credit tier carries its payment factor for each term: "{tier.factor{quantity}}".
function tierOption(id: keyof typeof TIER_RATE, label: string, hint: string, lead: number): GqOption {
  const rate = TIER_RATE[id];
  const attrs: Record<string, string | number> = { lead, noteEFA: `Fixed rate ${rate}%.`, noteFMV: `${label} lease pricing.` };
  for (const months of TERMS) attrs[`factor${months}`] = factor(rate, months);
  return { id, label, hint, attrs };
}

const CREDIT_LIMIT = 2_000_000;
const OUTSTANDING = 1_395_207;
const AVAILABLE = CREDIT_LIMIT - OUTSTANDING;

// A new schedule under Calloway's master line, priced at the rate the line holds.
function draw(sku: string, amount: number, months: number, lastOrdered: string) {
  const list = monthlyPayment("FC-EFA-PMT", months, amount);
  return {
    sku,
    name: `New schedule: ${usd(amount)} over ${months} months`,
    onHand: 0,
    usage: amount > AVAILABLE ? "Over the limit" : usd(AVAILABLE - amount),
    leadDays: 3,
    contractPrice: monthlyPayment("FC-EFA-PMT", months, amount, LINE_RATE),
    listPrice: list,
    unitCost: Math.round(list * 0.9),
    lastOrdered,
    usualQty: months,
    timing: "Monthly",
  };
}

export const demos: Pack["demos"] = {
  // ---------- Guided quote ----------
  guidedQuote: {
    dealId: "dl-bramhall",
    contactId: "ct-noelle",
    intro: "Answer five discovery questions about the equipment and the borrower. The rate card follows: the monthly payment and the fees, priced for the program, the term, and the credit tier.",
    fields: [
      {
        id: "program",
        label: "Financing program",
        options: [
          { id: "efa", label: "Equipment finance agreement", hint: "Own it after the last payment", attrs: { code: "EFA", mult: 1 } },
          { id: "fmv", label: "Fair market value lease", hint: "Lower payment. Return, renew, or buy at the end", attrs: { code: "FMV", mult: 0.88 } },
        ],
      },
      {
        id: "cost",
        label: "Equipment cost",
        help: "From the vendor's quote or invoice. Sets the documentation fee.",
        options: [costOption("75", 75_000), costOption("150", 150_000), costOption("250", 250_000), costOption("500", 500_000)],
      },
      {
        id: "down",
        label: "Down payment",
        help: "Paid to the vendor. The rest is the amount financed.",
        options: [
          { id: "none", label: "None", attrs: { code: "None", text: "" } },
          { id: "ten", label: "10%", attrs: { code: "Ten", text: " after 10% down" } },
          { id: "twenty", label: "20%", attrs: { code: "Twenty", text: " after 20% down" } },
        ],
      },
      {
        id: "tier",
        label: "Credit tier",
        help: "Set by credit from the borrower's financial statements.",
        options: [
          tierOption("a", "Tier A", `${TIER_RATE.a}% fixed`, 5),
          tierOption("b", "Tier B", `${TIER_RATE.b}% fixed`, 8),
          tierOption("c", "Tier C", `${TIER_RATE.c}% fixed`, 12),
        ],
      },
    ],
    quantity: { label: "Term in months", options: TERMS },
    needBy: {
      label: "Funding date",
      options: [
        { id: "1w", label: "In 1 week", days: 7 },
        { id: "2w", label: "In 2 weeks", days: 14 },
        { id: "4w", label: "In 4 weeks", days: 28 },
      ],
    },
    constraints: [
      { when: { cost: ["75"] }, field: "program", disable: ["fmv"], reason: "Fair market value leases start at $150,000 of equipment" },
      { when: { tier: ["c"] }, field: "down", disable: ["none"], reason: "Tier C credit needs a down payment of 10% or more" },
    ],
    lines: [
      {
        role: "Payment",
        sku: "FC-{program.code}-PMT",
        name: "{program.label}, monthly payment",
        description: "{cost.finLabel{down.code}} financed over {quantity} months{down.text}. {tier.note{program.code}}",
        price: { base: 0, add: ["cost.fin{down.code}"], multiply: ["tier.factor{quantity}", "program.mult"] },
        costRatio: 0.9,
        lead: { base: 0, add: ["tier.lead", "cost.lead"] },
        qtyPerUnit: 1,
        timing: "Monthly",
      },
      {
        role: "Documentation",
        sku: "FC-FEE-DOC",
        name: "Documentation fee",
        description: "For equipment costing {cost.label}.",
        price: { base: 0, add: ["cost.docFee"], multiply: [] },
        costRatio: 0.3,
        lead: { base: 0, add: [] },
        qtyPerUnit: 1,
        qtyFixed: 1,
        timing: "At funding",
      },
      {
        role: "Filing",
        sku: "FC-FEE-UCC",
        name: "UCC filing and lien search",
        description: "Records Fernhill Capital's interest in the equipment.",
        price: { base: 150, add: [], multiply: [] },
        costRatio: 0.6,
        lead: { base: 0, add: [] },
        qtyPerUnit: 1,
        qtyFixed: 1,
        timing: "At funding",
      },
      {
        role: "Inspection",
        sku: "FC-FEE-INSP",
        name: "Site inspection",
        description: "Confirms delivery and condition before funding.",
        price: { base: 350, add: [], multiply: [] },
        costRatio: 0.8,
        lead: { base: 0, add: [] },
        qtyPerUnit: 1,
        qtyFixed: 1,
        when: { cost: ["250", "500"] },
        timing: "At funding",
      },
    ],
    notes: [
      { when: { program: ["fmv"] }, text: "Fair market value lease: at the end of the term the customer returns the equipment, renews, or buys it at fair market value." },
      { when: { cost: ["250", "500"] }, text: "Equipment of $250,000 or more: a site inspection is added and takes three days." },
      { when: { tier: ["c"] }, text: "Tier C: a personal guarantee from the owners is required." },
    ],
    scripted: { selections: { program: "efa", cost: "250", down: "ten", tier: "a" }, quantity: 60, needBy: "2w" },
    quoteTitle: "Bramhall Precision Machining: 5-axis machining center, financing proposal",
    labels: {
      source: "Rates from this week's rate card. Fees from the fee schedule",
      timing: "Schedule",
      leadCheck: "Credit and documents take {lead} days. Funding wanted {need} ({days} days).",
    },
  },

  // ---------- Discount approval: a rate exception ----------
  discountApproval: {
    quoteId: "q-3187",
    thresholdPct: 2,
    marginFloorPct: 7,
    approverId: "ruth",
    scriptedDiscountPct: 4,
    scriptedSkus: ["FC-EFA-PMT"],
    labels: {
      ruleDiscount: "a rate exception over {limit}% off standard pricing",
      costFeed: "Cost of funds on every line is synced from the treasury system. Last sync {when}.",
      discount: "Rate exception",
    },
  },

  // ---------- Back-office data in HubSpot ----------
  backOffice: {
    companyId: "co-calloway",
    contactId: "ct-renee",
    systemLabel: "Loan servicing",
    syncedAt: "@-2mi",
    orders: [
      {
        id: "fac-41877",
        number: "FAC-41877",
        date: "@-1613d",
        status: "Active",
        po: "MLA-204417-04",
        total: 86_472,
        lines: [{ sku: "FC-EFA-PMT", name: "Jaw crusher: $640,000 over 60 months. 7 payments left, matures in 7 months", qty: 7, unitPrice: 12_643 }],
      },
      {
        id: "fac-52240",
        number: "FAC-52240",
        date: "@-791d",
        status: "Active",
        po: "MLA-204417-05",
        total: 597_492,
        lines: [{ sku: "FC-EFA-PMT", name: "Three haul trucks: $870,000 over 72 months. 46 payments left", qty: 46, unitPrice: 14_874 }],
      },
      {
        id: "fac-58816",
        number: "FAC-58816",
        date: "@-396d",
        status: "Active",
        po: "MLA-204417-06",
        total: 423_015,
        lines: [{ sku: "FC-EFA-PMT", name: "Wash plant: $520,000 over 60 months. 47 payments left", qty: 47, unitPrice: 10_395 }],
      },
      {
        id: "fac-61203",
        number: "FAC-61203",
        date: "@-150d",
        status: "Active",
        po: "MLA-204417-07",
        total: 288_228,
        lines: [{ sku: "FC-EFA-PMT", name: "Excavator: $310,000 over 60 months. 55 payments left", qty: 55, unitPrice: 6_175 }],
      },
      {
        id: "fac-33019",
        number: "FAC-33019",
        date: "@-2370d",
        status: "Paid off",
        po: "MLA-204417-01",
        total: 0,
        lines: [{ sku: "FC-EFA-PMT", name: "Wheel loader: $380,000 over 60 months. Paid in full, lien released", qty: 0, unitPrice: 7_569 }],
      },
    ],
    invoices: [
      { id: "stm-2611", number: "STM-2611", date: "@-6d", dueDate: "@+9d", amount: 44_087, balance: 44_087, status: "Open" },
      { id: "stm-2510", number: "STM-2510", date: "@-36d", dueDate: "@-21d", amount: 44_087, balance: 0, status: "Paid" },
      { id: "stm-2409", number: "STM-2409", date: "@-67d", dueDate: "@-52d", amount: 44_087, balance: 0, status: "Paid" },
      { id: "stm-2308", number: "STM-2308", date: "@-97d", dueDate: "@-82d", amount: 44_087, balance: 0, status: "Paid" },
    ],
    stock: [
      draw("FC-LINE-150-60", 150_000, 60, ""),
      draw("FC-LINE-300-60", 300_000, 60, "@-150d"),
      draw("FC-LINE-300-72", 300_000, 72, ""),
      draw("FC-LINE-600-72", 600_000, 72, "@-791d"),
      { sku: "FC-FEE-DOC", name: "Documentation fee, master line schedule", onHand: 0, usage: "No draw", leadDays: 0, contractPrice: 250, listPrice: 695, unitCost: 209, lastOrdered: "@-150d", usualQty: 1, timing: "At funding" },
      { sku: "FC-FEE-UCC", name: "UCC filing and lien search", onHand: 0, usage: "No draw", leadDays: 0, contractPrice: 150, listPrice: 150, unitCost: 90, lastOrdered: "@-150d", usualQty: 1, timing: "At funding" },
      { sku: "FC-INS-EQP", name: "Equipment insurance program, monthly", onHand: 0, usage: "No draw", leadDays: 0, contractPrice: 175, listPrice: 195, unitCost: 146, lastOrdered: "", usualQty: 60, timing: "Monthly" },
    ],
    scriptedSkus: ["FC-LINE-300-60", "FC-FEE-DOC", "FC-FEE-UCC"],
    scriptedOrderId: "fac-41877",
    quoteTitle: "Calloway Aggregates: Two wheel loaders, financing proposal",
    dealName: "Calloway Aggregates: Two wheel loaders",
    labels: {
      live: "Live from loan servicing, read {when}",
      tabs: { orders: "Facilities", balance: "Payments", stock: "Available credit" },
      orders: { number: "Facility", date: "Funded", po: "Schedule", status: "Status", total: "Principal balance" },
      balance: { open: "Payments due", overdue: "Past due", limit: "Credit Limit", status: "Account status", invoice: "Statement" },
      stock: { onHand: "Credit left after", none: "No draw", nearLimit: "Near limit", timing: "Schedule", contract: "Line pricing", list: "Standard", last: "Last used" },
      add: {
        button: "Add to financing proposal",
        help: `Available Credit: ${usd(AVAILABLE)} of a ${usd(CREDIT_LIMIT)} limit. Starts a proposal at the pricing this customer's master line holds.`,
        lineNote: "Line pricing from loan servicing",
        origin: "Created from the Loan servicing card",
        dealType: "Existing customer financing",
      },
    },
  },

  // ---------- Lead capture to pipeline ----------
  leadCapture: {
    site: {
      company: "Fernhill Capital",
      url: "www.fernhillcapital.example/request-financing",
      headline: "Finance the equipment your business runs on",
      sub: "Tell us what you are buying. A relationship manager for your region replies within one business day.",
      formTitle: "Request financing",
      interests: ["Under $100,000", "$100,000 to $500,000", "Over $500,000"],
      nav: ["Equipment finance", "Industries", "Vendors and brokers", "Request financing"],
      interestLabel: "Amount to finance",
      messageLabel: "What are you buying?",
      submit: "Request financing",
      thanks: {
        routed: "A relationship manager for your region will reply within one business day.",
        nurture: "We have sent our equipment financing guide to your inbox.",
      },
      consent: "I agree that Fernhill Capital may contact me about this request and run a business credit check. I have read the privacy notice.",
    },
    presets: [
      {
        id: "hot",
        label: "Caldbeck Structural Steel",
        outcome: "Strong fit: senior relationship manager",
        form: {
          firstName: "Monique",
          lastName: "Laurent",
          email: "monique.laurent@caldbeckstructuralsteel.example",
          phone: "(555) 0171-6620",
          title: "Chief Financial Officer",
          company: "Caldbeck Structural Steel",
          interest: "Over $500,000",
          message: "We are adding a CNC beam line and two overhead cranes at our Salt Lake City plant, about $1.8 million in total. Vendor quotes are in hand and we want to fund this quarter.",
        },
        company: {
          domain: "caldbeckstructuralsteel.example",
          industry: "Manufacturing",
          city: "Salt Lake City",
          state: "UT",
          employees: 420,
          revenue: 130_000_000,
          phone: "(555) 0171-6600",
          description: "Structural steel fabricator for commercial and industrial buildings in the Mountain West.",
          territory: "West",
          type: "Prospect",
          extra: [
            { label: "Years in business", value: "27" },
          ],
        },
        contactExtra: [
          { label: "Consent to contact", value: "Given on the Request financing form" },
          { label: "Consent to business credit check", value: "Given on the Request financing form" },
        ],
        score: 88,
        reasons: [
          { label: "Deal size", points: 25, detail: "Over $500,000: about $1.8M requested" },
          { label: "Business fit", points: 22, detail: "Manufacturing, 27 years in business, $130M revenue" },
          { label: "Buying intent", points: 21, detail: "3 payment calculator sessions in the last 7 days" },
          { label: "Request detail", points: 20, detail: "Vendor quotes in hand, funding this quarter" },
        ],
        route: { branchId: "field", ownerId: "marcus", summary: "Region: West. Deal size: over $500,000. Owner: Marcus Bell" },
        task: { title: "Follow up on new inquiry: Caldbeck Structural Steel", dueInMinutes: 60, notes: "Hot financing inquiry from Caldbeck Structural Steel. Score 88. About $1.8M for a beam line and two cranes, funding this quarter. Consent to contact and to a credit check is on the contact." },
        deal: { name: "Caldbeck Structural Steel: Beam line and overhead cranes", amount: 1_800_000 },
        alert: { channel: "#originations-west", text: "New financing inquiry: Monique Laurent, Caldbeck Structural Steel. Score 88. Over $500,000. Assigned to Marcus Bell. Call within 1 hour." },
      },
      {
        id: "mid",
        label: "Willowbend Dental Partners",
        outcome: "Medium fit: regional relationship manager",
        form: {
          firstName: "Arjun",
          lastName: "Bhatt",
          email: "arjun.bhatt@willowbenddentalpartners.example",
          phone: "(555) 0143-2284",
          title: "Director of Operations",
          company: "Willowbend Dental Partners",
          interest: "$100,000 to $500,000",
          message: "Imaging equipment for three of our offices, about $240,000. We are comparing a lease with a loan.",
        },
        company: {
          domain: "willowbenddentalpartners.example",
          industry: "Healthcare",
          city: "Des Moines",
          state: "IA",
          employees: 140,
          revenue: 22_000_000,
          phone: "(555) 0143-2200",
          description: "Group of nine dental offices in central Iowa.",
          territory: "Central",
          type: "Prospect",
          extra: [
            { label: "Years in business", value: "11" },
          ],
        },
        contactExtra: [
          { label: "Consent to contact", value: "Given on the Request financing form" },
          { label: "Consent to business credit check", value: "Given on the Request financing form" },
        ],
        score: 61,
        reasons: [
          { label: "Deal size", points: 15, detail: "$100,000 to $500,000: about $240,000 requested" },
          { label: "Business fit", points: 18, detail: "Healthcare, 11 years in business, $22M revenue" },
          { label: "Buying intent", points: 10, detail: "1 payment calculator session in the last 7 days" },
          { label: "Request detail", points: 18, detail: "Equipment and amount given, no funding date" },
        ],
        route: { branchId: "inside", ownerId: "elena", summary: "Region: Central. Deal size: $100,000 to $500,000. Owner: Elena Sokolova" },
        task: { title: "Follow up on new inquiry: Willowbend Dental Partners", dueInMinutes: 480, notes: "About $240,000 of imaging equipment for three offices. Comparing a lease with a loan. Score 61." },
        deal: { name: "Willowbend Dental Partners: Imaging equipment", amount: 240_000 },
        alert: { channel: "#originations-central", text: "New financing inquiry: Arjun Bhatt, Willowbend Dental Partners. Score 61. $100,000 to $500,000. Assigned to Elena Sokolova. Email today." },
      },
      {
        id: "low",
        label: "Two Rivers Mobile Detailing",
        outcome: "Poor fit: sent to nurture",
        form: {
          firstName: "Jesse",
          lastName: "Pruitt",
          email: "jesse.pruitt@tworiversmobiledetailing.example",
          phone: "(555) 0126-9051",
          title: "Owner",
          company: "Two Rivers Mobile Detailing",
          interest: "Under $100,000",
          message: "Looking at a second van, about $18,000. We started the business this year.",
        },
        company: {
          domain: "tworiversmobiledetailing.example",
          industry: "Automotive services",
          city: "Pittsburgh",
          state: "PA",
          employees: 3,
          revenue: 0,
          phone: "(555) 0126-9000",
          description: "Mobile car detailing business with one van.",
          territory: "East",
          type: "Other",
          extra: [
            { label: "Years in business", value: "Under 1" },
          ],
        },
        contactExtra: [
          { label: "Consent to contact", value: "Given on the Request financing form" },
          { label: "Consent to business credit check", value: "Given on the Request financing form" },
        ],
        score: 22,
        reasons: [
          { label: "Deal size", points: 5, detail: "Under $100,000: about $18,000 requested" },
          { label: "Business fit", points: 2, detail: "In business under 1 year, below the 2-year minimum" },
          { label: "Buying intent", points: 0, detail: "No payment calculator sessions" },
          { label: "Request detail", points: 15, detail: "Equipment and amount given" },
        ],
        route: { branchId: "nurture", ownerId: null, summary: "Score under 40: nurture. No owner assigned" },
      },
    ],
    scriptedPresetId: "hot",
    workflowId: "wf-inquiry-routing",
    dealStage: "new-rfq",
  },

  // ---------- Email to deal ----------
  emailToDeal: {
    sampleIds: ["th-stonegate-request", "th-osgrove-request", "th-brightmoor-request"],
    scriptedThreadId: "th-stonegate-request",
    dealStage: "new-rfq",
    labels: {
      empty: "Funding requests from equipment vendors and brokers land here.",
      flagged: "No exact match. Pick the right program:",
      confirm: "Confirm the flagged line first.",
      total: "Deal amount: total of payments",
      dealType: "New financing",
    },
  },

  // ---------- AI prospecting ----------
  aiProspecting: {
    companyId: "co-tidewater",
    signalDetail: {
      fed: {
        title: "Facility three payments from maturity",
        source: "Loan servicing",
        detail: "The refrigeration plant facility, $1.2M over 60 months, matures in 74 days. Every payment has been made on time.",
        bars: [
          { label: "Payments in the term", value: 60, unit: "payments" },
          { label: "Payments made", value: 57, unit: "payments", now: true },
        ],
        footnote: "Calculated from the payment schedule in the loan servicing system.",
      },
      native: {
        title: "Second warehouse announced",
        source: "Company news",
        detail: "Announced a 180,000 square foot cold storage warehouse near the port, opening next year.",
        footnote: "Found by Breeze from public company news.",
      },
    },
    whyNow: {
      headline: "Tidewater Cold Storage is three payments from paying off its refrigeration plant and has just announced a second warehouse.",
      points: [
        { label: "Facility maturing", detail: "The $1.2M refrigeration plant facility matures in 74 days. 57 of 60 payments made, all on time.", source: "Loan servicing" },
        { label: "Expansion", detail: "A second warehouse of 180,000 square feet was announced last week, opening next year.", source: "Company news" },
        { label: "Hiring", detail: "Open roles for a refrigeration engineer and a project manager for the new site.", source: "Job postings" },
        { label: "Payment calculator", detail: "The controller used the payment calculator twice this week.", source: "Website activity" },
      ],
    },
    buyingGroup: [
      { id: "bg-amara", name: "Amara Nwosu", title: "Chief Financial Officer", role: "Decision Maker", email: "amara.nwosu@tidewatercoldstorage.example", contactId: "ct-amara", why: "Signed the refrigeration plant facility. Named in the announcement as leading financing for the new warehouse." },
      { id: "bg-gareth", name: "Gareth Lindqvist", title: "Controller", role: "Champion", email: "gareth.lindqvist@tidewatercoldstorage.example", contactId: "ct-gareth", why: "Day-to-day contact. Asked for a payoff letter five days ago." },
      { id: "bg-silas", name: "Silas Brandvold", title: "Vice President of Operations", role: "Influencer", email: "silas.brandvold@tidewatercoldstorage.example", contactId: null, why: "Operations lead for the new warehouse. Will choose the refrigeration and racking equipment." },
    ],
    drafts: {
      "bg-amara": [
        {
          tone: "Direct",
          subject: "Financing the new warehouse",
          body: "Hi Amara,\n\nThe refrigeration plant facility is three payments from paid off, and every payment has been on time. That history puts Tidewater in a strong position for the equipment in the new warehouse.\n\nI would like to walk you through what a new facility could look like for the refrigeration and racking, before you collect vendor quotes. Any proposal would be subject to credit approval.\n\nDo you have 30 minutes next week?\n\nDana Whitlock\nFernhill Capital",
        },
        {
          tone: "Consultative",
          subject: "Planning equipment finance around the second site",
          body: "Hi Amara,\n\nCongratulations on the new warehouse. I look after Tidewater's account at Fernhill Capital, where your refrigeration plant facility matures in about ten weeks.\n\nCompanies building a second site often set up one master line before the vendor quotes arrive, so each piece of equipment can be funded as it is delivered. I can outline how that would work for Tidewater and what we would need from you. Nothing here is a commitment to lend.\n\nWould that be useful at this stage?\n\nDana Whitlock\nFernhill Capital",
        },
        {
          tone: "Brief",
          subject: "New warehouse equipment",
          body: "Hi Amara,\n\nYour refrigeration plant facility matures in about ten weeks. Would you like to talk about financing the equipment for the new warehouse?\n\nDana Whitlock\nFernhill Capital",
        },
      ],
      "bg-gareth": [
        {
          tone: "Direct",
          subject: "Your payoff letter, and what comes next",
          body: "Hi Gareth,\n\nThe payoff letter you asked for is on its way. With three payments left, the facility closes out in about ten weeks.\n\nI saw the announcement about the second warehouse. If equipment for it is in your cash plan, I can give you indicative payments for a few amounts and terms so you have numbers to work with. They would be subject to credit approval.\n\nWhat amounts should I run?\n\nDana Whitlock\nFernhill Capital",
        },
        {
          tone: "Consultative",
          subject: "Cash planning for the new site",
          body: "Hi Gareth,\n\nYou mentioned you are planning cash for the next two quarters. The refrigeration plant payment of $23,903 a month ends in about ten weeks, which frees up room.\n\nIf it helps your plan, I can show how equipment for the new warehouse would look as a new facility, with payments starting after delivery. I only need a rough equipment budget to start.\n\nWould a short call this week work?\n\nDana Whitlock\nFernhill Capital",
        },
        {
          tone: "Brief",
          subject: "Payoff letter",
          body: "Hi Gareth,\n\nYour payoff letter is on its way. Do you want indicative payments for the new warehouse equipment while you are planning cash?\n\nDana Whitlock\nFernhill Capital",
        },
      ],
      "bg-silas": [
        {
          tone: "Direct",
          subject: "Financing for the new warehouse equipment",
          body: "Hi Silas,\n\nI manage Tidewater's account at Fernhill Capital. We financed the refrigeration plant at your first site.\n\nAs you choose refrigeration and racking for the new warehouse, I can work with your vendors directly so funding lines up with delivery dates. It helps to be involved before the purchase orders go out.\n\nCould we set up a short introduction?\n\nDana Whitlock\nFernhill Capital",
        },
        {
          tone: "Consultative",
          subject: "Lining up funding with equipment delivery",
          body: "Hi Silas,\n\nCongratulations on the second site. I look after Tidewater at Fernhill Capital.\n\nOn projects like this, equipment often arrives in stages over several months. We can fund each delivery as it lands, so vendors are paid on time and nothing waits on a single closing. I would be glad to explain how that works alongside your project schedule.\n\nWho is the best person to include from your team?\n\nDana Whitlock\nFernhill Capital",
        },
        {
          tone: "Brief",
          subject: "Introduction: Fernhill Capital",
          body: "Hi Silas,\n\nI manage the Tidewater account at Fernhill Capital. I would like to introduce myself ahead of the new warehouse project. Is there a good time this week?\n\nDana Whitlock\nFernhill Capital",
        },
      ],
    },
    followUp: { title: "Follow up with the Tidewater Cold Storage buying group", dueInDays: 3 },
  },

  // ---------- Customer agent (chat, email, voice) ----------
  customerAgent,
};
