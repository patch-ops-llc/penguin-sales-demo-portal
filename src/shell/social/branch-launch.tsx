"use client";

import { useState } from "react";
import { nowMs } from "@/lib/format";
import { useShell } from "@/store/store";
import { Ext } from "../ext";
import { money, num, relative } from "../format";
import { Icon } from "../icons";
import { A, Avatar, Button, Card, colorFor, cx, Empty, LineTabs, Tag } from "../ui";
import { OffPlatformFrame } from "./off-platform";

type StudioChannelTab = "email" | "ad" | "social";

const CHANNEL_BADGE: Record<string, { label: string; tone: "blue" | "pink" | "teal" | "neutral" }> = {
  linkedin: { label: "LinkedIn", tone: "blue" },
  instagram: { label: "Instagram", tone: "pink" },
  facebook: { label: "Facebook", tone: "blue" },
  x: { label: "X", tone: "neutral" },
};

/**
 * HubSpot Marketing > Regional Branch Launch workspace (Fintech #5):
 * - /branch-launch/segment (Steps 1 & 5: Core-Banking Geo-Eligibility Sync [Penguin] + native geo-targeted dynamic segment)
 * - /branch-launch/studio  (Step 2: native Marketing Studio multi-channel launch preview — Email, Paid Ads, Social Calendar)
 *
 * Strict Penguin marker boundary:
 * ONLY the custom Core-Banking Geo-Eligibility & Product-Holding Segment Sync card carries `<Ext>`.
 * Segment list, Marketing Studio channel previews, launch controls, and post-booking attribution banner carry ZERO Penguin markers.
 */
