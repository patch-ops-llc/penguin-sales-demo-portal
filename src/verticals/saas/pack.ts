import type { Activity, Company, Contact, Deal, LineItem, Pack, Product, Quote, Task } from "../types";
import { demos } from "./demos";
import { extensions } from "./extensions";
import { threads } from "./inbox";

// SaaS and software pack: Lumenstack, a B2B analytics platform sold by plan, seats, and add-ons.
// Every company, person, and number here is invented sample data.
// Email and web addresses use the reserved ".example" domain so nothing can reach a real inbox.

// Cost to serve as a share of list price, by product family. It sets each product's floor price.
const COST_RATIO: Record<string, number> = { Platform: 0.255, "AI add-ons": 0.27, "Add-ons": 0.2, Services: 0.24, Support: 0.24 };

function subscription(sku: string, name: string, family: string, price: number): Product {
  return { sku, name, family, price, cost: Math.round(price * COST_RATIO[family]), leadDays: 0, onHand: 0, timing: "Billed annually", recurring: true };
}

function service(sku: string, name: string, price: number, leadDays: number): Product {
  return { sku, name, family: "Services", price, cost: Math.round(price * COST_RATIO.Services), leadDays, onHand: 0, timing: "One-time" };
}

export const products: Product[] = [
  subscription("LS-STR-SEAT", "Lumenstack Starter, per seat", "Platform", 480),
  subscription("LS-GRO-SEAT", "Lumenstack Growth, per seat", "Platform", 900),
  subscription("LS-ENT-SEAT", "Lumenstack Enterprise, per seat", "Platform", 1500),
  subscription("LS-VIEW-SEAT", "Viewer seat, read-only", "Platform", 120),
  subscription("LS-AI-SEAT", "AI Assistant add-on, per seat", "AI add-ons", 180),
  subscription("LS-SEC-PACK", "Security pack: SSO, SCIM, audit log", "Add-ons", 6000),
  subscription("LS-API-PACK", "API and data export pack", "Add-ons", 4800),
  subscription("LS-SBX", "Sandbox environment", "Add-ons", 3600),
  subscription("LS-CON-WH", "Warehouse connector", "Add-ons", 2400),
  subscription("LS-SUP-PREM", "Premium support, 1-hour response", "Support", 12000),
  service("LS-ONB-STR", "Guided onboarding, Starter", 1500, 7),
  service("LS-ONB-GRO", "Onboarding package, Growth", 6000, 21),
  service("LS-ONB-ENT", "Onboarding program, Enterprise", 18000, 35),
  service("LS-TRN-ADM", "Admin training workshop", 2400, 10),
  service("LS-MIG", "Data migration service", 7500, 21),
  service("LS-PS-DAY", "Solutions architect, per day", 2000, 14),
];

function line(sku: string, qty: number, unitPrice?: number): LineItem {
  const p = products.find((x) => x.sku === sku);
  if (!p) throw new Error(`Unknown SKU in seed: ${sku}`);
  return { sku, name: p.name, qty, unitPrice: unitPrice ?? p.price, unitCost: p.cost, leadDays: p.leadDays, ...(p.timing ? { timing: p.timing } : {}), ...(p.recurring ? { recurring: true } : {}) };
}

function total(lines: LineItem[]): number {
  return lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0);
}

type CompanySeed = [id: string, name: string, industry: string, type: string, city: string, state: string, employees: number, revenueM: number, ownerId: string, lifecycle: string, createdDaysAgo: number, lastDaysAgo: number, territory: string];

