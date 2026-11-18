"use client";

import { nowMs } from "@/lib/format";
import { Ext } from "@/shell/ext";
import { money } from "@/shell/format";
import { Icon } from "@/shell/icons";
import { A, Button, cx, Tag } from "@/shell/ui";
import { subtotal } from "@/store/quote-math";
import { useShell } from "@/store/store";
import { activeNotes, disabledOptions, isComplete } from "./rules";

function Choice({ selected, disabled, reason, onClick, children, hint, testId }: { selected: boolean; disabled?: boolean; reason?: string; onClick: () => void; children: React.ReactNode; hint?: string; testId: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={reason}
      aria-pressed={selected}
      data-testid={testId}
      className={cx(
        "min-w-[104px] rounded-[8px] border px-3 py-2 text-left text-[13.5px] transition-colors",
        selected ? "border-ink bg-ink text-white" : disabled ? "border-dashed border-line bg-[#f7f7f7] text-[#9a9a9a]" : "border-line bg-white hover:border-ink",
      )}
    >
      <span className="block font-semibold">{children}</span>
      {hint ? <span className={cx("block text-[11.5px]", selected ? "text-white/75" : "text-ink-muted", disabled && "text-[#9a9a9a]")}>{hint}</span> : null}
    </button>
  );
}

/** Guided selling on the deal: a few answers in, the right line items out. The rules live in the vertical pack. */
export function GuidedSellingPanel() {
  const { pack, world, dispatch, navigate } = useShell();
  const config = pack.demos.guidedQuote;
  const { sel, quantity, needBy, lines, quoteId } = world.gq;
  const complete = isComplete(config, sel, quantity, needBy);
  const quote = world.quotes.find((q) => q.id === quoteId);
  const shown = quote ? quote.lineItems : lines;
  const maxLead = shown.reduce((max, l) => Math.max(max, l.leadDays), 0);
  const need = config.needBy.options.find((o) => o.id === needBy);
  const notes = activeNotes(config, sel);
  const locked = Boolean(quote);

  return (
    <Ext id="guided-selling">
      <section className="rounded-[10px] border border-line bg-white" data-testid="guided-selling">
        <header className="border-b border-line-soft px-5 py-4">
          <h3 className="text-[15px] font-semibold">Guided quote</h3>
          <p className="mt-0.5 text-[13px] text-ink-muted">{config.intro}</p>
        </header>

        <div className="space-y-5 px-5 py-4">
          {config.fields.map((field) => {
            const off = disabledOptions(config, sel, field.id);
            const reasons = [...new Set(Object.values(off))];
            return (
              <fieldset key={field.id} disabled={locked}>
                <legend className="text-[13px] font-semibold">{field.label}</legend>
                {field.help ? <p className="text-[12px] text-ink-muted">{field.help}</p> : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  {field.options.map((option) => (
                    <Choice key={option.id} testId={`gq-${field.id}-${option.id}`} selected={sel[field.id] === option.id} disabled={Boolean(off[option.id]) || locked} reason={off[option.id]} hint={option.hint} onClick={() => dispatch({ t: "gq.select", field: field.id, value: option.id })}>
                      {option.label}
                    </Choice>
                  ))}
                </div>
                {reasons.map((reason) => (
                  <p key={reason} className="mt-1.5 flex items-center gap-1.5 text-[12px] text-ink-muted" data-testid="gq-constraint">
                    <Icon name="info" size={13} /> {reason}.
                  </p>
                ))}
              </fieldset>
            );
          })}

          <div className="grid grid-cols-2 gap-5">
            <fieldset disabled={locked}>
              <legend className="text-[13px] font-semibold">{config.quantity.label}</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {config.quantity.options.map((n) => (
                  <Choice key={n} testId={`gq-quantity-${n}`} selected={quantity === n} disabled={locked} onClick={() => dispatch({ t: "gq.quantity", value: n })}>
                    {n}
                  </Choice>
                ))}
              </div>
            </fieldset>
            <fieldset disabled={locked}>
              <legend className="text-[13px] font-semibold">{config.needBy.label}</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {config.needBy.options.map((o) => (
                  <Choice key={o.id} testId={`gq-needby-${o.id}`} selected={needBy === o.id} disabled={locked} onClick={() => dispatch({ t: "gq.needBy", value: o.id })}>
                    {o.label}
                  </Choice>
                ))}
              </div>
            </fieldset>
          </div>

          {!locked ? (
            <div className="flex items-center gap-3">
              <Button variant="primary" disabled={!complete} onClick={() => dispatch({ t: "gq.generate" })} data-testid="gq-generate">
                Generate line items
              </Button>
              {!complete ? <p className="text-[12.5px] text-ink-muted">Answer every discovery question to continue.</p> : null}
            </div>
          ) : null}
        </div>

        {shown.length > 0 ? (
          <div className="hs-pop border-t border-line-soft px-5 py-4" data-testid="gq-lines">
            <div className="flex items-center justify-between">
              <h4 className="text-[13.5px] font-semibold">Rate card</h4>
              <p className="text-[12px] text-ink-muted">Prices and lead times from the {pack.terms.backOffice}</p>
            </div>
            <table className="mt-2 w-full text-[13px]">
              <thead>
                <tr className="border-b border-line-soft text-left text-[11.5px] uppercase tracking-wide text-ink-muted">
                  <th className="py-1.5 font-semibold">Item</th>
                  <th className="py-1.5 text-right font-semibold">Qty</th>
                  <th className="py-1.5 text-right font-semibold">Unit price</th>
                  <th className="py-1.5 text-right font-semibold">Quoted lead time</th>
                  <th className="py-1.5 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((l) => (
                  <tr key={l.sku} className="border-b border-line-soft align-top">
                    <td className="py-2 pr-3">
                      <p className="font-semibold">{l.name}</p>
                      <p className="text-[12px] text-ink-muted">
                        <span className="font-mono">{l.sku}</span>
                        {l.description ? ` · ${l.description}` : ""}
                      </p>
                    </td>
                    <td className="py-2 text-right tabular-nums">{l.qty}</td>
                    <td className="py-2 text-right tabular-nums">{money(l.unitPrice)}</td>
                    <td className="py-2 text-right tabular-nums">{l.leadDays} days</td>
                    <td className="py-2 text-right font-semibold tabular-nums">{money(l.qty * l.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 flex items-start justify-between gap-6">
              <div className="space-y-1.5">
                {notes.map((note) => (
                  <p key={note} className="flex gap-1.5 text-[12.5px] text-ink-muted">
                    <Icon name="info" size={14} className="mt-0.5 shrink-0" /> {note}
                  </p>
                ))}
                {need ? (
                  <p className="flex items-center gap-1.5 text-[12.5px]" data-testid="gq-lead-check">
                    <Tag tone={maxLead <= need.days ? "green" : "amber"}>{maxLead <= need.days ? "On time" : "At risk"}</Tag>
                    Ships in {maxLead} days. Needed {need.label.toLowerCase()} ({need.days} days).
                  </p>
                ) : null}
              </div>
              <p className="shrink-0 text-right text-[13px]">
                <span className="text-ink-muted">Subtotal</span>
                <span className="ml-3 text-[17px] font-semibold tabular-nums" data-testid="gq-subtotal">
                  {money(subtotal(shown))}
                </span>
              </p>
            </div>
            <div className="mt-4 flex items-center gap-3">
              {quote ? (
                <>
                  <Tag tone="green">Quote {quote.number} created</Tag>
                  <A to={`/quotes/${quote.id}`} className="hs-link text-[13.5px]" data-testid="gq-open-quote">
                    Open quote
                  </A>
                </>
              ) : (
                <Button
                  variant="primary"
                  data-testid="gq-create-quote"
                  onClick={() => {
                    dispatch({ t: "gq.createQuote", at: nowMs() });
                    navigate("/quotes/q-guided");
                  }}
                >
                  Create quote
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </Ext>
  );
}