export function BranchLaunchPage({ sub = "segment" }: { sub?: string }) {
  const { pack, world, dispatch, navigate } = useShell();
  const cfg = pack.demos.branchLaunch;
  const tab = sub === "studio" ? "studio" : "segment";

  const [submarketFilter, setSubmarketFilter] = useState("all");
  const [channelTab, setChannelTab] = useState<StudioChannelTab>("email");

  if (!cfg) {
    return (
      <div className="p-10">
        <Card>
          <Empty title="Regional branch launch is not part of this vertical's demos">
            <A to="/deals" className="hs-link">
              Go to deals
            </A>
          </Empty>
        </Card>
      </div>
    );
  }

  const booked = world.bl.booked;
  const launched = world.bl.campaignLaunched;
  const hc = cfg.heroContact;
  const activeSlot = cfg.landingPage.slots.find((s) => s.id === world.bl.bookedSlotId) ?? cfg.landingPage.slots[0];
  const bookedTopic = world.bl.bookedTopic ?? cfg.landingPage.defaultTopic;
  const filteredMembers = cfg.members.filter((m) => submarketFilter === "all" || m.submarket === submarketFilter);

  const heroTimeline = world.activities
    .filter((a) => a.contactIds?.includes(hc.id))
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
    .slice(0, 3);

  const openStudio = () => {
    dispatch({ t: "bl.reviewSegment" });
    navigate("/branch-launch/studio");
  };

  const launchCampaign = () => {
    dispatch({ t: "bl.launchCampaign", at: nowMs() });
  };

  const openReport = () => {
    dispatch({ t: "bl.verifyAttribution" });
    navigate(`/reports/${cfg.reportId}`);
  };

  return (
    <div className="min-h-full px-6 py-5" data-testid="branch-launch-page">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">Marketing &rsaquo; Regional Branch Launch</p>
          <h1 className="mt-0.5 text-[24px] font-semibold tracking-tight">{cfg.campaignName}</h1>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            {cfg.branchName} &middot; {cfg.branchAddress} &middot; {cfg.launchWindow}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tag tone="teal">Zero-Balance Segment Mode</Tag>
          <Tag tone={launched ? "green" : "blue"}>{launched ? "Campaign Live" : `${num(cfg.totalEligibleCount)} geo-eligible`}</Tag>
        </div>
      </div>

      <LineTabs
        className="mt-4"
        value={tab}
        onChange={(next) => navigate(`/branch-launch/${next}`)}
        tabs={[
          { id: "segment", label: `Geo-Targeted Segment (${num(cfg.totalEligibleCount)})`, testId: "bl-tab-segment" },
          { id: "studio", label: "Marketing Studio & Multi-Channel Launch", testId: "bl-tab-studio" },
        ]}
      />

      {tab === "segment" ? (
        <div className="mt-4 space-y-4" data-testid="bl-segment-view">
          {/* Step 5 native CRM attribution banner (ZERO Penguin markers) */}
          {booked ? (
            <div className="rounded-[10px] border border-[#bfe3cd] bg-[#f0faf4] p-4" data-testid="bl-booked-banner">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-[15px] font-semibold text-[#0b5b2b]">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0b7a4b] text-white">
                      <Icon name="check" size={14} strokeWidth={2.4} />
                    </span>
                    Branch appointment booked &amp; attributed: {hc.firstName} {hc.lastName} ({hc.companyName})
                  </p>
                  <p className="mt-1 text-[13px] text-ink-muted">
                    Booked <strong>{bookedTopic}</strong> at <strong>{cfg.branchName}</strong> ({activeSlot.day} &middot; {activeSlot.time}{" "}
                    {activeSlot.tz}). Attributed opportunity opened for <strong>{money(hc.dealAmount)}</strong> with RM task assigned automatically.
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <A
                    to={`/contacts/${hc.id}`}
                    data-testid="bl-view-contact"
                    className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-line bg-white px-3 text-[12.5px] font-semibold text-ink hover:bg-[#f5f5f5]"
                  >
                    Inspect contact timeline
                  </A>
                  <Button variant="primary" size="sm" data-testid="bl-go-report" onClick={openReport}>
                    Open attribution report <Icon name="arrowRight" size={14} />
                  </Button>
                </div>
              </div>

              {heroTimeline.length > 0 ? (
                <div className="mt-3 grid gap-2 border-t border-[#cde9d7] pt-3 md:grid-cols-3" data-testid="bl-timeline-summary">
                  {heroTimeline.map((item) => (
                    <div key={item.id} className="rounded-[8px] border border-[#d6ecde] bg-white px-3 py-2 text-[12px]">
                      <p className="font-semibold text-ink">{item.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-ink-muted">{item.body}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* ONLY Penguin marker in Branch Launch: Custom Core-Banking Geo-Eligibility Sync */}
          <Ext id={cfg.coreBankingSync.extId}>
            <Card
              title="Core-Banking Geo-Eligibility & Product-Holding Sync"
              right={<Tag tone="purple">{cfg.coreBankingSync.systemName}</Tag>}
              testId="bl-core-banking-card"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-[13.5px] text-ink">
                    Synced <strong>{num(cfg.coreBankingSync.syncedCount)}</strong> eligible business accounts within{" "}
                    <strong>{cfg.coreBankingSync.radiusMiles} miles</strong> of {cfg.branchName} &middot; Updated{" "}
                    {relative(cfg.coreBankingSync.syncedAt).toLowerCase()}.
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Synced eligibility flags:</span>
                    {cfg.coreBankingSync.syncedFields.map((field) => (
                      <code key={field} className="rounded bg-[#f3effc] px-2 py-0.5 text-[11.5px] font-medium text-penguin-strong">
                        {field}
                      </code>
                    ))}
                  </div>
                </div>
                <div className="flex max-w-[360px] items-start gap-2 rounded-[8px] border border-[#b9e1dc] bg-[#f1faf8] px-3.5 py-2.5 text-[12px] text-[#00514f]">
                  <Icon name="shield" size={15} className="mt-0.5 shrink-0" />
                  <span>{cfg.coreBankingSync.guardrailNote}</span>
                </div>
              </div>
            </Card>
          </Ext>

          {/* Native HubSpot Dynamic Geo-Targeted Segment (ZERO Penguin markers) */}
          <Card
            title={`Dynamic Segment: ${cfg.segmentName}`}
            right={
              !booked ? (
                <Button variant="primary" size="sm" data-testid="bl-go-studio" onClick={openStudio}>
                  Preview multi-channel campaign <Icon name="arrowRight" size={14} />
                </Button>
              ) : (
                <Tag tone="green">Live geo-targeted list</Tag>
              )
            }
            pad={false}
            testId="bl-segment-card"
          >
            <div className="flex flex-wrap items-center gap-2 border-y border-line-soft bg-[#fafafa] px-5 py-3">
              <span className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">List filters:</span>
              {cfg.segmentCriteria.map((rule) => (
                <span key={rule} className="rounded-full border border-line bg-white px-2.5 py-0.5 text-[12px] font-medium text-ink">
                  {rule}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-5 py-2.5">
              <div className="flex flex-wrap items-center gap-1.5" data-testid="bl-submarket-filters">
                <button
                  type="button"
                  data-testid="bl-submarket-all"
                  onClick={() => setSubmarketFilter("all")}
                  className={cx(
                    "h-7 rounded-full px-3 text-[12px] font-semibold",
                    submarketFilter === "all" ? "bg-ink text-white" : "bg-hs-bg/75 text-ink hover:bg-hs-bg",
                  )}
                >
                  All sub-markets ({cfg.members.length} sample)
                </button>
                {cfg.submarkets.map((subm) => (
                  <button
                    key={subm}
                    type="button"
                    onClick={() => setSubmarketFilter(subm)}
                    className={cx(
                      "h-7 rounded-full px-3 text-[12px] font-semibold",
                      submarketFilter === subm ? "bg-ink text-white" : "bg-hs-bg/75 text-ink hover:bg-hs-bg",
                    )}
                  >
                    {subm}
                  </button>
                ))}
              </div>
              <span className="text-[12px] text-ink-muted">
                Showing {filteredMembers.length} of {num(cfg.totalEligibleCount)} eligible contacts
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[13px]" data-testid="bl-segment-table">
                <thead>
                  <tr className="border-b border-line-soft bg-[#fafafa] text-left text-[11.5px] uppercase tracking-wide text-ink-muted">
                    <th className="px-5 py-2.5 font-semibold">Contact &amp; Company</th>
                    <th className="px-4 py-2.5 font-semibold">Sub-market</th>
                    <th className="px-4 py-2.5 font-semibold">Distance</th>
                    <th className="px-4 py-2.5 font-semibold">Eligibility flag</th>
                    <th className="px-4 py-2.5 font-semibold">Channels</th>
                    <th className="px-5 py-2.5 font-semibold">Campaign status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((m) => {
                    const isBookedHero = booked && m.hero;
                    return (
                      <tr key={m.id} data-testid={`bl-row-${m.id}`} className="border-b border-line-soft last:border-b-0">
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={m.name} color={colorFor(m.id)} size={26} />
                            <div>
                              <span className="font-semibold text-ink">{m.name}</span>
                              <span className="ml-1.5 text-[12px] text-ink-muted">{m.title}</span>
                              <span className="block text-[11.5px] text-ink-muted">
                                {m.companyName} &middot; {m.email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">{m.submarket}</td>
                        <td className="px-4 py-2.5 tabular-nums text-ink-muted">{m.distanceMiles}</td>
                        <td className="px-4 py-2.5">
                          <Tag tone="teal">{m.eligibilityFlag}</Tag>
                        </td>
                        <td className="px-4 py-2.5 text-ink-muted">{m.optInChannel}</td>
                        <td className="px-5 py-2.5">
                          {isBookedHero ? (
                            <Tag tone="green">Appointment Booked</Tag>
                          ) : launched ? (
                            <Tag tone="blue">Enrolled · Live</Tag>
                          ) : (
                            <Tag tone="neutral">Ready to launch</Tag>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        /* Step 2: Native HubSpot Marketing Studio Multi-Channel Campaign Preview & Launch (ZERO Penguin markers) */
        <div className="mt-4 space-y-4" data-testid="bl-studio-view">
          {launched ? (
            <div
              className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#bfe3cd] bg-[#f0faf4] px-4 py-3"
              data-testid="bl-campaign-launched"
            >
              <div className="flex items-center gap-2.5 text-[13.5px]">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0b7a4b] text-white">
                  <Icon name="check" size={14} strokeWidth={2.4} />
                </span>
                <span>
                  <strong>Multi-channel launch live.</strong> Launch email queued to {num(cfg.totalEligibleCount)} contacts, geo-targeted paid ads active, and{" "}
                  {cfg.socialPosts.length} social posts scheduled.
                </span>
              </div>
              <Button variant="primary" size="sm" data-testid="bl-open-offplatform" onClick={() => navigate("/offplatform/branch-launch")}>
                Open prospect inbox &amp; ad view <Icon name="arrowRight" size={14} />
              </Button>
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-[310px_minmax(0,1fr)]">
            <Card title="Campaign Channels (Native HubSpot)" pad={false}>
              <div className="divide-y divide-line-soft border-t border-line-soft">
                {(
                  [
                    {
                      id: "email",
                      label: "1. Launch Email",
                      sub: `${num(cfg.totalEligibleCount)} contacts · Personalized`,
                      badge: launched ? "Sent" : "Ready",
                    },
                    {
                      id: "ad",
                      label: "2. Paid Local Ads",
                      sub: `${cfg.paidAd.networkLabel} · 25-mi radius`,
                      badge: launched ? "Active" : "Ready",
                    },
                    {
                      id: "social",
                      label: "3. Social Calendar & Landing",
                      sub: `${cfg.socialPosts.length} posts + UTM booking page`,
                      badge: launched ? "Scheduled" : "Ready",
                    },
                  ] as const
                ).map((item) => {
                  const selected = channelTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-testid={`bl-channel-${item.id}`}
                      onClick={() => setChannelTab(item.id)}
                      className={cx(
                        "block w-full px-4 py-3.5 text-left transition-colors",
                        selected ? "border-l-[3px] border-l-hs-orange bg-[#fff7f2]" : "hover:bg-[#fafafa]",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13.5px] font-semibold text-ink">{item.label}</span>
                        <Tag tone={launched ? "green" : "amber"}>{item.badge}</Tag>
                      </div>
                      <p className="mt-1 text-[12px] text-ink-muted">{item.sub}</p>
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-line-soft bg-[#fafafa] p-4 text-[12.5px]">
                <p className="font-semibold text-ink">Unified Campaign Attribution</p>
                <p className="mt-1 text-ink-muted">
                  Every click from launch email, paid local ads, and organic social carries{" "}
                  <code className="rounded bg-white px-1 py-0.5 text-[11px] ring-1 ring-line-soft">utm_campaign={cfg.landingPage.utmCampaign}</code> into{" "}
                  <strong>{cfg.campaignName}</strong>.
                </p>
              </div>
            </Card>

            <Card
              title={
                channelTab === "email"
                  ? "Launch Email Preview"
                  : channelTab === "ad"
                    ? "Geo-Targeted Paid Ad Preview"
                    : "Social Content Calendar & Branch Landing Page"
              }
              right={<Tag tone="teal">Brand &amp; Compliance Checked</Tag>}
              testId="bl-studio-preview"
            >
              {channelTab === "email" ? (
                <div data-testid="bl-preview-email">
                  <dl className="space-y-1.5 border-b border-line-soft pb-3 text-[13px]">
                    <div className="flex gap-2">
                      <dt className="w-20 shrink-0 text-ink-muted">Audience</dt>
                      <dd className="font-medium">
                        {cfg.segmentName} ({num(cfg.totalEligibleCount)} contacts)
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-20 shrink-0 text-ink-muted">Subject</dt>
                      <dd className="font-semibold">{cfg.emailAsset.subject}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-20 shrink-0 text-ink-muted">Preview</dt>
                      <dd className="text-ink-muted">{cfg.emailAsset.previewText}</dd>
                    </div>
                  </dl>
                  <div className="mt-4 rounded-[10px] border border-line bg-[#fafbfd] p-5">
                    <div className="flex items-center justify-between border-b border-line-soft pb-3">
                      <span className="text-[14px] font-bold text-[#0f3d56]">Fernhill Capital &middot; {cfg.branchName}</span>
                      <Tag tone="blue">Regional Launch</Tag>
                    </div>
                    <div className="mt-4 whitespace-pre-line text-[13.5px] leading-relaxed text-[#243447]">{cfg.emailAsset.body}</div>
                    <div className="mt-5">
                      <span className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#0f3d56] px-4 py-2 text-[13px] font-semibold text-white">
                        {cfg.emailAsset.ctaLabel} <Icon name="arrowRight" size={14} />
                      </span>
                    </div>
                    <p className="mt-4 border-t border-line-soft pt-3 text-[11.5px] text-ink-muted">{cfg.complianceNotice}</p>
                  </div>
                </div>
              ) : channelTab === "ad" ? (
                <div className="space-y-4" data-testid="bl-preview-ad">
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-line-soft bg-[#fafafa] px-3.5 py-2.5 text-[12.5px]">
                    <span>
                      <strong>Network:</strong> {cfg.paidAd.networkLabel} &middot; <strong>Audience:</strong> {cfg.paidAd.audienceLabel}
                    </span>
                    <Tag tone="blue">{cfg.paidAd.utmSummary}</Tag>
                  </div>
                  <div className="overflow-hidden rounded-[10px] border border-[#cbd5e1] bg-white shadow-sm">
                    <div className="bg-gradient-to-r from-[#0f3d56] to-[#136f63] px-6 py-5 text-white">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#a7f3d0]">Sponsored &middot; Charlotte Commercial Banking</p>
                      <p className="mt-1.5 text-[21px] font-bold leading-snug">{cfg.paidAd.headline}</p>
                      <p className="mt-1 text-[13.5px] text-white/85">{cfg.paidAd.subheadline}</p>
                      <ul className="mt-3 space-y-1 text-[12.5px] text-white/95">
                        {cfg.paidAd.bullets.map((b) => (
                          <li key={b} className="flex items-center gap-1.5">
                            <Icon name="check" size={13} className="text-[#6ee7b7]" /> {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex items-center justify-between gap-3 bg-[#f1f5f9] px-5 py-3">
                      <span className="text-[12.5px] font-medium text-[#334155]">{cfg.landingPage.url}</span>
                      <span className="rounded-full bg-[#0a66c2] px-4 py-1.5 text-[12.5px] font-semibold text-white">{cfg.paidAd.ctaLabel}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3" data-testid="bl-preview-social">
                  <div className="rounded-[8px] border border-line-soft bg-[#fafafa] px-4 py-3 text-[12.5px]">
                    <p className="font-semibold text-ink">Destination Landing Page</p>
                    <p className="mt-0.5 text-ink-muted">
                      <code>{cfg.landingPage.url}</code> &middot; Native HubSpot Meetings calendar embedded for Charlotte RMs
                    </p>
                  </div>
                  <ul className="space-y-2.5">
                    {cfg.socialPosts.map((post) => {
                      const ch = CHANNEL_BADGE[post.channel] ?? { label: post.channel, tone: "neutral" as const };
                      return (
                        <li key={post.id} className="rounded-[8px] border border-line-soft bg-white p-3.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Tag tone={ch.tone}>{ch.label}</Tag>
                              <span className="text-[12px] font-semibold text-ink-muted">{post.dayLabel}</span>
                            </div>
                            <Tag tone={launched ? "green" : "amber"}>{launched ? "Scheduled" : post.statusLabel}</Tag>
                          </div>
                          <p className="mt-1.5 text-[13.5px] font-semibold text-ink">{post.headline}</p>
                          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">{post.copy}</p>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-4">
                <span className="text-[12.5px] text-ink-muted">One HubSpot Campaign coordinates email, local paid ads, social calendar, and branch bookings.</span>
                {!launched ? (
                  <Button variant="primary" data-testid="bl-launch-btn" onClick={launchCampaign}>
                    <Icon name="check" size={15} /> Approve &amp; launch campaign
                  </Button>
                ) : (
                  <Button variant="primary" data-testid="bl-open-offplatform-footer" onClick={() => navigate("/offplatform/branch-launch")}>
                    Open prospect inbox &amp; ad view <Icon name="arrowRight" size={14} />
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Off-platform Prospect Launch Email & Paid Ad Engagement (Step 3) + Charlotte Branch Booking Landing Page (Step 4).
 * Pure native HubSpot marketing/meetings experience — ZERO Penguin markers.
 */
export function BranchLaunchOffPlatformPage() {
  const { pack, world, dispatch, navigate } = useShell();
  const cfg = pack.demos.branchLaunch;
  const [selectedSlotId, setSelectedSlotId] = useState(cfg?.landingPage.defaultSlotId ?? "slot-tue");
  const [selectedTopic, setSelectedTopic] = useState(cfg?.landingPage.defaultTopic ?? "");

  if (!cfg) return null;
  const hc = cfg.heroContact;
  const lp = cfg.landingPage;
  const bookingOpen = world.bl.bookingOpened;
  const booked = world.bl.booked;
  const activeSlotId = booked && world.bl.bookedSlotId ? world.bl.bookedSlotId : selectedSlotId;
  const activeSlot = lp.slots.find((s) => s.id === activeSlotId) ?? lp.slots[0];
  const activeTopic = booked && world.bl.bookedTopic ? world.bl.bookedTopic : selectedTopic || lp.defaultTopic;

  const personalizedBody = cfg.emailAsset.body
    .replaceAll("{{contact.firstname}}", hc.firstName)
    .replaceAll("{{company.name}}", hc.companyName);

  return (
    <OffPlatformFrame
      channelLabel={bookingOpen ? "Branch Launch Landing Page" : "Prospect Inbox & Local Ad"}
      url={
        bookingOpen
          ? `${lp.url}?utm_source=${lp.utmSource}&utm_medium=${lp.utmMedium}&utm_campaign=${lp.utmCampaign}`
          : `https://mail.${hc.companyDomain}/inbox/${hc.firstName.toLowerCase()}`
      }
      backTo="/branch-launch/segment"
      backLabel={booked ? "Verify attribution in HubSpot" : "Back to Branch Launch"}
      testId="offplatform-branch-launch"
      action={
        booked ? (
          <Button variant="primary" size="sm" data-testid="bl-verify-top" onClick={() => navigate("/branch-launch/segment")}>
            Verify CRM attribution <Icon name="arrowRight" size={14} />
          </Button>
        ) : undefined
      }
    >
      {!bookingOpen ? (
        /* Step 3: Prospect views launch email + local LinkedIn sponsored ad */
        <div className="min-h-full bg-[#f4f6f9] p-6" data-testid="bl-prospect-inbox">
          <div className="mx-auto grid max-w-[1060px] gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="overflow-hidden rounded-[12px] border border-[#d6dde6] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-line-soft bg-[#0f3d56] px-5 py-3 text-white">
                <div className="flex items-center gap-2.5">
                  <Icon name="email" size={16} />
                  <span className="text-[14px] font-semibold">Piedmont Millwork Mail</span>
                  <span className="text-[12px] text-white/75">&middot; {hc.email}</span>
                </div>
                <Tag tone="blue">Launch Email</Tag>
              </div>
              <div className="border-b border-line-soft bg-[#fafbfd] px-6 py-4">
                <h1 className="text-[18px] font-semibold text-ink" data-testid="bl-inbox-subject">
                  {cfg.emailAsset.subject}
                </h1>
                <p className="mt-1 text-[12.5px] text-ink-muted">
                  From: <strong className="text-ink">{cfg.emailAsset.senderName}</strong> &lt;{cfg.emailAsset.senderEmail}&gt; &middot; To: {hc.firstName}{" "}
                  {hc.lastName} ({hc.title}, {hc.companyName})
                </p>
              </div>
              <div className="p-6">
                <div className="whitespace-pre-line text-[14px] leading-relaxed text-[#243447]">{personalizedBody}</div>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Button variant="primary" data-testid="bl-open-booking" onClick={() => dispatch({ t: "bl.openBooking" })}>
                    {cfg.emailAsset.ctaLabel} <Icon name="arrowRight" size={15} />
                  </Button>
                  <span className="text-[12px] text-ink-muted">{hc.distanceMiles} from {cfg.branchName}</span>
                </div>
                <p className="mt-5 border-t border-line-soft pt-3 text-[11.5px] text-ink-muted">{cfg.complianceNotice}</p>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="overflow-hidden rounded-[12px] border border-[#cbd5e1] bg-white shadow-sm" data-testid="bl-ad-card">
                <div className="bg-gradient-to-r from-[#0f3d56] to-[#136f63] p-4 text-white">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#a7f3d0]">Sponsored Local Ad &middot; 25-Mi Radius</p>
                  <p className="mt-1 text-[16px] font-bold leading-snug">{cfg.paidAd.headline}</p>
                  <p className="mt-1 text-[12.5px] text-white/85">{cfg.paidAd.subheadline}</p>
                </div>
                <div className="p-4 text-[12.5px]">
                  <ul className="space-y-1.5 text-[#334155]">
                    {cfg.paidAd.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-1.5">
                        <Icon name="check" size={14} className="mt-0.5 shrink-0 text-[#0b7a4b]" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="secondary" size="sm" className="mt-4 w-full" data-testid="bl-ad-click" onClick={() => dispatch({ t: "bl.openBooking" })}>
                    {cfg.paidAd.ctaLabel} <Icon name="arrowRight" size={13} />
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      ) : (
        /* Step 4: Branch Launch Landing Page & Appointment Booking */
        <div className="min-h-full bg-[#f4f7fa] p-6" data-testid="bl-booking-page">
          <div className="mx-auto max-w-[920px] overflow-hidden rounded-[12px] border border-[#d6dde6] bg-white shadow-sm">
            <div className="flex items-center justify-between bg-[#0f3d56] px-6 py-4 text-white">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#136f63] text-[12px] font-bold">FC</span>
                <div>
                  <p className="text-[16px] font-bold leading-tight">Fernhill Capital &middot; {cfg.branchName}</p>
                  <p className="text-[12px] text-white/80">{cfg.branchAddress}</p>
                </div>
              </div>
              <Tag tone={booked ? "green" : "teal"}>{booked ? "Appointment Confirmed" : lp.eyebrow}</Tag>
            </div>

            <div className="border-b border-[#d5e3ec] bg-[#e9f3f8] px-6 py-2 text-[12px] text-[#0f3d56]">
              <span className="font-semibold">HubSpot UTM Attribution Captured:</span>{" "}
              <code className="rounded bg-white px-1.5 py-0.5 text-[11px]">utm_source={lp.utmSource}</code>{" "}
              <code className="rounded bg-white px-1.5 py-0.5 text-[11px]">utm_medium={lp.utmMedium}</code>{" "}
              <code className="rounded bg-white px-1.5 py-0.5 text-[11px]">utm_campaign={lp.utmCampaign}</code>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-[1fr_320px]">
              <div className="space-y-4">
                <div>
                  <h2 className="text-[21px] font-bold text-[#0f3d56]">{lp.headline}</h2>
                  <p className="mt-1 text-[13.5px] text-ink-muted">{lp.subheadline}</p>
                </div>

                {booked ? (
                  <div className="hs-pop space-y-4" data-testid="bl-booking-confirmed">
                    <div className="rounded-[10px] border border-[#bfe3cd] bg-[#f0faf4] p-4">
                      <p className="flex items-center gap-2 text-[16px] font-bold text-[#0b5b2b]">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0b7a4b] text-white">
                          <Icon name="check" size={14} strokeWidth={2.4} />
                        </span>
                        Charlotte branch appointment confirmed
                      </p>
                      <p className="mt-2 text-[14px] font-semibold text-ink">
                        {activeSlot.day} &middot; {activeSlot.time} {activeSlot.tz}
                      </p>
                      <p className="mt-0.5 text-[13px] text-ink-muted">
                        {activeTopic} &middot; {activeSlot.advisorLabel}
                      </p>
                    </div>

                    <div className="rounded-[8px] border border-line-soft bg-[#fafafa] p-4 text-[13px]">
                      <p className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Captured in HubSpot CRM</p>
                      <ul className="mt-2 space-y-1.5">
                        <li className="flex items-start gap-2">
                          <Icon name="check" size={14} className="mt-0.5 shrink-0 text-[#0b5b2b]" />
                          Contact updated: {hc.firstName} {hc.lastName} ({hc.companyName}) &rarr; Branch Visit Booked
                        </li>
                        <li className="flex items-start gap-2">
                          <Icon name="check" size={14} className="mt-0.5 shrink-0 text-[#0b5b2b]" />
                          Attributed financing opportunity opened: {hc.dealName} ({money(hc.dealAmount)})
                        </li>
                        <li className="flex items-start gap-2">
                          <Icon name="check" size={14} className="mt-0.5 shrink-0 text-[#0b5b2b]" />
                          High-priority branch prep task assigned to Dana Whitlock
                        </li>
                      </ul>
                    </div>

                    <Button variant="primary" data-testid="bl-verify-crm" onClick={() => navigate("/branch-launch/segment")}>
                      Verify attribution in HubSpot <Icon name="arrowRight" size={15} />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">1. Consultation topic</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {lp.topics.map((topic) => (
                          <button
                            key={topic}
                            type="button"
                            onClick={() => setSelectedTopic(topic)}
                            className={cx(
                              "rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-colors",
                              activeTopic === topic ? "border-[#0f3d56] bg-[#eef5f9] text-[#0f3d56]" : "border-line bg-white text-ink hover:bg-[#fafafa]",
                            )}
                          >
                            {topic}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">2. Choose an in-branch time slot</p>
                      <div className="mt-2 space-y-2" role="radiogroup" aria-label="Branch appointment slots">
                        {lp.slots.map((slot) => {
                          const selected = slot.id === activeSlot.id;
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              data-testid={`bl-slot-${slot.id}`}
                              aria-pressed={selected}
                              onClick={() => setSelectedSlotId(slot.id)}
                              className={cx(
                                "flex w-full items-center justify-between rounded-[8px] border px-4 py-3 text-left transition-colors",
                                selected ? "border-[#0f3d56] bg-[#eef5f9] ring-1 ring-[#0f3d56]" : "border-line hover:bg-[#fafafa]",
                              )}
                            >
                              <div>
                                <p className="text-[13.5px] font-semibold text-ink">{slot.day}</p>
                                <p className="text-[12px] text-ink-muted">{slot.advisorLabel}</p>
                              </div>
                              <span className="text-[13.5px] font-semibold tabular-nums text-[#0f3d56]">
                                {slot.time} {slot.tz}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      data-testid="bl-confirm-booking"
                      onClick={() => dispatch({ t: "bl.bookAppointment", slotId: activeSlot.id, topic: activeTopic, at: nowMs() })}
                    >
                      <Icon name="check" size={15} /> Confirm branch appointment
                    </Button>
                  </>
                )}
              </div>

              <aside className="space-y-3">
                <div className="rounded-[10px] border border-line-soft bg-[#fafafa] p-4 text-[12.5px]">
                  <p className="font-semibold text-ink">Visitor &amp; Branch Summary</p>
                  <dl className="mt-2.5 space-y-2">
                    <div>
                      <dt className="text-ink-muted">Visitor</dt>
                      <dd className="font-medium text-ink">
                        {hc.firstName} {hc.lastName} ({hc.title})
                      </dd>
                    </div>
                    <div>
                      <dt className="text-ink-muted">Company</dt>
                      <dd className="font-medium text-ink">{hc.companyName}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-muted">Branch</dt>
                      <dd className="font-medium text-ink">{cfg.branchName}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-muted">Topic</dt>
                      <dd className="font-medium text-ink">{activeTopic}</dd>
                    </div>
                  </dl>
                </div>
                <div className="flex items-start gap-2 rounded-[8px] border border-[#b9e1dc] bg-[#f1faf8] px-3.5 py-3 text-[12px] text-[#00514f]">
                  <Icon name="shield" size={15} className="mt-0.5 shrink-0" />
                  <span>Zero PII / zero account balances collected on marketing forms. All records are fictional sample data.</span>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </OffPlatformFrame>
  );
}
