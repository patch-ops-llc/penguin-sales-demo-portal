import type { IntakeDemoId, IntakeFlowConfig } from "@/shell/intake/types";
import type { RenewalFlowConfig, RenewalsDemoId } from "@/shell/renewals/types";
import type { BranchLaunchConfig, PatientReactivationConfig, SocialAdsConfig } from "@/shell/social/types";
import type { TicketsDemoConfig } from "@/shell/tickets/types";
import type { AnalyticsCreditsOutcome, AnalyticsReportSpec } from "./analytics-types";
import type { DemoId } from "./catalog";

export type { IntakeDemoId, IntakeFlowConfig, IntakeFollowupOption, IntakeFormField, IntakeMode, IntakeReviewItem, IntakeTone } from "@/shell/intake/types";
export type {
  ContractRenewalConfig,
  PremiumToSubscriptionConfig,
  RenewalChurnRiskConfig,
  RenewalFlowConfig,
  RenewalsDemoId,
} from "@/shell/renewals/types";

export type {
  TicketChecklistItem,
  TicketExternalCard,
  TicketImpactedAccount,
  TicketMode,
  TicketOffPlatformScreen,
  TicketPriority,
  TicketQueueSeed,
  TicketsDemoConfig,
  TicketSecondaryOffPlatform,
  TicketSlaInfo,
  TicketStage,
} from "@/shell/tickets/types";

export type {
  AnalyticsBreakdownPanel,
  AnalyticsBreakdownRow,
  AnalyticsCreditsBreakdownRow,
  AnalyticsCreditsOutcome,
  AnalyticsFilterGroup,
  AnalyticsFilterOption,
  AnalyticsKpi,
  AnalyticsReportSpec,
  AnalyticsTable,
  AnalyticsTableColumn,
  AnalyticsTableRow,
  AnalyticsTone,
} from "./analytics-types";

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

/** An extra property on a record, for facts only some verticals have: tech stack, consent, segment. */
export type ExtraProp = { label: string; value: string };

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
  extra?: ExtraProp[];
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
  extra?: ExtraProp[];
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
  /** Shown in the lead-time column instead of "<leadDays> days", for lines that are not shipped goods: "Billed annually", "60 months". */
  timing?: string;
  /** Marks a line that repeats every year, so quote totals can show annual recurring revenue. */
  recurring?: boolean;
  /** Unit discount on this line, in percent. When unset, the quote's `discountPct` applies to the line. */
  discountPct?: number;
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
  /** Optional custom pipeline label and stages for multi-pipeline verticals (e.g. Specialty Referral Intake). */
  pipelineName?: string;
  pipelineStages?: DealStage[];
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
  /** Shown in the lead-time column instead of "<leadDays> days". */
  timing?: string;
  recurring?: boolean;
};

/** "Sent" is a published quote: HubSpot shows it as "Published". Use `quoteStatusLabel` for display. */
export type QuoteStatus = "Draft" | "Pending approval" | "Changes requested" | "Approved" | "Sent" | "Accepted";

export type QuoteApproval = {
  status: "pending" | "approved" | "changes_requested";
  requestedAt: string;
  requestedById: string;
  approverId: string;
  decidedAt?: string;
  reasons: string[];
  discountPct: number;
  /** The requester's "Notes to approver". */
  note?: string;
  /** The approver's message on approval, or the changes they asked for. */
  feedback?: string;
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
  /** Total discount in percent. With no unit discounts set on the lines, it applies to every line. */
  discountPct: number;
  createdAt: string;
  validUntil: string;
  sentAt?: string;
  acceptedAt?: string;
  approval?: QuoteApproval;
  origin?: string;
  /** Id of the selected option in the approval rule's terms list, when the vertical has one. */
  termsId?: string;
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

export type ActivityType = "note" | "email" | "call" | "meeting" | "task" | "form" | "quote" | "deal" | "workflow" | "lifecycle" | "sync" | "chat";

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
  /**
   * "{field.attr}" placeholders are filled from the selected options, and "{quantity}" from the quantity answer.
   * Placeholders nest, so "{cost.financed{down.code}}" picks an attribute by a second answer.
   */
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
  /** Include the line only when every listed field has one of the listed options selected. */
  when?: Record<string, string[]>;
  /** A fixed quantity, for lines that do not scale with the quantity question (a one-time onboarding package). */
  qtyFixed?: number;
  /** Apply the config's quantity breaks to this line's unit price. */
  volume?: boolean;
  /** Filled like `name`, then shown in the lead-time column instead of a number of days. */
  timing?: string;
  recurring?: boolean;
};

