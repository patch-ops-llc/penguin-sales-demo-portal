"use client";

import { useState } from "react";
import type { ToolCall } from "@/lib/agent/types";
import type { World } from "@/store/slices/types";
import type { Pack } from "@/verticals/types";
import { cx } from "../ui";

/** Labels, change previews, and the HubSpot screen behind each tool the flows call. */

const s = (v: unknown, fallback = "") => (typeof v === "string" && v.trim() ? v.trim() : fallback);
const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

export const WRITE_TOOLS = new Set(["create_segment", "create_campaign", "add_asset", "schedule_email", "save_report", "log_email", "create_task", "update_deal", "add_note", "create_ticket", "reply_on_ticket", "close_ticket"]);

export function describeCall(call: ToolCall, result: unknown): string {
  const r = (result ?? {}) as Record<string, unknown>;
  const a = call.args ?? {};
  if (r.declined) return "Declined";
  switch (call.name) {
    case "get_campaign_attribution":
      return "Read campaign attribution";
    case "create_segment":
      return `Segment: ${s(a.name)}`;
    case "create_campaign":
      return `Campaign: ${s(a.name)}`;
    case "add_asset":
      return `${s(a.kind) === "landing" ? "Landing page" : s(a.kind) === "social" ? `${s(a.channel, "Social")} post` : "Email"}: ${s(a.title)}`;
    case "schedule_email":
      return `Schedule email: ${s(a.sendAtLabel)}`;
    case "get_campaign_performance":
      return "Read campaign performance";
    case "save_report":
      return `Report on the ${s(a.dashboard)} dashboard: ${s(a.title)}`;
    case "get_focus_list":
      return "Read open deals and tasks";
    case "get_deal_brief":
      return "Read the deal";
    case "log_email":
      return `Email: ${s(a.subject)}`;
    case "create_task":
      return `Task: ${s(a.title)}`;
    case "update_deal":
      return "Update the deal";
    case "get_pipeline_by_stage":
      return "Read pipeline by stage";
    case "get_renewals_at_risk":
      return "Read renewals and risk";
    case "get_account_brief":
      return "Read the account";
    case "add_note":
      return "Note on the company";
    case "create_ticket":
      return `Ticket: ${s(a.subject)}`;
    case "search_past_tickets":
      return `Search past tickets: ${s(a.query)}`;
    case "reply_on_ticket":
      return "Reply on the ticket";
    case "close_ticket":
      return "Close the ticket";
    case "get_renewal_risk_breakdown":
      return "Read renewal risk by month";
    default:
      return call.name.replace(/_/g, " ");
  }
}

/** The HubSpot screen that shows a write once it has landed. */
export function focusPathFor(call: ToolCall, result: unknown, w: World): string | null {
  const r = (result ?? {}) as Record<string, unknown>;
  const a = call.args ?? {};
  switch (call.name) {
    case "create_segment":
    case "create_campaign":
    case "add_asset":
    case "schedule_email":
      return w.hf.campaigns[0] ? `/campaigns/${w.hf.campaigns[0].id}` : null;
    case "save_report":
      return `/dashboards/${s(a.dashboard, "marketing")}`;
    case "log_email":
    case "create_task": {
      const deal = s(a.dealId) || (typeof r.dealId === "string" ? r.dealId : "");
      if (deal) return `/deals/${deal}`;
      const company = s(a.companyId) || (typeof r.companyId === "string" ? r.companyId : "");
      return company ? `/companies/${company}` : null;
    }
    case "update_deal":
      return `/deals/${s(a.dealId)}`;
    case "add_note":
      return `/companies/${s(a.companyId)}`;
    case "create_ticket":
    case "reply_on_ticket":
    case "close_ticket":
      return typeof r.id === "string" ? `/support/${r.id}` : w.hf.tickets[0] ? `/support/${w.hf.tickets[0].id}` : null;
    default:
      return null;
  }
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2 text-[12.5px] leading-snug">
      <span className="text-ink-muted">{label}</span>
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}

