import type { Activity, Company, Contact, Deal, LineItem, Pack, Product, Quote, Task } from "../types";
import { demos } from "./demos";
import { extensions } from "./extensions";
import { threads } from "./inbox";

// AEC pack: Meridian Civil & Builders — commercial general contractor & civil infrastructure firm.
// Every company, project, person, and figure here is 100% fictional sample data.
// Email and web addresses use the reserved ".example" domain and 555-01xx phone numbers.

const COST_RATIO = 0.76;

function product(sku: string, name: string, family: string, price: number, leadDays: number, onHand: number): Product {
  return { sku, name, family, price, cost: Math.round(price * COST_RATIO), leadDays, onHand };
}

export const products: Product[] = [
  product("MCB-D02-CIV", "Div 02/31 — Heavy Civil Sitework, Grading & Utilities (per 1k sq ft)", "Sitework & Civil", 11000, 24, 6),
  product("MCB-D02-COM", "Div 02/31 — Commercial Pad Grading & Utilities (per 1k sq ft)", "Sitework & Civil", 8500, 18, 8),
  product("MCB-D02-PAVE", "Div 32 — Heavy-Duty Asphalt Paving & Curbing (per 1k sq ft)", "Sitework & Civil", 9200, 14, 12),
  product("MCB-D33-STORM", "Div 33 — 36-in RCP Storm Culvert & Detention Outfall (per 100 LF)", "Sitework & Civil", 18500, 16, 10),
  product("MCB-D03-SLAB", "Div 03 — 8-in Reinforced Industrial Concrete Slab (per 1k sq ft)", "Concrete & Structural", 14200, 14, 9),
  product("MCB-D03-PRC", "Div 03 — Precast Concrete Tilt-Up Superstructure (per 1k sq ft)", "Concrete & Structural", 26880, 35, 4),
  product("MCB-D05-STL", "Div 05 — Structural Steel Wide-Flange Superstructure (per 1k sq ft)", "Concrete & Structural", 24000, 28, 7),
  product("MCB-D05-MEZZ", "Div 05 — Structural Steel Mezzanine Framing (per ton)", "Concrete & Structural", 4600, 21, 18),
  product("MCB-D06-TMB", "Div 06 — Hybrid Mass Timber & Glulam Frame (per 1k sq ft)", "Concrete & Structural", 29760, 49, 2),
  product("MCB-D08-DOCK", "Div 08 — Hydraulic Dock Leveler & Pit Assembly (CSI 08 36 13)", "Doors & Specialty", 7400, 14, 14),
  product("MCB-D08-ROLL", "Div 08 — Commercial Sectional Overhead Door, 10x12 (CSI 08 36 13)", "Doors & Specialty", 3850, 10, 22),
  product("MCB-D26-STD", "Div 22/23/26 — Standard Commercial MEP Package (per 1k sq ft)", "MEP & Controls", 16000, 21, 8),
  product("MCB-D26-EVH", "Div 22/23/26 — 480V EV Fleet & High-Bay MEP Package (per 1k sq ft)", "MEP & Controls", 21600, 35, 4),
  product("MCB-D26-MCR", "Div 22/23/26 — N+1 Mission-Critical Redundant MEP (per 1k sq ft)", "MEP & Controls", 24800, 49, 2),
  product("MCB-D26-YARD", "Div 26 — High-Mast LED Yard Lighting & 480V Switchgear Package", "MEP & Controls", 28500, 21, 5),
  product("MCB-D26-EVFEED", "Div 26 — 480V EV Charging Feeder, Conduit & Subpanel", "MEP & Controls", 14800, 14, 6),
  product("MCB-D23-RTU", "Div 23 — High-Bay Rooftop HVAC Unit & BAS Commissioning", "MEP & Controls", 34000, 28, 3),
  product("MCB-D26-GEN", "Div 26 — 500 kW Standby Diesel Generator & ATS Package", "MEP & Controls", 118000, 56, 0),
  product("MCB-D01-PRECON", "Div 01 — Preconstruction, Bonding & General Conditions (GMP)", "General Conditions", 156600, 14, 10),
  product("MCB-D01-MOB", "Div 01 — Site Mobilization, SWPPP & Traffic Control", "General Conditions", 24500, 7, 15),
];

function line(sku: string, qty: number, unitPrice?: number): LineItem {
  const p = products.find((x) => x.sku === sku);
  if (!p) throw new Error(`Unknown SKU in AEC seed: ${sku}`);
  return { sku, name: p.name, qty, unitPrice: unitPrice ?? p.price, unitCost: p.cost, leadDays: p.leadDays };
}

function total(lines: LineItem[]): number {
  return lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0);
}

type CompanySeed = [id: string, name: string, industry: string, type: string, city: string, state: string, employees: number, revenueM: number, ownerId: string, lifecycle: string, createdDaysAgo: number, lastDaysAgo: number, territory: string];

