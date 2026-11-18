"use client";

import { nowMs } from "@/lib/format";
import { Ext } from "@/shell/ext";
import { date, money, num, relative } from "@/shell/format";
import { Icon } from "@/shell/icons";
import { A, Button, cx, LineTabs, statusTone, Tag } from "@/shell/ui";
import { useShell } from "@/store/store";
import type { Company } from "@/verticals/types";

type Tab = "orders" | "balance" | "stock";

/** Orders, invoices, and stock for the company, as read from the back-office system when the record opens. */
export function ErpCard({ company }: { company: Company }) {
  const { pack, world, dispatch, navigate } = useShell();
  const config = pack.demos.backOffice;
  const label = config.systemLabel;
  const tab = (world.ui["erp.tab"] as Tab) ?? "orders";
  const openOrder = world.ui["erp.order"];
  const picked = world.bo.picked;
  const quote = world.quotes.find((q) => q.id === world.bo.quoteId);
  const overdue = config.invoices.filter((i) => i.status === "Overdue").reduce((sum, i) => sum + i.balance, 0);
  const open = config.invoices.reduce((sum, i) => sum + i.balance, 0);

  const setTab = (id: Tab) => dispatch([{ t: "ui", k: "erp.tab", v: id }, ...(id === "balance" ? [{ t: "flag" as const, k: "bo.balance" }] : [])]);

  return (
    <Ext id="erp-card">
      <section className="rounded-[10px] border border-line bg-white" data-testid="erp-card">
        <header className="flex items-center justify-between px-4 pt-3.5">
          <h3 className="flex items-center gap-2 text-[14px] font-semibold">
            <Icon name="layers" size={16} /> {label}: {company.name}
          </h3>
          <p className="mr-9 flex items-center gap-1.5 text-[12px] text-ink-muted">
            <span className="h-2 w-2 rounded-full bg-[#1a9e4b]" /> Live from the {label}, read {relative(config.syncedAt)}
          </p>
        </header>
        <LineTabs
          className="mt-2 px-4"
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "orders", label: `Orders (${config.orders.length})`, testId: "erp-tab-orders" },
            { id: "balance", label: "Balance", testId: "erp-tab-balance" },
            { id: "stock", label: "Stock and pricing", testId: "erp-tab-stock" },
          ]}
        />

        {tab === "orders" ? (
          <table className="w-full text-[13px]" data-testid="erp-orders">
            <thead>
              <tr className="border-b border-line-soft text-left text-[11.5px] uppercase tracking-wide text-ink-muted">
                <th className="w-8 py-2 pl-4" />
                <th className="py-2 font-semibold">Order</th>
                <th className="py-2 font-semibold">Date</th>
                <th className="py-2 font-semibold">Customer PO</th>
                <th className="py-2 font-semibold">Status</th>
                <th className="py-2 pr-4 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {config.orders.map((order) => {
                const expanded = openOrder === order.id;
                return [
                  <tr key={order.id} className="cursor-pointer border-b border-line-soft hover:bg-[#f7f7f7]" data-testid={`erp-order-${order.id}`} onClick={() => dispatch([{ t: "ui", k: "erp.order", v: expanded ? "" : order.id }, { t: "flag", k: "bo.order" }])}>
                    <td className="py-2 pl-4">
                      <Icon name="chevronRight" size={14} className={cx("transition-transform", expanded && "rotate-90")} />
                    </td>
                    <td className="py-2 font-semibold">{order.number}</td>
                    <td className="py-2">{date(order.date)}</td>
                    <td className="py-2 font-mono text-[12.5px]">{order.po}</td>
                    <td className="py-2">
                      <Tag tone={statusTone(order.status)}>{order.status}</Tag>
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">{money(order.total)}</td>
                  </tr>,
                  expanded ? (
                    <tr key={`${order.id}-lines`} className="border-b border-line-soft bg-[#fafafa]" data-testid="erp-order-lines">
                      <td />
                      <td colSpan={5} className="py-2 pr-4">
                        <table className="w-full text-[12.5px]">
                          <tbody>
                            {order.lines.map((line) => (
                              <tr key={line.sku}>
                                <td className="py-1 font-mono">{line.sku}</td>
                                <td className="py-1">{line.name}</td>
                                <td className="py-1 text-right tabular-nums">{line.qty} ×</td>
                                <td className="py-1 text-right tabular-nums">{money(line.unitPrice)}</td>
                                <td className="py-1 text-right font-semibold tabular-nums">{money(line.qty * line.unitPrice)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  ) : null,
                ];
              })}
            </tbody>
          </table>
        ) : null}

        {tab === "balance" ? (
          <div className="px-4 py-3" data-testid="erp-balance">
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Open balance", value: money(open), tone: "" },
                { label: "Overdue", value: money(overdue), tone: overdue > 0 ? "text-[#99201a]" : "" },
                { label: "Credit limit", value: company.erp ? money(company.erp.creditLimit) : "--", tone: "" },
                { label: "Credit status", value: company.erp?.creditStatus ?? "--", tone: "" },
              ].map((tile) => (
                <div key={tile.label} className="rounded-[8px] border border-line-soft bg-[#fafafa] px-3 py-2.5">
                  <p className="text-[11.5px] text-ink-muted">{tile.label}</p>
                  <p className={cx("mt-0.5 text-[16px] font-semibold tabular-nums", tile.tone)}>{tile.value}</p>
                </div>
              ))}
            </div>
            <table className="mt-3 w-full text-[13px]">
              <thead>
                <tr className="border-b border-line-soft text-left text-[11.5px] uppercase tracking-wide text-ink-muted">
                  <th className="py-2 font-semibold">Invoice</th>
                  <th className="py-2 font-semibold">Issued</th>
                  <th className="py-2 font-semibold">Due</th>
                  <th className="py-2 font-semibold">Status</th>
                  <th className="py-2 text-right font-semibold">Amount</th>
                  <th className="py-2 text-right font-semibold">Balance</th>
                </tr>
              </thead>
              <tbody>
                {config.invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-line-soft last:border-b-0">
                    <td className="py-2 font-semibold">{invoice.number}</td>
                    <td className="py-2">{date(invoice.date)}</td>
                    <td className="py-2">{date(invoice.dueDate)}</td>
                    <td className="py-2">
                      <Tag tone={statusTone(invoice.status)}>{invoice.status}</Tag>
                    </td>
                    <td className="py-2 text-right tabular-nums">{money(invoice.amount)}</td>
                    <td className="py-2 text-right font-semibold tabular-nums">{money(invoice.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {tab === "stock" ? (
          <div data-testid="erp-stock">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-line-soft text-left text-[11.5px] uppercase tracking-wide text-ink-muted">
                  <th className="w-9 py-2 pl-4" />
                  <th className="py-2 font-semibold">Item</th>
                  <th className="py-2 text-right font-semibold">On hand</th>
                  <th className="py-2 text-right font-semibold">Lead time</th>
                  <th className="py-2 text-right font-semibold">Contract price</th>
                  <th className="py-2 text-right font-semibold">List price</th>
                  <th className="py-2 pr-4 text-right font-semibold">Last ordered</th>
                </tr>
              </thead>
              <tbody>
                {config.stock.map((item) => {
                  const checked = picked.includes(item.sku);
                  return (
                    <tr key={item.sku} className={cx("border-b border-line-soft", checked && "bg-[#f1f7f7]")}>
                      <td className="py-2 pl-4">
                        <input type="checkbox" checked={checked} disabled={Boolean(quote)} onChange={() => dispatch({ t: "bo.pick", sku: item.sku })} aria-label={`Select ${item.name}`} data-testid={`erp-pick-${item.sku}`} className="h-4 w-4 accent-[#141414]" />
                      </td>
                      <td className="py-2">
                        <p className="font-semibold">{item.name}</p>
                        <p className="font-mono text-[12px] text-ink-muted">{item.sku}</p>
                      </td>
                      <td className="py-2 text-right tabular-nums">{item.onHand > 0 ? num(item.onHand) : <Tag tone="amber">Built to order</Tag>}</td>
                      <td className="py-2 text-right tabular-nums">{item.leadDays} days</td>
                      <td className="py-2 text-right font-semibold tabular-nums">{money(item.contractPrice)}</td>
                      <td className="py-2 text-right tabular-nums text-ink-muted">{money(item.listPrice)}</td>
                      <td className="py-2 pr-4 text-right">{date(item.lastOrdered)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex items-center gap-3 px-4 py-3">
              {quote ? (
                <>
                  <Tag tone="green">Quote {quote.number} created</Tag>
                  <A to={`/quotes/${quote.id}`} className="hs-link text-[13.5px]" data-testid="erp-open-quote">
                    Open quote
                  </A>
                </>
              ) : (
                <>
                  <Button
                    variant="primary"
                    disabled={picked.length === 0}
                    data-testid="erp-add-to-quote"
                    onClick={() => {
                      dispatch({ t: "bo.addToQuote", at: nowMs() });
                      navigate("/quotes/q-reorder");
                    }}
                  >
                    Add to quote{picked.length > 0 ? ` (${picked.length})` : ""}
                  </Button>
                  <p className="text-[12.5px] text-ink-muted">Starts a quote at this customer&apos;s contract price and usual quantity.</p>
                </>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </Ext>
  );
}
