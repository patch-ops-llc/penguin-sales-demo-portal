import type { Company, Contact, Deal, LineItem, Pack } from "@/verticals/types";
import { addActivity, DAY, iso, touch } from "./helpers";
import type { Action, World } from "./types";

export type SocialAdsState = {
  campaignOpened: boolean;
  calendarPlanned: boolean;
  approvedPostIds: string[];
  postEdits: Record<string, string>;
  statusReviewed: boolean;
  googleSeen: boolean;
  socialAdClicked: boolean;
  landingSeen: boolean;
  submitted: boolean;
  contactId: string | null;
  companyId: string | null;
  dealId: string | null;
  contactSeen: boolean;
  timelineSeen: boolean;
  followupSent: boolean;
  replies: Record<string, { text: string; at: string }>;
  insightsSeen: boolean;
};

export type SocialAdsAction =
  | { t: "sa.openCampaign" }
  | { t: "sa.planCalendar" }
  | { t: "sa.editPost"; postId: string; copy: string }
  | { t: "sa.approvePost"; postId: string }
  | { t: "sa.approveAllDrafts" }
  | { t: "sa.reviewStatus" }
  | { t: "sa.seenGoogle" }
  | { t: "sa.clickSocialAd" }
  | { t: "sa.seenLanding" }
  | { t: "sa.submitForm"; at: number; overrides?: { firstName?: string; lastName?: string; email?: string; companyName?: string; rolesNeeded?: string; notes?: string } }
  | { t: "sa.seenContact" }
  | { t: "sa.seenTimeline" }
  | { t: "sa.sendFollowup"; at: number }
  | { t: "sa.replyInbox"; threadId: string; text: string; at: number }
  | { t: "sa.seenInsights" };

export function seedSocialAds(): SocialAdsState {
  return {
    campaignOpened: false,
    calendarPlanned: false,
    approvedPostIds: [],
    postEdits: {},
    statusReviewed: false,
    googleSeen: false,
    socialAdClicked: false,
    landingSeen: false,
    submitted: false,
    contactId: null,
    companyId: null,
    dealId: null,
    contactSeen: false,
    timelineSeen: false,
    followupSent: false,
    replies: {},
    insightsSeen: false,
  };
}

export function isSocialAdsAction(a: Action): a is SocialAdsAction {
  return a.t.startsWith("sa.");
}