const companySeeds: CompanySeed[] = [
  ["co-redrock", "Redrock Transit Authority", "Municipal transit", "Customer", "Denver", "CO", 1850, 420, "elena", "Customer", 880, 1, "Front Range · Civil"],
  ["co-summit-logistics", "Summit Valley Logistics", "Industrial development", "Customer", "Commerce City", "CO", 310, 265, "elena", "Customer", 1120, 2, "Front Range · Commercial"],
  ["co-clearwater-dev", "Clearwater Civic Developers", "Civic & commercial development", "Customer", "Centennial", "CO", 240, 390, "elena", "Customer", 740, 18, "Front Range · Commercial"],
  ["co-frontrange", "Front Range Logistics Partners", "Industrial real estate", "Customer", "Aurora", "CO", 190, 180, "elena", "Customer", 620, 4, "Front Range · Commercial"],
  ["co-mesa-municipal", "Mesa County Water & Drainage District", "Municipal utilities", "Prospect", "Grand Junction", "CO", 420, 145, "nadia", "Opportunity", 92, 3, "Western Slope · Civil"],
  ["co-highplains", "High Plains Regional Health", "Healthcare facilities", "Customer", "Fort Collins", "CO", 3200, 890, "caleb", "Customer", 960, 5, "Front Range · Commercial"],
  ["co-ironwood", "Ironwood Industrial Properties", "Cold-storage development", "Prospect", "Loveland", "CO", 145, 130, "caleb", "Opportunity", 64, 2, "Front Range · Commercial"],
  ["co-pikes", "Pikes Peak Civic Infrastructure", "Municipal public works", "Customer", "Colorado Springs", "CO", 680, 210, "nadia", "Customer", 830, 7, "Front Range · Civil"],
  ["co-silverline", "Silverline Cold Chain", "Distribution & logistics", "Prospect", "Brighton", "CO", 410, 225, "caleb", "Opportunity", 45, 4, "Front Range · Commercial"],
  ["co-wasatch", "Wasatch Aviation Campus", "Airport & hangar facilities", "Customer", "Salt Lake City", "UT", 520, 310, "elena", "Customer", 1040, 9, "Mountain West · Civil"],
  ["co-arapahoe-ed", "Arapahoe Technical Institute", "Higher education", "Prospect", "Englewood", "CO", 760, 165, "caleb", "Opportunity", 110, 8, "Front Range · Commercial"],
  ["co-timberline", "Timberline Hospitality Group", "Commercial hospitality", "Customer", "Golden", "CO", 290, 92, "rachel", "Customer", 590, 14, "Front Range · Commercial"],
  ["co-cheyenne-dot", "Cheyenne Corridor Mobility Authority", "Transportation infrastructure", "Prospect", "Cheyenne", "WY", 380, 175, "nadia", "Lead", 29, 6, "Mountain West · Civil"],
  ["co-flatiron-bio", "Flatiron Life Sciences Park", "Biotech & lab facilities", "Prospect", "Louisville", "CO", 215, 195, "caleb", "Opportunity", 52, 5, "Front Range · Commercial"],
  ["co-bighorn-water", "Bighorn Basin Water Conservancy", "Water infrastructure", "Customer", "Casper", "WY", 160, 74, "nadia", "Customer", 780, 21, "Mountain West · Civil"],
  ["co-sandstone", "Sandstone Retail Centers", "Commercial retail", "Customer", "Pueblo", "CO", 130, 88, "rachel", "Customer", 670, 16, "Front Range · Commercial"],
  ["co-cache-valley", "Cache Valley Food Processing", "Industrial manufacturing", "Prospect", "Ogden", "UT", 490, 240, "elena", "Lead", 34, 11, "Mountain West · Commercial"],
  ["co-redmesa-energy", "Red Mesa Grid & Substation Partners", "Energy infrastructure", "Prospect", "Greeley", "CO", 275, 160, "nadia", "Opportunity", 77, 6, "Front Range · Civil"],
];

function domainOf(name: string): string {
  return `${name.toLowerCase().replace(/ and | & /g, "").replace(/[^a-z0-9]/g, "")}.example`;
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
  phone: `(555) 01${String(14 + i).padStart(2, "0")}-${String(2400 + i * 41).slice(0, 4)}`,
  ownerId,
  lifecycle,
  createdAt: `@-${created}d`,
  lastActivityAt: `@-${last}d`,
  territory,
}));

