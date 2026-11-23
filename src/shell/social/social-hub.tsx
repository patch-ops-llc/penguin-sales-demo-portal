"use client";

import { useMemo, useState } from "react";
import { nowMs } from "@/lib/format";
import { useShell } from "@/store/store";
import { relative } from "../format";
import { Icon } from "../icons";
import { A, Avatar, Button, Card, colorFor, cx, Empty, LineTabs, Tag, type Tone } from "../ui";
import type { SocialCalendarPost, SocialChannel, SocialPostStatus } from "./types";

const CHANNEL_META: Record<SocialChannel, { label: string; short: string; bg: string; text: string }> = {
  linkedin: { label: "LinkedIn", short: "in", bg: "bg-[#0a66c2]", text: "text-white" },
  facebook: { label: "Facebook", short: "f", bg: "bg-[#1877f2]", text: "text-white" },
  instagram: { label: "Instagram", short: "IG", bg: "bg-[#d62976]", text: "text-white" },
  x: { label: "X", short: "X", bg: "bg-[#141414]", text: "text-white" },
};

const STATUS_META: Record<SocialPostStatus, { label: string; tone: Tone; dot: string }> = {
  published: { label: "Published", tone: "green", dot: "bg-[#0b5b2b]" },
  scheduled: { label: "Scheduled", tone: "blue", dot: "bg-[#0b4a78]" },
  draft: { label: "Draft", tone: "amber", dot: "bg-[#946c00]" },
};

function ChannelBadge({ channel, compact }: { channel: SocialChannel; compact?: boolean }) {
  const m = CHANNEL_META[channel];
  return (
    <span className={cx("inline-flex shrink-0 items-center justify-center rounded-[4px] font-bold leading-none", m.bg, m.text, compact ? "h-4 w-4 text-[9px]" : "h-5 px-1.5 text-[10.5px]")}>
      {compact ? m.short : m.label}
    </span>
  );
}

function effectiveStatus(post: SocialCalendarPost, approvedIds: string[]): SocialPostStatus {
  if (post.initialStatus === "draft" && approvedIds.includes(post.id)) return "scheduled";
  return post.initialStatus;
}

/**
 * HubSpot Marketing > Social hub:
 * - /social/calendar (Steps 2 & 4: plan month by channel & date; see Draft / Scheduled / Published status)
 * - /social/drafts (Step 3: Brand Voice drafts & approval)
 * - /social/inbox (Step 12: Social Monitoring / Inbox across channels in one place)
 * All native HubSpot Marketing Hub Social tools — zero Penguin markers.
 */
