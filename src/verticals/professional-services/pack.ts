import type { Activity, Company, Contact, Deal, LineItem, Pack, Quote, Task } from "../types";
import { itServiceDeskReport } from "./customer-agent";
import { demos } from "./demos";
import { extensions } from "./extensions";
import { threads } from "./inbox";
import { line, products } from "./rate-card";

// Professional and IT services pack: Quillon Technology Partners, a managed IT services provider
// that also runs projects and resells hardware and licences.
// Every company, person, and number here is invented sample data.
// Email and web addresses use the reserved ".example" domain so nothing can reach a real inbox.

function total(lines: LineItem[]): number {
  return lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0);
}

type CompanySeed = [id: string, name: string, industry: string, type: string, city: string, state: string, employees: number, revenueM: number, ownerId: string, lifecycle: string, createdDaysAgo: number, lastDaysAgo: number, region: string];

const companySeeds: CompanySeed[] = [
  ["co-ashgrove", "Ashgrove Design Partners", "Architecture and engineering", "Prospect", "Raleigh", "NC", 110, 24, "tessa", "Opportunity", 38, 1, "Southeast"],
  ["co-thornbury", "Thornbury Legal Group", "Legal services", "Customer", "Charlotte", "NC", 150, 48, "tessa", "Customer", 1120, 1, "Southeast"],
  ["co-wexcombe", "Wexcombe Plastics", "Manufacturing", "Customer", "Greenville", "SC", 165, 58, "tessa", "Customer", 1005, 1, "Southeast"],
  ["co-orielpark", "Oriel Park Senior Living", "Healthcare", "Customer", "Atlanta", "GA", 620, 95, "tessa", "Customer", 840, 6, "Southeast"],
  ["co-fenwick", "Fenwick Lane Pediatrics", "Healthcare", "Customer", "Durham", "NC", 70, 14, "tessa", "Customer", 610, 2, "Southeast"],
  ["co-stonewick", "Stonewick Insurance Agency", "Insurance", "Customer", "Columbia", "SC", 60, 11, "tessa", "Customer", 420, 3, "Southeast"],
  ["co-brookmere", "Brookmere Animal Hospitals", "Veterinary services", "Customer", "Knoxville", "TN", 90, 16, "tessa", "Customer", 530, 2, "Southeast"],
  ["co-calderwood", "Calderwood Civil Engineering", "Architecture and engineering", "Customer", "Columbus", "OH", 130, 31, "grant", "Customer", 760, 5, "Midwest"],
  ["co-larkfield", "Larkfield Title and Escrow", "Real estate services", "Customer", "Indianapolis", "IN", 45, 9, "grant", "Customer", 690, 8, "Midwest"],
  ["co-pennywell", "Pennywell Home Health", "Healthcare", "Prospect", "Cincinnati", "OH", 210, 27, "grant", "Opportunity", 44, 3, "Midwest"],
  ["co-ravensworth", "Ravensworth Building Supply", "Wholesale distribution", "Customer", "Richmond", "VA", 190, 72, "tessa", "Customer", 905, 7, "Southeast"],
  ["co-tidemark", "Tidemark Dental Studios", "Healthcare", "Prospect", "Wilmington", "NC", 55, 8, "tessa", "Opportunity", 29, 4, "Southeast"],
  ["co-oakmere", "Oakmere Charter Schools", "Education", "Customer", "Nashville", "TN", 240, 22, "tessa", "Customer", 480, 10, "Southeast"],
  ["co-sablewood", "Sablewood Furniture Company", "Manufacturing", "Prospect", "Grand Rapids", "MI", 280, 66, "grant", "Opportunity", 51, 2, "Midwest"],
  ["co-kingsmead", "Kingsmead Wealth Advisors", "Financial advisory", "Customer", "Chicago", "IL", 85, 30, "imani", "Customer", 365, 9, "Midwest"],
  ["co-pellham", "Pellham Freight Brokers", "Logistics", "Prospect", "Memphis", "TN", 75, 19, "tessa", "Lead", 16, 5, "Southeast"],
  ["co-whitlow", "Whitlow Orthopedic Clinic", "Healthcare", "Customer", "Birmingham", "AL", 120, 26, "imani", "Customer", 590, 11, "Southeast"],
  ["co-dovecote", "Dovecote Property Management", "Real estate services", "Customer", "Tampa", "FL", 140, 21, "tessa", "Customer", 720, 12, "Southeast"],
  ["co-marlinspike", "Marlinspike Marine Supply", "Retail", "Prospect", "Jacksonville", "FL", 95, 28, "soledad", "Opportunity", 33, 3, "Southeast"],
  ["co-eastlake", "Eastlake Mechanical Contractors", "Construction", "Customer", "St. Louis", "MO", 170, 44, "grant", "Customer", 1210, 6, "Midwest"],
  ["co-cinderford", "Cinderford Foods", "Food and beverage", "Customer", "Milwaukee", "WI", 310, 88, "grant", "Customer", 980, 13, "Midwest"],
  ["co-yarrow", "Yarrow Street Architects", "Architecture and engineering", "Prospect", "Minneapolis", "MN", 40, 7, "soledad", "Lead", 104, 31, "Midwest"],
  ["co-holloway", "Holloway Nonprofit Alliance", "Nonprofit", "Prospect", "Savannah", "GA", 35, 4, "tessa", "Lead", 11, 4, "Southeast"],
  ["co-brightwell", "Brightwell Eye Associates", "Healthcare", "Prospect", "Lexington", "KY", 65, 12, "grant", "Lead", 8, 3, "Midwest"],
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
  phone: `(555) 01${String(12 + i).padStart(2, "0")}-${String(3100 + i * 47).slice(0, 4)}`,
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

// The synced PSA fields reuse the back-office summary: lastOrderDate holds the contract renewal
// date, openBalance the open invoices, and creditLimit the unbilled work.
company("co-ashgrove").description = "Architecture and interior design firm with studios in Raleigh, Durham, and Greensboro. Its one IT coordinator is stretched across all three.";
company("co-thornbury").description = "Business and real estate law firm. A managed IT customer for three years, now moving its documents off an on-premises file server.";
company("co-thornbury").erp = { accountNumber: "QTP-10377", lastOrderDate: "@+201d", openBalance: 15_625, creditStatus: "Good standing", creditLimit: 0 };
company("co-wexcombe").description = "Injection moulding for automotive and appliance customers, with plants in Greenville and Greer. On Managed IT Complete since last year.";
company("co-wexcombe").erp = { accountNumber: "QTP-10482", lastOrderDate: "@+96d", openBalance: 19_847, creditStatus: "Good standing", creditLimit: 7_268 };
company("co-orielpark").description = "Operates nine senior living communities in Georgia and the Carolinas. Managed network and help desk customer.";
company("co-orielpark").erp = { accountNumber: "QTP-10291", lastOrderDate: "@+148d", openBalance: 0, creditStatus: "Good standing", creditLimit: 0 };
company("co-fenwick").description = "Pediatric practice with four offices. Buys hardware and licences through Quillon and is on Managed IT Essentials.";
company("co-stonewick").description = "Independent insurance agency. Has bought laptops and licences from Quillon for a year and looks after its own IT.";
company("co-brookmere").description = "Group of six animal hospitals in East Tennessee. On Managed IT Complete.";

type ContactSeed = [id: string, first: string, last: string, title: string, companyId: string, lifecycle: string, leadStatus: string, createdDaysAgo: number, lastDaysAgo: number];

const contactSeeds: ContactSeed[] = [
  ["ct-maya", "Maya", "Castellanos", "Director of Operations", "co-ashgrove", "Opportunity", "In progress", 38, 1],
  ["ct-devon", "Devon", "Pryce", "IT Coordinator", "co-ashgrove", "Opportunity", "In progress", 30, 5],
  ["ct-celia", "Celia", "Thornbury", "Chief Operating Officer", "co-thornbury", "Customer", "Connected", 1115, 1],
  ["ct-rashid", "Rashid", "Mahmoud", "IT Manager", "co-thornbury", "Customer", "Connected", 860, 8],
  ["ct-harriet", "Harriet", "Lindgren", "Chief Financial Officer", "co-wexcombe", "Customer", "Connected", 1000, 14],
  ["ct-joel", "Joel", "Banerjee", "IT Manager", "co-wexcombe", "Customer", "Connected", 990, 1],
  ["ct-vivian", "Vivian", "Achterberg", "Director of IT", "co-orielpark", "Customer", "Connected", 835, 6],
  ["ct-desmond", "Desmond", "Farrow", "Procurement Manager", "co-orielpark", "Customer", "Attempted to contact", 700, 120],
  ["ct-rosalind", "Rosalind", "Mbeki", "Practice Manager", "co-fenwick", "Customer", "Connected", 605, 2],
  ["ct-tobias", "Tobias", "Renner", "Operations Director", "co-stonewick", "Customer", "Connected", 415, 3],
  ["ct-kay", "Kay", "Sorensen", "Office Manager", "co-brookmere", "Customer", "Connected", 525, 2],
  ["ct-august", "August", "Calderwood", "Principal", "co-calderwood", "Customer", "Connected", 755, 5],
  ["ct-marguerite", "Marguerite", "Odum", "Office Manager", "co-larkfield", "Customer", "Connected", 685, 8],
  ["ct-lionel", "Lionel", "Abara", "Chief Operating Officer", "co-pennywell", "Opportunity", "In progress", 44, 3],
  ["ct-freya", "Freya", "Ravensworth", "Vice President of Operations", "co-ravensworth", "Customer", "Connected", 900, 7],
  ["ct-ines", "Ines", "Varga", "Practice Administrator", "co-tidemark", "Opportunity", "In progress", 29, 4],
  ["ct-corbin", "Corbin", "Whitfield", "Director of Technology", "co-oakmere", "Customer", "Connected", 475, 10],
  ["ct-saskia", "Saskia", "Vandermeer", "Chief Financial Officer", "co-sablewood", "Opportunity", "In progress", 51, 2],
  ["ct-julian", "Julian", "Kingsmead", "Managing Partner", "co-kingsmead", "Customer", "Connected", 360, 9],
  ["ct-odette", "Odette", "Pellham", "President", "co-pellham", "Lead", "New", 16, 5],
  ["ct-warren", "Warren", "Whitlow", "Practice Administrator", "co-whitlow", "Customer", "Connected", 585, 11],
  ["ct-bianca", "Bianca", "Ferreira", "Director of Operations", "co-dovecote", "Customer", "Connected", 715, 12],
  ["ct-hugo", "Hugo", "Lindqvist", "General Manager", "co-marlinspike", "Opportunity", "In progress", 33, 3],
  ["ct-nell", "Nell", "Okonkwo", "Controller", "co-eastlake", "Customer", "Connected", 1205, 6],
  ["ct-gideon", "Gideon", "Marsh", "IT Director", "co-cinderford", "Customer", "Connected", 975, 13],
  ["ct-petra", "Petra", "Yarrow", "Founding Partner", "co-yarrow", "Lead", "Attempted to contact", 104, 31],
  ["ct-amos", "Amos", "Holloway", "Executive Director", "co-holloway", "Lead", "New", 11, 4],
  ["ct-lucinda", "Lucinda", "Brightwell", "Practice Manager", "co-brightwell", "Lead", "New", 8, 3],
];

const contacts: Contact[] = contactSeeds.map(([id, firstName, lastName, title, companyId, lifecycle, leadStatus, created, last], i) => ({
  id,
  firstName,
  lastName,
  email: `${firstName}.${lastName}@${company(companyId).domain}`.toLowerCase(),
  phone: `(555) 01${String(44 + i).padStart(2, "0")}-${String(6200 + i * 59).slice(0, 4)}`,
  title,
  companyId,
  ownerId: company(companyId).ownerId,
  lifecycle,
  leadStatus,
  createdAt: `@-${created}d`,
  lastActivityAt: `@-${last}d`,
  source: i % 3 === 0 ? "Referral" : i % 3 === 1 ? "Organic search" : "Webinar",
}));

const NEW = "New business";
const RENEWAL = "Renewal";
const CHANGE = "Change order";
const PROJECT = "Project";

/** A managed services agreement: per-user service, optional security add-on, and managed network sites. */
function agreement(tier: "ESS" | "CMP" | "PLS", users: number, sites: number, security?: "MDR" | "CPL"): LineItem[] {
  return [line(`QT-MS-${tier}`, users), ...(security ? [line(`QT-SEC-${security}`, users)] : []), ...(sites > 0 ? [line("QT-NET-SITE", sites)] : [])];
}

type DealSeed = [id: string, name: string, companyId: string, contactId: string, stage: string, closeInDays: number, createdDaysAgo: number, type: string, lines: LineItem[]];

const dealSeeds: DealSeed[] = [
  ["dl-ashgrove", "Ashgrove Design Partners: Managed IT for three studios", "co-ashgrove", "ct-maya", "qualified", 21, 12, NEW, []],
  ["dl-thornbury", "Thornbury Legal Group: Document management migration", "co-thornbury", "ct-celia", "qualified", 14, 9, PROJECT, [line("QT-PS-ARC", 40), line("QT-PS-SNR", 120), line("QT-PS-ENG", 160), line("QT-PS-PM", 60)]],
  ["dl-thornbury-renewal", "Thornbury Legal Group: Managed IT renewal", "co-thornbury", "ct-celia", "closed-won", -164, 210, RENEWAL, agreement("CMP", 150, 1, "CPL")],
  ["dl-wexcombe-complete", "Wexcombe Plastics: Managed IT Complete", "co-wexcombe", "ct-harriet", "closed-won", -269, 320, NEW, [line("QT-MS-CMP", 140, 1440), line("QT-SEC-MDR", 140, 204), line("QT-NET-SITE", 2, 4000), line("QT-ONB-CMP", 1)]],
  ["dl-wexcombe-wireless", "Wexcombe Plastics: Warehouse wireless refresh", "co-wexcombe", "ct-joel", "closed-won", -41, 70, PROJECT, [line("QT-PS-ENG", 120, 158), line("QT-HW-AP", 18), line("QT-HW-SW24", 2)]],
  ["dl-orielpark", "Oriel Park Senior Living: Managed network and help desk", "co-orielpark", "ct-vivian", "closed-won", -217, 300, NEW, [line("QT-MS-ESS", 310), line("QT-NET-SITE", 9)]],
  ["dl-fenwick", "Fenwick Lane Pediatrics: Managed IT Essentials", "co-fenwick", "ct-rosalind", "closed-won", -190, 240, NEW, agreement("ESS", 70, 4)],
  ["dl-brookmere", "Brookmere Animal Hospitals: Managed IT Complete", "co-brookmere", "ct-kay", "closed-won", -300, 360, NEW, agreement("CMP", 90, 6)],
  ["dl-calderwood", "Calderwood Civil Engineering: Managed IT renewal", "co-calderwood", "ct-august", "negotiation", 10, 36, RENEWAL, agreement("CMP", 130, 2, "MDR")],
  ["dl-pennywell", "Pennywell Home Health: Managed IT and compliance", "co-pennywell", "ct-lionel", "quote-sent", 24, 40, NEW, [...agreement("CMP", 210, 3, "CPL"), line("QT-ONB-CMP", 1)]],
  ["dl-ravensworth", "Ravensworth Building Supply: Branch firewall refresh", "co-ravensworth", "ct-freya", "quote-sent", 17, 22, PROJECT, [line("QT-HW-FW", 7), line("QT-PS-SNR", 56), line("QT-PS-PM", 12)]],
  ["dl-tidemark", "Tidemark Dental Studios: Managed IT Essentials", "co-tidemark", "ct-ines", "qualified", 30, 18, NEW, [...agreement("ESS", 55, 3), line("QT-ONB-ESS", 1)]],
  ["dl-oakmere", "Oakmere Charter Schools: Student laptop refresh", "co-oakmere", "ct-corbin", "closed-won", -55, 96, PROJECT, [line("QT-HW-LT14", 120), line("QT-USR-SETUP", 120), line("QT-LIC-EDR", 120)]],
  ["dl-sablewood", "Sablewood Furniture Company: Managed IT Complete Plus", "co-sablewood", "ct-saskia", "negotiation", 12, 48, NEW, [...agreement("PLS", 280, 2, "MDR"), line("QT-ONB-PLS", 1)]],
  ["dl-kingsmead", "Kingsmead Wealth Advisors: Security and compliance pack", "co-kingsmead", "ct-julian", "closed-won", -80, 130, CHANGE, [line("QT-SEC-CPL", 85), line("QT-ASM-SEC", 1)]],
  ["dl-pellham", "Pellham Freight Brokers: Security assessment", "co-pellham", "ct-odette", "new-rfq", 40, 6, NEW, [line("QT-ASM-SEC", 1)]],
  ["dl-whitlow", "Whitlow Orthopedic Clinic: Managed IT renewal", "co-whitlow", "ct-warren", "quote-sent", 26, 30, RENEWAL, agreement("CMP", 120, 2, "CPL")],
  ["dl-dovecote", "Dovecote Property Management: Managed backup", "co-dovecote", "ct-bianca", "closed-won", -28, 64, CHANGE, [line("QT-BKP-TB", 24), line("QT-PS-ENG", 16)]],
  ["dl-marlinspike", "Marlinspike Marine Supply: Cloud file migration", "co-marlinspike", "ct-hugo", "qualified", 35, 20, PROJECT, [line("QT-PS-ARC", 24), line("QT-PS-ENG", 80), line("QT-PS-PM", 20)]],
  ["dl-eastlake", "Eastlake Mechanical Contractors: Managed IT Complete", "co-eastlake", "ct-nell", "closed-won", -400, 460, NEW, agreement("CMP", 170, 3)],
  ["dl-cinderford", "Cinderford Foods: Plant network segmentation", "co-cinderford", "ct-gideon", "negotiation", 9, 52, PROJECT, [line("QT-PS-ARC", 60), line("QT-PS-SNR", 140), line("QT-HW-SW48", 6), line("QT-HW-FW", 2)]],
  ["dl-yarrow", "Yarrow Street Architects: Managed IT Essentials", "co-yarrow", "ct-petra", "closed-lost", -22, 90, NEW, agreement("ESS", 40, 1)],
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
const studios = deals.find((d) => d.id === "dl-ashgrove")!;
studios.amount = 180_000;
studios.lastActivityAt = "@-1d";

function deal(id: string): Deal {
  const d = deals.find((x) => x.id === id);
  if (!d) throw new Error(`Unknown deal in seed: ${id}`);
  return d;
}

type QuoteSeed = [id: string, number: string, dealId: string, status: Quote["status"], discountPct: number, createdDaysAgo: number];

const quoteSeeds: QuoteSeed[] = [
  ["q-5241", "Q-5241", "dl-thornbury", "Draft", 0, 1],
  ["q-5240", "Q-5240", "dl-ravensworth", "Sent", 0, 4],
  ["q-5239", "Q-5239", "dl-whitlow", "Sent", 5, 6],
  ["q-5238", "Q-5238", "dl-pennywell", "Sent", 8, 9],
  ["q-5237", "Q-5237", "dl-cinderford", "Sent", 5, 13],
  ["q-5236", "Q-5236", "dl-sablewood", "Sent", 8, 15],
  ["q-5235", "Q-5235", "dl-calderwood", "Sent", 0, 19],
  ["q-5234", "Q-5234", "dl-dovecote", "Accepted", 0, 34],
  ["q-5233", "Q-5233", "dl-wexcombe-wireless", "Accepted", 0, 50],
  ["q-5232", "Q-5232", "dl-oakmere", "Accepted", 5, 66],
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
    ownerId: d.ownerId ?? "tessa",
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
  { id: "tk-1", title: "Send the managed IT proposal to Maya Castellanos", type: "Email", priority: "High", dueAt: "@+0d", ownerId: "tessa", status: "open", contactId: "ct-maya", companyId: "co-ashgrove", dealId: "dl-ashgrove" },
  { id: "tk-2", title: "Call Celia Thornbury about the migration statement of work", type: "Call", priority: "High", dueAt: "@+1d", ownerId: "tessa", status: "open", contactId: "ct-celia", companyId: "co-thornbury", dealId: "dl-thornbury" },
  { id: "tk-3", title: "Reply to Joel Banerjee about the 25 new users in Greer", type: "Email", priority: "Medium", dueAt: "@+1d", ownerId: "tessa", status: "open", contactId: "ct-joel", companyId: "co-wexcombe" },
  { id: "tk-4", title: "Book the quarterly review with Vivian Achterberg", type: "To-do", priority: "Medium", dueAt: "@+5d", ownerId: "tessa", status: "open", contactId: "ct-vivian", companyId: "co-orielpark" },
  { id: "tk-5", title: "Send the firewall refresh schedule to Freya Ravensworth", type: "Email", priority: "Low", dueAt: "@+6d", ownerId: "tessa", status: "open", contactId: "ct-freya", companyId: "co-ravensworth", dealId: "dl-ravensworth" },
  { id: "tk-6", title: "Call August Calderwood about the renewal terms", type: "Call", priority: "High", dueAt: "@+0d", ownerId: "grant", status: "open", contactId: "ct-august", companyId: "co-calderwood", dealId: "dl-calderwood" },
  { id: "tk-7", title: "Send the onboarding plan to Saskia Vandermeer", type: "Email", priority: "Medium", dueAt: "@+2d", ownerId: "grant", status: "open", contactId: "ct-saskia", companyId: "co-sablewood", dealId: "dl-sablewood" },
  { id: "tk-8", title: "Scope the security assessment with Odette Pellham", type: "Call", priority: "Medium", dueAt: "@+3d", ownerId: "imani", status: "open", contactId: "ct-odette", companyId: "co-pellham", dealId: "dl-pellham" },
  { id: "tk-9", title: "Review statements of work waiting on the practice", type: "To-do", priority: "Medium", dueAt: "@+2d", ownerId: "omar", status: "open" },
  { id: "tk-10", title: "Email Hugo Lindqvist the migration discovery questions", type: "Email", priority: "Low", dueAt: "@+4d", ownerId: "soledad", status: "open", contactId: "ct-hugo", companyId: "co-marlinspike", dealId: "dl-marlinspike" },
];

const activities: Activity[] = [
  // Ashgrove Design Partners: the Guided quote hero.
  { id: "ac-1", at: "@-1d", type: "call", title: "Call with Maya Castellanos", body: "100 people across three studios. Wants the 24x7 help desk and onsite visits, plus managed detection and response for their cyber insurance. Open to a three-year term for a better price.", byId: "tessa", contactIds: ["ct-maya"], companyIds: ["co-ashgrove"], dealIds: ["dl-ashgrove"] },
  { id: "ac-2", at: "@-4h", type: "email", title: "Email from Maya Castellanos: Managed IT proposal", body: "Our current provider's contract ends in ten weeks. Can you start in eight? Please send the proposal with the monthly cost and the onboarding project.", byId: null, contactIds: ["ct-maya"], companyIds: ["co-ashgrove"], dealIds: ["dl-ashgrove"] },
  { id: "ac-3", at: "@-5d", type: "meeting", title: "Discovery meeting", body: "Walked the Raleigh studio with Devon Pryce. Three sites, one firewall each, file server in Raleigh. Devon will stay on as the internal contact.", byId: "tessa", contactIds: ["ct-devon", "ct-maya"], companyIds: ["co-ashgrove"], dealIds: ["dl-ashgrove"] },
  { id: "ac-4", at: "@-12d", type: "deal", title: "Deal created", body: "Ashgrove Design Partners: Managed IT for three studios was created in Scoping.", byId: "tessa", companyIds: ["co-ashgrove"], dealIds: ["dl-ashgrove"] },
  // Thornbury Legal Group: the Discount approval hero.
  { id: "ac-10", at: "@-1d", type: "quote", title: "Quote Q-5241 created", body: "Draft statement of work: 380 hours at the rate card, $67,800.", byId: "tessa", contactIds: ["ct-celia"], companyIds: ["co-thornbury"], dealIds: ["dl-thornbury"], linkPath: "/quotes/q-5241", linkLabel: "View quote" },
  { id: "ac-11", at: "@-1d", type: "email", title: "Email from Celia Thornbury: Re: Migration statement of work Q-5241", body: "Another firm has offered a blended rate of about $157 an hour. We would rather keep the work with you. Can you match it?", byId: null, contactIds: ["ct-celia"], companyIds: ["co-thornbury"], dealIds: ["dl-thornbury"] },
  { id: "ac-12", at: "@-9d", type: "deal", title: "Deal created", body: "Thornbury Legal Group: Document management migration was created in Scoping.", byId: "tessa", companyIds: ["co-thornbury"], dealIds: ["dl-thornbury"] },
  { id: "ac-13", at: "@-11d", type: "call", title: "Call with Rashid Mahmoud", body: "Confirmed 2.1 million documents on the file server and 150 users to move. Rashid wants the cutover on a weekend.", byId: "tessa", contactIds: ["ct-rashid"], companyIds: ["co-thornbury"], dealIds: ["dl-thornbury"] },
  // Wexcombe Plastics: the Back-office hero.
  { id: "ac-20", at: "@-1d", type: "email", title: "Email from Joel Banerjee: 25 new people in Greer", body: "We are adding a second shift office in Greer: 25 people starting next month. They need laptops and to be on the managed service. Can you add them to our contract?", byId: null, contactIds: ["ct-joel"], companyIds: ["co-wexcombe"] },
  { id: "ac-21", at: "@-8d", type: "sync", title: "Invoice INV-61190 issued", body: "Synced from the finance system: managed services for the month, $19,847.00. Due in 22 days.", byId: null, companyIds: ["co-wexcombe"] },
  { id: "ac-22", at: "@-14d", type: "call", title: "Call with Harriet Lindgren", body: "Harriet is happy with the service and wants one renewal date for everything on the contract.", byId: "tessa", contactIds: ["ct-harriet"], companyIds: ["co-wexcombe"] },
  { id: "ac-23", at: "@-41d", type: "deal", title: "Deal won", body: "Wexcombe Plastics: Warehouse wireless refresh moved to Signed.", byId: "tessa", contactIds: ["ct-joel"], companyIds: ["co-wexcombe"], dealIds: ["dl-wexcombe-wireless"] },
  { id: "ac-24", at: "@-269d", type: "deal", title: "Deal won", body: "Wexcombe Plastics: Managed IT Complete moved to Signed.", byId: "tessa", contactIds: ["ct-harriet"], companyIds: ["co-wexcombe"], dealIds: ["dl-wexcombe-complete"] },
  // Oriel Park Senior Living: the AI prospecting hero.
  { id: "ac-30", at: "@-6d", type: "email", title: "Email from Vivian Achterberg: New communities", body: "The three communities we acquired in South Carolina come onto our network this year. I will need your help planning it once our new CIO has started.", byId: null, contactIds: ["ct-vivian"], companyIds: ["co-orielpark"] },
  { id: "ac-31", at: "@-120d", type: "call", title: "Call with Desmond Farrow", body: "Left a voicemail about the hardware price list for next year.", byId: "tessa", contactIds: ["ct-desmond"], companyIds: ["co-orielpark"] },
  { id: "ac-32", at: "@-217d", type: "deal", title: "Deal won", body: "Oriel Park Senior Living: Managed network and help desk moved to Signed.", byId: "tessa", contactIds: ["ct-vivian"], companyIds: ["co-orielpark"], dealIds: ["dl-orielpark"] },
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
    body: d ? `Talked through the scope for ${d.name.split(": ")[1].toLowerCase()} and next steps.` : `Shared how other ${co.industry.toLowerCase()} organisations use managed IT and asked what is planned for this year.`,
    byId: c.ownerId,
    ...ids,
  });
  if (d) {
    activities.push({ id: `ac-g${i}b`, at: d.createdAt, type: "deal", title: "Deal created", body: `${d.name} was created.`, byId: d.ownerId, ...ids });
  }
  activities.push({ id: `ac-g${i}c`, at: c.createdAt, type: "lifecycle", title: "Contact created", body: `${c.firstName} ${c.lastName} was created from ${c.source === "Organic search" ? "organic search" : `a ${c.source?.toLowerCase() ?? "list import"}`}.`, byId: null, contactIds: [c.id], companyIds: [co.id] });
});