/** Wording of the Guided quote card. Every key is optional in a pack; Manufacturing's wording is the default. */
export type GuidedLabels = {
  /** "{backOffice}" is the vertical's back-office term. */
  source: string;
  /** Heading of the column that shows a line's lead time or, for lines that are not shipped goods, its `timing`. */
  timing: string;
  /** "{lead}" days until ready, "{need}" the chosen need-by label, "{days}" its length. */
  leadCheck: string;
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
  /** Volume pricing: the highest break at or under the chosen quantity multiplies the unit price of `volume` lines. */
  quantityBreaks?: { from: number; multiplier: number; note: string }[];
  labels?: Partial<GuidedLabels>;
  /** Optional shared Analytics report linked from the hero deal and generated quote. */
  reportId?: string;
  reportLabel?: string;
};

// ---------- Discount approval ----------

/** Wording of the approval rule where a vertical's differs. Manufacturing's wording is the default. */
export type ApprovalLabels = {
  /** The approval step's message to the approver: "{criteria}", "{approver}", "{title}". */
  rule: string;
  /** Each kind of criteria as the message words it, so the message follows the criteria that are set. "{limit}" is the discount limit. */
  ruleDiscount: string;
  ruleFloor: string;
  ruleTerms: string;
  /** The message when no criteria are set. */
  ruleNone: string;
  /** Where the floor price comes from: "{backOffice}", "{when}". */
  costFeed: string;
  /** What the quote-level percentage off is called: "Discount", or "Rate exception" for a lender. */
  discount: string;
};

/** A second approval trigger that is a choice on the quote rather than a number, such as payment terms. */
export type TermsRule = {
  label: string;
  /** HubSpot's name for the quote property behind the choice, where it differs from the label on the quote. */
  property?: string;
  options: { id: string; label: string; standard: boolean }[];
  /** The option a quote has until another is chosen. */
  defaultId: string;
  /** Reason shown when a non-standard option is chosen. "{term}" is the option's label. */
  reason: string;
};

/** The kinds of criteria the approval rule can have. */
export type ApprovalFilterId = "discount" | "floor" | "terms";

export type DiscountApprovalConfig = {
  quoteId: string;
  /** HubSpot's own approval setting: a quote discount over this needs approval. */
  thresholdPct: number;
  /** The criteria that are set. Defaults to every kind the vertical has. */
  filters?: ApprovalFilterId[];
  /** Minimum margin that sets each product's floor price from its unit cost. */
  marginFloorPct: number;
  approverId: string;
  scriptedDiscountPct: number;
  /** Lines the scripted discount goes on, by SKU. Defaults to every line. */
  scriptedSkus?: string[];
  terms?: TermsRule;
  labels?: Partial<ApprovalLabels>;
  /** Optional shared Analytics report linked from the approval quote. */
  reportId?: string;
  reportLabel?: string;
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

export type ErpStockItem = {
  sku: string;
  name: string;
  onHand: number;
  leadDays: number;
  contractPrice: number;
  listPrice: number;
  unitCost: number;
  lastOrdered: string;
  usualQty: number;
  /** When set, the on-hand column shows usage against this limit: seats used of seats licensed, hours used of hours contracted. */
  capacity?: number;
  /** Prepared text for the on-hand column, for usage that is not a plain count: "$650,000 of $1,000,000". */
  usage?: string;
  /** Shown in the lead-time column instead of "<leadDays> days". */
  timing?: string;
  recurring?: boolean;
};

/** Wording of the back-office card and of what it creates. Manufacturing's wording is the default. */
export type BackOfficeLabels = {
  /** "{system}" is the card's system label, "{when}" how long ago it was read. */
  live: string;
  tabs: { orders: string; balance: string; stock: string };
  orders: { number: string; date: string; po: string; status: string; total: string };
  balance: { open: string; overdue: string; limit: string; status: string; invoice: string };
  stock: { onHand: string; none: string; nearLimit: string; timing: string; contract: string; list: string; last: string };
  add: { button: string; help: string; lineNote: string; origin: string; dealType: string };
};

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
  labels?: DeepPartial<BackOfficeLabels>;
  /** Optional threshold alert banner (e.g. SaaS seat-limit alert when customer hits seat cap). */
  usageAlert?: {
    badge: string;
    headline: string;
    detail: string;
    ctaTab?: "orders" | "balance" | "stock";
    ctaLabel?: string;
  };
  /** Optional shared Analytics report linked from the back-office card (e.g. Expansion MRR by account). */
  reportLink?: { reportId: string; label: string };
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
    /** Extra facts enrichment fills on the company, such as tech stack. */
    extra?: ExtraProp[];
  };
  /** Extra facts the form captures on the contact, such as consent. */
  contactExtra?: ExtraProp[];
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

