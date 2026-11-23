"use client";

import { nowMs } from "@/lib/format";
import { useState } from "react";
import { ErpCard } from "@/demos/back-office/erp-card";
import { GuidedSellingPanel } from "@/demos/guided-quote/panel";
import { WhyThisScoreCard } from "@/demos/lead-capture/score-card";
import { quoteStatusLabel, quoteTotals } from "@/store/quote-math";
import { useSeen, useShell } from "@/store/store";
import { fill, labelsOf } from "@/verticals/labels";
import type { Activity, ActivityType } from "@/verticals/types";
import { Ext } from "../ext";
import { date, dateTime, money, num, relative } from "../format";
import { Icon, type IconName } from "../icons";
import { A, Avatar, Button, Card, colorFor, cx, Empty, Modal, Prop, statusTone, Tabs, Tag } from "../ui";
import { IcpMatchCard, MarketingContactBanner, MarketingDealBanner } from "../marketing/lazy";
import { DealQuotesCard } from "../quote/deal-quotes";
import { CampaignAttributionCard, FollowupAutomationBanner } from "../social/attribution-card";
import { companyOf, contactName, ownerName, stageOf } from "./lists";

const ACTIVITY_ICON: Record<ActivityType, IconName> = { note: "note", email: "email", call: "call", meeting: "meeting", task: "task", form: "form", quote: "quote", deal: "deal", workflow: "workflow", lifecycle: "lifecycle", sync: "sync", chat: "chat" };
const ACTIVITY_FILTERS: { id: string; label: string; types: ActivityType[] }[] = [
  { id: "all", label: "All activity", types: [] },
  { id: "notes", label: "Notes", types: ["note"] },
  { id: "emails", label: "Emails", types: ["email"] },
  { id: "calls", label: "Calls", types: ["call", "meeting"] },
  { id: "tasks", label: "Tasks", types: ["task"] },
  { id: "quotes", label: "Quotes", types: ["quote"] },
];

type Ids = { contactIds: string[]; companyIds: string[]; dealIds: string[] };

