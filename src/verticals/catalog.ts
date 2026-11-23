// Tile-level facts about verticals and demos. Safe for any bundle: no demo data lives here.
// The full content of a vertical is its pack (src/verticals/<vertical>/pack.ts), served only to signed-in users.

export type DemoId =
  | "guided-quote"
  | "lead-capture"
  | "back-office"
  | "email-to-deal"
  | "ai-prospecting"
  | "discount-approval"
  | "customer-agent"
  | "social-ads"
  | "marketing-studio"
  | "post-visit-feedback"
  | "patient-reactivation"
  | "referral-intake"
  | "staffing-job-orders";

export type DemoHub = "marketing" | "sales" | "service" | "ops";

export const DEMO_HUBS: readonly { id: DemoHub; label: string }[] = [
  { id: "marketing", label: "Marketing" },
  { id: "sales", label: "Sales & CPQ" },
  { id: "service", label: "Service & CS" },
  { id: "ops", label: "Ops & RevOps" },
];

export type DemoTile = {
  id: DemoId;
  title: string;
  minutes: number;
  summary: string;
  takeaway: string;
  hub: DemoHub;
  ai?: boolean;
  flagship?: boolean;
  tags?: string[];
};

export type VerticalTile = {
  id: string;
  name: string;
  company: string;
  blurb: string;
  status: "live" | "coming-soon";
  demos: DemoId[];
  /** Tile wording for this vertical, where the shared wording does not fit it. */
  tiles?: Partial<Record<DemoId, Partial<Omit<DemoTile, "id">>>>;
};