export type LeadAssessmentFinding = {
  id: string;
  severity: "Critical" | "High" | "Medium";
  title: string;
  detail: string;
  remediation: string;
};

/** Optional trailing assessment-to-proposal arc on Lead Capture (e.g. IT Services #6). */
export type LeadAssessmentFollowUp = {
  channelLabel: string;
  windowTitle: string;
  inboxAddress: string;
  senderName: string;
  senderTitle: string;
  senderEmail: string;
  callSummaryTitle: string;
  callSummaryBody: string;
  emailSubject: string;
  emailPreview: string;
  emailBody: string;
  attachmentName: string;
  attachmentMeta: string;
  findings: LeadAssessmentFinding[];
  proposalTitle: string;
  proposalStage?: string;
  proposalLines: { sku: string; qty: number; unitPrice?: number; note?: string }[];
  reportId: string;
  reportLabel: string;
};

export type LeadCaptureConfig = {
  site: {
    company: string;
    url: string;
    headline: string;
    sub: string;
    formTitle: string;
    interests: string[];
    /** Wording of the public page, where it differs from Manufacturing's request-a-quote page. The last nav item is the current page. */
    nav?: string[];
    interestLabel?: string;
    messageLabel?: string;
    submit?: string;
    thanks?: { routed: string; nurture: string };
    /** A consent line shown ticked on the form. */
    consent?: string;
  };
  presets: LeadPreset[];
  scriptedPresetId: string;
  workflowId: string;
  dealStage: string;
  /** Optional findings-report email -> proposal quote -> funnel report trailing arc. */
  assessmentFollowUp?: LeadAssessmentFollowUp;
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
  /** Unit price by SKU, for a line priced from the request rather than the product library: a payment worked out from an invoice total. */
  prices?: Record<string, number>;
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
    /** Who the deal is for, when that is not the sender: a vendor or broker writing on behalf of a borrower. Defaults to the thread's company and contact. */
    dealFor?: { companyId: string; contactIds: string[] };
    newCompany?: { name: string; domain: string; industry: string; city: string; state: string };
    newContact?: { firstName: string; lastName: string; title: string; phone: string };
  };
};

/** Wording of the inbox and the parsed request card. Manufacturing's wording is the default. */
export type EmailLabels = {
  /** Shown in the inbox before a conversation is opened. */
  empty: string;
  /** Above the suggestions for a line the parser could not match. */
  flagged: string;
  /** Under the Create deal button while a line is still unmatched. */
  confirm: string;
  total: string;
  dealType: string;
};