const companySeeds: CompanySeed[] = [
  ["co-tessellate", "Tessellate Freight Systems", "Logistics", "Prospect", "Chicago", "IL", 780, 190, "jordan", "Opportunity", 46, 1, "Central"],
  ["co-marlowe", "Marlowe Ridge Health", "Healthcare services", "Customer", "Nashville", "TN", 1900, 410, "jordan", "Customer", 742, 1, "East"],
  ["co-quarry", "Quarrystone Outfitters", "Retail", "Customer", "Boulder", "CO", 640, 150, "jordan", "Customer", 668, 1, "West"],
  ["co-vireo", "Vireo Mobility", "Transportation", "Customer", "Austin", "TX", 410, 85, "jordan", "Customer", 246, 4, "Central"],
  ["co-ostrander", "Ostrander Biologics", "Biotechnology", "Prospect", "San Diego", "CA", 1300, 520, "carmen", "Opportunity", 58, 2, "West"],
  ["co-saltmarsh", "Saltmarsh Hospitality Group", "Hospitality", "Customer", "Charleston", "SC", 2200, 380, "jordan", "Customer", 903, 3, "East"],
  ["co-brambleside", "Brambleside Insurance Mutual", "Insurance", "Prospect", "Hartford", "CT", 950, 300, "carmen", "Lead", 19, 5, "East"],
  ["co-kittering", "Kittering Home Goods", "E-commerce", "Customer", "Columbus", "OH", 260, 70, "theo", "Customer", 512, 9, "Central"],
  ["co-fallowfield", "Fallowfield Energy Cooperative", "Utilities", "Customer", "Omaha", "NE", 540, 210, "theo", "Customer", 624, 13, "Central"],
  ["co-lanternfish", "Lanternfish Games", "Gaming", "Prospect", "Seattle", "WA", 190, 44, "sasha", "Opportunity", 37, 4, "West"],
  ["co-oxbow", "Oxbow Staffing Partners", "Staffing", "Customer", "Phoenix", "AZ", 330, 62, "theo", "Customer", 455, 6, "West"],
  ["co-thistledown", "Thistledown Veterinary Network", "Veterinary services", "Prospect", "Denver", "CO", 720, 140, "theo", "Lead", 14, 6, "West"],
  ["co-greywether", "Greywether Construction", "Construction", "Customer", "Raleigh", "NC", 880, 260, "theo", "Customer", 97, 22, "East"],
  ["co-pallister", "Pallister and Vane Legal", "Legal services", "Prospect", "Boston", "MA", 150, 58, "sasha", "Opportunity", 29, 7, "East"],
  ["co-cindermoor", "Cindermoor Coffee Roasters", "Food and beverage", "Customer", "Portland", "OR", 85, 19, "sasha", "Customer", 142, 31, "West"],
  ["co-wrenfield", "Wrenfield Robotics", "Robotics", "Prospect", "Pittsburgh", "PA", 120, 22, "sasha", "Lead", 9, 3, "East"],
  ["co-ambleforth", "Ambleforth Credit Union", "Banking", "Customer", "Madison", "WI", 410, 95, "theo", "Customer", 780, 10, "Central"],
  ["co-tamarack", "Tamarack Lane Travel", "Travel", "Prospect", "Salt Lake City", "UT", 140, 31, "sasha", "Lead", 101, 30, "West"],
  ["co-northquay", "Northquay Marine Supply", "Wholesale distribution", "Customer", "Tampa", "FL", 300, 110, "theo", "Customer", 398, 11, "East"],
  ["co-elderbrook", "Elderbrook Senior Living", "Senior living", "Prospect", "Minneapolis", "MN", 1600, 330, "carmen", "Opportunity", 66, 2, "Central"],
  ["co-pikewell", "Pikewell Media", "Media", "Prospect", "New York", "NY", 220, 48, "sasha", "Lead", 84, 15, "East"],
  ["co-starling", "Starling Yard Fitness", "Fitness", "Prospect", "Atlanta", "GA", 95, 12, "sasha", "Lead", 11, 8, "East"],
];

function domainOf(name: string): string {
  return `${name.toLowerCase().replace(/ and /g, "").replace(/[^a-z0-9]/g, "")}.example`;
}

function segmentOf(employees: number): string {
  return employees >= 1000 ? "Enterprise" : employees >= 200 ? "Mid-market" : "SMB";
}

const companies: Company[] = companySeeds.map(([id, name, industry, type, city, state, employees, revenueM, ownerId, lifecycle, created, last, territory], i) => ({
  id,
  name,
  domain: domainOf(name),
  industry,
  type,
  city,
  state,
  employees,
  revenue: revenueM * 1_000_000,
  phone: `(555) 01${String(10 + i).padStart(2, "0")}-${String(3100 + i * 41).slice(0, 4)}`,
  ownerId,
  lifecycle,
  createdAt: `@-${created}d`,
  lastActivityAt: `@-${last}d`,
  territory,
  extra: [{ label: "Segment", value: segmentOf(employees) }],
}));