function Body({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const lines = text.split("\n");
  const long = lines.length > 5 || text.length > 360;
  return (
    <div>
      <p className={cx("whitespace-pre-wrap rounded-[6px] border border-line-soft bg-white px-2.5 py-2 text-[12.5px] leading-snug", !open && long && "max-h-[6.5rem] overflow-hidden [mask-image:linear-gradient(#000_60%,transparent)]")}>{text}</p>
      {long ? (
        <button type="button" onClick={() => setOpen((o) => !o)} className="mt-1 text-[12px] font-semibold text-penguin-strong hover:underline">
          {open ? "Show less" : "Show the full text"}
        </button>
      ) : null}
    </div>
  );
}

const dayLabel = (days: number | null) => (days === null ? "" : days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`);

/** What will change in HubSpot if the person approves, one card per call. */
export function ChangePreview({ call, w, pack }: { call: ToolCall; w: World; pack: Pack }) {
  const a = call.args ?? {};
  const contact = (id: unknown) => {
    const c = w.contacts.find((x) => x.id === s(id));
    return c ? `${c.firstName} ${c.lastName}` : s(id, "—");
  };
  const company = (id: unknown) => w.companies.find((x) => x.id === s(id))?.name ?? s(id, "—");
  let body: React.ReactNode;
  switch (call.name) {
    case "create_segment":
      body = (
        <>
          <Row label="Name">{s(a.name)}</Row>
          <Row label="Rules">
            <ul className="list-disc pl-4">
              {arr(a.criteria).map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </Row>
          {n(a.estimatedSize) !== null ? <Row label="Contacts">{n(a.estimatedSize)!.toLocaleString("en-US")}</Row> : null}
        </>
      );
      break;
    case "create_campaign":
      body = (
        <>
          <Row label="Name">{s(a.name)}</Row>
          <Row label="Goal">{s(a.goal)}</Row>
          <Row label="Channels">{arr(a.channels).join(", ")}</Row>
          <Row label="Starts">{s(a.startsOn)}</Row>
          <Row label="Segment">{w.hf.segments[0]?.name ?? "the new segment"}</Row>
        </>
      );
      break;
    case "add_asset":
      body = (
        <>
          <Row label="Type">{s(a.kind) === "landing" ? "Landing page" : s(a.kind) === "social" ? `${s(a.channel, "Social")} post` : "Marketing email"}</Row>
          <Row label="Title">{s(a.title)}</Row>
          <Body text={s(a.body)} />
        </>
      );
      break;
    case "schedule_email":
      body = (
        <>
          <Row label="Send">{s(a.sendAtLabel)}</Row>
          <Row label="To">{w.hf.segments[0] ? `${w.hf.segments[0].name} (${w.hf.segments[0].size.toLocaleString("en-US")} contacts)` : "the segment"}</Row>
        </>
      );
      break;
    case "save_report": {
      const kpis = Array.isArray(a.kpis) ? (a.kpis as { label?: string; value?: string }[]) : [];
      body = (
        <>
          <Row label="Dashboard">{pack.demos.flows?.dashboards[s(a.dashboard)]?.title ?? s(a.dashboard)}</Row>
          <Row label="Title">{s(a.title)}</Row>
          {kpis.length > 0 ? <Row label="KPIs">{kpis.map((k) => `${k.label}: ${k.value}`).join(" · ")}</Row> : null}
          <Row label="Table">
            {arr(a.columns).join(" · ")} ({Array.isArray(a.rows) ? a.rows.length : 0} rows)
          </Row>
        </>
      );
      break;
    }
    case "log_email":
      body = (
        <>
          <Row label="To">{contact(a.contactId)}</Row>
          <Row label="Subject">{s(a.subject)}</Row>
          <Body text={s(a.body)} />
          <Row label="Logged on">{s(a.dealId) ? w.deals.find((d) => d.id === s(a.dealId))?.name ?? "the deal" : company(a.companyId)}</Row>
        </>
      );
      break;
    case "create_task":
      body = (
        <>
          <Row label="Task">{s(a.title)}</Row>
          <Row label="Type">
            {s(a.type)} · {s(a.priority)} priority
          </Row>
          <Row label="Due">{dayLabel(n(a.dueInDays))}</Row>
          {s(a.notes) ? <Row label="Notes">{s(a.notes)}</Row> : null}
        </>
      );
      break;
    case "update_deal": {
      const deal = w.deals.find((d) => d.id === s(a.dealId));
      const stages = deal?.pipelineStages ?? pack.stages;
      const label = (id: string) => stages.find((x) => x.id === id)?.label ?? id;
      body = (
        <>
          <Row label="Deal">{deal?.name ?? s(a.dealId)}</Row>
          {s(a.stage) && deal ? (
            <Row label="Stage">
              <span className="text-ink-muted line-through">{label(deal.stage)}</span> → <strong>{label(s(a.stage))}</strong>
            </Row>
          ) : null}
          {n(a.closeInDays) !== null && deal ? (
            <Row label="Close date">
              <span className="text-ink-muted line-through">{deal.closeDate.slice(0, 10)}</span> → <strong>{dayLabel(n(a.closeInDays))}</strong>
            </Row>
          ) : null}
          {s(a.nextStep) ? (
            <Row label="Next step">
              <strong>{s(a.nextStep)}</strong>
            </Row>
          ) : null}
        </>
      );
      break;
    }
    case "add_note":
      body = (
        <>
          <Row label="Company">{company(a.companyId)}</Row>
          <Body text={s(a.text)} />
        </>
      );
      break;
    case "create_ticket":
      body = (
        <>
          <Row label="Subject">{s(a.subject)}</Row>
          <Row label="Priority">{s(a.priority)}</Row>
          <Row label="Company">{company(a.companyId)}</Row>
          <Row label="Contact">{contact(a.contactId)}</Row>
          <Body text={s(a.description)} />
        </>
      );
      break;
    case "reply_on_ticket":
      body = (
        <>
          <Row label="Ticket">{w.hf.tickets[0] ? `${w.hf.tickets[0].number}: ${w.hf.tickets[0].subject}` : "the ticket"}</Row>
          <Body text={s(a.text)} />
          <Row label="Then">Status: Waiting on customer</Row>
        </>
      );
      break;
    case "close_ticket":
      body = (
        <>
          <Row label="Ticket">{w.hf.tickets[0] ? `${w.hf.tickets[0].number}: ${w.hf.tickets[0].subject}` : "the ticket"}</Row>
          <Row label="Status">
            <span className="text-ink-muted line-through">{w.hf.tickets[0]?.status === "waiting" ? "Waiting on customer" : "New"}</span> → <strong>Closed</strong>
          </Row>
          <Body text={s(a.resolution)} />
        </>
      );
      break;
    default:
      body = (
        <>
          {Object.entries(a).map(([k, v]) => (
            <Row key={k} label={k}>
              {typeof v === "string" ? v : JSON.stringify(v)}
            </Row>
          ))}
        </>
      );
  }
  return (
    <div className="rounded-[8px] border border-[#e9c46a]/70 bg-[#fffdf7] p-2.5" data-testid={`claude-preview-${call.name}`}>
      <p className="mb-1.5 text-[12px] font-semibold text-[#7a5a00]">{describeCall(call, undefined)}</p>
      <div className="space-y-1">{body}</div>
    </div>
  );
}
