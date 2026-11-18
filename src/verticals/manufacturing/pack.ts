import type { Activity, Company, Contact, Deal, LineItem, Pack, Product, Quote, Task } from "../types";
import { demos } from "./demos";
import { extensions } from "./extensions";
import { threads } from "./inbox";

// Manufacturing pack: Halvorsen Motion, linear actuators and servo drives, sold direct to OEMs
// and through distributors. Every company, person, and number here is invented sample data.
// Email and web addresses use the reserved ".example" domain so nothing can reach a real inbox.

const COST_RATIO = 0.6;

function product(sku: string, name: string, family: string, price: number, leadDays: number, onHand: number): Product {
  return { sku, name, family, price, cost: Math.round(price * COST_RATIO), leadDays, onHand };
}

export const products: Product[] = [
  product("HM-LA40-100", "Linear actuator, frame 40, 100 mm stroke", "Linear actuators", 1180, 10, 42),
  product("HM-LA40-200", "Linear actuator, frame 40, 200 mm stroke", "Linear actuators", 1320, 10, 31),
  product("HM-LA40-300", "Linear actuator, frame 40, 300 mm stroke", "Linear actuators", 1440, 10, 18),
  product("HM-LA60-200", "Linear actuator, frame 60, 200 mm stroke", "Linear actuators", 1780, 10, 26),
  product("HM-LA60-300", "Linear actuator, frame 60, 300 mm stroke", "Linear actuators", 1900, 10, 14),
  product("HM-LA60-300-SS", "Linear actuator, frame 60, 300 mm stroke, stainless washdown", "Linear actuators", 2565, 24, 0),
  product("HM-LA60-500", "Linear actuator, frame 60, 500 mm stroke", "Linear actuators", 2120, 17, 6),
  product("HM-LA80-300", "Linear actuator, frame 80, 300 mm stroke", "Linear actuators", 2650, 10, 9),
  product("HM-LA80-500", "Linear actuator, frame 80, 500 mm stroke", "Linear actuators", 2870, 17, 3),
  product("HM-SD08-24", "Servo drive, 8 A, 24 VDC", "Servo drives", 610, 5, 64),
  product("HM-SD08-48", "Servo drive, 8 A, 48 VDC", "Servo drives", 670, 5, 48),
  product("HM-SD12-48", "Servo drive, 12 A, 48 VDC", "Servo drives", 950, 5, 37),
  product("HM-SD12-230", "Servo drive, 12 A, 230 VAC", "Servo drives", 1010, 5, 22),
  product("HM-SD20-48", "Servo drive, 20 A, 48 VDC", "Servo drives", 1440, 5, 11),
  product("HM-SD20-230", "Servo drive, 20 A, 230 VAC", "Servo drives", 1500, 5, 15),
  product("HM-CK-STD-5M", "Motor and feedback cable kit, 5 m", "Cables and accessories", 165, 3, 210),
  product("HM-CK-WD-5M", "Motor and feedback cable kit, 5 m, washdown rated", "Cables and accessories", 245, 3, 85),
  product("HM-MK40-TR", "Trunnion mounting kit, frame 40", "Cables and accessories", 150, 3, 120),
  product("HM-MK60-TR", "Trunnion mounting kit, frame 60", "Cables and accessories", 210, 3, 96),
  product("HM-MK60-TR-SS", "Trunnion mounting kit, frame 60, stainless washdown", "Cables and accessories", 284, 17, 12),
  product("HM-MK60-CL", "Clevis mounting kit, frame 60", "Cables and accessories", 195, 3, 54),
  product("HM-MK80-TR", "Trunnion mounting kit, frame 80", "Cables and accessories", 290, 3, 40),
];

function line(sku: string, qty: number, unitPrice?: number): LineItem {
  const p = products.find((x) => x.sku === sku);
  if (!p) throw new Error(`Unknown SKU in seed: ${sku}`);
  return { sku, name: p.name, qty, unitPrice: unitPrice ?? p.price, unitCost: p.cost, leadDays: p.leadDays };
}

function total(lines: LineItem[]): number {
  return lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0);
}

type CompanySeed = [id: string, name: string, industry: string, type: string, city: string, state: string, employees: number, revenueM: number, ownerId: string, lifecycle: string, createdDaysAgo: number, lastDaysAgo: number, territory: string];