function TimelineItem({ activity }: { activity: Activity }) {
  const { pack } = useShell();
  const by = pack.personas.find((p) => p.id === activity.byId);
  return (
    <li className="rounded-[10px] border border-line bg-white px-4 py-3" data-testid="timeline-item">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ececec] text-ink">
          <Icon name={ACTIVITY_ICON[activity.type]} size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[13.5px] font-semibold">{activity.title}</p>
            <p className="shrink-0 text-[12px] text-ink-muted" title={dateTime(activity.at)}>
              {relative(activity.at)}
            </p>
          </div>
          {activity.body ? <p className="mt-0.5 whitespace-pre-line text-[13px] leading-snug text-ink-muted">{activity.body}</p> : null}
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[12.5px]">
            {by ? <span className="text-ink-muted">by {by.name}</span> : null}
            {activity.attachment ? (
              <span className="inline-flex items-center gap-1 rounded-[5px] border border-line-soft bg-[#fafafa] px-2 py-0.5">
                <Icon name="paperclip" size={12} /> {activity.attachment}
              </span>
            ) : null}
            {activity.linkPath ? (
              <A to={activity.linkPath} className="hs-link" data-testid="timeline-link">
                {activity.linkLabel ?? "View"}
              </A>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}

function Timeline({ match, limit }: { match: (a: Activity) => boolean; limit?: number }) {
  const { world } = useShell();
  const [filter, setFilter] = useState("all");
  const types = ACTIVITY_FILTERS.find((f) => f.id === filter)?.types ?? [];
  const all = world.activities.filter(match).sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
  const shown = all.filter((a) => types.length === 0 || types.includes(a.type));
  return (
    <div data-testid="timeline">
      {limit ? null : (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {ACTIVITY_FILTERS.map((f) => (
            <button key={f.id} type="button" onClick={() => setFilter(f.id)} className={cx("h-7 rounded-full border px-3 text-[12.5px]", f.id === filter ? "border-ink bg-ink font-semibold text-white" : "border-line bg-white hover:border-ink")}>
              {f.label}
            </button>
          ))}
        </div>
      )}
      {shown.length === 0 ? (
        <Card>
          <Empty title="No activity yet">Notes, emails, calls, and updates for this record appear here.</Empty>
        </Card>
      ) : (
        <ul className="space-y-2">
          {(limit ? shown.slice(0, limit) : shown).map((a) => (
            <TimelineItem key={a.id} activity={a} />
          ))}
        </ul>
      )}
    </div>
  );
}

const LOG_KINDS = [
  { kind: "note", label: "Note", icon: "note", title: "Create a note", placeholder: "Start typing to leave a note..." },
  { kind: "email", label: "Email", icon: "email", title: "Log an email", placeholder: "Describe the email..." },
  { kind: "call", label: "Call", icon: "call", title: "Log a call", placeholder: "Describe the call..." },
  { kind: "task", label: "Task", icon: "task", title: "Create a task", placeholder: "What needs to be done?" },
  { kind: "meeting", label: "Meeting", icon: "meeting", title: "Log a meeting", placeholder: "Describe the meeting..." },
] as const;

function ActionRow({ ids }: { ids: Ids }) {
  const { dispatch } = useShell();
  const [open, setOpen] = useState<(typeof LOG_KINDS)[number] | null>(null);
  const [text, setText] = useState("");
  const close = () => {
    setOpen(null);
    setText("");
  };
  return (
    <>
      <div className="mt-3 flex justify-between px-1">
        {LOG_KINDS.map((k) => (
          <button key={k.kind} type="button" onClick={() => setOpen(k)} className="group flex flex-col items-center gap-1 text-[11.5px] text-ink-muted hover:text-ink" data-testid={`action-${k.kind}`}>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white group-hover:border-ink">
              <Icon name={k.icon} size={16} />
            </span>
            {k.label}
          </button>
        ))}
      </div>
      {open ? (
        <Modal
          title={open.title}
          onClose={close}
          width={480}
          footer={
            <>
              <Button onClick={close}>Cancel</Button>
              <Button
                variant="primary"
                disabled={!text.trim()}
                data-testid="log-save"
                onClick={() => {
                  dispatch({ t: "log", kind: open.kind, text: text.trim(), ...ids, at: nowMs() });
                  close();
                }}
              >
                Save
              </Button>
            </>
          }
        >
          <textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder={open.placeholder} rows={5} data-testid="log-text" className="w-full resize-none rounded-[6px] border border-line p-3 text-[13.5px] focus:border-ink focus:outline-none" />
          <p className="mt-2 text-[12px] text-ink-muted">Saved to this demo session only.</p>
        </Modal>
      ) : null}
    </>
  );
}

function RecordLayout({
  back,
  badge,
  title,
  subtitle,
  ids,
  about,
  tabs,
  tab,
  onTab,
  children,
  right,
}: {
  back: { to: string; label: string };
  badge: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  ids: Ids;
  about: React.ReactNode;
  tabs: { id: string; label: React.ReactNode; testId?: string }[];
  tab: string;
  onTab: (id: string) => void;
  children: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <div className="grid min-h-full grid-cols-[300px_minmax(0,1fr)_300px]" data-testid="record">
      <aside className="border-r border-line bg-white px-4 py-4">
        <A to={back.to} className="inline-flex items-center gap-1 text-[13px] font-semibold text-link hover:underline" data-testid="record-back">
          <Icon name="chevronLeft" size={14} /> {back.label}
        </A>
        <div className="mt-3 flex items-start gap-3">
          {badge}
          <div className="min-w-0">
            <h1 className="text-[18px] font-semibold leading-snug" data-testid="record-title">
              {title}
            </h1>
            {subtitle ? <div className="mt-0.5 text-[13px] text-ink-muted">{subtitle}</div> : null}
          </div>
        </div>
        <ActionRow ids={ids} />
        <div className="mt-4 border-t border-line-soft pt-3">{about}</div>
      </aside>
      <div className="min-w-0 px-5 py-4">
        <Tabs tabs={tabs} value={tab} onChange={onTab} />
        <div className="pt-4">{children}</div>
      </div>
      <aside className="space-y-3 border-l border-line bg-[#f7f7f7] px-3 py-4">{right}</aside>
    </div>
  );
}

function AboutSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-2">
      <h2 className="text-[13px] font-semibold">{title}</h2>
      <dl className="mt-1">{children}</dl>
    </section>
  );
}