export type EmailToDealConfig = { sampleIds: string[]; scriptedThreadId: string; dealStage: string; labels?: Partial<EmailLabels> };

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
  fed: {
    /** Extension id for `<Ext>`. Defaults to `"erp-signal"`. */
    extId?: string;
    title: string;
    source: string;
    detail: string;
    bars: { label: string; value: number; unit: string; now?: boolean }[];
    footnote: string;
  };
  native: { title: string; source: string; detail: string; footnote: string };
};

/** Optional off-platform inbox & meeting booking handoff after outreach is sent. */
export type ProspectOffPlatformMeeting = {
  inboxEmail: string;
  recipientName: string;
  recipientTitle: string;
  practiceName: string;
  senderName: string;
  senderTitle: string;
  meetingTitle: string;
  meetingLocation: string;
  meetingDuration: string;
  bookingUrl: string;
  agenda: string[];
  slots: { id: string; day: string; time: string; tz: string }[];
  defaultSlotId: string;
  complianceNote?: string;
  /** Optional vertical wording overrides (Healthcare lunch-and-learn copy is the default). */
  channelLabel?: string;
  mailClientName?: string;
  inboxHeader?: string;
  inboxBreadcrumb?: string;
  openButtonLabel?: string;
  bookedButtonLabel?: string;
  slotHeading?: string;
  slotPrompt?: string;
  confirmButtonLabel?: string;
  confirmedHeadline?: string;
  bookingForLabel?: string;
  reportButtonLabel?: string;
  /** Optional HubSpot deal opened automatically when the prospect confirms the meeting (IT Services / simple form). */
  dealCreated?: { id: string; name: string; amount: number; stage: string };
  /** When set, booking the meeting automatically opens a native HubSpot Deal with line items (SaaS PQL form). */
  createsDeal?: {
    id: string;
    name: string;
    amount: number;
    stage: string;
    closeInDays: number;
    type?: string;
    lineItems: { sku: string; qty: number }[];
  };
};

export type AiProspectingConfig = {
  companyId: string;
  signalDetail?: ProspectSignalDetail;
  whyNow: { headline: string; points: { label: string; detail: string; source: string }[] };
  buyingGroup: BuyingGroupMember[];
  /** Three prepared versions per person, keyed by buying-group member id. */
  drafts: Record<string, OutreachDraft[]>;
  followUp: { title: string; dueInDays: number };
  /** Optional off-platform inbox & meeting booking step (Healthcare lunch-and-learn, IT CIO review, or SaaS PQL demo). */
  offPlatformMeeting?: ProspectOffPlatformMeeting;
  /** Optional shared Analytics report id opened at the end of the flow. */
  reportId?: string;
  /** Optional CTA label for the report button. */
  reportLabel?: string;
  reportButtonLabel?: string;
};

/** SaaS #2 (`pql-trial-prospecting`): Free-trial product milestone -> PQL score bump -> Breeze Prospecting -> meeting & deal -> conversion report. */
export type PqlTrialConfig = {
  companyId: string;
  contactId: string;
  signal: ProspectSignal;
  initialScore: number;
  pqlScore: number;
  initialLifecycle: string;
  pqlLifecycle: string;
  pqlLeadStatus: string;
  trialApp: {
    workspaceName: string;
    workspaceUrl: string;
    planLabel: string;
    trialDayLabel: string;
    headline: string;
    intro: string;
    milestones: { id: string; label: string; detail: string; status: "done" | "trigger"; metric: string }[];
    ctaLabel: string;
    syncCard: {
      extId: string;
      title: string;
      badge: string;
      subtitle: string;
      eventName: string;
      fields: { label: string; value: string }[];
      footnote: string;
    };
  };
  prospecting: AiProspectingConfig;
};

// ---------- Customer agent (fintech omnichannel) ----------

export type ServiceChannel = "chat" | "email" | "voice";

export type CustomerAgentTransfer = {
  id: string;
  recipient: string;
  amount: number;
  method: string;
  initiatedAt: string;
  status: "Pending" | "Completed" | "Scheduled";
  expectedSettlement: string;
  cutoffNote: string;
  complianceStatus: string;
};