function company(id: string): Company {
  const c = companies.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown company in seed: ${id}`);
  return c;
}

// The synced billing fields reuse the back-office summary: lastOrderDate holds the renewal date,
// creditStatus the payment status, and creditLimit the account's annual recurring revenue.
company("co-tessellate").description = "Freight brokerage and dispatch software for regional carriers. Evaluating one analytics tool for dispatch, finance, and the carrier team.";
company("co-marlowe").description = "Operates 31 outpatient clinics across Tennessee and Kentucky. On the Growth plan since last year, renewing with more seats.";
company("co-marlowe").erp = { accountNumber: "LS-ACCT-18834", lastOrderDate: "@+21d", openBalance: 0, creditStatus: "Current", creditLimit: 102000 };
company("co-quarry").description = "Outdoor gear retailer with 48 stores and a growing online business. Runs merchandising and store reporting on Lumenstack.";
company("co-quarry").erp = { accountNumber: "LS-ACCT-20417", lastOrderDate: "@+74d", openBalance: 4400, creditStatus: "Current", creditLimit: 103000 };
company("co-vireo").description = "Shared electric scooters and bikes in six cities. Started on the Starter plan with one operations team.";
company("co-vireo").erp = { accountNumber: "LS-ACCT-23190", lastOrderDate: "@+165d", openBalance: 0, creditStatus: "Current", creditLimit: 14400 };

type ContactSeed = [id: string, first: string, last: string, title: string, companyId: string, lifecycle: string, leadStatus: string, createdDaysAgo: number, lastDaysAgo: number];

const contactSeeds: ContactSeed[] = [
  ["ct-anika", "Anika", "Sorensen", "VP Operations", "co-tessellate", "Opportunity", "In progress", 46, 1],
  ["ct-desmond", "Desmond", "Achebe", "Director of IT", "co-tessellate", "Opportunity", "In progress", 30, 6],
  ["ct-priscilla", "Priscilla", "Vance", "Director of Analytics", "co-marlowe", "Customer", "Connected", 740, 1],
  ["ct-tobias", "Tobias", "Reinhardt", "VP Finance", "co-marlowe", "Customer", "Connected", 402, 12],
  ["ct-lucia", "Lucia", "Ferrante", "Head of Merchandising Analytics", "co-quarry", "Customer", "Connected", 665, 1],
  ["ct-emeka", "Emeka", "Obi", "Finance Systems Manager", "co-quarry", "Customer", "Connected", 300, 18],
  ["ct-hugo", "Hugo", "Lang", "Director of Operations Analytics", "co-vireo", "Customer", "Connected", 244, 4],
  ["ct-lior", "Lior", "Ben-David", "VP Operations", "co-vireo", "Customer", "Attempted to contact", 240, 122],
  ["ct-felix", "Felix", "Navarro", "Procurement Manager", "co-ostrander", "Opportunity", "In progress", 58, 2],
  ["ct-gwen", "Gwen", "Albright", "Director of Revenue Management", "co-saltmarsh", "Customer", "Connected", 900, 3],
  ["ct-ravi", "Ravi", "Chandran", "Chief Data Officer", "co-brambleside", "Lead", "Open", 19, 5],
  ["ct-moira", "Moira", "Kessler", "Head of Growth", "co-kittering", "Customer", "Connected", 510, 9],
  ["ct-august", "August", "Pell", "Operations Analyst", "co-fallowfield", "Customer", "Connected", 620, 13],
  ["ct-yuki", "Yuki", "Arai", "Data Lead", "co-lanternfish", "Opportunity", "In progress", 37, 4],
  ["ct-bianca", "Bianca", "Moreau", "Chief Operating Officer", "co-oxbow", "Customer", "Connected", 450, 6],
  ["ct-callum", "Callum", "Reyes", "Director of Practice Operations", "co-thistledown", "Lead", "New", 14, 6],
  ["ct-zainab", "Zainab", "Haddad", "Project Controls Manager", "co-greywether", "Customer", "Connected", 95, 22],
  ["ct-edmund", "Edmund", "Vane", "Managing Partner", "co-pallister", "Opportunity", "In progress", 29, 7],
  ["ct-sunita", "Sunita", "Rao", "Owner", "co-cindermoor", "Customer", "Connected", 140, 31],
  ["ct-pavel", "Pavel", "Dvorak", "Head of Software", "co-wrenfield", "Lead", "New", 9, 3],
  ["ct-ingrid", "Ingrid", "Solberg", "VP Member Experience", "co-ambleforth", "Customer", "Connected", 778, 10],
  ["ct-mateo", "Mateo", "Quintero", "Operations Manager", "co-tamarack", "Lead", "Attempted to contact", 100, 30],
  ["ct-colette", "Colette", "Byrne", "Controller", "co-northquay", "Customer", "Connected", 395, 11],
  ["ct-harriet", "Harriet", "Oyelaran", "VP Clinical Operations", "co-elderbrook", "Opportunity", "In progress", 66, 2],
  ["ct-dev", "Dev", "Malhotra", "Audience Analytics Lead", "co-pikewell", "Lead", "Open", 84, 15],
  ["ct-noor", "Noor", "Farah", "General Manager", "co-starling", "Lead", "New", 11, 8],
];

const contacts: Contact[] = contactSeeds.map(([id, firstName, lastName, title, companyId, lifecycle, leadStatus, created, last], i) => ({
  id,
  firstName,
  lastName,
  email: `${firstName}.${lastName}@${company(companyId).domain}`.toLowerCase(),
  phone: `(555) 01${String(40 + i).padStart(2, "0")}-${String(4200 + i * 47).slice(0, 4)}`,
  title,
  companyId,
  ownerId: company(companyId).ownerId,
  lifecycle,
  leadStatus,
  createdAt: `@-${created}d`,
  lastActivityAt: `@-${last}d`,
  source: i % 3 === 0 ? "Organic search" : i % 3 === 1 ? "Webinar" : "Referral",
}));

type DealSeed = [id: string, name: string, companyId: string, contactId: string, stage: string, closeInDays: number, createdDaysAgo: number, type: string, lines: LineItem[]];

const dealSeeds: DealSeed[] = [
  ["dl-tessellate", "Tessellate Freight Systems: Analytics rollout", "co-tessellate", "ct-anika", "qualified", 18, 12, "New business", []],
  ["dl-marlowe", "Marlowe Ridge Health: Renewal and 20-seat expansion", "co-marlowe", "ct-priscilla", "qualified", 14, 8, "Renewal", [line("LS-GRO-SEAT", 120), line("LS-AI-SEAT", 120), line("LS-SUP-PREM", 1)]],
  ["dl-quarry-upgrade", "Quarrystone Outfitters: Growth plan upgrade", "co-quarry", "ct-lucia", "closed-won", -291, 330, "Expansion", [line("LS-GRO-SEAT", 100, 864), line("LS-AI-SEAT", 40, 170)]],
  ["dl-vireo-starter", "Vireo Mobility: Starter plan", "co-vireo", "ct-lior", "closed-won", -200, 240, "New business", [line("LS-STR-SEAT", 30), line("LS-ONB-STR", 1)]],
  ["dl-ostrander", "Ostrander Biologics: Enterprise evaluation", "co-ostrander", "ct-felix", "quote-sent", 25, 45, "New business", [line("LS-ENT-SEAT", 250), line("LS-SEC-PACK", 1), line("LS-ONB-ENT", 1)]],
  ["dl-saltmarsh", "Saltmarsh Hospitality Group: Property managers expansion", "co-saltmarsh", "ct-gwen", "negotiation", 9, 30, "Expansion", [line("LS-GRO-SEAT", 40), line("LS-TRN-ADM", 1)]],
  ["dl-brambleside", "Brambleside Insurance Mutual: Claims analytics", "co-brambleside", "ct-ravi", "new-rfq", 60, 5, "New business", [line("LS-ENT-SEAT", 150), line("LS-SEC-PACK", 1)]],
  ["dl-kittering", "Kittering Home Goods: Annual renewal", "co-kittering", "ct-moira", "qualified", 35, 20, "Renewal", [line("LS-GRO-SEAT", 45), line("LS-AI-SEAT", 45)]],
  ["dl-fallowfield", "Fallowfield Energy Cooperative: Outage reporting workspace", "co-fallowfield", "ct-august", "closed-won", -40, 95, "Expansion", [line("LS-GRO-SEAT", 60), line("LS-CON-WH", 2), line("LS-ONB-GRO", 1)]],
  ["dl-lanternfish", "Lanternfish Games: Live ops dashboards", "co-lanternfish", "ct-yuki", "quote-sent", 16, 28, "New business", [line("LS-GRO-SEAT", 50), line("LS-API-PACK", 1), line("LS-ONB-GRO", 1)]],
  ["dl-oxbow", "Oxbow Staffing Partners: AI Assistant add-on", "co-oxbow", "ct-bianca", "negotiation", 7, 33, "Expansion", [line("LS-AI-SEAT", 80)]],
  ["dl-thistledown", "Thistledown Veterinary Network: Clinic scorecards", "co-thistledown", "ct-callum", "new-rfq", 50, 6, "New business", [line("LS-GRO-SEAT", 75), line("LS-ONB-GRO", 1)]],
  ["dl-greywether", "Greywether Construction: Project controls rollout", "co-greywether", "ct-zainab", "closed-won", -22, 70, "New business", [line("LS-GRO-SEAT", 120), line("LS-SEC-PACK", 1), line("LS-ONB-GRO", 1)]],
  ["dl-pallister", "Pallister and Vane Legal: Matter profitability", "co-pallister", "ct-edmund", "qualified", 30, 14, "New business", [line("LS-STR-SEAT", 25), line("LS-ONB-STR", 1)]],
  ["dl-cindermoor", "Cindermoor Coffee Roasters: Wholesale reporting", "co-cindermoor", "ct-sunita", "closed-won", -75, 110, "New business", [line("LS-STR-SEAT", 25), line("LS-ONB-STR", 1)]],
  ["dl-wrenfield", "Wrenfield Robotics: Trial conversion", "co-wrenfield", "ct-pavel", "new-rfq", 40, 3, "New business", [line("LS-STR-SEAT", 25)]],
  ["dl-ambleforth", "Ambleforth Credit Union: Member analytics renewal", "co-ambleforth", "ct-ingrid", "quote-sent", 20, 25, "Renewal", [line("LS-GRO-SEAT", 60), line("LS-SEC-PACK", 1), line("LS-SUP-PREM", 1)]],
  ["dl-tamarack", "Tamarack Lane Travel: Starter plan", "co-tamarack", "ct-mateo", "closed-lost", -30, 80, "New business", [line("LS-STR-SEAT", 25)]],
  ["dl-northquay", "Northquay Marine Supply: Viewer seats for branches", "co-northquay", "ct-colette", "qualified", 28, 11, "Expansion", [line("LS-VIEW-SEAT", 150)]],
  ["dl-elderbrook", "Elderbrook Senior Living: Enterprise rollout", "co-elderbrook", "ct-harriet", "negotiation", 12, 52, "New business", [line("LS-ENT-SEAT", 250), line("LS-AI-SEAT", 250), line("LS-ONB-ENT", 1)]],
  ["dl-pikewell", "Pikewell Media: Audience dashboards", "co-pikewell", "ct-dev", "closed-lost", -15, 60, "New business", [line("LS-GRO-SEAT", 30)]],
];

const deals: Deal[] = dealSeeds.map(([id, name, companyId, contactId, stage, closeIn, created, type, lineItems]) => ({
  id,
  name,
  companyId,
  contactIds: [contactId],
  ownerId: company(companyId).ownerId,
  stage,
  amount: total(lineItems),
  closeDate: closeIn >= 0 ? `@+${closeIn}d` : `@${closeIn}d`,
  createdAt: `@-${created}d`,
  lastActivityAt: `@-${Math.min(created, Math.max(1, Math.abs(closeIn) % 9))}d`,
  type,
  lineItems,
}));

// The Guided quote hero starts as an estimate with no line items: the demo generates them.
const rollout = deals.find((d) => d.id === "dl-tessellate")!;
rollout.amount = 100000;
rollout.lastActivityAt = "@-1d";

function deal(id: string): Deal {
  const d = deals.find((x) => x.id === id);
  if (!d) throw new Error(`Unknown deal in seed: ${id}`);
  return d;
}

type QuoteSeed = [id: string, number: string, dealId: string, status: Quote["status"], discountPct: number, createdDaysAgo: number];

const quoteSeeds: QuoteSeed[] = [
  ["q-2087", "Q-2087", "dl-marlowe", "Draft", 0, 1],
  ["q-2086", "Q-2086", "dl-lanternfish", "Sent", 5, 3],
  ["q-2085", "Q-2085", "dl-ambleforth", "Sent", 8, 5],
  ["q-2084", "Q-2084", "dl-ostrander", "Sent", 10, 8],
  ["q-2083", "Q-2083", "dl-elderbrook", "Sent", 10, 12],
  ["q-2082", "Q-2082", "dl-saltmarsh", "Sent", 0, 14],
  ["q-2081", "Q-2081", "dl-oxbow", "Sent", 5, 17],
  ["q-2080", "Q-2080", "dl-greywether", "Accepted", 8, 30],
  ["q-2079", "Q-2079", "dl-fallowfield", "Accepted", 5, 48],
  ["q-2078", "Q-2078", "dl-cindermoor", "Accepted", 0, 82],
];

const quotes: Quote[] = quoteSeeds.map(([id, number, dealId, status, discountPct, created]) => {
  const d = deal(dealId);
  return {
    id,
    number,
    title: d.name,
    dealId,
    companyId: d.companyId,
    contactId: d.contactIds[0],
    ownerId: d.ownerId ?? "jordan",
    status,
    lineItems: d.lineItems.map((l) => ({ ...l })),
    discountPct,
    createdAt: `@-${created}d`,
    validUntil: `@+${30 - Math.min(created, 25)}d`,
    ...(status !== "Draft" ? { sentAt: `@-${Math.max(created - 1, 0)}d` } : {}),
    ...(status === "Accepted" ? { acceptedAt: `@-${Math.max(created - 4, 0)}d` } : {}),
  };
});

const tasks: Task[] = [
  { id: "tk-1", title: "Send the security overview to Desmond Achebe", type: "Email", priority: "High", dueAt: "@+0d", ownerId: "jordan", status: "open", contactId: "ct-desmond", companyId: "co-tessellate", dealId: "dl-tessellate" },
  { id: "tk-2", title: "Call Priscilla Vance about the renewal quote", type: "Call", priority: "High", dueAt: "@+1d", ownerId: "jordan", status: "open", contactId: "ct-priscilla", companyId: "co-marlowe", dealId: "dl-marlowe" },
  { id: "tk-3", title: "Reply to Lucia Ferrante about extra seats", type: "Email", priority: "Medium", dueAt: "@+1d", ownerId: "jordan", status: "open", contactId: "ct-lucia", companyId: "co-quarry" },
  { id: "tk-4", title: "Book the admin workshop for Saltmarsh", type: "To-do", priority: "Medium", dueAt: "@+4d", ownerId: "jordan", status: "open", contactId: "ct-gwen", companyId: "co-saltmarsh", dealId: "dl-saltmarsh" },
  { id: "tk-5", title: "Send connector answers to Hugo Lang", type: "Email", priority: "Low", dueAt: "@+6d", ownerId: "jordan", status: "open", contactId: "ct-hugo", companyId: "co-vireo" },
  { id: "tk-6", title: "Call Harriet Oyelaran about the contract redlines", type: "Call", priority: "High", dueAt: "@+0d", ownerId: "carmen", status: "open", contactId: "ct-harriet", companyId: "co-elderbrook", dealId: "dl-elderbrook" },
  { id: "tk-7", title: "Return the security questionnaire to Ostrander", type: "Email", priority: "Medium", dueAt: "@+2d", ownerId: "carmen", status: "open", contactId: "ct-felix", companyId: "co-ostrander", dealId: "dl-ostrander" },
  { id: "tk-8", title: "Send the renewal summary to Moira Kessler", type: "Email", priority: "Medium", dueAt: "@+3d", ownerId: "theo", status: "open", contactId: "ct-moira", companyId: "co-kittering", dealId: "dl-kittering" },
  { id: "tk-9", title: "Review quotes waiting on the deal desk", type: "To-do", priority: "Medium", dueAt: "@+2d", ownerId: "mei", status: "open" },
  { id: "tk-10", title: "Email Pavel Dvorak about the trial workspace", type: "Email", priority: "Low", dueAt: "@+5d", ownerId: "sasha", status: "open", contactId: "ct-pavel", companyId: "co-wrenfield", dealId: "dl-wrenfield" },
];

const activities: Activity[] = [
  // Tessellate Freight Systems: the Guided quote hero.
  { id: "ac-1", at: "@-1d", type: "call", title: "Call with Anika Sorensen", body: "Settled on 100 seats to start: dispatch, finance, and the carrier team. Wants the AI Assistant for the dispatch leads. Two-year term if the price is right.", byId: "jordan", contactIds: ["ct-anika"], companyIds: ["co-tessellate"], dealIds: ["dl-tessellate"] },
  { id: "ac-2", at: "@-3h", type: "email", title: "Email from Anika Sorensen: Seats and timeline for the rollout", body: "100 seats to start. Desmond needs single sign-on before anyone logs in. Live about four weeks from signature.", byId: null, contactIds: ["ct-anika"], companyIds: ["co-tessellate"], dealIds: ["dl-tessellate"] },
  { id: "ac-3", at: "@-6d", type: "meeting", title: "Meeting: Product demo for Tessellate", body: "Showed dispatch margin dashboards on their sample data. Desmond Achebe asked about SSO, SCIM, and the audit log.", byId: "jordan", contactIds: ["ct-anika", "ct-desmond"], companyIds: ["co-tessellate"], dealIds: ["dl-tessellate"] },
  { id: "ac-4", at: "@-12d", type: "deal", title: "Deal created", body: "Tessellate Freight Systems: Analytics rollout was created in Solution Fit.", byId: "jordan", companyIds: ["co-tessellate"], dealIds: ["dl-tessellate"] },
  // Marlowe Ridge Health: the Discount approval hero.
  { id: "ac-10", at: "@-1d", type: "quote", title: "Quote Q-2087 created", body: "Draft renewal quote for 120 seats.", byId: "jordan", contactIds: ["ct-priscilla"], companyIds: ["co-marlowe"], dealIds: ["dl-marlowe"], linkPath: "/quotes/q-2087", linkLabel: "View quote" },
  { id: "ac-11", at: "@-1d", type: "email", title: "Email from Priscilla Vance: Re: Renewal quote Q-2087", body: "Finance is asking for a better number on the renewal given we are adding 20 seats, and our standard payment terms are net 60.", byId: null, contactIds: ["ct-priscilla"], companyIds: ["co-marlowe"], dealIds: ["dl-marlowe"] },
  { id: "ac-12", at: "@-8d", type: "deal", title: "Deal created", body: "Marlowe Ridge Health: Renewal and 20-seat expansion was created in Solution Fit.", byId: "jordan", companyIds: ["co-marlowe"], dealIds: ["dl-marlowe"] },
  { id: "ac-13", at: "@-12d", type: "call", title: "Call with Tobias Reinhardt", body: "Budget for analytics is flat next year. Open to a multi-year commitment in exchange for a lower price.", byId: "jordan", contactIds: ["ct-tobias"], companyIds: ["co-marlowe"], dealIds: ["dl-marlowe"] },
  // Quarrystone Outfitters: the Back-office hero.
  { id: "ac-20", at: "@-1d", type: "email", title: "Email from Lucia Ferrante: Running out of seats", body: "The merchandising team tried to add eight people this week and hit the seat limit. The AI Assistant seats are used up too.", byId: null, contactIds: ["ct-lucia"], companyIds: ["co-quarry"] },
  { id: "ac-21", at: "@-12d", type: "sync", title: "Invoice INV-58831 issued", body: "Synced from billing: Warehouse connector, 2 connectors, $4,400.00. Due in 30 days.", byId: null, companyIds: ["co-quarry"] },
  { id: "ac-22", at: "@-18d", type: "call", title: "Call with Emeka Obi", body: "Confirmed the billing contact and the purchase order process for add-ons.", byId: "jordan", contactIds: ["ct-emeka"], companyIds: ["co-quarry"] },
  { id: "ac-23", at: "@-291d", type: "deal", title: "Deal won", body: "Quarrystone Outfitters: Growth plan upgrade moved to Closed Won.", byId: "jordan", contactIds: ["ct-lucia"], companyIds: ["co-quarry"], dealIds: ["dl-quarry-upgrade"] },
  { id: "ac-24", at: "@-300d", type: "note", title: "Note", body: "Lucia runs the workspace day to day. Emeka approves anything that changes the invoice.", byId: "jordan", contactIds: ["ct-lucia"], companyIds: ["co-quarry"] },
  // Vireo Mobility: the AI prospecting hero.
  { id: "ac-30", at: "@-4d", type: "email", title: "Email from Hugo Lang: Alerts feedback and two questions", body: "The city teams like the alerts, and more people keep asking for access. Two questions on the fleet telemetry connector and scheduled reports.", byId: null, contactIds: ["ct-hugo"], companyIds: ["co-vireo"] },
  { id: "ac-31", at: "@-122d", type: "call", title: "Call with Lior Ben-David", body: "Left a voicemail about the mid-year check-in.", byId: "jordan", contactIds: ["ct-lior"], companyIds: ["co-vireo"] },
  { id: "ac-32", at: "@-200d", type: "deal", title: "Deal won", body: "Vireo Mobility: Starter plan moved to Closed Won.", byId: "jordan", contactIds: ["ct-lior"], companyIds: ["co-vireo"], dealIds: ["dl-vireo-starter"] },
];

// Every other record gets a short, plausible history so no timeline is empty.
const seeded = new Set(activities.flatMap((a) => [...(a.contactIds ?? []), ...(a.dealIds ?? [])]));
contacts.forEach((c, i) => {
  if (seeded.has(c.id)) return;
  const co = company(c.companyId!);
  const d = deals.find((x) => x.contactIds.includes(c.id));
  const ids = { contactIds: [c.id], companyIds: [co.id], ...(d ? { dealIds: [d.id] } : {}) };
  activities.push({
    id: `ac-g${i}a`,
    at: c.lastActivityAt,
    type: i % 2 === 0 ? "call" : "email",
    title: i % 2 === 0 ? `Call with ${c.firstName} ${c.lastName}` : `Email to ${c.firstName} ${c.lastName}`,
    body: d ? `Talked through ${d.name.split(": ")[1].toLowerCase()} and next steps.` : `Shared the ${co.industry.toLowerCase()} dashboard templates and asked about reporting plans for the year.`,
    byId: c.ownerId,
    ...ids,
  });
  if (d) {
    activities.push({ id: `ac-g${i}b`, at: d.createdAt, type: "deal", title: "Deal created", body: `${d.name} was created.`, byId: d.ownerId, ...ids });
  }
  activities.push({ id: `ac-g${i}c`, at: c.createdAt, type: "lifecycle", title: "Contact created", body: `${c.firstName} ${c.lastName} was created from ${c.source?.toLowerCase() ?? "an import"}.`, byId: null, contactIds: [c.id], companyIds: [co.id] });
});

export const saasPack: Pack = {
  vertical: { id: "saas", name: "SaaS and software" },
  portal: { company: "Lumenstack", domain: "lumenstack.example", hubId: "51907264", currency: "USD" },
  personas: [
    { id: "jordan", name: "Jordan Avery", title: "Account Executive", email: "jordan.avery@lumenstack.example", viewAs: "Rep", color: "#0b6e6e" },
    { id: "mei", name: "Mei Tanaka", title: "Deal Desk Manager", email: "mei.tanaka@lumenstack.example", viewAs: "Deal desk", color: "#8a3ffc" },
    { id: "carmen", name: "Carmen Okoye", title: "Enterprise Account Executive, West", email: "carmen.okoye@lumenstack.example", viewAs: "Carmen, enterprise AE", color: "#b8500a" },
    { id: "theo", name: "Theo Lindgren", title: "Mid-Market Account Executive", email: "theo.lindgren@lumenstack.example", viewAs: "Theo, mid-market AE", color: "#1565c0" },
    { id: "sasha", name: "Sasha Brooks", title: "SMB Account Executive", email: "sasha.brooks@lumenstack.example", viewAs: "Sasha, SMB AE", color: "#5d6b2f" },
  ],
  defaultPersonaId: "jordan",
  terms: { quote: "Quote", product: "Product", backOffice: "billing system", request: "Request" },
  // Stage ids are the demo engine's keys. Labels follow a subscription sales pipeline.
  stages: [
    { id: "new-rfq", label: "Discovery", probability: 10 },
    { id: "qualified", label: "Solution Fit", probability: 30 },
    { id: "quote-sent", label: "Proposal Sent", probability: 50 },
    { id: "negotiation", label: "Contract Review", probability: 70 },
    { id: "closed-won", label: "Closed Won", probability: 100, closed: "won" },
    { id: "closed-lost", label: "Closed Lost", probability: 0, closed: "lost" },
  ],
  companies,
  contacts,
  deals,
  products,
  quotes,
  tasks,
  notifications: [
    { id: "nt-1", personaId: "jordan", at: "@-2d", kind: "mention", title: "Mei Tanaka mentioned you", body: "On Saltmarsh Hospitality Group: Property managers expansion: \"Fine at list price. No approval needed.\"", path: "/deals/dl-saltmarsh", read: true },
    { id: "nt-2", personaId: "jordan", at: "@-3d", kind: "task", title: "Task due today", body: "Send the security overview to Desmond Achebe", path: "/tasks", read: true },
    { id: "nt-3", personaId: "mei", at: "@-12d", kind: "approved", title: "You approved a discount", body: "Q-2083 for Elderbrook Senior Living, 10% discount.", path: "/quotes/q-2083", read: true },
    { id: "nt-4", personaId: "carmen", at: "@-1d", kind: "task", title: "Task due today", body: "Call Harriet Oyelaran about the contract redlines", path: "/tasks", read: true },
  ],
  activities,
  threads,
  workflows: [
    {
      id: "wf-demo-routing",
      name: "Inbound | Demo request routing",
      object: "Contact",
      status: "On",
      enrolled: 3962,
      createdAt: "@-380d",
      updatedAt: "@-9d",
      description: "Scores every Request a demo submission and routes it by segment, then territory.",
      trunk: [
        { id: "n-trigger", kind: "trigger", label: "Contact enrollment trigger", detail: "Form submission: Request a demo" },
        { id: "n-enrich", kind: "action", label: "Enrich company", detail: "Fill industry, employee count, revenue, and tech stack" },
        { id: "n-score", kind: "action", label: "Update lead score", detail: "Fit and engagement score, 0 to 100" },
        { id: "n-route", kind: "action", label: "Route by segment and territory", detail: "Custom action: looks up the owner in the segment and territory table", extId: "territory-routing" },
        { id: "n-branch", kind: "branch", label: "Branch on routing result" },
      ],
      branches: [
        {
          id: "field",
          label: "Enterprise account executive",
          rule: "Score 70 or more, 1,000 employees or more",
          nodes: [
            { id: "f-owner", kind: "action", label: "Set contact owner", detail: "Enterprise AE for the territory" },
            { id: "f-deal", kind: "action", label: "Create deal", detail: "Pipeline: Sales. Stage: Discovery" },
            { id: "f-task", kind: "action", label: "Create task", detail: "Call within 1 hour. High priority" },
            { id: "f-alert", kind: "action", label: "Send Slack notification", detail: "Enterprise territory channel, with score and reasons" },
          ],
        },
        {
          id: "inside",
          label: "Mid-market sales",
          rule: "Score 40 to 69, 200 to 999 employees",
          nodes: [
            { id: "i-owner", kind: "action", label: "Rotate contact owner", detail: "Mid-market team" },
            { id: "i-deal", kind: "action", label: "Create deal", detail: "Pipeline: Sales. Stage: Discovery" },
            { id: "i-task", kind: "action", label: "Create task", detail: "Email today. Medium priority" },
            { id: "i-alert", kind: "action", label: "Send Slack notification", detail: "#sales-mid-market" },
          ],
        },
        {
          id: "smb",
          label: "SMB sales",
          rule: "Score 40 or more, under 200 employees",
          nodes: [
            { id: "s-owner", kind: "action", label: "Rotate contact owner", detail: "SMB team" },
            { id: "s-task", kind: "action", label: "Create task", detail: "Send the trial link and book a call" },
          ],
        },
        {
          id: "nurture",
          label: "Self-serve nurture",
          rule: "Score under 40",
          nodes: [
            { id: "u-stage", kind: "action", label: "Set lifecycle stage", detail: "Subscriber" },
            { id: "u-seq", kind: "action", label: "Enroll in workflow", detail: "Marketing | Free trial nurture" },
          ],
        },
      ],
    },
    { id: "wf-quote-followup", name: "Proposal Sent | Quote follow-up", object: "Deal", status: "On", enrolled: 518, createdAt: "@-340d", updatedAt: "@-33d", description: "Creates a follow-up task three days after a quote is sent." },
    { id: "wf-nurture", name: "Marketing | Free trial nurture", object: "Contact", status: "On", enrolled: 8840, createdAt: "@-590d", updatedAt: "@-61d", description: "Getting-started emails for contacts who are not sales-ready." },
    { id: "wf-renewal", name: "Renewals | 90-day renewal notice", object: "Deal", status: "On", enrolled: 204, createdAt: "@-270d", updatedAt: "@-98d", description: "Creates a renewal deal and notifies the owner 90 days before the renewal date." },
    { id: "wf-trial", name: "Product | Trial expiry reminder", object: "Contact", status: "Off", enrolled: 62, createdAt: "@-450d", updatedAt: "@-170d", description: "Reminds trial users three days before the trial ends." },
  ],
  signals: [
    { id: "sg-vireo", companyId: "co-vireo", title: "Usage surge and a funding round", source: "Product usage and company news", at: "@-1d", strength: "High", summary: "29 of 30 Starter seats active this week against an average of 14. Series C announced.", hero: true },
    { id: "sg-saltmarsh", companyId: "co-saltmarsh", title: "Pricing page visits", source: "Website activity", at: "@-2d", strength: "Medium", summary: "Three contacts viewed Enterprise pricing this week." },
    { id: "sg-ostrander", companyId: "co-ostrander", title: "Quote viewed four times", source: "Quote activity", at: "@-2d", strength: "Medium", summary: "Q-2084 was opened by two new viewers." },
    { id: "sg-brambleside", companyId: "co-brambleside", title: "Hiring a head of data", source: "Company news", at: "@-4d", strength: "Medium", summary: "A new Head of Data role mentions self-serve reporting for claims teams." },
    { id: "sg-kittering", companyId: "co-kittering", title: "Seats near the cap", source: "Product usage", at: "@-6d", strength: "Medium", summary: "43 of 45 Growth seats active, ahead of the renewal." },
    { id: "sg-fallowfield", companyId: "co-fallowfield", title: "Webinar attendance", source: "Event attendance", at: "@-8d", strength: "Medium", summary: "Two analysts joined the AI Assistant launch webinar." },
  ],
  quoteTerms: [
    "Prices in US dollars, valid for 30 days from the quote date.",
    "Subscriptions start on the go-live date and renew for the same term unless cancelled 60 days before the renewal date.",
    "Onboarding and other one-time services are invoiced on signature.",
    "Use of the service is governed by the Lumenstack Master Subscription Agreement.",
  ],
  extensions,
  labels: {
    timing: "Billing",
    quoteTotal: "First-year total",
    document: { summary: "{seller} will provide the subscription and services below for {buyer}: {count} line items, {total} in the first year." },
    recurring: { annual: "Annual recurring revenue", oneTime: "One-time services" },
    synced: {
      title: "Billing Sync",
      account: "Billing Account Number",
      lastOrder: "Billing Renewal Date",
      openBalance: "Billing Open Balance",
      status: "Billing Payment Status",
    },
  },
  stepNotes: {
    "guided-quote": {
      requirements: { hint: "Choose plan, add-ons, term, billing frequency, seats, and go-live date" },
    },
    "discount-approval": {
      discount: { hint: "Line items: click Edit all line items, set Unit discount to 18% on each line, then Save. Optional: Payments section, set Payment terms to Net 60" },
    },
    "back-office": {
      company: { hint: "Companies: click Quarrystone Outfitters. Synced billing fields and the Billing and usage card are on the record" },
      orders: { title: "Expand a subscription", hint: "Subscriptions tab: click a subscription row" },
      balance: { title: "Check the invoices", hint: "Click the Invoices tab" },
      stock: { title: "Add seats to an expansion quote", hint: "Seat usage tab: tick three items, then Add to expansion quote" },
    },
    "lead-capture": {
      form: { title: "Submit the demo request", hint: "Pick one of the three leads, then Request a demo" },
    },
  },
  demos,
};
