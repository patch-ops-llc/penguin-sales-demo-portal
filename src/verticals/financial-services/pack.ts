import type { Activity, Company, Contact, Deal, LineItem, Pack, Product, Quote, Task } from "../types";
import { demos } from "./demos";
import { extensions } from "./extensions";
import { threads } from "./inbox";
import { docFee, FUNDING_COST, INSPECTION_FROM, monthlyPayment, usd } from "./rates";

// Financial services and fintech pack: Fernhill Capital, an equipment finance lender that sells
// direct and through equipment vendors and brokers.
// Every company, person, and number here is invented sample data.
// Email and web addresses use the reserved ".example" domain so nothing can reach a real inbox.

const PROGRAMS: { sku: string; name: string }[] = [
  { sku: "FC-EFA-PMT", name: "Equipment finance agreement, monthly payment" },
  { sku: "FC-EFU-PMT", name: "Used equipment finance agreement, monthly payment" },
  { sku: "FC-FMV-PMT", name: "Fair market value lease, monthly payment" },
  { sku: "FC-TRAC-PMT", name: "TRAC lease for trucks and trailers, monthly payment" },
  { sku: "FC-SLB-PMT", name: "Sale-leaseback, monthly payment" },
];

// In the product library a program's price is its monthly payment per $100,000 financed over 60 months.
function program({ sku, name }: { sku: string; name: string }): Product {
  const price = monthlyPayment(sku, 60, 100_000);
  return { sku, name, family: "Financing programs, per $100,000 over 60 months", price, cost: Math.round(price * FUNDING_COST), leadDays: 5, onHand: 0, timing: "Monthly" };
}

function charge(sku: string, name: string, family: string, price: number, costRatio: number, timing = "At funding"): Product {
  return { sku, name, family, price, cost: Math.round(price * costRatio), leadDays: 0, onHand: 0, timing };
}

export const products: Product[] = [
  ...PROGRAMS.map(program),
  charge("FC-FEE-DOC", "Documentation fee", "Fees", 495, 0.3),
  charge("FC-FEE-UCC", "UCC filing and lien search", "Fees", 150, 0.6),
  charge("FC-FEE-INSP", "Site inspection", "Fees", 350, 0.8),
  charge("FC-FEE-APPR", "Equipment appraisal", "Fees", 750, 0.8),
  charge("FC-FEE-TITLE", "Title and registration, per unit", "Fees", 185, 0.7),
  charge("FC-INS-EQP", "Equipment insurance program, monthly", "Protection", 195, 0.75, "Monthly"),
];

function payment(sku: string, months: number, financed: number): LineItem {
  const p = products.find((x) => x.sku === sku)!;
  const unitPrice = monthlyPayment(sku, months, financed);
  return { sku, name: p.name, description: `${usd(financed)} financed over ${months} months.`, qty: months, unitPrice, unitCost: Math.round(unitPrice * FUNDING_COST), leadDays: p.leadDays, timing: "Monthly" };
}

function fee(sku: string, unitPrice?: number): LineItem {
  const p = products.find((x) => x.sku === sku);
  if (!p) throw new Error(`Unknown SKU in seed: ${sku}`);
  const price = unitPrice ?? p.price;
  return { sku, name: p.name, qty: 1, unitPrice: price, unitCost: Math.round((price * p.cost) / p.price), leadDays: 0, timing: p.timing };
}

function financing(sku: string, months: number, financed: number): LineItem[] {
  return [payment(sku, months, financed), fee("FC-FEE-DOC", docFee(financed)), fee("FC-FEE-UCC"), ...(financed >= INSPECTION_FROM ? [fee("FC-FEE-INSP")] : [])];
}

function total(lines: LineItem[]): number {
  return lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0);
}

type CompanySeed = [id: string, name: string, industry: string, type: string, city: string, state: string, employees: number, revenueM: number, ownerId: string, lifecycle: string, createdDaysAgo: number, lastDaysAgo: number, region: string];

