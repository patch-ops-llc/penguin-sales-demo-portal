import type { Pack } from "@/verticals/types";
import { addActivity, DAY, iso, touch } from "./helpers";
import type { Action, World } from "./types";

export type BranchLaunchState = {
  segmentReviewed: boolean;
  campaignLaunched: boolean;
  bookingOpened: boolean;
  booked: boolean;
  bookedSlotId: string | null;
  bookedTopic: string | null;
  attributionVerified: boolean;
  contactId: string | null;
  companyId: string | null;
  dealId: string | null;
};

export type BranchLaunchAction =
  | { t: "bl.reviewSegment" }
  | { t: "bl.launchCampaign"; at: number }
  | { t: "bl.openBooking" }
  | { t: "bl.bookAppointment"; slotId: string; topic?: string; at: number }
  | { t: "bl.verifyAttribution" };

export function seedBranchLaunch(): BranchLaunchState {
  return {
    segmentReviewed: false,
    campaignLaunched: false,
    bookingOpened: false,
    booked: false,
    bookedSlotId: null,
    bookedTopic: null,
    attributionVerified: false,
    contactId: null,
    companyId: null,
    dealId: null,
  };
}

export function isBranchLaunchAction(a: Action): a is BranchLaunchAction {
  return a.t.startsWith("bl.");
}

