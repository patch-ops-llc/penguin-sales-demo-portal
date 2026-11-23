export type SocialChannel = "linkedin" | "facebook" | "instagram" | "x";
export type SocialPostStatus = "draft" | "scheduled" | "published";

export type SocialCampaign = {
  id: string;
  name: string;
  status: "Active" | "Draft" | "Completed";
  ownerId: string;
  goal: string;
  audience: string;
  budget: number;
  spendToDate: number;
  startDate: string;
  endDate: string;
  complianceNote: string;
  brandVoice: {
    name: string;
    tone: string;
    pillars: string[];
    guardrail: string;
  };
  budgetSplit: { channel: string; allocated: number; spent: number; sharePct: number }[];
  assets: { type: string; count: number }[];
};

export type SocialCalendarPost = {
  id: string;
  campaignId: string;
  channel: SocialChannel;
  dayOfMonth: number;
  time: string;
  title: string;
  copy: string;
  initialStatus: SocialPostStatus;
  /** Added to the calendar when the marketer plans the month in Step 2. */
  plannedInStep2?: boolean;
  /** Reviewed in Brand Voice and approved in Step 3 (moves from draft to scheduled). */
  needsApproval?: boolean;
  voiceMatchScore: number;
  hipaaChecked: boolean;
  impressions?: number;
  clicks?: number;
  engagements?: number;
};

export type GoogleAdPreview = {
  query: string;
  sponsored: {
    displayUrl: string;
    domain: string;
    headline: string;
    description: string;
    sitelinks: { title: string; detail: string }[];
    callouts: string[];
  };
  organicResults: {
    siteName: string;
    url: string;
    title: string;
    snippet: string;
  }[];
};

export type SocialFeedPreview = {
  viewer: {
    name: string;
    title: string;
    organization: string;
    location: string;
    openReqNote: string;
  };
  organicPost: {
    author: string;
    followers: string;
    postedAgo: string;
    copy: string;
    statHeadline: string;
    statSub: string;
    likes: number;
    comments: number;
    reposts: number;
  };
  paidAd: {
    author: string;
    sponsorLabel: string;
    intro: string;
    headline: string;
    subheadline: string;
    ctaLabel: string;
    destinationDomain: string;
    bullets: string[];
    likes: number;
    comments: number;
  };
};

export type LandingPageConfig = {
  url: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  companyName: string;
  badge: string;
  headline: string;
  subheadline: string;
  metrics: { value: string; label: string }[];
  proofPoints: string[];
  complianceNotice: string;
  formTitle: string;
  submitLabel: string;
  lead: {
    contactId: string;
    companyId: string;
    dealId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    title: string;
    companyName: string;
    companyDomain: string;
    companyIndustry: string;
    companyCity: string;
    companyState: string;
    companyEmployees: number;
    companyRevenue: number;
    specialty: string;
    rolesNeeded: string;
    shiftWindow: string;
    startTarget: string;
    notes: string;
    dealName: string;
    dealAmount: number;
    assignedRepId: string;
  };
  followUpEmail: {
    subject: string;
    preview: string;
    body: string;
  };
  repAlert: {
    channel: string;
    text: string;
    taskTitle: string;
  };
};

export type SocialInboxThread = {
  id: string;
  channel: SocialChannel;
  kind: "Comment" | "Direct message";
  authorName: string;
  authorTitle: string;
  organization: string;
  at: string;
  postTitle: string;
  message: string;
  suggestedReply: string;
  initialReplied?: boolean;
  initialReplyText?: string;
};

export type CampaignInsightRow = {
  id: string;
  campaign: string;
  channel: "Google Search Ads" | "LinkedIn Paid Social" | "Facebook & Instagram" | "Organic Social" | "X";
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  mqls: number;
  pipeline: number;
  filledPlacements: number;
  placementRevenue: number;
};

export type SocialAdsConfig = {
  monthLabel: string;
  /** Day-of-week offset (0 = Mon ... 6 = Sun) for day 1 of the displayed month. */
  monthStartOffset: number;
  daysInMonth: number;
  campaigns: SocialCampaign[];
  heroCampaignId: string;
  posts: SocialCalendarPost[];
  googleAd: GoogleAdPreview;
  socialFeed: SocialFeedPreview;
  landingPage: LandingPageConfig;
  inboxThreads: SocialInboxThread[];
  insights: CampaignInsightRow[];
  atsSyncMeta: {
    systemName: string;
    syncedAt: string;
    avgBillRate: number;
    avgMarginPct: number;
    avgTimeToFillDays: number;
  };
};