const companySeeds: CompanySeed[] = [
  ["co-bramhall", "Bramhall Precision Machining", "Manufacturing", "Prospect", "Greenville", "SC", 140, 38, "dana", "Opportunity", 34, 1, "East"],
  ["co-ironbark", "Ironbark Paving and Grading", "Construction", "Customer", "Richmond", "VA", 210, 64, "dana", "Customer", 905, 1, "East"],
  ["co-calloway", "Calloway Aggregates", "Mining and quarrying", "Customer", "Knoxville", "TN", 320, 96, "dana", "Customer", 2380, 1, "East"],
  ["co-tidewater", "Tidewater Cold Storage", "Warehousing", "Customer", "Savannah", "GA", 260, 71, "dana", "Customer", 1790, 5, "East"],
  ["co-larkspur", "Larkspur Excavating", "Construction", "Prospect", "Roanoke", "VA", 38, 9, "dana", "Lead", 12, 3, "East"],
  ["co-fennimore", "Fennimore Dairy Farms", "Agriculture", "Customer", "Lancaster", "PA", 85, 24, "dana", "Customer", 640, 8, "East"],
  ["co-pendry", "Pendry Freight Lines", "Trucking", "Prospect", "Harrisburg", "PA", 120, 31, "dana", "Lead", 6, 2, "East"],
  ["co-halewood", "Halewood Surgical Center", "Healthcare", "Prospect", "Scottsdale", "AZ", 95, 28, "marcus", "Opportunity", 41, 2, "West"],
  ["co-quenby", "Quenby Print and Packaging", "Printing", "Customer", "Dayton", "OH", 180, 42, "elena", "Customer", 720, 7, "Central"],
  ["co-saffron", "Saffron Ridge Vineyards", "Agriculture", "Prospect", "Paso Robles", "CA", 60, 14, "marcus", "Opportunity", 27, 4, "West"],
  ["co-northmere", "Northmere Crane and Rigging", "Construction", "Customer", "Spokane", "WA", 150, 47, "marcus", "Customer", 1130, 6, "West"],
  ["co-dunmore", "Dunmore Tool and Die", "Manufacturing", "Customer", "Erie", "PA", 110, 26, "dana", "Customer", 980, 9, "East"],
  ["co-wintergreen", "Wintergreen Landscape Supply", "Wholesale distribution", "Customer", "Madison", "WI", 75, 19, "elena", "Customer", 512, 11, "Central"],
  ["co-oakhollow", "Oakhollow Veterinary Hospitals", "Veterinary services", "Prospect", "Denver", "CO", 230, 52, "marcus", "Lead", 14, 5, "West"],
  ["co-brackenridge", "Brackenridge Brewing", "Food and beverage", "Customer", "Asheville", "NC", 90, 21, "dana", "Customer", 455, 13, "East"],
  ["co-tallgrass", "Tallgrass Grain Cooperative", "Agriculture", "Customer", "Salina", "KS", 160, 88, "elena", "Customer", 1410, 6, "Central"],
  ["co-copperline", "Copperline Fabrication", "Manufacturing", "Prospect", "Reno", "NV", 70, 16, "marcus", "Lead", 9, 4, "West"],
  ["co-marrowstone", "Marrowstone Marine Services", "Marine services", "Customer", "Tacoma", "WA", 105, 33, "marcus", "Customer", 860, 10, "West"],
  ["co-lindenhurst", "Lindenhurst Imaging Associates", "Healthcare", "Prospect", "Columbus", "OH", 65, 18, "elena", "Opportunity", 66, 2, "Central"],
  ["co-juniper", "Juniper Mesa Aviation", "Aviation services", "Prospect", "Albuquerque", "NM", 45, 11, "marcus", "Lead", 101, 30, "West"],
  ["co-kelbrook", "Kelbrook Waste Services", "Waste management", "Customer", "Buffalo", "NY", 190, 58, "dana", "Customer", 1240, 12, "East"],
  // Referral partners: the equipment vendors and brokers who send funding requests.
  ["co-stonegate", "Stonegate Equipment Sales", "Equipment dealer", "Vendor partner", "Roanoke", "VA", 55, 34, "dana", "Other", 1320, 1, "East"],
  ["co-osgrove", "Osgrove Commercial Brokers", "Finance broker", "Broker", "Philadelphia", "PA", 12, 3, "dana", "Other", 870, 1, "East"],
  ["co-brightmoor", "Brightmoor Truck Center", "Truck dealer", "Vendor partner", "Harrisburg", "PA", 80, 61, "dana", "Other", 410, 1, "East"],
];

function domainOf(name: string): string {
  return `${name.toLowerCase().replace(/ and /g, "").replace(/[^a-z0-9]/g, "")}.example`;
}

const companies: Company[] = companySeeds.map(([id, name, industry, type, city, state, employees, revenueM, ownerId, lifecycle, created, last, region], i) => ({
  id,
  name,
  domain: domainOf(name),
  industry,
  type,
  city,
  state,
  employees,
  revenue: revenueM * 1_000_000,
  phone: `(555) 01${String(10 + i).padStart(2, "0")}-${String(2700 + i * 43).slice(0, 4)}`,
  ownerId,
  lifecycle,
  createdAt: `@-${created}d`,
  lastActivityAt: `@-${last}d`,
  territory: region,
}));

