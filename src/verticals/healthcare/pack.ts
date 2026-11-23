import type { Activity, Company, Contact, Deal, LineItem, Pack, Product, Quote, Task } from "../types";
import { clinicServiceAnalyticsReport } from "./customer-agent";
import { demos } from "./demos";
import { extensions } from "./extensions";
import { threads } from "./inbox";
import { patientSatisfactionReport } from "./post-visit-feedback";
import { healthcareReports } from "./intake-reports";
import { reports } from "./reports";

// Healthcare vertical pack: Crestline Clinical Staffing.
// Covers healthcare staffing (travel RNs, ICU/ER nurses, allied health) and specialty clinic networks.
// Every hospital, clinic, person, and figure is invented sample data. Zero real patient info (zero PHI).
// Structured cleanly so additional Healthcare use cases (clinic front desk, referral intake,
// referral-source outreach, patient reactivation, post-visit feedback, staffing job orders) can be added later.

export const products: Product[] = [
  { sku: "CC-RN-ICU", name: "Travel ICU Registered Nurse (13-week placement)", family: "Critical Care Nursing", price: 28000, cost: 21000, leadDays: 2, onHand: 18, timing: "13 weeks" },
  { sku: "CC-RN-ER", name: "Travel ER Registered Nurse (13-week placement)", family: "Critical Care Nursing", price: 27400, cost: 20550, leadDays: 2, onHand: 14, timing: "13 weeks" },
  { sku: "CC-RN-TELE", name: "Travel Telemetry Registered Nurse (13-week placement)", family: "Acute Care Nursing", price: 24800, cost: 18600, leadDays: 3, onHand: 22, timing: "13 weeks" },
  { sku: "CC-RN-PACU", name: "Outpatient PACU / Pre-Op RN (13-week placement)", family: "Specialty Clinics", price: 25600, cost: 19200, leadDays: 3, onHand: 9, timing: "13 weeks" },
  { sku: "CC-ALLIED-ST", name: "Certified Surgical Technologist (13-week placement)", family: "Allied Health", price: 21200, cost: 15900, leadDays: 4, onHand: 11, timing: "13 weeks" },
  { sku: "CC-ALLIED-RT", name: "Respiratory Therapist, Critical Care (13-week placement)", family: "Allied Health", price: 22400, cost: 16800, leadDays: 3, onHand: 8, timing: "13 weeks" },
  { sku: "CC-CRED-FAST", name: "Rapid 48-Hour Joint Commission Credentialing Pack", family: "Compliance Services", price: 1200, cost: 450, leadDays: 2, onHand: 99, timing: "One-time" },
];

function line(sku: string, qty: number, unitPrice?: number): LineItem {
  const p = products.find((x) => x.sku === sku);
  if (!p) throw new Error(`Unknown SKU in healthcare seed: ${sku}`);
  return { sku, name: p.name, qty, unitPrice: unitPrice ?? p.price, unitCost: p.cost, leadDays: p.leadDays, ...(p.timing ? { timing: p.timing } : {}) };
}

function total(lines: LineItem[]): number {
  return lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0);
}

type CompanySeed = [id: string, name: string, domain: string, industry: string, type: string, city: string, state: string, employees: number, revenueM: number, ownerId: string, lifecycle: string, createdDaysAgo: number, lastDaysAgo: number, territory: string];

