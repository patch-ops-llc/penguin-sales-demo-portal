import type { MarketingStudioConfig } from "../types";

/**
 * Flow 1: Marketing Studio — SaaS company (Lumenstack) automating outreach to its ICP.
 *
 * Swapping the source asset:
 *   Edit `sourceAsset` below (title, subtitle, format, fileName, summary, keyStats, chapters)
 *   to swap in a different ebook or newsletter without touching any UI component.
 */
export const marketingStudio: MarketingStudioConfig = {
  companyId: "co-kestrel",
  primaryContactId: "ct-elena",
  marketer: { name: "Maya Chen", title: "Demand Generation Manager", email: "maya.chen@lumenstack.example", color: "#c23b5e" },
  repId: "jordan",
  campaignName: "Q4 ICP Campaign · 2027 SaaS Analytics Playbook",
  icp: {
    tier: "Tier 1 ICP Match",
    score: 94,
    matchedSignals: [
      { label: "Firmographic fit", value: "B2B SaaS · 480 employees · $74M ARR (Mid-market sweet spot)", points: 32 },
      { label: "Technographic match", value: "Snowflake + Okta + HubSpot CRM detected", points: 28 },
      { label: "Growth & hiring signal", value: "Hiring 3 Analytics Engineers; Series C reporting prep", points: 20 },
      { label: "Buying committee coverage", value: "3 of 3 key roles identified (RevOps, Data Eng, Finance)", points: 14 },
    ],
    buyingRoles: [
      { contactId: "ct-elena", role: "Champion · Primary ICP Buyer", influence: "Owns GTM reporting & quarterly board decks" },
      { contactId: "ct-marcus", role: "Technical Evaluator", influence: "Owns Snowflake warehouse connectors & SSO governance" },
      { contactId: "ct-priya", role: "Economic Buyer", influence: "Consolidating BI seat spend ahead of FY27 plan" },
    ],
  },
  brief: {
    goal: "Book 15 qualified meetings and influence $450K+ in new pipeline from Tier 1 mid-market SaaS ICP accounts within 30 days.",
    audience: "Tier 1 ICP B2B SaaS accounts (200–1,000 employees) running Snowflake — targeting VP RevOps, Directors of Data Engineering, and VP Finance.",
    offer: "The 2027 SaaS Analytics Playbook (18-page benchmark ebook) + optional 20-minute workspace architecture review.",
    timeline: "3-week multi-channel sprint · Launch Tuesday 9:00 AM",
    targetAccounts: 42,
    targetContacts: 126,
  },
  plan: {
    summary: "Breeze turned your brief into a coordinated 3-week campaign across 4 channels, sequenced around one anchor ebook and role-tailored ICP outreach.",
    channels: [
      { id: "email", label: "Marketing & Outreach Email", cadence: "3 role-tailored touches", role: "Direct ICP engagement to buying committees" },
      { id: "landing", label: "Conversion Landing Page", cadence: "Always-on gated offer", role: "Capture downloads & trigger MQL lifecycle routing" },
      { id: "blog", label: "Blog Post", cadence: "Day 1 launch article", role: "Organic & search-friendly benchmark overview" },
      { id: "social", label: "LinkedIn Social Series", cadence: "4 posts over 2 weeks", role: "Warm up RevOps & Data leaders in target accounts" },
    ],
    sequence: [
      { day: "Day 1", channel: "Blog & LinkedIn", title: "Publish benchmark article & launch posts", detail: "Seed the 2027 Playbook narrative across organic social and the Lumenstack blog.", credits: 45 },
      { day: "Day 2", channel: "Tailored Email", title: "Send role-specific ICP outreach", detail: "Personalized emails go out to RevOps, Data Eng, and Finance leads across 42 Tier 1 accounts.", credits: 95 },
      { day: "Day 4", channel: "Landing Page", title: "Capture ebook downloads & score MQLs", detail: "Form submissions log on the timeline, move contacts to MQL, and notify the assigned AE.", credits: 40 },
      { day: "Day 5", channel: "Sales Handoff", title: "Rep follow-up & meeting scheduler", detail: "Assigned AE sends a contextual follow-up with a 20-minute architecture consult link.", credits: 35 },
      { day: "Day 10", channel: "LinkedIn & Email", title: "Executive ROI follow-up touch", detail: "Non-converters receive the Finance ROI summary while booked leads move into active pipeline.", credits: 25 },
    ],
    estimatedCredits: 240,
  },
  voices: [
    {
      id: "analytical",
      name: "Lumenstack Executive Analytical",
      tagline: "Crisp, metrics-first, written by operators for operators.",
      tonePillars: ["Clear & analytical", "Peer-to-peer RevOps", "Zero hype"],
      audience: "VP & Director buyers in RevOps, Data Engineering, and Finance",
      dos: [
        "Lead with concrete benchmarks and operational time saved",
        "Name the buyer's stack (Snowflake, Okta, CRM) naturally",
        "Keep every paragraph under three lines with a single clear CTA",
      ],
      donts: [
        "No hollow buzzwords ('revolutionary', 'game-changing', 'synergy')",
        "Never pitch product features before naming the reporting bottleneck",
      ],
      sampleLine: "Mid-market SaaS teams cut weekly board-pack prep by 68% when RevOps, Data, and Finance read from one governed warehouse model.",
    },
    {
      id: "product-led",
      name: "Lumenstack Product-Led Direct",
      tagline: "Short, practical, and centered on fast time-to-value.",
      tonePillars: ["Practical", "Direct", "Builder-friendly"],
      audience: "Hands-on analytics leads and RevOps builders",
      dos: [
        "Show the exact 30-day rollout checklist upfront",
        "Focus on self-serve speed and zero-maintenance connectors",
        "Invite readers to test the template on their own data",
      ],
      donts: [
        "Skip long introductions and generic industry framing",
        "Avoid heavy procurement language in first-touch outreach",
      ],
      sampleLine: "Connect Snowflake on Monday, govern role access with Okta by Wednesday, and ship your first executive workspace in week one.",
    },
  ],
  defaultVoiceId: "analytical",
  sourceAsset: {
    title: "The 2027 SaaS Analytics Playbook: Consolidating Multi-Team Reporting",
    subtitle: "How 140 mid-market SaaS teams replaced spreadsheet sprawl and point BI tools with one governed workspace.",
    format: "Ebook · PDF (18 pages)",
    fileName: "Lumenstack-2027-SaaS-Analytics-Playbook.pdf",
    fileSize: "2.4 MB",
    author: "Lumenstack Product Marketing",
    publishedLabel: "Updated Q4 2026",
    summary:
      "A benchmark guide for B2B SaaS leaders scaling from 200 to 1,000 employees. Covers why RevOps, Data Engineering, and Finance diverge on ARR and retention numbers — and gives a 30-day consolidation blueprint.",
    keyStats: [
      { value: "68%", label: "less weekly reporting prep across RevOps and Finance" },
      { value: "30 days", label: "median rollout from Snowflake connect to executive dashboards" },
      { value: "3.4x", label: "higher weekly self-serve adoption vs. legacy BI tools" },
    ],
    chapters: [
      { number: "01", title: "The 300-Employee Reporting Cliff", summary: "Why ARR, churn, and pipeline numbers drift once three departments run separate spreadsheets and BI sandboxes." },
      { number: "02", title: "Benchmarks from 140 SaaS Operators", summary: "Time spent reconciling metrics, tool-stack spend per seat, and governance patterns from Series B–D teams." },
      { number: "03", title: "The 30-Day Unified Workspace Checklist", summary: "Warehouse connectors, Okta SSO/SCIM provisioning, semantic definitions, and department launch order." },
      { number: "04", title: "Executive ROI & License Consolidation Model", summary: "How Finance leaders retire overlapping reporting licenses while giving every GTM manager self-serve access." },
    ],
  },
  remixedAssets: [
    {
      id: "email",
      label: "Outreach Email",
      channel: "Email",
      title: "ICP Outreach Sequence · Touch 1 (RevOps / Data / Finance)",
      summary: "Role-tailored first-touch email driving ICP buyers directly to the gated 2027 Playbook.",
      creditsUsed: 12,
      voiceScore: 98,
      headline: "{{contact.firstname}} — cutting RevOps reporting prep at {{company.name}} (2027 Playbook)",
      subheadline: "Preview: Benchmarks from 140 mid-market SaaS teams running Snowflake.",
      body: `Hi {{contact.firstname}},

Once a SaaS team passes 300 employees, RevOps, Data Engineering, and Finance almost always end up reconciling three versions of the same ARR and pipeline numbers before every board meeting.

We surveyed 140 mid-market SaaS operators running Snowflake and compiled their consolidation blueprint in The 2027 SaaS Analytics Playbook. Teams using the 30-day model cut weekly reporting prep by 68% without adding analyst headcount.

Inside the 18-page guide:
• The 4 metric-drift traps that hit between Series B and Series C
• A 30-day checklist for Snowflake + Okta workspace governance
• The Finance ROI model for retiring overlapping BI seats

Worth a quick read ahead of your FY27 planning?`,
      cta: "Download the 2027 SaaS Analytics Playbook",
      meta: [
        { label: "Personalization tokens", value: "First name, Company, Role, Tech stack" },
        { label: "Brand Voice match", value: "98% · Executive Analytical" },
        { label: "Target audience", value: "42 Tier 1 ICP accounts (126 contacts)" },
      ],
    },
    {
      id: "blog",
      label: "Blog Post",
      channel: "Blog",
      title: "Why 300-Employee SaaS Teams Hit a Reporting Cliff — And How to Fix It in 30 Days",
      summary: "1,100-word benchmark post adapted from Chapters 1 & 2, with an inline Playbook CTA.",
      creditsUsed: 10,
      voiceScore: 97,
      headline: "Why 300-Employee SaaS Teams Hit a Reporting Cliff — And How to Fix It in 30 Days",
      subheadline: "Data from 140 RevOps and Data leaders shows spreadsheet sprawl costs 11 hours a week per manager.",
      body: `Every fast-growing B2B SaaS company reaches the same inflection point around 300 employees. Sales has dashboards in the CRM, Finance closes the books in spreadsheets, and Data Engineering maintains ad-hoc SQL queries in Snowflake.

In our 2027 benchmark study of 140 mid-market SaaS teams, 74% reported that executives see conflicting retention or pipeline numbers at least once a month.

The fix is rarely buying another heavy BI suite. Teams that cut reporting prep by 68% follow three sequencing rules:
1. Lock one governed semantic layer directly on top of the cloud warehouse.
2. Enforce role-based access via SSO/SCIM from day one so Finance and RevOps trust the same workspace.
3. Roll out one department per week — starting with RevOps pipeline, then Finance ARR, then Customer Success retention.

Download the full 18-page 2027 SaaS Analytics Playbook for the complete 30-day rollout checklist and ROI worksheet.`,
      cta: "Get the full 18-page Playbook",
      meta: [
        { label: "Reading time", value: "5 min read" },
        { label: "SEO topic", value: "SaaS multi-team analytics consolidation" },
        { label: "Conversion module", value: "Inline + end-of-post Playbook form" },
      ],
    },
    {
      id: "social",
      label: "Social Posts",
      channel: "LinkedIn",
      title: "LinkedIn Launch Series · 3 Role-Focused Posts",
      summary: "Ready-to-publish LinkedIn posts tailored for RevOps, Data Engineering, and SaaS CFO feeds.",
      creditsUsed: 8,
      voiceScore: 96,
      headline: "Post 1 (RevOps Feed) · The Monday-morning reconciliation tax",
      subheadline: "Scheduled for Day 1 · 9:00 AM · LinkedIn Company + Executive Advocacy",
      body: `We asked 140 mid-market SaaS RevOps leaders how much time their teams lose reconciling pipeline and retention numbers before weekly leadership calls.

The median answer: 11 hours a week.

Not because the warehouse data is wrong — because three departments define the same metric in three different tools.

Our new 2027 SaaS Analytics Playbook breaks down how teams on Snowflake + Okta consolidate into one workspace in 30 days and cut reporting prep by 68%.

No fluff. Benchmarks, checklist, and Finance ROI model inside. Link in the comments.

---
Post 2 (Data Eng Feed) · Stop fielding 40 ad-hoc CSV requests every Friday. See Chapter 3's governed Snowflake connector pattern.
Post 3 (Finance Feed) · Retiring 3 overlapping BI licenses before FY27 planning without slowing down GTM teams.`,
      cta: "Read the 2027 Playbook",
      meta: [
        { label: "Formats included", value: "3 LinkedIn posts + 6-slide carousel outline" },
        { label: "Schedule window", value: "Days 1, 3, and 8" },
        { label: "UTM campaign", value: "q4_icp_2027_playbook" },
      ],
    },
    {
      id: "landing",
      label: "Landing Page Copy",
      channel: "Landing Page",
      title: "Gated Download Page · /resources/2027-saas-analytics-playbook",
      summary: "High-converting HubSpot landing page copy, value bullets, and progressive form fields.",
      creditsUsed: 10,
      voiceScore: 99,
      headline: "Consolidate SaaS reporting in 30 days — without rebuilding your warehouse",
      subheadline: "Get The 2027 SaaS Analytics Playbook: benchmarks from 140 mid-market SaaS teams, the Snowflake + Okta rollout checklist, and the Finance ROI model.",
      body: `Hero proof strip: 68% less weekly prep · 30-day rollout · 140 SaaS teams benchmarked

What you'll get inside:
• Why multi-team reporting breaks between 200 and 1,000 employees — and how to unify metric definitions
• Week-by-week architecture checklist for Snowflake, Okta SSO/SCIM, and HubSpot CRM sync
• Executive license-consolidation worksheet ready for FY27 budget reviews

Form configuration: First name, Last name, Work email, Company, Job title (progressive fields auto-populated for known ICP contacts).`,
      cta: "Download the Playbook (PDF)",
      meta: [
        { label: "Page URL", value: "www.lumenstack.example/resources/2027-saas-analytics-playbook" },
        { label: "Lifecycle rule", value: "Auto-move Lead -> Marketing Qualified Lead on submit" },
        { label: "Rep handoff", value: "Instant notification + 2-hour follow-up task" },
      ],
    },
  ],
  outreach: [
    {
      contactId: "ct-elena",
      role: "VP of Revenue Operations",
      priority: "Primary buyer",
      personalizationAngle: "Multi-team board-deck prep & Series C GTM reporting alignment",
      sendWindow: "Day 2 · Tue 9:05 AM MT",
      subject: "Elena — cutting RevOps reporting prep at Kestrel Ops (2027 Playbook)",
      previewText: "Benchmarks from 140 mid-market SaaS teams running Snowflake + HubSpot.",
      body: `Hi Elena,

Congrats on Kestrel Ops's momentum heading toward 500 employees. At that stage, almost every RevOps leader we speak with hits the same wall: CRM pipeline, Snowflake usage metrics, and Finance ARR end up in three different places right before board prep.

We compiled benchmarks from 140 mid-market SaaS teams (many on Snowflake + Okta + HubSpot like Kestrel Ops) into The 2027 SaaS Analytics Playbook. Teams using the 30-day model cut weekly reporting prep by 68% without adding analyst headcount.

Inside the 18-page guide:
• How RevOps and Finance lock onto one ARR & pipeline definition
• A 30-day Snowflake + Okta rollout checklist
• The license-consolidation ROI model ahead of FY27 planning

Thought this might be useful for you and Marcus as you scale reporting.`,
      ctaLabel: "Download the 2027 SaaS Analytics Playbook",
    },
    {
      contactId: "ct-marcus",
      role: "Director of Data Engineering",
      priority: "Technical evaluator",
      personalizationAngle: "Snowflake warehouse governance, Okta SSO/SCIM, fewer ad-hoc SQL tickets",
      sendWindow: "Day 2 · Tue 9:12 AM MT",
      subject: "Marcus — governed self-serve on Snowflake at Kestrel Ops",
      previewText: "Chapter 3 covers the 30-day Snowflake + Okta connector blueprint.",
      body: `Hi Marcus,

Saw Kestrel Ops is expanding the analytics engineering team. When mid-market SaaS companies scale past 450 employees, Data Engineering usually absorbs dozens of ad-hoc CSV and dashboard requests every week from RevOps and Finance.

Chapter 3 of our new 2027 SaaS Analytics Playbook lays out the governed Snowflake + Okta SCIM architecture 140 SaaS teams use to give GTM teams self-serve workspaces without breaking warehouse governance.

Happy to share a copy — no sales pitch attached.`,
      ctaLabel: "Download the 2027 SaaS Analytics Playbook",
    },
    {
      contactId: "ct-priya",
      role: "VP of Finance",
      priority: "Economic buyer",
      personalizationAngle: "Consolidating overlapping BI spend & predictable per-seat ARR reporting",
      sendWindow: "Day 2 · Tue 9:18 AM MT",
      subject: "Priya — consolidating BI spend ahead of Kestrel Ops's FY27 plan",
      previewText: "Chapter 4 includes the SaaS Finance license-consolidation ROI worksheet.",
      body: `Hi Priya,

As Kestrel Ops plans FY27 software spend, one area we see mid-market Finance leaders consolidate quickly is overlapping BI and reporting tools across RevOps, Product, and Finance.

Chapter 4 of our 2027 SaaS Analytics Playbook walks through the unit-economics model from 140 SaaS operators who unified reporting in 30 days and retired duplicate per-seat licenses.

Sharing the guide in case it helps with your upcoming planning cycle.`,
      ctaLabel: "Download the 2027 SaaS Analytics Playbook",
    },
  ],
  landingPage: {
    url: "www.lumenstack.example/resources/2027-saas-analytics-playbook",
    eyebrow: "2027 BENCHMARK EBOOK · 18 PAGES · PDF",
    headline: "Consolidate SaaS reporting in 30 days — without rebuilding your warehouse",
    subheadline:
      "Learn how 140 mid-market SaaS RevOps, Data Engineering, and Finance teams replaced spreadsheet sprawl with one governed analytics workspace.",
    bullets: [
      "Cut weekly board-deck and GTM reporting prep by 68%",
      "30-day rollout checklist for Snowflake, Okta SSO/SCIM, and HubSpot CRM",
      "Executive ROI worksheet to consolidate overlapping BI seat licenses",
    ],
    formTitle: "Get your copy of the Playbook",
    submitLabel: "Download the Playbook",
    confirmationHeadline: "Your Playbook is ready, Elena.",
    confirmationBody: "Lumenstack-2027-SaaS-Analytics-Playbook.pdf has been delivered to elena.morales@kestrelops.example.",
  },
  repFollowUp: {
    taskTitle: "Follow up with Elena Morales (Kestrel Ops): Playbook download",
    taskNotes: "Tier 1 ICP Match (94/100). Elena (VP RevOps) clicked the Marketing Studio outreach email and downloaded The 2027 SaaS Analytics Playbook. Send tailored follow-up and offer a 20-min architecture consult.",
    slackChannel: "#sales-west-icp",
    slackText: "MQL Alert: Elena Morales (VP RevOps, Kestrel Ops · Tier 1 ICP, score 94) just downloaded The 2027 SaaS Analytics Playbook. Lifecycle moved to MQL. Follow-up task assigned to Jordan Avery.",
    emailSubject: "Re: 2027 SaaS Analytics Playbook — 20 min for Kestrel Ops?",
    emailBody: `Hi Elena,

Saw you grabbed a copy of The 2027 SaaS Analytics Playbook — hope Chapters 2 and 3 are useful as Kestrel Ops scales reporting across RevOps, Data, and Finance.

Since your team already runs Snowflake + Okta + HubSpot, I pulled together a 3-slide look at how similar 400–600 person SaaS teams roll out Lumenstack in under 30 days (including how Marcus's team keeps warehouse governance intact).

Open to a quick 20-minute architecture walkthrough this week? Pick any slot below that works on your calendar.

Best,
Jordan Avery
Account Executive · Lumenstack`,
    meetingTitle: "Lumenstack × Kestrel Ops: 20-Min Analytics Architecture Review",
    meetingDuration: "20 min · Video call with Jordan Avery",
    meetingSlots: [
      { id: "thu-am", day: "Thu, Nov 26", time: "10:30 AM", tz: "MT" },
      { id: "thu-pm", day: "Thu, Nov 26", time: "2:00 PM", tz: "MT" },
      { id: "fri-am", day: "Fri, Nov 27", time: "11:00 AM", tz: "MT" },
    ],
    defaultSlotId: "thu-am",
  },
  deal: {
    id: "dl-kestrel-icp",
    name: "Kestrel Ops: Growth Analytics Platform (ICP Campaign)",
    amount: 98400,
    stage: "new-rfq",
    closeInDays: 45,
    lineItems: [
      { sku: "LS-GRO-SEAT", qty: 80 },
      { sku: "LS-AI-SEAT", qty: 80 },
      { sku: "LS-SEC-PACK", qty: 1 },
      { sku: "LS-ONB-GRO", qty: 1 },
    ],
  },
  dashboard: {
    baseline: {
      accountsReached: 42,
      contactsEngaged: 87,
      leads: 41,
      mqls: 18,
      meetings: 7,
      pipeline: 525600,
      creditsUsed: 278,
    },
    channels: [
      { channel: "Tailored ICP Email", touches: 126, leads: 22, meetings: 5, pipeline: 384000, conversionPct: 17.5 },
      { channel: "Gated Landing Page", touches: 194, leads: 11, meetings: 2, pipeline: 144000, conversionPct: 14.4 },
      { channel: "LinkedIn Social Series", touches: 640, leads: 5, meetings: 1, pipeline: 64000, conversionPct: 6.2 },
      { channel: "Launch Blog Post", touches: 410, leads: 4, meetings: 0, pipeline: 32000, conversionPct: 4.1 },
    ],
    creditBreakdown: [
      { action: "Marketing Studio brief & campaign plan", credits: 45, outcomes: "4-channel 3-week blueprint generated", sharePct: 15 },
      { action: "Content Remix (1 ebook -> 4 formats)", credits: 40, outcomes: "Email, blog, social series, landing page", sharePct: 13 },
      { action: "ICP account & buying-committee enrichment", credits: 98, outcomes: "42 Tier 1 accounts, 126 contacts scored", sharePct: 32 },
      { action: "Role-tailored ICP outreach personalization", credits: 95, outcomes: "126 role-specific emails scheduled", sharePct: 30 },
      { action: "Conversion scoring & rep handoff summaries", credits: 32, outcomes: "19 MQLs routed · 8 meetings booked", sharePct: 10 },
    ],
    assets: [
      { format: "Outreach Email", title: "ICP Outreach Sequence · Touch 1", views: 112, clicks: 49, conversions: 22, influencedPipeline: 384000 },
      { format: "Landing Page", title: "2027 SaaS Analytics Playbook Download", views: 194, clicks: 84, conversions: 42, influencedPipeline: 624000 },
      { format: "Social Posts", title: "LinkedIn Launch Series (3 posts)", views: 640, clicks: 38, conversions: 5, influencedPipeline: 64000 },
      { format: "Blog Post", title: "The 300-Employee Reporting Cliff", views: 410, clicks: 27, conversions: 4, influencedPipeline: 32000 },
    ],
  },
};