function company(id: string): Company {
  const c = companies.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown company in seed: ${id}`);
  return c;
}

// The synced servicing fields reuse the back-office summary: lastOrderDate holds the next maturity
// date, openBalance the principal outstanding, and creditStatus the account status.
company("co-bramhall").description = "Contract machining for aerospace and medical customers. Adding a 5-axis machining center to take on a new aerospace program.";
company("co-ironbark").description = "Asphalt paving and site grading contractor. Has financed its plant and pavers with Fernhill Capital for more than two years.";
company("co-ironbark").erp = { accountNumber: "FH-CUST-221960", lastOrderDate: "@+1371d", openBalance: 377_840, creditStatus: "Current", creditLimit: 1_000_000 };
company("co-calloway").description = "Crushed stone, sand, and gravel from four quarries in East Tennessee. A customer since its first wheel loader.";
company("co-calloway").erp = { accountNumber: "FH-CUST-204417", lastOrderDate: "@+212d", openBalance: 1_395_207, creditStatus: "Current", creditLimit: 2_000_000 };
company("co-tidewater").description = "Temperature-controlled warehousing near the port. Financed its refrigeration plant with Fernhill Capital five years ago.";
company("co-tidewater").erp = { accountNumber: "FH-CUST-187302", lastOrderDate: "@+74d", openBalance: 70_868, creditStatus: "Current", creditLimit: 1_500_000 };
company("co-stonegate").description = "Compact and heavy equipment dealer. Sends funding requests for its customers under the Fernhill Capital vendor program.";
company("co-osgrove").description = "Independent commercial finance broker placing agricultural and food processing equipment.";
company("co-brightmoor").description = "Medium and heavy truck dealer. Vendor program partner since last year.";

type ContactSeed = [id: string, first: string, last: string, title: string, companyId: string, lifecycle: string, leadStatus: string, createdDaysAgo: number, lastDaysAgo: number];

const contactSeeds: ContactSeed[] = [
  ["ct-noelle", "Noelle", "Fairbanks", "Chief Financial Officer", "co-bramhall", "Opportunity", "In progress", 34, 1],
  ["ct-ivo", "Ivo", "Petrakis", "Plant Manager", "co-bramhall", "Opportunity", "In progress", 20, 6],
  ["ct-wade", "Wade", "Hollis", "Owner", "co-ironbark", "Customer", "Connected", 900, 1],
  ["ct-marisol", "Marisol", "Quint", "Controller", "co-ironbark", "Customer", "Connected", 610, 9],
  ["ct-renee", "Renee", "Castellan", "Chief Financial Officer", "co-calloway", "Customer", "Connected", 2375, 1],
  ["ct-dmitri", "Dmitri", "Vasko", "Equipment Manager", "co-calloway", "Customer", "Connected", 1100, 16],
  ["ct-gareth", "Gareth", "Lindqvist", "Controller", "co-tidewater", "Customer", "Connected", 1785, 5],
  ["ct-amara", "Amara", "Nwosu", "Chief Financial Officer", "co-tidewater", "Customer", "Attempted to contact", 1780, 140],
  ["ct-colm", "Colm", "Rafferty", "Owner", "co-larkspur", "Lead", "Open", 12, 3],
  ["ct-greta", "Greta", "Fennimore", "General Manager", "co-fennimore", "Customer", "Connected", 636, 8],
  ["ct-otis", "Otis", "Pendry", "President", "co-pendry", "Lead", "New", 6, 2],
  ["ct-leona", "Leona", "Abernathy", "Practice Administrator", "co-halewood", "Opportunity", "In progress", 41, 2],
  ["ct-ansel", "Ansel", "Quenby", "Vice President of Operations", "co-quenby", "Customer", "Connected", 715, 7],
  ["ct-beatriz", "Beatriz", "Olmos", "Owner", "co-saffron", "Opportunity", "In progress", 27, 4],
  ["ct-rolf", "Rolf", "Engstrom", "Chief Financial Officer", "co-northmere", "Customer", "Connected", 1125, 6],
  ["ct-patrice", "Patrice", "Dunmore", "President", "co-dunmore", "Customer", "Connected", 975, 9],
  ["ct-halle", "Halle", "Voss", "Finance Manager", "co-wintergreen", "Customer", "Connected", 508, 11],
  ["ct-emory", "Emory", "Tate", "Chief Operating Officer", "co-oakhollow", "Lead", "New", 14, 5],
  ["ct-sabine", "Sabine", "Keller", "Co-founder", "co-brackenridge", "Customer", "Connected", 450, 13],
  ["ct-walt", "Walt", "Jorgensen", "General Manager", "co-tallgrass", "Customer", "Connected", 1405, 6],
  ["ct-nadia", "Nadia", "Farrow", "Owner", "co-copperline", "Lead", "New", 9, 4],
  ["ct-ewan", "Ewan", "Marrow", "Controller", "co-marrowstone", "Customer", "Connected", 855, 10],
  ["ct-priyanka", "Priyanka", "Nair", "Managing Partner", "co-lindenhurst", "Opportunity", "In progress", 66, 2],
  ["ct-ruben", "Ruben", "Salazar", "Director of Operations", "co-juniper", "Lead", "Attempted to contact", 100, 30],
  ["ct-clyde", "Clyde", "Kelbrook", "Chief Financial Officer", "co-kelbrook", "Customer", "Connected", 1235, 12],
  ["ct-hank", "Hank", "Brouwer", "Finance Manager", "co-stonegate", "Other", "Connected", 1315, 1],
  ["ct-odalys", "Odalys", "Brandt", "Broker", "co-osgrove", "Other", "Connected", 865, 1],
  ["ct-rex", "Rex", "Tolliver", "Fleet Sales Manager", "co-brightmoor", "Other", "Connected", 405, 1],
];

const contacts: Contact[] = contactSeeds.map(([id, firstName, lastName, title, companyId, lifecycle, leadStatus, created, last], i) => ({
  id,
  firstName,
  lastName,
  email: `${firstName}.${lastName}@${company(companyId).domain}`.toLowerCase(),
  phone: `(555) 01${String(40 + i).padStart(2, "0")}-${String(5100 + i * 53).slice(0, 4)}`,
  title,
  companyId,
  ownerId: company(companyId).ownerId,
  lifecycle,
  leadStatus,
  createdAt: `@-${created}d`,
  lastActivityAt: `@-${last}d`,
  source: i % 3 === 0 ? "Vendor referral" : i % 3 === 1 ? "Organic search" : "Broker referral",
}));

type DealSeed = [id: string, name: string, companyId: string, contactId: string, stage: string, closeInDays: number, createdDaysAgo: number, type: string, lines: LineItem[]];

const NEW = "New financing";
const EXISTING = "Existing customer financing";

const dealSeeds: DealSeed[] = [
  ["dl-bramhall", "Bramhall Precision Machining: 5-axis machining center", "co-bramhall", "ct-noelle", "qualified", 16, 10, NEW, []],
  ["dl-ironbark", "Ironbark Paving and Grading: Paver and two rollers", "co-ironbark", "ct-wade", "qualified", 12, 7, EXISTING, financing("FC-EFA-PMT", 60, 300_000)],
  ["dl-calloway-excavator", "Calloway Aggregates: Excavator", "co-calloway", "ct-renee", "closed-won", -150, 190, EXISTING, financing("FC-EFA-PMT", 60, 310_000)],
  ["dl-tidewater-plant", "Tidewater Cold Storage: Refrigeration plant", "co-tidewater", "ct-amara", "closed-won", -1752, 1790, NEW, financing("FC-EFA-PMT", 60, 1_200_000)],
  ["dl-halewood", "Halewood Surgical Center: Imaging suite", "co-halewood", "ct-leona", "quote-sent", 22, 40, NEW, financing("FC-FMV-PMT", 60, 480_000)],
  ["dl-quenby", "Quenby Print and Packaging: Digital press", "co-quenby", "ct-ansel", "negotiation", 8, 31, EXISTING, financing("FC-EFA-PMT", 72, 620_000)],
  ["dl-saffron", "Saffron Ridge Vineyards: Bottling line", "co-saffron", "ct-beatriz", "quote-sent", 18, 26, NEW, financing("FC-EFA-PMT", 60, 185_000)],
  ["dl-northmere", "Northmere Crane and Rigging: 90-ton crane", "co-northmere", "ct-rolf", "negotiation", 11, 45, EXISTING, financing("FC-EFA-PMT", 72, 940_000)],
  ["dl-dunmore", "Dunmore Tool and Die: Wire EDM machines", "co-dunmore", "ct-patrice", "qualified", 30, 14, EXISTING, financing("FC-EFA-PMT", 48, 210_000)],
  ["dl-wintergreen", "Wintergreen Landscape Supply: Delivery trucks", "co-wintergreen", "ct-halle", "closed-won", -35, 80, EXISTING, financing("FC-TRAC-PMT", 60, 268_000)],
  ["dl-oakhollow", "Oakhollow Veterinary Hospitals: Diagnostic equipment", "co-oakhollow", "ct-emory", "new-rfq", 50, 5, NEW, financing("FC-FMV-PMT", 48, 132_000)],
  ["dl-brackenridge", "Brackenridge Brewing: Canning line", "co-brackenridge", "ct-sabine", "closed-won", -60, 110, EXISTING, financing("FC-EFA-PMT", 60, 355_000)],
  ["dl-tallgrass", "Tallgrass Grain Cooperative: Grain dryers", "co-tallgrass", "ct-walt", "qualified", 28, 12, EXISTING, financing("FC-EFA-PMT", 72, 540_000)],
  ["dl-copperline", "Copperline Fabrication: Fiber laser cutter", "co-copperline", "ct-nadia", "new-rfq", 45, 4, NEW, financing("FC-EFA-PMT", 60, 415_000)],
  ["dl-marrowstone", "Marrowstone Marine Services: Travel lift", "co-marrowstone", "ct-ewan", "quote-sent", 20, 24, EXISTING, financing("FC-EFA-PMT", 72, 720_000)],
  ["dl-lindenhurst", "Lindenhurst Imaging Associates: MRI upgrade", "co-lindenhurst", "ct-priyanka", "negotiation", 9, 50, NEW, financing("FC-FMV-PMT", 60, 1_150_000)],
  ["dl-juniper", "Juniper Mesa Aviation: Ground support equipment", "co-juniper", "ct-ruben", "closed-lost", -20, 70, NEW, financing("FC-EFA-PMT", 60, 98_000)],
  ["dl-kelbrook", "Kelbrook Waste Services: Collection trucks", "co-kelbrook", "ct-clyde", "closed-won", -18, 66, EXISTING, financing("FC-TRAC-PMT", 72, 810_000)],
  ["dl-fennimore-wagons", "Fennimore Dairy Farms: Feed mixer wagons", "co-fennimore", "ct-greta", "closed-won", -400, 450, NEW, financing("FC-EFA-PMT", 60, 164_000)],
  ["dl-ironbark-plant", "Ironbark Paving and Grading: Asphalt plant upgrade", "co-ironbark", "ct-wade", "closed-won", -820, 880, NEW, financing("FC-EFA-PMT", 72, 560_000)],
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
const machiningCenter = deals.find((d) => d.id === "dl-bramhall")!;
machiningCenter.amount = 270_000;
machiningCenter.lastActivityAt = "@-1d";

function deal(id: string): Deal {
  const d = deals.find((x) => x.id === id);
  if (!d) throw new Error(`Unknown deal in seed: ${id}`);
  return d;
}

// The discount on a financing proposal is a rate exception: a percentage off the standard payment.
type QuoteSeed = [id: string, number: string, dealId: string, status: Quote["status"], rateExceptionPct: number, createdDaysAgo: number];

const quoteSeeds: QuoteSeed[] = [
  ["q-3187", "Q-3187", "dl-ironbark", "Draft", 0, 1],
  ["q-3186", "Q-3186", "dl-saffron", "Sent", 0, 3],
  ["q-3185", "Q-3185", "dl-marrowstone", "Sent", 1, 5],
  ["q-3184", "Q-3184", "dl-halewood", "Sent", 0, 8],
  ["q-3183", "Q-3183", "dl-lindenhurst", "Sent", 2, 12],
  ["q-3182", "Q-3182", "dl-northmere", "Sent", 2, 14],
  ["q-3181", "Q-3181", "dl-quenby", "Sent", 1, 17],
  ["q-3180", "Q-3180", "dl-kelbrook", "Accepted", 2, 30],
  ["q-3179", "Q-3179", "dl-wintergreen", "Accepted", 0, 48],
  ["q-3178", "Q-3178", "dl-brackenridge", "Accepted", 1, 82],
];

const quotes: Quote[] = quoteSeeds.map(([id, number, dealId, status, discountPct, created]) => {
  const d = deal(dealId);
  return {
    id,
    number,
    title: `${d.name}, financing proposal`,
    dealId,
    companyId: d.companyId,
    contactId: d.contactIds[0],
    ownerId: d.ownerId ?? "dana",
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
  { id: "tk-1", title: "Send the financing proposal to Noelle Fairbanks", type: "Email", priority: "High", dueAt: "@+0d", ownerId: "dana", status: "open", contactId: "ct-noelle", companyId: "co-bramhall", dealId: "dl-bramhall" },
  { id: "tk-2", title: "Call Wade Hollis about the paver proposal", type: "Call", priority: "High", dueAt: "@+1d", ownerId: "dana", status: "open", contactId: "ct-wade", companyId: "co-ironbark", dealId: "dl-ironbark" },
  { id: "tk-3", title: "Reply to Renee Castellan about the wheel loaders", type: "Email", priority: "Medium", dueAt: "@+1d", ownerId: "dana", status: "open", contactId: "ct-renee", companyId: "co-calloway" },
  { id: "tk-4", title: "Collect the insurance certificate from Dunmore Tool and Die", type: "To-do", priority: "Medium", dueAt: "@+4d", ownerId: "dana", status: "open", contactId: "ct-patrice", companyId: "co-dunmore", dealId: "dl-dunmore" },
  { id: "tk-5", title: "Send the maturity options to Gareth Lindqvist", type: "Email", priority: "Low", dueAt: "@+6d", ownerId: "dana", status: "open", contactId: "ct-gareth", companyId: "co-tidewater" },
  { id: "tk-6", title: "Call Rolf Engstrom about the crane delivery date", type: "Call", priority: "High", dueAt: "@+0d", ownerId: "marcus", status: "open", contactId: "ct-rolf", companyId: "co-northmere", dealId: "dl-northmere" },
  { id: "tk-7", title: "Send the lease comparison to Leona Abernathy", type: "Email", priority: "Medium", dueAt: "@+2d", ownerId: "marcus", status: "open", contactId: "ct-leona", companyId: "co-halewood", dealId: "dl-halewood" },
  { id: "tk-8", title: "Request updated financial statements from Tallgrass", type: "Email", priority: "Medium", dueAt: "@+3d", ownerId: "elena", status: "open", contactId: "ct-walt", companyId: "co-tallgrass", dealId: "dl-tallgrass" },
  { id: "tk-9", title: "Review proposals waiting on credit", type: "To-do", priority: "Medium", dueAt: "@+2d", ownerId: "ruth", status: "open" },
  { id: "tk-10", title: "Email Priyanka Nair about the document checklist", type: "Email", priority: "Low", dueAt: "@+5d", ownerId: "elena", status: "open", contactId: "ct-priyanka", companyId: "co-lindenhurst", dealId: "dl-lindenhurst" },
];

const activities: Activity[] = [
  // Bramhall Precision Machining: the Guided quote hero.
  { id: "ac-1", at: "@-1d", type: "call", title: "Call with Noelle Fairbanks", body: "Vendor quote for the machining center is $250,000. Bramhall will put 10% down. Wants to own the machine at the end and prefers 60 months.", byId: "dana", contactIds: ["ct-noelle"], companyIds: ["co-bramhall"], dealIds: ["dl-bramhall"] },
  { id: "ac-2", at: "@-3h", type: "email", title: "Email from Noelle Fairbanks: Machining center financing", body: "The vendor can deliver in three weeks. Can you fund in two? Please send the proposal with the monthly payment and all fees.", byId: null, contactIds: ["ct-noelle"], companyIds: ["co-bramhall"], dealIds: ["dl-bramhall"] },
  { id: "ac-3", at: "@-6d", type: "note", title: "Note", body: "Credit reviewed the last two years of financial statements. Tier A.", byId: "dana", contactIds: ["ct-noelle"], companyIds: ["co-bramhall"], dealIds: ["dl-bramhall"] },
  { id: "ac-4", at: "@-10d", type: "deal", title: "Deal created", body: "Bramhall Precision Machining: 5-axis machining center was created in Credit Review.", byId: "dana", companyIds: ["co-bramhall"], dealIds: ["dl-bramhall"] },
  // Ironbark Paving and Grading: the Discount approval hero.
  { id: "ac-10", at: "@-1d", type: "quote", title: "Quote Q-3187 created", body: "Draft financing proposal: $300,000 financed over 60 months.", byId: "dana", contactIds: ["ct-wade"], companyIds: ["co-ironbark"], dealIds: ["dl-ironbark"], linkPath: "/quotes/q-3187", linkLabel: "View quote" },
  { id: "ac-11", at: "@-1d", type: "email", title: "Email from Wade Hollis: Re: Paver proposal Q-3187", body: "Our bank came in lower on the monthly payment. We would rather stay with you. Can you get closer?", byId: null, contactIds: ["ct-wade"], companyIds: ["co-ironbark"], dealIds: ["dl-ironbark"] },
  { id: "ac-12", at: "@-7d", type: "deal", title: "Deal created", body: "Ironbark Paving and Grading: Paver and two rollers was created in Credit Review.", byId: "dana", companyIds: ["co-ironbark"], dealIds: ["dl-ironbark"] },
  { id: "ac-13", at: "@-9d", type: "call", title: "Call with Marisol Quint", body: "Confirmed the equipment list and the vendor invoice. Payments on the asphalt plant facility have all been on time.", byId: "dana", contactIds: ["ct-marisol"], companyIds: ["co-ironbark"], dealIds: ["dl-ironbark"] },
  // Calloway Aggregates: the Back-office hero.
  { id: "ac-20", at: "@-1d", type: "email", title: "Email from Renee Castellan: Two more wheel loaders", body: "We are buying two wheel loaders for the Loudon quarry, about $300,000 together. Do we have room on our line?", byId: null, contactIds: ["ct-renee"], companyIds: ["co-calloway"] },
  { id: "ac-21", at: "@-6d", type: "sync", title: "Statement STM-2611 issued", body: "Synced from loan servicing: monthly payments on four facilities, $44,087.00. Due in 15 days.", byId: null, companyIds: ["co-calloway"] },
  { id: "ac-22", at: "@-16d", type: "call", title: "Call with Dmitri Vasko", body: "The jaw crusher facility matures in seven months. Dmitri expects to replace the crusher rather than rebuild it.", byId: "dana", contactIds: ["ct-dmitri"], companyIds: ["co-calloway"] },
  { id: "ac-23", at: "@-150d", type: "deal", title: "Deal won", body: "Calloway Aggregates: Excavator moved to Funded.", byId: "dana", contactIds: ["ct-renee"], companyIds: ["co-calloway"], dealIds: ["dl-calloway-excavator"] },
  { id: "ac-24", at: "@-160d", type: "note", title: "Note", body: "Renee signs every schedule. Dmitri picks the equipment and the vendor.", byId: "dana", contactIds: ["ct-renee"], companyIds: ["co-calloway"] },
  // Tidewater Cold Storage: the AI prospecting hero.
  { id: "ac-30", at: "@-5d", type: "email", title: "Email from Gareth Lindqvist: Payoff letter", body: "Could you send the payoff figure for the refrigeration plant facility? We are planning cash for the next two quarters.", byId: null, contactIds: ["ct-gareth"], companyIds: ["co-tidewater"] },
  { id: "ac-31", at: "@-140d", type: "call", title: "Call with Amara Nwosu", body: "Left a voicemail about the annual account review.", byId: "dana", contactIds: ["ct-amara"], companyIds: ["co-tidewater"] },
  { id: "ac-32", at: "@-1752d", type: "deal", title: "Deal won", body: "Tidewater Cold Storage: Refrigeration plant moved to Funded.", byId: "dana", contactIds: ["ct-amara"], companyIds: ["co-tidewater"], dealIds: ["dl-tidewater-plant"] },
];

// Every other record gets a short, plausible history so no timeline is empty.
const seeded = new Set(activities.flatMap((a) => [...(a.contactIds ?? []), ...(a.dealIds ?? [])]));
contacts.forEach((c, i) => {
  if (seeded.has(c.id)) return;
  const co = company(c.companyId!);
  const d = deals.find((x) => x.contactIds.includes(c.id));
  const partner = co.type === "Vendor partner" || co.type === "Broker";
  const ids = { contactIds: [c.id], companyIds: [co.id], ...(d ? { dealIds: [d.id] } : {}) };
  activities.push({
    id: `ac-g${i}a`,
    at: c.lastActivityAt,
    type: i % 2 === 0 ? "call" : "email",
    title: i % 2 === 0 ? `Call with ${c.firstName} ${c.lastName}` : `Email to ${c.firstName} ${c.lastName}`,
    body: d ? `Talked through financing for the ${d.name.split(": ")[1].toLowerCase()} and next steps.` : partner ? "Went over this month's funding requests and the current rate card." : `Shared financing options for ${co.industry.toLowerCase()} equipment and asked about purchases planned this year.`,
    byId: c.ownerId,
    ...ids,
  });
  if (d) {
    activities.push({ id: `ac-g${i}b`, at: d.createdAt, type: "deal", title: "Deal created", body: `${d.name} was created.`, byId: d.ownerId, ...ids });
  }
  activities.push({ id: `ac-g${i}c`, at: c.createdAt, type: "lifecycle", title: "Contact created", body: `${c.firstName} ${c.lastName} was created from ${c.source?.toLowerCase() ?? "an import"}.`, byId: null, contactIds: [c.id], companyIds: [co.id] });
});

export const financialServicesPack: Pack = {
  vertical: { id: "financial-services", name: "Financial services and fintech" },
  portal: { company: "Fernhill Capital", domain: "fernhillcapital.example", hubId: "48213390", currency: "USD", address: ["Stamford, CT 06901", "United States"] },
  personas: [
    { id: "dana", name: "Dana Whitlock", title: "Relationship Manager, East", email: "dana.whitlock@fernhillcapital.example", viewAs: "Rep", color: "#0b6e6e" },
    { id: "ruth", name: "Ruth Adeyemi", title: "Senior Credit Officer", email: "ruth.adeyemi@fernhillcapital.example", viewAs: "Credit officer", color: "#8a3ffc" },
    { id: "marcus", name: "Marcus Bell", title: "Senior Relationship Manager, West", email: "marcus.bell@fernhillcapital.example", viewAs: "Marcus, senior RM", color: "#b8500a" },
    { id: "elena", name: "Elena Sokolova", title: "Relationship Manager, Central", email: "elena.sokolova@fernhillcapital.example", viewAs: "Elena, regional RM", color: "#1565c0" },
    { id: "priya", name: "Priya Raman", title: "Small-Ticket Desk Lead", email: "priya.raman@fernhillcapital.example", viewAs: "Priya, small-ticket desk", color: "#5d6b2f" },
  ],
  defaultPersonaId: "dana",
  terms: { quote: "Financing proposal", product: "Program", backOffice: "loan servicing system", request: "Funding Request" },
  // Stage ids are the demo engine's keys. Labels follow a financing application from intake to funding.
  stages: [
    { id: "new-rfq", label: "New Application", probability: 10 },
    { id: "qualified", label: "Credit Review", probability: 30 },
    { id: "quote-sent", label: "Proposal Sent", probability: 50 },
    { id: "negotiation", label: "Documentation", probability: 80 },
    { id: "closed-won", label: "Funded", probability: 100, closed: "won" },
    { id: "closed-lost", label: "Declined or Withdrawn", probability: 0, closed: "lost" },
  ],
  companies,
  contacts,
  deals,
  products,
  quotes,
  tasks,
  notifications: [
    { id: "nt-1", personaId: "dana", at: "@-2d", kind: "mention", title: "Ruth Adeyemi mentioned you", body: "On Dunmore Tool and Die: Wire EDM machines: \"Standard pricing is fine. No exception needed.\"", path: "/deals/dl-dunmore", read: true },
    { id: "nt-2", personaId: "dana", at: "@-3d", kind: "task", title: "Task due today", body: "Send the financing proposal to Noelle Fairbanks", path: "/tasks", read: true },
    { id: "nt-3", personaId: "ruth", at: "@-14d", kind: "approved", title: "You approved a rate exception", body: "Q-3182 for Northmere Crane and Rigging, 2% rate exception.", path: "/quotes/q-3182", read: true },
    { id: "nt-4", personaId: "marcus", at: "@-1d", kind: "task", title: "Task due today", body: "Call Rolf Engstrom about the crane delivery date", path: "/tasks", read: true },
  ],
  activities,
  threads,
  workflows: [
    {
      id: "wf-inquiry-routing",
      name: "Inbound | Financing inquiry routing",
      object: "Contact",
      status: "On",
      enrolled: 2716,
      createdAt: "@-410d",
      updatedAt: "@-11d",
      description: "Records consent, scores every Request financing submission, and routes it by region and deal size.",
      trunk: [
        { id: "n-trigger", kind: "trigger", label: "Contact enrollment trigger", detail: "Form submission: Request financing" },
        { id: "n-consent", kind: "action", label: "Record consent", detail: "Consent to contact and to a business credit check, with the form and the date" },
        { id: "n-enrich", kind: "action", label: "Enrich company", detail: "Fill industry, employee count, revenue, and years in business" },
        { id: "n-score", kind: "action", label: "Update lead score", detail: "Fit and engagement score, 0 to 100" },
        { id: "n-route", kind: "action", label: "Route by region and deal size", detail: "Custom action: looks up the owner in the region and deal size table", extId: "territory-routing" },
        { id: "n-branch", kind: "branch", label: "Branch on routing result" },
      ],
      branches: [
        {
          id: "field",
          label: "Senior relationship manager",
          rule: "Score 70 or more, over $500,000",
          nodes: [
            { id: "f-owner", kind: "action", label: "Set contact owner", detail: "Senior relationship manager for the region" },
            { id: "f-deal", kind: "action", label: "Create deal", detail: "Pipeline: Financing. Stage: New Application" },
            { id: "f-task", kind: "action", label: "Create task", detail: "Call within 1 hour. High priority" },
            { id: "f-alert", kind: "action", label: "Send Slack notification", detail: "Regional originations channel, with score and reasons" },
          ],
        },
        {
          id: "inside",
          label: "Regional relationship manager",
          rule: "Score 40 or more, $100,000 to $500,000",
          nodes: [
            { id: "i-owner", kind: "action", label: "Set contact owner", detail: "Relationship manager for the region" },
            { id: "i-deal", kind: "action", label: "Create deal", detail: "Pipeline: Financing. Stage: New Application" },
            { id: "i-task", kind: "action", label: "Create task", detail: "Email today. Medium priority" },
            { id: "i-alert", kind: "action", label: "Send Slack notification", detail: "#originations-central" },
          ],
        },
        {
          id: "small",
          label: "Small-ticket desk",
          rule: "Score 40 or more, under $100,000",
          nodes: [
            { id: "s-owner", kind: "action", label: "Rotate contact owner", detail: "Small-ticket desk" },
            { id: "s-task", kind: "action", label: "Create task", detail: "Send the application link today" },
          ],
        },
        {
          id: "nurture",
          label: "Nurture",
          rule: "Score under 40",
          nodes: [
            { id: "u-stage", kind: "action", label: "Set lifecycle stage", detail: "Subscriber" },
            { id: "u-seq", kind: "action", label: "Enroll in workflow", detail: "Marketing | Financing guide nurture" },
          ],
        },
      ],
    },
    { id: "wf-proposal-followup", name: "Proposal Sent | Proposal follow-up", object: "Deal", status: "On", enrolled: 644, createdAt: "@-360d", updatedAt: "@-28d", description: "Creates a follow-up task three days after a financing proposal is sent." },
    { id: "wf-nurture", name: "Marketing | Financing guide nurture", object: "Contact", status: "On", enrolled: 5120, createdAt: "@-610d", updatedAt: "@-70d", description: "Sends the equipment financing guide to contacts who are not ready to apply." },
    { id: "wf-maturity", name: "Servicing | 120-day maturity notice", object: "Company", status: "On", enrolled: 188, createdAt: "@-290d", updatedAt: "@-104d", description: "Notifies the owner and creates a task 120 days before a facility matures." },
    { id: "wf-documents", name: "Documentation | Missing document reminder", object: "Deal", status: "On", enrolled: 97, createdAt: "@-330d", updatedAt: "@-52d", description: "Reminds the borrower and the owner when a document is still outstanding after five days." },
    { id: "wf-consent", name: "Compliance | Annual consent review", object: "Contact", status: "Off", enrolled: 41, createdAt: "@-470d", updatedAt: "@-190d", description: "Flags contacts whose consent to contact is more than 12 months old." },
  ],
  signals: [
    { id: "sg-tidewater", companyId: "co-tidewater", title: "Facility maturing and an expansion announced", source: "Loan servicing and company news", at: "@-1d", strength: "High", summary: "The refrigeration plant facility matures in 74 days, with 3 payments left. A second warehouse was announced last week.", hero: true },
    { id: "sg-northmere", companyId: "co-northmere", title: "Proposal viewed four times", source: "Quote activity", at: "@-2d", strength: "Medium", summary: "Q-3182 was opened by two new viewers." },
    { id: "sg-tallgrass", companyId: "co-tallgrass", title: "Payment calculator visits", source: "Website activity", at: "@-2d", strength: "Medium", summary: "Two contacts used the payment calculator this week." },
    { id: "sg-copperline", companyId: "co-copperline", title: "Hiring machine operators", source: "Job postings", at: "@-4d", strength: "Medium", summary: "Six open operator roles mention a second shift and new laser equipment." },
    { id: "sg-kelbrook", companyId: "co-kelbrook", title: "New municipal contract", source: "Company news", at: "@-6d", strength: "Medium", summary: "Won a seven-year collection contract for two more towns." },
    { id: "sg-quenby", companyId: "co-quenby", title: "Webinar attendance", source: "Event attendance", at: "@-8d", strength: "Medium", summary: "The controller joined the year-end equipment tax planning webinar." },
  ],
  quoteTerms: [
    "This proposal is not a commitment to lend. Financing is subject to credit approval and signed documentation.",
    "Payment terms: fixed monthly payments in arrears, starting 30 days after funding.",
    "Pricing is valid for 30 days from the proposal date.",
    "Fees are collected at funding. The equipment must be insured, with Fernhill Capital named as loss payee.",
  ],
  extensions,
  labels: {
    pipeline: "Financing pipeline",
    territory: "Region",
    timing: "Schedule",
    quoteTotal: "Total of payments and fees",
    agent: {
      timing: "What is the payment schedule?",
      files: [
        {
          name: "Documentation checklist.pdf",
          question: "What documents do you need from us?",
          answer: "We need two years of financial statements, the equipment invoice, and a signed credit application.",
          keywords: ["document", "paperwork", "financial statements", "checklist", "application"],
        },
        {
          name: "Insurance requirements.pdf",
          question: "What insurance is required?",
          answer: "Before funding, the equipment must be insured for its full replacement value, with Fernhill Capital named as loss payee.",
          keywords: ["insurance", "insured", "loss payee", "coverage"],
        },
        {
          name: "End-of-term and payoff guide.pdf",
          question: "What happens at the end of the term?",
          answer: "After the last payment the agreement is paid in full and the equipment is yours, free of our lien. A payoff figure is available on request at any time.",
          keywords: ["end of term", "end of the term", "payoff", "pay off", "buyout", "lien"],
        },
      ],
    },
    document: {
      heading: "Financing proposal",
      ref: "Proposal ref.",
      total: "Total of payments and fees",
      summary: "{seller} proposes the financing below for {buyer}: {count} line items, {total} in payments and fees.",
      cover: "Thank you for the chance to put this financing proposal together. The payments and fees below cover everything we discussed, {count} line items in all. If anything needs to change, reply to this email and I will send a revised proposal the same day.",
    },
    synced: {
      title: "Servicing Sync",
      account: "Servicing Customer Number",
      lastOrder: "Servicing Next Maturity Date",
      openBalance: "Servicing Outstanding Balance",
      status: "Servicing Account Status",
    },
  },
  stepNotes: {
    "guided-quote": {
      requirements: { hint: "Choose program, equipment cost, down payment, credit tier, term, and funding date" },
    },
    "discount-approval": {
      discount: { title: "Enter a rate exception", hint: "Line items: click Edit all line items, set Unit discount to 4% on the monthly payment line, then Save" },
      approve: { hint: "Approvals panel: the rate exception, margin, and the floor-price check are on the request. Click Approve" },
      send: { hint: "Demo bar: View as, Rep. The Approvals panel shows who requested and who approved. Then click Share" },
    },
    "back-office": {
      company: { hint: "Companies: click Calloway Aggregates. Synced servicing fields and the Loan servicing card are on the record" },
      orders: { title: "Expand a facility", hint: "Facilities tab: click a facility row" },
      balance: { title: "Check payments and the limit", hint: "Click the Payments tab" },
      stock: { title: "Use the available credit", hint: "Available credit tab: tick three items, then Add to financing proposal" },
      send: { hint: "The proposal is prefilled at the pricing the master line holds. Click Preview, then Share" },
    },
    "lead-capture": {
      form: { title: "Submit the financing request", hint: "Pick one of the three leads, then Request financing. Consent is captured on the form" },
      contact: { hint: "Contacts: click the new row at the top. Consent is on the record" },
    },
    "email-to-deal": {
      create: { title: "Confirm the flagged line, create the deal", hint: "Pick the suggested program for the flagged line, then Create deal" },
      deal: { hint: "Click View deal. Line items, amount, and close date are filled. The borrower and the vendor contact are associated" },
    },
    "ai-prospecting": {
      send: { hint: "Nothing goes out until a person approves it. Click Approve and send" },
    },
  },
  demos,
};
