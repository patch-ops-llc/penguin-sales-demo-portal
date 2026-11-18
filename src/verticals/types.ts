import type { DemoId } from "./catalog";

/**
 * A vertical pack is plain JSON: everything a vertical needs to flavor the six demo templates.
 * Dates are written as offsets from "now" ("@-3d", "@+2w", "@-90mi") and resolved when the pack
 * loads in the browser, so timelines never look stale.
 */

export type Persona = {
  id: string;
  name: string;
  title: string;
  email: string;
  /** Label used in the demo bar's "View as" menu. */
  viewAs: string;
  color: string;
};

export type ErpSummary = {
  accountNumber: string;
  lastOrderDate: string;
  openBalance: number;
  creditStatus: string;
  creditLimit: number;
};

export type Company = {
  id: string;
  name: string;
  domain: string;
  industry: string;
  type: string;
  city: string;
  state: string;
  employees: number | null;
  revenue: number | null;
  phone: string;
  ownerId: string | null;
  lifecycle: string;
  createdAt: string;
  lastActivityAt: string;
  description?: string;
  territory?: string;
  /** The three fields synced from the back-office system, shown at the top of the record. */
  erp?: ErpSummary;
  enrichedAt?: string;
  isNew?: boolean;
};

export type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  companyId: string | null;
  ownerId: string | null;
  lifecycle: string;
  leadStatus: string;
  createdAt: string;
  lastActivityAt: string;
  source?: string;
  score?: number;
  isNew?: boolean;
};

export type LineItem = {
  sku: string;
  name: string;
  description?: string;
  qty: number;
  unitPrice: number;
  unitCost: number;
  leadDays: number;
};

export type Deal = {
  id: string;
  name: string;
  companyId: string;
  contactIds: string[];
  ownerId: string | null;
  stage: string;
  amount: number;
  closeDate: string;
  createdAt: string;
  lastActivityAt: string;
  type: string;
  lineItems: LineItem[];
  source?: string;
  isNew?: boolean;
};

export type Product = {
  sku: string;
  name: string;
  family: string;
  price: number;
  cost: number;
  leadDays: number;
  onHand: number;
};

export type QuoteStatus = "Draft" | "Pending approval" | "Approved" | "Sent" | "Accepted";

export type QuoteApproval = {
  status: "pending" | "approved";
  requestedAt: string;
  requestedById: string;
  approverId: string;
  decidedAt?: string;
  reasons: string[];
  discountPct: number;
};

export type Quote = {
  id: string;
  number: string;
  title: string;
  dealId: string;
  companyId: string;
  contactId: string;
  ownerId: string;
  status: QuoteStatus;
  lineItems: LineItem[];
  discountPct: number;
  createdAt: string;
  validUntil: string;
  sentAt?: string;
  acceptedAt?: string;
  approval?: QuoteApproval;
  origin?: string;
  isNew?: boolean;
};

export type Task = {
  id: string;
  title: string;
  type: "Call" | "Email" | "To-do";
  priority: "High" | "Medium" | "Low";
  dueAt: string;
  ownerId: string;
  status: "open" | "done";
  contactId?: string;
  companyId?: string;
  dealId?: string;
  notes?: string;
  isNew?: boolean;
};

export type Notification = {
  id: string;
  personaId: string;
  at: string;
  kind: "lead" | "approval" | "approved" | "task" | "mention";
  title: string;
  body: string;
  /** Shell path the notification opens. */
  path: string;
  read: boolean;
  /** When set, the notification panel shows the matching alert outside HubSpot as a picture. */
  slack?: { channel: string; text: string };
};

export type ActivityType = "note" | "email" | "call" | "meeting" | "task" | "form" | "quote" | "deal" | "workflow" | "lifecycle" | "sync";

export type Activity = {
  id: string;
  at: string;
  type: ActivityType;
  title: string;
  body?: string;
  byId?: string | null;
  contactIds?: string[];
  companyIds?: string[];
  dealIds?: string[];
  /** Shell path for a "View" link on the timeline card. */
  linkPath?: string;
  linkLabel?: string;
  attachment?: string;
};

export type DealStage = { id: string; label: string; probability: number; closed?: "won" | "lost" };