export const professionalServicesPack: Pack = {
  vertical: { id: "professional-services", name: "Professional and IT services" },
  portal: { company: "Quillon Technology Partners", domain: "quillontech.example", hubId: "48213464", currency: "USD", address: ["Charlotte, NC 28202", "United States"] },
  personas: [
    { id: "tessa", name: "Tessa Marlow", title: "Account Executive, Southeast", email: "tessa.marlow@quillontech.example", viewAs: "Rep", color: "#0b6e6e" },
    { id: "omar", name: "Omar Haddad", title: "Practice Lead, Professional Services", email: "omar.haddad@quillontech.example", viewAs: "Practice lead", color: "#8a3ffc" },
    { id: "imani", name: "Imani Okoro", title: "Security Consultant, Southeast", email: "imani.okoro@quillontech.example", viewAs: "Imani, security practice", color: "#b8500a" },
    { id: "grant", name: "Grant Lavelle", title: "Account Executive, Midwest", email: "grant.lavelle@quillontech.example", viewAs: "Grant, managed services", color: "#1565c0" },
    { id: "soledad", name: "Soledad Ruiz", title: "Solutions Architect, Cloud and Projects", email: "soledad.ruiz@quillontech.example", viewAs: "Soledad, cloud practice", color: "#5d6b2f" },
  ],
  defaultPersonaId: "tessa",
  terms: { quote: "Proposal", product: "Service", backOffice: "PSA" },
  // Stage ids are the demo engine's keys. Labels follow a services deal from inquiry to signature.
  stages: [
    { id: "new-rfq", label: "New Inquiry", probability: 10 },
    { id: "qualified", label: "Scoping", probability: 30 },
    { id: "quote-sent", label: "Proposal Sent", probability: 50 },
    { id: "negotiation", label: "Contract Review", probability: 80 },
    { id: "closed-won", label: "Signed", probability: 100, closed: "won" },
    { id: "closed-lost", label: "Closed Lost", probability: 0, closed: "lost" },
  ],
  companies,
  contacts,
  deals,
  products,
  quotes,
  tasks,
  notifications: [
    { id: "nt-1", personaId: "tessa", at: "@-2d", kind: "mention", title: "Omar Haddad mentioned you", body: "On Ravensworth Building Supply: Branch firewall refresh: \"Rate card is fine for this one. No approval needed.\"", path: "/deals/dl-ravensworth", read: true },
    { id: "nt-2", personaId: "tessa", at: "@-3d", kind: "task", title: "Task due today", body: "Send the managed IT proposal to Maya Castellanos", path: "/tasks", read: true },
    { id: "nt-3", personaId: "omar", at: "@-13d", kind: "approved", title: "You approved a quote", body: "Q-5237 for Cinderford Foods, 5% discount.", path: "/quotes/q-5237", read: true },
    { id: "nt-4", personaId: "grant", at: "@-1d", kind: "task", title: "Task due today", body: "Call August Calderwood about the renewal terms", path: "/tasks", read: true },
  ],
  activities,
  threads,
  workflows: [
    {
      id: "wf-assessment-routing",
      name: "Inbound | Assessment request routing",
      object: "Contact",
      status: "On",
      enrolled: 1184,
      createdAt: "@-380d",
      updatedAt: "@-9d",
      description: "Scores every Request an assessment submission and routes it by practice area, then region.",
      trunk: [
        { id: "n-trigger", kind: "trigger", label: "Contact enrollment trigger", detail: "Form submission: Request an assessment" },
        { id: "n-enrich", kind: "action", label: "Enrich company", detail: "Fill industry, employee count, revenue, and technologies in use" },
        { id: "n-score", kind: "action", label: "Update lead score", detail: "Fit and engagement score, 0 to 100" },
        { id: "n-route", kind: "action", label: "Route by practice area and region", detail: "Custom action: looks up the owner in the practice and region table", extId: "territory-routing" },
        { id: "n-branch", kind: "branch", label: "Branch on routing result" },
      ],
      branches: [
        {
          id: "field",
          label: "Security practice",
          rule: "Security and compliance, score 40 or more",
          nodes: [
            { id: "f-owner", kind: "action", label: "Set contact owner", detail: "Security consultant for the region" },
            { id: "f-deal", kind: "action", label: "Create deal", detail: "Pipeline: Services. Stage: New Inquiry" },
            { id: "f-task", kind: "action", label: "Create task", detail: "Call within 1 hour. High priority" },
            { id: "f-alert", kind: "action", label: "Send Slack notification", detail: "#practice-security, with score and reasons" },
          ],
        },
        {
          id: "inside",
          label: "Managed services practice",
          rule: "Managed IT services, score 40 or more",
          nodes: [
            { id: "i-owner", kind: "action", label: "Set contact owner", detail: "Account executive for the region" },
            { id: "i-deal", kind: "action", label: "Create deal", detail: "Pipeline: Services. Stage: New Inquiry" },
            { id: "i-task", kind: "action", label: "Create task", detail: "Call today. Medium priority" },
            { id: "i-alert", kind: "action", label: "Send Slack notification", detail: "#practice-managed-services" },
          ],
        },
        {
          id: "small",
          label: "Cloud and projects practice",
          rule: "Cloud and infrastructure projects, score 40 or more",
          nodes: [
            { id: "s-owner", kind: "action", label: "Set contact owner", detail: "Solutions architect for the region" },
            { id: "s-deal", kind: "action", label: "Create deal", detail: "Pipeline: Services. Stage: New Inquiry" },
            { id: "s-task", kind: "action", label: "Create task", detail: "Send the discovery questions today" },
          ],
        },
        {
          id: "nurture",
          label: "Nurture",
          rule: "Score under 40",
          nodes: [
            { id: "u-stage", kind: "action", label: "Set lifecycle stage", detail: "Subscriber" },
            { id: "u-seq", kind: "action", label: "Enroll in workflow", detail: "Marketing | IT health checklist nurture" },
          ],
        },
      ],
    },
    { id: "wf-proposal-followup", name: "Proposal Sent | Proposal follow-up", object: "Deal", status: "On", enrolled: 412, createdAt: "@-340d", updatedAt: "@-25d", description: "Creates a follow-up task three days after a proposal is shared." },
    { id: "wf-nurture", name: "Marketing | IT health checklist nurture", object: "Contact", status: "On", enrolled: 3860, createdAt: "@-590d", updatedAt: "@-66d", description: "Sends the IT health checklist to contacts who are not ready for an assessment." },
    { id: "wf-renewal", name: "Renewals | 120-day renewal notice", object: "Company", status: "On", enrolled: 143, createdAt: "@-300d", updatedAt: "@-98d", description: "Notifies the owner and creates a renewal deal 120 days before a contract renews." },
    { id: "wf-handoff", name: "Signed | Hand off to delivery", object: "Deal", status: "On", enrolled: 268, createdAt: "@-310d", updatedAt: "@-47d", description: "Creates the onboarding project and notifies the delivery manager when a deal is signed." },
    { id: "wf-qbr", name: "Customers | Quarterly review reminder", object: "Company", status: "Off", enrolled: 59, createdAt: "@-450d", updatedAt: "@-180d", description: "Reminds the owner to book a quarterly business review with each managed customer." },
  ],
  signals: [
    { id: "sg-orielpark", companyId: "co-orielpark", title: "Network equipment near end of support, and a new CIO", source: "PSA asset inventory and company news", at: "@-1d", strength: "High", summary: "22 firewalls and switches reach end of support in 120 days. A new CIO started this month, after an acquisition of three communities.", hero: true },
    { id: "sg-calderwood", companyId: "co-calderwood", title: "Proposal viewed five times", source: "Quote activity", at: "@-2d", strength: "Medium", summary: "Q-5235 was opened by two new viewers." },
    { id: "sg-sablewood", companyId: "co-sablewood", title: "Pricing page visits", source: "Website activity", at: "@-2d", strength: "Medium", summary: "Three contacts read the managed IT pricing page this week." },
    { id: "sg-pennywell", companyId: "co-pennywell", title: "Hiring a compliance officer", source: "Job postings", at: "@-4d", strength: "Medium", summary: "A new role mentions a security audit due before year end." },
    { id: "sg-ravensworth", companyId: "co-ravensworth", title: "Two new branches announced", source: "Company news", at: "@-6d", strength: "Medium", summary: "Opening branches in Norfolk and Roanoke next spring." },
    { id: "sg-eastlake", companyId: "co-eastlake", title: "Webinar attendance", source: "Event attendance", at: "@-9d", strength: "Medium", summary: "The controller joined the cyber insurance readiness webinar." },
  ],
  quoteTerms: [
    "Managed services run for the term shown and renew for 12 months unless either party gives 60 days' notice.",
    "Payment terms: net 30, with managed services invoiced monthly in advance.",
    "Hourly work is invoiced monthly as worked, at the rates shown. Work outside this scope needs a signed change order.",
    "Hardware and licences are invoiced on shipment. Pricing is valid for 30 days.",
  ],
  extensions,
  labels: {
    pipeline: "Services pipeline",
    territory: "Region",
    timing: "Billing and delivery",
    // Not "First-year total": a statement of work or a change order for hardware has no recurring year.
    quoteTotal: "Proposal total",
    agent: {
      timing: "How is each line billed and delivered?",
      files: [
        {
          name: "Service level agreement.pdf",
          question: "What are your response times?",
          answer: "Critical issues get a response within 15 minutes, around the clock. Standard requests are answered within four business hours.",
          keywords: ["response", "sla", "service level", "support hours", "help desk"],
        },
        {
          name: "Onboarding runbook.pdf",
          question: "How does onboarding work?",
          answer: "Onboarding runs as a fixed project: discovery, tooling rollout, and a documented handover to the service desk.",
          keywords: ["onboarding", "transition", "handover", "rollout", "runbook"],
        },
        {
          name: "Master services agreement.pdf",
          question: "Can we end the managed services early?",
          answer: "Managed services renew for 12 months unless either party gives 60 days' notice. The master services agreement sets out the terms for ending early.",
          keywords: ["cancel", "terminate", "end early", "notice", "msa", "master services"],
        },
      ],
    },
    document: {
      heading: "Proposal",
      ref: "Proposal ref.",
      total: "Proposal total",
      summary: "{seller} will provide the services and equipment below for {buyer}: {count} line items, {total}. Managed services are priced per year.",
      cover: "Thank you for the chance to put this proposal together. The services and pricing below cover everything we discussed, {count} line items in all. If anything needs to change, reply to this email and I will send a revised proposal the same day.",
    },
    recurring: { annual: "Annual managed services", oneTime: "One-time project and hardware" },
    synced: {
      title: "PSA Sync",
      account: "PSA Account Number",
      lastOrder: "PSA Contract Renewal Date",
      openBalance: "PSA Open Balance",
      status: "PSA Account Status",
    },
  },
  stepNotes: {
    "guided-quote": {
      requirements: { hint: "Choose service tier, security add-on, sites, term, users, and start date" },
    },
    "discount-approval": {
      discount: { title: "Discount the hourly rates by 12%" },
    },
    "back-office": {
      company: { hint: "Companies: click Wexcombe Plastics. Synced PSA fields and the Services and finance card are on the record" },
      orders: { title: "Expand a contract", hint: "Contracts tab: click a contract row" },
      balance: { title: "Check invoices and unbilled work", hint: "Click the Invoices tab" },
      stock: { title: "Check capacity, start a change order", hint: "Capacity and stock tab: tick four items, then Add to change order" },
      send: { hint: "The change order is prefilled at the contract rates. Click Preview, then Share" },
    },
    "lead-capture": {
      form: { title: "Submit the assessment request", hint: "Pick one of the three leads, then Request an assessment" },
    },
    "email-to-deal": {
      create: { title: "Confirm the flagged item, create the deal", hint: "Pick the suggested match for the flagged line, then Create deal" },
      deal: { hint: "Click View deal. Hardware, licence, and service lines, amount, and close date are filled. The email is on the timeline" },
    },
  },
  demos,
  reports: {
    "it-service-desk-analytics": itServiceDeskReport,
  },
};
