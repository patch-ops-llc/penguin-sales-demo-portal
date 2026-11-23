import type { DealStage, LineItem } from "@/verticals/types";

export type RenewalsDemoId = "premium-to-subscription" | "renewal-churn-risk" | "contract-renewal";

export type RenewalTone = "neutral" | "green" | "amber" | "red" | "blue" | "teal" | "orange" | "purple";

export type RenewalPipelinePeer = {
  id: string;
  dealName: string;
  companyName: string;
  stageId: string;
  mrr: number;
  arr: number;
  ownerName: string;
  renewalDate?: string;
  badge?: string;
  badgeTone?: RenewalTone;
};

export type PremiumToSubscriptionConfig = {
  mode: "dual-pipeline";
  companyId: string;
  contactId: string;
  aeOwnerId: string;
  csOwnerId: string;
  premiumDealId: string;
  premiumPipelineName: string;
  premiumStages: DealStage[];
  premiumOpenStageId: string;
  premiumWonStageId: string;
  subscriptionPipelineName: string;
  subscriptionStages: DealStage[];
  subscriptionInitialStageId: string;
  subscriptionHandoffStageId: string;
  premiumPeers: RenewalPipelinePeer[];
  subscriptionPeers: RenewalPipelinePeer[];
  checkout: {
    brandName: string;
    brandShort: string;
    accentColor: string;
    channelLabel: string;
    url: string;
    planName: string;
    seatCount: number;
    billingOptions: { id: string; label: string; badge?: string; mrr: number; annualTotal: number; billingNote: string }[];
    defaultBillingOptionId: string;
    paymentMethodLabel: string;
    paymentMethodLast4: string;
    billingEmail: string;
    webhookEventId: string;
    subscriptionNumber: string;
  };
  subscriptionDeal: {
    dealId: string;
    name: string;
    startDate: string;
    renewalDate: string;
    mrr: number;
    arr: number;
    lineItems: LineItem[];
  };
  syncCard: {
    extId: string;
    title: string;
    sourceLabel: string;
    badge: string;
    summary: string;
  };
  csHandoff: {
    workflowName: string;
    slackChannel: string;
    slackText: string;
    tasks: { id: string; title: string; type: "Call" | "Email" | "To-do"; priority: "High" | "Medium" | "Low"; dueInDays: number; notes: string }[];
  };
  reportId: string;
};

export type AccountHealthFactor = {
  id: string;
  label: string;
  source: "Product telemetry" | "HubSpot Service Hub" | "HubSpot CRM";
  metric: string;
  impact: string;
  tone: RenewalTone;
  detail: string;
};

export type HealthUsagePoint = {
  label: string;
  activeSeats: number;
  licensedSeats: number;
};

export type HealthOpenTicket = {
  id: string;
  number: string;
  subject: string;
  priority: "Urgent" | "High" | "Medium";
  ageLabel: string;
  owner: string;
  status: string;
};

export type RenewalQueueRow = {
  id: string;
  companyId?: string;
  companyName: string;
  planName: string;
  arr: number;
  mrr: number;
  daysToRenewal: number;
  renewalDate: string;
  ownerName: string;
  status: string;
  statusTone: RenewalTone;
  isHero?: boolean;
};

export type RenewalChurnRiskConfig = {
  mode: "health-churn";
  companyId: string;
  contactId: string;
  csmOwnerId: string;
  approverId: string;
  workflow: {
    id: string;
    name: string;
    triggerSummary: string;
    enrolledCount: number;
    noticeDays: number;
    actions: string[];
  };
  queue: RenewalQueueRow[];
  renewalDeal: {
    dealId: string;
    name: string;
    pipelineName: string;
    stages: DealStage[];
    initialStageId: string;
    quoteStageId: string;
    sentStageId: string;
    wonStageId: string;
    closeDate: string;
    arr: number;
    mrr: number;
    lineItems: LineItem[];
    taskTitle: string;
    taskNotes: string;
    slackChannel: string;
    slackText: string;
  };
  healthCard: {
    extId: string;
    title: string;
    syncedLabel: string;
    score: number;
    riskLabel: string;
    thresholdLabel: string;
    summary: string;
    usageTrend: HealthUsagePoint[];
    openTickets: HealthOpenTicket[];
    factors: AccountHealthFactor[];
    recommendedPlaybook: string;
  };
  quote: {
    quoteId: string;
    number: string;
    title: string;
    retentionDiscountPct: number;
    approvalThresholdPct: number;
    approvalNote: string;
    approverMessage: string;
    lineItems: LineItem[];
  };
  reportId: string;
};

export type QbrSlot = {
  id: string;
  day: string;
  time: string;
  tz: string;
  location: string;
};

export type ContractRenewalConfig = {
  mode: "contract-qbr";
  companyId: string;
  contactId: string;
  ownerId: string;
  workflow: {
    id: string;
    name: string;
    triggerSummary: string;
    enrolledCount: number;
    noticeDays: number;
    actions: string[];
  };
  queue: RenewalQueueRow[];
  renewalDeal: {
    dealId: string;
    name: string;
    pipelineName: string;
    stages: DealStage[];
    initialStageId: string;
    qbrStageId: string;
    quoteStageId: string;
    wonStageId: string;
    closeDate: string;
    arr: number;
    mrr: number;
    lineItems: LineItem[];
    taskTitle: string;
    taskNotes: string;
    slackChannel: string;
    slackText: string;
  };
  qbr: {
    channelLabel: string;
    windowTitle: string;
    url: string;
    inboxBrand: string;
    inboxInitial: string;
    inboxOwnerName: string;
    inboxOwnerEmail: string;
    emailSubject: string;
    emailBody: string;
    meetingTitle: string;
    durationLabel: string;
    agenda: string[];
    slots: QbrSlot[];
    defaultSlotId: string;
    noiseEmails: { id: string; from: string; subject: string }[];
  };
  quote: {
    quoteId: string;
    number: string;
    title: string;
    lineItems: LineItem[];
  };
  psaSync: {
    extId: string;
    title: string;
    systemLabel: string;
    agreementId: string;
    planLabel: string;
    previousSeats: number;
    renewedSeats: number;
    previousSites: number;
    renewedSites: number;
    previousArr: number;
    renewedArr: number;
    previousEndDate: string;
    rolledEndDate: string;
    termLabel: string;
    syncNote: string;
  };
  reportId: string;
};

export type RenewalFlowConfig = PremiumToSubscriptionConfig | RenewalChurnRiskConfig | ContractRenewalConfig;