export type Extension = {
  /** Matches the id on the <Ext> wrapper in the screen. */
  id: string;
  name: string;
  /**
   * The one flag to change while the native versus Penguin split is being confirmed.
   * "penguin" puts the callout on the element and lists it under Built by Penguin on the end card.
   * "native" removes the callout and lists it under Native HubSpot.
   */
  by: "penguin" | "native";
  /** One short line on what Penguin built there. Shown in the callout and on the end card. */
  note?: string;
};

// ---------- Guided quote ----------

export type GqOption = {
  id: string;
  label: string;
  hint?: string;
  /** Free-form attributes that line templates read, such as a SKU code, a price adder, or a lead time. */
  attrs?: Record<string, string | number>;
};

export type GqField = { id: string; label: string; help?: string; options: GqOption[] };

export type GqConstraint = {
  /** Applies when every listed field has one of the listed options selected. */
  when: Record<string, string[]>;
  field: string;
  disable: string[];
  reason: string;
};

export type GqLineTemplate = {
  role: string;
  /** "{field.attr}" placeholders are filled from the selected options. */
  sku: string;
  name: string;
  description: string;
  /** Unit price = (base + sum of the named attrs) x product of the named multiplier attrs. */
  price: { base: number; add: string[]; multiply: string[] };
  /** Unit cost as a share of the unit price. */
  costRatio: number;
  /** Lead time in days = base + sum of the named attrs. */
  lead: { base: number; add: string[] };
  qtyPerUnit: number;
};

export type GuidedQuoteConfig = {
  dealId: string;
  contactId: string;
  intro: string;
  fields: GqField[];
  quantity: { label: string; options: number[] };
  needBy: { label: string; options: { id: string; label: string; days: number }[] };
  constraints: GqConstraint[];
  lines: GqLineTemplate[];
  /** Notes shown under the generated lines when the selection matches. */
  notes: { when: Record<string, string[]>; text: string }[];
  /** The choices the Next button makes when the rep lets the script drive. */
  scripted: { selections: Record<string, string>; quantity: number; needBy: string };
  quoteTitle: string;
};

// ---------- Discount approval ----------

export type DiscountApprovalConfig = {
  quoteId: string;
  /** HubSpot's own approval setting: a quote discount over this needs approval. */
  thresholdPct: number;
  /** Minimum margin that sets each product's floor price from its unit cost. */
  marginFloorPct: number;
  approverId: string;
  scriptedDiscountPct: number;
};

// ---------- Back-office data ----------

export type ErpOrder = {
  id: string;
  number: string;
  date: string;
  status: string;
  po: string;
  total: number;
  lines: { sku: string; name: string; qty: number; unitPrice: number }[];
};

export type ErpInvoice = { id: string; number: string; date: string; dueDate: string; amount: number; balance: number; status: "Paid" | "Open" | "Overdue" };

export type ErpStockItem = { sku: string; name: string; onHand: number; leadDays: number; contractPrice: number; listPrice: number; unitCost: number; lastOrdered: string; usualQty: number };

export type BackOfficeConfig = {
  companyId: string;
  contactId: string;
  systemLabel: string;
  syncedAt: string;
  orders: ErpOrder[];
  invoices: ErpInvoice[];
  stock: ErpStockItem[];
  scriptedSkus: string[];
  scriptedOrderId: string;
  quoteTitle: string;
  dealName: string;
};

// ---------- Lead capture ----------

export type LeadPreset = {
  id: string;
  label: string;
  outcome: string;
  form: { firstName: string; lastName: string; email: string; phone: string; title: string; company: string; interest: string; message: string };
  company: {
    domain: string;
    industry: string;
    city: string;
    state: string;
    employees: number;
    revenue: number;
    phone: string;
    description: string;
    territory: string;
    type: string;
  };
  score: number;
  reasons: { label: string; points: number; detail: string }[];
  route: { branchId: string; ownerId: string | null; summary: string };
  task?: { title: string; dueInMinutes: number; notes: string };
  deal?: { name: string; amount: number };
  alert?: { channel: string; text: string };
};

export type WorkflowNode = {
  id: string;
  kind: "trigger" | "action" | "branch" | "end";
  label: string;
  detail?: string;
  /** Marks a custom workflow action in the extension registry. */
  extId?: string;
};

export type WorkflowBranch = { id: string; label: string; rule: string; nodes: WorkflowNode[] };