export type CustomerAgentChatCase = {
  id: string;
  contactId: string;
  companyId: string;
  appUrl: string;
  accountNumber: string;
  accountName: string;
  availableBalance: number;
  pendingBalance: number;
  customerQuestion: string;
  quickPrompts: string[];
  transfers: CustomerAgentTransfer[];
  pendingTransferId: string;
  securityCheck: {
    method: string;
    challenge: string;
    customerProof: string;
    verifiedBadge: string;
    auditRef: string;
  };
  agentResolution: string;
  customerReply: string;
  creditsUsed: number;
};

export type CustomerAgentEmailCase = {
  id: string;
  contactId: string;
  companyId: string;
  fromName: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  body: string;
  priorAlert: {
    from: string;
    subject: string;
    at: string;
    preview: string;
    body: string;
  };
  card: {
    last4: string;
    holder: string;
    merchant: string;
    location: string;
    amount: number;
    postedAt: string;
    authCode: string;
    status: string;
  };
  ticketNumber: string;
  ticketSubject: string;
  ticketPipeline: string;
  ticketStage: string;
  agentReply: string;
  disputeSteps: string[];
  creditsUsed: number;
};

export type VoiceTranscriptLine = {
  id: string;
  speaker: "customer" | "agent";
  name: string;
  time: string;
  text: string;
  phase: "opening" | "verify" | "unlock";
};

export type CustomerAgentVoiceCase = {
  id: string;
  contactId: string;
  companyId: string;
  supportNumber: string;
  callerNumber: string;
  accountNumber: string;
  lockReason: string;
  failedAttempts: number;
  lockedAt: string;
  duration: string;
  verificationCode: string;
  unlockRef: string;
  unlockSteps: string[];
  transcript: VoiceTranscriptLine[];
  timelineSummary: string;
  creditsUsed: number;
};

export type UnifiedHistoryEntry = {
  id: string;
  channel: ServiceChannel;
  at: string;
  actor: string;
  actorRole: "Customer" | "Breeze Customer Agent" | "System Alert";
  subject: string;
  body: string;
  meta: string;
};

export type CustomerAgentFraudCase = {
  id: string;
  ticketId: string;
  ticketNumber: string;
  contactId: string;
  companyId: string;
  ownerId: string;
  accountNumber: string;
  subject: string;
  priority: "High" | "Urgent";
  pipeline: string;
  stage: string;
  customerMessage: string;
  agentAck: string;
  riskSignals: { label: string; severity: "Critical" | "High"; detail: string }[];
  holdDetails: {
    wireRef: string;
    amount: number;
    beneficiary: string;
    cardLast4: string;
    holdId: string;
    status: string;
  };
  handoffSummary: {
    headline: string;
    verifiedIdentity: string;
    actionsTaken: string[];
    recommendedNext: string[];
  };
  unifiedHistory: UnifiedHistoryEntry[];
  defaultRepReply: string;
  creditsUsed: number;
};

export type ServiceDashboardPeriod = {
  id: "30d" | "7d" | "90d";
  label: string;
  totalConversations: number;
  autonomousResolved: number;
  resolutionRatePct: number;
  resolutionDelta: string;
  handoffs: number;
  handoffRatePct: number;
  avgHandleSeconds: number;
  csat: number;
  creditsUsed: number;
  creditsAllocated: number;
  channels: {
    channel: ServiceChannel;
    label: string;
    volume: number;
    resolved: number;
    handoffs: number;
    resolutionPct: number;
    credits: number;
    avgSeconds: number;
  }[];
  trend: { label: string; resolutionPct: number; volume: number }[];
  handoffReasons: { reason: string; count: number; pct: number }[];
};

export type CustomerAgentKbArticle = {
  id: string;
  title: string;
  category: string;
  excerpt: string;
};

export type CustomerAgentScheduleOption = {
  slotLabel: string;
  clinicLocation: string;
  provider: string;
  bookingUrl: string;
  confirmationCode: string;
  timelineTitle: string;
  timelineBody: string;
};

