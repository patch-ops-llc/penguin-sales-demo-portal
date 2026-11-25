import { DAY, iso } from "@/store/slices/helpers";
import type { HfTicket } from "@/store/slices/flows";
import type { Action, World } from "@/store/slices/types";
import { mutate } from "@/store/world";
import type { Pack, Task } from "@/verticals/types";
import type { ToolContext, ToolOutcome, ToolSpec } from "./tools";

/**
 * Tools for the headless flows: a campaign, a deal follow-up, and a renewal, each run from Claude.
 * Thin wrappers over the store like the guided-quote tools: reads project the World plus the
 * pack's flow datasets, writes return store Actions. Dates are relative (`dueInDays`) so a scripted
 * turn written once works on any day the demo runs. Every write is confirmed by the person first.
 */

type Handler = (args: Record<string, unknown>, ctx: ToolContext) => ToolOutcome;

const str = (v: unknown, max = 4000) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() && Number.isFinite(Number(v)) ? Number(v) : null);
const list = (v: unknown, max = 12) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").map((x) => x.trim().slice(0, 200)).filter(Boolean).slice(0, max) : []);
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
const fail = (error: string): ToolOutcome => ({ actions: [], result: null, error });
const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const daysUntil = (date: string, now: number) => Math.round((new Date(date).getTime() - now) / DAY);

function apply(actions: Action[], w: World, pack: Pack, read: () => unknown): ToolOutcome {
  for (const a of actions) mutate(w, a, pack);
  return { actions, result: read() };
}

const flows = (pack: Pack) => pack.demos.flows;
const name = (w: World, id?: string | null) => {
  const c = w.contacts.find((x) => x.id === id);
  return c ? `${c.firstName} ${c.lastName}` : null;
};
const stageLabel = (pack: Pack, id: string) => pack.stages.find((s) => s.id === id)?.label ?? id;

function dealView(d: World["deals"][number], w: World, pack: Pack, now: number) {
  const company = w.companies.find((c) => c.id === d.companyId);
  return {
    id: d.id,
    name: d.name,
    stage: stageLabel(pack, d.stage),
    stageId: d.stage,
    amount: d.amount,
    closeDate: d.closeDate.slice(0, 10),
    closesInDays: daysUntil(d.closeDate, now),
    ownerId: d.ownerId,
    company: company ? { id: company.id, name: company.name, industry: company.industry } : null,
    contacts: w.contacts.filter((c) => d.contactIds.includes(c.id)).map((c) => ({ id: c.id, name: `${c.firstName} ${c.lastName}`, title: c.title })),
    nextStep: d.nextStep ?? null,
    lastActivityAt: d.lastActivityAt?.slice(0, 10) ?? null,
  };
}

function activityView(w: World, filter: (a: World["activities"][number]) => boolean, limit = 6) {
  return w.activities
    .filter(filter)
    .slice(0, limit)
    .map((a) => ({ at: a.at.slice(0, 10), type: a.type, title: a.title, body: a.body?.slice(0, 280) }));
}

function campaignView(c: World["hf"]["campaigns"][number], w: World) {
  const segment = w.hf.segments.find((s) => s.id === c.segmentId);
  return {
    id: c.id,
    name: c.name,
    goal: c.goal,
    status: c.status,
    channels: c.channels,
    startsOn: c.startsOn,
    sendAt: c.sendAt,
    segment: segment ? { id: segment.id, name: segment.name, size: segment.size } : null,
    assets: c.assets.map((a) => ({ id: a.id, kind: a.kind, title: a.title, channel: a.channel ?? null, status: a.status })),
    stats: c.stats,
  };
}

function ticketView(t: HfTicket, w: World) {
  return {
    id: t.id,
    number: t.number,
    subject: t.subject,
    priority: t.priority,
    status: t.status,
    company: w.companies.find((c) => c.id === t.companyId)?.name ?? null,
    contact: name(w, t.contactId),
    resolution: t.resolution,
    timeline: t.timeline.map((e) => ({ at: e.at.slice(0, 16), kind: e.kind, title: e.title, body: e.body.slice(0, 280) })),
  };
}

const latestCampaign = (w: World) => w.hf.campaigns[0] ?? null;
const latestTicket = (w: World) => w.hf.tickets[0] ?? null;



