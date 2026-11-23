"use client";

import { useState } from "react";
import { nowMs } from "@/lib/format";
import { useShell } from "@/store/store";
import type { ServiceChannel } from "@/verticals/types";
import { Ext } from "../ext";
import { money, relative } from "../format";
import { Icon, type IconName } from "../icons";
import { A, AiPill, Avatar, Button, Card, colorFor, cx, Empty, Prop, Tag } from "../ui";

const CHANNEL_ICON: Record<ServiceChannel, IconName> = { chat: "chat", email: "email", voice: "call" };
const CHANNEL_LABEL: Record<ServiceChannel, string> = { chat: "Chat", email: "Email", voice: "Voice" };
const CHANNEL_TONE: Record<ServiceChannel, "blue" | "teal" | "pink"> = { chat: "teal", email: "blue", voice: "pink" };

/**
 * HubSpot Service Hub Ticket Record (Step 11): Human service rep opens Ticket TKT-4091 with
 * Breeze's structured handoff summary and the full unified conversation history across chat, email, and voice.
 */
export function TicketRecordPage({ id }: { id: string }) {
  const { pack, world, dispatch, navigate } = useShell();
  const cfg = pack.demos.customerAgent;
  const [channelFilter, setChannelFilter] = useState<"all" | ServiceChannel>("all");
  const [reply, setReply] = useState(cfg?.fraudCase.defaultRepReply ?? "");

  if (!cfg || id !== cfg.fraudCase.ticketId) {
    return (
      <div className="p-10">
        <Card>
          <Empty title="Ticket not found">
            <A to="/service" className="hs-link">
              Return to Help Desk
            </A>
          </Empty>
        </Card>
      </div>
    );
  }

  const f = cfg.fraudCase;
  const contact = world.contacts.find((c) => c.id === f.contactId);
  const company = world.companies.find((c) => c.id === f.companyId);
  const owner = pack.personas.find((p) => p.id === f.ownerId);
  const history = channelFilter === "all" ? f.unifiedHistory : f.unifiedHistory.filter((h) => h.channel === channelFilter);

  const sendRepReply = () => {
    dispatch({ t: "ca.repReply", text: reply, at: nowMs() });
  };

  const openDashboard = () => {
    dispatch({ t: "ca.reviewTicket" });
    navigate("/service-dashboard");
  };

  return (
    <div className="grid min-h-full grid-cols-[300px_minmax(0,1fr)_312px]" data-testid="ticket-record-page">
      {/* Left Column: Native HubSpot Ticket Properties */}
      <aside className="border-r border-line bg-white px-4 py-4">
        <A to="/service" className="inline-flex items-center gap-1 text-[13px] font-semibold text-link hover:underline" data-testid="ticket-back">
          <Icon name="chevronLeft" size={14} /> Help Desk
        </A>
        <div className="mt-3 flex items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[#fde0dd] text-[#99201a]">
            <Icon name="ticket" size={20} />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[12px] font-semibold text-ink-muted">{f.ticketNumber}</p>
            <h1 className="text-[16.5px] font-semibold leading-snug" data-testid="ticket-title">
              {f.subject}
            </h1>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Tag tone="red">{f.priority} Priority</Tag>
              <Tag tone="orange">Human Handoff</Tag>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-line-soft pt-3">
          <h2 className="text-[13px] font-semibold">About this ticket</h2>
          <dl className="mt-1">
            <Prop label="Ticket ID">{f.ticketNumber}</Prop>
            <Prop label="Pipeline">{f.pipeline}</Prop>
            <Prop label="Ticket status">{world.ca.repReplied ? "In progress — Rep contacted customer" : f.stage}</Prop>
            <Prop label="Ticket owner">{owner?.name ?? "Dana Whitlock"}</Prop>
            <Prop label="Channels included">Chat, Email, Voice (3 touchpoints)</Prop>
            <Prop label="Handoff source">Breeze Customer Agent</Prop>
            <Prop label="Treasury account">{f.accountNumber}</Prop>
          </dl>
        </div>
      </aside>

      {/* Center Column: Breeze Structured Handoff Summary + Unified Cross-Channel History */}
      <div className="min-w-0 space-y-4 px-5 py-4">
        {/* Native HubSpot Breeze Handoff Summary — NO Penguin marker */}
        <Card
          title={
            <span className="flex items-center gap-2">
              <AiPill /> Breeze Customer Agent Handoff Summary
            </span>
          }
          right={<Tag tone="green">Full context attached</Tag>}
          testId="ticket-handoff-summary"
        >
          <p className="text-[14px] font-medium leading-relaxed text-ink">{f.handoffSummary.headline}</p>
          <p className="mt-2 text-[12.5px] text-ink-muted">
            <span className="font-semibold text-ink">Identity status:</span> {f.handoffSummary.verifiedIdentity}
          </p>

          <div className="mt-3.5 grid grid-cols-2 gap-3">
            <div className="rounded-[8px] border border-line-soft bg-[#f8fbf9] p-3">
              <p className="text-[11.5px] font-semibold uppercase tracking-wide text-[#0b5b2b]">Actions already taken</p>
              <ul className="mt-1.5 space-y-1.5 text-[12.5px]">
                {f.handoffSummary.actionsTaken.map((item) => (
                  <li key={item} className="flex items-start gap-1.5">
                    <Icon name="check" size={14} className="mt-0.5 shrink-0 text-[#0b5b2b]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[8px] border border-line-soft bg-[#fffaf5] p-3">
              <p className="text-[11.5px] font-semibold uppercase tracking-wide text-[#a03400]">Recommended next steps</p>
              <ul className="mt-1.5 space-y-1.5 text-[12.5px]">
                {f.handoffSummary.recommendedNext.map((item) => (
                  <li key={item} className="flex items-start gap-1.5">
                    <Icon name="arrowRight" size={14} className="mt-0.5 shrink-0 text-[#a03400]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        {/* Native HubSpot Unified Omnichannel History — NO Penguin marker */}
        <Card
          title="Unified Conversation History (Chat, Email & Voice)"
          right={
            <div className="flex items-center gap-1">
              {(["all", "chat", "email", "voice"] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setChannelFilter(ch)}
                  data-testid={`ticket-filter-${ch}`}
                  className={cx(
                    "h-7 rounded-full border px-2.5 text-[12px] font-semibold",
                    channelFilter === ch ? "border-ink bg-ink text-white" : "border-line bg-white text-ink-muted hover:border-ink hover:text-ink",
                  )}
                >
                  {ch === "all" ? `All (${f.unifiedHistory.length})` : CHANNEL_LABEL[ch]}
                </button>
              ))}
            </div>
          }
          testId="ticket-unified-history"
        >
          <ul className="space-y-2.5">
            {history.map((entry) => (
              <li key={entry.id} className="rounded-[9px] border border-line-soft bg-[#fcfcfc] p-3.5" data-testid={`unified-entry-${entry.channel}`}>
                <div className="flex items-center gap-2">
                  <Tag tone={CHANNEL_TONE[entry.channel]}>
                    <Icon name={CHANNEL_ICON[entry.channel]} size={12} className="mr-1" />
                    {CHANNEL_LABEL[entry.channel]}
                  </Tag>
                  <span className="text-[13px] font-semibold">{entry.subject}</span>
                  <span className="ml-auto shrink-0 text-[11.5px] text-ink-muted">{relative(entry.at)}</span>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-ink">{entry.body}</p>
                <p className="mt-1.5 text-[11.5px] text-ink-muted">
                  {entry.actor} · {entry.meta}
                </p>
              </li>
            ))}
          </ul>
        </Card>

        {/* Human Service Rep Reply & Dashboard Transition */}
        <Card title={`Reply as ${owner?.name ?? "Dana Whitlock"}`} testId="ticket-rep-composer">
          {world.ca.repReplied ? (
            <div className="rounded-[8px] border border-[#bfe3cd] bg-[#f0faf4] p-3.5 text-[13px]" data-testid="ticket-rep-sent">
              <p className="font-semibold text-[#0b5b2b]">Response sent to Patrice Dunmore and logged on {f.ticketNumber}</p>
              <p className="mt-1 text-ink-muted">{world.ca.repReplyText}</p>
            </div>
          ) : (
            <>
              <textarea
                rows={3}
                aria-label="Human specialist response"
                data-testid="ticket-reply-input"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                className="w-full resize-none rounded-[6px] border border-line p-3 text-[13px] leading-relaxed focus:border-ink focus:outline-none"
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <Button variant="secondary" size="sm" icon="send" onClick={sendRepReply} data-testid="ticket-send-reply">
                  Send response to Patrice
                </Button>
                <Button variant="primary" size="sm" onClick={openDashboard} data-testid="ticket-open-dashboard">
                  Open Service Dashboard <Icon name="arrowRight" size={14} />
                </Button>
              </div>
            </>
          )}
          {world.ca.repReplied ? (
            <div className="mt-3 flex justify-end">
              <Button variant="primary" size="sm" onClick={openDashboard} data-testid="ticket-open-dashboard">
                Open Service Dashboard <Icon name="arrowRight" size={14} />
              </Button>
            </div>
          ) : null}
        </Card>
      </div>

      {/* Right Column: Associated CRM Records + Penguin Core-Banking Fraud Hold Card */}
      <aside className="space-y-3 border-l border-line bg-[#f7f7f7] px-3 py-4">
        <Card title="Contact (1)">
          {contact ? (
            <div className="flex items-center gap-2.5 text-[13px]">
              <Avatar name={`${contact.firstName} ${contact.lastName}`} color={colorFor(contact.id)} size={32} />
              <div className="min-w-0">
                <A to={`/contacts/${contact.id}`} className="hs-link block truncate">
                  {contact.firstName} {contact.lastName}
                </A>
                <p className="truncate text-[12px] text-ink-muted">{contact.title}</p>
                <p className="truncate text-[12px] text-ink-muted">{contact.phone}</p>
              </div>
            </div>
          ) : null}
        </Card>

        <Card title="Company (1)">
          {company ? (
            <div className="text-[13px]">
              <A to={`/companies/${company.id}`} className="hs-link">
                {company.name}
              </A>
              <p className="mt-0.5 text-[12px] text-ink-muted">
                {company.industry} · {company.city}, {company.state}
              </p>
            </div>
          ) : null}
        </Card>

        {/* Custom Penguin Extension: Core-Banking Fraud Hold Control */}
        <Ext id="core-banking-unlock">
          <Card title="Core Banking Fraud Hold" right={<Tag tone="green">Active</Tag>} testId="ticket-fraud-hold">
            <dl className="text-[12.5px]">
              <Prop label="Hold reference">{f.holdDetails.holdId}</Prop>
              <Prop label="Intercepted wire">
                {f.holdDetails.wireRef} ({money(f.holdDetails.amount)})
              </Prop>
              <Prop label="Beneficiary">{f.holdDetails.beneficiary}</Prop>
              <Prop label="Locked card">Commercial Card •••• {f.holdDetails.cardLast4}</Prop>
              <Prop label="Status">{f.holdDetails.status}</Prop>
            </dl>
          </Card>
        </Ext>
      </aside>
    </div>
  );
}
