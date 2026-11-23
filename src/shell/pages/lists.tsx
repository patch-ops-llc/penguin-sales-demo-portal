"use client";

import { useState } from "react";
import { quoteStatusLabel, quoteTotals } from "@/store/quote-math";
import { useShell } from "@/store/store";
import type { World } from "@/store/world";
import { labelsOf, timingOf } from "@/verticals/labels";
import type { Company, Contact, Deal, Pack, Product, Quote, Task, Workflow } from "@/verticals/types";
import { compactMoney, date, money, num, relative } from "../format";
import { Icon } from "../icons";
import { A, Avatar, colorFor, cx, Prop, statusTone, Tag } from "../ui";
import { MarketingTaskBanner } from "../marketing/lazy";
import { QuoteStatus } from "../quote/status";
import { IndexPage, PreviewShell, type Column, type Filter, type View } from "./index-table";

const WEEK = 7 * 86_400_000;

export const ownerName = (pack: Pack, id: string | null | undefined) => pack.personas.find((p) => p.id === id)?.name ?? "Unassigned";
export const companyOf = (w: World, id: string | null | undefined) => w.companies.find((c) => c.id === id);
export const contactName = (c: Contact | undefined) => (c ? `${c.firstName} ${c.lastName}` : "");
export const stageOf = (pack: Pack, id: string) => pack.stages.find((s) => s.id === id);

function ownerFilter<T>(pack: Pack, get: (row: T) => string | null | undefined): Filter<T> {
  return { id: "owner", label: "Owner", options: pack.personas.map((p) => ({ value: p.id, label: p.name })), test: (row, value) => get(row) === value };
}

function NewTag() {
  return <Tag tone="orange">New</Tag>;
}

export function ContactsIndex() {
  const { world, pack, persona } = useShell();
  const columns: Column<Contact>[] = [
    {
      id: "name",
      label: "Name",
      sort: (c) => `${c.firstName} ${c.lastName}`,
      cell: (c) => (
        <span className="flex items-center gap-2.5">
          <Avatar name={contactName(c)} color={colorFor(c.id)} size={26} />
          <A to={`/contacts/${c.id}`} className="hs-link" data-testid={`link-${c.id}`}>
            {contactName(c)}
          </A>
          {c.isNew ? <NewTag /> : null}
        </span>
      ),
    },
    { id: "email", label: "Email", cell: (c) => c.email, sort: (c) => c.email },
    {
      id: "company",
      label: "Company",
      sort: (c) => companyOf(world, c.companyId)?.name ?? "",
      cell: (c) => {
        const company = companyOf(world, c.companyId);
        return company ? (
          <A to={`/companies/${company.id}`} className="hs-link">
            {company.name}
          </A>
        ) : (
          "--"
        );
      },
    },
    { id: "title", label: "Job title", cell: (c) => c.title, sort: (c) => c.title },
    { id: "owner", label: "Contact owner", cell: (c) => ownerName(pack, c.ownerId), sort: (c) => ownerName(pack, c.ownerId) },
    { id: "status", label: "Lead status", cell: (c) => c.leadStatus, sort: (c) => c.leadStatus },
    { id: "activity", label: "Last activity", cell: (c) => relative(c.lastActivityAt), sort: (c) => c.lastActivityAt },
  ];
  const views: View<Contact>[] = [
    { id: "all", label: "All contacts", filter: () => true },
    { id: "mine", label: "My contacts", filter: (c) => c.ownerId === persona.id },
    { id: "new", label: "Created this week", filter: (c) => Date.now() - new Date(c.createdAt).getTime() < WEEK },
  ];
  return (
    <IndexPage
      title="Contacts"
      noun="contact"
      rows={world.contacts}
      columns={columns}
      views={views}
      filters={[ownerFilter<Contact>(pack, (c) => c.ownerId), { id: "lifecycle", label: "Lifecycle stage", options: ["Subscriber", "Lead", "Opportunity", "Customer"].map((v) => ({ value: v, label: v })), test: (c, v) => c.lifecycle === v }]}
      searchText={(c) => `${c.firstName} ${c.lastName} ${c.email} ${companyOf(world, c.companyId)?.name ?? ""}`}
      rowKey={(c) => c.id}
      isNew={(c) => Boolean(c.isNew)}
      preview={(c, close) => (
        <PreviewShell title={contactName(c)} subtitle={c.title} to={`/contacts/${c.id}`} onClose={close}>
          <dl>
            <Prop label="Email">{c.email}</Prop>
            <Prop label="Phone number">{c.phone}</Prop>
            <Prop label="Company">{companyOf(world, c.companyId)?.name}</Prop>
            <Prop label="Contact owner">{ownerName(pack, c.ownerId)}</Prop>
            <Prop label="Lifecycle stage">{c.lifecycle}</Prop>
            <Prop label="Lead status">{c.leadStatus}</Prop>
            <Prop label="Last activity">{relative(c.lastActivityAt)}</Prop>
          </dl>
        </PreviewShell>
      )}
    />
  );
}