export type CustomerAgentExternalCard = {
  extId: string;
  title: string;
  badge: string;
  badgeTone?: "blue" | "purple" | "teal" | "green";
  subtitle?: string;
  rows: { label: string; value: string; tone?: "green" | "amber" | "red" | "blue" | "teal" | "purple" }[];
  resolvedRows?: { label: string; value: string; tone?: "green" | "amber" | "red" | "blue" | "teal" | "purple" }[];
};

export type ServiceDeskChatCase = {
  id: string;
  contactId: string;
  companyId: string;
  portalName: string;
  portalSubtitle: string;
  portalUrl: string;
  portalBadge: string;
  accentHex: string;
  complianceNote?: string;
  summaryCards: { label: string; value: string; note: string; tone?: "neutral" | "amber" | "teal" }[];
  referenceListTitle: string;
  referenceItems: { id: string; title: string; meta: string; status: string; tone: "green" | "amber" | "blue" }[];
  customerQuestion: string;
  quickPrompts: string[];
  kbArticles: CustomerAgentKbArticle[];
  agentResolution: string;
  customerFollowUp?: string;
  scheduling?: CustomerAgentScheduleOption;
  externalCard: CustomerAgentExternalCard;
  timelineTitle: string;
  timelineBody: string;
  creditsUsed: number;
};

export type ServiceDeskEmailCase = {
  id: string;
  contactId: string;
  companyId: string;
  clientName: string;
  fromName: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  body: string;
  priorAlert: {
    from: string;
    subject: string;
    at: string;
    preview: string;
    body: string;
    badge: string;
  };
  kbArticles: CustomerAgentKbArticle[];
  agentReply: string;
  ticketNumber: string;
  ticketSubject: string;
  ticketPipeline: string;
  ticketStage: string;
  externalCard: CustomerAgentExternalCard;
  timelineTitle: string;
  timelineBody: string;
  creditsUsed: number;
};

export type ServiceDeskEscalationCase = {
  id: string;
  ticketId: string;
  ticketNumber: string;
  contactId: string;
  companyId: string;
  ownerId: string;
  accountRefLabel: string;
  accountRef: string;
  portalName: string;
  portalSubtitle: string;
  portalUrl: string;
  portalBadge: string;
  accentHex: string;
  complianceNote?: string;
  subject: string;
  priority: "High" | "Urgent";
  pipeline: string;
  stage: string;
  guardrailBanner: {
    title: string;
    badge: string;
    policySummary: string;
    strictNoMedicalAdvice?: boolean;
  };
  customerMessage: string;
  quickPrompts: string[];
  agentAck: string;
  riskSignals: { label: string; severity: "Critical" | "High"; detail: string }[];
  handoffSummary: {
    headline: string;
    verifiedIdentity: string;
    actionsTaken: string[];
    recommendedNext: string[];
  };
  unifiedHistory: UnifiedHistoryEntry[];
  externalCard: CustomerAgentExternalCard;
  defaultRepReply: string;
  repReplyButtonLabel: string;
  repSentHeadline: string;
  notificationTitle: string;
  notificationBody: string;
  timelineTitle: string;
  timelineBody: string;
  creditsUsed: number;
};

export type ServiceDeskDashboardPeriod = ServiceDashboardPeriod & {
  afterHoursPct?: number;
  afterHoursCount?: number;
  medianFrtSeconds?: number;
  humanFrtLabel?: string;
};

export type ServiceDeskCustomerAgentConfig = {
  mode: "clinic-front-desk" | "it-service-desk";
  channels: ServiceChannel[];
  brandSubtitle: string;
  compliancePostureNote?: string;
  chatCase: ServiceDeskChatCase;
  emailCase?: ServiceDeskEmailCase;
  escalationCase: ServiceDeskEscalationCase;
  dashboard: {
    title: string;
    subtitle: string;
    goalPct: number;
    trendFootnote: string;
    creditModelNote: string;
    highlightKpi: "after-hours" | "frt";
    reportId?: string;
    creditsOutcome?: AnalyticsCreditsOutcome;
    periods: Record<"30d" | "7d" | "90d", ServiceDeskDashboardPeriod>;
  };
};