export type Workflow = {
  id: string;
  name: string;
  object: string;
  status: "On" | "Off";
  enrolled: number;
  createdAt: string;
  updatedAt: string;
  description: string;
  /** Present only on workflows a demo opens. */
  trunk?: WorkflowNode[];
  branches?: WorkflowBranch[];
};

export type LeadCaptureConfig = {
  site: { company: string; url: string; headline: string; sub: string; formTitle: string; interests: string[] };
  presets: LeadPreset[];
  scriptedPresetId: string;
  workflowId: string;
  dealStage: string;
};

// ---------- Email to deal ----------

export type ParsedField = { id: string; label: string; value: string; confidence: "high" | "medium" | "low" };

export type ParsedLine = {
  id: string;
  raw: string;
  qty: number;
  /** Null when the parser could not match the part; the rep picks one of the suggestions. */
  sku: string | null;
  suggestions?: { sku: string; why: string }[];
  confidence: "high" | "medium" | "low";
};

/** Email body as segments, so a parsed field can light up the text it came from. */
export type BodySegment = { text: string; field?: string };

export type InboxThread = {
  id: string;
  from: { name: string; email: string };
  companyId: string | null;
  contactId: string | null;
  subject: string;
  preview: string;
  at: string;
  unread: boolean;
  body: BodySegment[];
  attachment?: { name: string; kind: string; title: string; lines: string[] };
  /** Present on the sample emails the Email to deal demo uses. */
  parsed?: {
    quality: string;
    summary: string;
    fields: ParsedField[];
    lines: ParsedLine[];
    dealName: string;
    closeInDays: number;
    newCompany?: { name: string; domain: string; industry: string; city: string; state: string };
    newContact?: { firstName: string; lastName: string; title: string; phone: string };
  };
};

export type EmailToDealConfig = { sampleIds: string[]; scriptedThreadId: string; dealStage: string };

// ---------- AI prospecting ----------

export type ProspectSignal = {
  id: string;
  companyId: string;
  title: string;
  source: string;
  at: string;
  strength: "High" | "Medium";
  summary: string;
  /** Marks the hero account for the demo. */
  hero?: boolean;
};

export type BuyingGroupMember = {
  id: string;
  name: string;
  title: string;
  role: string;
  email: string;
  /** Existing contact id, or null for a person the agent found. */
  contactId: string | null;
  why: string;
};

export type OutreachDraft = { tone: string; subject: string; body: string };

/** The two signals on the hero account: the one fed in from the back office, and one HubSpot finds itself. */
export type ProspectSignalDetail = {
  fed: { title: string; source: string; detail: string; bars: { label: string; value: number; unit: string; now?: boolean }[]; footnote: string };
  native: { title: string; source: string; detail: string; footnote: string };
};

export type AiProspectingConfig = {
  companyId: string;
  signalDetail?: ProspectSignalDetail;
  whyNow: { headline: string; points: { label: string; detail: string; source: string }[] };
  buyingGroup: BuyingGroupMember[];
  /** Three prepared versions per person, keyed by buying-group member id. */
  drafts: Record<string, OutreachDraft[]>;
  followUp: { title: string; dueInDays: number };
};

// ---------- Pack ----------

export type Pack = {
  vertical: { id: string; name: string };
  portal: { company: string; domain: string; hubId: string; currency: string };
  personas: Persona[];
  defaultPersonaId: string;
  /** `request` names the inbound document a buyer sends, for example RFQ. Defaults to "Request". */
  terms: { quote: string; product: string; backOffice: string; request?: string };
  stages: DealStage[];
  companies: Company[];
  contacts: Contact[];
  deals: Deal[];
  products: Product[];
  quotes: Quote[];
  tasks: Task[];
  notifications: Notification[];
  activities: Activity[];
  threads: InboxThread[];
  workflows: Workflow[];
  signals: ProspectSignal[];
  quoteTerms: string[];
  /** Per demo: every element named on the end card, and the flag that marks it as Penguin or native. */
  extensions: Record<DemoId, Extension[]>;
  demos: {
    guidedQuote: GuidedQuoteConfig;
    discountApproval: DiscountApprovalConfig;
    backOffice: BackOfficeConfig;
    leadCapture: LeadCaptureConfig;
    emailToDeal: EmailToDealConfig;
    aiProspecting: AiProspectingConfig;
  };
};
