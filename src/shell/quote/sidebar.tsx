"use client";

import { useState } from "react";
import { lineNet, quoteTerms } from "@/store/quote-math";
import { useShell } from "@/store/store";
import { labelsOf } from "@/verticals/labels";
import type { Quote } from "@/verticals/types";
import { date, money2 } from "../format";
import { Icon, type IconName } from "../icons";
import { companyOf, contactName } from "../pages/lists";
import { cx } from "../ui";
import { MODULES, useQuoteSettings, type ModuleId, type QuoteSettings } from "./settings";

const field = "h-9 w-full rounded-[4px] border border-[#7c98b6] bg-white px-3 text-[13.5px] focus:border-ink focus:outline-none";

export function Switch({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onChange} className={cx("relative h-5 w-9 shrink-0 rounded-full transition-colors", on ? "bg-[#00a4bd]" : "bg-[#cbd6e2]")}>
      <span className={cx("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-[left]", on ? "left-[18px]" : "left-0.5")} />
    </button>
  );
}

/** One labelled part of a module: an optional switch that shows or hides it, and its label field. */
function Part({ s, title, show, labelKey, fallback, children }: { s: QuoteSettings; title: string; show?: string; labelKey?: string; fallback?: string; children?: React.ReactNode }) {
  return (
    <div className="border-b border-line-soft py-4 last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-[13.5px] font-semibold">{title}</h4>
        {show ? <Switch on={s.on(show)} onChange={() => s.toggle(show)} label={title} /> : null}
      </div>
      {children}
      {labelKey ? (
        <label className="mt-3 block text-[12.5px] font-semibold">
          Label
          <input className={cx(field, "mt-1 font-normal")} value={s.get(labelKey, fallback)} onChange={(e) => s.set(labelKey, e.target.value)} />
        </label>
      ) : null}
    </div>
  );
}

function BoxTabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (id: T) => void }) {
  return (
    <div role="tablist" className="-mx-4 flex border-b border-line">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === value}
          onClick={() => onChange(tab.id)}
          className={cx("-mb-px h-10 flex-1 border-r border-line text-[13.5px] last:border-r-0", tab.id === value ? "border-b border-b-white bg-white font-semibold" : "bg-[#f5f5f5] text-ink")}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function RecordCard({ heading, icon, name, detail }: { heading: string; icon: IconName; name?: string; detail?: string }) {
  return (
    <div className="mt-3 overflow-hidden rounded-[4px] border border-line">
      <p className="bg-[#f0f0f0] px-3 py-2 text-[13px] font-semibold">{heading}</p>
      <div className="flex items-center gap-3 px-3 py-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f0f0f0]">
          <Icon name={icon} size={17} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13.5px] font-semibold text-link underline underline-offset-2">{name}</span>
          <span className="block truncate text-[12.5px]">{detail}</span>
        </span>
      </div>
    </div>
  );
}

function Rows({ title, items }: { title: string; items: string[] }) {
  return (
    <>
      <h4 className="mt-4 text-[13.5px] font-semibold">{title}</h4>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex h-9 items-center gap-2 rounded-[4px] border border-line px-2 text-[13px]">
            <Icon name="drag" size={14} className="text-ink-muted" /> {item}
          </li>
        ))}
      </ul>
    </>
  );
}