const companySeeds: CompanySeed[] = [
  ["co-brightwater", "Brightwater Packaging", "Packaging machinery", "Customer", "Milwaukee", "WI", 640, 185, "alex", "Customer", 912, 2, "Midwest"],
  ["co-corvale", "Corvale Foods", "Food processing", "Customer", "Greenville", "SC", 2100, 720, "alex", "Customer", 1260, 96, "Southeast"],
  ["co-kestrel", "Kestrel Automation", "Industrial automation", "Customer", "Grand Rapids", "MI", 310, 74, "alex", "Customer", 640, 5, "Midwest"],
  ["co-ironbridge", "Ironbridge Robotics", "Robotics", "Prospect", "Pittsburgh", "PA", 180, 41, "alex", "Opportunity", 148, 9, "Northeast"],
  ["co-tallgrass", "Tallgrass Agri Systems", "Agricultural equipment", "Customer", "Des Moines", "IA", 520, 132, "dana", "Customer", 801, 14, "Midwest"],
  ["co-meridian", "Meridian Press Works", "Metal forming", "Customer", "Cleveland", "OH", 260, 58, "dana", "Customer", 1105, 21, "Midwest"],
  ["co-calloway", "Calloway Conveyors", "Material handling", "Prospect", "Louisville", "KY", 430, 96, "dana", "Opportunity", 96, 4, "Midwest"],
  ["co-stonehaven", "Stonehaven Medical Devices", "Medical devices", "Prospect", "Minneapolis", "MN", 890, 310, "alex", "Opportunity", 61, 6, "Midwest"],
  ["co-pinecrest", "Pinecrest Plastics", "Plastics machinery", "Customer", "Erie", "PA", 150, 33, "marcus", "Customer", 702, 33, "Northeast"],
  ["co-ardent", "Ardent Machine Tools", "Machine tools", "Customer", "Rockford", "IL", 340, 81, "dana", "Customer", 1340, 18, "Midwest"],
  ["co-lakeshore", "Lakeshore Controls", "Industrial distribution", "Distributor", "Chicago", "IL", 95, 48, "tom", "Customer", 1510, 7, "Midwest"],
  ["co-summit", "Summit Fluid Power", "Industrial distribution", "Distributor", "Denver", "CO", 70, 29, "tom", "Customer", 1190, 12, "West"],
  ["co-redfern", "Redfern Semiconductor Equipment", "Semiconductor equipment", "Prospect", "Austin", "TX", 1250, 540, "alex", "Lead", 22, 3, "South"],
  ["co-bluewater", "Bluewater Marine Systems", "Marine equipment", "Prospect", "Mobile", "AL", 210, 52, "marcus", "Lead", 35, 11, "Southeast"],
  ["co-harlow", "Harlow Test and Measurement", "Test equipment", "Customer", "Rochester", "NY", 380, 97, "alex", "Customer", 955, 26, "Northeast"],
  ["co-vantage", "Vantage Sortation", "Material handling", "Customer", "Memphis", "TN", 610, 164, "alex", "Customer", 488, 8, "South"],
  ["co-orchard", "Orchard Valley Beverages", "Beverage production", "Prospect", "Yakima", "WA", 290, 88, "marcus", "Lead", 12, 12, "West"],
  ["co-granite", "Granite State Fabrication", "Metal fabrication", "Customer", "Manchester", "NH", 85, 17, "marcus", "Customer", 566, 44, "Northeast"],
  ["co-copperline", "Copperline Wire and Cable", "Wire and cable", "Prospect", "Fort Wayne", "IN", 470, 121, "dana", "Opportunity", 83, 10, "Midwest"],
  ["co-prairie", "Prairie Wind Energy Services", "Energy services", "Prospect", "Wichita", "KS", 330, 79, "dana", "Lead", 40, 19, "Midwest"],
  ["co-easton", "Easton Lab Automation", "Laboratory automation", "Customer", "Worcester", "MA", 240, 66, "alex", "Customer", 377, 15, "Northeast"],
  ["co-delmar", "Delmar Printing Equipment", "Printing machinery", "Customer", "Dayton", "OH", 195, 39, "dana", "Customer", 1422, 52, "Midwest"],
  ["co-foxglove", "Foxglove Pharma Packaging", "Packaging machinery", "Prospect", "Raleigh", "NC", 560, 149, "alex", "Opportunity", 54, 2, "Southeast"],
  ["co-tricounty", "Tri-County Industrial Supply", "Industrial distribution", "Distributor", "Toledo", "OH", 45, 14, "tom", "Customer", 1688, 30, "Midwest"],
  ["co-windrow", "Windrow Baking Equipment", "Food machinery", "Customer", "Kansas City", "MO", 175, 36, "dana", "Customer", 623, 27, "Midwest"],
];

function domainOf(name: string): string {
  return `${name.toLowerCase().replace(/ and /g, "").replace(/[^a-z0-9]/g, "")}.example`;
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
  phone: `(555) 01${String(10 + i).padStart(2, "0")}-${String(1200 + i * 37).slice(0, 4)}`,
  ownerId,
  lifecycle,
  createdAt: `@-${created}d`,
  lastActivityAt: `@-${last}d`,
  territory,
}));

