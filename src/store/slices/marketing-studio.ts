import type { Deal, LineItem, MsAssetFormatId, Pack } from "@/verticals/types";
import { addActivity, DAY, iso, touch } from "./helpers";
import type { Action, World } from "./types";

export type MarketingStudioState = {
  briefGoal?: string;
  briefAudience?: string;
  briefOffer?: string;
  briefDone: boolean;
  planDone: boolean;
  disabledChannels: string[];
  voiceId: string | null;
  voiceDone: boolean;
  assetDone: boolean;
  remixed: boolean;
  assetEdits: Partial<Record<MsAssetFormatId, string>>;
  approved: MsAssetFormatId[];
  scheduled: boolean;
  emailOpened: boolean;
  emailClicked: boolean;
  converted: boolean;
  repSent: boolean;
  meetingSlotId: string | null;
  meetingBooked: boolean;
  dealId: string | null;
  taskId: string | null;
};

export type MarketingStudioAction =
  | { t: "ms.briefEdit"; field: "goal" | "audience" | "offer"; value: string }
  | { t: "ms.briefSubmit" }
  | { t: "ms.toggleChannel"; channelId: string }
  | { t: "ms.planConfirm" }
  | { t: "ms.selectVoice"; voiceId: string }
  | { t: "ms.voiceApply" }
  | { t: "ms.assetAttach" }
  | { t: "ms.remix" }
  | { t: "ms.editAsset"; id: MsAssetFormatId; body: string }
  | { t: "ms.approveAsset"; id: MsAssetFormatId }
  | { t: "ms.approveAll" }
  | { t: "ms.schedule"; at: number }
  | { t: "ms.clickEmail"; at: number }
  | { t: "ms.convert"; at: number }
  | { t: "ms.repFollowUp"; at: number }
  | { t: "ms.selectSlot"; slotId: string }
  | { t: "ms.bookMeeting"; slotId?: string; at: number };

export function seedMarketingStudio(pack: Pack): MarketingStudioState {
  return {
    briefDone: false,
    planDone: false,
    disabledChannels: [],
    voiceId: pack.demos.marketingStudio?.defaultVoiceId ?? null,
    voiceDone: false,
    assetDone: false,
    remixed: false,
    assetEdits: {},
    approved: [],
    scheduled: false,
    emailOpened: false,
    emailClicked: false,
    converted: false,
    repSent: false,
    meetingSlotId: pack.demos.marketingStudio?.repFollowUp.defaultSlotId ?? null,
    meetingBooked: false,
    dealId: null,
    taskId: null,
  };
}

export function isMarketingStudioAction(a: Action): a is MarketingStudioAction {
  return a.t.startsWith("ms.");
}