const companySeeds: CompanySeed[] = [
  ["co-mercy-pines", "Mercy Pines Health System", "mercypineshealth.example", "Hospital & Health Care", "Customer", "Denver", "CO", 2100, 580, "marcus", "Customer", 420, 1, "Mountain West"],
  ["co-ridgecrest", "Ridgecrest Specialty Clinics", "ridgecrestclinics.example", "Outpatient Specialty Clinics", "Customer", "Scottsdale", "AZ", 680, 145, "devon", "Customer", 310, 1, "Southwest"],
  ["co-cascadia-med", "Cascadia Regional Medical", "cascadiamed.example", "Hospital & Health Care", "Prospect", "Tacoma", "WA", 1650, 440, "marcus", "Opportunity", 64, 1, "Pacific Northwest"],
  ["co-redwood-health", "Redwood Valley Health", "redwoodvalleyhealth.example", "Hospital & Health Care", "Customer", "Sacramento", "CA", 1280, 350, "marcus", "Customer", 290, 2, "West"],
  ["co-northstar-cardio", "Northstar Heart & Vascular", "northstarcardio.example", "Specialty Cardiology Clinics", "Customer", "Minneapolis", "MN", 420, 110, "devon", "Customer", 510, 4, "Midwest"],
  ["co-silverline-er", "Silverline Urgent & Trauma Care", "silverlinecare.example", "Emergency & Urgent Care", "Prospect", "Austin", "TX", 790, 195, "marcus", "Opportunity", 38, 2, "South Central"],
  ["co-bayside-ortho", "Bayside Orthopedic Institute", "baysideortho.example", "Specialty Surgery & Rehab", "Customer", "Tampa", "FL", 340, 88, "devon", "Customer", 240, 5, "Southeast"],
  ["co-oakridge-clinic", "Oakridge Behavioral Health", "oakridgebehavioral.example", "Behavioral Health Clinics", "Prospect", "Raleigh", "NC", 510, 92, "devon", "Lead", 19, 6, "Southeast"],
  ["co-harborview-peds", "Harborview Children's Specialty", "harborviewpeds.example", "Pediatric Specialty Network", "Customer", "Boston", "MA", 940, 260, "marcus", "Customer", 615, 7, "Northeast"],
  ["co-prairie-oncology", "Prairie Winds Oncology Group", "prairiewindsoncology.example", "Outpatient Oncology Clinics", "Prospect", "Omaha", "NE", 310, 76, "devon", "Lead", 27, 3, "Midwest"],
  ["co-summit-creek", "Summit Creek Family Medicine", "summitcreekmed.example", "Primary Care & Family Medicine", "Partner", "Denver", "CO", 115, 28, "devon", "Customer", 380, 1, "Mountain West"],
];

const companies: Company[] = companySeeds.map(([id, name, domain, industry, type, city, state, employees, revenueM, ownerId, lifecycle, created, last, territory], i) => ({
  id,
  name,
  domain,
  industry,
  type,
  city,
  state,
  employees,
  revenue: revenueM * 1_000_000,
  phone: `(555) 01${String(70 + i).padStart(2, "0")}-${String(2400 + i * 53).slice(0, 4)}`,
  ownerId,
  lifecycle,
  createdAt: `@-${created}d`,
  lastActivityAt: `@-${last}d`,
  territory,
  extra: [{ label: "Facility tier", value: employees >= 1000 ? "Health system" : "Specialty clinic group" }],
}));

