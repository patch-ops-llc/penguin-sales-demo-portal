"use client";

import { useMemo, useState } from "react";
import { approvalReasons, floorPrice, lineMarginPct, lineNet, netUnitPrice, quoteTotals, reasonList, unitDiscountPct } from "@/store/quote-math";
import { useShell } from "@/store/store";
import { labelsOf, timingOf } from "@/verticals/labels";
import type { LineItem, Product, Quote } from "@/verticals/types";
import { Ext } from "../ext";
import { money2, pct } from "../format";
import { Icon } from "../icons";
import { Button, cx, Menu, MenuItem, Tag } from "../ui";
import { CostFeed } from "./approvals";

/** One line in the editor: the line as it was added, and what the rep has typed over it. */
type Row = { key: number; line: LineItem; price: string; qty: string; discount: string; unit: "%" | "$" };
type Details = { name: string; sku: string; description: string; price: string; qty: string; cost: string };
type Panel = { kind: "library" } | { kind: "custom" } | { kind: "columns" } | { kind: "edit"; key: number } | null;

const input = "h-9 rounded-[8px] border border-[#5c5c5c] bg-white px-2.5 text-[13.5px] tabular-nums focus:border-ink focus:outline-none focus:ring-2 focus:ring-[#b6d9d7]";
const pill = "inline-flex h-7 items-center gap-1 whitespace-nowrap rounded-full border border-[#5c5c5c] bg-white px-3 text-[12px] font-medium hover:bg-[#f0f0f0]";

/** The columns a rep can show or hide with "Edit columns". Name, unit price, quantity, unit discount and net price always show. */
const COLUMNS = [{ id: "description" }, { id: "timing" }, { id: "cost" }, { id: "margin" }] as const;
type ColumnId = (typeof COLUMNS)[number]["id"];
const DEFAULT_COLUMNS = "cost,margin";
const COLUMNS_KEY = "lineColumns";
const num = (text: string) => Number(text.replace(/[^0-9.]/g, "")) || 0;
const trim = (value: number) => String(Math.round(value * 100) / 100);
const decimal = (text: string) => text.replace(/[^0-9.]/g, "").slice(0, 10);
const whole = (text: string) => Math.max(1, Math.round(num(text)) || 1);
const EMPTY: Details = { name: "", sku: "", description: "", price: "", qty: "1", cost: "" };

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