function ModuleEditor({ quote, module, onEditLines }: { quote: Quote; module: ModuleId; onEditLines: () => void }) {
  const { world, pack, dispatch } = useShell();
  const s = useQuoteSettings(quote);
  const [tab, setTab] = useState("a");
  const termsRule = pack.demos.discountApproval.terms;
  const documentLabels = labelsOf(pack).pack.document;
  const company = companyOf(world, quote.companyId);
  const contact = world.contacts.find((c) => c.id === quote.contactId);
  const owner = pack.personas.find((p) => p.id === quote.ownerId);

  switch (module) {
    case "cover":
    case "exec":
      return (
        <>
          <Part s={s} title="Title" labelKey={`label.${module}`} fallback={module === "cover" ? "Cover letter" : "Executive summary"} />
          <p className="pt-3 text-[12.5px] text-ink-muted">The text is written from the deal, its line items, and recent activity. Edit it on the quote.</p>
        </>
      );
    case "header":
      return (
        <>
          <Part s={s} title="Quote reference" show="show.ref" labelKey="label.ref" fallback={documentLabels.ref} />
          <Part s={s} title="Issue date" show="show.issue" labelKey="label.issue" fallback="Issue date" />
          <Part s={s} title="Expiration date" show="show.expires" labelKey="label.expires" fallback="Expires">
            <p className={cx(field, "mt-3 flex items-center justify-between")}>
              {date(quote.validUntil)} <Icon name="meeting" size={15} className="text-ink-muted" />
            </p>
          </Part>
          <Part s={s} title="Currency" labelKey="label.currency" fallback="Currency" />
          <Part s={s} title="PO number" show="show.po" labelKey="label.po" fallback="PO number" />
        </>
      );
    case "parties":
      return (
        <>
          <BoxTabs
            tabs={[
              { id: "a", label: "Seller" },
              { id: "b", label: "Buyer" },
              { id: "c", label: "Bill to" },
            ]}
            value={tab}
            onChange={setTab}
          />
          {tab === "a" ? (
            <>
              <h4 className="mt-4 text-[13.5px] font-semibold">Manage your seller details</h4>
              <label className="mt-3 block text-[12.5px] font-semibold">
                Heading
                <input className={cx(field, "mt-1 font-normal")} value={s.get("label.seller", "Seller")} onChange={(e) => s.set("label.seller", e.target.value)} />
              </label>
              <RecordCard heading="Company" icon="company" name={pack.portal.company} detail={pack.portal.address?.[0] ?? pack.portal.domain} />
              <RecordCard heading="Contact" icon="user" name={owner?.name} detail={owner?.email} />
            </>
          ) : tab === "b" ? (
            <>
              <h4 className="mt-4 text-[13.5px] font-semibold">Manage your buyer details</h4>
              <label className="mt-3 block text-[12.5px] font-semibold">
                Heading
                <input className={cx(field, "mt-1 font-normal")} value={s.get("label.buyer", "Buyer")} onChange={(e) => s.set("label.buyer", e.target.value)} />
              </label>
              <RecordCard heading="Company" icon="company" name={company?.name} detail={company ? `${company.city}, ${company.state} United States` : ""} />
              <RecordCard heading="Contacts" icon="user" name={contactName(contact)} detail={contact?.email} />
            </>
          ) : (
            <p className="mt-4 text-[13px] text-ink-muted">Bill to is off. Invoices and billing details go to the buyer contact.</p>
          )}
        </>
      );
    case "summary":
      return (
        <>
          <Part s={s} title="Effective date" show="show.effective" labelKey="label.effective" fallback="Effective date">
            <p className={cx(field, "mt-3 flex items-center justify-between")}>
              On agreement <Icon name="chevronDown" size={14} className="text-ink-muted" />
            </p>
          </Part>
          <Part s={s} title="Term length" show="show.term" labelKey="label.term" fallback="Term length" />
          <Part s={s} title="Total discount" show="show.discount" labelKey="label.discount" fallback="Total discount">
            <label className="mt-3 block text-[12.5px] font-semibold">
              Format
              <select className={cx(field, "mt-1 font-normal")} value={s.get("discountFormat")} onChange={(e) => s.set("discountFormat", e.target.value)} data-testid="discount-format">
                <option value="amount">Show as amount</option>
                <option value="pct">Show as percentage</option>
                <option value="both">Show as percentage and amount</option>
              </select>
            </label>
          </Part>
          <Part s={s} title="Total contract value" show="show.tcv" labelKey="label.tcv" fallback={documentLabels.total} />
        </>
      );
    case "lines":
      return (
        <>
          <BoxTabs
            tabs={[
              { id: "a", label: "Properties" },
              { id: "b", label: "Items" },
              { id: "c", label: "Totals" },
            ]}
            value={tab}
            onChange={setTab}
          />
          {tab === "a" ? (
            <>
              <h4 className="mt-4 text-[13.5px] font-semibold">Manage properties</h4>
              <p className="text-[12px] text-ink-muted">Properties added will default to columns or rows to start.</p>
              <Rows title="Table columns (5/7)" items={["Name", "Quantity", "Unit price", "Unit discount", "Net price"]} />
              <Rows title="Item rows (2)" items={["SKU", labelsOf(pack).pack.timing]} />
            </>
          ) : tab === "b" ? (
            <>
              <ul className="mt-3 divide-y divide-line-soft">
                {quote.lineItems.map((l, i) => (
                  <li key={`${l.sku}-${i}`} className="flex items-baseline justify-between gap-3 py-2.5 text-[13px]">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{l.name}</span>
                      <span className="text-ink-muted">Quantity {l.qty}</span>
                    </span>
                    <span className="shrink-0 tabular-nums">{money2(lineNet(quote, l))}</span>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={onEditLines} className="mt-3 inline-flex h-9 items-center rounded-[4px] border border-ink px-4 text-[13px] font-semibold hover:bg-[#f5f5f5]" data-testid="sidebar-edit-lines">
                Edit all line items
              </button>
            </>
          ) : (
            <Part s={s} title="Totals" show="show.totals">
              <p className="mt-2 text-[12.5px] text-ink-muted">Shows the subtotal, the discount included in it, and the total under the line items.</p>
            </Part>
          )}
        </>
      );
    case "terms":
      return (
        <>
          <Part s={s} title="Title" labelKey="label.terms" fallback="Terms" />
          <p className="pt-3 text-[12.5px] text-ink-muted">Terms come from the quote template. Edit the text on the quote.</p>
        </>
      );
    case "payments":
      return (
        <>
          <BoxTabs
            tabs={[
              { id: "a", label: "Billing" },
              { id: "b", label: "Payments" },
            ]}
            value={tab === "b" ? "b" : "a"}
            onChange={setTab}
          />
          {tab === "b" ? (
            <p className="mt-4 text-[13px] text-ink-muted">Online payments are off for this quote. Turn on billing to accept them.</p>
          ) : (
            <>
              <div className="mt-4 flex items-center justify-between">
                <h4 className="text-[13.5px] font-semibold">Enable billing</h4>
                <Switch on={s.get("billing", "0") === "1"} onChange={() => s.set("billing", s.get("billing", "0") === "1" ? "0" : "1")} label="Enable billing" />
              </div>
              <label className="mt-4 block text-[12.5px] font-semibold">
                {termsRule?.label ?? "Payment terms"}
                {termsRule ? (
                  <select
                    className={cx(field, "mt-1 font-normal")}
                    value={quoteTerms(quote, pack.demos.discountApproval)?.id}
                    data-testid="quote-terms"
                    onChange={(e) => dispatch({ t: "quote.terms", id: quote.id, termsId: e.target.value })}
                  >
                    {termsRule.options.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className={cx(field, "mt-1 flex items-center justify-between font-normal")}>
                    Net 30 <Icon name="chevronDown" size={14} className="text-ink-muted" />
                  </span>
                )}
              </label>
            </>
          )}
        </>
      );
    case "acceptance":
      return (
        <>
          <h4 className="pt-4 text-[13.5px] font-semibold">Acceptance method</h4>
          <div className="mt-2 space-y-2" role="radiogroup" aria-label="Acceptance method">
            {(
              [
                ["print", "Print and sign"],
                ["esign", "E-signature"],
                ["click", "Accept without signature"],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-[13.5px]">
                <input type="radio" name="accept" checked={s.get("accept") === value} onChange={() => s.set("accept", value)} data-testid={`accept-${value}`} /> {label}
              </label>
            ))}
          </div>
          <h4 className="mt-5 text-[13.5px] font-semibold">Buyer contacts required to sign</h4>
          <label className="mt-2 flex items-center gap-2 text-[13.5px]">
            <input type="checkbox" checked readOnly /> {contactName(contact)}
          </label>
        </>
      );
  }
}

/** The quote editor's left sidebar: the list of modules with their show and hide switches, or the editor of the selected module. */
export function EditorSidebar({ quote, module, onSelect, onClose, onEditLines }: { quote: Quote; module: ModuleId | null; onSelect: (module: ModuleId | null) => void; onClose: () => void; onEditLines: () => void }) {
  const s = useQuoteSettings(quote);
  const current = MODULES.find((m) => m.id === module);
  return (
    <aside className="hs-scroll flex w-[300px] shrink-0 flex-col overflow-y-auto border-r border-line bg-white" data-testid="quote-sidebar">
      <header className="flex items-start justify-between gap-2 px-4 pb-3 pt-3.5">
        <div className="min-w-0">
          {current ? (
            <p className="text-[12px] font-semibold">
              <button type="button" className="hover:underline" onClick={() => onSelect(null)} data-testid="sidebar-back">
                Quote
              </button>{" "}
              <span className="text-ink-muted">› {current.label}</span>
            </p>
          ) : null}
          <h3 className={cx("font-semibold", current ? "mt-1 text-[17px]" : "text-[14px]")}>{current ? current.label : "Quote"}</h3>
        </div>
        <button type="button" onClick={onClose} aria-label="Close sidebar" className="rounded p-1 text-ink-muted hover:bg-[#f0f0f0]">
          <Icon name="close" size={16} />
        </button>
      </header>
      {current ? (
        <div className="border-t border-line px-4 pb-6">
          <ModuleEditor key={current.id} quote={quote} module={current.id} onEditLines={onEditLines} />
        </div>
      ) : (
        <ul className="border-t border-line py-2" data-testid="module-list">
          {MODULES.map((m) => {
            const hidden = s.hidden(m.id);
            return (
              <li key={m.id} className="flex items-center hover:bg-[#f5f8fa]">
                <button type="button" onClick={() => onSelect(m.id)} className={cx("flex h-11 min-w-0 flex-1 items-center gap-3 px-4 text-left text-[13.5px]", hidden && "text-ink-muted")} data-testid={`module-${m.id}`}>
                  <Icon name={m.icon} size={15} /> <span className="truncate">{m.label}</span>
                </button>
                <button
                  type="button"
                  onClick={() => s.set(`hide.${m.id}`, hidden ? "0" : "1")}
                  title={hidden ? "Show section" : "Hide section"}
                  aria-label={`${hidden ? "Show" : "Hide"} ${m.label}`}
                  aria-pressed={!hidden}
                  data-testid={`module-eye-${m.id}`}
                  className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded hover:bg-[#eaf0f6]"
                >
                  <Icon name={hidden ? "eyeOff" : "eye"} size={16} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