export function applyMarketingStudio(w: World, a: MarketingStudioAction, pack: Pack): void {
  switch (a.t) {
    case "ms.briefEdit":
      if (a.field === "goal") w.ms.briefGoal = a.value;
      else if (a.field === "audience") w.ms.briefAudience = a.value;
      else w.ms.briefOffer = a.value;
      return;
    case "ms.briefSubmit":
      w.ms.briefDone = true;
      w.ui["ms.stage"] = "plan";
      return;
    case "ms.toggleChannel":
      w.ms.disabledChannels = w.ms.disabledChannels.includes(a.channelId)
        ? w.ms.disabledChannels.filter((c) => c !== a.channelId)
        : [...w.ms.disabledChannels, a.channelId];
      return;
    case "ms.planConfirm":
      w.ms.briefDone = true;
      w.ms.planDone = true;
      w.ui["ms.stage"] = "voice";
      return;
    case "ms.selectVoice":
      w.ms.voiceId = a.voiceId;
      return;
    case "ms.voiceApply": {
      const config = pack.demos.marketingStudio;
      if (config && !w.ms.voiceId) w.ms.voiceId = config.defaultVoiceId;
      w.ms.voiceDone = true;
      w.ui["ms.stage"] = "asset";
      return;
    }
    case "ms.assetAttach":
      w.ms.assetDone = true;
      w.ui["ms.stage"] = "remix";
      return;
    case "ms.remix":
      w.ms.remixed = true;
      w.ui["ms.stage"] = "approve";
      return;
    case "ms.editAsset":
      w.ms.assetEdits[a.id] = a.body;
      return;
    case "ms.approveAsset": {
      if (!w.ms.approved.includes(a.id)) w.ms.approved = [...w.ms.approved, a.id];
      const total = pack.demos.marketingStudio?.remixedAssets.length ?? 4;
      if (w.ms.approved.length >= total) w.ui["ms.stage"] = "schedule";
      return;
    }
    case "ms.approveAll": {
      const ids = pack.demos.marketingStudio?.remixedAssets.map((r) => r.id) ?? (["email", "blog", "social", "landing"] as MsAssetFormatId[]);
      w.ms.approved = [...ids];
      w.ui["ms.stage"] = "schedule";
      return;
    }
    case "ms.schedule": {
      const config = pack.demos.marketingStudio;
      if (!config || w.ms.scheduled) return;
      const at = iso(a.at);
      w.ms.scheduled = true;
      const contactIds = config.outreach.map((o) => o.contactId);
      addActivity(w, {
        at,
        type: "email",
        title: `Marketing Studio outreach scheduled (${config.outreach.length} ICP contacts)`,
        body: `Campaign: ${config.campaignName} (${config.marketer.name}). Tailored emails delivered to ${config.outreach.length} buying-committee contacts at Kestrel Ops and ${config.brief.targetAccounts - 1} other Tier 1 accounts.`,
        byId: null,
        contactIds,
        companyIds: [config.companyId],
      });
      touch(w, at, { companyId: config.companyId, contactIds });
      return;
    }
    case "ms.clickEmail": {
      const config = pack.demos.marketingStudio;
      if (!config || w.ms.emailClicked) return;
      const at = iso(a.at);
      w.ms.emailOpened = true;
      w.ms.emailClicked = true;
      const primary = config.outreach.find((o) => o.contactId === config.primaryContactId);
      addActivity(w, {
        at,
        type: "email",
        title: `Marketing email opened & clicked: ${primary?.subject ?? config.campaignName}`,
        body: `Clicked "${primary?.ctaLabel ?? "Download the Playbook"}" -> ${config.landingPage.url}.`,
        byId: null,
        contactIds: [config.primaryContactId],
        companyIds: [config.companyId],
      });
      touch(w, at, { companyId: config.companyId, contactIds: [config.primaryContactId] });
      return;
    }
    case "ms.convert": {
      const config = pack.demos.marketingStudio;
      if (!config || w.ms.converted) return;
      const at = iso(a.at);
      w.ms.emailOpened = true;
      w.ms.emailClicked = true;
      w.ms.converted = true;
      const contact = w.contacts.find((c) => c.id === config.primaryContactId);
      if (contact) {
        contact.lifecycle = "Marketing Qualified Lead";
        contact.leadStatus = "In progress";
        contact.score = config.icp.score;
        contact.source = `Marketing Studio · ${config.sourceAsset.title.split(":")[0]}`;
        contact.lastActivityAt = at;
      }
      const ids = { contactIds: [config.primaryContactId], companyIds: [config.companyId] };
      addActivity(w, {
        at: iso(a.at + 1000),
        type: "form",
        title: `Form submission: ${config.sourceAsset.title.split(":")[0]}`,
        body: `Downloaded ${config.sourceAsset.fileName} on ${config.landingPage.url}. Attributed to ${config.campaignName}.`,
        byId: null,
        ...ids,
      });
      addActivity(w, {
        at: iso(a.at + 2000),
        type: "lifecycle",
        title: "Lifecycle stage changed: Lead -> Marketing Qualified Lead",
        body: `Triggered by ebook conversion on a Tier 1 ICP Match account (score ${config.icp.score}).`,
        byId: null,
        ...ids,
      });
      const taskId = "tk-ms-followup";
      w.tasks.unshift({
        id: taskId,
        title: config.repFollowUp.taskTitle,
        type: "Email",
        priority: "High",
        dueAt: iso(a.at + 2 * 3_600_000),
        ownerId: config.repId,
        status: "open",
        contactId: config.primaryContactId,
        companyId: config.companyId,
        notes: config.repFollowUp.taskNotes,
        isNew: true,
      });
      w.ms.taskId = taskId;
      const repName = pack.personas.find((p) => p.id === config.repId)?.name ?? "Assigned rep";
      addActivity(w, {
        at: iso(a.at + 3000),
        type: "task",
        title: `Follow-up task created for ${repName}`,
        body: config.repFollowUp.taskTitle,
        byId: null,
        ...ids,
        linkPath: "/tasks",
        linkLabel: "View tasks",
      });
      w.notifications.unshift({
        id: "nt-ms-mql",
        personaId: config.repId,
        at: iso(a.at + 3000),
        kind: "lead",
        title: "ICP contact converted to MQL",
        body: `${contact ? `${contact.firstName} ${contact.lastName}` : "Elena Morales"} (Kestrel Ops) downloaded The 2027 SaaS Analytics Playbook. Follow-up task created.`,
        path: "/tasks",
        read: false,
        slack: { channel: config.repFollowUp.slackChannel, text: config.repFollowUp.slackText },
      });
      touch(w, iso(a.at + 3000), { companyId: config.companyId, contactIds: [config.primaryContactId] });
      return;
    }
    case "ms.repFollowUp": {
      const config = pack.demos.marketingStudio;
      if (!config || w.ms.repSent) return;
      const at = iso(a.at);
      w.ms.repSent = true;
      w.ui.bell = "closed";
      const notif = w.notifications.find((n) => n.id === "nt-ms-mql");
      if (notif) notif.read = true;
      const contact = w.contacts.find((c) => c.id === config.primaryContactId);
      addActivity(w, {
        at,
        type: "email",
        title: `Email to ${contact ? `${contact.firstName} ${contact.lastName}` : "Elena Morales"}: ${config.repFollowUp.emailSubject}`,
        body: "Sent personalized follow-up referencing the 2027 Playbook and Snowflake + Okta architecture with 20-min meeting link.",
        byId: config.repId,
        contactIds: [config.primaryContactId],
        companyIds: [config.companyId],
      });
      touch(w, at, { companyId: config.companyId, contactIds: [config.primaryContactId] });
      return;
    }
    case "ms.selectSlot":
      w.ms.meetingSlotId = a.slotId;
      return;
    case "ms.bookMeeting": {
      const config = pack.demos.marketingStudio;
      if (!config || w.ms.meetingBooked) return;
      const at = iso(a.at);
      const slotId = a.slotId ?? w.ms.meetingSlotId ?? config.repFollowUp.defaultSlotId;
      w.ms.meetingSlotId = slotId;
      w.ms.meetingBooked = true;
      const slot = config.repFollowUp.meetingSlots.find((s) => s.id === slotId) ?? config.repFollowUp.meetingSlots[0];
      const lineItems: LineItem[] = config.deal.lineItems
        .map(({ sku, qty }) => {
          const p = pack.products.find((x) => x.sku === sku);
          if (!p) return null;
          return {
            sku: p.sku,
            name: p.name,
            qty,
            unitPrice: p.price,
            unitCost: p.cost,
            leadDays: p.leadDays,
            ...(p.timing ? { timing: p.timing } : {}),
            ...(p.recurring ? { recurring: true } : {}),
          } as LineItem;
        })
        .filter((x): x is LineItem => x !== null);
      const amount = lineItems.length > 0 ? lineItems.reduce((sum, l) => sum + l.qty * l.unitPrice, 0) : config.deal.amount;
      const contactIds = config.icp.buyingRoles.map((r) => r.contactId);
      const deal: Deal = {
        id: config.deal.id,
        name: config.deal.name,
        companyId: config.companyId,
        contactIds,
        ownerId: config.repId,
        stage: config.deal.stage,
        amount,
        closeDate: iso(a.at + config.deal.closeInDays * DAY),
        createdAt: at,
        lastActivityAt: at,
        type: "New business",
        lineItems,
        source: config.campaignName,
        isNew: true,
      };
      w.deals.unshift(deal);
      w.ms.dealId = deal.id;
      const contact = w.contacts.find((c) => c.id === config.primaryContactId);
      if (contact) {
        contact.lifecycle = "Opportunity";
        contact.leadStatus = "Connected";
      }
      const company = w.companies.find((c) => c.id === config.companyId);
      if (company) company.lifecycle = "Opportunity";
      const task = w.tasks.find((t) => t.id === w.ms.taskId);
      if (task) {
        task.dealId = deal.id;
        task.status = "done";
      }
      addActivity(w, {
        at,
        type: "meeting",
        title: `Meeting booked: ${config.repFollowUp.meetingTitle}`,
        body: `${slot.day} at ${slot.time} ${slot.tz} (${config.repFollowUp.meetingDuration}). Booked by Elena Morales via HubSpot Meetings link.`,
        byId: config.repId,
        contactIds: [config.primaryContactId],
        companyIds: [config.companyId],
        dealIds: [deal.id],
      });
      addActivity(w, {
        at: iso(a.at + 1000),
        type: "deal",
        title: "Deal created from booked meeting",
        body: `${deal.name} ($${amount.toLocaleString("en-US")}) created in Discovery and attributed to ${config.campaignName}.`,
        byId: config.repId,
        contactIds,
        companyIds: [config.companyId],
        dealIds: [deal.id],
        linkPath: `/deals/${deal.id}`,
        linkLabel: "View deal",
      });
      touch(w, iso(a.at + 1000), { companyId: config.companyId, contactIds, dealId: deal.id });
      return;
    }
  }
}
