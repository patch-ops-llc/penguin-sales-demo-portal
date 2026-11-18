// Tile-level facts about verticals and demos. Safe for any bundle: no demo data lives here.
// The full content of a vertical is its pack (src/verticals/<vertical>/pack.ts), served only to signed-in users.

export type DemoId = "guided-quote" | "lead-capture" | "back-office" | "email-to-deal" | "ai-prospecting" | "discount-approval";

export type DemoTile = {
  id: DemoId;
  title: string;
  minutes: number;
  summary: string;
  takeaway: string;
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
  },
  "discount-approval": {
    id: "discount-approval",
    title: "Discount approval",
    minutes: 3,
    summary: "A discount over the threshold routes to the approver, one click approves, the quote unlocks.",
    takeaway: "Discount control that does not slow the deal.",
  },
  "back-office": {
    id: "back-office",
    title: "Back-office data in HubSpot",
    minutes: 4,
    summary: "Open a company, see orders, balance and stock from the ERP, build a quote from them.",
    takeaway: "What did they buy, what do they owe, can we ship: answered without leaving HubSpot.",
  },
  "lead-capture": {
    id: "lead-capture",
    title: "Lead capture to pipeline",
    minutes: 5,
    summary: "Form submitted, company enriched and scored with reasons, routed by territory, rep gets a task and an alert.",
    takeaway: "A web lead reaches the right rep in seconds, and the rep can see why it is worth the call.",
  },
  "email-to-deal": {
    id: "email-to-deal",
    title: "Email to deal",
    minutes: 4,
    summary: "An RFQ or PO email arrives, gets parsed, and becomes a deal with line items.",
    takeaway: "RFQs and POs stop being re-keyed. A person only looks where the parser is unsure.",
  },
  "ai-prospecting": {
    id: "ai-prospecting",
    title: "AI prospecting",
    minutes: 4,
    summary: "An account shows a buying signal, the buying group appears, outreach is drafted, rep approves and sends.",
    takeaway: "Reps approve instead of researching, and nothing goes out without a human click.",
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
    demos: ["guided-quote", "discount-approval", "back-office", "lead-capture", "ai-prospecting"],
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
    demos: ["guided-quote", "discount-approval", "back-office", "lead-capture", "email-to-deal", "ai-prospecting"],
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
];

export function getVertical(id: string): VerticalTile | undefined {
  return VERTICALS.find((v) => v.id === id);
}

/** A demo's tile as one vertical words it. */
export function demoTile(verticalId: string, id: DemoId): DemoTile {
  return { ...DEMOS[id], ...getVertical(verticalId)?.tiles?.[id] };
}

export const LIVE_VERTICALS = VERTICALS.filter((v) => v.status === "live").map((v) => v.id);

export function isDemoId(value: string): value is DemoId {
  return value in DEMOS;
}