export const DEMOS: Record<DemoId, DemoTile> = {
  "guided-quote": {
    id: "guided-quote",
    title: "Guided quote",
    minutes: 4,
    summary: "Pick requirements, line items generate, quote preview, send.",
    takeaway: "A rep who does not know the catalogue produces a correct quote in under a minute.",
    hub: "sales",
    flagship: true,
    tags: ["cpq", "quote", "pricing", "line items", "proposal"],
  },
  "discount-approval": {
    id: "discount-approval",
    title: "Discount approval",
    minutes: 3,
    summary: "A discount over the threshold routes to the approver, one click approves, the quote unlocks.",
    takeaway: "Discount control that does not slow the deal.",
    hub: "sales",
    tags: ["cpq", "approval", "discount", "margin", "floor", "deal desk"],
  },
  "back-office": {
    id: "back-office",
    title: "Back-office data in HubSpot",
    minutes: 4,
    summary: "Open a company, see orders, balance and stock from the ERP, build a quote from them.",
    takeaway: "What did they buy, what do they owe, can we ship: answered without leaving HubSpot.",
    hub: "ops",
    tags: ["erp", "billing", "psa", "sync", "revops", "invoices", "stock"],
  },
  "lead-capture": {
    id: "lead-capture",
    title: "Lead capture to pipeline",
    minutes: 5,
    summary: "Form submitted, company enriched and scored with reasons, routed by territory, rep gets a task and an alert.",
    takeaway: "A web lead reaches the right rep in seconds, and the rep can see why it is worth the call.",
    hub: "marketing",
    flagship: true,
    tags: ["forms", "enrichment", "lead scoring", "routing", "workflow", "inbound"],
  },
  "email-to-deal": {
    id: "email-to-deal",
    title: "Email to deal",
    minutes: 4,
    summary: "An RFQ or PO email arrives, gets parsed, and becomes a deal with line items.",
    takeaway: "RFQs and POs stop being re-keyed. A person only looks where the parser is unsure.",
    hub: "ops",
    tags: ["rfq", "po", "inbox", "parser", "intake", "automation"],
  },
  "ai-prospecting": {
    id: "ai-prospecting",
    title: "AI prospecting",
    minutes: 4,
    summary: "An account shows a buying signal, the buying group appears, outreach is drafted, rep approves and sends.",
    takeaway: "Reps approve instead of researching, and nothing goes out without a human click.",
    hub: "sales",
    ai: true,
    tags: ["breeze", "ai", "signals", "buying group", "outreach", "prospecting"],
  },
  "customer-agent": {
    id: "customer-agent",
    title: "Customer agent",
    minutes: 6,
    summary: "Breeze Customer Agent handles chat, email, and voice queries, hands complex fraud to a human, and reports resolution and credits.",
    takeaway: "Over 70% of routine inquiries resolve autonomously across chat, email, and voice, while complex cases reach reps with full context.",
    hub: "service",
    ai: true,
    flagship: true,
    tags: ["breeze", "ai", "service", "chat", "email", "voice", "help desk", "credits", "resolution"],
  },
  "social-ads": {
    id: "social-ads",
    title: "Social media and paid ads",
    minutes: 5,
    summary: "Plan social posts on a calendar, run paid search and social ads, follow a hiring manager from ad click to contact, reply in one social inbox, and measure campaign ROI.",
    takeaway: "Every ad click, social post, form submission, comment reply, and placement pipeline dollar tied together in HubSpot, with simulated campaign data ready to demo live.",
    hub: "marketing",
    flagship: true,
    tags: ["social", "paid ads", "campaigns", "calendar", "roi", "staffing"],
  },
  "marketing-studio": {
    id: "marketing-studio",
    title: "Marketing Studio: ICP outreach",
    minutes: 6,
    summary: "ICP match to campaign brief, plan, one brand voice, one ebook remixed into four formats, tailored outreach, conversion, meeting booked, and credits-to-pipeline dashboard.",
    takeaway: "One marketer takes a single asset from brief to booked meetings and pipeline, with HubSpot Credits tied directly to revenue outcomes.",
    hub: "marketing",
    ai: true,
    flagship: true,
    tags: ["breeze", "ai", "icp", "campaign", "brand voice", "remix", "credits", "outreach"],
  },
  "post-visit-feedback": {
    id: "post-visit-feedback",
    title: "Post-visit feedback to service ticket",
    minutes: 4,
    summary: "Checkout triggers a non-PHI post-visit CSAT survey; a low score opens a Service Hub ticket routed to the clinic location manager for empathetic outreach, resolution, and location reporting.",
    takeaway: "Low-score clinic feedback turns into same-day manager outreach inside Service Hub, with zero PHI stored and satisfaction tracked by location.",
    hub: "service",
    tags: ["service", "tickets", "csat", "feedback", "survey", "sla", "healthcare", "clinic"],
  },
  "patient-reactivation": {
    id: "patient-reactivation",
    title: "Patient reactivation campaign",
    minutes: 5,
    summary: "Sync non-PHI overdue annual-visit flags into a dynamic segment, approve a 3-touch reminder series, follow booking to automatic segment removal, and measure reactivation by location.",
    takeaway: "Overdue patients book annual visits without storing clinical PHI in HubSpot, and booked contacts drop out of reminders automatically.",
    hub: "marketing",
    tags: ["segment", "dynamic list", "email series", "reactivation", "annual visit", "hipaa", "clinic"],
  },
  "referral-intake": {
    id: "referral-intake",
    title: "Referral intake and routing",
    minutes: 5,
    summary: "Referring clinic submits a non-PHI referral, HubSpot creates a specialty deal routed by location, coordinator sends a scheduling link, patient books, and referral funnel updates.",
    takeaway: "Every specialty referral is routed to the right clinic location in seconds, tracked through booking, and synced back to the referring practice without storing clinical PHI.",
    hub: "ops",
    tags: ["healthcare", "referral", "intake", "routing", "scheduling", "clinic", "ehr", "hipaa"],
  },
  "staffing-job-orders": {
    id: "staffing-job-orders",
    title: "Healthcare staffing job orders",
    minutes: 5,
    summary: "Hospital submits a travel-RN request, HubSpot creates a job-order deal, recruiter shares pre-credentialed ATS shortlist, manager selects nurses, and placement revenue is recorded.",
    takeaway: "Hospital staffing requests flow straight from intake to ATS shortlist, hiring-manager selection, placed revenue, and fill-rate analytics without leaving HubSpot.",
    hub: "sales",
    tags: ["healthcare", "staffing", "travel rn", "job order", "ats", "vms", "shortlist", "fill rate"],
  },
};

