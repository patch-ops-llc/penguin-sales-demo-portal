import type { DemoId } from "@/verticals/catalog";

/**
 * Parameterized modes supported by the reusable Tickets workspace (`src/shell/tickets/`):
 * - `feedback`: Post-visit CSAT survey -> low-score workflow opens Service Hub ticket routed to location manager -> outreach & resolution -> analytics report (H5).
 * - `checklist`: Closed-won trigger -> templated onboarding ticket with interactive checklist / doc verification -> off-platform kickoff / upload -> compliance or CS sign-off -> analytics report (S6, F3).
 * - `sla`: Multi-channel intake -> priority SLA timer & due date -> overdue manager escalation -> off-platform resolution letter -> SLA compliance report (F6).
 * - `incident`: Off-platform monitoring outage alert -> incident ticket + impacted accounts list -> batch customer broadcast & status updates -> post-incident summary -> MTTR report (I5).
 */
export type TicketMode = "feedback" | "checklist" | "sla" | "incident";

export type TicketPriority = "Low" | "Medium" | "High" | "Urgent";

export type TicketStage = {
  id: string;
  label: string;
  closed?: boolean;
};

export type TicketSlaInfo = {
  priority: TicketPriority;
  targetLabel: string;
  dueLabel: string;
  /** Progress percentage toward SLA limit (0-100+). Values >= 100 display as overdue. */
  elapsedPct: number;
  overdue?: boolean;
  escalationOwnerId?: string;
  escalationRuleLabel?: string;
  escalationNote?: string;
};

export type TicketChecklistItem = {
  id: string;
  label: string;
  category: string;
  ownerLabel: string;
  status: "pending" | "received" | "verified" | "done";
  required: boolean;
  detail: string;
  verificationSource?: string;
};

export type TicketImpactedAccount = {
  companyId: string;
  companyName: string;
  tier: string;
  affectedAssets: string;
  primaryContactName: string;
  primaryContactEmail: string;
};

export type TicketExternalCard = {
  /** Extension id registered in the vertical's `extensions.ts` (`by: "penguin"` or `"native"`). */
  extId: string;
  title: string;
  badge: string;
  badgeTone?: "green" | "amber" | "blue" | "teal" | "purple" | "orange";
  subtitle: string;
  fields: { label: string; value: string }[];
  footnote?: string;
};

export type TicketOffPlatformScreen = {
  channelLabel: string;
  windowTitle: string;
  address: string;
  brandName: string;
  brandSubtitle?: string;
  headline: string;
  intro: string;
  /** Optional guardrail banner (e.g. non-PHI / synthetic data notice). */
  complianceNote?: string;
  /** Optional custom trigger card displayed on the off-platform entry screen (wrapped in `<Ext>`). */
  triggerExt?: TicketExternalCard;
  feedback?: {
    visitLocation: string;
    visitDateLabel: string;
    visitDepartment: string;
    visitorName: string;
    visitorEmail: string;
    scaleMax: number;
    scriptedScore: number;
    scoreLabels: Record<number, string>;
    topics: string[];
    scriptedTopics: string[];
    scriptedComment: string;
    lowScoreThreshold: number;
    submitLabel: string;
    thankYouHeadline: string;
    thankYouBody: string;
  };
  checklist?: {
    kind: "kickoff-email" | "doc-request";
    fromName: string;
    fromEmail: string;
    toName: string;
    toEmail: string;
    subject: string;
    body: string;
    requestedItems: { id: string; label: string; fileName: string; size: string }[];
    ctaLabel: string;
    completedBanner: string;
  };
  sla?: {
    channel: "Email" | "Chat" | "Phone";
    fromName: string;
    fromEmail: string;
    toEmail: string;
    subject: string;
    body: string;
    category: string;
    referenceId: string;
    ctaLabel: string;
  };
  incident?: {
    monitorTool: string;
    alertId: string;
    severity: "SEV-1" | "SEV-2";
    serviceName: string;
    detectedAtLabel: string;
    summary: string;
    metrics: { label: string; value: string }[];
    ctaLabel: string;
  };
};

export type TicketSecondaryOffPlatform = {
  channelLabel: string;
  windowTitle: string;
  address: string;
  fromName: string;
  fromEmail: string;
  toName: string;
  toEmail: string;
  subject: string;
  body: string;
  badge?: string;
  footnote?: string;
  ctaLabel: string;
};

export type TicketQueueSeed = {
  id: string;
  number: string;
  subject: string;
  pipeline: string;
  stageId: string;
  priority: TicketPriority;
  ownerId: string;
  contactId: string;
  companyId: string;
  locationOrCategory: string;
  createdAt: string;
  slaLabel: string;
  scoreLabel?: string;
};

export type TicketsDemoConfig = {
  demoId: DemoId;
  mode: TicketMode;
  pipelineName: string;
  stages: TicketStage[];
  ticket: {
    id: string;
    number: string;
    subject: string;
    category: string;
    locationLabel: string;
    sourceLabel: string;
    priority: TicketPriority;
    ownerId: string;
    contactId: string;
    companyId: string;
    dealId?: string;
    initialStageId: string;
    inProgressStageId: string;
    escalatedStageId?: string;
    resolvedStageId: string;
    summary: string;
    complianceNote?: string;
  };
  queueSeeds: TicketQueueSeed[];
  sla?: TicketSlaInfo;
  checklist?: TicketChecklistItem[];
  impactedAccounts?: TicketImpactedAccount[];
  offPlatform: TicketOffPlatformScreen;
  secondaryOffPlatform?: TicketSecondaryOffPlatform;
  outreach: {
    heading: string;
    channelLabel: string;
    recipientLabel: string;
    subject: string;
    defaultBody: string;
    followUpNote: string;
    sendButtonLabel: string;
    resolveButtonLabel: string;
    resolutionSummary: string;
  };
  /** Optional custom integration card shown in the right sidebar of the Ticket record (wrapped in `<Ext>`). */
  externalCard?: TicketExternalCard;
  /** Native HubSpot workflow automation note displayed on the queue & ticket record (NO Penguin marker). */
  workflowNote?: {
    id?: string;
    name: string;
    trigger: string;
    action: string;
  };
  /** Report id in `pack.reports` (`/reports/:reportId`) that concludes the walkthrough. */
  reportId: string;
  reportButtonLabel: string;
};