function company(id: string): Company {
  const c = companies.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown company in AEC seed: ${id}`);
  return c;
}

company("co-redrock").description =
  "Regional public transit authority operating 14 bus and rail maintenance facilities across the Denver metro. Standardizes on CM-at-Risk delivery for fleet electrification depots.";
company("co-redrock").erp = { accountNumber: "PRJ-4102-RRT", lastOrderDate: "@-42d", openBalance: 64_200, creditStatus: "Bonded · Good standing", creditLimit: 900_000 };

company("co-summit-logistics").description =
  "Repeat commercial warehouse and cross-dock developer along the I-70 corridor. Runs an active Master Services Agreement with Meridian tracked in Procore & Sage Intacct.";
company("co-summit-logistics").erp = { accountNumber: "PRJ-4410-SVL", lastOrderDate: "@-19d", openBalance: 148_500, creditStatus: "Bonded · Good standing", creditLimit: 750_000 };

company("co-clearwater-dev").description =
  "Civic and healthcare real estate developer delivering municipal annexes and outpatient medical campuses. Meridian delivered Clearwater's Tech Center parking structure in 2024.";
company("co-clearwater-dev").erp = { accountNumber: "PRJ-3890-CWD", lastOrderDate: "@-11mo", openBalance: 0, creditStatus: "Bonded · Good standing", creditLimit: 1_200_000 };

company("co-frontrange").description =
  "Industrial logistics developer with four active distribution parks in Aurora and Commerce City.";
company("co-frontrange").erp = { accountNumber: "PRJ-4215-FRL", lastOrderDate: "@-55d", openBalance: 28_400, creditStatus: "Bonded · Good standing", creditLimit: 600_000 };

type ContactSeed = [id: string, first: string, last: string, title: string, companyId: string, lifecycle: string, leadStatus: string, createdDaysAgo: number, lastDaysAgo: number];

const contactSeeds: ContactSeed[] = [
  ["ct-marisol", "Marisol", "Delgado", "Capital Projects Director", "co-redrock", "Customer", "Connected", 875, 1],
  ["ct-kenneth", "Kenneth", "Pruitt", "Facilities Engineering Manager", "co-redrock", "Customer", "Connected", 710, 5],
  ["ct-graham", "Graham", "Becker", "VP Real Estate & Construction", "co-summit-logistics", "Customer", "Connected", 1110, 2],
  ["ct-sharon", "Sharon", "Villarreal", "Senior Project Manager", "co-summit-logistics", "Customer", "Connected", 640, 8],
  ["ct-claire", "Claire", "Hendricks", "VP of Capital Development", "co-clearwater-dev", "Customer", "Connected", 735, 18],
  ["ct-martin", "Martin", "Salazar", "Director of Construction Management", "co-clearwater-dev", "Customer", "Connected", 680, 45],
  ["ct-owen", "Owen", "Whitaker", "Senior Owner's Representative", "co-frontrange", "Customer", "Connected", 615, 4],
  ["ct-priya-s", "Priya", "Subramanian", "District Civil Engineer", "co-mesa-municipal", "Opportunity", "In progress", 90, 3],
  ["ct-trevor", "Trevor", "Callahan", "VP Facilities Planning", "co-highplains", "Customer", "Connected", 950, 5],
  ["ct-lydia", "Lydia", "Chu", "Director of Development", "co-ironwood", "Opportunity", "In progress", 64, 2],
  ["ct-gavin", "Gavin", "Morales", "Deputy City Engineer", "co-pikes", "Customer", "Connected", 825, 7],
  ["ct-hannah-o", "Hannah", "O'Connor", "Director of Capital Projects", "co-silverline", "Opportunity", "In progress", 45, 4],
  ["ct-darius", "Darius", "Kimball", "Airfield Construction Director", "co-wasatch", "Customer", "Connected", 1030, 9],
  ["ct-miriam", "Miriam", "Katz", "Campus Architect", "co-arapahoe-ed", "Opportunity", "In progress", 108, 8],
  ["ct-victor-r", "Victor", "Ramos", "VP Asset Management", "co-timberline", "Customer", "Connected", 585, 14],
  ["ct-colleen", "Colleen", "Dempsey", "Corridor Program Engineer", "co-cheyenne-dot", "Lead", "New", 29, 6],
  ["ct-arthur", "Arthur", "Pendleton", "Director of Lab Facilities", "co-flatiron-bio", "Opportunity", "In progress", 52, 5],
  ["ct-diane", "Diane", "Sorenson", "Chief Engineer", "co-bighorn-water", "Customer", "Connected", 775, 21],
  ["ct-roger", "Roger", "Castaneda", "Construction Director", "co-sandstone", "Customer", "Connected", 665, 16],
  ["ct-naomi", "Naomi", "Fletcher", "Plant Expansion Lead", "co-cache-valley", "Lead", "New", 34, 11],
  ["ct-evan", "Evan", "Kowalewski", "Substation Project Manager", "co-redmesa-energy", "Opportunity", "In progress", 77, 6],
];

const contacts: Contact[] = contactSeeds.map(([id, firstName, lastName, title, companyId, lifecycle, leadStatus, created, last], i) => ({
  id,
  firstName,
  lastName,
  email: `${firstName}.${lastName}@${company(companyId).domain}`.toLowerCase(),
  phone: `(555) 01${String(42 + i).padStart(2, "0")}-${String(3300 + i * 57).slice(0, 4)}`,
  title,
  companyId,
  ownerId: company(companyId).ownerId,
  lifecycle,
  leadStatus,
  createdAt: `@-${created}d`,
  lastActivityAt: `@-${last}d`,
  source: i % 3 === 0 ? "Municipal RFP portal" : i % 3 === 1 ? "Architect referral" : "Owner repeat business",
}));

type DealSeed = [id: string, name: string, companyId: string, contactId: string, stage: string, closeInDays: number, createdDaysAgo: number, type: string, lines: LineItem[]];

const dealSeeds: DealSeed[] = [
  ["dl-redrock-civic", "Redrock Transit Authority: Bus Maintenance & Ops Facility", "co-redrock", "ct-marisol", "qualified", 28, 11, "CM at Risk (GMP)", []],
  [
    "dl-redrock-yard",
    "Redrock Transit Authority: South Yard Paving & Drainage Upgrade",
    "co-redrock",
    "ct-marisol",
    "qualified",
    16,
    8,
    "Existing business",
    [line("MCB-D02-PAVE", 24), line("MCB-D33-STORM", 8), line("MCB-D26-YARD", 4)],
  ],
  [
    "dl-summit-bldg-b",
    "Summit Valley Logistics: Building B Core & Shell",
    "co-summit-logistics",
    "ct-graham",
    "closed-won",
    -84,
    180,
    "CM at Risk (GMP)",
    [line("MCB-D02-CIV", 40), line("MCB-D05-STL", 35), line("MCB-D01-PRECON", 1)],
  ],
  [
    "dl-highplains-wing",
    "High Plains Regional Health: Outpatient Imaging Wing",
    "co-highplains",
    "ct-trevor",
    "quote-sent",
    22,
    38,
    "CM at Risk (GMP)",
    [line("MCB-D02-COM", 30), line("MCB-D05-STL", 30), line("MCB-D26-MCR", 30), line("MCB-D01-PRECON", 1)],
  ],
  [
    "dl-ironwood-cold",
    "Ironwood Industrial: Loveland Cold-Storage Shell",
    "co-ironwood",
    "ct-lydia",
    "negotiation",
    12,
    46,
    "New bid",
    [line("MCB-D02-CIV", 55), line("MCB-D03-PRC", 55), line("MCB-D08-DOCK", 16)],
  ],
  [
    "dl-pikes-storm",
    "Pikes Peak Civic: East Corridor Stormwater Detention",
    "co-pikes",
    "ct-gavin",
    "closed-won",
    -35,
    120,
    "Municipal bid",
    [line("MCB-D33-STORM", 14), line("MCB-D02-PAVE", 12), line("MCB-D01-MOB", 2)],
  ],
  [
    "dl-silverline-hub",
    "Silverline Cold Chain: Brighton Distribution Hub",
    "co-silverline",
    "ct-hannah-o",
    "quote-sent",
    19,
    31,
    "New bid",
    [line("MCB-D02-CIV", 40), line("MCB-D03-SLAB", 40), line("MCB-D26-EVH", 40)],
  ],
  [
    "dl-wasatch-hangar",
    "Wasatch Aviation: Maintenance Hangar #4 Apron & Steel",
    "co-wasatch",
    "ct-darius",
    "negotiation",
    10,
    54,
    "Existing business",
    [line("MCB-D02-PAVE", 32), line("MCB-D05-STL", 28), line("MCB-D26-GEN", 1)],
  ],
  [
    "dl-arapahoe-lab",
    "Arapahoe Technical Institute: Engineering Trades Annex",
    "co-arapahoe-ed",
    "ct-miriam",
    "qualified",
    35,
    24,
    "CM at Risk (GMP)",
    [line("MCB-D06-TMB", 25), line("MCB-D26-STD", 25)],
  ],
  [
    "dl-flatiron-clean",
    "Flatiron Life Sciences: Lab Building C Core & MEP",
    "co-flatiron-bio",
    "ct-arthur",
    "quote-sent",
    25,
    40,
    "CM at Risk (GMP)",
    [line("MCB-D05-STL", 35), line("MCB-D26-MCR", 35), line("MCB-D01-PRECON", 1)],
  ],
  [
    "dl-redmesa-sub",
    "Red Mesa Grid: Weld County Substation Site Civil",
    "co-redmesa-energy",
    "ct-evan",
    "new-rfq",
    42,
    14,
    "Municipal bid",
    [line("MCB-D02-CIV", 25), line("MCB-D03-SLAB", 10), line("MCB-D26-YARD", 3)],
  ],
  [
    "dl-bighorn-intake",
    "Bighorn Basin Water: Intake Pump Station Rehab",
    "co-bighorn-water",
    "ct-diane",
    "closed-won",
    -48,
    115,
    "Municipal bid",
    [line("MCB-D33-STORM", 12), line("MCB-D26-GEN", 1), line("MCB-D01-MOB", 2)],
  ],
  [
    "dl-timberline-ti",
    "Timberline Hospitality: Conference Wing Mezzanine & HVAC",
    "co-timberline",
    "ct-victor-r",
    "closed-won",
    -26,
    72,
    "Change order",
    [line("MCB-D05-MEZZ", 24), line("MCB-D23-RTU", 3)],
  ],
  [
    "dl-sandstone-pad",
    "Sandstone Retail Centers: South Pad Utilities & Paving",
    "co-sandstone",
    "ct-roger",
    "closed-lost",
    -19,
    85,
    "New bid",
    [line("MCB-D02-COM", 20), line("MCB-D02-PAVE", 18)],
  ],
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

// Guided quote hero starts as a precon estimate with no line items: Guided quote generates the CSI divisions.
const redrockFacility = deals.find((d) => d.id === "dl-redrock-civic")!;
redrockFacility.lineItems = [];
redrockFacility.amount = 2_700_000;
redrockFacility.lastActivityAt = "@-1d";

function deal(id: string): Deal {
  const d = deals.find((x) => x.id === id);
  if (!d) throw new Error(`Unknown deal in AEC seed: ${id}`);
  return d;
}

type QuoteSeed = [id: string, number: string, dealId: string, status: Quote["status"], discountPct: number, createdDaysAgo: number];

const quoteSeeds: QuoteSeed[] = [
  ["q-8104", "Q-8104", "dl-redrock-yard", "Draft", 0, 1],
  ["q-8103", "Q-8103", "dl-highplains-wing", "Sent", 3, 4],
  ["q-8102", "Q-8102", "dl-ironwood-cold", "Sent", 5, 7],
  ["q-8101", "Q-8101", "dl-silverline-hub", "Sent", 0, 10],
  ["q-8100", "Q-8100", "dl-wasatch-hangar", "Sent", 4, 13],
  ["q-8099", "Q-8099", "dl-flatiron-clean", "Sent", 2, 16],
  ["q-8098", "Q-8098", "dl-timberline-ti", "Accepted", 0, 32],
  ["q-8097", "Q-8097", "dl-pikes-storm", "Accepted", 3, 44],
  ["q-8096", "Q-8096", "dl-summit-bldg-b", "Accepted", 4, 92],
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
    ownerId: d.ownerId ?? "elena",
    status,
    lineItems: d.lineItems.map((l) => ({ ...l })),
    discountPct,
    createdAt: `@-${created}d`,
    validUntil: `@+${30 - Math.min(created, 25)}d`,
    ...(status !== "Draft" ? { sentAt: `@-${Math.max(created - 1, 0)}d` } : {}),
    ...(status === "Accepted" ? { acceptedAt: `@-${Math.max(created - 5, 0)}d` } : {}),
  };
});

const tasks: Task[] = [
  { id: "tk-1", title: "Finalize 45k sq ft GMP division estimate for Marisol Delgado", type: "Email", priority: "High", dueAt: "@+0d", ownerId: "elena", status: "open", contactId: "ct-marisol", companyId: "co-redrock", dealId: "dl-redrock-civic" },
  { id: "tk-2", title: "Review South Yard VE discount options before transit board meeting", type: "Call", priority: "High", dueAt: "@+1d", ownerId: "elena", status: "open", contactId: "ct-marisol", companyId: "co-redrock", dealId: "dl-redrock-yard" },
  { id: "tk-3", title: "Confirm Building B Change Order #4 unit rates with Graham Becker", type: "Email", priority: "Medium", dueAt: "@+1d", ownerId: "elena", status: "open", contactId: "ct-graham", companyId: "co-summit-logistics" },
  { id: "tk-4", title: "Follow up on Aurora Cross-Dock ITB-2026-0418 bid set", type: "To-do", priority: "High", dueAt: "@+2d", ownerId: "elena", status: "open", contactId: "ct-owen", companyId: "co-frontrange" },
  { id: "tk-5", title: "Check structural steel mill slot for Loveland cold-storage bid", type: "Call", priority: "Medium", dueAt: "@+2d", ownerId: "caleb", status: "open", contactId: "ct-lydia", companyId: "co-ironwood", dealId: "dl-ironwood-cold" },
  { id: "tk-6", title: "Prepare storm culvert ROM estimate for Mesa County District", type: "Email", priority: "High", dueAt: "@+0d", ownerId: "nadia", status: "open", contactId: "ct-priya-s", companyId: "co-mesa-municipal" },
  { id: "tk-7", title: "Review weekly bid-margin exceptions with estimating leads", type: "To-do", priority: "Medium", dueAt: "@+2d", ownerId: "derek", status: "open" },
  { id: "tk-8", title: "Confirm Brighton pre-bid site walk with Hannah O'Connor", type: "Call", priority: "Medium", dueAt: "@+3d", ownerId: "caleb", status: "open", contactId: "ct-hannah-o", companyId: "co-silverline", dealId: "dl-silverline-hub" },
];

const activities: Activity[] = [
  // Redrock Transit Authority — Guided Quote & Discount Approval hero
  { id: "ac-1", at: "@-1d", type: "call", title: "Call with Marisol Delgado", body: "Confirmed 45,000 sq ft industrial transit bay in structural steel with 480V EV bus fleet MEP under CM-at-Risk (GMP). Target mobilization within 60 days.", byId: "elena", contactIds: ["ct-marisol"], companyIds: ["co-redrock"], dealIds: ["dl-redrock-civic"] },
  { id: "ac-2", at: "@-2d", type: "email", title: "Email from Marisol Delgado: Addendum #2 EV riser diagram", body: "Attached electrical riser diagram for the 45k sq ft bus maintenance bay. Please include heavy 480V EV MEP scope in your CMAR estimate.", byId: null, contactIds: ["ct-marisol"], companyIds: ["co-redrock"], dealIds: ["dl-redrock-civic"] },
  { id: "ac-3", at: "@-6d", type: "meeting", title: "Preconstruction site walk — Redrock Depot", body: "Walked existing bus yard with Marisol and Kenneth Pruitt. Confirmed site grading access and 480V utility tie-in.", byId: "elena", contactIds: ["ct-marisol", "ct-kenneth"], companyIds: ["co-redrock"], dealIds: ["dl-redrock-civic"] },
  { id: "ac-4", at: "@-11d", type: "deal", title: "Deal created", body: "Redrock Transit Authority: Bus Maintenance & Ops Facility created in Precon & Estimating.", byId: "elena", companyIds: ["co-redrock"], dealIds: ["dl-redrock-civic"] },
  { id: "ac-5", at: "@-1d", type: "quote", title: "Quote Q-8104 created", body: "Draft bid quote for South Yard Paving & Drainage Upgrade ($482,800).", byId: "elena", contactIds: ["ct-marisol"], companyIds: ["co-redrock"], dealIds: ["dl-redrock-yard"], linkPath: "/quotes/q-8104", linkLabel: "View quote" },
  { id: "ac-6", at: "@-3d", type: "email", title: "Email from Marisol Delgado: South Yard budget cap", body: "Capital committee wants to see a 10% value-engineering reduction on the South Yard paving & lighting package before Friday's vote.", byId: null, contactIds: ["ct-marisol"], companyIds: ["co-redrock"], dealIds: ["dl-redrock-yard"] },
  // Summit Valley Logistics — Back-Office Procore & Sage Intacct hero
  { id: "ac-10", at: "@-19d", type: "sync", title: "Procore Change Order JOB-4410-CO3 approved", body: "Synced from Procore & Sage Intacct: Building B slab pour & 4 hydraulic dock levelers, $106,800.00.", byId: null, companyIds: ["co-summit-logistics"] },
  { id: "ac-11", at: "@-18d", type: "sync", title: "Sage Intacct Pay App AIA-APP-114 issued", body: "Progress billing #114 synced from Sage Intacct: $214,500.00 billed, $116,500.00 open balance.", byId: null, companyIds: ["co-summit-logistics"] },
  { id: "ac-12", at: "@-2d", type: "call", title: "Call with Graham Becker", body: "Building B tenant needs an additional 6k sq ft slab pad, 4 dock pits, and 2 EV fleet feeders. Asked for a change-order quote at MSA unit rates.", byId: "elena", contactIds: ["ct-graham"], companyIds: ["co-summit-logistics"] },
  { id: "ac-13", at: "@-84d", type: "deal", title: "Deal awarded", body: "Summit Valley Logistics: Building B Core & Shell moved to Awarded - Contracted.", byId: "elena", contactIds: ["ct-graham"], companyIds: ["co-summit-logistics"], dealIds: ["dl-summit-bldg-b"] },
  // Clearwater Civic Developers — AI Prospecting hero
  { id: "ac-20", at: "@-18d", type: "note", title: "Note — Arapahoe Civic Annex watch", body: "Permit tracker flagged early zoning filings in Arapahoe County. Claire Hendricks previously praised our schedule delivery on the 2024 Tech Center garage.", byId: "elena", contactIds: ["ct-claire"], companyIds: ["co-clearwater-dev"] },
  { id: "ac-21", at: "@-45d", type: "call", title: "Call with Martin Salazar", body: "Post-warranty closeout check on the 2024 parking structure. Martin mentioned a 2026 civic campus moving into schematic design.", byId: "elena", contactIds: ["ct-martin"], companyIds: ["co-clearwater-dev"] },
  { id: "ac-22", at: "@-11mo", type: "sync", title: "Final retainage released (PRJ-3890-CWD)", body: "Synced from Sage Intacct: Clearwater Tech Center Parking Structure closed out 11 days ahead of schedule, $0 open balance.", byId: null, companyIds: ["co-clearwater-dev"] },
  // Front Range Logistics Partners — Email-to-Deal hero
  { id: "ac-30", at: "@-4d", type: "call", title: "Call with Owen Whitaker", body: "Phase 2 cross-dock drawings are complete. ITB-2026-0418 arriving by email this week.", byId: "elena", contactIds: ["ct-owen"], companyIds: ["co-frontrange"] },
];

// Give remaining contacts a clean seeded history so no timeline is empty.
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
    body: d ? `Reviewed preconstruction schedule and CSI scope for ${d.name.split(": ")[1].toLowerCase()}.` : `Shared Meridian's commercial bonding capacity and Front Range division capabilities.`,
    byId: c.ownerId,
    ...ids,
  });
  if (d) {
    activities.push({ id: `ac-g${i}b`, at: d.createdAt, type: "deal", title: "Deal created", body: `${d.name} was created.`, byId: d.ownerId, ...ids });
  }
  activities.push({ id: `ac-g${i}c`, at: c.createdAt, type: "lifecycle", title: "Contact created", body: `${c.firstName} ${c.lastName} was added from ${c.source?.toLowerCase() ?? "bid tracking"}.`, byId: null, contactIds: [c.id], companyIds: [co.id] });
});