export const VERTICALS: VerticalTile[] = [
  {
    id: "manufacturing",
    name: "Manufacturing",
    company: "Halvorsen Motion",
    blurb: "Linear actuators and servo drives, sold direct to OEMs and through distributors.",
    status: "live",
    demos: ["guided-quote", "discount-approval", "back-office", "lead-capture", "email-to-deal", "ai-prospecting"],
  },
  {
    id: "saas",
    name: "SaaS and software",
    company: "Lumenstack",
    blurb: "B2B analytics platform sold by plan, seats, and add-ons.",
    status: "live",
    demos: ["guided-quote", "discount-approval", "back-office", "lead-capture", "ai-prospecting", "marketing-studio"],
    tiles: {
      "guided-quote": {
        summary: "Pick plan, seats, add-ons, and term. Subscription lines generate, quote preview, send.",
        takeaway: "A new rep prices a subscription correctly in under a minute, with first-year total and annual recurring revenue on the quote.",
      },
      "discount-approval": {
        summary: "A discount over the threshold or non-standard payment terms route to the deal desk, one click approves, the quote unlocks.",
        takeaway: "Deal desk control that does not slow the deal.",
      },
      "back-office": {
        summary: "Open a customer, see subscriptions, invoices, and seat usage from billing and product usage, build an expansion quote from them.",
        takeaway: "What are they on, what do they owe, are they out of seats: answered without leaving HubSpot.",
      },
      "lead-capture": {
        summary: "Demo request submitted, company enriched and scored with reasons, routed by segment and territory, rep gets a task and an alert.",
        takeaway: "A demo request reaches the right rep in seconds, and the rep can see why it is worth the call.",
      },
    },
  },
  {
    id: "financial-services",
    name: "Financial services and fintech",
    company: "Fernhill Capital",
    blurb: "Equipment finance for mid-size businesses, direct and through vendors and brokers.",
    status: "live",
    demos: ["guided-quote", "discount-approval", "back-office", "lead-capture", "email-to-deal", "ai-prospecting", "customer-agent"],
    tiles: {
      "guided-quote": {
        title: "Guided financing proposal",
        summary: "Pick program, equipment cost, down payment, credit tier, and term. The payment and fees generate, proposal preview, send.",
        takeaway: "A new relationship manager prices a financing proposal correctly in under a minute, from the current rate card.",
      },
      "discount-approval": {
        title: "Rate exception approval",
        summary: "A rate exception over the limit routes to the credit officer, one click approves, the proposal unlocks, and the approval activity shows who approved.",
        takeaway: "Pricing control with a record of who approved, without slowing the deal.",
      },
      "back-office": {
        summary: "Open a customer, see facilities, payments, and available credit from loan servicing, start a proposal against the credit that is left.",
        takeaway: "What do they owe, are they current, how much can they still borrow: answered without leaving HubSpot.",
      },
      "lead-capture": {
        summary: "Financing request submitted with consent, company enriched and scored with reasons, routed by region and deal size, rep gets a task and an alert.",
        takeaway: "A financing inquiry reaches the right relationship manager in seconds, with consent on the record.",
      },
      "email-to-deal": {
        summary: "A vendor or broker emails a funding request with an invoice, it gets parsed, and becomes a financing application with line items.",
        takeaway: "Funding requests stop being re-keyed. A person only looks where the parser is unsure.",
      },
      "ai-prospecting": {
        summary: "A facility nears maturity and the customer announces an expansion, the buying group appears, outreach is drafted, rep approves and sends.",
        takeaway: "Reps approve instead of researching, and no regulated outreach goes out without a human click.",
      },
      "customer-agent": {
        title: "Customer agent (chat, email, voice)",
        summary: "Handles a pending transfer by chat, a card dispute by email, a locked account by voice, and hands a fraud report to a human rep.",
        takeaway: "74.6% autonomous resolution across chat, email, and voice, with full cross-channel context when a human steps in.",
      },
    },
  },
  {
    id: "professional-services",
    name: "Professional and IT services",
    company: "Quillon Technology Partners",
    blurb: "Managed IT services, projects, and hardware resale.",
    status: "live",
    demos: ["guided-quote", "discount-approval", "back-office", "lead-capture", "email-to-deal", "ai-prospecting"],
    tiles: {
      "guided-quote": {
        title: "Guided proposal",
        summary: "Pick service tier, security add-on, sites, term, and users. Managed services and the onboarding project generate from the rate card, proposal preview, send.",
        takeaway: "A new account executive scopes a managed services proposal correctly in under a minute, from the rate card.",
      },
      "discount-approval": {
        summary: "A discount that takes hourly rates under the rate-card floor routes to the practice lead, one click approves, the statement of work unlocks.",
        takeaway: "Rate-card control that does not slow the deal.",
      },
      "back-office": {
        summary: "Open a customer, see contracts, open invoices, unbilled work, engineer capacity, and hardware stock from the PSA and finance system, build a change order from them.",
        takeaway: "What are they contracted for, what do they owe, do we have the people and the hardware: answered without leaving HubSpot.",
      },
      "lead-capture": {
        summary: "Assessment request submitted, company enriched and scored with reasons, routed by practice area and region, consultant gets a task and an alert.",
        takeaway: "An assessment request reaches the right practice in seconds, and the consultant can see why it is worth the call.",
      },
      "email-to-deal": {
        summary: "A purchase order for hardware and licences, or an RFP summary, arrives by email, gets parsed, and becomes a deal with product and service lines.",
        takeaway: "Purchase orders and RFPs stop being re-keyed. A person only looks where the parser is unsure.",
      },
      "ai-prospecting": {
        summary: "Equipment nears end of support and a new CIO starts, the buying group appears, outreach is drafted, rep approves and sends.",
        takeaway: "Reps approve instead of researching, with a signal only the managed asset inventory can give.",
      },
    },
  },
  {
    id: "healthcare",
    name: "Healthcare",
    company: "Crestline Clinical Staffing & Specialty Clinics",
    blurb: "Travel nursing, allied health staffing, and multi-location specialty clinics.",
    status: "live",
    demos: ["social-ads", "ai-prospecting", "patient-reactivation", "post-visit-feedback", "referral-intake", "staffing-job-orders"],
    tiles: {
      "ai-prospecting": {
        title: "Referral-source outreach",
        summary: "Referring practices trigger signals on a new physician, new clinic location, or quarterly referral drop; Breeze drafts role outreach, books a lunch-and-learn, and tracks before/after referral volume.",
        takeaway: "Physician liaisons spend time in lunch-and-learns instead of spreadsheets, with referral recovery and HubSpot Credits tied directly to practice outcomes.",
        tags: ["referral", "physician", "clinic", "lunch-and-learn", "credits", "hipaa"],
      },
      "patient-reactivation": {
        summary: "Non-PHI overdue annual-visit flags populate a dynamic segment, a 3-touch reminder series goes out, booked patients auto-remove from the list, and clinics track reactivation by location.",
        takeaway: "Clinics fill annual wellness schedules automatically with zero clinical PHI in HubSpot and zero duplicate reminders after booking.",
      },
    },
  },
];

export function getVertical(id: string): VerticalTile | undefined {
  return VERTICALS.find((v) => v.id === id);
}

export function hubLabel(hub: DemoHub): string {
  return DEMO_HUBS.find((h) => h.id === hub)?.label ?? hub;
}

/** A demo's tile as one vertical words it. */
export function demoTile(verticalId: string, id: DemoId): DemoTile {
  const base = DEMOS[id];
  const override = getVertical(verticalId)?.tiles?.[id];
  if (!override) return base;
  return {
    ...base,
    ...override,
    tags: override.tags ? [...(base.tags ?? []), ...override.tags] : base.tags,
  };
}

export const LIVE_VERTICALS = VERTICALS.filter((v) => v.status === "live").map((v) => v.id);

export function isDemoId(value: string): value is DemoId {
  return value in DEMOS;
}
