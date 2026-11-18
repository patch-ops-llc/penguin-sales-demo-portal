"use client";

import { nowMs } from "@/lib/format";
import { useState } from "react";
import { approvalReasons, isLocked, quoteTotals } from "@/store/quote-math";
import { useSeen, useShell } from "@/store/store";
import type { Quote } from "@/verticals/types";
import { Ext } from "../ext";
import { date, dateTime, money, money2, pct, relative } from "../format";
import { Icon } from "../icons";
import { A, Button, Card, cx, Empty, Modal, Prop, statusTone, Tag } from "../ui";
import { companyOf, contactName, ownerName } from "./lists";

/** The quote as the buyer sees it. Used in the preview and on the buyer page. */
function QuoteDocument({ quote }: { quote: Quote }) {
  const { world, pack } = useShell();
  const company = companyOf(world, quote.companyId);
  const contact = world.contacts.find((c) => c.id === quote.contactId);
  const owner = pack.personas.find((p) => p.id === quote.ownerId);
  const totals = quoteTotals(quote);
  return (
    <article className="mx-auto max-w-[760px] bg-white px-10 py-9 text-[13.5px]" data-testid="quote-document">
      <header className="flex items-start justify-between border-b-2 border-ink pb-5">
        <div>
          <p className="text-[20px] font-bold tracking-tight">{pack.portal.company}</p>
          <p className="text-[12.5px] text-ink-muted">{pack.portal.domain}</p>
        </div>
        <div className="text-right">
          <p className="text-[18px] font-semibold">Quote {quote.number}</p>
          <p className="text-[12.5px] text-ink-muted">Issued {date(quote.sentAt ?? quote.createdAt)}</p>
          <p className="text-[12.5px] text-ink-muted">Valid until {date(quote.validUntil)}</p>
        </div>
      </header>
      <div className="grid grid-cols-2 gap-6 py-5">
        <div>
          <p className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Prepared for</p>
          <p className="mt-1 font-semibold">{contactName(contact)}</p>
          <p>{contact?.title}</p>
          <p>{company?.name}</p>
          <p className="text-ink-muted">{company ? `${company.city}, ${company.state}` : ""}</p>
        </div>
        <div>
          <p className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Prepared by</p>
          <p className="mt-1 font-semibold">{owner?.name}</p>
          <p>{owner?.title}</p>
          <p className="text-ink-muted">{owner?.email}</p>
        </div>
      </div>
      <h2 className="text-[15px] font-semibold">{quote.title}</h2>
      <table className="mt-3 w-full">
        <thead>
          <tr className="border-y border-line text-left text-[11.5px] uppercase tracking-wide text-ink-muted">
            <th className="py-2 font-semibold">Item</th>
            <th className="py-2 text-right font-semibold">Qty</th>
            <th className="py-2 text-right font-semibold">Unit price</th>
            <th className="py-2 text-right font-semibold">Lead time</th>
            <th className="py-2 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {quote.lineItems.map((l) => (
            <tr key={l.sku} className="border-b border-line-soft align-top">
              <td className="py-2.5 pr-3">
                <p className="font-semibold">{l.name}</p>
                <p className="font-mono text-[12px] text-ink-muted">{l.sku}</p>
              </td>
              <td className="py-2.5 text-right tabular-nums">{l.qty}</td>
              <td className="py-2.5 text-right tabular-nums">{money2(l.unitPrice)}</td>
              <td className="py-2.5 text-right tabular-nums">{l.leadDays} days</td>
              <td className="py-2.5 text-right tabular-nums">{money2(l.qty * l.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="ml-auto mt-4 w-[280px] space-y-1.5">
        <div className="flex justify-between">
          <dt className="text-ink-muted">Subtotal</dt>
          <dd className="tabular-nums">{money2(totals.subtotal)}</dd>
        </div>
        {quote.discountPct > 0 ? (
          <div className="flex justify-between">
            <dt className="text-ink-muted">Discount ({pct(quote.discountPct)})</dt>
            <dd className="tabular-nums">-{money2(totals.discount)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between border-t border-ink pt-2 text-[16px] font-semibold">
          <dt>Total</dt>
          <dd className="tabular-nums" data-testid="document-total">
            {money2(totals.total)}
          </dd>
        </div>
      </dl>
      <section className="mt-7 border-t border-line-soft pt-4">
        <h3 className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">Terms</h3>
        <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[12.5px] text-ink-muted">
          {pack.quoteTerms.map((term) => (
            <li key={term}>{term}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}

function NotFound() {
  return (
    <div className="p-10">
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

function DiscountInput({ quote, disabled }: { quote: Quote; disabled: boolean }) {
  const { dispatch } = useShell();
  const [text, setText] = useState(quote.discountPct ? String(quote.discountPct) : "");
  const [seen, setSeen] = useState(quote.discountPct);
  // A scripted step or a step back changes the discount from outside; follow it.
  if (seen !== quote.discountPct) {
    setSeen(quote.discountPct);
    if ((Number(text) || 0) !== quote.discountPct) setText(quote.discountPct ? String(quote.discountPct) : "");
  }
  return (
    <span className="inline-flex items-center gap-1">
      <input
        value={text}
        disabled={disabled}
        inputMode="decimal"
        aria-label="Discount percent"
        data-testid="quote-discount"
        placeholder="0"
        onChange={(e) => {
          const value = e.target.value.replace(/[^0-9.]/g, "").slice(0, 4);
          setText(value);
          dispatch({ t: "quote.discount", id: quote.id, pct: Number(value) || 0 });
        }}
        className="h-8 w-16 rounded-[6px] border border-line px-2 text-right text-[13.5px] tabular-nums focus:border-ink focus:outline-none disabled:bg-[#f3f3f3] disabled:text-ink-muted"
      />
      %
    </span>
  );
}

export function QuotePage({ id }: { id: string }) {
  const { world, pack, persona, dispatch, navigate } = useShell();
  const [preview, setPreview] = useState(false);
  const quote = world.quotes.find((q) => q.id === id);
  if (!quote) return <NotFound />;

  const rule = pack.demos.discountApproval;
  const totals = quoteTotals(quote);
  const reasons = approvalReasons(quote, rule);
  const locked = isLocked(quote, rule);
  const final = quote.status === "Sent" || quote.status === "Accepted";
  const pending = quote.status === "Pending approval";
  const canSend = !final && !locked;
  const company = companyOf(world, quote.companyId);
  const contact = world.contacts.find((c) => c.id === quote.contactId);
  const deal = world.deals.find((d) => d.id === quote.dealId);
  const approver = pack.personas.find((p) => p.id === rule.approverId);
  const listMargin = quoteTotals({ lineItems: quote.lineItems, discountPct: 0 }).marginPct;
  const send = () => {
    dispatch({ t: "quote.send", id: quote.id, at: nowMs() });
    setPreview(false);
  };

  return (
    <div className="min-h-full" data-testid="quote-page">
      <header className="flex items-center justify-between gap-4 border-b border-line bg-white px-6 py-3.5">
        <div className="min-w-0">
          <A to="/quotes" className="inline-flex items-center gap-1 text-[13px] font-semibold text-link hover:underline">
            <Icon name="chevronLeft" size={14} /> Quotes
          </A>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="truncate text-[19px] font-semibold">
              {quote.number}: {quote.title}
            </h1>
            <Tag tone={statusTone(quote.status)} className="shrink-0">
              <span data-testid="quote-status">{quote.status}</span>
            </Tag>
            {locked ? (
              <span className="inline-flex shrink-0 items-center gap-1 text-[12.5px] font-semibold text-[#754c00]" data-testid="quote-locked">
                <Icon name="lock" size={14} /> Locked until approved
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button icon="eye" onClick={() => setPreview(true)} data-testid="quote-preview">
            Preview
          </Button>
          {final ? (
            <Button variant="primary" icon="external" onClick={() => navigate(`/quotes/${quote.id}/buyer`)} data-testid="quote-view-as-buyer">
              View as buyer
            </Button>
          ) : pending ? (
            persona.id === rule.approverId ? (
              <Button variant="primary" onClick={() => navigate(`/approvals/${quote.id}`)} data-testid="quote-review-approval">
                Review approval request
              </Button>
            ) : (
              <Button variant="primary" disabled icon="lock">
                Waiting for approval
              </Button>
            )
          ) : locked ? (
            <Button variant="primary" onClick={() => dispatch({ t: "quote.requestApproval", id: quote.id, at: nowMs() })} data-testid="quote-request-approval">
              Request approval
            </Button>
          ) : (
            <Button variant="primary" icon="send" onClick={send} data-testid="quote-send">
              Send quote
            </Button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)_300px] gap-4 px-6 py-4">
        <div className="space-y-4">
          {quote.status === "Approved" ? (
            <p className="hs-pop flex items-center gap-2 rounded-[8px] border border-[#9fd8b0] bg-[#eefaf1] px-4 py-2.5 text-[13.5px]" data-testid="quote-approved-banner">
              <Icon name="unlock" size={16} className="text-[#0b5b2b]" />
              <span>
                <span className="font-semibold">Approved by {approver?.name}</span> {quote.approval?.decidedAt ? relative(quote.approval.decidedAt).toLowerCase() : ""}. The quote is unlocked and ready to send.
              </span>
            </p>
          ) : null}
          {pending ? (
            <p className="hs-pop flex items-center gap-2 rounded-[8px] border border-[#ecd28a] bg-[#fff8e1] px-4 py-2.5 text-[13.5px]" data-testid="quote-pending-banner">
              <Icon name="lock" size={16} className="text-[#754c00]" />
              <span>
                <span className="font-semibold">Waiting for {approver?.name} to approve.</span> The quote cannot be sent until then. {approver?.name.split(" ")[0]} was notified {quote.approval ? relative(quote.approval.requestedAt).toLowerCase() : ""}.
              </span>
            </p>
          ) : null}
          {final ? (
            <p className="flex items-center gap-2 rounded-[8px] border border-line bg-white px-4 py-2.5 text-[13.5px]" data-testid="quote-sent-banner">
              <Icon name="check" size={16} className="text-[#0b5b2b]" />
              <span>
                <span className="font-semibold">
                  {quote.status === "Accepted" ? `Accepted by ${contactName(contact)}` : `Sent to ${contactName(contact)}`} {relative(quote.acceptedAt ?? quote.sentAt ?? quote.createdAt).toLowerCase()}.
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
              </span>
            </p>
          ) : null}

          <Card title="Line items" pad={false}>
            <table className="mt-2 w-full text-[13px]" data-testid="quote-lines">
              <thead>
                <tr className="border-y border-line-soft bg-[#fafafa] text-left text-[11.5px] uppercase tracking-wide text-ink-muted">
                  <th className="px-4 py-2 font-semibold">Name</th>
                  <th className="px-4 py-2 text-right font-semibold">Quantity</th>
                  <th className="px-4 py-2 text-right font-semibold">Unit price</th>
                  <th className="px-4 py-2 text-right font-semibold">Lead time</th>
                  <th className="px-4 py-2 text-right font-semibold">Net price</th>
                </tr>
              </thead>
              <tbody>
                {quote.lineItems.map((l) => (
                  <tr key={l.sku} className="border-b border-line-soft last:border-b-0">
                    <td className="px-4 py-2.5">
                      <p className="font-semibold">{l.name}</p>
                      <p className="text-[12px] text-ink-muted">
                        <span className="font-mono">{l.sku}</span>
                        {l.description ? ` · ${l.description}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{l.qty}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{money2(l.unitPrice)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{l.leadDays} days</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{money2(l.qty * l.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Ext id="margin-rule">
              <Card title="Approval rule" className={cx(reasons.length > 0 && !final && quote.status !== "Approved" && "border-[#d39b00]")} testId="approval-rule">
                <p className="text-[13px] text-ink-muted">
                  A discount over {rule.thresholdPct}%, or a margin under {rule.marginFloorPct}%, needs approval from {approver?.name}, {approver?.title}.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-[8px] border border-line-soft bg-[#fafafa] px-3 py-2">
                    <p className="text-[11.5px] text-ink-muted">Discount</p>
                    <p className={cx("text-[16px] font-semibold tabular-nums", quote.discountPct > rule.thresholdPct && "text-[#99201a]")}>{pct(quote.discountPct)}</p>
                    <p className="text-[11.5px] text-ink-muted">Limit {rule.thresholdPct}%</p>
                  </div>
                  <div className="rounded-[8px] border border-line-soft bg-[#fafafa] px-3 py-2">
                    <p className="text-[11.5px] text-ink-muted">Margin after discount</p>
                    <p className={cx("text-[16px] font-semibold tabular-nums", totals.marginPct < rule.marginFloorPct && "text-[#99201a]")} data-testid="quote-margin">
                      {pct(totals.marginPct)}
                    </p>
                    <p className="text-[11.5px] text-ink-muted">Floor {rule.marginFloorPct}%, list {pct(listMargin)}</p>
                  </div>
                </div>
                <p className="mt-3 flex flex-wrap items-center gap-1.5 text-[12.5px]" data-testid="approval-reasons">
                  {reasons.length === 0 ? (
                    <Tag tone="green">No approval needed</Tag>
                  ) : (
                    reasons.map((r) => (
                      <Tag key={r} tone={quote.status === "Approved" || final ? "green" : "amber"}>
                        {r}
                        {quote.status === "Approved" || final ? ": approved" : ""}
                      </Tag>
                    ))
                  )}
                </p>
              </Card>
            </Ext>

            <Card title="Summary">
              <dl className="space-y-2 text-[13.5px]">
                <div className="flex items-center justify-between">
                  <dt className="text-ink-muted">Subtotal</dt>
                  <dd className="tabular-nums">{money2(totals.subtotal)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-muted">Discount</dt>
                  <dd className="flex items-center gap-3">
                    <DiscountInput quote={quote} disabled={final} />
                    <span className="w-24 text-right tabular-nums">-{money2(totals.discount)}</span>
                  </dd>
                </div>
                <div className="flex items-center justify-between border-t border-line pt-2.5 text-[16px] font-semibold">
                  <dt>Total</dt>
                  <dd className="tabular-nums" data-testid="quote-total">
                    {money2(totals.total)}
                  </dd>
                </div>
              </dl>
              {!final && quote.status !== "Draft" ? <p className="mt-3 text-[12px] text-ink-muted">Changing the discount returns the quote to draft and clears the approval.</p> : null}
            </Card>
          </div>
        </div>

        <aside className="space-y-4">
          <Card title="Quote details">
            <dl>
              <Prop label="Deal">
                {deal ? (
                  <A to={`/deals/${deal.id}`} className="hs-link" data-testid="quote-deal">
                    {deal.name}
                  </A>
                ) : null}
              </Prop>
              <Prop label="Company">
                {company ? (
                  <A to={`/companies/${company.id}`} className="hs-link">
                    {company.name}
                  </A>
                ) : null}
              </Prop>
              <Prop label="Buyer contact">{contactName(contact)}</Prop>
              <Prop label="Quote owner">{ownerName(pack, quote.ownerId)}</Prop>
              <Prop label="Created">{dateTime(quote.createdAt)}</Prop>
              <Prop label="Expiration date">{date(quote.validUntil)}</Prop>
              <Prop label="Source">{quote.origin}</Prop>
            </dl>
          </Card>
          <Card title="Terms">
            <ul className="list-disc space-y-1.5 pl-4 text-[12.5px] text-ink-muted">
              {pack.quoteTerms.map((term) => (
                <li key={term}>{term}</li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>

      {preview ? (
        <Modal
          title={`Preview: what ${contact?.firstName ?? "the buyer"} sees`}
          onClose={() => setPreview(false)}
          width={860}
          testId="quote-preview-modal"
          footer={
            <>
              {locked ? (
                <span className="mr-auto inline-flex items-center gap-1.5 text-[12.5px] text-[#754c00]">
                  <Icon name="lock" size={14} /> Needs approval before it can be sent.
                </span>
              ) : null}
              <Button onClick={() => setPreview(false)}>Close</Button>
              {canSend ? (
                <Button variant="primary" icon="send" onClick={send} data-testid="preview-send">
                  Send quote
                </Button>
              ) : null}
            </>
          }
        >
          <div className="rounded-[8px] bg-[#ececec] p-4">
            <QuoteDocument quote={quote} />
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

/** The buyer's side: the quote page outside HubSpot, in a browser frame, with a working Accept button. */
export function BuyerPage({ id }: { id: string }) {
  const { world, pack, dispatch } = useShell();
  const quote = world.quotes.find((q) => q.id === id);
  if (!quote || (quote.status !== "Sent" && quote.status !== "Accepted")) {
    return (
      <div className="flex-1 bg-hs-bg p-10">
        <Card>
          <Empty title="This quote has not been sent yet">
            The buyer page exists once the quote is sent.{" "}
            <A to={quote ? `/quotes/${quote.id}` : "/quotes"} className="hs-link">
              Back to the quote
            </A>
          </Empty>
        </Card>
      </div>
    );
  }
  const contact = world.contacts.find((c) => c.id === quote.contactId);
  const accepted = quote.status === "Accepted";
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#d9d9d9] p-4" data-testid="buyer-page">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[10px] border border-[#bdbdbd] bg-white shadow-lg">
        <div className="flex items-center gap-3 border-b border-line bg-[#f1f1f1] px-4 py-2">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </span>
          <span className="flex h-7 flex-1 items-center gap-2 rounded-full bg-white px-3 text-[12.5px] text-ink-muted ring-1 ring-line-soft">
            <Icon name="lock" size={12} /> quotes.{pack.portal.domain}/{quote.number.toLowerCase()}
          </span>
          <span className="text-[12px] text-ink-muted">Viewing as {contactName(contact)}, the buyer</span>
          <A to={`/quotes/${quote.id}`} className="inline-flex h-7 items-center gap-1 rounded-[6px] border border-line bg-white px-2.5 text-[12px] font-semibold" data-testid="buyer-back">
            <Icon name="arrowLeft" size={13} /> Back to HubSpot
          </A>
        </div>
        <div className="hs-scroll min-h-0 flex-1 overflow-y-auto bg-[#ececec] py-6">
          <QuoteDocument quote={quote} />
          <div className="mx-auto mt-4 flex max-w-[760px] items-center justify-between rounded-[8px] bg-white px-10 py-5">
            {accepted ? (
              <p className="hs-pop flex items-center gap-2 text-[14px] font-semibold text-[#0b5b2b]" data-testid="buyer-accepted">
                <Icon name="check" size={18} /> Quote accepted {relative(quote.acceptedAt ?? quote.createdAt).toLowerCase()}. {pack.portal.company} has been notified.
              </p>
            ) : (
              <>
                <p className="text-[13.5px] text-ink-muted">Ready to go ahead? Accepting notifies your account team.</p>
                <Button variant="dark" onClick={() => dispatch({ t: "quote.accept", id: quote.id, at: nowMs() })} data-testid="buyer-accept">
                  Accept quote
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** The approver's page: the request with everything needed to decide, and one button. */
export function ApprovalPage({ id }: { id: string }) {
  const { world, pack, persona, dispatch } = useShell();
  const quote = world.quotes.find((q) => q.id === id);
  const rule = pack.demos.discountApproval;
  const isApprover = persona.id === rule.approverId;
  useSeen("da.requestOpened", Boolean(quote?.approval && isApprover && id === rule.quoteId));
  if (!quote) return <NotFound />;
  const approval = quote.approval;
  const totals = quoteTotals(quote);
  const listMargin = quoteTotals({ lineItems: quote.lineItems, discountPct: 0 }).marginPct;
  const company = companyOf(world, quote.companyId);
  const requester = pack.personas.find((p) => p.id === approval?.requestedById);
  const approver = pack.personas.find((p) => p.id === rule.approverId);
  const erpOrders = company?.id === pack.demos.backOffice.companyId ? pack.demos.backOffice.orders : [];
  const yearTotal = erpOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="mx-auto max-w-[900px] px-6 py-5" data-testid="approval-page">
      <A to="/quotes" className="inline-flex items-center gap-1 text-[13px] font-semibold text-link hover:underline">
        <Icon name="chevronLeft" size={14} /> Quotes
      </A>
      <h1 className="mt-1 text-[21px] font-semibold">Quote approval</h1>

      {!approval ? (
        <Card className="mt-4">
          <Empty title="No approval request on this quote">
            {quote.status === "Sent" || quote.status === "Accepted" ? "The quote was sent." : "The discount is inside the limits, or approval has not been requested yet."}{" "}
            <A to={`/quotes/${quote.id}`} className="hs-link">
              Open the quote
            </A>
          </Empty>
        </Card>
      ) : (
        <Ext id="approval-context" className="mt-4">
          <section className="rounded-[10px] border border-line bg-white" data-testid="approval-card">
            <header className="flex items-start justify-between gap-4 border-b border-line-soft px-5 py-4">
              <div>
                <h2 className="text-[16px] font-semibold">
                  {requester?.name} asks for {pct(approval.discountPct)} off {quote.number}
                </h2>
                <p className="mt-0.5 text-[13px] text-ink-muted">
                  {quote.title} · requested {relative(approval.requestedAt).toLowerCase()} ·{" "}
                  <A to={`/quotes/${quote.id}`} className="hs-link">
                    Open quote
                  </A>
                </p>
                <p className="mt-2 flex flex-wrap gap-1.5">
                  {approval.reasons.map((r) => (
                    <Tag key={r} tone="amber">
                      {r}
                    </Tag>
                  ))}
                </p>
              </div>
              <Tag tone={approval.status === "approved" ? "green" : "amber"} className="mr-8 shrink-0">
                <span data-testid="approval-status">{approval.status === "approved" ? "Approved" : "Pending"}</span>
              </Tag>
            </header>

            <div className="grid grid-cols-3 gap-3 px-5 py-4">
              <div className="rounded-[8px] border border-line-soft bg-[#fafafa] px-3.5 py-3">
                <p className="text-[12px] text-ink-muted">Discount</p>
                <p className="mt-0.5 text-[20px] font-semibold tabular-nums">{pct(approval.discountPct)}</p>
                <p className="text-[12px] text-ink-muted">
                  {money2(totals.discount)} off {money2(totals.subtotal)}
                </p>
              </div>
              <div className="rounded-[8px] border border-line-soft bg-[#fafafa] px-3.5 py-3">
                <p className="text-[12px] text-ink-muted">Margin after discount</p>
                <p className={cx("mt-0.5 text-[20px] font-semibold tabular-nums", totals.marginPct < rule.marginFloorPct && "text-[#99201a]")} data-testid="approval-margin">
                  {pct(totals.marginPct)}
                </p>
                <p className="text-[12px] text-ink-muted">
                  Down from {pct(listMargin)}. Floor is {rule.marginFloorPct}%
                </p>
              </div>
              <div className="rounded-[8px] border border-line-soft bg-[#fafafa] px-3.5 py-3">
                <p className="text-[12px] text-ink-muted">Quote total</p>
                <p className="mt-0.5 text-[20px] font-semibold tabular-nums">{money2(totals.total)}</p>
                <p className="text-[12px] text-ink-muted">{quote.lineItems.length} line items</p>
              </div>
            </div>

            <div className="border-t border-line-soft px-5 py-4">
              <h3 className="text-[13.5px] font-semibold">
                Customer:{" "}
                {company ? (
                  <A to={`/companies/${company.id}`} className="hs-link">
                    {company.name}
                  </A>
                ) : null}
              </h3>
              <dl className="mt-1 grid grid-cols-4 gap-4">
                <Prop label="Orders, last 12 months">{erpOrders.length > 0 ? `${erpOrders.length} orders, ${money(yearTotal)}` : ""}</Prop>
                <Prop label="Last order">{company?.erp ? date(company.erp.lastOrderDate) : ""}</Prop>
                <Prop label="Open balance">{company?.erp ? money(company.erp.openBalance) : ""}</Prop>
                <Prop label="Credit status">{company?.erp ? <Tag tone={statusTone(company.erp.creditStatus)}>{company.erp.creditStatus}</Tag> : ""}</Prop>
              </dl>
            </div>

            <footer className="flex items-center gap-3 border-t border-line-soft bg-[#fafafa] px-5 py-3.5">
              {approval.status === "approved" ? (
                <p className="hs-pop flex items-center gap-2 text-[13.5px] font-semibold text-[#0b5b2b]" data-testid="approval-done">
                  <Icon name="check" size={16} /> Approved by {approver?.name} {approval.decidedAt ? relative(approval.decidedAt).toLowerCase() : ""}. {requester?.name.split(" ")[0]} was notified and the quote is unlocked.
                </p>
              ) : isApprover ? (
                <>
                  <Button variant="primary" icon="check" onClick={() => dispatch({ t: "quote.approve", id: quote.id, at: nowMs() })} data-testid="approve">
                    Approve
                  </Button>
                  <p className="text-[12.5px] text-ink-muted">Approving unlocks the quote and notifies {requester?.name}.</p>
                </>
              ) : (
                <p className="flex items-center gap-2 text-[13px] text-ink-muted" data-testid="approval-not-approver">
                  <Icon name="lock" size={14} /> Only {approver?.name} can approve this. In the demo bar, choose View as, {approver?.viewAs}.
                </p>
              )}
            </footer>
          </section>
        </Ext>
      )}
    </div>
  );
}
