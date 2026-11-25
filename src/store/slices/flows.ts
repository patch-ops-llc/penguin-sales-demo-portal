import type { Pack } from "@/verticals/types";
import { addActivity, iso, touch } from "./helpers";
import type { Action, World } from "./types";

/**
 * Records the headless flows create that the core store has no home for: marketing segments and
 * campaigns with their drafted assets, support tickets, and reports saved to a dashboard. Plain
 * records with their own timelines, mutated only through actions, so Back, Reset, replay, and the
 * server's rebuild of the world all behave as they do for every other slice.
 */

export type HfSegment = { id: string; name: string; criteria: string[]; size: number; createdAt: string };

export type HfAssetKind = "email" | "landing" | "social";
export type HfAsset = { id: string; kind: HfAssetKind; title: string; body: string; channel?: string; status: "draft" | "scheduled" | "live" };

export type HfCampaignStats = { sent: number; delivered: number; opens: number; clicks: number; submissions: number };
export type HfCampaign = {
  id: string;
  name: string;
  goal: string;
  segmentId: string;
  channels: string[];
  startsOn: string;
  status: "draft" | "scheduled" | "live";
  sendAt: string | null;
  assets: HfAsset[];
  stats: HfCampaignStats | null;
  createdAt: string;
};

export type HfTicketEvent = { id: string; at: string; kind: "created" | "reply" | "inbound" | "status" | "resolved"; title: string; body: string; actor: string };
export type HfTicket = {
  id: string;
  number: string;
  subject: string;
  description: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  status: "new" | "waiting" | "closed";
  companyId: string;
  contactId: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  resolution: string | null;
  timeline: HfTicketEvent[];
};

export type HfReport = { id: string; dashboard: string; title: string; summary: string; kpis: { label: string; value: string; delta?: string }[]; columns: string[]; rows: string[][]; createdAt: string };

export type FlowsState = { segments: HfSegment[]; campaigns: HfCampaign[]; tickets: HfTicket[]; reports: HfReport[]; beats: string[] };

export type FlowsAction =
  | { t: "hf.segment"; id: string; name: string; criteria: string[]; size: number; at: number }
  | { t: "hf.campaign"; id: string; name: string; goal: string; segmentId: string; channels: string[]; startsOn: string; at: number }
  | { t: "hf.asset"; campaignId: string; asset: Omit<HfAsset, "status"> }
  | { t: "hf.schedule"; campaignId: string; sendAt: string; at: number }
  | { t: "hf.engage"; campaignId: string; contactId: string; stats: HfCampaignStats; at: number }
  | { t: "hf.report"; id: string; dashboard: string; title: string; summary: string; kpis: HfReport["kpis"]; columns: string[]; rows: string[][]; at: number }
  | { t: "hf.ticket"; id: string; number: string; subject: string; description: string; priority: HfTicket["priority"]; companyId: string; contactId: string; ownerId: string; at: number }
  | { t: "hf.ticketReply"; id: string; text: string; at: number }
  | { t: "hf.ticketInbound"; id: string; text: string; at: number }
  | { t: "hf.ticketClose"; id: string; resolution: string; at: number }
  | { t: "hf.beat"; id: string };

export function seedFlows(): FlowsState {
  return { segments: [], campaigns: [], tickets: [], reports: [], beats: [] };
}

export function isFlowsAction(a: Action): a is FlowsAction {
  return a.t.startsWith("hf.");
}

function event(w: World, ticket: HfTicket, e: Omit<HfTicketEvent, "id">): void {
  w.seq += 1;
  ticket.timeline.unshift({ id: `hf-ev-${w.seq}`, ...e });
  ticket.updatedAt = e.at;
}

const who = (pack: Pack, w: World, id?: string) => pack.personas.find((p) => p.id === (id ?? w.persona))?.name ?? "Lumenstack";