export function CompaniesIndex() {
  const { world, pack, persona } = useShell();
  const columns: Column<Company>[] = [
    {
      id: "name",
      label: "Company name",
      sort: (c) => c.name,
      cell: (c) => (
        <span className="flex items-center gap-2.5">
          <span className="inline-flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[6px] text-[11px] font-bold text-white" style={{ background: colorFor(c.id) }}>
            {c.name[0]}
          </span>
          <A to={`/companies/${c.id}`} className="hs-link" data-testid={`link-${c.id}`}>
            {c.name}
          </A>
          {c.isNew ? <NewTag /> : null}
        </span>
      ),
    },
    { id: "industry", label: "Industry", cell: (c) => c.industry, sort: (c) => c.industry },
    { id: "type", label: "Type", cell: (c) => c.type, sort: (c) => c.type },
    { id: "location", label: "City", cell: (c) => `${c.city}, ${c.state}`, sort: (c) => c.city },
    { id: "owner", label: "Company owner", cell: (c) => ownerName(pack, c.ownerId), sort: (c) => ownerName(pack, c.ownerId) },
    { id: "revenue", label: "Annual revenue", align: "right", cell: (c) => (c.revenue ? compactMoney(c.revenue) : "--"), sort: (c) => c.revenue ?? 0 },
    { id: "activity", label: "Last activity", cell: (c) => relative(c.lastActivityAt), sort: (c) => c.lastActivityAt },
  ];
  const views: View<Company>[] = [
    { id: "all", label: "All companies", filter: () => true },
    { id: "mine", label: "My companies", filter: (c) => c.ownerId === persona.id },
    { id: "customers", label: "Customers", filter: (c) => c.type === "Customer" },
  ];
  const types = [...new Set(world.companies.map((c) => c.type))];
  return (
    <IndexPage
      title="Companies"
      noun="company record"
      rows={world.companies}
      columns={columns}
      views={views}
      filters={[ownerFilter<Company>(pack, (c) => c.ownerId), { id: "type", label: "Type", options: types.map((v) => ({ value: v, label: v })), test: (c, v) => c.type === v }]}
      searchText={(c) => `${c.name} ${c.domain} ${c.industry} ${c.city}`}
      rowKey={(c) => c.id}
      isNew={(c) => Boolean(c.isNew)}
      preview={(c, close) => (
        <PreviewShell title={c.name} subtitle={c.domain} to={`/companies/${c.id}`} onClose={close}>
          <dl>
            <Prop label="Industry">{c.industry}</Prop>
            <Prop label="Type">{c.type}</Prop>
            <Prop label="City">{`${c.city}, ${c.state}`}</Prop>
            <Prop label="Number of employees">{c.employees ? num(c.employees) : ""}</Prop>
            <Prop label="Annual revenue">{c.revenue ? money(c.revenue) : ""}</Prop>
            <Prop label="Company owner">{ownerName(pack, c.ownerId)}</Prop>
            <Prop label="Last activity">{relative(c.lastActivityAt)}</Prop>
          </dl>
        </PreviewShell>
      )}
    />
  );
}