function Assoc({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <Card title={`${title} (${count})`}>
      {count === 0 ? <p className="text-[12.5px] text-ink-muted">None associated with this record.</p> : <div className="space-y-2.5">{children}</div>}
    </Card>
  );
}

function AssocRow({ to, title, lines, testId }: { to: string; title: string; lines: React.ReactNode[]; testId?: string }) {
  return (
    <div className="rounded-[8px] border border-line-soft px-3 py-2">
      <A to={to} className="hs-link text-[13.5px]" data-testid={testId}>
        {title}
      </A>
      {lines.filter(Boolean).map((line, i) => (
        <p key={i} className="mt-0.5 truncate text-[12.5px] text-ink-muted">
          {line}
        </p>
      ))}
    </div>
  );
}

function NotFound({ noun, to }: { noun: string; to: string }) {
  return (
    <div className="p-10">
      <Card>
        <Empty title={`This ${noun} is not in the demo`}>
          It may belong to a step that has not happened yet, or the demo was reset.{" "}
          <A to={to} className="hs-link">
            Go to all {noun}s
          </A>
        </Empty>
      </Card>
    </div>
  );
}

function useTab(recordId: string, fallback = "overview"): [string, (id: string) => void] {
  const { world, dispatch } = useShell();
  return [world.ui[`tab.${recordId}`] ?? fallback, (id) => dispatch({ t: "ui", k: `tab.${recordId}`, v: id })];
}