function SidePanel({ title, onClose, footer, testId, width = 460, top, children }: { title: string; onClose: () => void; footer: React.ReactNode; testId: string; width?: number; top?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-20 flex justify-end bg-[rgba(20,20,20,0.4)]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside role="dialog" aria-label={title} className="hs-slide-in flex max-w-[92%] flex-col bg-white shadow-[-8px_0_28px_rgba(20,20,20,0.2)]" style={{ width }} data-testid={testId}>
        <header className="flex items-center justify-between border-b border-line px-6 py-4">
          <h3 className="text-[17px] font-semibold">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-ink-muted hover:bg-[#f0f0f0]">
            <Icon name="close" size={18} />
          </button>
        </header>
        {top ? <div className="shrink-0 px-6 pt-4">{top}</div> : null}
        <div className="hs-scroll min-h-0 flex-1 overflow-y-auto px-6 py-4">{children}</div>
        <footer className="flex items-center gap-2 border-t border-line px-6 py-3">{footer}</footer>
      </aside>
    </div>
  );
}

type SortKey = "name" | "sku" | "price";

/** "Select from product library": filter and search the products, tick the ones to add. */
function LibraryPanel({ onAdd, onClose }: { onAdd: (products: Product[]) => void; onClose: () => void }) {
  const { pack } = useShell();
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState("");
  const [tab, setTab] = useState<"all" | "views">("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 } | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const folders = useMemo(() => [...new Set(pack.products.map((p) => p.family))], [pack.products]);
  const needle = query.trim().toLowerCase();
  const shown = pack.products.filter((p) => (!folder || p.family === folder) && (!needle || `${p.name} ${p.sku} ${p.family}`.toLowerCase().includes(needle)));
  if (sort) shown.sort((a, b) => sort.dir * (sort.key === "price" ? a.price - b.price : a[sort.key].localeCompare(b[sort.key])));
  const heading = (key: SortKey, label: string, className?: string) => (
    <th className={cx("px-3 py-3 text-left font-normal", className)} aria-sort={sort?.key === key ? (sort.dir === 1 ? "ascending" : "descending") : undefined}>
      <button type="button" className="flex w-full items-center justify-between gap-3" onClick={() => setSort((current) => (current?.key === key ? (current.dir === 1 ? { key, dir: -1 } : null) : { key, dir: 1 }))} data-testid={`library-sort-${key}`}>
        {label}
        <Icon name="sort" size={15} className={sort?.key === key ? "text-ink" : "text-ink-muted"} />
      </button>
    </th>
  );
  return (
    <SidePanel
      title="Select from product library"
      onClose={onClose}
      testId="library-panel"
      width={840}
      top={
        <>
          <Menu
            width={260}
            button={({ toggle }) => (
              <button type="button" onClick={toggle} className="inline-flex items-center gap-1 text-[13.5px] font-semibold hover:text-link" data-testid="library-folder">
                {folder || "Folder"} <Icon name="chevronDown" size={13} />
              </button>
            )}
          >
            {(close) => (
              <>
                {["", ...folders].map((name) => (
                  <MenuItem
                    key={name}
                    active={folder === name}
                    onClick={() => {
                      close();
                      setFolder(name);
                    }}
                  >
                    {name || "All folders"}
                  </MenuItem>
                ))}
              </>
            )}
          </Menu>
          <label className="relative mt-3 block">
            <span className="sr-only">Search the product library</span>
            <input
              className="h-10 w-full rounded-full border border-[#5c5c5c] bg-white pl-4 pr-10 text-[13.5px] focus:border-ink focus:outline-none focus:ring-2 focus:ring-[#b6d9d7]"
              placeholder="Search the product library by name, description, SKU, or folder"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              data-testid="library-search"
              autoFocus
            />
            <Icon name="search" size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted" />
          </label>
          <div role="tablist" className="mt-3 grid grid-cols-2 text-[13.5px]">
            {(
              [
                ["all", "All active products"],
                ["views", "Views"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={cx("h-11 border border-line", tab === id ? "rounded-t-[8px] border-b-transparent bg-white font-semibold" : "border-x-transparent border-t-transparent bg-[#f5f5f5] hover:bg-[#ececec]")}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      }
      footer={
        <>
          <Button variant="primary" disabled={picked.length === 0} onClick={() => onAdd(pack.products.filter((p) => picked.includes(p.sku)))} data-testid="library-add">
            Add{picked.length > 0 ? ` (${picked.length})` : ""}
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </>
      }
    >
      {tab === "views" ? (
        <p className="py-10 text-center text-[13.5px] text-ink-muted">No saved views yet. Views saved in the product library show here.</p>
      ) : (
        <table className="-mt-4 w-full text-[13.5px]">
          <thead>
            <tr className="border-b border-ink">
              <th className="w-12 px-3 py-3" />
              {heading("name", "Name")}
              {heading("sku", "SKU", "w-[190px]")}
              {heading("price", "Unit price", "w-[150px]")}
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => {
              const checked = picked.includes(p.sku);
              const id = `library-${p.sku}`;
              return (
                <tr key={p.sku} className={cx("border-b border-line-soft hover:bg-[#f5f5f5]", checked && "bg-[#f1f7f7]")}>
                  <td className="px-3 py-3.5 text-center">
                    <input id={id} type="checkbox" className="h-4 w-4 align-middle" checked={checked} onChange={() => setPicked((list) => (checked ? list.filter((sku) => sku !== p.sku) : [...list, p.sku]))} data-testid={`library-item-${p.sku}`} />
                  </td>
                  <td className="px-3 py-3.5">
                    <label htmlFor={id} className="cursor-pointer font-semibold text-link">
                      {p.name}
                    </label>
                  </td>
                  <td className="px-3 py-3.5">{p.sku}</td>
                  <td className="px-3 py-3.5 tabular-nums">{money2(p.price)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {tab === "all" && shown.length === 0 ? <p className="py-8 text-center text-[13px] text-ink-muted">No products match your search.</p> : null}
    </SidePanel>
  );
}

/** "Edit columns": the columns this user sees in the line item table. */
function ColumnsDialog({ shown, labels, onApply, onClose }: { shown: ColumnId[]; labels: Record<ColumnId, string>; onApply: (ids: ColumnId[]) => void; onClose: () => void }) {
  const [ids, setIds] = useState(shown);
  const fixed = ["Name", "Unit price", "Quantity", "Unit discount", "Net price"];
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[rgba(20,20,20,0.4)] p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-label="Choose which columns you see" className="hs-pop flex max-h-full w-[640px] max-w-full flex-col overflow-hidden rounded-[12px] bg-white shadow-[0_20px_60px_rgba(20,20,20,0.35)]" data-testid="columns-dialog">
        <header className="flex items-center justify-between border-b border-line px-6 py-4">
          <h3 className="text-[17px] font-semibold">Choose which columns you see</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-ink-muted hover:bg-[#f0f0f0]">
            <Icon name="close" size={18} />
          </button>
        </header>
        <div className="grid min-h-0 grid-cols-2 gap-6 overflow-y-auto px-6 py-5 text-[13.5px]">
          <div>
            <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Line item properties</p>
            <ul>
              {COLUMNS.map((c) => (
                <li key={c.id}>
                  <label className="flex cursor-pointer items-center gap-2.5 py-1.5">
                    <input type="checkbox" className="h-4 w-4" checked={ids.includes(c.id)} onChange={() => setIds((list) => (list.includes(c.id) ? list.filter((id) => id !== c.id) : [...list, c.id]))} data-testid={`column-${c.id}`} />
                    {labels[c.id]}
                  </label>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Selected columns ({fixed.length + ids.length})</p>
            <ul className="space-y-1.5">
              {fixed.map((name) => (
                <li key={name} className="flex h-9 items-center gap-2 rounded-[4px] border border-line bg-[#f5f5f5] px-2.5 text-ink-muted">
                  <Icon name="drag" size={14} /> {name}
                </li>
              ))}
              {COLUMNS.filter((c) => ids.includes(c.id)).map((c) => (
                <li key={c.id} className="flex h-9 items-center gap-2 rounded-[4px] border border-line bg-white px-2.5">
                  <Icon name="drag" size={14} className="text-ink-muted" /> <span className="flex-1">{labels[c.id]}</span>
                  <button type="button" aria-label={`Remove ${labels[c.id]}`} className="rounded p-0.5 text-ink-muted hover:bg-[#f0f0f0]" onClick={() => setIds((list) => list.filter((id) => id !== c.id))}>
                    <Icon name="close" size={14} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <footer className="flex items-center gap-2 border-t border-line px-6 py-3">
          <Button variant="primary" onClick={() => onApply(ids)} data-testid="columns-apply">
            Apply
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </footer>
      </div>
    </div>
  );
}

/** "Create custom line item", and Edit from a line's Actions: the line's own details. The product library is not changed. */
function DetailsPanel({ initial, editing, onSave, onClose }: { initial: Details; editing: boolean; onSave: (details: Details, another: boolean) => void; onClose: () => void }) {
  const [d, setD] = useState(initial);
  const set = (patch: Partial<Details>) => setD((current) => ({ ...current, ...patch }));
  const valid = d.name.trim() !== "" && d.price.trim() !== "";
  const label = "mb-1 mt-4 block text-[12.5px] font-semibold";
  return (
    <SidePanel
      title={editing ? "Edit line item" : "Create custom line item"}
      onClose={onClose}
      testId="line-details-panel"
      footer={
        <>
          <Button variant="primary" disabled={!valid} onClick={() => onSave(d, false)} data-testid="line-details-save">
            Save
          </Button>
          {editing ? null : (
            <Button
              disabled={!valid}
              onClick={() => {
                onSave(d, true);
                setD(EMPTY);
              }}
              data-testid="line-details-save-another"
            >
              Save and add another
            </Button>
          )}
          <Button onClick={onClose}>Cancel</Button>
        </>
      }
    >
      <label className={cx(label, "!mt-0")} htmlFor="line-name">
        Name <span className="text-[#d94c53]">*</span>
      </label>
      <input id="line-name" className={cx(input, "w-full")} value={d.name} onChange={(e) => set({ name: e.target.value })} autoFocus />
      <label className={label} htmlFor="line-sku">
        SKU
      </label>
      <input id="line-sku" className={cx(input, "w-full")} value={d.sku} onChange={(e) => set({ sku: e.target.value })} />
      <label className={label} htmlFor="line-description">
        Description
      </label>
      <textarea id="line-description" rows={3} className={cx(input, "h-auto w-full resize-none py-2")} value={d.description} onChange={(e) => set({ description: e.target.value })} />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label} htmlFor="line-price">
            Unit price <span className="text-[#d94c53]">*</span>
          </label>
          <input id="line-price" className={cx(input, "w-full")} inputMode="decimal" value={d.price} onChange={(e) => set({ price: decimal(e.target.value) })} />
        </div>
        <div>
          <label className={label} htmlFor="line-qty">
            Quantity
          </label>
          <input id="line-qty" className={cx(input, "w-full")} inputMode="numeric" value={d.qty} onChange={(e) => set({ qty: e.target.value.replace(/[^0-9]/g, "").slice(0, 5) })} />
        </div>
      </div>
      <label className={label} htmlFor="line-cost">
        Unit cost
      </label>
      <input id="line-cost" className={cx(input, "w-full")} inputMode="decimal" value={d.cost} onChange={(e) => set({ cost: decimal(e.target.value) })} />
      <p className="mt-4 text-[12.5px] text-ink-muted">{editing ? "Editing the line item changes it on this quote only. The product library is not affected." : "A custom line item is unique to this quote."}</p>
    </SidePanel>
  );
}

const toRow = (line: LineItem, key: number, discountPct = 0): Row => ({ key, line, price: line.unitPrice.toFixed(2), qty: String(line.qty), discount: trim(discountPct), unit: "%" });

/**
 * HubSpot's line item editor, opened from the quote with "Edit all line items": add lines from the
 * product library or as custom lines, edit, clone and delete them, set unit price, quantity and
 * unit discount, and Save. Nothing changes on the quote until Save.
 */
export function LineItemsEditor({ quote, onClose }: { quote: Quote; onClose: () => void }) {
  const { pack, world, dispatch } = useShell();
  const rule = pack.demos.discountApproval;
  const labels = labelsOf(pack).pack;
  const columnLabels: Record<ColumnId, string> = { description: "Description", timing: labels.timing, cost: "Unit cost", margin: "Margin" };
  const columns = (world.ui[COLUMNS_KEY] ?? DEFAULT_COLUMNS).split(",") as ColumnId[];
  const has = (id: ColumnId) => columns.includes(id);
  const [rows, setRows] = useState<Row[]>(() => quote.lineItems.map((l, i) => toRow(l, i, unitDiscountPct(quote, l))));
  const [nextKey, setNextKey] = useState(quote.lineItems.length);
  const [panel, setPanel] = useState<Panel>(null);
  const edit = (key: number, patch: Partial<Row>) => setRows((list) => list.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const append = (lines: LineItem[]) => {
    setRows((list) => [...list, ...lines.map((l, i) => toRow(l, nextKey + i))]);
    setNextKey(nextKey + lines.length);
  };

  const draft = useMemo(() => {
    const lineItems: LineItem[] = rows.map((row) => {
      const unitPrice = num(row.price);
      const discountPct = Math.min(60, row.unit === "%" ? num(row.discount) : unitPrice > 0 ? (num(row.discount) / unitPrice) * 100 : 0);
      return { ...row.line, unitPrice, qty: whole(row.qty), discountPct: Math.round(discountPct * 100) / 100 };
    });
    return { lineItems, discountPct: 0, termsId: quote.termsId };
  }, [quote.termsId, rows]);
  const totals = quoteTotals(draft);
  const reasons = approvalReasons(draft, rule);

  const save = () => {
    dispatch({ t: "quote.setLines", id: quote.id, lines: draft.lineItems });
    onClose();
  };
  const addProducts = (products: Product[]) => {
    append(products.map((p) => ({ sku: p.sku, name: p.name, qty: 1, unitPrice: p.price, unitCost: p.cost, leadDays: p.leadDays, ...(p.timing ? { timing: p.timing } : {}), ...(p.recurring ? { recurring: true } : {}) })));
    setPanel(null);
  };
  const saveDetails = (d: Details, another: boolean) => {
    const fields = { name: d.name.trim(), sku: d.sku.trim(), unitCost: num(d.cost) };
    const description = d.description.trim();
    if (panel?.kind === "edit") {
      const current = rows.find((r) => r.key === panel.key);
      if (current) {
        const line: LineItem = { ...current.line, ...fields };
        if (description) line.description = description;
        else delete line.description;
        edit(panel.key, { line, price: num(d.price).toFixed(2), qty: String(whole(d.qty)) });
      }
    } else {
      append([{ ...fields, ...(description ? { description } : {}), qty: whole(d.qty), unitPrice: num(d.price), leadDays: 0 }]);
    }
    if (!another) setPanel(null);
  };
  const editing = panel?.kind === "edit" ? rows.find((r) => r.key === panel.key) : undefined;

  const th = "whitespace-nowrap px-4 py-3 text-left text-[12.5px] font-normal text-ink";
  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-[#f5f8fa]" data-testid="line-items-editor">
      <div className="hs-scroll min-h-0 flex-1 overflow-auto px-8 py-6">
        <h2 className="text-[18px] font-semibold">Review line items</h2>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-[13px]">
            Currency:
            <span className="inline-flex h-8 items-center gap-1.5 rounded-[4px] bg-[#eaf0f6] px-3 text-ink-muted">
              US Dollar ({pack.portal.currency}) $ <Icon name="chevronDown" size={13} />
            </span>
          </p>
          <div className="flex items-center gap-2">
            <Menu
              align="right"
              width={200}
              button={({ toggle }) => (
                <button type="button" onClick={toggle} className={pill} data-testid="edit-columns">
                  Edit columns <Icon name="chevronDown" size={12} />
                </button>
              )}
            >
              {(close) => (
                <MenuItem
                  testId="edit-columns-open"
                  onClick={() => {
                    close();
                    setPanel({ kind: "columns" });
                  }}
                >
                  Edit columns
                </MenuItem>
              )}
            </Menu>
            <Menu
              align="right"
              width={250}
              button={({ toggle }) => (
                <button type="button" onClick={toggle} className={pill} data-testid="add-line-item">
                  Add line item <Icon name="chevronDown" size={12} />
                </button>
              )}
            >
              {(close) => (
                <>
                  <MenuItem
                    testId="add-from-library"
                    onClick={() => {
                      close();
                      setPanel({ kind: "library" });
                    }}
                  >
                    Select from product library
                  </MenuItem>
                  <MenuItem
                    testId="add-custom"
                    onClick={() => {
                      close();
                      setPanel({ kind: "custom" });
                    }}
                  >
                    Create custom line item
                  </MenuItem>
                </>
              )}
            </Menu>
          </div>
        </div>

        <div className="mt-4 inline-block min-w-full rounded-[8px] border border-line bg-white align-top">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="border-b border-line">
                <th className={cx(th, "border-r-2 border-line")}>Name</th>
                <th className={th}>Unit price</th>
                <th className={th}>Quantity</th>
                <th className={th}>Unit discount</th>
                <th className={cx(th, "text-right")}>Net price</th>
                {has("description") ? <th className={th}>Description</th> : null}
                {has("timing") ? <th className={th}>{labels.timing}</th> : null}
                {has("cost") ? <th className={cx(th, "text-right")}>Unit cost</th> : null}
                {has("margin") ? <th className={cx(th, "text-right")}>Margin</th> : null}
                <th className={cx(th, "pr-10")}>
                  <Ext id="floor-price-rule" className="inline-block pr-7" pinClass="!right-0 !top-[-3px]">
                    Floor price
                  </Ext>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const l = draft.lineItems[i];
                const floor = floorPrice(l, rule);
                const below = (l.discountPct ?? 0) > 0 && l.unitPrice * (1 - (l.discountPct ?? 0) / 100) < floor;
                return (
                  <tr key={row.key} className="group border-b border-line-soft last:border-b-0 hover:bg-[#f5f5f5] focus-within:bg-[#f5f5f5]" data-testid={`line-${l.sku || "custom"}`}>
                    <td className="w-full min-w-[230px] max-w-0 border-r-2 border-line px-3 py-3">
                      <span className="flex items-center gap-1.5">
                        <Icon name="drag" size={15} className="shrink-0 text-ink-muted" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-link">{l.name}</span>
                          <span className="block truncate text-[12px] text-ink-muted">{l.sku || "Custom line item"}</span>
                        </span>
                        <Menu
                          align="right"
                          width={150}
                          className="shrink-0 opacity-0 focus-within:opacity-100 group-hover:opacity-100"
                          button={({ toggle }) => (
                            <button type="button" onClick={toggle} className={cx(pill, "h-6 px-2.5 text-[11.5px]")} data-testid={`line-actions-${i}`}>
                              Actions <Icon name="chevronDown" size={12} />
                            </button>
                          )}
                        >
                          {(close) => (
                            <>
                              <MenuItem
                                testId={`line-edit-${i}`}
                                onClick={() => {
                                  close();
                                  setPanel({ kind: "edit", key: row.key });
                                }}
                              >
                                Edit
                              </MenuItem>
                              <MenuItem
                                testId={`line-clone-${i}`}
                                onClick={() => {
                                  close();
                                  setRows((list) => list.flatMap((r) => (r.key === row.key ? [r, { ...r, key: nextKey }] : [r])));
                                  setNextKey(nextKey + 1);
                                }}
                              >
                                Clone
                              </MenuItem>
                              <MenuItem
                                testId={`line-delete-${i}`}
                                onClick={() => {
                                  close();
                                  setRows((list) => list.filter((r) => r.key !== row.key));
                                }}
                              >
                                Delete
                              </MenuItem>
                            </>
                          )}
                        </Menu>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="relative inline-block">
                        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted">$</span>
                        <input className={cx(input, "w-[104px] pl-5")} inputMode="decimal" aria-label={`Unit price, ${l.name}`} value={row.price} onChange={(e) => edit(row.key, { price: decimal(e.target.value) })} />
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <input className={cx(input, "w-[72px]")} type="number" min={1} aria-label={`Quantity, ${l.name}`} value={row.qty} onChange={(e) => edit(row.key, { qty: e.target.value.replace(/[^0-9]/g, "").slice(0, 5) })} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex">
                        <input
                          className={cx(input, "w-[72px] rounded-r-none border-r-0 text-right")}
                          inputMode="decimal"
                          aria-label={`Unit discount, ${l.name}`}
                          data-testid={`line-discount-${i}`}
                          value={row.discount}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => edit(row.key, { discount: decimal(e.target.value).slice(0, 8) })}
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
                            edit(row.key, { unit, discount: trim(amount) });
                          }}
                        >
                          <option value="%">%</option>
                          <option value="$">{pack.portal.currency}</option>
                        </select>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{money2(lineNet(draft, l))}</td>
                    {has("description") ? <td className="min-w-[240px] px-4 py-3 text-[13px]">{l.description || "--"}</td> : null}
                    {has("timing") ? <td className="whitespace-nowrap px-4 py-3">{timingOf(l)}</td> : null}
                    {has("cost") ? <td className="px-4 py-3 text-right tabular-nums">{money2(l.unitCost)}</td> : null}
                    {has("margin") ? <td className={cx("px-4 py-3 text-right tabular-nums", below && "font-semibold text-[#99201a]")}>{pct(lineMarginPct(draft, l))}</td> : null}
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                      {money2(floor)}
                      {below ? (
                        <Tag tone="red" className="ml-2">
                          <span data-testid={`below-floor-${i}`}>Below floor price</span>
                        </Tag>
                      ) : null}
                      {below ? <span className="block text-[12px] text-ink-muted">Net unit price {money2(netUnitPrice(draft, l))}</span> : null}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6 + columns.filter(Boolean).length} className="px-4 py-10 text-center text-[13.5px] text-ink-muted" data-testid="line-editor-empty">
                    This quote has no line items. Click Add line item to add products or services.
                  </td>
                </tr>
              ) : null}
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
            <Leader label={labels.quoteTotal} value={money2(totals.total)} strong testId="line-editor-total" />
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

      {panel?.kind === "library" ? <LibraryPanel onAdd={addProducts} onClose={() => setPanel(null)} /> : null}
      {panel?.kind === "columns" ? (
        <ColumnsDialog
          shown={columns.filter(Boolean)}
          labels={columnLabels}
          onApply={(ids) => {
            dispatch({ t: "ui", k: COLUMNS_KEY, v: COLUMNS.filter((c) => ids.includes(c.id)).map((c) => c.id).join(",") });
            setPanel(null);
          }}
          onClose={() => setPanel(null)}
        />
      ) : null}
      {panel?.kind === "custom" ? <DetailsPanel initial={EMPTY} editing={false} onSave={saveDetails} onClose={() => setPanel(null)} /> : null}
      {editing ? (
        <DetailsPanel
          key={editing.key}
          initial={{ name: editing.line.name, sku: editing.line.sku, description: editing.line.description ?? "", price: editing.price, qty: editing.qty, cost: trim(editing.line.unitCost) }}
          editing
          onSave={saveDetails}
          onClose={() => setPanel(null)}
        />
      ) : null}
    </div>
  );
}
