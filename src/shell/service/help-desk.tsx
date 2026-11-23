"use client";

import { useState } from "react";
import { nowMs } from "@/lib/format";
import { useShell } from "@/store/store";
import type { ServiceChannel } from "@/verticals/types";
import { Ext } from "../ext";
import { money, relative } from "../format";
import { Icon, Sparkle, type IconName } from "../icons";
import { A, AiPill, Avatar, Button, Card, colorFor, cx, Empty, Prop, Tag } from "../ui";

const CHANNEL_ICON: Record<ServiceChannel, IconName> = { chat: "chat", email: "email", voice: "call" };
const CHANNEL_LABEL: Record<ServiceChannel, string> = { chat: "Chat", email: "Email", voice: "Voice" };

/**
 * HubSpot Service Hub Help Desk & Breeze Customer Agent workspace (Steps 2, 3, 4, 6, 8, 10).
 * Native HubSpot Help Desk + Breeze Customer Agent carry NO Penguin marker; only the custom
 * Core-Banking Lookup and Core-Banking Verification/Unlock cards carry the pulsing Penguin pin.
 */
export function HelpDeskPage() {
  const { pack, world, dispatch, navigate } = useShell();
  const cfg = pack.demos.customerAgent;
  const [channelFilter, setChannelFilter] = useState<"all" | ServiceChannel>("all");

  if (!cfg) {
    return (
      <div className="p-10">
        <Card>
          <Empty title="Help Desk is configured for Financial services">
            Switch to Fernhill Capital (Financial services and fintech) to run the Breeze Customer Agent demo.
          </Empty>
        </Card>
      </div>
    );
  }

  const { chatCase, emailCase, voiceCase, fraudCase } = cfg;
  const { ca } = world;
  const selectedId = world.ui["service.case"] ?? chatCase.id;

  const queue = [
    {
      id: chatCase.id,
      channel: "chat" as ServiceChannel,
      contactId: chatCase.contactId,
      companyId: chatCase.companyId,
      subject: ca.chatMessage ?? chatCase.customerQuestion,
      preview: `${chatCase.accountNumber} · Transfer ${chatCase.pendingTransferId} ($48,500)`,
      statusLabel: ca.chatResolved ? "Resolved by AI" : ca.chatVerified ? "Verified" : ca.chatMatched ? "Matched" : ca.chatSent ? "Active · Chat" : "Waiting",
      statusTone: (ca.chatResolved ? "green" : ca.chatVerified ? "teal" : ca.chatSent ? "amber" : "neutral") as "green" | "teal" | "amber" | "neutral",
      unread: ca.chatSent && !ca.chatResolved,
    },
    {
      id: emailCase.id,
      channel: "email" as ServiceChannel,
      contactId: emailCase.contactId,
      companyId: emailCase.companyId,
      subject: emailCase.subject,
      preview: `Card •••• ${emailCase.card.last4} · ${money(emailCase.card.amount)}`,
      statusLabel: ca.emailReplied ? `Ticket ${emailCase.ticketNumber}` : ca.emailSent ? "New Email" : "Waiting",
      statusTone: (ca.emailReplied ? "green" : ca.emailSent ? "amber" : "neutral") as "green" | "amber" | "neutral",
      unread: ca.emailSent && !ca.emailReplied,
    },
    {
      id: voiceCase.id,
      channel: "voice" as ServiceChannel,
      contactId: voiceCase.contactId,
      companyId: voiceCase.companyId,
      subject: "Locked online banking account (MFA)",
      preview: `${voiceCase.callerNumber} · ${voiceCase.accountNumber}`,
      statusLabel: ca.voiceUnlocked ? "Unlocked & Logged" : ca.voiceCalled ? "Live Call" : "Waiting",
      statusTone: (ca.voiceUnlocked ? "green" : ca.voiceCalled ? "pink" : "neutral") as "green" | "pink" | "neutral",
      unread: ca.voiceCalled && !ca.voiceUnlocked,
    },
    {
      id: fraudCase.id,
      channel: "chat" as ServiceChannel,
      contactId: fraudCase.contactId,
      companyId: fraudCase.companyId,
      subject: "Suspected $64,200 unauthorized wire",
      preview: `${fraudCase.accountNumber} · Fraud policy escalation`,
      statusLabel: ca.fraudHandedOff ? `Escalated · ${fraudCase.ticketNumber}` : ca.timelineReviewed ? "Escalation Required" : "Queued",
      statusTone: (ca.fraudHandedOff ? "orange" : ca.timelineReviewed ? "red" : "neutral") as "orange" | "red" | "neutral",
      unread: ca.timelineReviewed && !ca.fraudHandedOff,
    },
  ];

  const filteredQueue = channelFilter === "all" ? queue : queue.filter((q) => q.channel === channelFilter);
  const activeItem = queue.find((q) => q.id === selectedId) ?? queue[0];
  const contact = world.contacts.find((c) => c.id === activeItem.contactId);
  const company = world.companies.find((c) => c.id === activeItem.companyId);
  const pendingTransfer = chatCase.transfers.find((t) => t.id === chatCase.pendingTransferId) ?? chatCase.transfers[0];

  const selectCase = (id: string) => dispatch({ t: "ui", k: "service.case", v: id });

  return (
    <div className="grid h-full grid-cols-[312px_minmax(0,1fr)_356px]" data-testid="help-desk-page">
      {/* Left Rail: Omnichannel Help Desk Queue */}
      <aside className="flex min-h-0 flex-col border-r border-line bg-white">
        <header className="border-b border-line-soft px-4 py-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-breeze-soft text-breeze">
                <Sparkle size={15} />
              </span>
              <h1 className="text-[16px] font-semibold">Help Desk</h1>
            </div>
            <Tag tone="pink">Customer Agent</Tag>
          </div>
          <p className="mt-1 text-[12px] text-ink-muted">Omnichannel queue · Chat, Email &amp; Voice</p>
          <div className="mt-2.5 flex flex-wrap gap-1">
            {(["all", "chat", "email", "voice"] as const).map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setChannelFilter(ch)}
                data-testid={`hd-filter-${ch}`}
                className={cx(
                  "h-6 rounded-full border px-2.5 text-[11.5px] font-semibold",
                  channelFilter === ch ? "border-ink bg-ink text-white" : "border-line bg-white text-ink-muted hover:border-ink hover:text-ink",
                )}
              >
                {ch === "all" ? "All (4)" : CHANNEL_LABEL[ch]}
              </button>
            ))}
          </div>
        </header>

        <ul className="hs-scroll flex-1 overflow-y-auto">
          {filteredQueue.map((item) => {
            const c = world.contacts.find((x) => x.id === item.contactId);
            const co = world.companies.find((x) => x.id === item.companyId);
            const isSelected = activeItem.id === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => selectCase(item.id)}
                  data-testid={`hd-case-${item.id}`}
                  className={cx("block w-full border-b border-line-soft px-4 py-3 text-left hover:bg-[#f7f7f7]", isSelected && "bg-[#f1f7f7]")}
                >
                  <div className="flex items-center gap-1.5">
                    {item.unread ? <span className="h-2 w-2 shrink-0 rounded-full bg-hs-orange" /> : null}
                    <Icon name={CHANNEL_ICON[item.channel]} size={13} className="shrink-0 text-ink-muted" />
                    <span className="truncate text-[13.5px] font-semibold">{c ? `${c.firstName} ${c.lastName}` : item.contactId}</span>
                    <Tag tone={item.statusTone} className="ml-auto !h-[20px] !px-1.5 !text-[10.5px]">
                      {item.statusLabel}
                    </Tag>
                  </div>
                  <p className="mt-1 truncate text-[12.5px] font-medium text-ink">{item.subject}</p>
                  <p className="mt-0.5 truncate text-[11.5px] text-ink-muted">
                    {co?.name} · {item.preview}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="border-t border-line-soft bg-[#fafafa] px-4 py-3 text-[12px]">
          <p className="font-semibold text-ink-muted">Customer off-platform views</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <A to="/service-app/chat" className="hs-link text-[12px]" data-testid="hd-jump-chat">
              Fintech app chat
            </A>
            <span className="text-ink-muted">·</span>
            <A to="/service-app/email" className="hs-link text-[12px]" data-testid="hd-jump-email">
              Customer email
            </A>
            <span className="text-ink-muted">·</span>
            <A to="/service-app/phone" className="hs-link text-[12px]" data-testid="hd-jump-phone">
              Phone call
            </A>
          </div>
        </div>
      </aside>

      {/* Center Pane: Conversation & Breeze Customer Agent Execution */}
      <section className="hs-scroll min-w-0 overflow-y-auto px-5 py-4" data-testid="hd-center">
        {/* Conversation Header */}
        <header className="mb-4 flex items-start justify-between gap-3 rounded-[10px] border border-line bg-white px-5 py-3.5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Tag tone="blue">
                <Icon name={CHANNEL_ICON[activeItem.channel]} size={12} className="mr-1" />
                {CHANNEL_LABEL[activeItem.channel]}
              </Tag>
              <AiPill />
              <Tag tone={activeItem.statusTone}>{activeItem.statusLabel}</Tag>
            </div>
            <h2 className="mt-1.5 text-[17px] font-semibold leading-snug" data-testid="hd-case-title">
              {activeItem.subject}
            </h2>
            <p className="mt-0.5 text-[12.5px] text-ink-muted">
              {contact ? (
                <A to={`/contacts/${contact.id}`} className="hs-link">
                  {contact.firstName} {contact.lastName}
                </A>
              ) : null}
              {company ? (
                <>
                  {" · "}
                  <A to={`/companies/${company.id}`} className="hs-link">
                    {company.name}
                  </A>
                </>
              ) : null}
            </p>
          </div>
          <A to="/service-dashboard" className="hs-link shrink-0 text-[12.5px]" data-testid="hd-open-dashboard">
            Service Dashboard
          </A>
        </header>

        {/* CASE 1: CHAT — TRANSFER PENDING (Steps 2, 3, 4) */}
        {activeItem.id === chatCase.id ? (
          <div className="space-y-3" data-testid="hd-panel-chat">
            <Card>
              <div className="flex items-start gap-3">
                <Avatar name={contact ? `${contact.firstName} ${contact.lastName}` : "Sabine Keller"} color={colorFor(chatCase.contactId)} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[13.5px] font-semibold">{contact ? `${contact.firstName} ${contact.lastName}` : "Sabine Keller"}</p>
                    <span className="text-[11.5px] text-ink-muted">via Fernhill Fintech App · just now</span>
                  </div>
                  <p className="mt-1 rounded-[8px] bg-[#f4f6f8] px-3.5 py-2.5 text-[14px]">{ca.chatMessage ?? chatCase.customerQuestion}</p>
                </div>
              </div>
            </Card>

            {/* Step 2: Match contact & pull transfer */}
            <Card testId="ca-step2-card">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AiPill />
                  <p className="text-[13.5px] font-semibold">1. Match HubSpot contact &amp; pull transfer</p>
                </div>
                {ca.chatMatched ? <Tag tone="green">Matched</Tag> : <Tag tone="amber">Next action</Tag>}
              </div>
              {ca.chatMatched ? (
                <div className="mt-2.5 space-y-2 text-[13px]">
                  <p className="text-ink-muted">
                    Matched authenticated app session to HubSpot contact{" "}
                    <A to={`/contacts/${chatCase.contactId}`} className="hs-link">
                      Sabine Keller
                    </A>{" "}
                    (Co-founder, Brackenridge Brewing) and queried Core Banking account <span className="font-mono font-semibold text-ink">{chatCase.accountNumber}</span>.
                  </p>
                  <div className="rounded-[8px] border border-line-soft bg-[#fafafa] px-3.5 py-2.5">
                    <p className="font-semibold text-ink">
                      Pending transfer found: {pendingTransfer.id} — {pendingTransfer.recipient}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-ink-muted">
                      {ca.chatVerified
                        ? `${money(pendingTransfer.amount)} · ${pendingTransfer.method} · ${pendingTransfer.cutoffNote}`
                        : "Transfer details retrieved in secure agent context — awaiting identity verification before sharing amounts or clearing details with customer."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-2.5 flex items-center justify-between gap-3">
                  <p className="text-[13px] text-ink-muted">
                    Match Sabine Keller to her HubSpot CRM record and look up her latest pending transfer from Fernhill&apos;s core banking system.
                  </p>
                  <Button variant="breeze" size="sm" onClick={() => dispatch({ t: "ca.chatMatch" })} data-testid="ca-chat-match">
                    <Sparkle size={13} /> Match contact &amp; pull transfer
                  </Button>
                </div>
              )}
            </Card>

            {/* Step 3: Security Check */}
            {ca.chatMatched ? (
              <Card testId="ca-step3-card">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon name="shield" size={16} className="text-link" />
                    <p className="text-[13.5px] font-semibold">2. Security check before sharing account details</p>
                  </div>
                  {ca.chatVerified ? <Tag tone="green">{chatCase.securityCheck.verifiedBadge}</Tag> : <Tag tone="amber">Verification required</Tag>}
                </div>
                {ca.chatVerified ? (
                  <div className="mt-2.5 rounded-[8px] border border-[#bfe3cd] bg-[#f0faf4] px-3.5 py-2.5 text-[13px]">
                    <p className="font-semibold text-[#0b5b2b]">{chatCase.securityCheck.customerProof}</p>
                    <p className="mt-0.5 text-[12px] text-[#1e5c3a]">
                      Audit ref: <span className="font-mono">{chatCase.securityCheck.auditRef}</span> · Account-specific disclosure unlocked for this session.
                    </p>
                  </div>
                ) : (
                  <div className="mt-2.5 flex items-center justify-between gap-3">
                    <p className="text-[13px] text-ink-muted">
                      Policy requires step-up verification ({chatCase.securityCheck.challenge}) before disclosing transfer amounts or clearing dates.
                    </p>
                    <Button variant="primary" size="sm" icon="shield" onClick={() => dispatch({ t: "ca.chatVerify" })} data-testid="ca-chat-verify">
                      Run security check
                    </Button>
                  </div>
                )}
              </Card>
            ) : null}

            {/* Step 4: Explain transfer timing & resolve */}
            {ca.chatVerified ? (
              <Card testId="ca-step4-card">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AiPill />
                    <p className="text-[13.5px] font-semibold">3. Explain status &amp; timing, log as resolved</p>
                  </div>
                  {ca.chatResolved ? <Tag tone="green">Resolved autonomously</Tag> : <Tag tone="pink">Draft ready</Tag>}
                </div>
                <div className="mt-2.5 whitespace-pre-line rounded-[8px] border border-line-soft bg-[#fdf9fc] p-3.5 text-[13.5px] leading-relaxed">
                  {chatCase.agentResolution}
                </div>
                {ca.chatResolved ? (
                  <div className="mt-3 space-y-3">
                    <div className="flex items-start gap-2.5 rounded-[8px] bg-[#f4f6f8] px-3.5 py-2.5 text-[13px]">
                      <Avatar name="Sabine Keller" color={colorFor(chatCase.contactId)} size={24} />
                      <div>
                        <p className="font-semibold">Sabine Keller</p>
                        <p className="text-ink-muted">{chatCase.customerReply}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-[8px] border border-[#bfe3cd] bg-[#f0faf4] px-4 py-3 text-[13px]" data-testid="ca-chat-resolved-banner">
                      <p className="font-semibold text-[#0b5b2b]">
                        Chat logged as resolved on Sabine Keller&apos;s timeline ({chatCase.creditsUsed} HubSpot credit).
                      </p>
                      <A to="/service-app/email" className="hs-link shrink-0" data-testid="ca-next-email">
                        Next: Customer email →
                      </A>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[12px] text-ink-muted">Will reply in Fernhill App, mark conversation resolved, and log on contact timeline.</span>
                    <Button variant="primary" size="sm" icon="send" onClick={() => dispatch({ t: "ca.chatResolve", at: nowMs() })} data-testid="ca-chat-resolve">
                      Send answer &amp; resolve
                    </Button>
                  </div>
                )}
              </Card>
            ) : null}
          </div>
        ) : null}

        {/* CASE 2: EMAIL — UNRECOGNIZED CARD CHARGE (Step 6) */}
        {activeItem.id === emailCase.id ? (
          <div className="space-y-3" data-testid="hd-panel-email">
            <Card>
              <div className="flex items-start gap-3">
                <Avatar name={emailCase.fromName} color={colorFor(emailCase.contactId)} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[13.5px] font-semibold">
                      {emailCase.fromName} <span className="font-normal text-ink-muted">&lt;{emailCase.fromEmail}&gt;</span>
                    </p>
                    <span className="text-[11.5px] text-ink-muted">To: {emailCase.toEmail}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-line rounded-[8px] bg-[#f4f6f8] p-3.5 text-[13.5px] leading-relaxed">{emailCase.body}</p>
                </div>
              </div>
            </Card>

            <Card testId="ca-step6-card">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AiPill />
                  <p className="text-[13.5px] font-semibold">Breeze Email Agent: Contact matched &amp; dispute reply drafted</p>
                </div>
                {ca.emailReplied ? <Tag tone="green">Replied · {emailCase.ticketNumber} Open</Tag> : <Tag tone="pink">Ready to send</Tag>}
              </div>
              <p className="mt-2 text-[13px] text-ink-muted">
                Matched{" "}
                <A to={`/contacts/${emailCase.contactId}`} className="hs-link">
                  {emailCase.fromName}
                </A>{" "}
                (Quenby Print and Packaging) and verified charge <span className="font-semibold text-ink">{money(emailCase.card.amount)}</span> at{" "}
                <span className="font-semibold text-ink">{emailCase.card.merchant}</span> on card •••• {emailCase.card.last4}.
              </p>
              <div className="mt-3 whitespace-pre-line rounded-[8px] border border-line-soft bg-[#fdf9fc] p-3.5 text-[13px] leading-relaxed">{emailCase.agentReply}</div>
              <div className="mt-3 rounded-[8px] border border-line-soft bg-[#fafafa] p-3 text-[12.5px]">
                <p className="font-semibold text-ink">Ticket to create in HubSpot Help Desk:</p>
                <p className="mt-0.5 text-ink-muted">
                  <span className="font-mono font-semibold text-ink">{emailCase.ticketNumber}</span> · {emailCase.ticketSubject} · Pipeline: {emailCase.ticketPipeline} · Stage: {emailCase.ticketStage}
                </p>
              </div>
              {ca.emailReplied ? (
                <div className="mt-3 flex items-center justify-between rounded-[8px] border border-[#bfe3cd] bg-[#f0faf4] px-4 py-3 text-[13px]" data-testid="ca-email-replied-banner">
                  <p className="font-semibold text-[#0b5b2b]">
                    Reply sent to {emailCase.fromEmail}, card •••• {emailCase.card.last4} frozen, and Ticket {emailCase.ticketNumber} created.
                  </p>
                  <A to="/service-app/phone" className="hs-link shrink-0" data-testid="ca-next-phone">
                    Next: Customer phone call →
                  </A>
                </div>
              ) : (
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[12px] text-ink-muted">Sends dispute instructions and opens a tracked HubSpot ticket.</span>
                  <Button variant="primary" size="sm" icon="send" onClick={() => dispatch({ t: "ca.emailReply", at: nowMs() })} data-testid="ca-email-reply">
                    Reply &amp; open ticket {emailCase.ticketNumber}
                  </Button>
                </div>
              )}
            </Card>
          </div>
        ) : null}

        {/* CASE 3: VOICE — LOCKED ACCOUNT (Step 8) */}
        {activeItem.id === voiceCase.id ? (
          <div className="space-y-3" data-testid="hd-panel-voice">
            <Card>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-breeze-soft text-breeze">
                    <Icon name="call" size={16} />
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold">
                      Inbound Voice Call · {contact ? `${contact.firstName} ${contact.lastName}` : "Halle Voss"}
                    </p>
                    <p className="text-[12px] text-ink-muted">
                      Caller ID {voiceCase.callerNumber} matched to {company?.name} · Account {voiceCase.accountNumber}
                    </p>
                  </div>
                </div>
                <Tag tone={ca.voiceUnlocked ? "green" : "pink"}>{ca.voiceUnlocked ? `Resolved · ${voiceCase.duration}` : "Breeze Voice Active"}</Tag>
              </div>
              <div className="mt-3 rounded-[8px] border border-[#f2d08b] bg-[#fffaf0] px-3.5 py-2.5 text-[12.5px] text-[#754c00]">
                <span className="font-semibold">Detected lockout:</span> {voiceCase.lockReason}
              </div>
            </Card>

            <Card title="Live Voice Transcript" right={<AiPill />} testId="ca-step8-card">
              <ul className="space-y-2.5">
                {voiceCase.transcript
                  .filter((line) => ca.voiceUnlocked || line.phase === "opening")
                  .map((line) => (
                    <li
                      key={line.id}
                      className={cx(
                        "rounded-[8px] border px-3.5 py-2.5 text-[13px]",
                        line.speaker === "agent" ? "border-[#f3c6e2] bg-[#fdf7fb]" : "border-line-soft bg-[#f8f9fa]",
                      )}
                    >
                      <div className="flex items-center justify-between text-[11.5px] font-semibold">
                        <span className={line.speaker === "agent" ? "text-breeze" : "text-ink"}>{line.name}</span>
                        <span className="font-mono text-ink-muted">{line.time}</span>
                      </div>
                      <p className="mt-1 leading-relaxed">{line.text}</p>
                    </li>
                  ))}
              </ul>

              {ca.voiceUnlocked ? (
                <div className="mt-4 space-y-2.5">
                  <div className="rounded-[8px] border border-[#bfe3cd] bg-[#f0faf4] p-3.5 text-[13px]" data-testid="ca-voice-unlocked-banner">
                    <p className="font-semibold text-[#0b5b2b]">Caller verified, MFA lockout cleared ({voiceCase.unlockRef}), and full transcript logged.</p>
                    <ul className="mt-1.5 space-y-1 text-[12.5px] text-[#1e5c3a]">
                      {voiceCase.unlockSteps.map((step) => (
                        <li key={step} className="flex items-start gap-1.5">
                          <Icon name="check" size={14} className="mt-0.5 shrink-0" /> {step}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3">
                      <A to={`/contacts/${voiceCase.contactId}`} className="hs-link" data-testid="ca-view-halle-timeline">
                        Open Halle Voss&apos;s contact timeline →
                      </A>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-line-soft pt-3">
                  <p className="text-[12.5px] text-ink-muted">
                    Send 6-digit SMS OTP ({voiceCase.verificationCode}), clear MFA lockout via Core Banking, walk Halle through resync, and log transcript.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    icon="unlock"
                    onClick={() => dispatch({ t: "ca.voiceUnlock", at: nowMs() })}
                    data-testid="ca-voice-unlock"
                  >
                    Verify &amp; unlock account
                  </Button>
                </div>
              )}
            </Card>
          </div>
        ) : null}

        {/* CASE 4: SUSPECTED FRAUD HANDOFF (Step 10) */}
        {activeItem.id === fraudCase.id ? (
          <div className="space-y-3" data-testid="hd-panel-fraud">
            <Card>
              <div className="flex items-start gap-3">
                <Avatar name="Patrice Dunmore" color={colorFor(fraudCase.contactId)} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[13.5px] font-semibold">Patrice Dunmore · Dunmore Tool and Die</p>
                    <Tag tone="red">Suspected Fraud</Tag>
                  </div>
                  <p className="mt-1.5 rounded-[8px] border border-[#f5c2be] bg-[#fff5f4] p-3.5 text-[13.5px] leading-relaxed">{fraudCase.customerMessage}</p>
                </div>
              </div>
            </Card>

            <Card title="Breeze Guardrail Evaluation — Escalation Triggered" right={<AiPill />} testId="ca-step10-card">
              <p className="text-[13px] text-ink-muted">
                This report exceeds Breeze Customer Agent&apos;s autonomous resolution threshold (high-value unauthorized wire + suspected account takeover). Policy requires immediate protective hold and structured handoff to a human specialist.
              </p>
              <ul className="mt-3 space-y-2">
                {fraudCase.riskSignals.map((sig) => (
                  <li key={sig.label} className="flex items-start gap-2.5 rounded-[8px] border border-[#f5c2be] bg-[#fff8f7] px-3.5 py-2.5 text-[13px]">
                    <Icon name="warning" size={16} className="mt-0.5 shrink-0 text-[#99201a]" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#99201a]">{sig.label}</p>
                      <p className="mt-0.5 text-[12.5px] text-ink-muted">{sig.detail}</p>
                    </div>
                    <Tag tone="red">{sig.severity}</Tag>
                  </li>
                ))}
              </ul>

              {ca.fraudHandedOff ? (
                <div className="mt-4 space-y-3" data-testid="ca-fraud-handed-off-banner">
                  <div className="rounded-[8px] border border-line-soft bg-[#fdf9fc] p-3.5 text-[13px]">
                    <p className="text-[11.5px] font-semibold uppercase tracking-wide text-breeze">Message sent to Patrice Dunmore</p>
                    <p className="mt-1 leading-relaxed">{fraudCase.agentAck}</p>
                  </div>
                  <div className="flex items-center justify-between rounded-[8px] border border-[#f5c8b0] bg-[#fff7f3] px-4 py-3 text-[13px]">
                    <div>
                      <p className="font-semibold text-ink">
                        Handed off to Dana Whitlock · Ticket {fraudCase.ticketNumber} created with full chat, email &amp; voice summary.
                      </p>
                      <p className="mt-0.5 text-[12px] text-ink-muted">Protective hold {fraudCase.holdDetails.holdId} active on Wire {fraudCase.holdDetails.wireRef} ($64,200).</p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/service/tickets/${fraudCase.ticketId}`)}
                      data-testid="ca-open-fraud-ticket"
                    >
                      Open {fraudCase.ticketNumber} <Icon name="arrowRight" size={14} />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-line-soft pt-3">
                  <span className="text-[12.5px] text-ink-muted">Places protective hold on wire {fraudCase.holdDetails.wireRef}, compiles summary, and notifies Dana Whitlock.</span>
                  <Button
                    variant="primary"
                    size="sm"
                    icon="shield"
                    onClick={() => dispatch({ t: "ca.fraudHandoff", at: nowMs() })}
                    data-testid="ca-fraud-handoff"
                  >
                    Hand over to human rep
                  </Button>
                </div>
              )}
            </Card>
          </div>
        ) : null}
      </section>

      {/* Right Sidebar: Native CRM Context + Custom Penguin Core-Banking Extensions */}
      <aside className="hs-scroll space-y-3 overflow-y-auto border-l border-line bg-[#f7f7f7] px-3 py-4">
        {/* Native HubSpot Contact Card — NO Penguin marker */}
        <Card title="Matched HubSpot Contact" testId="hd-contact-card">
          {contact ? (
            <div className="space-y-1.5 text-[13px]">
              <div className="flex items-center gap-2.5">
                <Avatar name={`${contact.firstName} ${contact.lastName}`} color={colorFor(contact.id)} size={32} />
                <div className="min-w-0">
                  <A to={`/contacts/${contact.id}`} className="hs-link block truncate">
                    {contact.firstName} {contact.lastName}
                  </A>
                  <p className="truncate text-[12px] text-ink-muted">{contact.title}</p>
                </div>
              </div>
              <dl className="pt-1">
                <Prop label="Company">
                  {company ? (
                    <A to={`/companies/${company.id}`} className="hs-link">
                      {company.name}
                    </A>
                  ) : (
                    "--"
                  )}
                </Prop>
                <Prop label="Email">{contact.email}</Prop>
                <Prop label="Phone">{contact.phone}</Prop>
                <Prop label="Lifecycle stage">{contact.lifecycle}</Prop>
              </dl>
            </div>
          ) : null}
        </Card>

        {/* Custom Penguin Extension #1: Core-Banking Ledger & Transfer Lookup */}
        <Ext id="core-banking-lookup">
          <Card title="Core Banking Lookup" right={<Tag tone="blue">Live API</Tag>} testId="hd-core-banking-card">
            {activeItem.id === chatCase.id ? (
              !ca.chatMatched ? (
                <p className="text-[12.5px] text-ink-muted">Click &quot;Match contact &amp; pull transfer&quot; to query Fernhill Core Banking for {company?.name}.</p>
              ) : (
                <dl className="text-[12.5px]">
                  <Prop label="Treasury account">{chatCase.accountNumber}</Prop>
                  <Prop label="Transfer ID">{pendingTransfer.id}</Prop>
                  <Prop label="Recipient">{pendingTransfer.recipient}</Prop>
                  <Prop label="Amount">{ca.chatVerified ? money(pendingTransfer.amount) : "•••••• (verify signer first)"}</Prop>
                  <Prop label="Clearing window">{ca.chatVerified ? pendingTransfer.expectedSettlement : "Locked until verified"}</Prop>
                  <Prop label="Compliance">
                    <Tag tone="green">{pendingTransfer.complianceStatus}</Tag>
                  </Prop>
                </dl>
              )
            ) : activeItem.id === emailCase.id ? (
              <dl className="text-[12.5px]">
                <Prop label="Commercial card">•••• {emailCase.card.last4}</Prop>
                <Prop label="Merchant">{emailCase.card.merchant}</Prop>
                <Prop label="Amount">{money(emailCase.card.amount)}</Prop>
                <Prop label="Location">{emailCase.card.location}</Prop>
                <Prop label="Auth code">{emailCase.card.authCode}</Prop>
                <Prop label="Card status">
                  <Tag tone={ca.emailReplied ? "red" : "amber"}>{ca.emailReplied ? "Temporarily Frozen" : emailCase.card.status}</Tag>
                </Prop>
              </dl>
            ) : activeItem.id === voiceCase.id ? (
              <dl className="text-[12.5px]">
                <Prop label="Treasury account">{voiceCase.accountNumber}</Prop>
                <Prop label="Portal access">
                  <Tag tone={ca.voiceUnlocked ? "green" : "red"}>{ca.voiceUnlocked ? "Active — Unlocked" : "Locked (MFA)"}</Tag>
                </Prop>
                <Prop label="Failed attempts">{voiceCase.failedAttempts} consecutive</Prop>
                <Prop label="Locked at">{relative(voiceCase.lockedAt)}</Prop>
              </dl>
            ) : (
              <dl className="text-[12.5px]">
                <Prop label="Treasury account">{fraudCase.accountNumber}</Prop>
                <Prop label="Flagged wire">
                  {fraudCase.holdDetails.wireRef} · {money(fraudCase.holdDetails.amount)}
                </Prop>
                <Prop label="Beneficiary">{fraudCase.holdDetails.beneficiary}</Prop>
                <Prop label="Commercial card">•••• {fraudCase.holdDetails.cardLast4}</Prop>
                <Prop label="Hold status">
                  <Tag tone={ca.fraudHandedOff ? "green" : "red"}>{ca.fraudHandedOff ? `Active (${fraudCase.holdDetails.holdId})` : "Pending hold"}</Tag>
                </Prop>
              </dl>
            )}
          </Card>
        </Ext>

        {/* Custom Penguin Extension #2: Core-Banking Step-Up Verification & Account Controls */}
        {activeItem.id !== emailCase.id ? (
          <Ext id="core-banking-unlock">
            <Card title="Security & Account Controls" right={<Tag tone="purple">Core API</Tag>} testId="hd-security-controls">
              {activeItem.id === chatCase.id ? (
                <div className="space-y-1.5 text-[12.5px]">
                  <p className="font-semibold">{chatCase.securityCheck.method}</p>
                  <p className="text-ink-muted">{chatCase.securityCheck.challenge}</p>
                  <p className="pt-1">
                    <Tag tone={ca.chatVerified ? "green" : "amber"}>{ca.chatVerified ? chatCase.securityCheck.verifiedBadge : "Not yet verified"}</Tag>
                  </p>
                </div>
              ) : activeItem.id === voiceCase.id ? (
                <div className="space-y-1.5 text-[12.5px]">
                  <p className="font-semibold">SMS OTP + MFA Token Unlock</p>
                  <p className="text-ink-muted">Registered phone: {voiceCase.callerNumber}</p>
                  <p className="pt-1">
                    <Tag tone={ca.voiceUnlocked ? "green" : "amber"}>{ca.voiceUnlocked ? `Cleared · ${voiceCase.unlockRef}` : "Awaiting OTP verification"}</Tag>
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 text-[12.5px]">
                  <p className="font-semibold">Emergency Wire Freeze &amp; Card Lock</p>
                  <p className="text-ink-muted">Intercepts Fedwire release and locks card •••• {fraudCase.holdDetails.cardLast4} in real time.</p>
                  <p className="pt-1">
                    <Tag tone={ca.fraudHandedOff ? "green" : "red"}>{ca.fraudHandedOff ? fraudCase.holdDetails.holdId : "Ready to freeze"}</Tag>
                  </p>
                </div>
              )}
            </Card>
          </Ext>
        ) : null}

        {/* Native HubSpot Breeze Agent Info — NO Penguin marker */}
        <Card title="Breeze Customer Agent">
          <dl className="text-[12.5px]">
            <Prop label="Channel">{CHANNEL_LABEL[activeItem.channel]}</Prop>
            <Prop label="Guardrail policy">
              {activeItem.id === fraudCase.id ? "Auto-escalate suspected fraud to human" : "Verify signer before account disclosure"}
            </Prop>
            <Prop label="HubSpot credits">
              {activeItem.id === voiceCase.id
                ? `${voiceCase.creditsUsed} credits (Voice)`
                : activeItem.id === fraudCase.id
                  ? "0 resolution credits (Human handoff)"
                  : "1 credit upon autonomous resolution"}
            </Prop>
          </dl>
        </Card>
      </aside>
    </div>
  );
}