export function applyBranchLaunch(w: World, a: BranchLaunchAction, pack: Pack): void {
  const cfg = pack.demos.branchLaunch;
  switch (a.t) {
    case "bl.reviewSegment":
      w.bl.segmentReviewed = true;
      return;
    case "bl.launchCampaign": {
      if (!cfg || w.bl.campaignLaunched) return;
      const at = iso(a.at);
      const hc = cfg.heroContact;

      if (!w.companies.some((c) => c.id === hc.companyId)) {
        w.companies.unshift({
          id: hc.companyId,
          name: hc.companyName,
          domain: hc.companyDomain,
          industry: hc.companyIndustry,
          type: "Prospect",
          city: hc.companyCity,
          state: hc.companyState,
          employees: hc.companyEmployees,
          revenue: hc.companyRevenue,
          phone: hc.phone,
          ownerId: hc.ownerId,
          lifecycle: "Lead",
          createdAt: at,
          lastActivityAt: at,
          territory: "East",
          description: `Charlotte regional commercial prospect (${hc.distanceMiles} from ${cfg.branchName}).`,
          isNew: true,
        });
      }
      if (!w.contacts.some((c) => c.id === hc.id)) {
        w.contacts.unshift({
          id: hc.id,
          firstName: hc.firstName,
          lastName: hc.lastName,
          email: hc.email,
          phone: hc.phone,
          title: hc.title,
          companyId: hc.companyId,
          ownerId: hc.ownerId,
          lifecycle: "Lead",
          leadStatus: "Open",
          createdAt: at,
          lastActivityAt: at,
          source: "Email marketing",
          extra: [
            { label: "Branch sub-market", value: hc.submarket },
            { label: "Branch proximity", value: hc.distanceMiles },
            { label: "Launch campaign", value: cfg.campaignName },
            { label: "Marketing consent", value: "Opted in · Zero balances synced" },
          ],
          isNew: true,
        });
      }

      addActivity(w, {
        at,
        type: "email",
        title: `Campaign launched: ${cfg.emailAsset.subject}`,
        body: `Sent to ${cfg.totalEligibleCount.toLocaleString("en-US")} contacts in "${cfg.segmentName}". Paid local ads and ${cfg.socialPosts.length} social calendar posts activated.`,
        byId: w.persona,
        contactIds: [hc.id],
        companyIds: [hc.companyId],
      });
      touch(w, at, { companyId: hc.companyId, contactIds: [hc.id] });
      w.bl.segmentReviewed = true;
      w.bl.campaignLaunched = true;
      w.bl.contactId = hc.id;
      w.bl.companyId = hc.companyId;
      return;
    }
    case "bl.openBooking":
      w.bl.segmentReviewed = true;
      w.bl.campaignLaunched = true;
      w.bl.bookingOpened = true;
      return;
    case "bl.bookAppointment": {
      if (!cfg || w.bl.booked) return;
      const at = iso(a.at);
      const hc = cfg.heroContact;
      const slot = cfg.landingPage.slots.find((s) => s.id === a.slotId) ?? cfg.landingPage.slots[0];
      const topic = a.topic?.trim() || cfg.landingPage.defaultTopic;

      if (!w.companies.some((c) => c.id === hc.companyId)) {
        w.companies.unshift({
          id: hc.companyId,
          name: hc.companyName,
          domain: hc.companyDomain,
          industry: hc.companyIndustry,
          type: "Prospect",
          city: hc.companyCity,
          state: hc.companyState,
          employees: hc.companyEmployees,
          revenue: hc.companyRevenue,
          phone: hc.phone,
          ownerId: hc.ownerId,
          lifecycle: "Opportunity",
          createdAt: at,
          lastActivityAt: at,
          territory: "East",
          description: `Charlotte regional commercial prospect (${hc.distanceMiles} from ${cfg.branchName}).`,
          isNew: true,
        });
      }
      let contact = w.contacts.find((c) => c.id === hc.id);
      if (!contact) {
        contact = {
          id: hc.id,
          firstName: hc.firstName,
          lastName: hc.lastName,
          email: hc.email,
          phone: hc.phone,
          title: hc.title,
          companyId: hc.companyId,
          ownerId: hc.ownerId,
          lifecycle: "Opportunity",
          leadStatus: "Branch Visit Booked",
          createdAt: at,
          lastActivityAt: at,
          source: "Email marketing",
          isNew: true,
        };
        w.contacts.unshift(contact);
      } else {
        contact.lifecycle = "Opportunity";
        contact.leadStatus = "Branch Visit Booked";
      }
      contact.extra = [
        { label: "Branch sub-market", value: hc.submarket },
        { label: "Branch proximity", value: hc.distanceMiles },
        { label: "Launch campaign", value: cfg.campaignName },
        { label: "Booked branch visit", value: `${slot.day} · ${slot.time} ${slot.tz}` },
        { label: "Visit topic", value: topic },
        { label: "Attribution UTM", value: `${cfg.landingPage.utmSource} / ${cfg.landingPage.utmCampaign}` },
      ];

      if (!w.deals.some((d) => d.id === hc.dealId)) {
        w.deals.unshift({
          id: hc.dealId,
          name: hc.dealName,
          companyId: hc.companyId,
          contactIds: [hc.id],
          ownerId: hc.ownerId,
          stage: hc.dealStage,
          amount: hc.dealAmount,
          closeDate: iso(a.at + 35 * DAY),
          createdAt: at,
          lastActivityAt: at,
          type: "New financing",
          lineItems: [],
          source: cfg.campaignName,
          isNew: true,
        });
      }

      if (!w.tasks.some((t) => t.id === "tk-branch-launch-visit")) {
        w.tasks.unshift({
          id: "tk-branch-launch-visit",
          title: hc.taskTitle,
          type: "Call",
          priority: "High",
          dueAt: iso(a.at + 1 * DAY),
          ownerId: hc.ownerId,
          status: "open",
          contactId: hc.id,
          companyId: hc.companyId,
          dealId: hc.dealId,
          notes: `Branch appointment booked via ${cfg.campaignName} landing page (${topic} · ${slot.day} ${slot.time} ${slot.tz}).`,
          isNew: true,
        });
      }

      addActivity(w, {
        at: iso(a.at - 10_000),
        type: "meeting",
        title: `Branch appointment booked — ${cfg.branchName}`,
        body: `${hc.firstName} ${hc.lastName} (${hc.companyName}) booked "${topic}" for ${slot.day} at ${slot.time} ${slot.tz} (${slot.advisorLabel}).`,
        byId: null,
        contactIds: [hc.id],
        companyIds: [hc.companyId],
        dealIds: [hc.dealId],
      });
      addActivity(w, {
        at,
        type: "deal",
        title: `Attributed opportunity opened: ${hc.dealName}`,
        body: `Campaign attribution: ${cfg.campaignName} (utm_source=${cfg.landingPage.utmSource}, utm_campaign=${cfg.landingPage.utmCampaign}).`,
        byId: hc.ownerId,
        contactIds: [hc.id],
        companyIds: [hc.companyId],
        dealIds: [hc.dealId],
        linkPath: `/reports/${cfg.reportId}`,
        linkLabel: "View attribution report",
      });
      touch(w, at, { companyId: hc.companyId, contactIds: [hc.id], dealId: hc.dealId });
      w.bl.segmentReviewed = true;
      w.bl.campaignLaunched = true;
      w.bl.bookingOpened = true;
      w.bl.booked = true;
      w.bl.bookedSlotId = slot.id;
      w.bl.bookedTopic = topic;
      w.bl.contactId = hc.id;
      w.bl.companyId = hc.companyId;
      w.bl.dealId = hc.dealId;
      return;
    }
    case "bl.verifyAttribution":
      w.bl.attributionVerified = true;
      return;
  }
}
