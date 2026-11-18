"use client";

import { nowMs } from "@/lib/format";
import { Ext } from "@/shell/ext";
import { money } from "@/shell/format";
import { Icon } from "@/shell/icons";
import { A, Button, cx, Tag, type Tone } from "@/shell/ui";
import { useShell } from "@/store/store";
import type { InboxThread } from "@/verticals/types";

const CONFIDENCE: Record<string, { tone: Tone; label: string }> = {
  high: { tone: "green", label: "High" },
  medium: { tone: "amber", label: "Medium" },
  low: { tone: "red", label: "Low" },
};

/** What the parser read from an RFQ or PO email, with only the uncertain parts left for a person. */
export function ParsedRfqCard({ thread, onHoverField }: { thread: InboxThread; onHoverField: (field: string | null) => void }) {
  const { pack, world, dispatch } = useShell();
  const parsed = thread.parsed;
  if (!parsed) return null;
  const reviewing = world.ui["inbox.review"] === thread.id;
  const dealId = world.ed.deals[thread.id];
  const deal = world.deals.find((d) => d.id === dealId);
  const lines = parsed.lines.map((line) => {
    const sku = line.sku ?? world.ed.matches[`${thread.id}:${line.id}`] ?? null;
    return { line, sku, product: pack.products.find((p) => p.sku === sku) };
  });
  const unmatched = lines.filter((l) => !l.product).length;
  const total = lines.reduce((sum, l) => sum + (l.product ? l.product.price * l.line.qty : 0), 0);

  return (
    <Ext id="rfq-parser">
      <section className="rounded-[10px] border border-line bg-white" data-testid="parsed-card">
        <header className="px-4 pb-3 pt-3.5">
          <h3 className="flex items-center gap-2 text-[14px] font-semibold">
            <Icon name="file" size={16} /> Parsed {pack.terms.request ?? "request"}
          </h3>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[12.5px]">
            <Tag tone={unmatched > 0 ? "amber" : "green"}>{parsed.quality}</Tag>
          </p>
          <p className="mt-1.5 text-[12.5px] leading-snug text-ink-muted">{parsed.summary}</p>
          {!reviewing && !deal ? (
            <Button size="sm" variant="primary" className="mt-3" onClick={() => dispatch([{ t: "ui", k: "inbox.review", v: thread.id }, { t: "flag", k: "ed.reviewed" }])} data-testid="parsed-review">
              Review
            </Button>
          ) : null}
        </header>

        {reviewing || deal ? (
          <div className="hs-pop border-t border-line-soft">
            <dl className="px-4 py-3">
              {parsed.fields.map((field) => (
                <div key={field.id} className="flex items-center justify-between gap-3 rounded px-1 py-1 text-[13px] hover:bg-[#fff7e6]" onMouseEnter={() => onHoverField(field.id)} onMouseLeave={() => onHoverField(null)}>
                  <dt className="shrink-0 text-ink-muted">{field.label}</dt>
                  <dd className="flex min-w-0 items-center gap-2 text-right">
                    <span className="truncate font-semibold">{field.value}</span>
                    <Tag tone={CONFIDENCE[field.confidence].tone}>{CONFIDENCE[field.confidence].label}</Tag>
                  </dd>
                </div>
              ))}
            </dl>
            <div className="border-t border-line-soft px-4 py-3">
              <h4 className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">Line items</h4>
              <ul className="mt-2 space-y-2.5">
                {lines.map(({ line, product }) => (
                  <li key={line.id} className={cx("rounded-[8px] border px-3 py-2", product ? "border-line-soft" : "border-[#d39b00] bg-[#fffaf0]")} data-testid={`parsed-line-${line.id}`} onMouseEnter={() => onHoverField(line.id)} onMouseLeave={() => onHoverField(null)}>
                    <p className="text-[12px] italic text-ink-muted">&quot;{line.raw}&quot;</p>
                    {product ? (
                      <p className="mt-1 flex items-start justify-between gap-2 text-[13px]">
                        <span>
                          <span className="font-semibold">
                            {line.qty} × {product.name}
                          </span>
                          <span className="block font-mono text-[12px] text-ink-muted">{product.sku}</span>
                        </span>
                        <span className="shrink-0 text-right tabular-nums">
                          {money(line.qty * product.price)}
                          <span className="mt-0.5 block">
                            <Tag tone={line.sku ? CONFIDENCE[line.confidence].tone : "blue"}>{line.sku ? CONFIDENCE[line.confidence].label : "Confirmed by you"}</Tag>
                          </span>
                        </span>
                      </p>
                    ) : (
                      <div className="mt-1.5">
                        <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#754c00]">
                          <Icon name="warning" size={14} /> No exact match. Pick the right part:
                        </p>
                        <div className="mt-1.5 space-y-1.5">
                          {(line.suggestions ?? []).map((suggestion) => {
                            const candidate = pack.products.find((p) => p.sku === suggestion.sku);
                            return (
                              <button
                                key={suggestion.sku}
                                type="button"
                                onClick={() => dispatch({ t: "ed.match", threadId: thread.id, lineId: line.id, sku: suggestion.sku })}
                                data-testid={`parsed-suggest-${suggestion.sku}`}
                                className="block w-full rounded-[6px] border border-line bg-white px-2.5 py-1.5 text-left text-[12.5px] hover:border-ink"
                              >
                                <span className="font-semibold">{candidate?.name ?? suggestion.sku}</span>
                                <span className="block text-ink-muted">
                                  <span className="font-mono">{suggestion.sku}</span> · {suggestion.why}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-3 flex items-center justify-between text-[13px]">
                <span className="text-ink-muted">Deal amount at list price</span>
                <span className="font-semibold tabular-nums" data-testid="parsed-total">
                  {money(total)}
                </span>
              </p>
            </div>
            <footer className="border-t border-line-soft bg-[#fafafa] px-4 py-3">
              {deal ? (
                <p className="hs-pop flex flex-wrap items-center gap-2 text-[13px]" data-testid="parsed-created">
                  <Tag tone="green">Deal created</Tag>
                  <A to={`/deals/${deal.id}`} className="hs-link" data-testid="parsed-view-deal">
                    View deal
                  </A>
                </p>
              ) : (
                <>
                  <Button variant="primary" disabled={unmatched > 0} onClick={() => dispatch({ t: "ed.createDeal", threadId: thread.id, at: nowMs() })} data-testid="parsed-create-deal">
                    Create deal
                  </Button>
                  <p className="mt-1.5 text-[12px] text-ink-muted">{unmatched > 0 ? "Confirm the flagged part first." : "Creates the deal with line items, and associates the company and contact."}</p>
                </>
              )}
            </footer>
          </div>
        ) : null}
      </section>
    </Ext>
  );
}