export function ContactRecord({ id }: { id: string }) {
  const { world, pack, demo, dispatch, navigate } = useShell();
  const contact = world.contacts.find((c) => c.id === id);
  const [tab, setTabRaw] = useTab(id);
  const isSocialLead = Boolean(contact && world.sa.contactId === id);
  const setTab = (next: string) => {
    setTabRaw(next);
    if (isSocialLead && next === "activities" && !world.sa.contactSeen) dispatch({ t: "sa.seenContact" });
  };
  useSeen("lc.contact", Boolean(contact && world.lc?.contactId === id));
  if (!contact) return <NotFound noun="contact" to="/contacts" />;
  const company = companyOf(world, contact.companyId);
  const deals = world.deals.filter((d) => d.contactIds.includes(id));
  const match = (a: Activity) => Boolean(a.contactIds?.includes(id));
  const name = contactName(contact);
  const showVoiceTimelineNext = demo === "customer-agent" && id === pack.demos.customerAgent?.voiceCase.contactId && world.ca.voiceUnlocked && !world.ca.timelineReviewed;

  return (
    <RecordLayout
      back={{ to: "/contacts", label: "Contacts" }}
      badge={<Avatar name={name} color={colorFor(id)} size={48} />}
      title={name}
      subtitle={
        <>
          {contact.title}
          {company ? ` at ${company.name}` : ""}
          <span className="block break-all">{contact.email}</span>
        </>
      }
      ids={{ contactIds: [id], companyIds: company ? [company.id] : [], dealIds: [] }}
      about={
        <AboutSection title="About this contact">
          <Prop label="Email">{contact.email}</Prop>
          <Prop label="Phone number">{contact.phone}</Prop>
          <Prop label="Job title">{contact.title}</Prop>
          <Prop label="Contact owner">{ownerName(pack, contact.ownerId)}</Prop>
          <Prop label="Lifecycle stage">{contact.lifecycle}</Prop>
          <Prop label="Lead status">{contact.leadStatus}</Prop>
          {contact.score !== undefined ? <Prop label="Lead score">{contact.score}</Prop> : null}
          {contact.score !== undefined ? <Prop label="Contact priority">{contact.score >= 80 ? "Very High" : contact.score >= 60 ? "High" : contact.score >= 40 ? "Medium" : "Low"}</Prop> : null}
          <Prop label="Original source">{contact.source}</Prop>
          {(contact.extra ?? []).map((e) => (
            <Prop key={e.label} label={e.label}>
              {e.value}
            </Prop>
          ))}
          <Prop label="Create date">{dateTime(contact.createdAt)}</Prop>
        </AboutSection>
      }
      tabs={[
        { id: "overview", label: "Overview", testId: "tab-overview" },
        { id: "activities", label: "Activities", testId: "tab-activities" },
      ]}
      tab={tab}
      onTab={setTab}
      right={
        <>
          <Assoc title="Companies" count={company ? 1 : 0}>
            {company ? <AssocRow to={`/companies/${company.id}`} title={company.name} lines={[company.domain, company.industry]} testId="assoc-company" /> : null}
          </Assoc>
          <Assoc title="Deals" count={deals.length}>
            {deals.map((d) => (
              <AssocRow key={d.id} to={`/deals/${d.id}`} title={d.name} lines={[`Amount: ${money(d.amount)}`, `Stage: ${stageOf(pack, d.stage)?.label}`]} />
            ))}
          </Assoc>
        </>
      }
    >
      {tab === "overview" ? (
        <div className="space-y-4">
          {showVoiceTimelineNext ? (
            <div className="flex items-center justify-between gap-3 rounded-[10px] border border-[#bfe3cd] bg-[#f0faf4] px-4 py-3 text-[13px]" data-testid="ca-timeline-banner">
              <p className="font-semibold text-[#0b5b2b]">Voice call transcribed and logged on {name}&apos;s HubSpot timeline.</p>
              <Button
                variant="primary"
                size="sm"
                data-testid="ca-continue-fraud"
                onClick={() => {
                  dispatch({ t: "ca.reviewTimeline" });
                  navigate("/service");
                }}
              >
                Continue to fraud escalation <Icon name="arrowRight" size={14} />
              </Button>
            </div>
          ) : null}
          <CampaignAttributionCard contactId={id} onOpenTimeline={() => setTab("activities")} />
          <MarketingContactBanner contactId={id} />
          <WhyThisScoreCard contact={contact} />
          <Card title="Data highlights">
            <dl className="grid grid-cols-3 gap-4">
              <Prop label="Create date">{date(contact.createdAt)}</Prop>
              <Prop label="Lifecycle stage">{contact.lifecycle}</Prop>
              <Prop label="Last activity date">{relative(contact.lastActivityAt)}</Prop>
            </dl>
          </Card>
          <div>
            <h3 className="mb-2 text-[14px] font-semibold">Recent activities</h3>
            <Timeline match={match} limit={6} />
          </div>
        </div>
      ) : (
        <>
          <FollowupAutomationBanner contactId={id} />
          <Timeline match={match} />
        </>
      )}
    </RecordLayout>
  );
}

