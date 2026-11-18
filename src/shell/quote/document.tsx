"use client";

import { lineNet, quoteTerms, quoteTotals, recurringTotals, unitDiscountPct } from "@/store/quote-math";
import { useShell } from "@/store/store";
import { labelsOf, timingOf } from "@/verticals/labels";
import type { Quote } from "@/verticals/types";
import { date, money2, pct } from "../format";
import { Icon } from "../icons";
import { companyOf, contactName } from "../pages/lists";
import { cx } from "../ui";
import { quoteRef, useQuoteSettings, type ModuleId } from "./settings";

/** Present while the quote is open in the editor: modules can be selected and carry their editor buttons. */
export type DocumentEditing = {
  selected: ModuleId | null;
  onSelect: (module: ModuleId) => void;
  onEditLines: () => void;
};

function Module({ id, editing, actions, children }: { id: ModuleId; editing?: DocumentEditing; actions?: React.ReactNode; children: React.ReactNode }) {
  if (!editing) return <section className="px-5 py-6 @lg:px-10">{children}</section>;
  const selected = editing.selected === id;
  return (
    <section
      data-testid={`quote-module-${id}`}
      data-selected={selected}
      onClick={() => editing.onSelect(id)}
      className={cx("group relative cursor-pointer px-5 py-6 outline outline-2 -outline-offset-2 @lg:px-10", selected ? "outline-[#7fd1de]" : "outline-transparent hover:outline-[#b7e3ea]")}
    >
      {children}
      <div className={cx("absolute right-3 top-3 items-center gap-1.5", selected ? "flex" : "hidden group-hover:flex")}>
        {actions}
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] border border-line bg-white text-ink" title="Generate with Breeze" aria-hidden="true">
          <Icon name="star4" size={15} />
        </span>
      </div>
    </section>
  );
}

const h2 = "text-[19px] font-bold tracking-[-0.01em]";

/**
 * The quote document, laid out as HubSpot's default quote template: header, parties, summary,
 * line items, terms, payments, acceptance. The editor, the preview and the buyer page all show it.
 */
