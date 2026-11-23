import type { DealStage, ExtraProp, LineItem } from "@/verticals/types";

export type IntakeDemoId = "referral-intake" | "staffing-job-orders";

export type IntakeMode = "scheduling" | "shortlist" | "documents";

export type IntakeTone = "neutral" | "green" | "amber" | "blue" | "teal" | "orange";

export type IntakeFormField = {
  id: string;
  label: string;
  defaultValue: string;
  kind?: "text" | "select" | "textarea";
  options?: string[];
  span?: 1 | 2;
  /** Optional binding to update created CRM record fields if the presenter edits the form. */
  bind?: "firstName" | "lastName" | "email" | "companyName" | "specialty" | "notes";
};

export type IntakeReviewItem = {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeTone?: IntakeTone;
  meta: string[];
  /** When true, the reviewer can toggle inclusion (e.g., ATS shortlist candidates or missing docs). */
  selectable?: boolean;
  defaultSelected?: boolean;
  unitValue?: number;
};

export type IntakeFollowupOption = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  badge?: string;
  badgeTone?: IntakeTone;
  detail?: string;
  unitValue?: number;
};

export type IntakeFlowConfig = {
  demoId: IntakeDemoId;
  mode: IntakeMode;
  reportId: string;
  reportButtonLabel: string;
  /** Optional custom deal pipeline for this intake flow (falls back to pack.stages). */
  pipelineName?: string;
  pipelineStages?: DealStage[];
  stageIds: {
    initial: string;
    reviewed: string;
    outreachSent: string;
    completed: string;
  };
  portal: {
    channelLabel: string;
    brandName: string;
    brandShort: string;
    accentColor: string;
    url: string;
    navItems: string[];
    eyebrow: string;
    headline: string;
    subheadline: string;
    metrics: { value: string; label: string }[];
    proofPoints: string[];
    complianceNotice: string;
    formTitle: string;
    formSubtitle: string;
    fields: IntakeFormField[];
    submitLabel: string;
    confirmationHeadline: string;
    confirmationSummary: string;
    capturedBullets: string[];
    returnToHubSpotLabel: string;
  };
  createdRecords: {
    companyId: string;
    companyName: string;
    companyDomain: string;
    companyIndustry: string;
    companyCity: string;
    companyState: string;
    companyEmployees: number;
    companyRevenue: number;
    companyPhone: string;
    companyTerritory: string;
    companyDescription: string;
    contactId: string;
    contactFirstName: string;
    contactLastName: string;
    contactTitle: string;
    contactEmail: string;
    contactPhone: string;
    contactLifecycle: string;
    contactSource: string;
    contactExtra: ExtraProp[];
    dealId: string;
    dealName: string;
    dealType: string;
    dealSource: string;
    dealAmount: number;
    dealCloseInDays: number;
    ownerId: string;
    lineItems: LineItem[];
    completedLineItems?: LineItem[];
    completedAmount?: number;
    workflowId?: string;
    routingSummary: string;
    routingRuleLabel: string;
    routingCriteria: { label: string; value: string }[];
    slackChannel: string;
    slackText: string;
    taskTitle: string;
    taskNotes: string;
  };
  /** Custom Penguin-built integration card on the HubSpot Deal record (ONLY Penguin marker). */
  integrationCard: {
    extId: string;
    title: string;
    systemName: string;
    syncedLabel: string;
    badge: string;
    summary: string;
    itemsHeading: string;
    items: IntakeReviewItem[];
    confirmButtonLabel: string;
    confirmedStatusText: string;
    completedSyncTitle: string;
    completedSyncDetail: string;
  };
  /** Native HubSpot coordinator/recruiter outreach panel on the Deal record (NO Penguin marker). */
  outreach: {
    title: string;
    subtitle: string;
    senderId: string;
    recipientName: string;
    recipientEmail: string;
    recipientRole: string;
    subject: string;
    body: string;
    ctaPreviewLabel: string;
    sendButtonLabel: string;
    sentConfirmation: string;
  };
  /** Off-platform follow-up screen (patient scheduling or manager shortlist selection). */
  followup: {
    channelLabel: string;
    windowTitle: string;
    address: string;
    inboxBrand: string;
    inboxInitial: string;
    inboxOwnerName: string;
    inboxOwnerEmail: string;
    noiseEmails: { id: string; from: string; subject: string; time: string; preview: string }[];
    panelTitle: string;
    panelSubtitle: string;
    selectionMode: "single" | "multi";
    minSelections?: number;
    optionsHeading: string;
    options: IntakeFollowupOption[];
    defaultOptionIds: string[];
    confirmButtonLabel: string;
    confirmedHeadline: string;
    confirmedBody: string;
    hubSpotSyncBullets: string[];
    returnButtonLabel: string;
  };
  completion: {
    headline: string;
    summary: string;
    revenueLabel: string;
    revenueValue: string;
    stageLabel: string;
  };
};