function DealBoard({ deals }: { deals: Deal[] }) {
  const { pack, world } = useShell();
  return (
    <div className="hs-scroll flex min-h-[420px] flex-1 gap-3 overflow-x-auto bg-[#f7f7f7] p-3" data-testid="deal-board">
      {pack.stages.map((stage) => {
        const inStage = deals.filter((d) => d.stage === stage.id);
        return (
          <section key={stage.id} className="flex w-[236px] shrink-0 flex-col rounded-[8px] border border-line-soft bg-[#efefef]">
            <header className="flex items-center justify-between px-3 py-2.5">
              <p className="text-[12px] font-semibold uppercase tracking-wide">{stage.label}</p>
              <span className="text-[12px] text-ink-muted">{inStage.length}</span>
            </header>
            <div className="flex flex-1 flex-col gap-2 px-2 pb-2">
              {inStage.map((d) => (
                <article key={d.id} className={cx("rounded-[8px] border border-line bg-white p-2.5", d.isNew && "hs-row-new")}>
                  <A to={`/deals/${d.id}`} className="hs-link block text-[13px] leading-snug">
                    {d.name}
                  </A>
                  <p className="mt-1 text-[12.5px]">
                    <span className="text-ink-muted">Amount:</span> {money(d.amount)}
                  </p>
                  <p className="text-[12.5px]">
                    <span className="text-ink-muted">Close date:</span> {date(d.closeDate)}
                  </p>
                  <p className="mt-1 truncate text-[12px] text-ink-muted">{companyOf(world, d.companyId)?.name}</p>
                </article>
              ))}
            </div>
            <footer className="border-t border-line-soft px-3 py-2 text-[12px] text-ink-muted">
              Total: <span className="font-semibold text-ink">{money(inStage.reduce((sum, d) => sum + d.amount, 0))}</span>
            </footer>
          </section>
        );
      })}
    </div>
  );
}