export function QuoteDocument({ quote, editing, acceptance }: { quote: Quote; editing?: DocumentEditing; acceptance?: React.ReactNode }) {
  const { world, pack } = useShell();
  const s = useQuoteSettings(quote);
  const company = companyOf(world, quote.companyId);
  const contact = world.contacts.find((c) => c.id === quote.contactId);
  const owner = pack.personas.find((p) => p.id === quote.ownerId);
  const totals = quoteTotals(quote);
  const format = s.get("discountFormat");
  const discountText =
    format === "pct" ? pct(totals.discountPct) : format === "amount" ? money2(totals.discount) : totals.discount > 0 ? `${pct(totals.discountPct)} (${money2(totals.discount)})` : money2(0);
  const labels = labelsOf(pack).pack;
  const recurring = recurringTotals(quote);
  const paymentLine = pack.quoteTerms.find((t) => /payment/i.test(t));
  const terms = pack.quoteTerms.filter((t) => t !== paymentLine);
  // A vertical whose approval rule covers payment terms sets them on the quote; otherwise they come from the pack's terms.
  const paymentTerms = quoteTerms(quote, pack.demos.discountApproval)?.label ?? (paymentLine ? paymentLine.replace(/^payment terms:\s*/i, "").replace(/\.$/, "") : "net 30");
  const headerRows: [key: string, label: string, value: React.ReactNode][] = [
    ["ref", "Quote ref.", quoteRef(quote)],
    ["issue", "Issue date", date(quote.sentAt ?? quote.createdAt)],
    ["expires", "Expires", date(quote.validUntil)],
    ["currency", "Currency", pack.portal.currency],
    ["po", "PO number", <span key="po" className="text-ink-muted">Added by the buyer</span>],
  ];
  const summary: [key: string, label: string, value: React.ReactNode, testId?: string][] = [
    ["effective", "Effective date", "On agreement"],
    ["term", "Term length", "--"],
    ["discount", "Total discount", discountText, "quote-total-discount"],
    ["tcv", "Total contract value", money2(totals.total), "quote-total"],
  ];
  const shownSummary = summary.filter(([key]) => s.on(`show.${key}`));

  return (
    <article className="@container mx-auto w-full max-w-[880px] rounded-[10px] bg-white py-4 text-[13.5px] leading-relaxed" data-testid="quote-document">
      {s.hidden("cover") ? null : (
        <Module id="cover" editing={editing}>
          <h2 className={h2}>{s.get("label.cover", "Cover letter")}</h2>
          <p className="mt-3">Hi {contact?.firstName ?? "there"},</p>
          <p className="mt-2">
            Thank you for the chance to quote {quote.title}. The pricing below covers everything we discussed, {quote.lineItems.length} line items in all. If anything needs to change, reply to this email and I will turn
            a revision around the same day.
          </p>
          <p className="mt-2">{owner?.name}</p>
        </Module>
      )}
      {s.hidden("exec") ? null : (
        <Module id="exec" editing={editing}>
          <h2 className={h2}>{s.get("label.exec", "Executive summary")}</h2>
          <p className="mt-3">
            {pack.portal.company} will supply {quote.lineItems.map((l) => `${l.qty} x ${l.name}`).join(", ")} for {company?.name ?? "your team"}.{quote.lineItems.some((l) => l.timing) ? "" : ` The longest quoted lead time is ${totals.maxLead} days from receipt of order.`}
          </p>
        </Module>
      )}

      {s.hidden("header") ? null : (
        <Module id="header" editing={editing}>
          <div className="grid gap-6 @lg:grid-cols-2 @lg:gap-8">
            <div>
              <p className="text-[24px] font-extrabold leading-tight tracking-[-0.02em]">{pack.portal.company}</p>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">{pack.portal.domain}</p>
            </div>
            <div>
              <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em]">Quote</h1>
              <dl className="mt-4 space-y-1">
                {headerRows
                  .filter(([key]) => key === "currency" || s.on(`show.${key}`))
                  .map(([key, label, value]) => (
                    <div key={key} className="flex gap-3">
                      <dt className="w-[92px] shrink-0">{s.get(`label.${key}`, label)}</dt>
                      <dd className="tabular-nums">{value}</dd>
                    </div>
                  ))}
              </dl>
            </div>
          </div>
        </Module>
      )}

      {s.hidden("parties") ? null : (
        <Module id="parties" editing={editing}>
          <div className="grid gap-6 @lg:grid-cols-2 @lg:gap-8">
            <div>
              <h2 className={h2}>{s.get("label.seller", "Seller")}</h2>
              <p className="mt-3 font-bold">{pack.portal.company}</p>
              {(pack.portal.address ?? [pack.portal.domain]).map((line) => (
                <p key={line}>{line}</p>
              ))}
              <p className="mt-3 font-bold">Contact</p>
              <p>
                {owner?.name} ({owner?.email})
              </p>
            </div>
            <div>
              <h2 className={h2}>{s.get("label.buyer", "Buyer")}</h2>
              <p className="mt-3 font-bold">{company?.name}</p>
              {company ? (
                <>
                  <p>
                    {company.city}, {company.state}
                  </p>
                  <p>United States</p>
                </>
              ) : null}
              <p className="mt-3 font-bold">Contacts</p>
              <p>
                {contactName(contact)} ({contact?.email})
              </p>
            </div>
          </div>
        </Module>
      )}

      {s.hidden("summary") || shownSummary.length === 0 ? null : (
        <Module id="summary" editing={editing}>
          <dl className="flex flex-wrap gap-x-10 gap-y-4 border-y border-line-soft py-4">
            {shownSummary.map(([key, label, value, testId]) => (
              <div key={key} className={cx(key === "tcv" && "ml-auto text-right")}>
                <dt className="font-bold">{s.get(`label.${key}`, label)}</dt>
                <dd className="mt-1.5 tabular-nums" data-testid={testId}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </Module>
      )}

      {s.hidden("lines") ? null : (
        <Module
          id="lines"
          editing={editing}
          actions={
            <button
              type="button"
              data-testid="quote-edit-lines"
              onClick={(e) => {
                e.stopPropagation();
                editing?.onEditLines();
              }}
              className="inline-flex h-8 items-center rounded-[4px] bg-[#33475b] px-3 text-[12px] font-semibold text-white hover:bg-[#253342]"
            >
              Edit all line items
            </button>
          }
        >
          <h2 className={h2}>Line items</h2>
          <div className="overflow-x-auto">
            <table className="mt-4 w-full min-w-[520px]" data-testid="quote-lines">
              <thead>
                <tr className="border-b-2 border-line-soft text-left">
                  <th className="pb-2 font-bold">Name</th>
                  <th className="pb-2 text-right font-bold">Quantity</th>
                  <th className="pb-2 text-right font-bold">Unit price</th>
                  <th className="pb-2 text-right font-bold">Unit discount</th>
                  <th className="pb-2 text-right font-bold">Net price</th>
                </tr>
              </thead>
              <tbody>
                {quote.lineItems.map((l) => (
                  <tr key={l.sku} className="border-b border-line-soft align-top">
                    <td className="py-3 pr-4">
                      <p className="font-bold">{l.name}</p>
                      <p className="mt-1 text-[12.5px]">SKU: {l.sku}</p>
                      <p className="text-[12.5px]">
                        {labels.timing}: {timingOf(l)}
                      </p>
                    </td>
                    <td className="py-3 text-right tabular-nums">{l.qty}</td>
                    <td className="py-3 text-right tabular-nums">{money2(l.unitPrice)}</td>
                    <td className="py-3 text-right tabular-nums">{pct(unitDiscountPct(quote, l))}</td>
                    <td className="py-3 text-right tabular-nums">{money2(lineNet(quote, l))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {s.on("show.totals") ? (
            <dl className="ml-auto mt-4 w-[300px] max-w-full space-y-1.5">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd className="tabular-nums">{money2(totals.subtotal)}</dd>
              </div>
              {totals.discount > 0 ? (
                <div className="flex justify-between">
                  <dt>Total discount</dt>
                  <dd className="tabular-nums">-{money2(totals.discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-line pt-2 text-[15px] font-bold">
                <dt>{labels.quoteTotal}</dt>
                <dd className="tabular-nums" data-testid="document-total">
                  {money2(totals.total)}
                </dd>
              </div>
              {recurring ? (
                <>
                  <div className="flex justify-between text-[12.5px]">
                    <dt>{labels.recurring.annual}</dt>
                    <dd className="tabular-nums" data-testid="quote-recurring">
                      {money2(recurring.annual)}
                    </dd>
                  </div>
                  {recurring.oneTime > 0 ? (
                    <div className="flex justify-between text-[12.5px]">
                      <dt>{labels.recurring.oneTime}</dt>
                      <dd className="tabular-nums">{money2(recurring.oneTime)}</dd>
                    </div>
                  ) : null}
                </>
              ) : null}
            </dl>
          ) : null}
        </Module>
      )}

      {s.hidden("terms") ? null : (
        <Module id="terms" editing={editing}>
          <h2 className={h2}>{s.get("label.terms", "Terms")}</h2>
          <ul className="mt-3 space-y-1.5">
            {terms.map((term) => (
              <li key={term}>{term}</li>
            ))}
          </ul>
        </Module>
      )}

      {s.hidden("payments") ? null : (
        <Module id="payments" editing={editing}>
          <h2 className={h2}>Payments</h2>
          <p className="mt-3">Customer must agree to the following payment terms: {paymentTerms}</p>
        </Module>
      )}

      {s.hidden("acceptance") ? null : (
        <Module id="acceptance" editing={editing}>
          <h2 className={h2}>Acceptance</h2>
          <p className="mt-3">
            This section is designated for the authorized representatives from both parties involved in this agreement. By signing below, the signatories confirm their acceptance of the terms and conditions outlined in this
            document.
          </p>
          <p className="mt-4">On behalf of the buyer,</p>
          <div className="mt-3 w-[340px] max-w-full rounded-[6px] border border-line-soft p-4">{acceptance ?? <AcceptanceCard quote={quote} />}</div>
        </Module>
      )}
    </article>
  );
}

/** The signer's card under Acceptance. In the editor and the preview the action is shown but cannot be used. */
export function AcceptanceCard({ quote, onSign }: { quote: Quote; onSign?: () => void }) {
  const { world } = useShell();
  const s = useQuoteSettings(quote);
  const contact = world.contacts.find((c) => c.id === quote.contactId);
  const method = s.get("accept");
  const accepted = quote.status === "Accepted";
  const action = "h-9 w-full rounded-[6px] bg-[#6a78d1] text-[14px] text-white hover:bg-[#5a68c1] disabled:cursor-default disabled:hover:bg-[#6a78d1]";
  return (
    <>
      {accepted ? (
        <div data-testid="buyer-accepted">
          {method === "esign" ? <p className="border-b border-ink pb-1 text-[26px] leading-tight [font-family:'Brush_Script_MT','Segoe_Script',cursive]">{contactName(contact)}</p> : null}
          <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-[#0b5b2b]">
            <Icon name="check" size={14} /> {method === "esign" ? "Signed" : "Accepted"} {date(quote.acceptedAt ?? quote.createdAt)}
          </p>
        </div>
      ) : method === "print" ? (
        <div>
          <p className="h-9 border-b border-ink" />
          <p className="mt-1 text-[12px] text-ink-muted">Signature</p>
          <p className="mt-4 h-6 border-b border-ink" />
          <p className="mt-1 text-[12px] text-ink-muted">Date</p>
        </div>
      ) : (
        <button type="button" className={action} disabled={!onSign} onClick={onSign} data-testid={onSign ? "buyer-accept" : undefined}>
          {method === "esign" ? "Sign now" : "Accept"}
        </button>
      )}
      <p className="mt-3 font-bold">{contactName(contact)}</p>
      <p>{contact?.email}</p>
    </>
  );
}