export const aecPack: Pack = {
  vertical: { id: "aec", name: "AEC and construction" },
  portal: { company: "Meridian Civil & Builders", domain: "meridiancivil.example", hubId: "48213592", currency: "USD", address: ["Denver, CO 80202", "United States"] },
  personas: [
    { id: "elena", name: "Elena Vance", title: "Senior Preconstruction Manager", email: "elena.vance@meridiancivil.example", viewAs: "Precon manager", color: "#0b6e6e" },
    { id: "derek", name: "Derek Holloway", title: "VP of Estimating", email: "derek.holloway@meridiancivil.example", viewAs: "VP Estimating", color: "#8a3ffc" },
    { id: "nadia", name: "Nadia Al-Mansoor", title: "Civil Division Estimator", email: "nadia.almansoor@meridiancivil.example", viewAs: "Nadia, civil division", color: "#b8500a" },
    { id: "caleb", name: "Caleb Thornton", title: "Commercial Estimating Lead", email: "caleb.thornton@meridiancivil.example", viewAs: "Caleb, commercial lead", color: "#1565c0" },
    { id: "rachel", name: "Rachel Kowalski", title: "Special Projects Estimator", email: "rachel.kowalski@meridiancivil.example", viewAs: "Rachel, special projects", color: "#5d6b2f" },
  ],
  defaultPersonaId: "elena",
  terms: { quote: "Quote", product: "Division item", backOffice: "Procore & Sage", request: "ITB" },
  stages: [
    { id: "new-rfq", label: "RFP / ITB Received", probability: 10 },
    { id: "qualified", label: "Precon & Estimating", probability: 30 },
    { id: "quote-sent", label: "Bid Submitted", probability: 50 },
    { id: "negotiation", label: "Value Engineering", probability: 75 },
    { id: "closed-won", label: "Awarded - Contracted", probability: 100, closed: "won" },
    { id: "closed-lost", label: "Bid Lost", probability: 0, closed: "lost" },
  ],
  companies,
  contacts,
  deals,
  products,
  quotes,
  tasks,
  notifications: [
    { id: "nt-1", personaId: "elena", at: "@-2d", kind: "mention", title: "Derek Holloway mentioned you", body: "On Ironwood Industrial: Loveland Cold-Storage Shell: \"Hold subcontractor margin floor at 18% on structural steel.\"", path: "/deals/dl-ironwood-cold", read: true },
    { id: "nt-2", personaId: "elena", at: "@-1d", kind: "task", title: "Task due today", body: "Finalize 45k sq ft GMP division estimate for Marisol Delgado", path: "/tasks", read: true },
    { id: "nt-3", personaId: "derek", at: "@-7d", kind: "approved", title: "You approved a bid exception", body: "Q-8102 for Ironwood Industrial, 5% value-engineering adjustment.", path: "/quotes/q-8102", read: true },
    { id: "nt-4", personaId: "nadia", at: "@-1d", kind: "task", title: "Task due today", body: "Prepare storm culvert ROM estimate for Mesa County District", path: "/tasks", read: true },
  ],
  activities,
  threads,
  workflows: [
    {
      id: "wf-rfp-routing",
      name: "Inbound | RFP & Bid Invite Routing",
      object: "Contact",
      status: "On",
      enrolled: 846,
      createdAt: "@-390d",
      updatedAt: "@-8d",
      description: "Scores every website RFP or bid invite and routes it by division, project bond tier, and region.",
      trunk: [
        { id: "n-trigger", kind: "trigger", label: "Contact enrollment trigger", detail: "Form submission: Project RFP & bid intake" },
        { id: "n-enrich", kind: "action", label: "Enrich account & agency", detail: "Fill sector, capital budget, headcount, and project region" },
        { id: "n-score", kind: "action", label: "Update bid-fit score", detail: "Division fit, bond scale, and bid-deadline score (0 to 100)" },
        { id: "n-route", kind: "action", label: "Route by division and bond tier", detail: "Custom action: maps civil vs. commercial division and surety capacity", extId: "territory-routing" },
        { id: "n-branch", kind: "branch", label: "Branch on estimating routing result" },
      ],
      branches: [
        {
          id: "field",
          label: "Civil division estimator",
          rule: "Civil / municipal infrastructure, score 70 or more",
          nodes: [
            { id: "f-owner", kind: "action", label: "Set contact owner", detail: "Civil division estimator for the region" },
            { id: "f-deal", kind: "action", label: "Create bid deal", detail: "Pipeline: Preconstruction. Stage: RFP / ITB Received" },
            { id: "f-task", kind: "action", label: "Create pre-bid task", detail: "Call within 1 hour to confirm pre-bid walk. High priority" },
            { id: "f-alert", kind: "action", label: "Send Slack notification", detail: "#estimating-civil, with bid score and deadline" },
          ],
        },
        {
          id: "inside",
          label: "Commercial estimating lead",
          rule: "Commercial building / TI, score 40 to 69",
          nodes: [
            { id: "i-owner", kind: "action", label: "Set contact owner", detail: "Commercial estimating lead" },
            { id: "i-deal", kind: "action", label: "Create bid deal", detail: "Pipeline: Preconstruction. Stage: RFP / ITB Received" },
            { id: "i-task", kind: "action", label: "Create task", detail: "Send commercial precon checklist today. Medium priority" },
            { id: "i-alert", kind: "action", label: "Send Slack notification", detail: "#estimating-commercial" },
          ],
        },
        {
          id: "channel",
          label: "Special projects team",
          rule: "Existing MSA owner, change-order request",
          nodes: [
            { id: "c-owner", kind: "action", label: "Set contact owner", detail: "Special projects estimator" },
            { id: "c-task", kind: "action", label: "Create task", detail: "Check Procore job cost & MSA unit rates" },
          ],
        },
        {
          id: "nurture",
          label: "Nurture / out-of-scope",
          rule: "Score under 40 (below $250k minimum)",
          nodes: [
            { id: "u-stage", kind: "action", label: "Set lifecycle stage", detail: "Subscriber" },
            { id: "u-seq", kind: "action", label: "Enroll in workflow", detail: "Marketing | Commercial capabilities & safety brief" },
          ],
        },
      ],
    },
    { id: "wf-bid-followup", name: "Bid Submitted | Post-bid follow-up", object: "Deal", status: "On", enrolled: 274, createdAt: "@-310d", updatedAt: "@-22d", description: "Creates a preconstruction follow-up task 48 hours after a commercial bid quote is published." },
    { id: "wf-nurture", name: "Marketing | Commercial capabilities & safety brief", object: "Contact", status: "On", enrolled: 2940, createdAt: "@-540d", updatedAt: "@-60d", description: "Quarterly Front Range construction cost index and safety updates." },
    { id: "wf-procore-handoff", name: "Awarded | Procore project handoff", object: "Deal", status: "On", enrolled: 118, createdAt: "@-280d", updatedAt: "@-35d", description: "Creates the Procore project shell and Sage Intacct job cost code when a deal moves to Awarded - Contracted." },
  ],
  signals: [
    {
      id: "sg-clearwater",
      companyId: "co-clearwater-dev",
      title: "3 Arapahoe County building permits & $42M Civic Annex RFP",
      source: "Municipal Permit & RFP Feed and planning filings",
      at: "@-1d",
      strength: "High",
      summary: "Three commercial foundation permits filed ($42M valuation) and Alden & Park Architects named for the 90,000 sq ft Arapahoe Civic Innovation Annex.",
      hero: true,
    },
    { id: "sg-ironwood", companyId: "co-ironwood", title: "Bid quote viewed six times", source: "Quote activity", at: "@-2d", strength: "Medium", summary: "Q-8102 for Loveland Cold-Storage Shell was reviewed by finance and ownership." },
    { id: "sg-silverline", companyId: "co-silverline", title: "Site plan approval in Brighton", source: "Municipal Permit & RFP Feed", at: "@-3d", strength: "Medium", summary: "Brighton planning board approved Phase 2 cold-chain expansion parcel." },
    { id: "sg-cheyenne", companyId: "co-cheyenne-dot", title: "Capital bond measure passed", source: "Public infrastructure filings", at: "@-5d", strength: "Medium", summary: "$68M corridor drainage and bridge widening bond approved for Q3 RFPs." },
    { id: "sg-flatiron", companyId: "co-flatiron-bio", title: "Bonding & EMR packet downloaded", source: "Website activity", at: "@-6d", strength: "Medium", summary: "Two project directors downloaded Meridian's surety letter and OSHA EMR report." },
  ],
  quoteTerms: [
    "Prices in US dollars, valid for 30 days from quote date, subject to steel and switchgear escalation after 45 days.",
    "Progress billing: monthly AIA G702/G703 applications, net 30 days, with 5% retainage released at substantial completion.",
    "Mobilization schedules begin upon signed Notice to Proceed, approved submittals, and permit issuance.",
    "100% Performance and Payment Bond included under Meridian Civil & Builders surety program ($85M single-project capacity).",
  ],
  extensions,
  labels: {
    pipeline: "Preconstruction pipeline",
    territory: "Region & division",
    timing: "Mobilization",
    quoteTotal: "Bid total",
    document: {
      heading: "Commercial Bid Quote",
      ref: "Bid ref.",
      total: "Total bid contract value",
      summary: "{seller} will furnish labor, materials, supervision, and bonding for {buyer}: {count} CSI division line items totaling {total}.",
      cover: "Thank you for inviting Meridian Civil & Builders to price {title}. The CSI division schedule below covers all {count} scope packages reviewed during preconstruction. Reply directly to coordinate value-engineering options or submittal schedules.",
    },
    agent: {
      timing: "What are the mobilization lead times?",
      files: [
        {
          name: "AIA A201 General Conditions & Retainage.pdf",
          question: "How are progress billings and retainage handled?",
          answer: "Progress billings are submitted monthly on AIA G702/G703 forms, payable Net 30, with 5% retainage released upon substantial completion.",
          keywords: ["retainage", "aia", "billing", "payment", "progress", "g702"],
        },
        {
          name: "OSHA Safety & Bonding Certificate.pdf",
          question: "What are your bonding capacity and safety rating?",
          answer: "Meridian Civil & Builders carries $85M single-project and $220M aggregate bonding capacity with a 0.72 OSHA EMR safety rating.",
          keywords: ["bond", "bonding", "surety", "safety", "osha", "emr", "insurance"],
        },
        {
          name: "Submittal & Mobilization Schedule.pdf",
          question: "What drives the mobilization schedule?",
          answer: "Sitework mobilizes within 24 days of Notice to Proceed. Structural steel and 480V EV switchgear submittals are released immediately upon GMP award to hold the 35-day critical path.",
          keywords: ["mobilize", "mobilization", "submittal", "switchgear", "steel", "schedule", "lead"],
        },
      ],
    },
    synced: {
      title: "Procore & Sage Sync",
      account: "Sage Job Account",
      lastOrder: "Last Commitment / CO",
      openBalance: "Open Progress Billing",
      status: "Bonding & Credit Status",
    },
  },
  stepNotes: {
    "guided-quote": {
      requirements: { hint: "Choose project type, structural system, MEP scope, delivery method, footprint, and mobilization window" },
    },
    "discount-approval": {
      discount: { title: "Enter a 10% VE discount over limit" },
    },
    "back-office": {
      company: { hint: "Companies: click Summit Valley Logistics. Synced Procore & Sage fields and the job-costing card are on the record" },
      orders: { title: "Expand a job commitment", hint: "Commitments & COs tab: click a job or change-order row" },
      balance: { title: "Check job billing & retainage", hint: "Click the Job Billing & Retainage tab" },
      stock: { title: "Pick unit rates for a change order", hint: "Division Unit Rates tab: tick three items, then Add to change-order quote" },
      send: { hint: "Change-order quote is prefilled at MSA unit rates. Click Preview, then Share" },
    },
    "lead-capture": {
      form: { title: "Submit the RFP intake form", hint: "Pick one of the three project RFPs, then click Submit RFP" },
    },
    "email-to-deal": {
      open: { title: "Open the owner-rep bid inquiry", hint: "Inbox: click one of the three new ITB / bid inquiry emails" },
      create: { title: "Confirm flagged scope, create deal", hint: "Pick the CSI match for the flagged dock spec, then click Create deal" },
      deal: { hint: "Click View deal. CSI scope lines, bid amount, and target bid date are filled with the ITB on the timeline" },
    },
    "ai-prospecting": {
      signal: { title: "Open the permit-flagged developer", hint: "Prospecting: click Clearwater Civic Developers at the top of the list" },
    },
  },
  demos,
};