export function applyFlows(w: World, a: FlowsAction, pack: Pack): void {
  switch (a.t) {
    case "hf.segment": {
      if (w.hf.segments.some((s) => s.id === a.id)) return;
      w.hf.segments.unshift({ id: a.id, name: a.name, criteria: a.criteria, size: a.size, createdAt: iso(a.at) });
      return;
    }
    case "hf.campaign": {
      if (w.hf.campaigns.some((c) => c.id === a.id)) return;
      w.hf.campaigns.unshift({ id: a.id, name: a.name, goal: a.goal, segmentId: a.segmentId, channels: a.channels, startsOn: a.startsOn, status: "draft", sendAt: null, assets: [], stats: null, createdAt: iso(a.at) });
      return;
    }
    case "hf.asset": {
      const c = w.hf.campaigns.find((x) => x.id === a.campaignId);
      if (!c || c.assets.some((x) => x.id === a.asset.id)) return;
      c.assets.push({ ...a.asset, status: "draft" });
      return;
    }
    case "hf.schedule": {
      const c = w.hf.campaigns.find((x) => x.id === a.campaignId);
      if (!c) return;
      c.status = "scheduled";
      c.sendAt = a.sendAt;
      for (const asset of c.assets) if (asset.kind === "email" || asset.kind === "landing") asset.status = "scheduled";
      return;
    }
    case "hf.engage": {
      const c = w.hf.campaigns.find((x) => x.id === a.campaignId);
      if (!c) return;
      const at = iso(a.at);
      c.status = "live";
      c.stats = a.stats;
      for (const asset of c.assets) asset.status = "live";
      const contact = w.contacts.find((x) => x.id === a.contactId);
      if (contact) {
        const companyIds = contact.companyId ? [contact.companyId] : [];
        const landing = c.assets.find((x) => x.kind === "landing");
        addActivity(w, { at: iso(a.at - 90_000), type: "email", title: `Marketing email clicked: ${c.assets.find((x) => x.kind === "email")?.title ?? c.name}`, body: `${contact.firstName} ${contact.lastName} opened and clicked through from campaign "${c.name}".`, byId: null, contactIds: [contact.id], companyIds, linkPath: `/campaigns/${c.id}`, linkLabel: "View campaign" });
        addActivity(w, { at, type: "form", title: `Form submission: ${landing?.title ?? "Landing page"}`, body: `${contact.firstName} ${contact.lastName} (${contact.title}) submitted the campaign landing page form. Attributed to "${c.name}".`, byId: null, contactIds: [contact.id], companyIds, linkPath: `/campaigns/${c.id}`, linkLabel: "View campaign" });
        touch(w, at, { companyId: contact.companyId, contactIds: [contact.id] });
      }
      return;
    }
    case "hf.report": {
      if (w.hf.reports.some((r) => r.id === a.id)) return;
      w.hf.reports.unshift({ id: a.id, dashboard: a.dashboard, title: a.title, summary: a.summary, kpis: a.kpis, columns: a.columns, rows: a.rows, createdAt: iso(a.at) });
      return;
    }
    case "hf.ticket": {
      if (w.hf.tickets.some((t) => t.id === a.id)) return;
      const at = iso(a.at);
      const owner = who(pack, w, a.ownerId);
      const ticket: HfTicket = { id: a.id, number: a.number, subject: a.subject, description: a.description, priority: a.priority, status: "new", companyId: a.companyId, contactId: a.contactId, ownerId: a.ownerId, createdAt: at, updatedAt: at, resolution: null, timeline: [] };
      event(w, ticket, { at, kind: "created", title: `Ticket ${a.number} created (${a.priority})`, body: a.description, actor: owner });
      w.hf.tickets.unshift(ticket);
      addActivity(w, { at, type: "note", title: `Ticket ${a.number} opened: ${a.subject}`, body: `${a.priority} priority · assigned to ${owner}.`, byId: a.ownerId, contactIds: [a.contactId], companyIds: [a.companyId], linkPath: `/support/${a.id}`, linkLabel: "View ticket" });
      touch(w, at, { companyId: a.companyId, contactIds: [a.contactId] });
      return;
    }
    case "hf.ticketReply": {
      const t = w.hf.tickets.find((x) => x.id === a.id);
      if (!t || t.status === "closed") return;
      const at = iso(a.at);
      const contact = w.contacts.find((c) => c.id === t.contactId);
      event(w, t, { at, kind: "reply", title: `Reply sent to ${contact ? `${contact.firstName} ${contact.lastName}` : "the customer"}`, body: a.text, actor: who(pack, w, t.ownerId) });
      event(w, t, { at: iso(a.at + 1_000), kind: "status", title: "Status: Waiting on customer", body: "The reply went out; the ticket waits for the customer's answer.", actor: "HubSpot Service Hub" });
      t.status = "waiting";
      addActivity(w, { at, type: "email", title: `Email sent: Re: ${t.subject}`, body: a.text, byId: t.ownerId, contactIds: [t.contactId], companyIds: [t.companyId], linkPath: `/support/${t.id}`, linkLabel: "View ticket" });
      touch(w, at, { companyId: t.companyId, contactIds: [t.contactId] });
      return;
    }
    case "hf.ticketInbound": {
      const t = w.hf.tickets.find((x) => x.id === a.id);
      if (!t) return;
      const at = iso(a.at);
      const contact = w.contacts.find((c) => c.id === t.contactId);
      event(w, t, { at, kind: "inbound", title: `${contact ? `${contact.firstName} ${contact.lastName}` : "Customer"} replied`, body: a.text, actor: contact ? `${contact.firstName} ${contact.lastName}` : "Customer" });
      return;
    }
    case "hf.ticketClose": {
      const t = w.hf.tickets.find((x) => x.id === a.id);
      if (!t || t.status === "closed") return;
      const at = iso(a.at);
      t.status = "closed";
      t.resolution = a.resolution;
      event(w, t, { at, kind: "resolved", title: `Ticket ${t.number} closed`, body: a.resolution, actor: who(pack, w, t.ownerId) });
      addActivity(w, { at, type: "note", title: `Ticket ${t.number} resolved`, body: a.resolution, byId: t.ownerId, contactIds: [t.contactId], companyIds: [t.companyId], linkPath: `/support/${t.id}`, linkLabel: "View ticket" });
      touch(w, at, { companyId: t.companyId, contactIds: [t.contactId] });
      return;
    }
    case "hf.beat": {
      if (!w.hf.beats.includes(a.id)) w.hf.beats.push(a.id);
      return;
    }
  }
}
