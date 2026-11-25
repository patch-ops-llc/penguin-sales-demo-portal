"use client";

import { useState } from "react";
import type { HfAsset } from "@/store/slices/flows";
import { useShell } from "@/store/store";
import { dateTime, num } from "../format";
import { Icon } from "../icons";
import { A, Card, cx, Empty, Prop, Tag, type Tone } from "../ui";

const STATUS: Record<string, { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "neutral" },
  scheduled: { label: "Scheduled", tone: "amber" },
  live: { label: "Live", tone: "green" },
};

const KIND: Record<HfAsset["kind"], string> = { email: "Marketing email", landing: "Landing page", social: "Social post" };

function Asset({ asset }: { asset: HfAsset }) {
  const [open, setOpen] = useState(false);
  const st = STATUS[asset.status];
  return (
    <li className="px-4 py-3" data-testid={`campaign-asset-${asset.kind}`}>
      <div className="flex items-center gap-3">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#ececec]">
          <Icon name={asset.kind === "email" ? "email" : asset.kind === "landing" ? "form" : "megaphone"} size={15} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-semibold">{asset.title}</span>
          <span className="block text-[12px] text-ink-muted">
            {KIND[asset.kind]}
            {asset.channel ? ` · ${asset.channel}` : ""}
          </span>
        </span>
        <Tag tone={st.tone}>{st.label}</Tag>
        <button type="button" onClick={() => setOpen((o) => !o)} className="hs-link text-[12.5px]">
          {open ? "Hide" : "Preview"}
        </button>
      </div>
      {open ? <p className="mt-3 whitespace-pre-wrap rounded-[8px] border border-line-soft bg-[#fafafa] px-3 py-2.5 text-[13px] leading-[1.5]">{asset.body}</p> : null}
    </li>
  );
}

/** The campaign Claude created, as HubSpot shows it: segment, assets, schedule, and performance. */
export function CampaignPage({ id }: { id: string }) {
  const { world } = useShell();
  const c = world.hf.campaigns.find((x) => x.id === id);
  if (!c) {
    return (
      <div className="p-6">
        <Empty title="Campaign not found">
          <A to="/campaigns" className="hs-link">
            Back to campaigns
          </A>
        </Empty>
      </div>
    );
  }
  const segment = world.hf.segments.find((s) => s.id === c.segmentId);
  const st = STATUS[c.status];
  const submissions = world.activities.filter((a) => a.type === "form" && a.linkPath === `/campaigns/${c.id}`);
  const rate = (n: number, of: number) => (of > 0 ? `${((n / of) * 100).toFixed(1)}%` : "—");

  return (
    <div className="min-h-full bg-hs-bg" data-testid="campaign-page">
      <div className="border-b border-line bg-white px-6 py-4">
        <div className="mx-auto max-w-[1200px]">
          <A to="/campaigns" className="inline-flex items-center gap-1 text-[13px] font-semibold text-link hover:underline">
            <Icon name="chevronLeft" size={14} /> Campaigns
          </A>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-[22px] font-semibold tracking-tight" data-testid="campaign-name">
              {c.name}
            </h1>
            <Tag tone={st.tone} className="!h-6">
              {st.label}
            </Tag>
            <Tag tone="purple" className="!h-6">
              Created from Claude
            </Tag>
          </div>
          <p className="mt-1 max-w-[820px] text-[13px] text-ink-muted">{c.goal}</p>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1200px] gap-4 px-6 py-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card title="About this campaign">
            <Prop label="Status">{st.label}</Prop>
            <Prop label="Starts">{c.startsOn}</Prop>
            <Prop label="Channels">{c.channels.join(", ")}</Prop>
            <Prop label="Email send">{c.sendAt ?? "Not scheduled"}</Prop>
            <Prop label="Created">{dateTime(c.createdAt)}</Prop>
          </Card>
          <Card title="Audience" testId="campaign-segment">
            {segment ? (
              <>
                <p className="text-[13.5px] font-semibold">{segment.name}</p>
                <p className="mt-0.5 text-[12.5px] text-ink-muted">Active list · {num(segment.size)} contacts</p>
                <ul className="mt-2.5 space-y-1.5">
                  {segment.criteria.map((r) => (
                    <li key={r} className="flex items-start gap-1.5 text-[12.5px]">
                      <Icon name="check" size={13} className="mt-0.5 shrink-0 text-[#0b5b2b]" /> {r}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-[12.5px] text-ink-muted">No segment attached.</p>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card title={`Assets (${c.assets.length})`} pad={false} testId="campaign-assets">
            {c.assets.length === 0 ? <p className="px-4 pb-4 pt-2 text-[13px] text-ink-muted">No assets yet. Claude drafts them in the conversation; they land here on approval.</p> : <ul className="divide-y divide-line-soft">{c.assets.map((a) => <Asset key={a.id} asset={a} />)}</ul>}
          </Card>

          <Card title="Performance" testId="campaign-performance">
            {c.stats ? (
              <>
                <div className="grid grid-cols-5 gap-3">
                  {[
                    ["Sent", num(c.stats.sent), ""],
                    ["Delivered", num(c.stats.delivered), rate(c.stats.delivered, c.stats.sent)],
                    ["Opens", num(c.stats.opens), rate(c.stats.opens, c.stats.delivered)],
                    ["Clicks", num(c.stats.clicks), rate(c.stats.clicks, c.stats.delivered)],
                    ["Form submissions", num(c.stats.submissions), rate(c.stats.submissions, c.stats.clicks)],
                  ].map(([label, value, pct]) => (
                    <div key={label} className="rounded-[8px] border border-line-soft px-3 py-2.5">
                      <p className="text-[11.5px] text-ink-muted">{label}</p>
                      <p className="mt-0.5 text-[20px] font-semibold tabular-nums leading-tight">{value}</p>
                      {pct ? <p className="text-[11.5px] text-ink-muted">{pct}</p> : null}
                    </div>
                  ))}
                </div>
                <h4 className="mt-4 text-[12.5px] font-semibold uppercase tracking-wide text-ink-muted">Recent submissions</h4>
                <ul className="mt-2 divide-y divide-line-soft">
                  {submissions.map((a) => {
                    const contact = world.contacts.find((x) => a.contactIds?.includes(x.id));
                    const company = world.companies.find((x) => x.id === contact?.companyId);
                    return (
                      <li key={a.id} className="flex items-center gap-3 py-2 text-[13px]" data-testid="campaign-submission">
                        <Icon name="task" size={14} className="shrink-0 text-ink-muted" />
                        <span className="min-w-0 flex-1 truncate">
                          {contact ? (
                            <A to={`/contacts/${contact.id}`} className="hs-link font-semibold">
                              {contact.firstName} {contact.lastName}
                            </A>
                          ) : (
                            "Contact"
                          )}
                          {contact ? <span className="text-ink-muted"> · {contact.title}</span> : null}
                          {company ? <span className="text-ink-muted"> · {company.name}</span> : null}
                        </span>
                        <span className="shrink-0 text-[12px] text-ink-muted">{dateTime(a.at)}</span>
                      </li>
                    );
                  })}
                  {submissions.length === 0 ? <li className="py-2 text-[12.5px] text-ink-muted">No submissions on the record yet.</li> : null}
                </ul>
              </>
            ) : (
              <p className={cx("text-[13px] text-ink-muted")}>{c.status === "scheduled" ? `Scheduled for ${c.sendAt}. Numbers appear once the email goes out.` : "Nothing sent yet."}</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
