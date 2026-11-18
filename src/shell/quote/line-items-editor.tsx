"use client";

import { useMemo, useState } from "react";
import { approvalReasons, floorPrice, lineMarginPct, lineNet, netUnitPrice, quoteTotals, reasonList, unitDiscountPct } from "@/store/quote-math";
import { useShell } from "@/store/store";
import { labelsOf } from "@/verticals/labels";
import type { LineItem, Quote } from "@/verticals/types";
import { Ext } from "../ext";
import { money2, pct } from "../format";
import { Icon } from "../icons";
import { Button, cx, Tag } from "../ui";
import { CostFeed } from "./approvals";

type Row = { price: string; qty: string; discount: string; unit: "%" | "$" };

const input = "h-9 rounded-[4px] border border-[#7c98b6] bg-white px-2.5 text-[13.5px] tabular-nums focus:border-ink focus:outline-none";
const num = (text: string) => Number(text.replace(/[^0-9.]/g, "")) || 0;
const trim = (value: number) => String(Math.round(value * 100) / 100);

function Leader({ label, value, strong, testId }: { label: React.ReactNode; value: string; strong?: boolean; testId?: string }) {
  return (
    <div className={cx("flex items-baseline gap-2 py-2", strong && "text-[15px] font-semibold")}>
      <dt className={cx(!strong && "font-semibold")}>{label}</dt>
      <span className="min-w-6 flex-1 border-b border-dotted border-[#7c98b6]" aria-hidden="true" />
      <dd className="tabular-nums" data-testid={testId}>
        {value}
      </dd>
    </div>
  );
}

/**
 * HubSpot's line item editor, opened from the quote with "Edit all line items": unit price,
 * quantity and unit discount per line, a summary, and Save. Nothing changes on the quote until Save.
 */
