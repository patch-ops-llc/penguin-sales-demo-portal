"use client";

import { useState } from "react";
import { nowMs } from "@/lib/format";
import { useShell } from "@/store/store";
import { isServiceDeskConfig, type FintechCustomerAgentConfig, type ServiceDeskCustomerAgentConfig } from "@/verticals/types";
import { money, relative } from "../format";
import { Icon } from "../icons";
import { A, Button, cx, Tag } from "../ui";

/**
 * Off-platform chat screen:
 * - Fintech: Fernhill Capital's business treasury app (Step 1).
 * - Healthcare & IT Services: Clinic Patient Portal (after-hours logistics + clinical question)
 *   or IT Service Desk Portal (password reset + VPN/firewall outage).
 */
export function OffplatformChatPage({ variant = "primary" }: { variant?: "primary" | "escalation" }) {
  const { pack } = useShell();
  const cfg = pack.demos.customerAgent;
  if (!cfg) return null;
  if (isServiceDeskConfig(cfg)) {
    return <ServiceDeskOffplatformChat cfg={cfg} variant={variant} />;
  }
  return <FintechOffplatformChat cfg={cfg} />;
}

function ServiceDeskOffplatformChat({ cfg, variant }: { cfg: ServiceDeskCustomerAgentConfig; variant: "primary" | "escalation" }) {
  const { world, dispatch } = useShell();
  const isEscalation = variant === "escalation";
  const chat = cfg.chatCase;
  const esc = cfg.escalationCase;

  const defaultQuestion = isEscalation ? esc.customerMessage : chat.customerQuestion;
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [draft, setDraft] = useState(defaultQuestion);

  const sent = isEscalation ? world.ca.escalationChatSent : world.ca.chatSent;
  const resolved = isEscalation ? world.ca.fraudHandedOff : world.ca.chatResolved;
  const sentText = isEscalation ? (world.ca.escalationMessage ?? esc.customerMessage) : (world.ca.chatMessage ?? chat.customerQuestion);
  const contactId = isEscalation ? esc.contactId : chat.contactId;
  const companyId = isEscalation ? esc.companyId : chat.companyId;
  const contact = world.contacts.find((x) => x.id === contactId);
  const company = world.companies.find((x) => x.id === companyId);

  const portalName = isEscalation ? esc.portalName : chat.portalName;
  const portalSubtitle = isEscalation ? esc.portalSubtitle : chat.portalSubtitle;
  const portalUrl = isEscalation ? esc.portalUrl : chat.portalUrl;
  const portalBadge = isEscalation ? esc.portalBadge : chat.portalBadge;
  const accentHex = isEscalation ? esc.accentHex : chat.accentHex;
  const complianceNote = isEscalation ? esc.complianceNote : chat.complianceNote;
  const quickPrompts = isEscalation ? esc.quickPrompts : chat.quickPrompts;

  const send = () => {
    if (sent) return;
    if (isEscalation) {
      dispatch({ t: "ca.escalationSend", message: draft.trim() || esc.customerMessage, at: nowMs() });
    } else {
      dispatch({ t: "ca.chatSend", message: draft.trim() || chat.customerQuestion, at: nowMs() });
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#dfe4ea] p-4" data-testid="offplatform-chat" data-variant={variant}>
      <div className="mb-3 flex items-center justify-between gap-3 text-[12.5px]">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold text-white" style={{ backgroundColor: accentHex }}>
            <Icon name="globe" size={13} /> {portalBadge}
          </span>
          <span className="text-ink-muted">
            {cfg.mode === "clinic-front-desk" ? "Patient view" : "End-user view"}:{" "}
            {contact ? `${contact.firstName} ${contact.lastName}` : contactId}
            {company ? `, ${company.name}` : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-full border border-[#b5bec8] bg-white p-0.5">
            <button
              type="button"
              onClick={() => setViewport("desktop")}
              data-testid="chat-view-desktop"
              aria-pressed={viewport === "desktop"}
              className={cx(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold",
                viewport === "desktop" ? "bg-ink text-white" : "text-ink-muted hover:text-ink",
              )}
            >
              <Icon name="desktop" size={13} /> Web portal
            </button>
            <button
              type="button"
              onClick={() => setViewport("mobile")}
              data-testid="chat-view-mobile"
              aria-pressed={viewport === "mobile"}
              className={cx(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold",
                viewport === "mobile" ? "bg-ink text-white" : "text-ink-muted hover:text-ink",
              )}
            >
              <Icon name="mobile" size={13} /> Mobile
            </button>
          </div>
          <A
            to="/service"
            data-testid="offplatform-back-hubspot"
            className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-ink bg-white px-3 text-[12.5px] font-semibold text-ink hover:bg-[#f5f5f5]"
          >
            Back to HubSpot <Icon name="arrowRight" size={14} />
          </A>
        </div>
      </div>

      <div
        className={cx(
          "mx-auto flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] border border-[#b8c2cc] bg-white shadow-lg transition-[max-width] duration-150",
          viewport === "mobile" ? "w-full max-w-[440px]" : "w-full",
        )}
      >
        {/* Browser bar */}
        <div className="flex items-center gap-3 border-b border-line bg-[#f1f3f5] px-4 py-2">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </span>
          <span className="flex h-7 flex-1 items-center gap-2 rounded-full bg-white px-3 text-[12.5px] text-ink-muted ring-1 ring-line-soft">
            <Icon name="lock" size={12} /> {portalUrl}
          </span>
        </div>

        {/* Portal Header */}
        <header className="flex items-center justify-between px-6 py-3.5 text-white" style={{ backgroundColor: accentHex }}>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] bg-white/15 text-[13px] font-bold text-white">
              {cfg.mode === "clinic-front-desk" ? "CS" : "QT"}
            </span>
            <div>
              <p className="text-[15px] font-bold leading-tight tracking-tight">{portalName}</p>
              <p className="text-[11.5px] text-white/75">{portalSubtitle}</p>
            </div>
          </div>
          <div className="text-right text-[12px]">
            <p className="font-semibold">{contact ? `${contact.firstName} ${contact.lastName}` : ""}</p>
            <p className="text-white/75">{isEscalation ? esc.accountRef : company?.name}</p>
          </div>
        </header>

        {complianceNote ? (
          <div className="flex items-center gap-2 border-b border-[#cfe5e3] bg-[#eff8f7] px-6 py-2 text-[12px] text-[#0c4a49]" data-testid="offplatform-compliance-note">
            <Icon name="shield" size={14} className="shrink-0" />
            <span>{complianceNote}</span>
          </div>
        ) : null}

        {/* Body */}
        <div className={cx("hs-scroll min-h-0 flex-1 overflow-y-auto bg-[#f4f7f8]", viewport === "mobile" ? "space-y-4 p-4" : "grid grid-cols-[1fr_430px] gap-6 p-6")}>
          {/* Left: Context Cards & Reference Items */}
          <div className="space-y-4">
            <div className={cx("grid gap-3", viewport === "mobile" ? "grid-cols-1" : "grid-cols-2")}>
              {chat.summaryCards.map((card) => (
                <div
                  key={card.label}
                  className={cx(
                    "rounded-[10px] border p-4",
                    card.tone === "amber"
                      ? "border-[#f2d08b] bg-[#fffaf0]"
                      : card.tone === "teal"
                        ? "border-[#b8dfdd] bg-[#f2fbfa]"
                        : "border-[#d6e0e2] bg-white",
                  )}
                >
                  <p className="text-[11.5px] font-semibold uppercase tracking-wide text-[#526569]">{card.label}</p>
                  <p className="mt-1 text-[20px] font-bold leading-tight text-[#0d2d2e]">{card.value}</p>
                  <p className="mt-1 text-[12px] text-[#526569]">{card.note}</p>
                </div>
              ))}
            </div>

            {isEscalation ? (
              <section className="rounded-[10px] border border-[#f5c2be] bg-[#fff8f7] p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13.5px] font-bold text-[#99201a]">
                    {cfg.mode === "clinic-front-desk" ? "Second After-Hours Inquiry · Clinical Safety Scenario" : "Urgent Network Escalation Scenario"}
                  </p>
                  <Tag tone="red">{esc.guardrailBanner.badge}</Tag>
                </div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#5c2b29]">{esc.guardrailBanner.policySummary}</p>
              </section>
            ) : null}

            <section className="overflow-hidden rounded-[10px] border border-[#d6e0e2] bg-white">
              <div className="flex items-center justify-between border-b border-[#e6ecef] px-4 py-3">
                <h2 className="text-[14px] font-bold text-[#0d2d2e]">{chat.referenceListTitle}</h2>
                <Tag tone="teal">Live Portal</Tag>
              </div>
              <ul className="divide-y divide-[#edf1f3]">
                {chat.referenceItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-[#0d2d2e]">{item.title}</p>
                      <p className="mt-0.5 text-[12px] text-[#526569]">{item.meta}</p>
                    </div>
                    <Tag tone={item.tone}>{item.status}</Tag>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Right: Embedded Support Chat Widget */}
          <section className="flex flex-col overflow-hidden rounded-[12px] border border-[#c7d4d7] bg-white shadow-[0_8px_24px_rgba(13,45,46,0.1)]" data-testid="app-chat-widget">
            <header className="flex items-center gap-2.5 px-4 py-3 text-white" style={{ backgroundColor: accentHex }}>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                <Icon name="chat" size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-bold leading-tight">{cfg.mode === "clinic-front-desk" ? "Clinic Front-Desk Assistant" : "Quillon IT Service Desk Chat"}</p>
                <p className="flex items-center gap-1.5 text-[11.5px] text-white/80">
                  <span className="h-2 w-2 rounded-full bg-[#34d399]" />{" "}
                  {cfg.mode === "clinic-front-desk" ? "After-hours assistant · Logistics & scheduling" : "Instant IT assistant · 24x7 SLA desk"}
                </p>
              </div>
            </header>

            <div className="flex-1 space-y-3 bg-[#f8fbfb] p-4">
              <div className="max-w-[90%] rounded-[10px] rounded-tl-[2px] border border-[#dce6e8] bg-white px-3.5 py-2.5 text-[13px] text-[#1f3235]">
                {cfg.mode === "clinic-front-desk"
                  ? `Hi ${contact?.firstName ?? "there"} — our clinic phones are closed for the evening, but I can help with insurance accepted, parking, visit prep, and booking appointments. For medical emergencies, please call 911.`
                  : `Hi ${contact?.firstName ?? "there"} — welcome to Quillon IT Service Desk. Ask about password resets, open ticket status, MFA setup, or report an outage anytime.`}
              </div>

              {sent ? (
                <>
                  <div className="ml-auto max-w-[90%] rounded-[10px] rounded-tr-[2px] px-3.5 py-2.5 text-[13px] text-white" style={{ backgroundColor: accentHex }} data-testid="app-chat-sent-bubble">
                    {sentText}
                  </div>
                  {resolved ? (
                    <div className="max-w-[92%] whitespace-pre-line rounded-[10px] rounded-tl-[2px] border border-[#bce3d2] bg-[#f0faf5] px-3.5 py-2.5 text-[12.5px] text-[#153c2f]">
                      {isEscalation ? esc.agentAck : chat.agentResolution}
                    </div>
                  ) : (
                    <div className="hs-pop rounded-[10px] border border-[#f5c8b0] bg-[#fff7f3] p-3.5 text-[13px]" data-testid="app-chat-hubspot-handoff">
                      <p className="font-semibold text-[#141414]">Message received by HubSpot Breeze Customer Agent</p>
                      <p className="mt-1 text-[12.5px] text-ink-muted">
                        {isEscalation
                          ? cfg.mode === "clinic-front-desk"
                            ? "Switch into HubSpot Help Desk to watch Breeze enforce the strict No Medical Advice guardrail and hand off to clinic staff with a structured AI summary."
                            : "Switch into HubSpot Help Desk to watch Breeze detect the multi-site VPN/firewall outage, check P1 SLA via PSA/RMM, and escalate to an L2 network engineer."
                          : cfg.mode === "clinic-front-desk"
                            ? "Switch into HubSpot Help Desk to watch Breeze answer Nora's logistics questions from the clinic KB and offer live EHR scheduling."
                            : "Switch into HubSpot Help Desk to watch Breeze match Joel's SLA plan in PSA/RMM and resolve the password reset & ticket status from the IT KB."}
                      </p>
                      <A
                        to="/service"
                        data-testid="app-chat-open-hubspot"
                        className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-[6px] bg-hs-orange px-4 text-[13px] font-semibold text-white hover:bg-hs-orange-strong"
                      >
                        Open in HubSpot Help Desk <Icon name="arrowRight" size={14} />
                      </A>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2 pt-1">
                  <p className="text-[11.5px] font-semibold uppercase tracking-wide text-[#526569]">Suggested prompts</p>
                  <div className="flex flex-wrap gap-1.5">
                    {quickPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => setDraft(prompt)}
                        className={cx(
                          "rounded-full border px-2.5 py-1 text-left text-[12px] transition-colors",
                          draft === prompt ? "border-ink bg-[#e6f2f2] font-semibold text-ink" : "border-[#cdd8db] bg-white text-[#384e52] hover:border-ink",
                        )}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {!sent ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
                className="border-t border-[#e1e9eb] bg-white p-3"
              >
                <div className="flex gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    aria-label="Send support chat message"
                    data-testid="app-chat-input"
                    className="h-9 min-w-0 flex-1 rounded-[6px] border border-[#c5d1d4] px-3 text-[13px] text-[#0d2d2e] focus:border-ink focus:outline-none"
                  />
                  <Button type="submit" variant="dark" size="sm" icon="send" data-testid="app-chat-send">
                    Send
                  </Button>
                </div>
              </form>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

function FintechOffplatformChat({ cfg }: { cfg: FintechCustomerAgentConfig }) {
  const { world, dispatch } = useShell();
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [draft, setDraft] = useState(cfg.chatCase.customerQuestion);
  const [selectedTransfer, setSelectedTransfer] = useState(cfg.chatCase.pendingTransferId);

  const c = cfg.chatCase;
  const sent = world.ca.chatSent;
  const resolved = world.ca.chatResolved;
  const sentText = world.ca.chatMessage ?? c.customerQuestion;
  const contact = world.contacts.find((x) => x.id === c.contactId);
  const company = world.companies.find((x) => x.id === c.companyId);

  const send = () => {
    if (sent) return;
    dispatch({ t: "ca.chatSend", message: draft.trim() || c.customerQuestion, at: nowMs() });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#dfe4ea] p-4" data-testid="offplatform-chat">
      <div className="mb-3 flex items-center justify-between gap-3 text-[12.5px]">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0d2d2e] px-3 py-1 font-semibold text-white">
            <Icon name="globe" size={13} /> Off-platform · Fernhill Fintech App
          </span>
          <span className="text-ink-muted">Customer view: {contact ? `${contact.firstName} ${contact.lastName}` : "Sabine Keller"}, {company?.name ?? "Brackenridge Brewing"}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-full border border-[#b5bec8] bg-white p-0.5">
            <button
              type="button"
              onClick={() => setViewport("desktop")}
              data-testid="chat-view-desktop"
              aria-pressed={viewport === "desktop"}
              className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold", viewport === "desktop" ? "bg-[#0d2d2e] text-white" : "text-ink-muted hover:text-ink")}
            >
              <Icon name="desktop" size={13} /> Web app
            </button>
            <button
              type="button"
              onClick={() => setViewport("mobile")}
              data-testid="chat-view-mobile"
              aria-pressed={viewport === "mobile"}
              className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold", viewport === "mobile" ? "bg-[#0d2d2e] text-white" : "text-ink-muted hover:text-ink")}
            >
              <Icon name="mobile" size={13} /> Mobile app
            </button>
          </div>
          <A
            to="/service"
            data-testid="offplatform-back-hubspot"
            className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-ink bg-white px-3 text-[12.5px] font-semibold text-ink hover:bg-[#f5f5f5]"
          >
            Back to HubSpot <Icon name="arrowRight" size={14} />
          </A>
        </div>
      </div>

      <div className={cx("mx-auto flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] border border-[#b8c2cc] bg-white shadow-lg transition-[max-width] duration-150", viewport === "mobile" ? "w-full max-w-[440px]" : "w-full")}>
        {/* Browser / app bar */}
        <div className="flex items-center gap-3 border-b border-line bg-[#f1f3f5] px-4 py-2">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </span>
          <span className="flex h-7 flex-1 items-center gap-2 rounded-full bg-white px-3 text-[12.5px] text-ink-muted ring-1 ring-line-soft">
            <Icon name="lock" size={12} /> {c.appUrl}
          </span>
        </div>

        {/* Fernhill Fintech App Header */}
        <header className="flex items-center justify-between bg-[#0d2d2e] px-6 py-3.5 text-white">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#19a974] text-[14px] font-bold text-[#072122]">FC</span>
            <div>
              <p className="text-[15px] font-bold leading-tight tracking-tight">Fernhill Capital</p>
              <p className="text-[11.5px] text-white/70">Business Treasury &amp; Equipment Banking</p>
            </div>
          </div>
          {viewport === "desktop" ? (
            <nav className="flex gap-5 text-[13px] text-white/75" aria-label="Fernhill app">
              <span>Overview</span>
              <span className="font-semibold text-white underline underline-offset-4">Transfers</span>
              <span>Commercial Cards</span>
              <span>Facilities</span>
            </nav>
          ) : null}
          <div className="text-right text-[12px]">
            <p className="font-semibold">{company?.name ?? "Brackenridge Brewing"}</p>
            <p className="text-white/70">{c.accountNumber}</p>
          </div>
        </header>

        {/* Body */}
        <div className={cx("hs-scroll min-h-0 flex-1 overflow-y-auto bg-[#f4f7f8]", viewport === "mobile" ? "space-y-4 p-4" : "grid grid-cols-[1fr_410px] gap-6 p-6")}>
          {/* Left: Account & Transfers */}
          <div className="space-y-4">
            <div className={cx("grid gap-3", viewport === "mobile" ? "grid-cols-1" : "grid-cols-2")}>
              <div className="rounded-[10px] border border-[#d6e0e2] bg-white p-4">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[#526569]">Available Balance</p>
                <p className="mt-1 text-[26px] font-bold tabular-nums text-[#0d2d2e]">{money(c.availableBalance)}</p>
                <p className="mt-0.5 text-[12px] text-[#526569]">{c.accountName}</p>
              </div>
              <div className="rounded-[10px] border border-[#f2d08b] bg-[#fffaf0] p-4">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[#855800]">Pending Outbound</p>
                <p className="mt-1 text-[26px] font-bold tabular-nums text-[#855800]">{money(c.pendingBalance)}</p>
                <p className="mt-0.5 text-[12px] text-[#855800]">1 ACH transfer awaiting settlement</p>
              </div>
            </div>

            <section className="overflow-hidden rounded-[10px] border border-[#d6e0e2] bg-white">
              <div className="flex items-center justify-between border-b border-[#e6ecef] px-4 py-3">
                <h2 className="text-[14.5px] font-bold text-[#0d2d2e]">Recent Transfers</h2>
                <Tag tone="amber">1 Pending</Tag>
              </div>
              <ul className="divide-y divide-[#edf1f3]">
                {c.transfers.map((tx) => {
                  const active = selectedTransfer === tx.id;
                  return (
                    <li key={tx.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedTransfer(tx.id)}
                        data-testid={`app-transfer-${tx.id}`}
                        className={cx("flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[#f7fafb]", active && "bg-[#f0f7f7]")}
                      >
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 text-[13.5px] font-semibold text-[#0d2d2e]">
                            <span className="truncate">{tx.recipient}</span>
                            <Tag tone={tx.status === "Pending" ? "amber" : "green"}>{tx.status}</Tag>
                          </p>
                          <p className="mt-0.5 text-[12px] text-[#526569]">
                            {tx.id} · {tx.method} · Initiated {relative(tx.initiatedAt).toLowerCase()}
                          </p>
                        </div>
                        <p className="shrink-0 text-[14px] font-bold tabular-nums text-[#0d2d2e]">-{money(tx.amount)}</p>
                      </button>
                      {active && tx.status === "Pending" ? (
                        <div className="border-t border-[#e6ecef] bg-[#fbfdfd] px-4 py-2.5 text-[12.5px] text-[#455a5e]">
                          <p>
                            <span className="font-semibold text-[#0d2d2e]">Status:</span> Pending Federal Reserve clearing batch. Need faster confirmation? Ask Fernhill Support in the chat panel.
                          </p>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>

          {/* Right: Embedded In-App Support Chat */}
          <section className="flex flex-col overflow-hidden rounded-[12px] border border-[#c7d4d7] bg-white shadow-[0_8px_24px_rgba(13,45,46,0.1)]" data-testid="app-chat-widget">
            <header className="flex items-center gap-2.5 bg-[#134e4a] px-4 py-3 text-white">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                <Icon name="chat" size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-bold leading-tight">Fernhill Support Chat</p>
                <p className="flex items-center gap-1.5 text-[11.5px] text-white/80">
                  <span className="h-2 w-2 rounded-full bg-[#34d399]" /> Instant AI assistant · 24/7
                </p>
              </div>
            </header>

            <div className="flex-1 space-y-3 bg-[#f8fbfb] p-4">
              <div className="max-w-[88%] rounded-[10px] rounded-tl-[2px] border border-[#dce6e8] bg-white px-3.5 py-2.5 text-[13px] text-[#1f3235]">
                Hi {contact?.firstName ?? "Sabine"} — welcome to Fernhill Support. Ask about transfers, cards, or account access anytime.
              </div>

              {sent ? (
                <>
                  <div className="ml-auto max-w-[88%] rounded-[10px] rounded-tr-[2px] bg-[#0d2d2e] px-3.5 py-2.5 text-[13px] text-white" data-testid="app-chat-sent-bubble">
                    {sentText}
                  </div>
                  {resolved ? (
                    <>
                      <div className="max-w-[92%] whitespace-pre-line rounded-[10px] rounded-tl-[2px] border border-[#bce3d2] bg-[#f0faf5] px-3.5 py-2.5 text-[12.5px] text-[#153c2f]">
                        {c.agentResolution}
                      </div>
                      <div className="ml-auto max-w-[85%] rounded-[10px] rounded-tr-[2px] bg-[#0d2d2e] px-3.5 py-2 text-[12.5px] text-white">
                        {c.customerReply}
                      </div>
                    </>
                  ) : (
                    <div className="hs-pop rounded-[10px] border border-[#f5c8b0] bg-[#fff7f3] p-3.5 text-[13px]" data-testid="app-chat-hubspot-handoff">
                      <p className="font-semibold text-[#141414]">Message received by HubSpot Breeze Customer Agent</p>
                      <p className="mt-1 text-[12.5px] text-ink-muted">
                        Switch into HubSpot Help Desk to see the agent match Sabine Keller&apos;s contact record, inspect transfer TXN-884192, and run the security check.
                      </p>
                      <A
                        to="/service"
                        data-testid="app-chat-open-hubspot"
                        className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-[6px] bg-hs-orange px-4 text-[13px] font-semibold text-white hover:bg-hs-orange-strong"
                      >
                        Open in HubSpot Help Desk <Icon name="arrowRight" size={14} />
                      </A>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2 pt-1">
                  <p className="text-[11.5px] font-semibold uppercase tracking-wide text-[#526569]">Suggested questions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {c.quickPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => setDraft(prompt)}
                        className={cx(
                          "rounded-full border px-2.5 py-1 text-[12px] transition-colors",
                          draft === prompt ? "border-[#0d2d2e] bg-[#e6f2f2] font-semibold text-[#0d2d2e]" : "border-[#cdd8db] bg-white text-[#384e52] hover:border-[#0d2d2e]",
                        )}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {!sent ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
                className="border-t border-[#e1e9eb] bg-white p-3"
              >
                <div className="flex gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    aria-label="Message Fernhill Support"
                    data-testid="app-chat-input"
                    className="h-9 min-w-0 flex-1 rounded-[6px] border border-[#c5d1d4] px-3 text-[13px] text-[#0d2d2e] focus:border-[#0d2d2e] focus:outline-none"
                  />
                  <Button type="submit" variant="dark" size="sm" icon="send" className="!bg-[#0d2d2e] hover:!bg-[#081f20]" data-testid="app-chat-send">
                    Send
                  </Button>
                </div>
              </form>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