export function DealsIndex() {
  const { world, pack, persona } = useShell();
  const [board, setBoard] = useState(false);
  const columns: Column<Deal>[] = [
    {
      id: "name",
      label: "Deal name",
      sort: (d) => d.name,
      cell: (d) => (
        <span className="flex items-center gap-2">
          <A to={`/deals/${d.id}`} className="hs-link" data-testid={`link-${d.id}`}>
            {d.name}
          </A>
          {d.isNew ? <NewTag /> : null}
        </span>
      ),
    },
    { id: "stage", label: "Deal stage", cell: (d) => stageOf(pack, d.stage)?.label, sort: (d) => pack.stages.findIndex((s) => s.id === d.stage) },
    { id: "amount", label: "Amount", align: "right", cell: (d) => money(d.amount), sort: (d) => d.amount },
    { id: "close", label: "Close date", cell: (d) => date(d.closeDate), sort: (d) => d.closeDate },
    { id: "owner", label: "Deal owner", cell: (d) => ownerName(pack, d.ownerId), sort: (d) => ownerName(pack, d.ownerId) },
    { id: "company", label: "Company", cell: (d) => companyOf(world, d.companyId)?.name, sort: (d) => companyOf(world, d.companyId)?.name ?? "" },
    { id: "activity", label: "Last activity", cell: (d) => relative(d.lastActivityAt), sort: (d) => d.lastActivityAt },
  ];
  const views: View<Deal>[] = [
    { id: "all", label: "All deals", filter: () => true },
    { id: "mine", label: "My deals", filter: (d) => d.ownerId === persona.id },
    { id: "open", label: "Open deals", filter: (d) => !stageOf(pack, d.stage)?.closed },
  ];
  return (
    <IndexPage
      title="Deals"
      noun="deal"
      rows={world.deals}
      columns={columns}
      views={views}
      filters={[ownerFilter<Deal>(pack, (d) => d.ownerId), { id: "stage", label: "Deal stage", options: pack.stages.map((s) => ({ value: s.id, label: s.label })), test: (d, v) => d.stage === v }]}
      searchText={(d) => `${d.name} ${companyOf(world, d.companyId)?.name ?? ""}`}
      rowKey={(d) => d.id}
      isNew={(d) => Boolean(d.isNew)}
      alternate={board ? (rows) => <DealBoard deals={rows} /> : undefined}
      toolbar={
        <div className="flex items-center gap-3">
          <p className="text-[12.5px] text-ink-muted">{labelsOf(pack).pack.pipeline}</p>
          <div className="inline-flex overflow-hidden rounded-[6px] border border-line bg-white" role="group" aria-label="Layout">
            <button type="button" onClick={() => setBoard(false)} aria-pressed={!board} data-testid="deals-table-view" className={cx("inline-flex h-8 items-center gap-1.5 px-3 text-[12.5px] font-semibold", !board ? "bg-ink text-white" : "hover:bg-[#f0f0f0]")}>
              <Icon name="list" size={14} /> Table
            </button>
            <button type="button" onClick={() => setBoard(true)} aria-pressed={board} data-testid="deals-board-view" className={cx("inline-flex h-8 items-center gap-1.5 px-3 text-[12.5px] font-semibold", board ? "bg-ink text-white" : "hover:bg-[#f0f0f0]")}>
              <Icon name="board" size={14} /> Board
            </button>
          </div>
        </div>
      }
      preview={(d, close) => (
        <PreviewShell title={d.name} subtitle={companyOf(world, d.companyId)?.name} to={`/deals/${d.id}`} onClose={close}>
          <dl>
            <Prop label="Amount">{money(d.amount)}</Prop>
            <Prop label="Deal stage">{stageOf(pack, d.stage)?.label}</Prop>
            <Prop label="Close date">{date(d.closeDate)}</Prop>
            <Prop label="Deal owner">{ownerName(pack, d.ownerId)}</Prop>
            <Prop label="Deal type">{d.type}</Prop>
            <Prop label="Line items">{d.lineItems.length > 0 ? `${d.lineItems.length} line items` : ""}</Prop>
            <Prop label="Last activity">{relative(d.lastActivityAt)}</Prop>
          </dl>
        </PreviewShell>
      )}
    />
  );
}