export function LineItemsEditor({ quote, onClose }: { quote: Quote; onClose: () => void }) {
  const { pack, dispatch } = useShell();
  const rule = pack.demos.discountApproval;
  const [rows, setRows] = useState<Record<string, Row>>(() =>
    Object.fromEntries(quote.lineItems.map((l) => [l.sku, { price: l.unitPrice.toFixed(2), qty: String(l.qty), discount: trim(unitDiscountPct(quote, l)), unit: "%" as const }])),
  );
  const edit = (sku: string, patch: Partial<Row>) => setRows((r) => ({ ...r, [sku]: { ...r[sku], ...patch } }));

  const draft = useMemo(() => {
    const lineItems: LineItem[] = quote.lineItems.map((l) => {
      const row = rows[l.sku];
      const unitPrice = num(row.price);
      const discountPct = Math.min(60, row.unit === "%" ? num(row.discount) : unitPrice > 0 ? (num(row.discount) / unitPrice) * 100 : 0);
      return { ...l, unitPrice, qty: Math.max(1, Math.round(num(row.qty)) || 1), discountPct: Math.round(discountPct * 100) / 100 };
    });
    return { lineItems, discountPct: 0, termsId: quote.termsId };
  }, [quote.lineItems, quote.termsId, rows]);
  const totals = quoteTotals(draft);
  const reasons = approvalReasons(draft, rule);

  const save = () => {
    dispatch({ t: "quote.editLines", id: quote.id, lines: Object.fromEntries(draft.lineItems.map((l) => [l.sku, { qty: l.qty, unitPrice: l.unitPrice, discountPct: l.discountPct }])) });
    onClose();
  };

  const th = "whitespace-nowrap px-4 py-3 text-left text-[12.5px] font-normal text-ink";
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f5f8fa]" data-testid="line-items-editor">
      <div className="hs-scroll min-h-0 flex-1 overflow-y-auto px-8 py-6">
        <h2 className="text-[18px] font-semibold">Review line items</h2>
        <p className="mt-3 flex items-center gap-2 text-[13px]">
          Currency:
          <span className="inline-flex h-8 items-center gap-1.5 rounded-[4px] bg-[#eaf0f6] px-3 text-ink-muted">
            US Dollar ({pack.portal.currency}) $ <Icon name="chevronDown" size={13} />
          </span>
        </p>

        <div className="mt-4 overflow-x-auto rounded-[8px] border border-line bg-white">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="border-b border-line">
                <th className={cx(th, "border-r-2 border-line")}>Name</th>
                <th className={th}>Unit price</th>
                <th className={th}>Quantity</th>
                <th className={th}>Unit discount</th>
                <th className={cx(th, "text-right")}>Net price</th>
                <th className={cx(th, "text-right")}>Unit cost</th>
                <th className={cx(th, "text-right")}>Margin</th>
                <th className={cx(th, "pr-10")}>
                  <Ext id="floor-price-rule" className="inline-block pr-9" pinClass="!right-0 !top-[-7px]">
                    Floor price
                  </Ext>
                </th>
              </tr>
            </thead>
            <tbody>
              {draft.lineItems.map((l) => {
                const row = rows[l.sku];
                const floor = floorPrice(l, rule);
                const below = (l.discountPct ?? 0) > 0 && l.unitPrice * (1 - (l.discountPct ?? 0) / 100) < floor;
                return (
                  <tr key={l.sku} className="border-b border-line-soft last:border-b-0" data-testid={`line-${l.sku}`}>
                    <td className="border-r-2 border-line px-3 py-3">
                      <span className="flex items-center gap-1.5">
                        <Icon name="drag" size={15} className="shrink-0 text-ink-muted" />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-link">{l.name}</span>
                          <span className="block text-[12px] text-ink-muted">{l.sku}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="relative inline-block">
                        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted">$</span>
                        <input className={cx(input, "w-[104px] pl-5")} inputMode="decimal" aria-label={`Unit price, ${l.name}`} value={row.price} onChange={(e) => edit(l.sku, { price: e.target.value.replace(/[^0-9.]/g, "").slice(0, 10) })} />
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <input className={cx(input, "w-[72px]")} type="number" min={1} aria-label={`Quantity, ${l.name}`} value={row.qty} onChange={(e) => edit(l.sku, { qty: e.target.value.replace(/[^0-9]/g, "").slice(0, 5) })} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex">
                        <input
                          className={cx(input, "w-[72px] rounded-r-none border-r-0 text-right")}
                          inputMode="decimal"
                          aria-label={`Unit discount, ${l.name}`}
                          data-testid={`line-discount-${l.sku}`}
                          value={row.discount}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => edit(l.sku, { discount: e.target.value.replace(/[^0-9.]/g, "").slice(0, 8) })}
                        />
                        <select
                          className={cx(input, "rounded-l-none bg-[#f5f8fa] px-1.5")}
                          aria-label={`Unit discount type, ${l.name}`}
                          value={row.unit}
                          onChange={(e) => {
                            const unit = e.target.value as Row["unit"];
                            if (unit === row.unit) return;
                            // Keep the same discount when the unit flips between percent and currency.
                            const amount = unit === "$" ? (l.unitPrice * num(row.discount)) / 100 : l.unitPrice > 0 ? (num(row.discount) / l.unitPrice) * 100 : 0;
                            edit(l.sku, { unit, discount: trim(amount) });
                          }}
                        >
                          <option value="%">%</option>
                          <option value="$">{pack.portal.currency}</option>
                        </select>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{money2(lineNet(draft, l))}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{money2(l.unitCost)}</td>
                    <td className={cx("px-4 py-3 text-right tabular-nums", below && "font-semibold text-[#99201a]")}>{pct(lineMarginPct(draft, l))}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                      {money2(floor)}
                      {below ? (
                        <Tag tone="red" className="ml-2" >
                          <span data-testid={`below-floor-${l.sku}`}>Below floor price</span>
                        </Tag>
                      ) : null}
                      {below ? <span className="block text-[12px] text-ink-muted">Net unit price {money2(netUnitPrice(draft, l))}</span> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <CostFeed className="mt-3 max-w-[560px]" />

        {reasons.length > 0 ? (
          <p className="hs-pop mt-4 flex items-center gap-2 rounded-[4px] border border-[#f5c26b] bg-[#fef8f0] px-4 py-2.5 text-[13.5px]" data-testid="line-editor-approval">
            <Icon name="warning" size={16} className="shrink-0 text-[#b36b00]" />
            <span>
              <span className="font-semibold">Approval required:</span> {reasonList(reasons)}.
            </span>
          </p>
        ) : null}

        <section className="mt-5 rounded-[8px] border border-line bg-white">
          <h3 className="border-b border-line-soft px-5 py-3.5 text-[15px] font-semibold">Summary</h3>
          <dl className="px-5 py-2 text-[13.5px]">
            <Leader label="Subtotal" value={money2(totals.subtotal)} />
            <Leader label="Total discount" value={totals.discount > 0 ? `${pct(totals.discountPct)} (-${money2(totals.discount)})` : money2(0)} testId="line-editor-discount" />
            <Leader label={labelsOf(pack).pack.quoteTotal} value={money2(totals.total)} strong testId="line-editor-total" />
          </dl>
        </section>
      </div>
      <footer className="flex shrink-0 items-center gap-2 border-t border-line bg-white px-8 py-3">
        <Button variant="primary" onClick={save} data-testid="line-editor-save">
          Save
        </Button>
        <Button onClick={onClose} data-testid="line-editor-cancel">
          Cancel
        </Button>
      </footer>
    </div>
  );
}