export function SocialHubPage({ sub = "calendar" }: { sub?: string }) {
  const { pack, world, dispatch, navigate } = useShell();
  const cfg = pack.demos.socialAds;
  const tab = sub === "drafts" || sub === "inbox" ? sub : "calendar";

  const [channelFilter, setChannelFilter] = useState<SocialChannel | "all">("all");
  const [statusFilter, setStatusFilter] = useState<SocialPostStatus | "all">("all");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [inboxChannel, setInboxChannel] = useState<SocialChannel | "all">("all");
  const [activeThreadId, setActiveThreadId] = useState<string>(cfg?.inboxThreads[0]?.id ?? "");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const visiblePosts = useMemo(() => {
    if (!cfg) return [];
    return cfg.posts
      .filter((p) => !p.plannedInStep2 || world.sa.calendarPlanned)
      .map((p) => ({
        ...p,
        copy: world.sa.postEdits[p.id] ?? p.copy,
        status: effectiveStatus(p, world.sa.approvedPostIds),
      }));
  }, [cfg, world.sa.calendarPlanned, world.sa.approvedPostIds, world.sa.postEdits]);

  if (!cfg) {
    return (
      <div className="p-10">
        <Card>
          <Empty title="Social publishing is not part of this vertical's demos">
            <A to="/deals" className="hs-link">
              Go to deals
            </A>
          </Empty>
        </Card>
      </div>
    );
  }

  const heroCampaign = cfg.campaigns.find((c) => c.id === cfg.heroCampaignId) ?? cfg.campaigns[0];
  const approvalDrafts = cfg.posts.filter((p) => p.needsApproval);
  const pendingApprovalCount = approvalDrafts.filter((p) => !world.sa.approvedPostIds.includes(p.id)).length;
  const unreadInboxCount = cfg.inboxThreads.filter((t) => !t.initialReplied && !world.sa.replies[t.id]).length;

  const statusCounts = {
    all: visiblePosts.length,
    published: visiblePosts.filter((p) => p.status === "published").length,
    scheduled: visiblePosts.filter((p) => p.status === "scheduled").length,
    draft: visiblePosts.filter((p) => p.status === "draft").length,
  };

  const filteredPosts = visiblePosts.filter(
    (p) => (channelFilter === "all" || p.channel === channelFilter) && (statusFilter === "all" || p.status === statusFilter),
  );

  const selectedPost = visiblePosts.find((p) => p.id === selectedPostId) ?? null;

  const cells: (number | null)[] = [];
  for (let i = 0; i < cfg.monthStartOffset; i++) cells.push(null);
  for (let d = 1; d <= cfg.daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const filteredThreads = cfg.inboxThreads.filter((t) => inboxChannel === "all" || t.channel === inboxChannel);
  const activeThread = filteredThreads.find((t) => t.id === activeThreadId) ?? filteredThreads[0] ?? cfg.inboxThreads[0];
  const activeReply = activeThread ? world.sa.replies[activeThread.id] : undefined;
  const activeReplyInput = activeThread ? (replyDrafts[activeThread.id] ?? activeThread.suggestedReply) : "";

  return (
    <div className="min-h-full px-6 py-5" data-testid="social-hub">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">Marketing &rsaquo; Social</p>
          <h1 className="mt-0.5 text-[24px] font-semibold tracking-tight">Social</h1>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="rounded-full border border-line bg-white px-3 py-1 text-[12px] font-medium text-ink-muted">
            Campaign: <strong className="text-ink">{heroCampaign.name}</strong>
          </span>
          {tab === "calendar" && !world.sa.calendarPlanned ? (
            <Button
              variant="primary"
              data-testid="social-plan-month"
              onClick={() => dispatch({ t: "sa.planCalendar" })}
            >
              Schedule month plan (+3 posts)
            </Button>
          ) : null}
          {tab === "calendar" && world.sa.calendarPlanned && pendingApprovalCount > 0 ? (
            <Button variant="primary" data-testid="social-go-drafts" onClick={() => navigate("/social/drafts")}>
              Review brand-voice drafts ({pendingApprovalCount}) <Icon name="arrowRight" size={15} />
            </Button>
          ) : null}
          {tab === "calendar" && world.sa.calendarPlanned && pendingApprovalCount === 0 ? (
            <Button
              variant="primary"
              data-testid="social-preview-ads"
              onClick={() => {
                dispatch({ t: "sa.reviewStatus" });
                navigate("/offplatform/google-ad");
              }}
            >
              Preview live ads (Off-platform) <Icon name="external" size={15} />
            </Button>
          ) : null}
          {tab === "drafts" && pendingApprovalCount > 0 ? (
            <Button
              variant="primary"
              data-testid="social-approve-all"
              onClick={() => dispatch({ t: "sa.approveAllDrafts" })}
            >
              Approve all drafts ({pendingApprovalCount})
            </Button>
          ) : null}
          {tab === "drafts" && pendingApprovalCount === 0 ? (
            <Button variant="primary" data-testid="social-back-calendar" onClick={() => navigate("/social/calendar")}>
              View statuses on calendar <Icon name="arrowRight" size={15} />
            </Button>
          ) : null}
          {tab === "inbox" && Object.keys(world.sa.replies).length > 0 ? (
            <Button variant="primary" data-testid="social-go-insights" onClick={() => navigate("/insights")}>
              Open Insights dashboard <Icon name="arrowRight" size={15} />
            </Button>
          ) : null}
        </div>
      </div>

      <LineTabs
        className="mt-3"
        value={tab}
        onChange={(next) => navigate(`/social/${next}`)}
        tabs={[
          { id: "calendar", label: `Calendar (${visiblePosts.length})`, testId: "social-tab-calendar" },
          {
            id: "drafts",
            label: (
              <span className="inline-flex items-center gap-1.5">
                Drafts &amp; Brand Voice
                {pendingApprovalCount > 0 ? <Tag tone="amber">{pendingApprovalCount}</Tag> : <Tag tone="green">Approved</Tag>}
              </span>
            ),
            testId: "social-tab-drafts",
          },
          {
            id: "inbox",
            label: (
              <span className="inline-flex items-center gap-1.5">
                Monitoring inbox
                {unreadInboxCount > 0 ? <Tag tone="orange">{unreadInboxCount}</Tag> : <Tag tone="green">All caught up</Tag>}
              </span>
            ),
            testId: "social-tab-inbox",
          },
        ]}
      />

      {tab === "calendar" ? (
        <div className="mt-4 space-y-4" data-testid="social-calendar-view">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-line bg-white px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[15px] font-semibold">{cfg.monthLabel}</span>
              <span className="h-4 w-px bg-line-soft" aria-hidden="true" />
              {(["all", "linkedin", "facebook", "instagram", "x"] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  data-testid={`filter-channel-${ch}`}
                  onClick={() => setChannelFilter(ch)}
                  className={cx(
                    "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[12px] font-semibold transition-colors",
                    channelFilter === ch ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:border-ink",
                  )}
                >
                  {ch === "all" ? "All channels" : CHANNEL_META[ch].label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5" data-testid="status-filters">
              {(["all", "published", "scheduled", "draft"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  data-testid={`filter-status-${st}`}
                  onClick={() => setStatusFilter(st)}
                  className={cx(
                    "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[12px] font-semibold transition-colors",
                    statusFilter === st ? "border-hs-orange bg-[#fff3ec] text-[#a03400]" : "border-line-soft bg-[#fafafa] text-ink-muted hover:border-line hover:text-ink",
                  )}
                >
                  {st !== "all" ? <span className={cx("h-2 w-2 rounded-full", STATUS_META[st].dot)} /> : null}
                  {st === "all" ? "All" : STATUS_META[st].label} ({statusCounts[st]})
                </button>
              ))}
            </div>
          </div>

          <div className={cx("grid gap-4", selectedPost ? "grid-cols-[minmax(0,1fr)_320px]" : "grid-cols-1")}>
            <div className="overflow-hidden rounded-[10px] border border-line bg-white" data-testid="social-calendar-grid">
              <div className="grid grid-cols-7 border-b border-line-soft bg-[#fafafa] text-center text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                  <div key={day} className="border-r border-line-soft py-2 last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {cells.map((day, idx) => {
                  const dayPosts = day ? filteredPosts.filter((p) => p.dayOfMonth === day) : [];
                  return (
                    <div
                      key={idx}
                      className={cx(
                        "min-h-[104px] border-b border-r border-line-soft p-2 last:border-r-0",
                        !day && "bg-[#f8f8f8]",
                        idx % 7 === 6 && "border-r-0",
                      )}
                    >
                      {day ? (
                        <>
                          <div className="flex items-center justify-between text-[11.5px] font-semibold text-ink-muted">
                            <span>{day}</span>
                            {day === 12 ? <span className="rounded bg-[#ffe4d6] px-1.5 text-[10px] text-[#a03400]">Today</span> : null}
                          </div>
                          <div className="mt-1.5 space-y-1.5">
                            {dayPosts.map((post) => {
                              const st = STATUS_META[post.status];
                              const active = selectedPost?.id === post.id;
                              return (
                                <button
                                  key={post.id}
                                  type="button"
                                  data-testid={`cal-post-${post.id}`}
                                  data-status={post.status}
                                  onClick={() => setSelectedPostId(post.id)}
                                  className={cx(
                                    "block w-full rounded-[6px] border p-1.5 text-left transition-colors",
                                    active ? "border-hs-orange bg-[#fff7f2]" : "border-line-soft bg-[#fcfcfc] hover:border-ink",
                                    post.plannedInStep2 && world.sa.calendarPlanned && "hs-row-new",
                                  )}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="flex items-center gap-1 text-[10.5px] font-semibold text-ink-muted">
                                      <ChannelBadge channel={post.channel} compact />
                                      {post.time}
                                    </span>
                                    <span className={cx("inline-flex rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide", post.status === "published" ? "bg-[#dff4e4] text-[#0b5b2b]" : post.status === "scheduled" ? "bg-[#dcecf9] text-[#0b4a78]" : "bg-[#fdefc8] text-[#754c00]")}>
                                      {st.label}
                                    </span>
                                  </div>
                                  <p className="mt-1 line-clamp-2 text-[11.5px] font-semibold leading-tight text-ink">{post.title}</p>
                                </button>
                              );
                            })}
                          </div>
                        </>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedPost ? (
              <Card
                title="Post details"
                right={
                  <button type="button" onClick={() => setSelectedPostId(null)} aria-label="Close post details" className="rounded p-1 text-ink-muted hover:bg-[#f0f0f0]">
                    <Icon name="close" size={16} />
                  </button>
                }
                testId="social-post-drawer"
              >
                <div className="flex items-center gap-2">
                  <ChannelBadge channel={selectedPost.channel} />
                  <Tag tone={STATUS_META[selectedPost.status].tone}>{STATUS_META[selectedPost.status].label}</Tag>
                </div>
                <h3 className="mt-2.5 text-[15px] font-semibold leading-snug">{selectedPost.title}</h3>
                <p className="mt-1 text-[12px] text-ink-muted">
                  {cfg.monthLabel.split(" ")[0]} {selectedPost.dayOfMonth} at {selectedPost.time}
                </p>
                <p className="mt-3 rounded-[8px] border border-line-soft bg-[#fafafa] p-3 text-[13px] leading-relaxed">{selectedPost.copy}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Tag tone="teal">Brand voice: {selectedPost.voiceMatchScore}%</Tag>
                  {selectedPost.hipaaChecked ? <Tag tone="green">HIPAA-safe verified</Tag> : null}
                </div>
                {selectedPost.status === "published" && selectedPost.impressions ? (
                  <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line-soft pt-3 text-center">
                    <div>
                      <dt className="text-[11px] text-ink-muted">Impressions</dt>
                      <dd className="text-[14px] font-bold tabular-nums">{selectedPost.impressions.toLocaleString("en-US")}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-ink-muted">Clicks</dt>
                      <dd className="text-[14px] font-bold tabular-nums">{selectedPost.clicks}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-ink-muted">Engagements</dt>
                      <dd className="text-[14px] font-bold tabular-nums">{selectedPost.engagements}</dd>
                    </div>
                  </dl>
                ) : null}
                {selectedPost.status === "draft" && selectedPost.needsApproval ? (
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-4 w-full"
                    onClick={() => dispatch({ t: "sa.approvePost", postId: selectedPost.id })}
                  >
                    Approve &amp; schedule post
                  </Button>
                ) : null}
              </Card>
            ) : null}
          </div>
        </div>
      ) : null}

      {tab === "drafts" ? (
        <div className="mt-4 space-y-4" data-testid="social-drafts-view">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-[760px]">
                <div className="flex items-center gap-2">
                  <Tag tone="teal">HubSpot Brand Voice</Tag>
                  <Tag tone="green">{heroCampaign.brandVoice.guardrail}</Tag>
                </div>
                <h2 className="mt-2 text-[17px] font-semibold">{heroCampaign.brandVoice.name}</h2>
                <p className="mt-1 text-[13.5px] text-ink-muted">{heroCampaign.brandVoice.tone}</p>
                <ul className="mt-2.5 flex flex-wrap gap-2">
                  {heroCampaign.brandVoice.pillars.map((pillar) => (
                    <li key={pillar} className="inline-flex items-center gap-1.5 rounded-full border border-line-soft bg-[#fafafa] px-3 py-1 text-[12px]">
                      <Icon name="check" size={13} className="text-[#0b5b2b]" /> {pillar}
                    </li>
                  ))}
                </ul>
              </div>
              {pendingApprovalCount > 0 ? (
                <Button variant="primary" onClick={() => dispatch({ t: "sa.approveAllDrafts" })} data-testid="drafts-approve-all">
                  Approve all {pendingApprovalCount} drafts
                </Button>
              ) : (
                <div className="flex items-center gap-2 rounded-[8px] border border-[#b7e2c4] bg-[#eefaf1] px-3.5 py-2 text-[13px] font-semibold text-[#0b5b2b]" data-testid="drafts-all-approved">
                  <Icon name="check" size={15} /> All campaign drafts approved &amp; scheduled
                </div>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-3 gap-4">
            {approvalDrafts.map((post) => {
              const approved = world.sa.approvedPostIds.includes(post.id);
              const copy = world.sa.postEdits[post.id] ?? post.copy;
              return (
                <Card key={post.id} testId={`draft-card-${post.id}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ChannelBadge channel={post.channel} />
                      <span className="text-[12px] text-ink-muted">
                        Jan {post.dayOfMonth} &middot; {post.time}
                      </span>
                    </div>
                    <Tag tone={approved ? "blue" : "amber"}>{approved ? "Scheduled" : "Draft"}</Tag>
                  </div>
                  <h3 className="mt-2.5 text-[15px] font-semibold leading-snug">{post.title}</h3>
                  <textarea
                    value={copy}
                    onChange={(e) => dispatch({ t: "sa.editPost", postId: post.id, copy: e.target.value })}
                    rows={5}
                    aria-label={`Draft copy for ${post.title}`}
                    className="mt-2.5 w-full resize-none rounded-[6px] border border-line bg-[#fcfcfc] p-2.5 text-[13px] leading-relaxed focus:border-ink focus:bg-white focus:outline-none"
                  />
                  <div className="mt-2.5 flex items-center justify-between gap-2 text-[12px]">
                    <span className="inline-flex items-center gap-1 font-medium text-[#00514f]">
                      <Icon name="check" size={13} /> {post.voiceMatchScore}% voice match
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#0b5b2b]">
                      <Icon name="shield" size={13} /> HIPAA-safe
                    </span>
                  </div>
                  <div className="mt-3 border-t border-line-soft pt-3">
                    {approved ? (
                      <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#0b4a78]">
                        <Icon name="check" size={14} /> Approved for calendar
                      </span>
                    ) : (
                      <Button size="sm" variant="secondary" className="w-full" data-testid={`approve-draft-${post.id}`} onClick={() => dispatch({ t: "sa.approvePost", postId: post.id })}>
                        Approve &amp; schedule
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ) : null}

      {tab === "inbox" ? (
        <div className="mt-4 grid min-h-[540px] grid-cols-[360px_minmax(0,1fr)] overflow-hidden rounded-[10px] border border-line bg-white" data-testid="social-inbox-view">
          <div className="flex flex-col border-r border-line">
            <div className="border-b border-line-soft p-3">
              <p className="text-[13px] font-semibold">Comments &amp; messages ({cfg.inboxThreads.length})</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(["all", "linkedin", "facebook", "instagram", "x"] as const).map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setInboxChannel(ch)}
                    className={cx(
                      "rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold",
                      inboxChannel === ch ? "border-ink bg-ink text-white" : "border-line bg-white text-ink-muted hover:text-ink",
                    )}
                  >
                    {ch === "all" ? "All" : CHANNEL_META[ch].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="hs-scroll flex-1 divide-y divide-line-soft overflow-y-auto">
              {filteredThreads.map((t) => {
                const replied = Boolean(t.initialReplied || world.sa.replies[t.id]);
                const selected = t.id === activeThread?.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    data-testid={`social-thread-${t.id}`}
                    onClick={() => setActiveThreadId(t.id)}
                    className={cx("block w-full px-3.5 py-3 text-left transition-colors", selected ? "border-l-[3px] border-l-hs-orange bg-[#fff7f2]" : "hover:bg-[#fafafa]")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5">
                        <ChannelBadge channel={t.channel} compact />
                        <span className="text-[13px] font-semibold">{t.authorName}</span>
                      </span>
                      <Tag tone={replied ? "green" : "amber"}>{replied ? "Replied" : "Needs reply"}</Tag>
                    </div>
                    <p className="mt-0.5 text-[11.5px] text-ink-muted">
                      {t.authorTitle} &middot; {t.organization}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-ink">{t.message}</p>
                    <p className="mt-1 text-[11px] text-ink-muted">
                      {t.kind} on {t.postTitle} &middot; {relative(t.at)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {activeThread ? (
            <div className="flex flex-col bg-[#fafafa]" data-testid="social-thread-detail">
              <div className="border-b border-line-soft bg-white px-5 py-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={activeThread.authorName} color={colorFor(activeThread.id)} size={36} />
                    <div>
                      <p className="text-[14.5px] font-semibold">{activeThread.authorName}</p>
                      <p className="text-[12.5px] text-ink-muted">
                        {activeThread.authorTitle}, {activeThread.organization}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChannelBadge channel={activeThread.channel} />
                    <Tag>{activeThread.kind}</Tag>
                  </div>
                </div>
                <p className="mt-2 text-[12px] text-ink-muted">
                  Referenced post: <span className="font-semibold text-ink">{activeThread.postTitle}</span>
                </p>
              </div>

              <div className="hs-scroll flex-1 space-y-3 overflow-y-auto p-5">
                <div className="max-w-[640px] rounded-[10px] border border-line bg-white p-4">
                  <div className="flex items-center justify-between text-[12px] text-ink-muted">
                    <span className="font-semibold text-ink">{activeThread.authorName}</span>
                    <span>{relative(activeThread.at)}</span>
                  </div>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed">{activeThread.message}</p>
                </div>

                {activeThread.initialReplied && activeThread.initialReplyText ? (
                  <div className="ml-auto max-w-[640px] rounded-[10px] border border-[#b9e1dc] bg-[#f1faf8] p-4">
                    <div className="flex items-center justify-between text-[12px] text-[#00514f]">
                      <span className="font-semibold">Crestline Clinical Staffing (via HubSpot Social)</span>
                      <span>Sent earlier</span>
                    </div>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed">{activeThread.initialReplyText}</p>
                  </div>
                ) : null}

                {activeReply ? (
                  <div className="hs-pop ml-auto max-w-[640px] rounded-[10px] border border-[#b7e2c4] bg-[#eefaf1] p-4" data-testid="social-reply-sent">
                    <div className="flex items-center justify-between text-[12px] text-[#0b5b2b]">
                      <span className="font-semibold">Crestline Clinical Staffing (replied via HubSpot)</span>
                      <span>{relative(activeReply.at)}</span>
                    </div>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed">{activeReply.text}</p>
                  </div>
                ) : null}
              </div>

              <div className="border-t border-line bg-white p-4">
                <div className="flex items-center justify-between text-[12px] text-ink-muted">
                  <span className="font-semibold text-ink">Reply directly on {CHANNEL_META[activeThread.channel].label}</span>
                  <span>Brand voice: Crestline Clinical Authority</span>
                </div>
                <textarea
                  value={activeReplyInput}
                  onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [activeThread.id]: e.target.value }))}
                  rows={3}
                  data-testid="social-reply-input"
                  className="mt-2 w-full resize-none rounded-[6px] border border-line p-2.5 text-[13px] leading-snug focus:border-ink focus:outline-none"
                />
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[12px] text-[#0b5b2b]">
                    <Icon name="shield" size={13} /> HIPAA-safe reply check passed
                  </span>
                  <div className="flex items-center gap-2">
                    {activeReply ? (
                      <Button variant="secondary" size="sm" onClick={() => navigate("/insights")}>
                        Continue to Insights <Icon name="arrowRight" size={14} />
                      </Button>
                    ) : null}
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={!activeReplyInput.trim()}
                      data-testid="social-reply-send"
                      onClick={() => dispatch({ t: "sa.replyInbox", threadId: activeThread.id, text: activeReplyInput, at: nowMs() })}
                    >
                      <Icon name="send" size={14} /> Send reply
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