function company(id: string): Company {
  const c = companies.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown company in healthcare seed: ${id}`);
  return c;
}

company("co-mercy-pines").description = "Three-hospital regional health system across Colorado Front Range. Active travel ICU and ER staffing partner.";
company("co-mercy-pines").erp = { accountNumber: "CC-VMS-4012", lastOrderDate: "@-18d", openBalance: 24800, creditStatus: "Current", creditLimit: 250000 };
company("co-ridgecrest").description = "Multi-specialty outpatient clinic group operating 14 orthopedic, cardiology, and ambulatory surgery centers.";
company("co-cascadia-med").description = "Acute care hospital system expanding critical care ICU capacity by 18 beds this spring.";
company("co-summit-creek").description = "Three-location primary care and internal medicine referring practice in metro Denver; recently opened its Lakewood clinic.";

type ContactSeed = [id: string, first: string, last: string, title: string, companyId: string, lifecycle: string, leadStatus: string, createdDaysAgo: number, lastDaysAgo: number, source: string];

const contactSeeds: ContactSeed[] = [
  ["ct-karen", "Karen", "Holloway", "Director of Nursing", "co-mercy-pines", "Customer", "Connected", 418, 1, "Paid Search"],
  ["ct-tanya", "Tanya", "Brooks", "Clinic Practice Manager", "co-ridgecrest", "Customer", "Connected", 308, 1, "Organic Social"],
  ["ct-hannah", "Hannah", "Kowalski", "VP Clinical Operations", "co-cascadia-med", "Opportunity", "In progress", 64, 1, "Paid Social"],
  ["ct-david", "David", "Alverez", "Chief Nursing Officer", "co-redwood-health", "Customer", "Connected", 288, 2, "Paid Social"],
  ["ct-benjamin", "Benjamin", "Osei", "Director of Outpatient Operations", "co-northstar-cardio", "Customer", "Connected", 505, 4, "Paid Search"],
  ["ct-priya", "Priya", "Subramanian", "Emergency Nurse Manager", "co-silverline-er", "Opportunity", "In progress", 38, 2, "Organic Social"],
  ["ct-lauren", "Lauren", "Gallagher", "Surgery Center Administrator", "co-bayside-ortho", "Customer", "Connected", 238, 5, "Paid Search"],
  ["ct-samuel", "Samuel", "Whitaker", "Clinical Recruiting Lead", "co-oakridge-clinic", "Lead", "Open", 19, 6, "Paid Social"],
  ["ct-miriam", "Miriam", "Goldstein", "VP Nursing Workforce", "co-harborview-peds", "Customer", "Connected", 610, 7, "Referral"],
  ["ct-derek", "Derek", "Lindstrom", "Workforce Staffing Coordinator", "co-prairie-oncology", "Lead", "New", 27, 3, "Organic Social"],
  ["ct-jordan-vance", "Jordan", "Vance", "Clinic Visitor · Scottsdale Location", "co-ridgecrest", "Customer", "Connected", 120, 0, "Post-Visit Survey"],
  ["ct-martha", "Martha", "Lindholm", "Practice & Office Manager", "co-summit-creek", "Customer", "Connected", 365, 2, "Referral Network"],
  ["ct-owen", "Owen", "Gallagher", "Medical Director, DO", "co-summit-creek", "Customer", "Connected", 375, 4, "Referral Network"],
];

const contacts: Contact[] = [
  ...contactSeeds.map(([id, firstName, lastName, title, companyId, lifecycle, leadStatus, created, last, source], i) => ({
    id,
    firstName,
    lastName,
    email: id === "ct-jordan-vance" ? "jordan.vance@desertmesa.example" : `${firstName}.${lastName}@${company(companyId).domain}`.toLowerCase(),
    phone: `(555) 01${String(80 + i).padStart(2, "0")}-${String(5100 + i * 37).slice(0, 4)}`,
    title,
    companyId,
    ownerId: id === "ct-jordan-vance" ? "valerie" : company(companyId).ownerId,
    lifecycle,
    leadStatus,
    createdAt: `@-${created}d`,
    lastActivityAt: `@-${last}d`,
    source,
    ...(id === "ct-jordan-vance"
      ? {
          extra: [
            { label: "Clinic location", value: "Scottsdale Orthopedic Center (AZ-04)" },
            { label: "Data boundary", value: "Service experience only · Zero PHI" },
          ],
        }
      : {}),
  })),
  {
    id: "ct-camila",
    firstName: "Camila",
    lastName: "Reyes",
    email: "camila.reyes@patientmail.example",
    phone: "(555) 0199-4410",
    title: "Clinic Member (Fictional Sample)",
    companyId: null,
    ownerId: "claire",
    lifecycle: "Customer",
    leadStatus: "Overdue > 12 months",
    createdAt: "@-540d",
    lastActivityAt: "@-15d",
    source: "EHR Eligibility Sync (Non-PHI)",
    extra: [
      { label: "Preferred clinic", value: "Denver — Cherry Creek" },
      { label: "Last visit bucket", value: "12–18 months ago" },
      { label: "Annual visit status", value: "Overdue > 12 months" },
      { label: "Dynamic segment", value: "Overdue > 12 Months — Annual Wellness Visit" },
      { label: "PHI policy", value: "Non-PHI eligibility tokens only" },
    ],
  },
  {
    id: "ct-nora",
    firstName: "Nora",
    lastName: "Castell",
    email: "nora.castell@patientmail.example",
    phone: "(555) 0193-5470",
    title: "Outpatient Visitor (Non-PHI)",
    companyId: "co-ridgecrest",
    ownerId: "devon",
    lifecycle: "Customer",
    leadStatus: "Connected",
    createdAt: "@-42d",
    lastActivityAt: "@-1d",
    source: "Clinic Patient Chat",
    extra: [
      { label: "Clinic campus", value: "Scottsdale Orthopedics · Suite 310" },
      { label: "PHI policy", value: "HubSpot HIPAA/BAA posture · Zero clinical PHI" },
    ],
  },
  {
    id: "ct-elliot",
    firstName: "Elliot",
    lastName: "Morales",
    email: "elliot.morales@patientmail.example",
    phone: "(555) 0194-6620",
    title: "Outpatient Visitor (Non-PHI)",
    companyId: "co-ridgecrest",
    ownerId: "devon",
    lifecycle: "Customer",
    leadStatus: "Connected",
    createdAt: "@-58d",
    lastActivityAt: "@-1d",
    source: "Clinic Patient Chat",
    extra: [
      { label: "Clinic campus", value: "Scottsdale Orthopedics · Suite 310" },
      { label: "PHI policy", value: "HubSpot HIPAA/BAA posture · Zero clinical PHI" },
    ],
  },
];

type DealSeed = [id: string, name: string, companyId: string, contactId: string, stage: string, closeInDays: number, createdDaysAgo: number, type: string, source: string, lines: LineItem[]];

const dealSeeds: DealSeed[] = [
  ["dl-mercy-icu", "Mercy Pines Health System: 4 ICU Travel RNs (Q1 Surge)", "co-mercy-pines", "ct-karen", "negotiation", 9, 14, "Job order", "Google Search Ads · Q1 Travel RN & ICU Surge Staffing", [line("CC-RN-ICU", 4), line("CC-CRED-FAST", 1)]],
  ["dl-cascadia-icu", "Cascadia Regional Medical: 5 ICU Night-Shift RNs", "co-cascadia-med", "ct-hannah", "qualified", 18, 12, "Job order", "LinkedIn Paid Social · Q1 Travel RN & ICU Surge Staffing", [line("CC-RN-ICU", 5)]],
  ["dl-redwood-tele", "Redwood Valley Health: 5 Telemetry Travel RNs", "co-redwood-health", "ct-david", "quote-sent", 12, 9, "Job order", "LinkedIn Paid Social · Q1 Travel RN & ICU Surge Staffing", [line("CC-RN-TELE", 5)]],
  ["dl-ridgecrest-cst", "Ridgecrest Specialty Clinics: 2 Surgical Techs (OR Suite)", "co-ridgecrest", "ct-tanya", "qualified", 21, 7, "Job order", "Organic Social · Specialty Clinic Allied Health Hiring", [line("CC-ALLIED-ST", 2), line("CC-RN-PACU", 1)]],
  ["dl-silverline-er", "Silverline Urgent & Trauma Care: 4 ER Travel RNs", "co-silverline-er", "ct-priya", "new-rfq", 25, 6, "Job order", "Google Search Ads · Q1 Travel RN & ICU Surge Staffing", [line("CC-RN-ER", 4)]],
  ["dl-bayside-pacu", "Bayside Orthopedic Institute: 2 PACU Travel RNs", "co-bayside-ortho", "ct-lauren", "closed-won", -14, 42, "Job order", "Google Search Ads · Specialty Clinic Allied Health Hiring", [line("CC-RN-PACU", 2)]],
  ["dl-harborview-rt", "Harborview Children's Specialty: 3 Respiratory Therapists", "co-harborview-peds", "ct-miriam", "closed-won", -28, 60, "Job order", "LinkedIn Paid Social · Joint Commission Fast-Track Credentialing", [line("CC-ALLIED-RT", 3)]],
];

const deals: Deal[] = dealSeeds.map(([id, name, companyId, contactId, stage, closeIn, created, type, source, lineItems]) => ({
  id,
  name,
  companyId,
  contactIds: [contactId],
  ownerId: company(companyId).ownerId,
  stage,
  amount: total(lineItems),
  closeDate: closeIn >= 0 ? `@+${closeIn}d` : `@${closeIn}d`,
  createdAt: `@-${created}d`,
  lastActivityAt: `@-${Math.min(created, 3)}d`,
  type,
  source,
  lineItems,
}));

function deal(id: string): Deal {
  const d = deals.find((x) => x.id === id);
  if (!d) throw new Error(`Unknown deal in healthcare seed: ${id}`);
  return d;
}

const quotes: Quote[] = [
  {
    id: "q-4102",
    number: "Q-4102",
    title: deal("dl-mercy-icu").name,
    dealId: "dl-mercy-icu",
    companyId: "co-mercy-pines",
    contactId: "ct-karen",
    ownerId: "marcus",
    status: "Draft",
    lineItems: deal("dl-mercy-icu").lineItems.map((l) => ({ ...l })),
    discountPct: 0,
    createdAt: "@-2d",
    validUntil: "@+28d",
  },
  {
    id: "q-4101",
    number: "Q-4101",
    title: deal("dl-redwood-tele").name,
    dealId: "dl-redwood-tele",
    companyId: "co-redwood-health",
    contactId: "ct-david",
    ownerId: "marcus",
    status: "Sent",
    lineItems: deal("dl-redwood-tele").lineItems.map((l) => ({ ...l })),
    discountPct: 3,
    createdAt: "@-6d",
    validUntil: "@+24d",
    sentAt: "@-5d",
  },
];

const tasks: Task[] = [
  { id: "tk-hc-1", title: "Review Q1 Travel RN campaign creative drafts before publishing", type: "To-do", priority: "High", dueAt: "@+0d", ownerId: "claire", status: "open" },
  { id: "tk-hc-2", title: "Send 4 night-shift ICU RN profiles to Karen Holloway", type: "Email", priority: "High", dueAt: "@+0d", ownerId: "marcus", status: "open", contactId: "ct-karen", companyId: "co-mercy-pines", dealId: "dl-mercy-icu" },
  { id: "tk-hc-3", title: "Share Washington CCRN availability with Dr. Hannah Kowalski", type: "Call", priority: "Medium", dueAt: "@+1d", ownerId: "marcus", status: "open", contactId: "ct-hannah", companyId: "co-cascadia-med", dealId: "dl-cascadia-icu" },
  { id: "tk-hc-4", title: "Send outpatient CST rate card to Tanya Brooks", type: "Email", priority: "Medium", dueAt: "@+2d", ownerId: "devon", status: "open", contactId: "ct-tanya", companyId: "co-ridgecrest", dealId: "dl-ridgecrest-cst" },
];

const activities: Activity[] = [
  { id: "ac-hc-1", at: "@-3h", type: "email", title: "Email from Karen Holloway: Updated Q1 ICU & Telemetry shift schedule", body: "Requested 4 additional night-shift ICU travel RNs for a 13-week winter assignment.", byId: null, contactIds: ["ct-karen"], companyIds: ["co-mercy-pines"], dealIds: ["dl-mercy-icu"] },
  { id: "ac-hc-2", at: "@-1d", type: "call", title: "Call with Dr. Hannah Kowalski", body: "Confirmed Joint Commission credentialing packet meets Cascadia's vendor tier standards.", byId: "marcus", contactIds: ["ct-hannah"], companyIds: ["co-cascadia-med"], dealIds: ["dl-cascadia-icu"] },
  { id: "ac-hc-3", at: "@-2d", type: "quote", title: "Quote Q-4102 created", body: "Draft staffing order quote for 4 ICU Travel RNs.", byId: "marcus", contactIds: ["ct-karen"], companyIds: ["co-mercy-pines"], dealIds: ["dl-mercy-icu"], linkPath: "/quotes/q-4102", linkLabel: "View quote" },
  { id: "ac-hc-4", at: "@-5d", type: "deal", title: "Deal created", body: "Redwood Valley Health: 5 Telemetry Travel RNs created from LinkedIn Paid Social inquiry.", byId: "marcus", contactIds: ["ct-david"], companyIds: ["co-redwood-health"], dealIds: ["dl-redwood-tele"] },
  { id: "ac-hc-5", at: "@-14d", type: "note", title: "Clinic welcome & non-PHI preference confirmed", body: "Nora Castell opted into Scottsdale Clinic logistics & scheduling updates. HubSpot HIPAA/BAA posture: operational contact only, zero clinical PHI stored.", byId: "devon", contactIds: ["ct-nora"], companyIds: ["co-ridgecrest"] },
  { id: "ac-hc-6", at: "@-6d", type: "note", title: "Prior logistics chat — Scottsdale PT parking & check-in", body: "Breeze Customer Agent answered Elliot Morales's parking validation and check-in timing question from Clinic KB before his visit (zero PHI stored).", byId: null, contactIds: ["ct-elliot"], companyIds: ["co-ridgecrest"] },
];

export const healthcarePack: Pack = {
  vertical: { id: "healthcare", name: "Healthcare" },
  portal: {
    company: "Crestline Clinical Staffing & Specialty Clinics",
    domain: "crestlineclinical.example",
    hubId: "54208139",
    currency: "USD",
    address: ["Crestline Clinical Staffing & Specialty Clinics LLC", "1640 Blake St, Suite 420", "Denver, CO 80202"],
  },
  personas: [
    { id: "claire", name: "Claire Bennett", title: "Marketing Manager", email: "claire.bennett@crestlineclinical.example", viewAs: "Marketer", color: "#0b6e6e" },
    { id: "marcus", name: "Marcus Delgado", title: "Healthcare Staffing Account Executive", email: "marcus.delgado@crestlineclinical.example", viewAs: "Marcus, Staffing AE", color: "#b8500a" },
    { id: "naomi", name: "Naomi Okafor", title: "VP of Recruiting & Operations", email: "naomi.okafor@crestlineclinical.example", viewAs: "VP Recruiting", color: "#8a3ffc" },
    { id: "devon", name: "Devon Patel", title: "Clinical Account Manager", email: "devon.patel@crestlineclinical.example", viewAs: "Devon, Clinical AM", color: "#1565c0" },
    { id: "valerie", name: "Valerie Chen", title: "Clinic Location Manager — Scottsdale", email: "valerie.chen@crestlineclinical.example", viewAs: "Valerie, Clinic Manager", color: "#0b7a4b" },
  ],
  defaultPersonaId: "claire",
  terms: { quote: "Staffing Proposal", product: "Staffing Package", backOffice: "ATS / VMS", request: "Job Order" },
  stages: [
    { id: "new-rfq", label: "Staffing Request", probability: 15 },
    { id: "qualified", label: "Shortlist Sent", probability: 40 },
    { id: "quote-sent", label: "Interviews", probability: 65 },
    { id: "negotiation", label: "Credentialing & Offer", probability: 85 },
    { id: "closed-won", label: "Placed", probability: 100, closed: "won" },
    { id: "closed-lost", label: "Closed Lost", probability: 0, closed: "lost" },
  ],
  companies,
  contacts,
  deals,
  products,
  quotes,
  tasks,
  notifications: [
    { id: "nt-hc-1", personaId: "claire", at: "@-28mi", kind: "mention", title: "New LinkedIn comment on Winter ICU Census Playbook", body: "Dr. Hannah Kowalski (Cascadia Regional Medical) asked about Washington CCRN night-shift availability.", path: "/social/inbox", read: false },
    { id: "nt-hc-2", personaId: "marcus", at: "@-3h", kind: "task", title: "Task due today", body: "Send 4 night-shift ICU RN profiles to Karen Holloway", path: "/tasks", read: true },
  ],
  activities,
  threads,
  workflows: [
    {
      id: "wf-staffing-followup",
      name: "Inbound | Paid & Social Staffing Lead Follow-Up",
      object: "Contact",
      status: "On",
      enrolled: 164,
      createdAt: "@-120d",
      updatedAt: "@-4d",
      description: "Captures ad & campaign attribution on staffing form submissions, sends an immediate confirmation email, and alerts the Healthcare Staffing AE.",
      trunk: [
        { id: "hc-trigger", kind: "trigger", label: "Contact enrollment trigger", detail: "Form submission: Request your 48-hour RN shortlist" },
        { id: "hc-attr", kind: "action", label: "Attach campaign and UTM attribution", detail: "Original source, ad network, and campaign property" },
        { id: "hc-email", kind: "action", label: "Send automated follow-up email", detail: "Your 48-hour ICU & ER Travel RN shortlist — Crestline" },
        { id: "hc-notify", kind: "action", label: "Notify Healthcare Staffing AE & create task", detail: "Assign to Marcus Delgado, post Slack alert to #staffing-inbound" },
      ],
    },
    { id: "wf-cred-alert", name: "Operations | 48-Hour Credentialing SLA", object: "Deal", status: "On", enrolled: 84, createdAt: "@-210d", updatedAt: "@-19d", description: "Alerts the recruiting desk if a staffing shortlist is not sent within 24 hours." },
    { id: "wf-ats-sync", name: "Attribution | ATS Placed-Shift Revenue Sync", object: "Deal", status: "On", enrolled: 52, createdAt: "@-95d", updatedAt: "@-2d", description: "Updates HubSpot campaign ROI when a travel nurse placement starts in Bullhorn ATS / VMS." },
    {
      id: "wf-feedback-ticket",
      name: "Service | Low Post-Visit CSAT -> Location Manager Ticket",
      object: "Ticket",
      status: "On",
      enrolled: 31,
      createdAt: "@-140d",
      updatedAt: "@-1d",
      description: "Opens a High-priority Service Hub ticket when a non-PHI post-visit CSAT survey scores <= 3/5 and routes it to the clinic location manager with a 4-hour response SLA.",
      trunk: [
        { id: "fb-trigger", kind: "trigger", label: "Post-visit CSAT survey submitted", detail: "Score <= 3 of 5 (service experience only, zero PHI)" },
        { id: "fb-ticket", kind: "action", label: "Create Service Hub ticket", detail: "Pipeline: Clinic Experience & Feedback · Priority: High" },
        { id: "fb-route", kind: "action", label: "Assign to Clinic Location Manager", detail: "Route by clinic site code (AZ-04 -> Valerie Chen)" },
        { id: "fb-sla", kind: "action", label: "Start 4-hour first-response SLA & notify manager", detail: "In-app alert + follow-up email task" },
      ],
    },
    {
      id: "wf-referral-routing",
      name: "Clinic Intake | Route Specialty Referrals by Location",
      object: "Deal",
      status: "On",
      enrolled: 234,
      createdAt: "@-150d",
      updatedAt: "@-3d",
      description: "Routes incoming non-PHI specialty referrals to the matching clinic location's intake coordinator and creates a same-day scheduling outreach task.",
      trunk: [
        { id: "ref-trigger", kind: "trigger", label: "Deal enrollment trigger", detail: "Referring Clinic Portal form submitted (Specialty Clinic Referral Intake)" },
        { id: "ref-branch", kind: "branch", label: "Branch by clinic location & specialty", detail: "Scottsdale North · Phoenix West · Tempe Specialty Center" },
      ],
      branches: [
        {
          id: "scottsdale",
          label: "Scottsdale North · Cardiology",
          rule: "Location = Scottsdale North Clinic AND Specialty = Cardiology",
          nodes: [
            { id: "ref-sc-owner", kind: "action", label: "Assign deal to Devon Patel", detail: "Scottsdale North Intake Coordinator" },
            { id: "ref-sc-task", kind: "action", label: "Create same-day intake task & Slack alert", detail: "Post to #clinic-intake-scottsdale" },
            { id: "ref-sc-end", kind: "end", label: "Track through Scheduled stage" },
          ],
        },
        {
          id: "other-sites",
          label: "Phoenix West & Tempe Clinics",
          rule: "All other clinic locations & specialties",
          nodes: [
            { id: "ref-ot-owner", kind: "action", label: "Rotate to site intake desk", detail: "Location coordinator queue" },
            { id: "ref-ot-end", kind: "end", label: "Track through Scheduled stage" },
          ],
        },
      ],
    },
    {
      id: "wf-job-order-routing",
      name: "Staffing Ops | Route Hospital Job Orders by Specialty",
      object: "Deal",
      status: "On",
      enrolled: 118,
      createdAt: "@-180d",
      updatedAt: "@-2d",
      description: "Assigns incoming hospital travel-RN job orders to the specialty recruiter, opens a 48-hour shortlist task, and alerts #staffing-critical-care.",
      trunk: [
        { id: "jo-trigger", kind: "trigger", label: "Deal enrollment trigger", detail: "Hospital Staffing Portal job order submitted" },
        { id: "jo-branch", kind: "branch", label: "Branch by clinical specialty", detail: "ICU / ER Critical Care vs Telemetry & Allied Health" },
      ],
      branches: [
        {
          id: "critical-care",
          label: "ICU & ER Critical Care",
          rule: "Specialty is any of ICU Travel RN, ER Travel RN",
          nodes: [
            { id: "jo-cc-owner", kind: "action", label: "Assign job order to Marcus Delgado", detail: "Healthcare Staffing AE — Critical Care" },
            { id: "jo-cc-task", kind: "action", label: "Create 48-hr shortlist task & Slack alert", detail: "Post to #staffing-critical-care" },
            { id: "jo-cc-end", kind: "end", label: "Advance to Placed upon selection" },
          ],
        },
        {
          id: "allied",
          label: "Telemetry, PACU & Allied Health",
          rule: "All other specialties",
          nodes: [
            { id: "jo-al-owner", kind: "action", label: "Assign job order to Devon Patel", detail: "Allied & Specialty Clinics Recruiting" },
            { id: "jo-al-end", kind: "end", label: "Advance to Placed upon selection" },
          ],
        },
      ],
    },
  ],
  signals: [
    {
      id: "sg-summit-creek",
      companyId: "co-summit-creek",
      title: "Quarterly referrals down 34% · New physician & clinic",
      source: "EHR Referral-Volume Feed",
      at: "@-6h",
      strength: "High",
      summary: "Quarterly referrals dropped from 46 to 30 while Dr. Priya Nair joined and Summit Creek opened its Lakewood clinic.",
      hero: true,
    },
    {
      id: "sg-ridgecrest",
      companyId: "co-ridgecrest",
      title: "New orthopedic physician credentialed in Scottsdale",
      source: "NPI & Credentialing Directory",
      at: "@-1d",
      strength: "Medium",
      summary: "Dr. Kenji Takahashi joined Ridgecrest's East Valley clinic; high outpatient imaging & PT referral potential.",
    },
    {
      id: "sg-bayside",
      companyId: "co-bayside-ortho",
      title: "Second outpatient clinic location opened",
      source: "Health system news",
      at: "@-2d",
      strength: "Medium",
      summary: "Opened a 12-exam-room ambulatory center in Westshore with new orthopedic consult capacity.",
    },
  ],
  quoteTerms: [
    "All-in weekly bill rates in US dollars, valid for 30 days.",
    "Standard assignment term is 13 weeks at 36 hours per week; extensions billed at locked contract rate.",
    "Joint Commission credentialing packets are delivered prior to clinician start date.",
    "HIPAA Business Associate Agreement (BAA) governs all facility staffing coordination.",
  ],
  extensions,
  stepNotes: {
    "ai-prospecting": {
      signal: {
        title: "Open the flagged practice",
        hint: "Prospecting: click Summit Creek Family Medicine to view EHR referral-drop, new physician, and clinic signals",
      },
      "why-now": {
        title: "Review why now",
        hint: "Click Why now to inspect all three referring-practice signals synthesized by Breeze",
      },
      group: {
        title: "See the practice contacts",
        hint: "Click Buying group to view the newly credentialed physician, office manager, and medical director",
      },
      draft: {
        title: "Draft outreach by role",
        hint: "Click Draft outreach for Breeze to tailor emails to the referring physician and practice manager",
      },
      send: {
        title: "Approve and send outreach",
        hint: "Liaison reviews drafts and clicks Approve and send all 3",
      },
    },
  },
  labels: {
    pipeline: "Healthcare staffing pipeline",
    territory: "Region",
    timing: "Assignment",
    synced: {
      title: "ATS / VMS Sync",
      account: "VMS Account ID",
      lastOrder: "Last Job Order",
      openBalance: "Open Staffing Balance",
      status: "Account Status",
    },
  },
  reports: {
    ...reports,
    ...healthcareReports,
    "patient-satisfaction": patientSatisfactionReport,
    "clinic-service-analytics": clinicServiceAnalyticsReport,
  },
  demos,
};
