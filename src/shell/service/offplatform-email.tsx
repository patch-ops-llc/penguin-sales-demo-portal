"use client";

import { useState } from "react";
import { nowMs } from "@/lib/format";
import { useShell } from "@/store/store";
import { relative } from "../format";
import { Icon } from "../icons";
import { A, Avatar, Button, cx, Tag } from "../ui";

/**
 * Off-platform screen (Step 5): Customer's external email client (Ansel Quenby, Quenby Print and Packaging).
 * Shows the card alert email and his unrecognized-charge email to Fernhill support, completely outside HubSpot.
 */
export function OffplatformEmailPage() {
  const { pack, world, dispatch } = useShell();
  const cfg = pack.demos.customerAgent;
  const [selectedMail, setSelectedMail] = useState<"compose" | "alert" | "reply">("compose");
  const [body, setBody] = useState(cfg?.emailCase.body ?? "");

  if (!cfg) return null;
  const e = cfg.emailCase;
  const sent = world.ca.emailSent;
  const replied = world.ca.emailReplied;

  const send = () => {
    if (sent) return;
    dispatch({ t: "ca.emailSend", at: nowMs() });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#dce2ea] p-4" data-testid="offplatform-email">
      <div className="mb-3 flex items-center justify-between gap-3 text-[12.5px]">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1e3a5f] px-3 py-1 font-semibold text-white">
            <Icon name="email" size={13} /> Off-platform · Customer Email Client
          </span>
          <span className="text-ink-muted">Mailbox: {e.fromEmail}</span>
        </div>
        <A
          to="/service"
          data-testid="offplatform-back-hubspot"
          className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-ink bg-white px-3 text-[12.5px] font-semibold text-ink hover:bg-[#f5f5f5]"
        >
          Back to HubSpot <Icon name="arrowRight" size={14} />
        </A>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] border border-[#b8c2cc] bg-white shadow-lg">
        {/* Desktop Mail App Header */}
        <header className="flex items-center justify-between border-b border-line bg-[#f4f6f9] px-5 py-2.5">
          <div className="flex items-center gap-3">
            <span className="flex gap-1.5" aria-hidden="true">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            </span>
            <p className="text-[14px] font-bold text-[#1e3a5f]">Quenby Mail</p>
            <span className="text-[12px] text-ink-muted">{e.fromName} &lt;{e.fromEmail}&gt;</span>
          </div>
          <Tag tone="blue">External Email Client</Tag>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-[200px_300px_minmax(0,1fr)]">
          {/* Folders */}
          <aside className="border-r border-line-soft bg-[#f8fafc] p-3">
            <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Folders</p>
            <ul className="space-y-1 text-[13px]">
              <li className="flex items-center justify-between rounded-[6px] bg-[#e6eef8] px-2.5 py-2 font-semibold text-[#1e3a5f]">
                <span>Inbox</span>
                <span>{replied ? 2 : 1}</span>
              </li>
              <li className="flex items-center justify-between rounded-[6px] px-2.5 py-2 text-ink-muted">
                <span>Drafts</span>
                <span>{sent ? 0 : 1}</span>
              </li>
              <li className="flex items-center justify-between rounded-[6px] px-2.5 py-2 text-ink-muted">
                <span>Sent</span>
                <span>{sent ? 1 : 0}</span>
              </li>
            </ul>
          </aside>

          {/* Message List */}
          <aside className="hs-scroll overflow-y-auto border-r border-line-soft bg-white">
            <p className="border-b border-line-soft px-4 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Messages</p>
            <ul className="divide-y divide-line-soft">
              <li>
                <button
                  type="button"
                  onClick={() => setSelectedMail("compose")}
                  data-testid="email-item-compose"
                  className={cx("block w-full px-4 py-3 text-left hover:bg-[#f6f9fc]", selectedMail === "compose" && "bg-[#eef5fc]")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-bold text-[#1e3a5f]">{sent ? "Sent to Fernhill" : "Draft to Fernhill"}</span>
                    <Tag tone={sent ? "green" : "amber"}>{sent ? "Sent" : "Draft"}</Tag>
                  </div>
                  <p className="mt-1 truncate text-[13px] font-semibold">{e.subject}</p>
                  <p className="mt-0.5 truncate text-[12px] text-ink-muted">To: {e.toEmail}</p>
                </button>
              </li>
              {replied ? (
                <li>
                  <button
                    type="button"
                    onClick={() => setSelectedMail("reply")}
                    data-testid="email-item-reply"
                    className={cx("block w-full px-4 py-3 text-left hover:bg-[#f6f9fc]", selectedMail === "reply" && "bg-[#eef5fc]")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-bold text-[#1e3a5f]">Fernhill Support</span>
                      <Tag tone="green">Reply</Tag>
                    </div>
                    <p className="mt-1 truncate text-[13px] font-semibold">Re: {e.subject} [{e.ticketNumber}]</p>
                    <p className="mt-0.5 truncate text-[12px] text-ink-muted">Temporary freeze placed on card •••• 4918...</p>
                  </button>
                </li>
              ) : null}
              <li>
                <button
                  type="button"
                  onClick={() => setSelectedMail("alert")}
                  data-testid="email-item-alert"
                  className={cx("block w-full px-4 py-3 text-left hover:bg-[#f6f9fc]", selectedMail === "alert" && "bg-[#eef5fc]")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold">Fernhill Card Alerts</span>
                    <span className="text-[11.5px] text-ink-muted">{relative(e.priorAlert.at)}</span>
                  </div>
                  <p className="mt-1 truncate text-[13px] font-semibold">{e.priorAlert.subject}</p>
                  <p className="mt-0.5 truncate text-[12px] text-ink-muted">{e.priorAlert.preview}</p>
                </button>
              </li>
            </ul>
          </aside>

          {/* Reading / Compose Pane */}
          <section className="hs-scroll min-w-0 overflow-y-auto p-6">
            {selectedMail === "alert" ? (
              <article className="mx-auto max-w-[680px] rounded-[10px] border border-line bg-white p-5">
                <Tag tone="red">Card Activity Alert</Tag>
                <h2 className="mt-2 text-[18px] font-semibold">{e.priorAlert.subject}</h2>
                <p className="mt-1 text-[12.5px] text-ink-muted">From: {e.priorAlert.from} · {relative(e.priorAlert.at)}</p>
                <div className="mt-4 whitespace-pre-line rounded-[8px] border border-line-soft bg-[#fafafa] p-4 text-[13.5px] leading-relaxed">
                  {e.priorAlert.body}
                </div>
                <Button variant="secondary" size="sm" className="mt-4" onClick={() => setSelectedMail("compose")}>
                  Return to dispute email draft
                </Button>
              </article>
            ) : selectedMail === "reply" && replied ? (
              <article className="mx-auto max-w-[680px] rounded-[10px] border border-line bg-white p-5">
                <Tag tone="green">Dispute Ticket {e.ticketNumber}</Tag>
                <h2 className="mt-2 text-[18px] font-semibold">Re: {e.subject}</h2>
                <p className="mt-1 text-[12.5px] text-ink-muted">From: Fernhill Capital Customer Agent &lt;{e.toEmail}&gt;</p>
                <div className="mt-4 whitespace-pre-line text-[14px] leading-relaxed">{e.agentReply}</div>
              </article>
            ) : (
              <div className="mx-auto max-w-[700px] space-y-4">
                <div className="rounded-[10px] border border-line bg-white p-5">
                  <div className="flex items-center gap-3 border-b border-line-soft pb-3">
                    <Avatar name={e.fromName} color="#1e3a5f" size={36} />
                    <div className="min-w-0 text-[13px]">
                      <p className="font-semibold">{e.fromName} <span className="font-normal text-ink-muted">&lt;{e.fromEmail}&gt;</span></p>
                      <p className="text-ink-muted">To: <span className="font-medium text-ink">{e.toEmail}</span></p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">Subject</p>
                    <p className="mt-0.5 text-[15px] font-semibold">{e.subject}</p>
                  </div>
                  <div className="mt-3">
                    <textarea
                      aria-label="Email body"
                      data-testid="email-compose-body"
                      rows={11}
                      readOnly={sent}
                      value={body}
                      onChange={(ev) => setBody(ev.target.value)}
                      className={cx("w-full resize-none rounded-[6px] border border-line p-3 text-[13.5px] leading-relaxed focus:border-[#1e3a5f] focus:outline-none", sent && "bg-[#f9fafb] text-ink-muted")}
                    />
                  </div>
                  {!sent ? (
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-[12px] text-ink-muted">Triggered by card alert on Commercial Card •••• {e.card.last4} ($1,842.50)</span>
                      <Button variant="dark" icon="send" className="!bg-[#1e3a5f] hover:!bg-[#152b47]" onClick={send} data-testid="email-send-btn">
                        Send email to Fernhill
                      </Button>
                    </div>
                  ) : null}
                </div>

                {sent ? (
                  <div className="hs-pop rounded-[10px] border border-[#f5c8b0] bg-[#fff7f3] p-4" data-testid="email-sent-banner">
                    <p className="flex items-center gap-2 text-[14.5px] font-semibold text-ink">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0b5b2b] text-white">
                        <Icon name="check" size={14} strokeWidth={2.4} />
                      </span>
                      Email delivered to {e.toEmail}
                    </p>
                    <p className="mt-1.5 text-[13px] text-ink-muted">
                      Switch into HubSpot Help Desk to watch Breeze Customer Agent read Ansel&apos;s email, match his contact record, look up Commercial Card •••• {e.card.last4}, reply with dispute steps, and open Ticket {e.ticketNumber}.
                    </p>
                    <A
                      to="/service"
                      data-testid="email-open-hubspot"
                      className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-[6px] bg-hs-orange px-4 text-[13.5px] font-semibold text-white hover:bg-hs-orange-strong"
                    >
                      Open in HubSpot Help Desk <Icon name="arrowRight" size={15} />
                    </A>
                  </div>
                ) : null}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
