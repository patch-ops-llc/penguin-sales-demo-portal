"use client";

import { useEffect, useState } from "react";
import { nowMs } from "@/lib/format";
import { approvalReasons, isLocked, reasonList } from "@/store/quote-math";
import { useSeen, useShell } from "@/store/store";
import { quoteName, ruleOf } from "@/store/world";
import type { Quote } from "@/verticals/types";
import { date, dateTime, relative } from "../format";
import { Icon, type IconName } from "../icons";
import { LazyBuyerView } from "../quote/buyer-lazy";
import { ClosingAgentLauncher } from "../quote/closing-agent-launcher";
import { ClosingAgentStatus } from "../quote/closing-agent-status";
import { QuoteDocument } from "../quote/document";
import { LazyClosingAgentSettings, LazyEditorSidebar, LazyLineItemsEditor } from "../quote/editor-lazy";
import type { ModuleId } from "../quote/settings";
import { ShareDialog } from "../quote/share-dialog";
import { QuoteStatus } from "../quote/status";
import { A, Card, cx, Empty, Menu, Prop, Toast } from "../ui";
import { LazyApprovalsPanel, LazyRequestApprovalDialog } from "./approval-settings-lazy";
import { companyOf, contactName, ownerName } from "./lists";

function NotFound() {
  return (
    <div className="flex-1 bg-hs-bg p-10">
      <Card>
        <Empty title="This quote is not in the demo">
          It may belong to a step that has not happened yet, or the demo was reset.{" "}
          <A to="/quotes" className="hs-link">
            Go to all quotes
          </A>
        </Empty>
      </Card>
    </div>
  );
}

const barButton = "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[4px] px-3.5 text-[13px] font-semibold transition-colors";
const barSecondary = cx(barButton, "border border-white/70 text-white hover:bg-white/10");
const barPrimary = cx(barButton, "bg-white text-ink hover:bg-[#e9e9e9]");