function company(id: string): Company {
  const c = companies.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown company in seed: ${id}`);
  return c;
}

company("co-brightwater").description =
  "Builds case packers and palletizers for food and consumer goods plants. Buys actuators and drives for new machines and for retrofit kits.";
company("co-brightwater").erp = { accountNumber: "BWP-10482", lastOrderDate: "@-23d", openBalance: 18460, creditStatus: "Good standing", creditLimit: 75000 };
company("co-corvale").description = "Regional food processor with four plants. Runs Halvorsen actuators on filling and sealing lines.";
company("co-corvale").erp = { accountNumber: "CVF-08817", lastOrderDate: "@-14mo", openBalance: 0, creditStatus: "Good standing", creditLimit: 120000 };
company("co-kestrel").erp = { accountNumber: "KES-11903", lastOrderDate: "@-47d", openBalance: 6210, creditStatus: "Good standing", creditLimit: 40000 };

type ContactSeed = [id: string, first: string, last: string, title: string, companyId: string, lifecycle: string, leadStatus: string, createdDaysAgo: number, lastDaysAgo: number];

const contactSeeds: ContactSeed[] = [
  ["ct-luis", "Luis", "Ortega", "Purchasing Manager", "co-brightwater", "Customer", "Connected", 910, 2],
  ["ct-hannah", "Hannah", "Weiss", "Lead Controls Engineer", "co-brightwater", "Customer", "Connected", 640, 6],
  ["ct-renee", "Renee", "Hallas", "Plant Manager", "co-corvale", "Customer", "Connected", 1255, 96],
  ["ct-victor", "Victor", "Dunn", "Maintenance Lead", "co-corvale", "Customer", "Attempted to contact", 880, 210],
  ["ct-maya", "Maya", "Okafor", "Buyer", "co-kestrel", "Customer", "Connected", 630, 5],
  ["ct-grant", "Grant", "Pullman", "Engineering Manager", "co-kestrel", "Customer", "Connected", 402, 47],
  ["ct-ines", "Ines", "Marchetti", "Director of Engineering", "co-ironbridge", "Opportunity", "In progress", 148, 9],
  ["ct-noah", "Noah", "Brandvold", "Operations Manager", "co-tallgrass", "Customer", "Connected", 800, 14],
  ["ct-carla", "Carla", "Jimenez", "Plant Engineer", "co-meridian", "Customer", "Connected", 1100, 21],
  ["ct-devon", "Devon", "Reilly", "Mechanical Design Lead", "co-calloway", "Opportunity", "In progress", 96, 4],
  ["ct-sofia", "Sofia", "Lindqvist", "Senior Sourcing Specialist", "co-stonehaven", "Opportunity", "In progress", 61, 6],
  ["ct-amit", "Amit", "Bhatt", "R&D Engineer", "co-stonehaven", "Lead", "Open", 44, 30],
  ["ct-beth", "Beth", "Kowalczyk", "Maintenance Planner", "co-pinecrest", "Customer", "Connected", 700, 33],
  ["ct-oscar", "Oscar", "Tennant", "Purchasing Agent", "co-ardent", "Customer", "Connected", 1338, 18],
  ["ct-jill", "Jill", "Navarro", "Inside Sales Manager", "co-lakeshore", "Customer", "Connected", 1500, 7],
  ["ct-raj", "Raj", "Sandhu", "Branch Manager", "co-summit", "Customer", "Connected", 1188, 12],
  ["ct-elena", "Elena", "Whitcombe", "Equipment Engineer", "co-redfern", "Lead", "New", 22, 3],
  ["ct-marco", "Marco", "DeLuca", "Project Manager", "co-bluewater", "Lead", "Attempted to contact", 35, 11],
  ["ct-tessa", "Tessa", "Arnold", "Procurement Lead", "co-harlow", "Customer", "Connected", 950, 26],
  ["ct-wes", "Wes", "Calder", "Controls Engineer", "co-vantage", "Customer", "Connected", 480, 8],
  ["ct-dale", "Dale", "Brandt", "Maintenance Manager", "co-orchard", "Lead", "New", 12, 12],
  ["ct-fiona", "Fiona", "Grady", "Owner", "co-granite", "Customer", "Connected", 560, 44],
  ["ct-henry", "Henry", "Osei", "Plant Engineering Manager", "co-copperline", "Opportunity", "In progress", 83, 10],
  ["ct-lena", "Lena", "Vogt", "Reliability Engineer", "co-prairie", "Lead", "Open", 40, 19],
  ["ct-paul", "Paul", "Ashby", "Automation Engineer", "co-easton", "Customer", "Connected", 370, 15],
  ["ct-nadia", "Nadia", "Farouk", "Buyer", "co-delmar", "Customer", "Connected", 1420, 52],
  ["ct-cole", "Cole", "Brennan", "VP Engineering", "co-foxglove", "Opportunity", "In progress", 54, 2],
  ["ct-ruth", "Ruth", "Halloran", "Counter Sales", "co-tricounty", "Customer", "Connected", 1680, 30],
  ["ct-ben", "Ben", "Yarrow", "Production Manager", "co-windrow", "Customer", "Connected", 620, 27],
];

const contacts: Contact[] = contactSeeds.map(([id, firstName, lastName, title, companyId, lifecycle, leadStatus, created, last], i) => ({
  id,
  firstName,
  lastName,
  email: `${firstName}.${lastName}@${company(companyId).domain}`.toLowerCase(),
  phone: `(555) 01${String(40 + i).padStart(2, "0")}-${String(2100 + i * 53).slice(0, 4)}`,
  title,
  companyId,
  ownerId: company(companyId).ownerId,
  lifecycle,
  leadStatus,
  createdAt: `@-${created}d`,
  lastActivityAt: `@-${last}d`,
  source: i % 3 === 0 ? "Organic search" : i % 3 === 1 ? "Trade show" : "Referral",
}));

type DealSeed = [id: string, name: string, companyId: string, contactId: string, stage: string, closeInDays: number, createdDaysAgo: number, type: string, lines: LineItem[]];

const dealSeeds: DealSeed[] = [
  ["dl-line4", "Brightwater Packaging: Line 4 retrofit", "co-brightwater", "ct-hannah", "qualified", 21, 9, "Existing business", [line("HM-LA60-300", 8), line("HM-SD12-48", 8)]],
  ["dl-line2", "Brightwater Packaging: Line 2 spares", "co-brightwater", "ct-luis", "qualified", 12, 6, "Existing business", [line("HM-LA60-200", 6), line("HM-SD12-48", 6), line("HM-CK-STD-5M", 6)]],
  ["dl-bw-palletizer", "Brightwater Packaging: Palletizer program 2026", "co-brightwater", "ct-hannah", "closed-won", -64, 150, "Existing business", [line("HM-LA80-300", 12), line("HM-SD20-48", 12), line("HM-MK80-TR", 12)]],
  ["dl-kestrel-cell5", "Kestrel Automation: Cell 5 build", "co-kestrel", "ct-grant", "closed-won", -47, 110, "Existing business", [line("HM-LA60-300", 6), line("HM-SD12-48", 6)]],
  ["dl-ironbridge", "Ironbridge Robotics: Gantry axis evaluation", "co-ironbridge", "ct-ines", "quote-sent", 18, 40, "New business", [line("HM-LA80-500", 4), line("HM-SD20-230", 4)]],
  ["dl-tallgrass", "Tallgrass Agri Systems: Planter actuator refresh", "co-tallgrass", "ct-noah", "negotiation", 9, 58, "Existing business", [line("HM-LA40-300", 40), line("HM-SD08-24", 40)]],
  ["dl-meridian", "Meridian Press Works: Press feed upgrade", "co-meridian", "ct-carla", "qualified", 34, 21, "Existing business", [line("HM-LA80-300", 6), line("HM-SD20-48", 6)]],
  ["dl-calloway", "Calloway Conveyors: Diverter prototype", "co-calloway", "ct-devon", "new-rfq", 45, 4, "New business", [line("HM-LA40-200", 10), line("HM-SD08-48", 10)]],
  ["dl-stonehaven", "Stonehaven Medical Devices: Assembly cell", "co-stonehaven", "ct-sofia", "quote-sent", 26, 33, "New business", [line("HM-LA40-100", 24), line("HM-SD08-24", 24), line("HM-CK-STD-5M", 24)]],
  ["dl-pinecrest", "Pinecrest Plastics: Replacement drives", "co-pinecrest", "ct-beth", "closed-won", -31, 52, "Existing business", [line("HM-SD12-230", 5)]],
  ["dl-ardent", "Ardent Machine Tools: Tool changer axis", "co-ardent", "ct-oscar", "negotiation", 6, 47, "Existing business", [line("HM-LA60-500", 10), line("HM-SD12-230", 10)]],
  ["dl-lakeshore", "Lakeshore Controls: Q1 stocking order", "co-lakeshore", "ct-jill", "quote-sent", 14, 16, "Existing business", [line("HM-SD08-48", 30), line("HM-SD12-48", 20), line("HM-CK-STD-5M", 50)]],
  ["dl-summit", "Summit Fluid Power: Demo inventory", "co-summit", "ct-raj", "qualified", 30, 12, "Existing business", [line("HM-LA40-200", 6), line("HM-SD08-24", 6)]],
  ["dl-redfern", "Redfern Semiconductor Equipment: Wafer handler axis", "co-redfern", "ct-elena", "new-rfq", 60, 3, "New business", [line("HM-LA40-100", 16), line("HM-SD08-48", 16)]],
  ["dl-harlow", "Harlow Test and Measurement: Fixture actuators", "co-harlow", "ct-tessa", "closed-lost", -18, 70, "Existing business", [line("HM-LA40-300", 8)]],
  ["dl-vantage", "Vantage Sortation: Sorter retrofit, phase 2", "co-vantage", "ct-wes", "negotiation", 11, 39, "Existing business", [line("HM-LA60-200", 24), line("HM-SD12-48", 24), line("HM-MK60-TR", 24)]],
  ["dl-copperline", "Copperline Wire and Cable: Spooler tension axis", "co-copperline", "ct-henry", "qualified", 38, 10, "New business", [line("HM-LA60-300", 4), line("HM-SD12-230", 4)]],
  ["dl-easton", "Easton Lab Automation: Plate handler", "co-easton", "ct-paul", "closed-won", -9, 45, "Existing business", [line("HM-LA40-100", 20), line("HM-SD08-24", 20)]],
  ["dl-foxglove", "Foxglove Pharma Packaging: Cartoner line", "co-foxglove", "ct-cole", "quote-sent", 20, 28, "New business", [line("HM-LA60-300-SS", 10), line("HM-SD12-48", 10), line("HM-CK-WD-5M", 10)]],
  ["dl-windrow", "Windrow Baking Equipment: Depositor rebuild", "co-windrow", "ct-ben", "new-rfq", 40, 7, "Existing business", [line("HM-LA60-300-SS", 3), line("HM-SD12-48", 3)]],
  ["dl-delmar", "Delmar Printing Equipment: Web guide spares", "co-delmar", "ct-nadia", "closed-won", -52, 80, "Existing business", [line("HM-LA40-200", 6)]],
  ["dl-granite", "Granite State Fabrication: Press brake backgauge", "co-granite", "ct-fiona", "closed-lost", -40, 90, "Existing business", [line("HM-LA60-500", 2), line("HM-SD12-230", 2)]],
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
const line4 = deals.find((d) => d.id === "dl-line4")!;
line4.lineItems = [];
line4.amount = 30000;
line4.lastActivityAt = "@-1d";

function deal(id: string): Deal {
  const d = deals.find((x) => x.id === id);
  if (!d) throw new Error(`Unknown deal in seed: ${id}`);
  return d;
}

type QuoteSeed = [id: string, number: string, dealId: string, status: Quote["status"], discountPct: number, createdDaysAgo: number];

const quoteSeeds: QuoteSeed[] = [
  ["q-1042", "Q-1042", "dl-line2", "Draft", 0, 1],
  ["q-1041", "Q-1041", "dl-foxglove", "Sent", 5, 3],
  ["q-1040", "Q-1040", "dl-lakeshore", "Sent", 8, 5],
  ["q-1039", "Q-1039", "dl-ironbridge", "Sent", 0, 8],
  ["q-1038", "Q-1038", "dl-stonehaven", "Sent", 4, 11],
  ["q-1037", "Q-1037", "dl-easton", "Accepted", 5, 16],
  ["q-1036", "Q-1036", "dl-vantage", "Sent", 10, 14],
  ["q-1035", "Q-1035", "dl-bw-palletizer", "Accepted", 6, 78],
  ["q-1034", "Q-1034", "dl-kestrel-cell5", "Accepted", 0, 55],
  ["q-1033", "Q-1033", "dl-ardent", "Sent", 7, 19],
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
    ownerId: d.ownerId ?? "alex",
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
  { id: "tk-1", title: "Send revised drawings to Hannah Weiss", type: "Email", priority: "High", dueAt: "@+0d", ownerId: "alex", status: "open", contactId: "ct-hannah", companyId: "co-brightwater", dealId: "dl-line4" },
  { id: "tk-2", title: "Follow up on Q-1041 with Cole Brennan", type: "Call", priority: "High", dueAt: "@+1d", ownerId: "alex", status: "open", contactId: "ct-cole", companyId: "co-foxglove", dealId: "dl-foxglove" },
  { id: "tk-3", title: "Confirm sample shipment for Ironbridge", type: "To-do", priority: "Medium", dueAt: "@+2d", ownerId: "alex", status: "open", contactId: "ct-ines", companyId: "co-ironbridge", dealId: "dl-ironbridge" },
  { id: "tk-4", title: "Quarterly review with Vantage Sortation", type: "Call", priority: "Medium", dueAt: "@+4d", ownerId: "alex", status: "open", contactId: "ct-wes", companyId: "co-vantage" },
  { id: "tk-5", title: "Send credit application to Redfern", type: "Email", priority: "Low", dueAt: "@+6d", ownerId: "alex", status: "open", contactId: "ct-elena", companyId: "co-redfern" },
  { id: "tk-6", title: "Call Noah Brandvold about delivery schedule", type: "Call", priority: "High", dueAt: "@+0d", ownerId: "dana", status: "open", contactId: "ct-noah", companyId: "co-tallgrass", dealId: "dl-tallgrass" },
  { id: "tk-7", title: "Send distributor price sheet to Calloway", type: "Email", priority: "Medium", dueAt: "@+1d", ownerId: "dana", status: "open", contactId: "ct-devon", companyId: "co-calloway" },
  { id: "tk-8", title: "Check stock for Ardent tool changer order", type: "To-do", priority: "Medium", dueAt: "@+3d", ownerId: "dana", status: "open", contactId: "ct-oscar", companyId: "co-ardent", dealId: "dl-ardent" },
  { id: "tk-9", title: "Review Q1 forecast with the team", type: "To-do", priority: "Medium", dueAt: "@+2d", ownerId: "priya", status: "open" },
  { id: "tk-10", title: "Email Beth Kowalczyk about drive firmware", type: "Email", priority: "Low", dueAt: "@+5d", ownerId: "marcus", status: "open", contactId: "ct-beth", companyId: "co-pinecrest" },
];

const activities: Activity[] = [
  // Brightwater Packaging and its Line 4 retrofit deal: the chained hero records.
  { id: "ac-1", at: "@-1d", type: "call", title: "Call with Hannah Weiss", body: "Line 4 moves to washdown duty in the spring. Needs eight axes, 300 mm stroke, around 2 kN. Wants a quote this week.", byId: "alex", contactIds: ["ct-hannah"], companyIds: ["co-brightwater"], dealIds: ["dl-line4"] },
  { id: "ac-2", at: "@-2d", type: "email", title: "Email from Hannah Weiss: Line 4 requirements", body: "Attached is the duty cycle for the Line 4 infeed. Supply on that line is 48 VDC. We need parts on the dock within four weeks of the PO.", byId: null, contactIds: ["ct-hannah"], companyIds: ["co-brightwater"], dealIds: ["dl-line4"] },
  { id: "ac-3", at: "@-6d", type: "meeting", title: "Meeting: Line 4 retrofit kickoff", body: "Walked the line with Hannah and Luis. Existing pneumatic cylinders are being replaced axis for axis.", byId: "alex", contactIds: ["ct-hannah", "ct-luis"], companyIds: ["co-brightwater"], dealIds: ["dl-line4"] },
  { id: "ac-4", at: "@-9d", type: "deal", title: "Deal created", body: "Brightwater Packaging: Line 4 retrofit was created in New RFQ.", byId: "alex", companyIds: ["co-brightwater"], dealIds: ["dl-line4"] },
  { id: "ac-5", at: "@-1d", type: "quote", title: "Quote Q-1042 created", body: "Draft quote for Line 2 spares.", byId: "alex", contactIds: ["ct-luis"], companyIds: ["co-brightwater"], dealIds: ["dl-line2"], linkPath: "/quotes/q-1042", linkLabel: "View quote" },
  { id: "ac-6", at: "@-4d", type: "email", title: "Email from Luis Ortega: spares for Line 2", body: "Can you quote six sets of the frame 60 actuators and drives we use on Line 2? Budget is tight this quarter, so sharpen the pencil.", byId: null, contactIds: ["ct-luis"], companyIds: ["co-brightwater"], dealIds: ["dl-line2"] },
  { id: "ac-7", at: "@-23d", type: "sync", title: "Order SO-48213 shipped", body: "Synced from the ERP: 3 line items, $21,840.00.", byId: null, companyIds: ["co-brightwater"] },
  { id: "ac-8", at: "@-64d", type: "deal", title: "Deal closed won", body: "Brightwater Packaging: Palletizer program 2026 moved to Closed won.", byId: "alex", companyIds: ["co-brightwater"], dealIds: ["dl-bw-palletizer"] },
  { id: "ac-9", at: "@-70d", type: "note", title: "Note", body: "Luis prefers quotes by email with the PDF attached. Hannah signs off on anything technical.", byId: "alex", contactIds: ["ct-luis"], companyIds: ["co-brightwater"] },
  // Corvale Foods: the AI prospecting hero.
  { id: "ac-20", at: "@-96d", type: "email", title: "Email to Renee Hallas: checking in", body: "Sent the updated washdown catalogue. No reply.", byId: "alex", contactIds: ["ct-renee"], companyIds: ["co-corvale"] },
  { id: "ac-21", at: "@-210d", type: "call", title: "Call with Victor Dunn", body: "Left a voicemail about the service bulletin for frame 60 seals.", byId: "alex", contactIds: ["ct-victor"], companyIds: ["co-corvale"] },
  { id: "ac-22", at: "@-14mo", type: "sync", title: "Order SO-39120 shipped", body: "Synced from the ERP: 24 actuators and drives for the Spartanburg plant, $61,300.00.", byId: null, companyIds: ["co-corvale"] },
  // Kestrel Automation.
  { id: "ac-30", at: "@-5d", type: "call", title: "Call with Maya Okafor", body: "Cell 7 is approved. RFQ to follow by email.", byId: "alex", contactIds: ["ct-maya"], companyIds: ["co-kestrel"] },
  { id: "ac-31", at: "@-47d", type: "deal", title: "Deal closed won", body: "Kestrel Automation: Cell 5 build moved to Closed won.", byId: "alex", contactIds: ["ct-grant"], companyIds: ["co-kestrel"], dealIds: ["dl-kestrel-cell5"] },
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
    body: d ? `Talked through ${d.name.split(": ")[1].toLowerCase()} and next steps.` : `Introduced the ${co.industry.toLowerCase()} application notes and asked about upcoming projects.`,
    byId: c.ownerId,
    ...ids,
  });
  if (d) {
    activities.push({ id: `ac-g${i}b`, at: d.createdAt, type: "deal", title: "Deal created", body: `${d.name} was created.`, byId: d.ownerId, ...ids });
  }
  activities.push({ id: `ac-g${i}c`, at: c.createdAt, type: "lifecycle", title: "Contact created", body: `${c.firstName} ${c.lastName} was created from ${c.source?.toLowerCase() ?? "an import"}.`, byId: null, contactIds: [c.id], companyIds: [co.id] });
});

export const manufacturingPack: Pack = {
  vertical: { id: "manufacturing", name: "Manufacturing" },
  portal: { company: "Halvorsen Motion", domain: "halvorsenmotion.example", hubId: "48213307", currency: "USD" },
  personas: [
    { id: "alex", name: "Alex Morgan", title: "Account Executive", email: "alex.morgan@halvorsenmotion.example", viewAs: "Rep", color: "#0b6e6e" },
    { id: "priya", name: "Priya Nair", title: "Sales Director", email: "priya.nair@halvorsenmotion.example", viewAs: "Sales Director", color: "#8a3ffc" },
    { id: "dana", name: "Dana Ruiz", title: "Territory Sales Rep, Midwest", email: "dana.ruiz@halvorsenmotion.example", viewAs: "Dana, territory rep", color: "#b8500a" },
    { id: "marcus", name: "Marcus Lee", title: "Inside Sales Rep", email: "marcus.lee@halvorsenmotion.example", viewAs: "Marcus, inside sales", color: "#1565c0" },
    { id: "tom", name: "Tom Becker", title: "Channel Manager", email: "tom.becker@halvorsenmotion.example", viewAs: "Tom, channel manager", color: "#5d6b2f" },
  ],
  defaultPersonaId: "alex",
  terms: { quote: "Quote", product: "Product", backOffice: "ERP" },
  stages: [
    { id: "new-rfq", label: "New RFQ", probability: 10 },
    { id: "qualified", label: "Qualified", probability: 30 },
    { id: "quote-sent", label: "Quote sent", probability: 60 },
    { id: "negotiation", label: "Negotiation", probability: 80 },
    { id: "closed-won", label: "Closed won", probability: 100, closed: "won" },
    { id: "closed-lost", label: "Closed lost", probability: 0, closed: "lost" },
  ],
  companies,
  contacts,
  deals,
  products,
  quotes,
  tasks,
  notifications: [
    { id: "nt-1", personaId: "alex", at: "@-2d", kind: "mention", title: "Priya Nair mentioned you", body: "On Vantage Sortation: Sorter retrofit, phase 2: \"Good progress. Keep the discount at 10%.\"", path: "/deals/dl-vantage", read: true },
    { id: "nt-2", personaId: "alex", at: "@-3d", kind: "task", title: "Task due today", body: "Send revised drawings to Hannah Weiss", path: "/tasks", read: true },
    { id: "nt-3", personaId: "priya", at: "@-5d", kind: "approved", title: "You approved a discount", body: "Q-1036 for Vantage Sortation, 10% discount.", path: "/quotes/q-1036", read: true },
    { id: "nt-4", personaId: "dana", at: "@-1d", kind: "task", title: "Task due today", body: "Call Noah Brandvold about delivery schedule", path: "/tasks", read: true },
  ],
  activities,
  threads,
  workflows: [
    {
      id: "wf-rfq-routing",
      name: "RFQ lead routing",
      object: "Contact",
      status: "On",
      enrolled: 1284,
      createdAt: "@-410d",
      updatedAt: "@-12d",
      description: "Scores every Request a quote submission and routes it by territory, product line, and fit.",
      trunk: [
        { id: "n-trigger", kind: "trigger", label: "Contact enrollment trigger", detail: "Form submission: Request a quote" },
        { id: "n-enrich", kind: "action", label: "Enrich company", detail: "Fill industry, size, revenue, and location" },
        { id: "n-score", kind: "action", label: "Update lead score", detail: "Fit and engagement score, 0 to 100" },
        { id: "n-route", kind: "action", label: "Route by territory and product line", detail: "Custom action: looks up the owner in the territory table", extId: "territory-routing" },
        { id: "n-branch", kind: "branch", label: "Branch on routing result" },
      ],
      branches: [
        {
          id: "field",
          label: "Field territory rep",
          rule: "Score 70 or more, direct account",
          nodes: [
            { id: "f-owner", kind: "action", label: "Set contact owner", detail: "Territory rep from the routing result" },
            { id: "f-deal", kind: "action", label: "Create deal", detail: "Pipeline: Sales. Stage: New RFQ" },
            { id: "f-task", kind: "action", label: "Create task", detail: "Call within 1 hour. High priority" },
            { id: "f-alert", kind: "action", label: "Send Slack notification", detail: "Territory channel, with score and reasons" },
          ],
        },
        {
          id: "inside",
          label: "Inside sales",
          rule: "Score 40 to 69",
          nodes: [
            { id: "i-owner", kind: "action", label: "Rotate contact owner", detail: "Inside sales team" },
            { id: "i-deal", kind: "action", label: "Create deal", detail: "Pipeline: Sales. Stage: New RFQ" },
            { id: "i-task", kind: "action", label: "Create task", detail: "Email today. Medium priority" },
            { id: "i-alert", kind: "action", label: "Send Slack notification", detail: "#inside-sales" },
          ],
        },
        {
          id: "channel",
          label: "Channel manager",
          rule: "Company type is Distributor",
          nodes: [
            { id: "c-owner", kind: "action", label: "Set contact owner", detail: "Channel manager" },
            { id: "c-task", kind: "action", label: "Create task", detail: "Review distributor inquiry" },
          ],
        },
        {
          id: "nurture",
          label: "Nurture",
          rule: "Score under 40",
          nodes: [
            { id: "u-stage", kind: "action", label: "Set lifecycle stage", detail: "Subscriber" },
            { id: "u-seq", kind: "action", label: "Enroll in workflow", detail: "Engineering newsletter nurture" },
          ],
        },
      ],
    },
    { id: "wf-quote-followup", name: "Quote follow-up reminders", object: "Deal", status: "On", enrolled: 342, createdAt: "@-300d", updatedAt: "@-40d", description: "Creates a follow-up task three days after a quote is sent." },
    { id: "wf-nurture", name: "Engineering newsletter nurture", object: "Contact", status: "On", enrolled: 5120, createdAt: "@-620d", updatedAt: "@-75d", description: "Monthly application notes for contacts who are not sales-ready." },
    { id: "wf-renewal", name: "Service contract renewal notice", object: "Deal", status: "On", enrolled: 96, createdAt: "@-250d", updatedAt: "@-110d", description: "Notifies the owner 60 days before a service contract ends." },
    { id: "wf-distributor", name: "Distributor onboarding", object: "Company", status: "Off", enrolled: 14, createdAt: "@-500d", updatedAt: "@-190d", description: "Welcome sequence and price sheet for new distributors." },
  ],
  signals: [
    { id: "sg-corvale", companyId: "co-corvale", title: "Reorder gap and a new plant", source: "ERP order history and company news", at: "@-1d", strength: "High", summary: "14 months since the last order against a 9-month average. New plant announced in Greenville.", hero: true },
    { id: "sg-vantage", companyId: "co-vantage", title: "Pricing page visits", source: "Website activity", at: "@-2d", strength: "Medium", summary: "Three contacts viewed drive pricing this week." },
    { id: "sg-foxglove", companyId: "co-foxglove", title: "Quote viewed four times", source: "Quote activity", at: "@-2d", strength: "Medium", summary: "Q-1041 was opened by two new viewers." },
    { id: "sg-tallgrass", companyId: "co-tallgrass", title: "Hiring controls engineers", source: "Company news", at: "@-4d", strength: "Medium", summary: "Four open roles mention servo retrofits." },
    { id: "sg-harlow", companyId: "co-harlow", title: "Reorder gap", source: "ERP order history", at: "@-6d", strength: "Medium", summary: "11 months since the last order against an 8-month average." },
    { id: "sg-meridian", companyId: "co-meridian", title: "Trade show booth scan", source: "Event attendance", at: "@-8d", strength: "Medium", summary: "Two engineers stopped by the booth at the Midwest Automation Show." },
  ],
  quoteTerms: [
    "Prices in US dollars, valid for 30 days from the quote date.",
    "Payment terms: net 30 from invoice date, subject to credit approval.",
    "Lead times are from receipt of order and are confirmed at order acknowledgment.",
    "Freight: FCA Halvorsen Motion, Minneapolis, MN.",
  ],
  extensions,
  demos,
};