export function CompanyRecord({ id }: { id: string }) {
  const { world, pack } = useShell();
  const company = companyOf(world, id);
  const [tab, setTab] = useTab(id);
  const config = pack.demos.backOffice;
  useSeen("bo.viewed", Boolean(company && id === config.companyId));
  useSeen("lc.company", Boolean(company && world.lc?.companyId === id && world.flags["lc.contact"]));
  if (!company) return <NotFound noun="company" to="/companies" />;
  const contacts = world.contacts.filter((c) => c.companyId === id);
  const deals = world.deals.filter((d) => d.companyId === id);
  const quotes = world.quotes.filter((q) => q.companyId === id);
  const match = (a: Activity) => Boolean(a.companyIds?.includes(id));
  const labels = labelsOf(pack).pack;
  const synced = (text: string) => fill(text, { backOffice: pack.terms.backOffice });

  return (
    <RecordLayout
      back={{ to: "/companies", label: "Companies" }}
      badge={
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] text-[18px] font-bold text-white" style={{ background: colorFor(id) }}>
          {company.name[0]}
        </span>
      }
      title={company.name}
      subtitle={company.domain}
      ids={{ contactIds: [], companyIds: [id], dealIds: [] }}
      about={
        <>
          {company.erp ? (
            <Ext id="erp-synced-fields" className="-mx-2 mb-3 rounded-[8px] bg-[#fafafa] px-2 py-2" pinClass="!right-2 !top-1.5">
              <AboutSection title={synced(labels.synced.title)}>
                <Prop label={synced(labels.synced.account)}>{company.erp.accountNumber}</Prop>
                <Prop label={synced(labels.synced.lastOrder)}>{date(company.erp.lastOrderDate)}</Prop>
                <Prop label={synced(labels.synced.openBalance)}>{money(company.erp.openBalance)}</Prop>
                <Prop label={synced(labels.synced.status)}>
                  <Tag tone={statusTone(company.erp.creditStatus)}>{company.erp.creditStatus}</Tag>
                </Prop>
              </AboutSection>
            </Ext>
          ) : null}
          <AboutSection title="About this company">
            <Prop label="Company domain name">{company.domain}</Prop>
            <Prop label="Industry">{company.industry}</Prop>
            <Prop label="Type">{company.type}</Prop>
            <Prop label="City">{`${company.city}, ${company.state}`}</Prop>
            <Prop label="Number of employees">{company.employees ? num(company.employees) : ""}</Prop>
            <Prop label="Annual revenue">{company.revenue ? money(company.revenue) : ""}</Prop>
            <Prop label="Phone number">{company.phone}</Prop>
            <Prop label="Company owner">{ownerName(pack, company.ownerId)}</Prop>
            <Prop label="Lifecycle stage">{company.lifecycle}</Prop>
            <Prop label={labels.territory}>{company.territory}</Prop>
            {(company.extra ?? []).map((e) => (
              <Prop key={e.label} label={e.label}>
                {e.value}
              </Prop>
            ))}
          </AboutSection>
        </>
      }
      tabs={[
        { id: "overview", label: "Overview", testId: "tab-overview" },
        { id: "activities", label: "Activities", testId: "tab-activities" },
      ]}
      tab={tab}
      onTab={setTab}
      right={
        <>
          <Assoc title="Contacts" count={contacts.length}>
            {contacts.map((c) => (
              <AssocRow key={c.id} to={`/contacts/${c.id}`} title={contactName(c)} lines={[c.title, c.email]} />
            ))}
          </Assoc>
          <Assoc title="Deals" count={deals.length}>
            {deals.map((d) => (
              <AssocRow key={d.id} to={`/deals/${d.id}`} title={d.name} lines={[`Amount: ${money(d.amount)}`, `Stage: ${stageOf(pack, d.stage)?.label}`]} />
            ))}
          </Assoc>
          <Assoc title="Quotes" count={quotes.length}>
            {quotes.map((q) => (
              <AssocRow key={q.id} to={`/quotes/${q.id}`} title={`${q.number}: ${q.title}`} lines={[`${quoteStatusLabel(q.status)} · ${money(quoteTotals(q).total)}`]} />
            ))}
          </Assoc>
        </>
      }
    >
      {tab === "overview" ? (
        <div className="space-y-4">
          {company.enrichedAt ? (
            <Card testId="enrichment-card">
              <p className="flex items-center gap-2 text-[13.5px]">
                <Icon name="sync" size={15} />
                <span className="font-semibold">Company enriched {relative(company.enrichedAt)}.</span>
                <span className="text-ink-muted">Industry, size, revenue, location, and description were filled from the company domain.</span>
              </p>
              {company.description ? <p className="mt-2 text-[13px] text-ink-muted">{company.description}</p> : null}
            </Card>
          ) : null}
          {id === config.companyId ? <ErpCard company={company} /> : null}
          <IcpMatchCard companyId={id} />
          {!company.enrichedAt && company.description ? (
            <Card title="About">
              <p className="text-[13.5px] text-ink-muted">{company.description}</p>
            </Card>
          ) : null}
          <div>
            <h3 className="mb-2 text-[14px] font-semibold">Recent activities</h3>
            <Timeline match={match} limit={5} />
          </div>
        </div>
      ) : (
        <Timeline match={match} />
      )}
    </RecordLayout>
  );
}