function RailButton({ icon, label, active, onClick, testId, dot }: { icon: IconName; label: string; active?: boolean; onClick?: () => void; testId?: string; dot?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      data-testid={testId}
      className={cx("relative inline-flex h-9 w-9 items-center justify-center rounded-[6px]", active ? "bg-[#e5f5f8] text-[#007a8c]" : "text-ink hover:bg-[#f0f0f0]")}
    >
      <Icon name={icon} size={18} />
      {dot ? <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#f5c26b] ring-2 ring-white" /> : null}
    </button>
  );
}

function Banner({ tone, icon, testId, children }: { tone: "amber" | "green" | "red" | "plain"; icon: IconName; testId: string; children: React.ReactNode }) {
  const tones = { amber: "border-[#f5c26b] bg-[#fef8f0]", green: "border-[#7fded2] bg-[#e5f8f6]", red: "border-[#f2545b] bg-[#fdedee]", plain: "border-line bg-white" };
  return (
    <div className={cx("hs-pop mx-auto mb-4 flex w-full max-w-[880px] items-start gap-2.5 rounded-[4px] border px-4 py-2.5 text-[13.5px]", tones[tone])} data-testid={testId}>
      <Icon name={icon} size={16} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/**
 * The quote editor, as HubSpot lays it out: its own full-screen page with Preview and Share at the
 * top, the document on a canvas, the modules in the left sidebar, and approvals on the right.
 */
export function QuotePage({ id, approvals = false }: { id: string; approvals?: boolean }) {
  const { world } = useShell();
  const quote = world.quotes.find((q) => q.id === id);
  return quote ? <QuoteEditor quote={quote} approvals={approvals} /> : <NotFound />;
}

/** The older address of an approval request. It opens the quote with the Approvals panel showing. */
export function ApprovalPage({ id }: { id: string }) {
  return <QuotePage id={id} approvals />;
}

function QuoteEditor({ quote, approvals }: { quote: Quote; approvals: boolean }) {
  const { world, pack, persona, dispatch, navigate } = useShell();
  const rule = ruleOf(pack, world);
  const reasons = approvalReasons(quote, rule);
  const locked = isLocked(quote, rule);
  const final = quote.status === "Sent" || quote.status === "Accepted";
  const pending = quote.status === "Pending approval";
  const changes = quote.status === "Changes requested";
  // A request that has been sent stays with its approver, whatever the rule says now.
  const approverId = quote.approval?.approverId ?? rule.approverId;
  const isApprover = persona.id === approverId;
  const isRuleQuote = quote.id === rule.quoteId;
  const company = companyOf(world, quote.companyId);
  const contact = world.contacts.find((c) => c.id === quote.contactId);
  const deal = world.deals.find((d) => d.id === quote.dealId);
  const approver = pack.personas.find((p) => p.id === approverId);

  const [view, setView] = useState<"edit" | "lines" | "preview">("edit");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [sidebar, setSidebar] = useState(false);
  const [module, setModule] = useState<ModuleId | null>(null);
  const [panel, setPanel] = useState(approvals || (isApprover && pending));
  const [requesting, setRequesting] = useState(false);
  const [agentPanel, setAgentPanel] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [resumed, setResumed] = useState(false);
  const [toast, setToast] = useState("");

  // A scripted step, the approver, or a step back changes the status from outside; the screen follows it.
  const [status, setStatus] = useState(quote.status);
  if (status !== quote.status) {
    setStatus(quote.status);
    setSharing(quote.status === "Sent");
    setRequesting(false);
    setResumed(false);
    setToast("");
    if (quote.status === "Pending approval") setPanel(true);
    if (quote.status !== "Draft") setView((v) => (v === "lines" ? "edit" : v));
  }

  // Someone who switches to the approver while a request waits starts from HubSpot, where the bell shows it.
  const [viewer, setViewer] = useState(persona.id);
  const leaveForBell = viewer !== persona.id && isApprover && pending && isRuleQuote && world.flags["da.requestOpened"] !== true;
  if (viewer !== persona.id && !leaveForBell) {
    setViewer(persona.id);
    if (isApprover && pending) setPanel(true);
  }
  useEffect(() => {
    if (leaveForBell) navigate("/quotes");
  }, [leaveForBell, navigate]);
  useSeen("da.requestOpened", isApprover && isRuleQuote && Boolean(quote.approval) && !leaveForBell);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const editable = quote.status === "Draft" || quote.status === "Approved" || (changes && resumed);
  const share = () => dispatch({ t: "quote.send", id: quote.id, at: nowMs() });
  const select = (next: ModuleId | null) => {
    setModule(next);
    if (next) setSidebar(true);
  };
  const exitTo = deal ? `/deals/${deal.id}` : "/quotes";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-[#e1e8f0]" data-testid="quote-page">
      <header className="flex h-[52px] shrink-0 items-center gap-4 bg-nav px-4 text-white">
        <A to={exitTo} className="inline-flex h-8 items-center gap-1 rounded-[4px] pl-1.5 pr-3 text-[13px] font-semibold hover:bg-white/10" data-testid="quote-exit">
          <Icon name="chevronLeft" size={15} /> Exit
        </A>
        <span className="h-6 w-px bg-white/25" aria-hidden="true" />
        <h1 className="min-w-0 truncate text-[14.5px] font-semibold">{quoteName(quote)}</h1>
        <QuoteStatus status={quote.status} className="shrink-0 text-[12.5px] text-white/85" testId="quote-status" />
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {view === "lines" ? null : view === "preview" ? (
            <button type="button" className={barSecondary} onClick={() => setView("edit")} data-testid="quote-preview-close">
              Exit preview
            </button>
          ) : (
            <button type="button" className={barSecondary} onClick={() => setView("preview")} data-testid="quote-preview">
              Preview
            </button>
          )}
          {view === "lines" ? null : final ? (
            <>
              <button type="button" className={barSecondary} onClick={() => setSharing(true)} data-testid="quote-share-again">
                Share
              </button>
              <button type="button" className={barPrimary} onClick={() => navigate(`/quotes/${quote.id}/buyer`)} data-testid="quote-view-as-buyer">
                View as buyer <Icon name="external" size={14} />
              </button>
            </>
          ) : pending ? null : changes && !resumed ? (
            <button type="button" className={barPrimary} onClick={() => setResumed(true)} data-testid="quote-edit">
              Edit quote
            </button>
          ) : locked ? (
            <button type="button" className={barPrimary} title="View approval conditions in the Approvals panel" onClick={() => setRequesting(true)} data-testid="quote-request-approval">
              Request approval
            </button>
          ) : (
            <button type="button" className={barPrimary} onClick={share} data-testid="quote-send">
              Share
            </button>
          )}
        </div>
      </header>

      {view === "lines" ? (
        <LazyLineItemsEditor quote={quote} onClose={() => setView("edit")} />
      ) : (
        <>
          <div className="relative flex h-11 shrink-0 items-center border-b border-line bg-white px-4">
            <div className="absolute left-1/2 flex -translate-x-1/2 gap-1" role="group" aria-label="Preview size">
              <RailButton icon="desktop" label="Desktop" active={device === "desktop"} onClick={() => setDevice("desktop")} testId="device-desktop" />
              <RailButton icon="mobile" label="Mobile" active={device === "mobile"} onClick={() => setDevice("mobile")} testId="device-mobile" />
            </div>
            {view === "preview" ? (
              <p className="text-[12.5px] text-ink-muted">Preview: what {contact?.firstName ?? "the buyer"} sees when the quote is shared</p>
            ) : (
              <div className="ml-auto flex items-center gap-4 text-[13px]">
                <ClosingAgentStatus
                  quote={quote}
                  open={agentPanel && !panel}
                  onClick={() => {
                    setAgentPanel((open) => (panel ? true : !open));
                    setPanel(false);
                  }}
                />
                <Menu
                  align="right"
                  width={300}
                  button={({ toggle }) => (
                    <button type="button" onClick={toggle} className="inline-flex h-8 items-center gap-1.5 rounded-[4px] px-2 font-semibold hover:bg-[#f0f0f0]" data-testid="quote-settings">
                      <Icon name="settings" size={15} /> Settings
                    </button>
                  )}
                >
                  {() => (
                    <dl className="px-4 py-2">
                      <Prop label="Quote name">{quoteName(quote)}</Prop>
                      <Prop label="Deal">
                        {deal ? (
                          <A to={`/deals/${deal.id}`} className="hs-link" data-testid="quote-deal">
                            {deal.name}
                          </A>
                        ) : null}
                      </Prop>
                      <Prop label="Company">{company?.name}</Prop>
                      <Prop label="Quote owner">{ownerName(pack, quote.ownerId)}</Prop>
                      <Prop label="Created">{dateTime(quote.createdAt)}</Prop>
                      <Prop label="Expiration date">{date(quote.validUntil)}</Prop>
                      <Prop label="Source">{quote.origin}</Prop>
                    </dl>
                  )}
                </Menu>
              </div>
            )}
          </div>

          {view === "preview" ? (
            <div className="hs-scroll min-h-0 flex-1 overflow-y-auto" data-testid="quote-preview-modal">
              <LazyBuyerView quote={quote} narrow={device === "mobile"} />
            </div>
          ) : (
            <div className="relative flex min-h-0 flex-1">
              {editable ? (
                <nav className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-line bg-white py-2" aria-label="Quote editor">
                  <RailButton
                    icon="plus"
                    label="Add a section"
                    onClick={() => {
                      setModule(null);
                      setSidebar(true);
                    }}
                  />
                  <RailButton icon="siteTree" label="Quote sections" active={sidebar} onClick={() => setSidebar((open) => !open)} testId="quote-modules" />
                </nav>
              ) : null}
              {editable && sidebar ? <LazyEditorSidebar quote={quote} module={module} onSelect={setModule} onClose={() => setSidebar(false)} onEditLines={() => setView("lines")} /> : null}

              <div className="relative flex min-w-0 flex-1">
                <main className="hs-scroll relative min-w-0 flex-1 overflow-y-auto px-6 py-6">
                {final ? (
                  <Banner tone="plain" icon="check" testId="quote-sent-banner">
                    <span className="font-semibold">
                      {quote.status === "Accepted" ? `Accepted by ${contactName(contact)}` : `Published and shared with ${contactName(contact)}`} {relative(quote.acceptedAt ?? quote.sentAt ?? quote.createdAt).toLowerCase()}.
                    </span>{" "}
                    {deal ? (
                      <>
                        It is on the timeline of{" "}
                        <A to={`/deals/${deal.id}`} className="hs-link" data-testid="quote-deal-link">
                          {deal.name}
                        </A>
                        .
                      </>
                    ) : null}
                  </Banner>
                ) : pending ? (
                  <Banner tone="amber" icon="lock" testId="quote-pending-banner">
                    <span className="font-semibold">Pending approval.</span> {isApprover ? "This quote is waiting for your approval." : `${approver?.name} was notified ${quote.approval ? relative(quote.approval.requestedAt).toLowerCase() : ""}. The quote cannot be shared until it is approved.`}{" "}
                    <button type="button" className="hs-link" onClick={() => setPanel(true)}>
                      View approval
                    </button>
                  </Banner>
                ) : changes ? (
                  <Banner tone="red" icon="warning" testId="quote-changes-banner">
                    <span className="font-semibold">Changes requested by {approver?.name}.</span> {quote.approval?.feedback ? `"${quote.approval.feedback}" ` : ""}
                    {resumed ? "Update the quote, then request approval again." : "Click Edit quote to update it."}
                  </Banner>
                ) : quote.status === "Approved" ? (
                  <Banner tone="green" icon="unlock" testId="quote-approved-banner">
                    <span className="font-semibold">Approved by {approver?.name}</span> {quote.approval?.decidedAt ? relative(quote.approval.decidedAt).toLowerCase() : ""}. The quote is ready to share.
                  </Banner>
                ) : locked ? (
                  <Banner tone="amber" icon="lock" testId="quote-locked">
                    <span className="font-semibold">This quote needs approval before it can be shared:</span> {reasonList(reasons)}.{" "}
                    <button type="button" className="hs-link" onClick={() => setPanel(true)} data-testid="view-approval-conditions">
                      View approval conditions
                    </button>
                  </Banner>
                ) : null}

                <div className={cx("mx-auto transition-[max-width]", device === "mobile" ? "max-w-[430px]" : "max-w-[880px]")}>
                  <QuoteDocument quote={quote} editing={editable ? { selected: module, onSelect: select, onEditLines: () => setView("lines") } : undefined} />
                </div>
                </main>
                {final ? null : <ClosingAgentLauncher quote={quote} test />}
                {agentPanel && !panel ? <LazyClosingAgentSettings quote={quote} onClose={() => setAgentPanel(false)} /> : null}
              </div>

              {panel ? (
                <LazyApprovalsPanel quote={quote} onClose={() => setPanel(false)} />
              ) : (
                <div className="pointer-events-none absolute right-4 top-4 z-10 flex flex-col gap-1 rounded-[8px] border border-line bg-white p-1 shadow-[0_2px_10px_rgba(20,20,20,0.12)] [&>*]:pointer-events-auto" aria-label="Collaboration">
                  <RailButton icon="grid" label="Collaboration" />
                  <RailButton icon="star4" label="Breeze" />
                  <RailButton icon="approvals" label="Approvals" onClick={() => setPanel(true)} testId="approvals-toggle" dot={reasons.length > 0 && !final && quote.status !== "Approved"} />
                </div>
              )}
            </div>
          )}
        </>
      )}

      {requesting && locked ? <LazyRequestApprovalDialog quote={quote} onClose={() => setRequesting(false)} /> : null}
      {sharing && final ? (
        <ShareDialog
          quote={quote}
          onClose={() => setSharing(false)}
          onSent={(message) => {
            setSharing(false);
            setToast(message);
          }}
        />
      ) : null}
      {toast ? <Toast>{toast}</Toast> : null}
    </div>
  );
}
