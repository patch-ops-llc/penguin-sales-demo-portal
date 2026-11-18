"use client";

import { nowMs } from "@/lib/format";
import { useState } from "react";
import { quoteTotals } from "@/store/quote-math";
import { useShell } from "@/store/store";
import { nextDealQuoteId, type Action } from "@/store/world";
import type { Deal, Quote } from "@/verticals/types";
import { date, money } from "../format";
import { Icon } from "../icons";
import { A, Button } from "../ui";
import { QuoteStatus } from "./status";

/** Quote templates a rep can start from. Each sets which sections a new quote shows. */
const TEMPLATES = [
  { id: "standard", name: "Standard quote", about: "Header, parties, summary, line items, terms, and acceptance.", show: [] as string[] },
  { id: "proposal", name: "Proposal with cover letter", about: "Adds a cover letter and an executive summary ahead of the pricing.", show: ["cover", "exec"] },
] as const;

/** The quote a deal's amount and line items follow: the latest accepted quote, or else the latest published one. */
export function primaryQuote(quotes: Quote[]): Quote | undefined {
  const latest = (list: Quote[], when: (q: Quote) => string | undefined) => [...list].sort((a, b) => (when(b) ?? "").localeCompare(when(a) ?? ""))[0];
  return latest(quotes.filter((q) => q.status === "Accepted"), (q) => q.acceptedAt) ?? latest(quotes.filter((q) => q.status === "Sent"), (q) => q.sentAt);
}

function CreateQuotePanel({ deal, onClose }: { deal: Deal; onClose: () => void }) {
  const { world, dispatch, navigate } = useShell();
  const [templateId, setTemplateId] = useState<string>(TEMPLATES[0].id);
  const template = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0];
  const create = () => {
    const id = nextDealQuoteId(world, deal.id);
    const shown: Action[] = template.show.map((module) => ({ t: "ui", k: `q.${id}.hide.${module}`, v: "0" }));
    dispatch([{ t: "quote.create", dealId: deal.id, at: nowMs() }, ...shown]);
    navigate(`/quotes/${id}`);
  };
  return (
    // Below the demo bar's layer, so the presenter can still step the demo with the panel open.
    <div className="fixed inset-0 z-50 flex justify-end bg-[rgba(20,20,20,0.4)]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside role="dialog" aria-label="Create quote" className="hs-slide-in mb-[60px] flex w-[480px] max-w-full flex-col bg-white shadow-[-8px_0_28px_rgba(20,20,20,0.2)]" data-testid="create-quote-panel">
        <header className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-[17px] font-semibold">Create quote</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-ink-muted hover:bg-[#f0f0f0]">
            <Icon name="close" size={18} />
          </button>
        </header>
        <div className="hs-scroll min-h-0 flex-1 overflow-y-auto px-6 py-5 text-[13.5px]">
          <label className="mb-1 block text-[12.5px] font-semibold" htmlFor="quote-template">
            Select a quote template
          </label>
          <select
            id="quote-template"
            className="h-10 w-full rounded-[8px] border border-[#5c5c5c] bg-white px-3 text-[13.5px] focus:border-ink focus:outline-none focus:ring-2 focus:ring-[#b6d9d7]"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            data-testid="quote-template"
          >
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <p className="mt-2 text-[12.5px] text-ink-muted">{template.about}</p>

          <dl className="mt-6 space-y-3 rounded-[8px] border border-line-soft bg-[#fafafa] px-4 py-3.5">
            <div>
              <dt className="text-[12px] text-ink-muted">Deal</dt>
              <dd className="font-semibold">{deal.name}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-ink-muted">Line items</dt>
              <dd>{deal.lineItems.length > 0 ? `${deal.lineItems.length} from the deal · ${money(deal.amount)}` : "None on the deal yet. Add them in the quote editor."}</dd>
            </div>
          </dl>
          <p className="mt-4 text-[12.5px] text-ink-muted">The deal owner becomes the quote owner. You are set as the quote sender.</p>
        </div>
        <footer className="flex items-center gap-2 border-t border-line px-6 py-3">
          <Button variant="primary" onClick={create} data-testid="create-quote-confirm">
            Create quote
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </footer>
      </aside>
    </div>
  );
}

/**
 * The Quotes card on a deal record: each quote with its status and expiry, the primary quote
 * tagged, and "+ Add" to start a new quote from a template.
 */
export function DealQuotesCard({ deal, quotes, children }: { deal: Deal; quotes: Quote[]; children?: React.ReactNode }) {
  const [adding, setAdding] = useState(false);
  const primary = primaryQuote(quotes);
  return (
    <section className="rounded-[10px] border border-line bg-white" data-testid="deal-quotes">
      <header className="flex min-h-11 items-center justify-between gap-3 px-4 pt-3">
        <h3 className="text-[14px] font-semibold">Quotes ({quotes.length})</h3>
        <button type="button" className="text-[13px] font-semibold text-link underline underline-offset-2 hover:text-ink" onClick={() => setAdding(true)} data-testid="deal-add-quote">
          + Add
        </button>
      </header>
      <div className="space-y-2.5 px-4 pb-4 pt-3">
        {quotes.length === 0 ? <p className="text-[12.5px] text-ink-muted">Track the sales documents associated with this record.</p> : null}
        {quotes.map((q) => (
          <div key={q.id} className="rounded-[8px] border border-line-soft px-3 py-2">
            <p className="flex items-center gap-2">
              <A to={`/quotes/${q.id}`} className="hs-link min-w-0 truncate text-[13.5px]" data-testid={`deal-quote-${q.id}`}>
                {q.number}: {q.title}
              </A>
              {q.id === primary?.id ? (
                <span className="shrink-0 rounded-full border border-[#0b7a5c] bg-[#e6f5ef] px-2 text-[11px] font-semibold leading-[18px] text-[#0b5b45]" data-testid="deal-quote-primary">
                  Primary
                </span>
              ) : null}
            </p>
            <QuoteStatus status={q.status} className="mt-1 text-[12.5px] text-ink" />
            <p className="mt-0.5 flex items-center justify-between gap-2 text-[12.5px] text-ink-muted">
              <span>Expiring: {date(q.validUntil)}</span>
              <span className="tabular-nums">{money(quoteTotals(q).total)}</span>
            </p>
          </div>
        ))}
        {children}
      </div>
      {adding ? <CreateQuotePanel deal={deal} onClose={() => setAdding(false)} /> : null}
    </section>
  );
}