export const FLOW_TOOLS: { def: ToolSpec; run: Handler }[] = [
  // ---------- Marketing ----------
  {
    def: { name: "get_campaign_attribution" },
    run: (_args, { pack }) => ({ actions: [], result: (flows(pack)?.campaignAttribution ?? []).slice().sort((a, b) => b.pipeline - a.pipeline) }),
  },
  {
    def: { name: "create_segment", confirm: true },
    run: (args, { w, pack, now }) => {
      const n = str(args.name, 120);
      if (!n) return fail("name is required.");
      const id = `seg-${slug(n)}`;
      if (w.hf.segments.some((s) => s.id === id)) return fail(`Segment "${n}" already exists.`);
      const size = Math.max(0, Math.round(num(args.estimatedSize) ?? 0));
      return apply([{ t: "hf.segment", id, name: n, criteria: list(args.criteria), size, at: now }], w, pack, () => ({ id, name: n, size }));
    },
  },
  {
    def: { name: "create_campaign", confirm: true },
    run: (args, { w, pack, now }) => {
      const n = str(args.name, 140);
      if (!n) return fail("name is required.");
      const segment = w.hf.segments.find((s) => s.id === str(args.segmentId)) ?? w.hf.segments[0];
      if (!segment) return fail("Create a segment first.");
      const id = `cmp-${slug(n)}`;
      if (w.hf.campaigns.some((c) => c.id === id)) return fail(`Campaign "${n}" already exists.`);
      return apply([{ t: "hf.campaign", id, name: n, goal: str(args.goal, 300), segmentId: segment.id, channels: list(args.channels, 8), startsOn: str(args.startsOn, 60) || "Next week", at: now }], w, pack, () => campaignView(w.hf.campaigns.find((c) => c.id === id)!, w));
    },
  },
  {
    def: { name: "add_asset", confirm: true },
    run: (args, { w, pack }) => {
      const c = latestCampaign(w);
      if (!c) return fail("Create the campaign first.");
      const kind = str(args.kind);
      if (kind !== "email" && kind !== "landing" && kind !== "social") return fail("kind must be email, landing, or social.");
      const title = str(args.title, 160);
      const body = str(args.body);
      if (!title || !body) return fail("title and body are required.");
      const channel = str(args.channel, 40) || undefined;
      const id = `as-${slug(`${kind}-${channel ?? ""}-${title}`)}`;
      if (c.assets.some((a) => a.id === id)) return fail(`"${title}" is already on the campaign.`);
      return apply([{ t: "hf.asset", campaignId: c.id, asset: { id, kind, title, body, ...(channel ? { channel } : {}) } }], w, pack, () => ({ campaignId: c.id, assetId: id, assets: c.assets.length }));
    },
  },
  {
    def: { name: "schedule_email", confirm: true },
    run: (args, { w, pack, now }) => {
      const c = latestCampaign(w);
      if (!c) return fail("Create the campaign first.");
      if (!c.assets.some((a) => a.kind === "email")) return fail("Draft the email first with add_asset.");
      const days = num(args.sendInDays);
      if (days === null || days < 0 || days > 60) return fail("sendInDays must be between 0 and 60.");
      const label = str(args.sendAtLabel, 80) || iso(now + days * DAY).slice(0, 10);
      return apply([{ t: "hf.schedule", campaignId: c.id, sendAt: label, at: now }], w, pack, () => campaignView(c, w));
    },
  },
  {
    def: { name: "get_campaign_performance" },
    run: (_args, { w }) => {
      const c = latestCampaign(w);
      if (!c) return fail("No campaign in this run yet.");
      const submitted = w.activities.filter((a) => a.type === "form" && a.linkPath === `/campaigns/${c.id}`).flatMap((a) => a.contactIds ?? []);
      return {
        actions: [],
        result: {
          ...campaignView(c, w),
          submitters: submitted.map((id) => {
            const ct = w.contacts.find((x) => x.id === id);
            return ct ? { id, name: `${ct.firstName} ${ct.lastName}`, title: ct.title, company: w.companies.find((co) => co.id === ct.companyId)?.name ?? null } : { id };
          }),
        },
      };
    },
  },
  {
    def: { name: "save_report", confirm: true },
    run: (args, { w, pack, now }) => {
      const dashboard = str(args.dashboard, 20);
      if (!flows(pack)?.dashboards[dashboard]) return fail("dashboard must be marketing, sales, or service.");
      const title = str(args.title, 120);
      if (!title) return fail("title is required.");
      const id = `rp-${slug(title)}`;
      if (w.hf.reports.some((r) => r.id === id)) return fail(`"${title}" is already on the dashboard.`);
      const kpis = (Array.isArray(args.kpis) ? args.kpis : [])
        .filter((k): k is Record<string, unknown> => typeof k === "object" && k !== null)
        .map((k) => ({ label: str(k.label, 60), value: str(k.value, 40), ...(str(k.delta, 60) ? { delta: str(k.delta, 60) } : {}) }))
        .filter((k) => k.label && k.value)
        .slice(0, 6);
      const columns = list(args.columns, 8);
      const rows = (Array.isArray(args.rows) ? args.rows : []).map((r) => list(r, 8)).filter((r) => r.length > 0).slice(0, 20);
      return apply([{ t: "hf.report", id, dashboard, title, summary: str(args.summary, 400), kpis, columns, rows, at: now }], w, pack, () => ({ id, dashboard, title, path: `/dashboards/${dashboard}` }));
    },
  },

  // ---------- Sales ----------
  {
    def: { name: "get_focus_list" },
    run: (_args, { w, pack, now }) => {
      const risks = flows(pack)?.dealRisks ?? [];
      const open = w.deals.filter((d) => d.ownerId === w.persona && !pack.stages.find((s) => s.id === d.stage)?.closed);
      const ranked = open
        .map((d) => ({ ...dealView(d, w, pack, now), attention: risks.find((r) => r.dealId === d.id)?.score ?? 20, reasons: risks.find((r) => r.dealId === d.id)?.reasons ?? [] }))
        .sort((a, b) => b.attention - a.attention)
        .slice(0, 6);
      const tasks = w.tasks.filter((t) => t.ownerId === w.persona && t.status === "open").map((t) => ({ id: t.id, title: t.title, type: t.type, priority: t.priority, dueInDays: daysUntil(t.dueAt, now), dealId: t.dealId ?? null }));
      return { actions: [], result: { deals: ranked, tasks } };
    },
  },
  {
    def: { name: "get_deal_brief" },
    run: (args, { w, pack, now }) => {
      const d = w.deals.find((x) => x.id === str(args.dealId));
      if (!d) return fail(`Unknown deal "${str(args.dealId)}".`);
      const company = w.companies.find((c) => c.id === d.companyId);
      return {
        actions: [],
        result: {
          ...dealView(d, w, pack, now),
          companyDetail: company ? { description: company.description ?? null, employees: company.employees, city: company.city, state: company.state, customerSince: company.createdAt?.slice(0, 10) ?? null } : null,
          contacts: w.contacts.filter((c) => c.companyId === d.companyId).map((c) => ({ id: c.id, name: `${c.firstName} ${c.lastName}`, title: c.title, email: c.email })),
          recentActivity: activityView(w, (a) => Boolean(a.dealIds?.includes(d.id) || a.companyIds?.includes(d.companyId))),
          openTasks: w.tasks.filter((t) => t.dealId === d.id && t.status === "open").map((t) => ({ id: t.id, title: t.title, dueInDays: daysUntil(t.dueAt, now) })),
          quotes: w.quotes.filter((q) => q.dealId === d.id).map((q) => ({ number: q.number, status: q.status, total: q.lineItems.reduce((s, l) => s + l.qty * l.unitPrice, 0) })),
        },
      };
    },
  },
  {
    def: { name: "log_email", confirm: true },
    run: (args, { w, pack, now }) => {
      const contact = w.contacts.find((c) => c.id === str(args.contactId));
      if (!contact) return fail(`Unknown contact "${str(args.contactId)}".`);
      const deal = w.deals.find((d) => d.id === str(args.dealId));
      const companyId = str(args.companyId) || deal?.companyId || contact.companyId;
      const subject = str(args.subject, 160);
      const body = str(args.body);
      if (!subject || !body) return fail("subject and body are required.");
      const to = `${contact.firstName} ${contact.lastName}`;
      return apply(
        [{ t: "log", kind: "email", title: `Email to ${to}: ${subject}`, text: body, contactIds: [contact.id], companyIds: companyId ? [companyId] : [], dealIds: deal ? [deal.id] : [], at: now }],
        w,
        pack,
        () => ({ sent: true, to, subject, dealId: deal?.id ?? null, companyId: companyId ?? null }),
      );
    },
  },
  {
    def: { name: "create_task", confirm: true },
    run: (args, { w, pack, now }) => {
      const title = str(args.title, 160);
      if (!title) return fail("title is required.");
      const type = str(args.type);
      const priority = str(args.priority);
      if (type !== "Call" && type !== "Email" && type !== "To-do") return fail("type must be Call, Email, or To-do.");
      if (priority !== "High" && priority !== "Medium" && priority !== "Low") return fail("priority must be High, Medium, or Low.");
      const days = num(args.dueInDays);
      if (days === null || days < 0 || days > 365) return fail("dueInDays must be between 0 and 365.");
      const deal = w.deals.find((d) => d.id === str(args.dealId));
      const contactId = str(args.contactId) || deal?.contactIds[0];
      const companyId = str(args.companyId) || deal?.companyId || w.contacts.find((c) => c.id === contactId)?.companyId || undefined;
      const id = `tk-${slug(title)}`;
      if (w.tasks.some((t) => t.id === id)) return fail(`Task "${title}" already exists.`);
      const notes = str(args.notes, 600);
      const task: Omit<Task, "status" | "isNew"> = { id, title, type, priority, dueAt: iso(now + days * DAY), ownerId: w.persona, ...(contactId ? { contactId } : {}), ...(companyId ? { companyId } : {}), ...(deal ? { dealId: deal.id } : {}), ...(notes ? { notes } : {}) };
      const ids = { contactIds: contactId ? [contactId] : [], companyIds: companyId ? [companyId] : [], dealIds: deal ? [deal.id] : [] };
      return apply([{ t: "task.create", task }, { t: "log", kind: "task", text: `${title} (${type}, ${priority}, due ${task.dueAt.slice(0, 10)})`, ...ids, at: now }], w, pack, () => ({ id, title, dueAt: task.dueAt.slice(0, 10) }));
    },
  },
  {
    def: { name: "update_deal", confirm: true },
    run: (args, { w, pack, now }) => {
      const d = w.deals.find((x) => x.id === str(args.dealId));
      if (!d) return fail(`Unknown deal "${str(args.dealId)}".`);
      const stage = str(args.stage);
      if (stage && !pack.stages.some((s) => s.id === stage)) return fail(`Unknown stage "${stage}". Stages: ${pack.stages.map((s) => s.id).join(", ")}.`);
      const days = num(args.closeInDays);
      const nextStep = str(args.nextStep, 240);
      if (!stage && days === null && !nextStep) return fail("Give a stage, closeInDays, or nextStep.");
      return apply(
        [{ t: "deal.update", id: d.id, at: now, ...(stage ? { stage } : {}), ...(days !== null ? { closeDate: iso(now + Math.max(0, days) * DAY) } : {}), ...(nextStep ? { nextStep } : {}) }],
        w,
        pack,
        () => dealView(d, w, pack, now),
      );
    },
  },
  {
    def: { name: "get_pipeline_by_stage" },
    run: (_args, { w, pack }) => {
      const open = w.deals.filter((d) => pack.stages.some((s) => s.id === d.stage && !s.closed));
      const stages = pack.stages.filter((s) => !s.closed).map((s) => {
        const deals = open.filter((d) => d.stage === s.id);
        return { stage: s.label, deals: deals.length, amount: deals.reduce((sum, d) => sum + d.amount, 0) };
      });
      const total = stages.reduce((s, x) => s + x.amount, 0);
      return { actions: [], result: { stages, total, totalLabel: money(total), deals: open.length, movements: flows(pack)?.pipelineMovements ?? [] } };
    },
  },

  // ---------- Customer success ----------
  {
    def: { name: "get_renewals_at_risk" },
    run: (_args, { w, pack, now }) => {
      const risks = flows(pack)?.renewalRisks ?? [];
      const renewals = w.deals.filter((d) => /renewal/i.test(d.name) && !pack.stages.find((s) => s.id === d.stage)?.closed && daysUntil(d.closeDate, now) <= 90);
      const result = renewals
        .map((d) => {
          const r = risks.find((x) => x.dealId === d.id);
          return { ...dealView(d, w, pack, now), health: r?.health ?? 82, lastContactDays: r?.lastContactDays ?? 3, openTickets: r?.openTickets ?? 0, atRisk: Boolean(r), reasons: r?.reasons ?? [] };
        })
        .sort((a, b) => a.health - b.health);
      return { actions: [], result: { renewals: result, totalRenewals: 12, totalArr: 612_000 } };
    },
  },
  {
    def: { name: "get_account_brief" },
    run: (args, { w, pack, now }) => {
      const c = w.companies.find((x) => x.id === str(args.companyId));
      if (!c) return fail(`Unknown company "${str(args.companyId)}".`);
      const risk = (flows(pack)?.renewalRisks ?? []).find((r) => w.deals.find((d) => d.id === r.dealId)?.companyId === c.id);
      return {
        actions: [],
        result: {
          id: c.id,
          name: c.name,
          industry: c.industry,
          city: c.city,
          state: c.state,
          employees: c.employees,
          customerSince: c.createdAt?.slice(0, 10) ?? null,
          health: risk?.health ?? null,
          reasons: risk?.reasons ?? [],
          deals: w.deals.filter((d) => d.companyId === c.id).map((d) => dealView(d, w, pack, now)),
          contacts: w.contacts.filter((x) => x.companyId === c.id).map((x) => ({ id: x.id, name: `${x.firstName} ${x.lastName}`, title: x.title, email: x.email })),
          openTickets: risk?.openTickets ? [{ number: "TKT-5098", subject: "Scheduled export fails with timeout", openDays: 6 }, { number: "TKT-5104", subject: "Board pack export missing after 4.12", openDays: 4 }].slice(0, risk.openTickets) : [],
          runTickets: w.hf.tickets.filter((t) => t.companyId === c.id).map((t) => ticketView(t, w)),
          recentActivity: activityView(w, (a) => Boolean(a.companyIds?.includes(c.id))),
        },
      };
    },
  },
  {
    def: { name: "add_note", confirm: true },
    run: (args, { w, pack, now }) => {
      const c = w.companies.find((x) => x.id === str(args.companyId));
      if (!c) return fail(`Unknown company "${str(args.companyId)}".`);
      const text = str(args.text, 2000);
      if (!text) return fail("text is required.");
      return apply([{ t: "log", kind: "note", text, contactIds: [], companyIds: [c.id], dealIds: [], at: now }], w, pack, () => ({ noted: true, companyId: c.id }));
    },
  },
  {
    def: { name: "create_ticket", confirm: true },
    run: (args, { w, pack, now }) => {
      const subject = str(args.subject, 160);
      const description = str(args.description, 2000);
      const priority = str(args.priority);
      if (!subject || !description) return fail("subject and description are required.");
      if (priority !== "Low" && priority !== "Medium" && priority !== "High" && priority !== "Urgent") return fail("priority must be Low, Medium, High, or Urgent.");
      const company = w.companies.find((x) => x.id === str(args.companyId));
      const contact = w.contacts.find((x) => x.id === str(args.contactId));
      if (!company || !contact) return fail("companyId and contactId must name existing records.");
      const n = w.hf.tickets.length + 1;
      const id = `tkt-hf-${n}`;
      const number = `TKT-${5131 + n}`;
      return apply([{ t: "hf.ticket", id, number, subject, description, priority, companyId: company.id, contactId: contact.id, ownerId: w.persona, at: now }], w, pack, () => ticketView(w.hf.tickets.find((t) => t.id === id)!, w));
    },
  },
  {
    def: { name: "search_past_tickets" },
    run: (args, { pack }) => {
      const words = str(args.query, 200).toLowerCase().split(/\W+/).filter((x) => x.length > 2);
      const hits = (flows(pack)?.pastTickets ?? [])
        .map((t) => ({ t, score: words.filter((x) => t.keywords.includes(x) || t.subject.toLowerCase().includes(x) || t.resolution.toLowerCase().includes(x)).length }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((x) => x.t);
      return { actions: [], result: hits };
    },
  },
  {
    def: { name: "reply_on_ticket", confirm: true },
    run: (args, { w, pack, now }) => {
      const t = w.hf.tickets.find((x) => x.id === str(args.ticketId)) ?? latestTicket(w);
      if (!t) return fail("Create the ticket first.");
      if (t.status === "closed") return fail(`${t.number} is closed.`);
      const text = str(args.text, 2000);
      if (!text) return fail("text is required.");
      return apply([{ t: "hf.ticketReply", id: t.id, text, at: now }], w, pack, () => ticketView(t, w));
    },
  },
  {
    def: { name: "close_ticket", confirm: true },
    run: (args, { w, pack, now }) => {
      const t = w.hf.tickets.find((x) => x.id === str(args.ticketId)) ?? latestTicket(w);
      if (!t) return fail("Create the ticket first.");
      if (t.status === "closed") return fail(`${t.number} is already closed.`);
      const resolution = str(args.resolution, 1200);
      if (!resolution) return fail("resolution is required.");
      return apply([{ t: "hf.ticketClose", id: t.id, resolution, at: now }], w, pack, () => ticketView(t, w));
    },
  },
  {
    def: { name: "get_renewal_risk_breakdown" },
    run: (_args, { w, pack }) => {
      const months = flows(pack)?.renewalRiskByMonth ?? [];
      const resolvedThisRun = w.hf.tickets.filter((t) => t.status === "closed").map((t) => t.number);
      return { actions: [], result: { windows: months, totalRenewals: months.reduce((s, m) => s + m.renewals, 0), atRisk: months.reduce((s, m) => s + m.atRisk, 0), atRiskArr: months.reduce((s, m) => s + m.arr, 0), resolvedThisRun } };
    },
  },
];