export function applySocialAds(w: World, a: SocialAdsAction, pack: Pack): void {
  switch (a.t) {
    case "sa.openCampaign":
      w.sa.campaignOpened = true;
      return;
    case "sa.planCalendar":
      w.sa.campaignOpened = true;
      w.sa.calendarPlanned = true;
      return;
    case "sa.editPost":
      w.sa.postEdits[a.postId] = a.copy;
      return;
    case "sa.approvePost":
      if (!w.sa.approvedPostIds.includes(a.postId)) w.sa.approvedPostIds.push(a.postId);
      return;
    case "sa.approveAllDrafts": {
      const cfg = pack.demos.socialAds;
      if (!cfg) return;
      for (const p of cfg.posts) {
        if (p.needsApproval && !w.sa.approvedPostIds.includes(p.id)) w.sa.approvedPostIds.push(p.id);
      }
      return;
    }
    case "sa.reviewStatus":
      w.sa.statusReviewed = true;
      return;
    case "sa.seenGoogle":
      w.sa.googleSeen = true;
      return;
    case "sa.clickSocialAd":
      w.sa.googleSeen = true;
      w.sa.socialAdClicked = true;
      return;
    case "sa.seenLanding":
      w.sa.landingSeen = true;
      return;
    case "sa.submitForm": {
      const cfg = pack.demos.socialAds;
      if (!cfg || w.sa.submitted) return;
      const lead = cfg.landingPage.lead;
      const firstName = a.overrides?.firstName?.trim() || lead.firstName;
      const lastName = a.overrides?.lastName?.trim() || lead.lastName;
      const email = a.overrides?.email?.trim() || lead.email;
      const companyName = a.overrides?.companyName?.trim() || lead.companyName;
      const rolesNeeded = a.overrides?.rolesNeeded?.trim() || lead.rolesNeeded;
      const notes = a.overrides?.notes?.trim() || lead.notes;
      const heroCampaign = cfg.campaigns.find((c) => c.id === cfg.heroCampaignId) ?? cfg.campaigns[0];
      const at = iso(a.at);

      const company: Company = {
        id: lead.companyId,
        name: companyName,
        domain: lead.companyDomain,
        industry: lead.companyIndustry,
        type: "Prospect",
        city: lead.companyCity,
        state: lead.companyState,
        employees: lead.companyEmployees,
        revenue: lead.companyRevenue,
        phone: "(303) 555-0100",
        ownerId: lead.assignedRepId,
        lifecycle: "Opportunity",
        createdAt: at,
        lastActivityAt: at,
        territory: "Mountain West",
        description: "320-bed regional acute care medical center serving metro Denver. Zero patient PHI stored in HubSpot.",
        extra: [{ label: "Facility tier", value: "Health system" }],
        isNew: true,
      };
      const contact: Contact = {
        id: lead.contactId,
        firstName,
        lastName,
        email,
        phone: lead.phone,
        title: lead.title,
        companyId: company.id,
        ownerId: lead.assignedRepId,
        lifecycle: "Marketing Qualified Lead",
        leadStatus: "New",
        createdAt: at,
        lastActivityAt: at,
        source: "Paid Social",
        score: 94,
        extra: [
          { label: "Campaign", value: heroCampaign?.name ?? "Q1 Travel RN & ICU Surge Staffing" },
          { label: "Original source drill-down", value: "LinkedIn Paid Social · 48-Hr ICU Shortlist" },
          { label: "UTM campaign", value: cfg.landingPage.utmCampaign },
          { label: "Staffing request", value: rolesNeeded },
          { label: "Shift window", value: lead.shiftWindow },
        ],
        isNew: true,
      };
      const icuProd = pack.products.find((p) => p.sku === "CC-RN-ICU");
      const erProd = pack.products.find((p) => p.sku === "CC-RN-ER");
      const credProd = pack.products.find((p) => p.sku === "CC-CRED-FAST");
      const lineItems: LineItem[] = [
        ...(icuProd ? [{ sku: icuProd.sku, name: icuProd.name, qty: 4, unitPrice: icuProd.price, unitCost: icuProd.cost, leadDays: icuProd.leadDays, timing: icuProd.timing }] : []),
        ...(erProd ? [{ sku: erProd.sku, name: erProd.name, qty: 2, unitPrice: erProd.price, unitCost: erProd.cost, leadDays: erProd.leadDays, timing: erProd.timing }] : []),
        ...(credProd ? [{ sku: credProd.sku, name: credProd.name, qty: 1, unitPrice: credProd.price, unitCost: credProd.cost, leadDays: credProd.leadDays, timing: credProd.timing }] : []),
      ];
      const deal: Deal = {
        id: lead.dealId,
        name: lead.dealName,
        companyId: company.id,
        contactIds: [contact.id],
        ownerId: lead.assignedRepId,
        stage: "qualified",
        amount: lineItems.length > 0 ? lineItems.reduce((sum, l) => sum + l.qty * l.unitPrice, 0) : lead.dealAmount,
        closeDate: iso(a.at + 21 * DAY),
        createdAt: at,
        lastActivityAt: at,
        type: "Job order",
        lineItems,
        source: `Paid Social · ${heroCampaign?.name ?? "Q1 Travel RN & ICU Surge Staffing"}`,
        isNew: true,
      };

      w.companies.unshift(company);
      w.contacts.unshift(contact);
      w.deals.unshift(deal);

      const ids = { contactIds: [contact.id], companyIds: [company.id], dealIds: [deal.id] };
      addActivity(w, {
        at: iso(a.at - 18 * 60_000),
        type: "lifecycle",
        title: "Paid search ad click — Google Ads",
        body: `Searched "${cfg.googleAd.query}" and clicked Sponsored ad: ${cfg.googleAd.sponsored.headline}. Campaign: ${heroCampaign?.name}.`,
        byId: null,
        contactIds: [contact.id],
        companyIds: [company.id],
      });
      addActivity(w, {
        at: iso(a.at - 9 * 60_000),
        type: "note",
        title: "Social activity — LinkedIn organic post engagement",
        body: `Viewed and liked Crestline Clinical Staffing's post "${cfg.socialFeed.organicPost.statHeadline} — Winter ICU Census Playbook" in LinkedIn feed.`,
        byId: null,
        contactIds: [contact.id],
        companyIds: [company.id],
      });
      addActivity(w, {
        at: iso(a.at - 3 * 60_000),
        type: "lifecycle",
        title: "Paid social ad click — LinkedIn Sponsored",
        body: `Clicked "${cfg.socialFeed.paidAd.ctaLabel}" on "${cfg.socialFeed.paidAd.headline}". UTM: utm_source=${cfg.landingPage.utmSource}&utm_campaign=${cfg.landingPage.utmCampaign}.`,
        byId: null,
        contactIds: [contact.id],
        companyIds: [company.id],
      });
      addActivity(w, {
        at: iso(a.at - 5_000),
        type: "form",
        title: `Form submission: ${cfg.landingPage.formTitle}`,
        body: `${rolesNeeded} · ${lead.shiftWindow}. "${notes}"`,
        byId: null,
        ...ids,
      });
      addActivity(w, {
        at,
        type: "deal",
        title: "Job-order deal created from campaign conversion",
        body: `${deal.name} ($${deal.amount.toLocaleString("en-US")}) attributed to ${heroCampaign?.name}.`,
        byId: null,
        ...ids,
        linkPath: `/deals/${deal.id}`,
        linkLabel: "View deal",
      });

      w.sa.landingSeen = true;
      w.sa.submitted = true;
      w.sa.contactId = contact.id;
      w.sa.companyId = company.id;
      w.sa.dealId = deal.id;
      return;
    }
    case "sa.seenContact":
      w.sa.contactSeen = true;
      return;
    case "sa.seenTimeline":
      w.sa.contactSeen = true;
      w.sa.timelineSeen = true;
      return;
    case "sa.sendFollowup": {
      const cfg = pack.demos.socialAds;
      if (!cfg || !w.sa.contactId || w.sa.followupSent) return;
      const lead = cfg.landingPage.lead;
      const at = iso(a.at);
      const rep = pack.personas.find((p) => p.id === lead.assignedRepId);
      const ids = { contactIds: [w.sa.contactId], companyIds: w.sa.companyId ? [w.sa.companyId] : [], dealIds: w.sa.dealId ? [w.sa.dealId] : [] };

      addActivity(w, {
        at: iso(a.at - 1_000),
        type: "email",
        title: `Automated follow-up email sent: ${cfg.landingPage.followUpEmail.subject}`,
        body: cfg.landingPage.followUpEmail.preview,
        byId: lead.assignedRepId,
        ...ids,
      });
      addActivity(w, {
        at,
        type: "workflow",
        title: `Workflow ran: Assigned rep ${rep?.name ?? "Marcus Delgado"} notified`,
        body: `High-priority call task created for ${rep?.name ?? "Marcus Delgado"} and alert posted in ${cfg.landingPage.repAlert.channel}.`,
        byId: null,
        ...ids,
        linkPath: "/workflows/wf-staffing-followup",
        linkLabel: "View workflow",
      });
      w.tasks.unshift({
        id: "tk-sa-followup",
        title: cfg.landingPage.repAlert.taskTitle,
        type: "Call",
        priority: "High",
        dueAt: iso(a.at + 2 * 3_600_000),
        ownerId: lead.assignedRepId,
        status: "open",
        contactId: w.sa.contactId,
        companyId: w.sa.companyId ?? undefined,
        dealId: w.sa.dealId ?? undefined,
        notes: "Paid Social MQL from Q1 Travel RN & ICU Surge Staffing. Deliver 48-hour shortlist.",
        isNew: true,
      });
      w.notifications.unshift({
        id: "nt-sa-rep",
        personaId: lead.assignedRepId,
        at,
        kind: "lead",
        title: `New staffing lead assigned: ${lead.firstName} ${lead.lastName}`,
        body: `${lead.companyName} (${lead.rolesNeeded}). Automated confirmation email already sent.`,
        path: `/contacts/${w.sa.contactId}`,
        read: false,
        slack: { channel: cfg.landingPage.repAlert.channel, text: cfg.landingPage.repAlert.text },
      });
      w.notifications.unshift({
        id: "nt-sa-marketer",
        personaId: pack.defaultPersonaId,
        at,
        kind: "lead",
        title: `Follow-up sent & ${rep?.name ?? "Marcus Delgado"} notified`,
        body: `${lead.firstName} ${lead.lastName} (${lead.companyName}) emailed and routed to ${rep?.name ?? "Marcus Delgado"}.`,
        path: `/contacts/${w.sa.contactId}`,
        read: false,
        slack: { channel: cfg.landingPage.repAlert.channel, text: cfg.landingPage.repAlert.text },
      });
      touch(w, at, { companyId: w.sa.companyId, contactIds: [w.sa.contactId], dealId: w.sa.dealId });
      w.sa.followupSent = true;
      return;
    }
    case "sa.replyInbox": {
      const text = a.text.trim();
      if (!text) return;
      w.sa.replies[a.threadId] = { text, at: iso(a.at) };
      if (a.threadId === "si-1") {
        const n = w.notifications.find((x) => x.id === "nt-hc-1");
        if (n) n.read = true;
      }
      return;
    }
    case "sa.seenInsights":
      w.sa.insightsSeen = true;
      return;
  }
}
