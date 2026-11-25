"use client";

import type { HfTicket, HfTicketEvent } from "@/store/slices/flows";
import { useShell } from "@/store/store";
import { ownerName } from "../pages/lists";
import { dateTime, relative } from "../format";
import { Icon, type IconName } from "../icons";
import { A, Card, cx, Empty, Prop, Tag, type Tone } from "../ui";

const STATUS: Record<HfTicket["status"], { label: string; tone: Tone }> = {
  new: { label: "New", tone: "blue" },
  waiting: { label: "Waiting on customer", tone: "amber" },
  closed: { label: "Closed", tone: "green" },
};

const PRIORITY: Record<HfTicket["priority"], Tone> = { Low: "neutral", Medium: "blue", High: "amber", Urgent: "red" };

const EVENT_ICON: Record<HfTicketEvent["kind"], IconName> = { created: "ticket", reply: "send", inbound: "email", status: "sync", resolved: "check" };

/** Service Hub: the tickets opened from Claude in this run. */
export function SupportIndex() {
  const { world, pack } = useShell();
  const tickets = world.hf.tickets;
  return (
    <div className="min-h-full bg-hs-bg" data-testid="support-index">
      <div className="border-b border-line bg-white px-6 py-4">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight">Tickets</h1>
            <p className="text-[13px] text-ink-muted">Support pipeline · Service Hub</p>
          </div>
          <Tag tone="neutral">{tickets.length} open or recent</Tag>
        </div>
      </div>
      <div className="mx-auto max-w-[1200px] px-6 py-5">
        {tickets.length === 0 ? (
          <Empty title="No tickets in this run">Tickets Claude opens from the renewal conversation appear here.</Empty>
        ) : (
          <Card pad={false}>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-line-soft bg-[#fafafa] text-left text-[11.5px] uppercase tracking-wide text-ink-muted">
                  <th className="px-4 py-2 font-semibold">Ticket</th>
                  <th className="px-4 py-2 font-semibold">Company</th>
                  <th className="px-4 py-2 font-semibold">Priority</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                  <th className="px-4 py-2 font-semibold">Owner</th>
                  <th className="px-4 py-2 font-semibold">Updated</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="border-b border-line-soft last:border-b-0">
                    <td className="px-4 py-2.5">
                      <A to={`/support/${t.id}`} className="hs-link font-semibold" data-testid={`support-link-${t.id}`}>
                        {t.number}: {t.subject}
                      </A>
                    </td>
                    <td className="px-4 py-2.5">{world.companies.find((c) => c.id === t.companyId)?.name}</td>
                    <td className="px-4 py-2.5">
                      <Tag tone={PRIORITY[t.priority]}>{t.priority}</Tag>
                    </td>
                    <td className="px-4 py-2.5">
                      <Tag tone={STATUS[t.status].tone}>{STATUS[t.status].label}</Tag>
                    </td>
                    <td className="px-4 py-2.5">{ownerName(pack, t.ownerId)}</td>
                    <td className="px-4 py-2.5 text-ink-muted">{relative(t.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}

export function TicketPage({ id }: { id: string }) {
  const { world, pack } = useShell();
  const t = world.hf.tickets.find((x) => x.id === id);
  if (!t) {
    return (
      <div className="p-6">
        <Empty title="Ticket not found">
          <A to="/support" className="hs-link">
            Back to tickets
          </A>
        </Empty>
      </div>
    );
  }
  const company = world.companies.find((c) => c.id === t.companyId);
  const contact = world.contacts.find((c) => c.id === t.contactId);
  const st = STATUS[t.status];
  return (
    <div className="min-h-full bg-hs-bg" data-testid="ticket-page" data-status={t.status}>
      <div className="border-b border-line bg-white px-6 py-4">
        <div className="mx-auto max-w-[1200px]">
          <A to="/support" className="inline-flex items-center gap-1 text-[13px] font-semibold text-link hover:underline">
            <Icon name="chevronLeft" size={14} /> Tickets
          </A>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#ececec]">
              <Icon name="ticket" size={20} />
            </span>
            <h1 className="text-[20px] font-semibold tracking-tight" data-testid="ticket-subject">
              <span className="font-mono text-[15px] text-ink-muted">{t.number}</span> {t.subject}
            </h1>
            <Tag tone={st.tone} className="!h-6" data-testid="ticket-status">
              {st.label}
            </Tag>
            <Tag tone={PRIORITY[t.priority]} className="!h-6">
              {t.priority} priority
            </Tag>
          </div>
        </div>
      </div>
      <div className="mx-auto grid max-w-[1200px] gap-4 px-6 py-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card title="About this ticket">
            <Prop label="Pipeline">Support</Prop>
            <Prop label="Status">{st.label}</Prop>
            <Prop label="Priority">{t.priority}</Prop>
            <Prop label="Owner">{ownerName(pack, t.ownerId)}</Prop>
            <Prop label="Created">{dateTime(t.createdAt)}</Prop>
            <Prop label="Last updated">{dateTime(t.updatedAt)}</Prop>
            <Prop label="Source">Conversation with Claude</Prop>
          </Card>
          <Card title="Associations">
            <div className="space-y-2.5">
              {company ? (
                <div className="rounded-[8px] border border-line-soft px-3 py-2">
                  <A to={`/companies/${company.id}`} className="hs-link text-[13.5px]">
                    {company.name}
                  </A>
                  <p className="mt-0.5 text-[12.5px] text-ink-muted">{company.industry}</p>
                </div>
              ) : null}
              {contact ? (
                <div className="rounded-[8px] border border-line-soft px-3 py-2">
                  <A to={`/contacts/${contact.id}`} className="hs-link text-[13.5px]">
                    {contact.firstName} {contact.lastName}
                  </A>
                  <p className="mt-0.5 text-[12.5px] text-ink-muted">{contact.title}</p>
                </div>
              ) : null}
              {world.deals
                .filter((d) => d.companyId === t.companyId && /renewal/i.test(d.name))
                .map((d) => (
                  <div key={d.id} className="rounded-[8px] border border-line-soft px-3 py-2">
                    <A to={`/deals/${d.id}`} className="hs-link text-[13.5px]">
                      {d.name}
                    </A>
                    <p className="mt-0.5 text-[12.5px] text-ink-muted">Renewal deal</p>
                  </div>
                ))}
            </div>
          </Card>
        </div>
        <div className="space-y-4">
          <Card title="Description">
            <p className="whitespace-pre-wrap text-[13.5px] leading-[1.5]">{t.description}</p>
          </Card>
          {t.resolution ? (
            <Card title="Resolution" testId="ticket-resolution" className="border-[#bfe3cd] bg-[#f8fdf9]">
              <p className="whitespace-pre-wrap text-[13.5px] leading-[1.5]">{t.resolution}</p>
            </Card>
          ) : null}
          <Card title="Timeline" pad={false} testId="ticket-timeline">
            <ol className="divide-y divide-line-soft">
              {t.timeline.map((e) => (
                <li key={e.id} className="flex gap-3 px-4 py-3" data-testid={`ticket-event-${e.kind}`}>
                  <span className={cx("mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full", e.kind === "resolved" ? "bg-[#dff4e4] text-[#0b5b2b]" : e.kind === "inbound" ? "bg-[#dcecf9] text-[#0b4a78]" : "bg-[#ececec] text-ink")}>
                    <Icon name={EVENT_ICON[e.kind]} size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center justify-between gap-3 text-[13px]">
                      <span className="font-semibold">{e.title}</span>
                      <span className="shrink-0 text-[12px] text-ink-muted">{dateTime(e.at)}</span>
                    </p>
                    <p className="text-[12px] text-ink-muted">{e.actor}</p>
                    {e.body ? <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-[1.5]">{e.body}</p> : null}
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