export function DealRecord({ id }: { id: string }) {
  const { world, pack, dispatch, navigate } = useShell();
  const deal = world.deals.find((d) => d.id === id);
  const gq = pack.demos.guidedQuote;
  const hero = id === gq.dealId;
  const [tab, setTabRaw] = useTab(id);
  const guidedQuote = world.quotes.find((q) => q.id === world.gq.quoteId);
  const emailThread = Object.entries(world.ed.deals).find(([, dealId]) => dealId === id)?.[0];
  useSeen("gq.dealSeen", Boolean(deal && hero && guidedQuote && guidedQuote.status !== "Draft"));
  useSeen("ed.dealSeen", Boolean(deal && emailThread));
  if (!deal) return <NotFound noun="deal" to="/deals" />;

  const setTab = (next: string) => dispatch([{ t: "ui", k: `tab.${id}`, v: next }, ...(hero && next === "guided" ? [{ t: "flag" as const, k: "gq.opened" }] : [])]);
  void setTabRaw;
  const company = companyOf(world, deal.companyId);
  const contacts = world.contacts.filter((c) => deal.contactIds.includes(c.id));
  const quotes = world.quotes.filter((q) => q.dealId === id);
  const stage = stageOf(pack, deal.stage);
  const open = pack.stages.filter((s) => !s.closed || s.id === deal.stage);
  const stageIndex = open.findIndex((s) => s.id === deal.stage);
  const match = (a: Activity) => Boolean(a.dealIds?.includes(id));
  const canQuoteFromEmail = emailThread && !world.ed.quotes[emailThread];
  const sourceFile = emailThread ? world.threads.find((t) => t.id === emailThread)?.attachment?.name : undefined;

  return (
    <RecordLayout
      back={{ to: "/deals", label: "Deals" }}
      badge={
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-[#ececec]">
          <Icon name="deal" size={22} />
        </span>
      }
      title={deal.name}
      subtitle={
        <>
          Amount: <span className="font-semibold text-ink" data-testid="deal-amount">{money(deal.amount)}</span>
          <span className="block">
            Stage: <span className="font-semibold text-ink" data-testid="deal-stage">{stage?.label}</span>
          </span>
        </>
      }
      ids={{ contactIds: deal.contactIds, companyIds: [deal.companyId], dealIds: [id] }}
      about={
        <AboutSection title="About this deal">
          <Prop label="Deal owner">{ownerName(pack, deal.ownerId)}</Prop>
          <Prop label="Amount">{money(deal.amount)}</Prop>
          <Prop label="Close date">{date(deal.closeDate)}</Prop>
          <Prop label="Pipeline">{labelsOf(pack).pack.pipeline}</Prop>
          <Prop label="Deal stage">{stage?.label}</Prop>
          <Prop label="Deal type">{deal.type}</Prop>
          <Prop label="Original source">{deal.source}</Prop>
          {emailThread ? <Prop label={`${pack.terms.request ?? "Request"} Source`}>Email</Prop> : null}
          {sourceFile ? <Prop label="Source File Name">{sourceFile}</Prop> : null}
          <Prop label="Create date">{dateTime(deal.createdAt)}</Prop>
        </AboutSection>
      }
      tabs={[
        { id: "overview", label: "Overview", testId: "tab-overview" },
        { id: "activities", label: "Activities", testId: "tab-activities" },
        ...(hero ? [{ id: "guided", label: "Guided quote", testId: "tab-guided" }] : []),
      ]}
      tab={tab}
      onTab={setTab}
      right={
        <>
          <Assoc title="Contacts" count={contacts.length}>
            {contacts.map((c) => (
              <AssocRow key={c.id} to={`/contacts/${c.id}`} title={contactName(c)} lines={[c.title, c.email]} />
            ))}
          </Assoc>
          <Assoc title="Companies" count={company ? 1 : 0}>
            {company ? <AssocRow to={`/companies/${company.id}`} title={company.name} lines={[company.domain]} /> : null}
          </Assoc>
          <DealQuotesCard deal={deal} quotes={quotes}>
            {canQuoteFromEmail ? (
              <Button
                size="sm"
                icon="plus"
                data-testid="deal-create-quote"
                onClick={() => {
                  dispatch({ t: "ed.createQuote", threadId: emailThread, at: nowMs() });
                  navigate(`/quotes/q-${emailThread}`);
                }}
              >
                Create quote
              </Button>
            ) : null}
          </DealQuotesCard>
        </>
      }
    >
      {tab === "guided" && hero ? (
        <GuidedSellingPanel />
      ) : tab === "activities" ? (
        <Timeline match={match} />
      ) : (
        <div className="space-y-4">
          <MarketingDealBanner dealId={id} />
          <Card>
            <ol className="flex gap-1" aria-label="Deal stage" data-testid="stage-bar">
              {open.map((s, i) => (
                <li key={s.id} className="min-w-0 flex-1">
                  <span className={cx("block h-2 rounded-full", i <= stageIndex ? (s.closed === "lost" ? "bg-[#99201a]" : "bg-[#1a9e4b]") : "bg-[#e4e4e4]")} />
                  <span className={cx("mt-1.5 block truncate text-[12px]", i === stageIndex ? "font-semibold" : "text-ink-muted")}>{s.label}</span>
                </li>
              ))}
            </ol>
          </Card>
          <Card title={`Line items (${deal.lineItems.length})`} pad={false} testId="deal-line-items">
            {deal.lineItems.length === 0 ? (
              <p className="px-4 pb-4 pt-2 text-[13px] text-ink-muted">
                No line items yet.{hero ? " Use the Guided quote tab to build them from the customer's requirements." : ""}
              </p>
            ) : (
              <table className="mt-2 w-full text-[13px]">
                <thead>
                  <tr className="border-y border-line-soft bg-[#fafafa] text-left text-[11.5px] uppercase tracking-wide text-ink-muted">
                    <th className="px-4 py-2 font-semibold">Name</th>
                    <th className="px-4 py-2 font-semibold">SKU</th>
                    <th className="px-4 py-2 text-right font-semibold">Quantity</th>
                    <th className="px-4 py-2 text-right font-semibold">Unit price</th>
                    <th className="px-4 py-2 text-right font-semibold">Net price</th>
                  </tr>
                </thead>
                <tbody>
                  {deal.lineItems.map((l, i) => (
                    <tr key={`${l.sku}-${i}`} className="border-b border-line-soft last:border-b-0">
                      <td className="px-4 py-2 font-semibold">{l.name}</td>
                      <td className="px-4 py-2 font-mono text-[12.5px]">{l.sku || "--"}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{l.qty}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{money(l.unitPrice)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{money(l.qty * l.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
          <div>
            <h3 className="mb-2 text-[14px] font-semibold">Recent activities</h3>
            <Timeline match={match} limit={5} />
          </div>
        </div>
      )}
    </RecordLayout>
  );
}