export function QuotesIndex() {
  const { world, pack } = useShell();
  const until = (iso: string) => new Date(iso).getTime() - Date.now();
  const lastActivity = (q: Quote) => q.acceptedAt ?? q.sentAt ?? q.approval?.decidedAt ?? q.approval?.requestedAt ?? q.createdAt;
  /** HubSpot tracks e-signature progress apart from the quote status. Quotes accepted another way are "Not applicable". */
  const signing = (q: Quote) => {
    if ((world.ui[`q.${q.id}.accept`] ?? "esign") !== "esign") return "Not applicable";
    return q.status === "Accepted" ? "Signed" : q.status === "Sent" ? "Pending signature" : "Not applicable";
  };
  const columns: Column<Quote>[] = [
    {
      id: "title",
      label: "Quote",
      sort: (q) => q.number,
      cell: (q) => (
        <span className="flex items-center gap-2">
          <A to={`/quotes/${q.id}`} className="hs-link" data-testid={`link-${q.id}`}>
            {q.number}: {q.title}
          </A>
          {q.isNew ? <NewTag /> : null}
        </span>
      ),
    },
    { id: "status", label: "Status", cell: (q) => <QuoteStatus status={q.status} />, sort: (q) => quoteStatusLabel(q.status) },
    { id: "amount", label: "Quote amount", align: "right", cell: (q) => money(quoteTotals(q).total), sort: (q) => quoteTotals(q).total },
    { id: "company", label: "Company", cell: (q) => companyOf(world, q.companyId)?.name, sort: (q) => companyOf(world, q.companyId)?.name ?? "" },
    { id: "owner", label: "Quote owner", cell: (q) => ownerName(pack, q.ownerId), sort: (q) => ownerName(pack, q.ownerId) },
    { id: "created", label: "Create date", cell: (q) => date(q.createdAt), sort: (q) => q.createdAt },
    { id: "expires", label: "Expiration date", cell: (q) => date(q.validUntil), sort: (q) => q.validUntil },
  ];
  const views: View<Quote>[] = [
    { id: "all", label: "All quotes", filter: () => true },
    { id: "expiring", label: "Expiring soon", filter: (q) => q.status !== "Accepted" && until(q.validUntil) >= 0 && until(q.validUntil) <= WEEK },
    { id: "acceptance", label: "Pending acceptance", filter: (q) => q.status === "Sent" },
    { id: "approval", label: "Pending approval", filter: (q) => q.status === "Pending approval" },
  ];
  const statuses: Quote["status"][] = ["Draft", "Pending approval", "Changes requested", "Approved", "Sent", "Accepted"];
  const activity = [
    { value: "1", label: "Today" },
    { value: "7", label: "Last 7 days" },
    { value: "30", label: "Last 30 days" },
  ];
  const filters: Filter<Quote>[] = [
    { id: "status", label: "Status", options: statuses.map((v) => ({ value: v, label: quoteStatusLabel(v) })), test: (q, v) => q.status === v },
    { id: "activity", label: "Last activity date", options: activity, test: (q, v) => -until(lastActivity(q)) <= Number(v) * 86_400_000 },
    ownerFilter<Quote>(pack, (q) => q.ownerId),
    { id: "signing", label: "Signing status", options: ["Not applicable", "Pending signature", "Signed"].map((v) => ({ value: v, label: v })), test: (q, v) => signing(q) === v },
  ];
  return (
    <IndexPage
      title="Quotes"
      noun="quote"
      rows={world.quotes}
      columns={columns}
      views={views}
      filters={filters}
      countLabel={(count) => `${count} ${count === 1 ? "record" : "records"}`}
      searchLabel="Search"
      searchText={(q) => `${q.number} ${q.title} ${companyOf(world, q.companyId)?.name ?? ""}`}
      rowKey={(q) => q.id}
      isNew={(q) => Boolean(q.isNew)}
    />
  );
}

export function TasksIndex() {
  const { world, pack, persona, dispatch } = useShell();
  const columns: Column<Task>[] = [
    {
      id: "title",
      label: "Title",
      sort: (t) => t.title,
      cell: (t) => (
        <span className="flex items-center gap-2.5">
          <button
            type="button"
            role="checkbox"
            aria-checked={t.status === "done"}
            aria-label={t.status === "done" ? "Mark as not done" : "Mark as done"}
            onClick={() => dispatch({ t: "task.toggle", id: t.id })}
            className={cx("inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border", t.status === "done" ? "border-[#0b5b2b] bg-[#0b5b2b] text-white" : "border-[#8a8a8a] bg-white hover:border-ink")}
          >
            {t.status === "done" ? <Icon name="check" size={12} strokeWidth={2.6} /> : null}
          </button>
          <span className={cx("font-semibold", t.status === "done" && "text-ink-muted line-through")}>{t.title}</span>
          {t.isNew ? <NewTag /> : null}
        </span>
      ),
    },
    { id: "type", label: "Type", cell: (t) => t.type, sort: (t) => t.type },
    { id: "priority", label: "Priority", cell: (t) => <Tag tone={t.priority === "High" ? "red" : t.priority === "Medium" ? "amber" : "neutral"}>{t.priority}</Tag>, sort: (t) => ["High", "Medium", "Low"].indexOf(t.priority) },
    {
      id: "associated",
      label: "Associated with",
      cell: (t) => {
        const contact = world.contacts.find((c) => c.id === t.contactId);
        const company = companyOf(world, t.companyId);
        return contact ? (
          <A to={`/contacts/${contact.id}`} className="hs-link">
            {contactName(contact)}
          </A>
        ) : company ? (
          <A to={`/companies/${company.id}`} className="hs-link">
            {company.name}
          </A>
        ) : (
          "--"
        );
      },
    },
    { id: "owner", label: "Assigned to", cell: (t) => ownerName(pack, t.ownerId), sort: (t) => ownerName(pack, t.ownerId) },
    { id: "due", label: "Due date", cell: (t) => <span className={cx(t.status === "open" && new Date(t.dueAt).getTime() < Date.now() && "font-semibold text-[#99201a]")}>{relative(t.dueAt)}</span>, sort: (t) => t.dueAt },
  ];
  const views: View<Task>[] = [
    { id: "mine", label: "My open tasks", filter: (t) => t.ownerId === persona.id && t.status === "open" },
    { id: "all", label: "All tasks", filter: () => true },
    { id: "done", label: "Completed", filter: (t) => t.status === "done" },
  ];
  return (
    <>
      <MarketingTaskBanner />
      <IndexPage title="Tasks" noun="task" rows={world.tasks} columns={columns} views={views} filters={[ownerFilter<Task>(pack, (t) => t.ownerId)]} searchText={(t) => t.title} rowKey={(t) => t.id} isNew={(t) => Boolean(t.isNew)} initialSort={{ id: "due", dir: 1 }} />
    </>
  );
}