export type FintechCustomerAgentConfig = {
  mode?: "fintech";
  chatCase: CustomerAgentChatCase;
  emailCase: CustomerAgentEmailCase;
  voiceCase: CustomerAgentVoiceCase;
  fraudCase: CustomerAgentFraudCase;
  dashboard: {
    goalPct: number;
    creditModelNote: string;
    periods: Record<"30d" | "7d" | "90d", ServiceDashboardPeriod>;
  };
};

export type CustomerAgentConfig = FintechCustomerAgentConfig | ServiceDeskCustomerAgentConfig;

export function isServiceDeskConfig(cfg: CustomerAgentConfig | undefined): cfg is ServiceDeskCustomerAgentConfig {
  return Boolean(cfg && "mode" in cfg && (cfg.mode === "clinic-front-desk" || cfg.mode === "it-service-desk"));
}

// ---------- Marketing Studio (ICP outreach) ----------

export type MsAssetFormatId = "email" | "blog" | "social" | "landing";

export type MsVoicePreset = {
  id: string;
  name: string;
  tagline: string;
  tonePillars: string[];
  audience: string;
  dos: string[];
  donts: string[];
  sampleLine: string;
};

export type MsSourceAsset = {
  title: string;
  subtitle: string;
  format: string;
  fileName: string;
  fileSize: string;
  author: string;
  publishedLabel: string;
  summary: string;
  keyStats: { value: string; label: string }[];
  chapters: { number: string; title: string; summary: string }[];
};

export type MsRemixedAsset = {
  id: MsAssetFormatId;
  label: string;
  channel: string;
  title: string;
  summary: string;
  creditsUsed: number;
  voiceScore: number;
  headline: string;
  subheadline?: string;
  body: string;
  cta?: string;
  meta: { label: string; value: string }[];
};

export type MsOutreachRecipient = {
  contactId: string;
  role: string;
  priority: "Primary buyer" | "Technical evaluator" | "Economic buyer";
  personalizationAngle: string;
  sendWindow: string;
  subject: string;
  previewText: string;
  body: string;
  ctaLabel: string;
};

export type MsPlanTouch = {
  day: string;
  channel: string;
  title: string;
  detail: string;
  credits: number;
};

export type MarketingStudioConfig = {
  companyId: string;
  primaryContactId: string;
  marketer: { name: string; title: string; email: string; color: string };
  repId: string;
  campaignName: string;
  icp: {
    tier: string;
    score: number;
    matchedSignals: { label: string; value: string; points: number }[];
    buyingRoles: { contactId: string; role: string; influence: string }[];
  };
  brief: {
    goal: string;
    audience: string;
    offer: string;
    timeline: string;
    targetAccounts: number;
    targetContacts: number;
  };
  plan: {
    summary: string;
    channels: { id: string; label: string; cadence: string; role: string }[];
    sequence: MsPlanTouch[];
    estimatedCredits: number;
  };
  voices: MsVoicePreset[];
  defaultVoiceId: string;
  sourceAsset: MsSourceAsset;
  remixedAssets: MsRemixedAsset[];
  outreach: MsOutreachRecipient[];
  landingPage: {
    url: string;
    eyebrow: string;
    headline: string;
    subheadline: string;
    bullets: string[];
    formTitle: string;
    submitLabel: string;
    confirmationHeadline: string;
    confirmationBody: string;
  };
  repFollowUp: {
    taskTitle: string;
    taskNotes: string;
    slackChannel: string;
    slackText: string;
    emailSubject: string;
    emailBody: string;
    meetingTitle: string;
    meetingDuration: string;
    meetingSlots: { id: string; day: string; time: string; tz: string }[];
    defaultSlotId: string;
  };
  deal: {
    id: string;
    name: string;
    amount: number;
    stage: string;
    closeInDays: number;
    lineItems: { sku: string; qty: number }[];
  };
  dashboard: {
    baseline: {
      accountsReached: number;
      contactsEngaged: number;
      leads: number;
      mqls: number;
      meetings: number;
      pipeline: number;
      creditsUsed: number;
    };
    channels: { channel: string; touches: number; leads: number; meetings: number; pipeline: number; conversionPct: number }[];
    creditBreakdown: { action: string; credits: number; outcomes: string; sharePct: number }[];
    assets: { format: string; title: string; views: number; clicks: number; conversions: number; influencedPipeline: number }[];
  };
};

