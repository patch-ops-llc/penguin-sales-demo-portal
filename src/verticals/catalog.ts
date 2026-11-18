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
    status: "coming-soon",
    demos: ["guided-quote", "lead-capture", "back-office", "ai-prospecting", "discount-approval"],
  },
  {
    id: "financial-services",
    name: "Financial services and fintech",
    company: "Fernhill Capital",
    blurb: "Equipment and working-capital finance for mid-size businesses.",
    status: "coming-soon",
    demos: ["guided-quote", "lead-capture", "back-office", "email-to-deal", "ai-prospecting", "discount-approval"],
  },
  {
    id: "professional-services",
    name: "Professional and IT services",
    company: "Quillon Technology Partners",
    blurb: "Managed IT services, projects, and hardware resale.",
    status: "coming-soon",
    demos: ["guided-quote", "lead-capture", "back-office", "email-to-deal", "ai-prospecting", "discount-approval"],
  },
];

export function getVertical(id: string): VerticalTile | undefined {
  return VERTICALS.find((v) => v.id === id);
}

export function isDemoId(value: string): value is DemoId {
  return value in DEMOS;
}