export function ProductsIndex() {
  const { pack } = useShell();
  const families = [...new Set(pack.products.map((p) => p.family))];
  const columns: Column<Product>[] = [
    { id: "name", label: "Name", cell: (p) => <span className="font-semibold">{p.name}</span>, sort: (p) => p.name },
    { id: "sku", label: "SKU", cell: (p) => <span className="font-mono text-[12.5px]">{p.sku}</span>, sort: (p) => p.sku },
    { id: "family", label: "Product family", cell: (p) => p.family, sort: (p) => p.family },
    { id: "price", label: "Unit price", align: "right", cell: (p) => money(p.price), sort: (p) => p.price },
    { id: "cost", label: "Unit cost", align: "right", cell: (p) => money(p.cost), sort: (p) => p.cost },
    { id: "lead", label: labelsOf(pack).pack.timing, align: "right", cell: (p) => timingOf(p), sort: (p) => p.leadDays },
  ];
  return (
    <IndexPage
      title="Product library"
      noun="product"
      rows={pack.products}
      columns={columns}
      views={[{ id: "all", label: "All products", filter: () => true }]}
      filters={[{ id: "family", label: "Product family", options: families.map((v) => ({ value: v, label: v })), test: (p, v) => p.family === v }]}
      searchText={(p) => `${p.name} ${p.sku} ${p.family}`}
      rowKey={(p) => p.sku}
    />
  );
}

export function WorkflowsIndex() {
  const { pack } = useShell();
  const columns: Column<Workflow>[] = [
    {
      id: "name",
      label: "Name",
      sort: (w) => w.name,
      cell: (w) =>
        w.trunk ? (
          <A to={`/workflows/${w.id}`} className="hs-link" data-testid={`link-${w.id}`}>
            {w.name}
          </A>
        ) : (
          <span className="font-semibold">{w.name}</span>
        ),
    },
    { id: "object", label: "Object type", cell: (w) => w.object, sort: (w) => w.object },
    { id: "status", label: "Status", cell: (w) => <Tag tone={statusTone(w.status)}>{w.status}</Tag>, sort: (w) => w.status },
    { id: "enrolled", label: "Enrolled total", align: "right", cell: (w) => num(w.enrolled), sort: (w) => w.enrolled },
    { id: "description", label: "Description", cell: (w) => <span className="text-ink-muted">{w.description}</span> },
    { id: "updated", label: "Last updated", cell: (w) => date(w.updatedAt), sort: (w) => w.updatedAt },
  ];
  return (
    <IndexPage
      title="Workflows"
      noun="workflow"
      rows={pack.workflows}
      columns={columns}
      views={[
        { id: "all", label: "All workflows", filter: () => true },
        { id: "on", label: "On", filter: (w) => w.status === "On" },
      ]}
      searchText={(w) => `${w.name} ${w.description}`}
      rowKey={(w) => w.id}
    />
  );
}