// ---------- Pack ----------

export type DeepPartial<T> = { [K in keyof T]?: T[K] extends string | number | boolean | unknown[] ? T[K] : DeepPartial<T[K]> };

/**
 * A sample knowledge file for the closing agent: the buyer question it lets the agent answer, the answer,
 * and the words in a typed question that point to it.
 */
export type AgentFile = { name: string; question: string; answer: string; keywords: string[] };

/** Wording that is shared by several screens. Manufacturing's wording is the default. */
export type PackLabels = {
  pipeline: string;
  territory: string;
  /** Heading of the lead-time column on quotes and products. */
  timing: string;
  quoteTotal: string;
  /**
   * Wording printed on the quote document. `summary` is the Executive summary sentence:
   * "{seller}", "{buyer}", "{lines}" (every line as quantity and name), "{count}" (number of lines), "{total}".
   * `cover` is the body of the Cover letter: "{title}" (the quote's title), "{count}".
   */
  document: { heading: string; ref: string; total: string; summary: string; cover: string };
  /**
   * The closing agent on the published quote. `name` is what the chat window calls it: "{company}".
   * `welcome` and `firstAction` are its two opening messages. `timing` is the quick reply that asks about the timing column.
   * `files` are the sample documents in the files tool that a rep can add to a quote as quote-specific knowledge.
   */
  agent: { name: string; welcome: string; firstAction: string; timing: string; files: AgentFile[] };
  /** Rows shown under the total when a quote has recurring lines. */
  recurring: { annual: string; oneTime: string };
  /** The synced back-office fields at the top of a company record. "{backOffice}" is the vertical's back-office term. */
  synced: { title: string; account: string; lastOrder: string; openBalance: string; status: string };
};

/** Per-vertical wording for a storyboard step: what the demo bar shows the rep. */
export type StepNote = { title?: string; hint?: string };

export type Pack = {
  vertical: { id: string; name: string };
  /** `address` is the seller address printed on quotes, one line per entry. */
  portal: { company: string; domain: string; hubId: string; currency: string; address?: string[] };
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
  extensions: Partial<Record<DemoId, Extension[]>>;
  labels?: DeepPartial<PackLabels>;
  /** Presenter wording per demo and step id, where the shared storyboard's wording does not fit the vertical. */
  stepNotes?: Partial<Record<DemoId, Record<string, StepNote>>>;
  /** Declarative JSON specs for shared `/reports/:reportId` analytics dashboards (zero vertical hardcoding). */
  reports?: Record<string, AnalyticsReportSpec>;
  demos: {
    guidedQuote: GuidedQuoteConfig;
    discountApproval: DiscountApprovalConfig;
    backOffice: BackOfficeConfig;
    leadCapture: LeadCaptureConfig;
    emailToDeal: EmailToDealConfig;
    aiProspecting: AiProspectingConfig;
    customerAgent?: CustomerAgentConfig;
    socialAds?: SocialAdsConfig;
    marketingStudio?: MarketingStudioConfig;
    patientReactivation?: PatientReactivationConfig;
    branchLaunch?: BranchLaunchConfig;
    pqlTrial?: PqlTrialConfig;
    /** Parameterized Tickets workspace configs keyed by DemoId (supports feedback, checklist, sla, and incident modes). */
    tickets?: Partial<Record<DemoId, TicketsDemoConfig>>;
    intake?: Partial<Record<IntakeDemoId, IntakeFlowConfig>>;
    renewals?: Partial<Record<RenewalsDemoId, RenewalFlowConfig>>;
  };
};
