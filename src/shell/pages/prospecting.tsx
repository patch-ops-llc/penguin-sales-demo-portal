"use client";

import { useEffect, useState } from "react";
import { useSeen, useShell } from "@/store/store";
import { nowMs } from "@/lib/format";
import type { ProspectSignal } from "@/verticals/types";
import { Ext } from "../ext";
import { relative } from "../format";
import { Icon, Sparkle } from "../icons";
import { A, AiPill, Avatar, Button, Card, colorFor, cx, Empty, LineTabs, Tag } from "../ui";
import { companyOf } from "./lists";

type TabId = "signals" | "why" | "group" | "outreach";
const TYPE_MS = 1200;

/** Breeze Prospecting Agent: flagged accounts, why now, the buying group, and outreach drafts to approve. */
export function ProspectingPage() {
  const { world, pack, demo, dispatch } = useShell();
  const isPql = demo === "pql-trial-prospecting" && Boolean(pack.demos.pqlTrial);
  const config = isPql ? pack.demos.pqlTrial!.prospecting : pack.demos.aiProspecting;
  const signals = isPql ? [pack.demos.pqlTrial!.signal, ...pack.signals] : pack.signals;
  const accountId = world.ui["prospecting.account"];
  const signal = signals.find((s) => s.companyId === accountId);
  const company = accountId ? companyOf(world, accountId) : undefined;
  const isHero = accountId === config.companyId;
  const tab = (world.ui["prospecting.tab"] as TabId | undefined) ?? "signals";

  useSeen(isPql ? "pql.signal" : "ap.signal", isHero);
  useSeen("ap.whyNow", !isPql && isHero && tab === "why");
  useSeen(isPql ? "pql.group" : "ap.group", isHero && tab === "group");

  return (
    <div className="grid h-full grid-cols-[340px_minmax(0,1fr)]" data-testid="prospecting-page">
      <aside className="hs-scroll overflow-y-auto border-r border-line bg-white">
        <header className="border-b border-line-soft px-4 py-3.5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-breeze-soft text-breeze">
              <Sparkle size={15} />
            </span>
            <h1 className="text-[16px] font-semibold">Prospecting Agent</h1>
          </div>
          <p className="mt-1.5 text-[12.5px] text-ink-muted">Breeze watches your accounts and flags the ones showing buying signals.</p>
        </header>
        <p className="px-4 pb-1 pt-3 text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Flagged accounts · {signals.length}</p>
        <ul>
          {signals.map((s) => {
            const c = companyOf(world, s.companyId);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  data-testid={`ap-account-${s.companyId}`}
                  onClick={() => dispatch([{ t: "ui", k: "prospecting.account", v: s.companyId }])}
                  className={cx("block w-full border-b border-line-soft px-4 py-3 text-left hover:bg-[#f7f7f7]", accountId === s.companyId && "bg-breeze-soft")}
                >
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[13.5px] font-semibold">{c?.name ?? s.companyId}</span>
                    <Tag tone={s.strength === "High" ? "red" : "neutral"} className="ml-auto">
                      {s.strength}
                    </Tag>
                  </span>
                  <span className="mt-0.5 block truncate text-[13px]">{s.title}</span>
                  <span className="mt-0.5 block truncate text-[12px] text-ink-muted">
                    {s.source} · {relative(s.at)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="hs-scroll min-w-0 overflow-y-auto px-6 py-5">
        {!signal || !company ? (
          <Card>
            <Empty title="Pick an account">Open a flagged account to see why it surfaced and who to reach.</Empty>
          </Card>
        ) : (
          <div className="mx-auto max-w-[980px]">
            <header className="flex items-center gap-3">
              <Avatar name={company.name} color={colorFor(company.id)} size={40} />
              <div className="min-w-0">
                <h2 className="text-[19px] font-semibold">
                  <A to={`/companies/${company.id}`} className="hs-link" data-testid="ap-company-link">
                    {company.name}
                  </A>
                </h2>
                <p className="text-[12.5px] text-ink-muted">
                  {company.industry} · {company.city}, {company.state}
                </p>
              </div>
              <Tag tone={signal.strength === "High" ? "red" : "neutral"} className="ml-auto">
                {signal.strength} intent
              </Tag>
            </header>

            {isHero ? (
              <>
                <LineTabs<TabId>
                  className="mt-4"
                  value={tab}
                  onChange={(id) => dispatch([{ t: "ui", k: "prospecting.tab", v: id }])}
                  tabs={[
                    { id: "signals", label: "Signals", testId: "ap-tab-signals" },
                    { id: "why", label: "Why now", testId: "ap-tab-why" },
                    { id: "group", label: "Buying group", testId: "ap-tab-group" },
                    { id: "outreach", label: "Outreach", testId: "ap-tab-outreach" },
                  ]}
                />
                <div className="mt-4">
                  {tab === "signals" ? <HeroSignals signal={signal} /> : null}
                  {tab === "why" ? <WhyNow /> : null}
                  {tab === "group" ? <BuyingGroup /> : null}
                  {tab === "outreach" ? <Outreach /> : null}
                </div>
              </>
            ) : (
              <div className="mt-4">
                <SignalCard signal={signal} />
                <p className="mt-3 text-[13px] text-ink-muted">
                  The agent has not researched this account yet.{" "}
                  <A to={`/companies/${company.id}`} className="hs-link">
                    Open the company record
                  </A>
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function SignalCard({ signal }: { signal: ProspectSignal }) {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f1f7f7] text-link">
          <Icon name="lifecycle" size={16} />
        </span>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold">{signal.title}</p>
          <p className="mt-0.5 text-[13.5px]">{signal.summary}</p>
          <p className="mt-1.5 text-[12px] text-ink-muted">
            {signal.source} · {relative(signal.at)}
          </p>
        </div>
      </div>
    </Card>
  );
}

function HeroSignals({ signal }: { signal: ProspectSignal }) {
  const { pack, demo } = useShell();
  const isPql = demo === "pql-trial-prospecting" && Boolean(pack.demos.pqlTrial);
  const detail = (isPql ? pack.demos.pqlTrial!.prospecting : pack.demos.aiProspecting).signalDetail;
  // Without the detail, the flagged signal itself is the fed-in one.
  if (!detail) {
    return (
      <div data-testid="ap-signals">
        <Ext id="erp-signal">
          <SignalCard signal={signal} />
        </Ext>
      </div>
    );
  }
  const max = Math.max(...detail.fed.bars.map((bar) => bar.value), 1);
  return (
    <div className="grid gap-4 lg:grid-cols-2" data-testid="ap-signals">
      <Ext id={detail.fed.extId ?? "erp-signal"}>
        <Card title={detail.fed.title} right={<Tag tone="blue">{detail.fed.source}</Tag>} testId="ap-erp-signal">
          <p className="text-[13.5px]">{detail.fed.detail}</p>
          <div className="mt-4 space-y-2.5">
            {detail.fed.bars.map((bar) => (
              <div key={bar.label}>
                <div className="flex justify-between text-[12.5px]">
                  <span className="text-ink-muted">{bar.label}</span>
                  <span className="font-semibold">
                    {bar.value} {bar.unit}
                  </span>
                </div>
                <div className="mt-1 h-2.5 rounded-full bg-[#eef1f4]">
                  <div className={cx("h-2.5 rounded-full", bar.now ? "bg-hs-orange" : "bg-[#b6c7d6]")} style={{ width: `${(bar.value / max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12px] text-ink-muted">
            {detail.fed.footnote} Updated {relative(signal.at).toLowerCase()}.
          </p>
        </Card>
      </Ext>
      <Card title={detail.native.title} right={<Tag>{detail.native.source}</Tag>}>
        <p className="text-[13.5px]">{detail.native.detail}</p>
        <p className="mt-3 text-[12px] text-ink-muted">{detail.native.footnote}</p>
      </Card>
    </div>
  );
}

function WhyNow() {
  const { pack, demo, dispatch } = useShell();
  const isPql = demo === "pql-trial-prospecting" && Boolean(pack.demos.pqlTrial);
  const { whyNow } = isPql ? pack.demos.pqlTrial!.prospecting : pack.demos.aiProspecting;
  return (
    <Card testId="ap-why">
      <div className="flex items-center gap-2">
        <AiPill />
        <span className="text-[12px] text-ink-muted">Summary by Breeze</span>
      </div>
      <p className="mt-3 text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Reason To Reach Out</p>
      <p className="mt-1 text-[16px] font-semibold leading-snug">{whyNow.headline}</p>
      <p className="mt-4 text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Signals Summary</p>
      <ul className="mt-1 divide-y divide-line-soft">
        {whyNow.points.map((p) => (
          <li key={p.label} className="flex items-start gap-4 py-3">
            <span className="w-36 shrink-0 text-[13px] font-semibold">{p.label}</span>
            <span className="min-w-0 flex-1 text-[13.5px]">{p.detail}</span>
            <Tag>{p.source}</Tag>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <Button variant="secondary" size="sm" data-testid="ap-see-group" onClick={() => dispatch([{ t: "ui", k: "prospecting.tab", v: "group" }])}>
          See the buying group
        </Button>
      </div>
    </Card>
  );
}

function BuyingGroup() {
  const { pack, world, demo, dispatch } = useShell();
  const isPql = demo === "pql-trial-prospecting" && Boolean(pack.demos.pqlTrial);
  const { buyingGroup } = isPql ? pack.demos.pqlTrial!.prospecting : pack.demos.aiProspecting;
  const apState = isPql ? world.pql : world.ap;
  return (
    <Card testId="ap-group" pad={false}>
      <ul className="divide-y divide-line-soft">
        {buyingGroup.map((m) => {
          const contactId = m.contactId ?? (apState.sent ? `ct-${m.id}` : null);
          return (
            <li key={m.id} className="flex items-center gap-3 px-5 py-3.5">
              <Avatar name={m.name} color={colorFor(m.email)} size={34} />
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold">
                  {contactId ? (
                    <A to={`/contacts/${contactId}`} className="hs-link">
                      {m.name}
                    </A>
                  ) : (
                    m.name
                  )}
                  <span className="ml-2 font-normal text-ink-muted">{m.title}</span>
                </p>
                <p className="mt-0.5 text-[12.5px] text-ink-muted">{m.why}</p>
              </div>
              <Tag tone="blue">{m.role}</Tag>
              {m.contactId ? <Tag>In your CRM</Tag> : <Tag tone="pink">Found by Breeze</Tag>}
            </li>
          );
        })}
      </ul>
      <div className="border-t border-line-soft px-5 py-3">
        <Button variant="breeze" size="sm" data-testid="ap-go-outreach" onClick={() => dispatch([{ t: "ui", k: "prospecting.tab", v: "outreach" }])}>
          <Sparkle size={13} />
          Draft outreach for this group
        </Button>
      </div>
    </Card>
  );
}

/** Reveals text over a fixed time, as a draft being written. A click shows the rest at once. */
function Typed({ text, onDone }: { text: string; onDone: () => void }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const count = Math.min(text.length, Math.ceil(((now - start) / TYPE_MS) * text.length));
      setShown(count);
      if (count >= text.length) onDone();
      else frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [text, onDone]);
  return (
    <button type="button" onClick={onDone} title="Click to show the full draft" data-testid="ap-typing" className="block min-h-[236px] w-full whitespace-pre-wrap rounded-[6px] border border-line bg-white px-3 py-2.5 text-left text-[13.5px] leading-relaxed">
      {text.slice(0, shown)}
      <span className="ml-0.5 inline-block h-[15px] w-[2px] translate-y-[2px] bg-breeze" />
    </button>
  );
}

function Outreach() {
  const { pack, world, demo, dispatch, navigate } = useShell();
  const isPql = demo === "pql-trial-prospecting" && Boolean(pack.demos.pqlTrial);
  const config = isPql ? pack.demos.pqlTrial!.prospecting : pack.demos.aiProspecting;
  const { drafted, version, edits, sent, meetingBooked } = isPql ? world.pql : world.ap;
  const [memberId, setMemberId] = useState(config.buyingGroup[0].id);
  // Set by the Draft and Regenerate buttons, so the writing effect plays once and never on a return visit.
  const [typing, setTyping] = useState<string | null>(null);
  const member = config.buyingGroup.find((m) => m.id === memberId) ?? config.buyingGroup[0];
  const draft = config.drafts[member.id][version];
  const tones = config.drafts[config.buyingGroup[0].id].map((d) => d.tone);
  const body = edits[member.id] ?? draft.body;
  const typingKey = `${member.id}:${version}`;
  const found = config.buyingGroup.filter((m) => !m.contactId).length;
  const pqlArg = isPql ? { pql: true as const } : {};

  if (!drafted) {
    return (
      <Card testId="ap-outreach-empty">
        <div className="flex flex-col items-center px-6 py-8 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-breeze-soft text-breeze">
            <Sparkle size={20} />
          </span>
          <p className="mt-3 text-[15px] font-semibold">Draft a first email for each person in the buying group</p>
          <p className="mt-1 max-w-[460px] text-[13px] text-ink-muted">Breeze writes each one from the signals on this account. Nothing is sent until you approve it.</p>
          <Button
            variant="breeze"
            className="mt-4"
            data-testid="ap-draft"
            onClick={() => {
              setTyping(`${member.id}:${version}`);
              dispatch([{ t: "ap.draft", ...pqlArg }]);
            }}
          >
            <Sparkle size={14} />
            Draft outreach
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div data-testid="ap-outreach">
      {sent ? (
        <div className="mb-4 flex items-start gap-3 rounded-[8px] border border-[#bfe3cd] bg-[#f0faf4] px-4 py-3" data-testid="ap-sent">
          <span className="mt-0.5 text-[#0b7a3b]">
            <Icon name="check" size={18} />
          </span>
          <div className="text-[13.5px]">
            <p className="font-semibold">{config.buyingGroup.length} emails sent and logged</p>
            <p className="mt-0.5 text-ink-muted">
              {found === 1 ? "1 new contact was" : `${found} new contacts were`} created and a follow-up task is due in {config.followUp.dueInDays} days.{" "}
              <A to={`/companies/${config.companyId}`} className="hs-link" data-testid="ap-view-company">
                View the company timeline
              </A>
              {" · "}
              <A to="/tasks" className="hs-link">
                View tasks
              </A>
            </p>
            {config.offPlatformMeeting || config.reportId ? (
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                {config.offPlatformMeeting ? (
                  <Button variant="primary" size="sm" data-testid="ap-open-offplatform" onClick={() => navigate("/offplatform/prospect-meeting")}>
                    {meetingBooked
                      ? (config.offPlatformMeeting.bookedButtonLabel ?? "View booked lunch-and-learn")
                      : (config.offPlatformMeeting.openButtonLabel ?? "Open practice inbox & book meeting")}{" "}
                    <Icon name="arrowRight" size={14} />
                  </Button>
                ) : null}
                {config.reportId ? (
                  <Button variant="secondary" size="sm" data-testid="ap-open-report" onClick={() => navigate(`/reports/${config.reportId}`)}>
                    {config.reportLabel ?? config.reportButtonLabel ?? "View referral volume report"}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-[240px_minmax(0,1fr)] overflow-hidden rounded-[10px] border border-line bg-white">
        <ul className="border-r border-line-soft">
          {config.buyingGroup.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                data-testid={`ap-member-${m.id}`}
                onClick={() => {
                  setMemberId(m.id);
                  setTyping(null);
                }}
                className={cx("flex w-full items-center gap-2.5 border-b border-line-soft px-3.5 py-3 text-left hover:bg-[#f7f7f7]", m.id === member.id && "bg-breeze-soft")}
              >
                <Avatar name={m.name} color={colorFor(m.email)} size={28} />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold">{m.name}</span>
                  <span className="block truncate text-[12px] text-ink-muted">{m.role}</span>
                </span>
                {edits[m.id] !== undefined ? <Tag className="ml-auto">Edited</Tag> : null}
              </button>
            </li>
          ))}
        </ul>

        <div className="min-w-0 px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <AiPill />
            <Tag tone={sent ? "green" : "amber"}>{sent ? "Email Sent" : "Ready for Review"}</Tag>
            <span className="text-[12px] text-ink-muted">Sample output prepared for this demo</span>
            {!sent ? (
              <div className="ml-auto flex items-center gap-1.5">
                <span className="text-[12px] text-ink-muted">Tone</span>
                {tones.map((tone, i) => (
                  <button
                    key={tone}
                    type="button"
                    data-testid={`ap-tone-${i}`}
                    onClick={() => {
                      if (i === version) return;
                      setTyping(`${member.id}:${i}`);
                      dispatch([{ t: "ap.version", v: i, ...pqlArg }]);
                    }}
                    className={cx("h-7 rounded-full border px-2.5 text-[12px] font-semibold", i === version ? "border-breeze bg-breeze-soft text-breeze" : "border-line text-ink hover:bg-[#f7f7f7]")}
                  >
                    {tone}
                  </button>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  icon="refresh"
                  data-testid="ap-regenerate"
                  onClick={() => {
                    const next = (version + 1) % tones.length;
                    setTyping(`${member.id}:${next}`);
                    dispatch([{ t: "ap.version", v: next, ...pqlArg }]);
                  }}
                >
                  Regenerate
                </Button>
              </div>
            ) : null}
          </div>

          <dl className="mt-3 space-y-1 text-[13px]">
            <div className="flex gap-2">
              <dt className="w-14 shrink-0 text-ink-muted">To</dt>
              <dd className="truncate">
                {member.name} &lt;{member.email}&gt;
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-14 shrink-0 text-ink-muted">Subject</dt>
              <dd className="truncate font-semibold" data-testid="ap-subject">
                {draft.subject}
              </dd>
            </div>
          </dl>

          <div className="mt-3">
            {typing === typingKey ? (
              <Typed key={typingKey} text={draft.body} onDone={() => setTyping(null)} />
            ) : (
              <textarea
                aria-label={`Email to ${member.name}`}
                data-testid="ap-body"
                value={body}
                readOnly={sent}
                onChange={(e) => dispatch([{ t: "ap.edit", memberId: member.id, text: e.target.value, ...pqlArg }])}
                className={cx("block min-h-[236px] w-full resize-y rounded-[6px] border border-line px-3 py-2.5 text-[13.5px] leading-relaxed outline-none focus:border-link", sent && "bg-[#fafafa] text-ink-muted")}
              />
            )}
          </div>

          {!sent ? (
            <div className="mt-4 flex items-center gap-3">
              <Button variant="primary" icon="send" data-testid="ap-send" onClick={() => dispatch([{ t: "ap.send", at: nowMs(), ...pqlArg }])}>
                Approve and send all {config.buyingGroup.length}
              </Button>
              <span className="text-[12.5px] text-ink-muted">You can edit any draft before it goes out.</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
