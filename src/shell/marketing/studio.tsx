"use client";

import { useState } from "react";
import { nowMs } from "@/lib/format";
import { useShell } from "@/store/store";
import type { MarketingStudioConfig, MsAssetFormatId } from "@/verticals/types";
import { Icon, Sparkle } from "../icons";
import { A, AiPill, Avatar, Button, Card, colorFor, cx, Empty, Tag } from "../ui";
import { contactName } from "../pages/lists";

type StageId = "brief" | "plan" | "voice" | "asset" | "remix" | "approve" | "schedule";

const STAGES: { id: StageId; num: number; label: string }[] = [
  { id: "brief", num: 1, label: "Campaign Brief" },
  { id: "plan", num: 2, label: "Campaign Plan" },
  { id: "voice", num: 3, label: "Brand Voice" },
  { id: "asset", num: 4, label: "Source Asset" },
  { id: "remix", num: 5, label: "Content Remix" },
  { id: "approve", num: 6, label: "Review & Approve" },
  { id: "schedule", num: 7, label: "Schedule Outreach" },
];

function activeStageFor(ms: ReturnType<typeof useShell>["world"]["ms"], uiStage?: string): StageId {
  if (uiStage && STAGES.some((s) => s.id === uiStage)) return uiStage as StageId;
  if (!ms.briefDone) return "brief";
  if (!ms.planDone) return "plan";
  if (!ms.voiceDone) return "voice";
  if (!ms.assetDone) return "asset";
  if (!ms.remixed) return "remix";
  if (ms.approved.length < 4) return "approve";
  return "schedule";
}

function stageDone(stage: StageId, ms: ReturnType<typeof useShell>["world"]["ms"]): boolean {
  switch (stage) {
    case "brief":
      return ms.briefDone;
    case "plan":
      return ms.planDone;
    case "voice":
      return ms.voiceDone;
    case "asset":
      return ms.assetDone;
    case "remix":
      return ms.remixed;
    case "approve":
      return ms.approved.length >= 4;
    case "schedule":
      return ms.scheduled;
  }
}

/**
 * Native HubSpot Marketing Studio workspace (Steps 2–8).
 * Carries ZERO Penguin markers: Marketing Studio, Brand Voice, Content Remix,
 * Asset Approvals, and ICP Outreach Scheduling are all native HubSpot capabilities.
 */
export function MarketingStudioPage() {
  const { pack, world, dispatch } = useShell();
  const config = pack.demos.marketingStudio;
  if (!config) {
    return (
      <div className="p-10">
        <Card>
          <Empty title="Marketing Studio is available in the SaaS demo">Switch to Lumenstack to explore the Marketing Studio ICP outreach flow.</Empty>
        </Card>
      </div>
    );
  }

  const stage = activeStageFor(world.ms, world.ui["ms.stage"]);
  const marketer = config.marketer;
  const statusLabel = world.ms.scheduled ? "Scheduled & Live" : world.ms.approved.length >= 4 ? "Approved" : world.ms.remixed ? "In Review" : "Draft";
  const statusTone = world.ms.scheduled ? "green" : world.ms.approved.length >= 4 ? "blue" : "amber";

  return (
    <div className="min-h-full pb-8" data-testid="marketing-studio-page" data-stage={stage}>
      <header className="border-b border-line bg-white px-6 py-4">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#fff1e8] text-hs-orange">
              <Icon name="megaphone" size={19} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[18px] font-semibold leading-tight">Marketing Studio</h1>
                <AiPill />
                <Tag tone={statusTone}>{statusLabel}</Tag>
              </div>
              <p className="mt-0.5 text-[12.5px] text-ink-muted">
                {config.campaignName} · Owner: {marketer?.name ?? "Maya Chen"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <A to={`/companies/${config.companyId}`} className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-line bg-white px-3 text-[12.5px] font-semibold hover:bg-[#f5f5f5]">
              <Icon name="company" size={14} /> Kestrel Ops (ICP)
            </A>
            <A to="/marketing/dashboard" className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-line bg-white px-3 text-[12.5px] font-semibold hover:bg-[#f5f5f5]" data-testid="ms-nav-dashboard">
              <Icon name="chart" size={14} /> Campaign Dashboard
            </A>
          </div>
        </div>

        <nav aria-label="Marketing Studio steps" className="mx-auto mt-4 flex max-w-[1200px] gap-1.5 overflow-x-auto pb-0.5">
          {STAGES.map((s) => {
            const active = s.id === stage;
            const done = stageDone(s.id, world.ms);
            return (
              <button
                key={s.id}
                type="button"
                data-testid={`ms-stage-${s.id}`}
                aria-current={active ? "step" : undefined}
                onClick={() => dispatch({ t: "ui", k: "ms.stage", v: s.id })}
                className={cx(
                  "flex shrink-0 items-center gap-2 rounded-[8px] border px-3 py-1.5 text-[12.5px] font-semibold transition-colors",
                  active
                    ? "border-ink bg-ink text-white"
                    : done
                      ? "border-[#bfe3cd] bg-[#f0faf4] text-[#0b5b2b] hover:border-[#0b5b2b]"
                      : "border-line bg-white text-ink-muted hover:border-ink hover:text-ink",
                )}
              >
                <span
                  className={cx(
                    "inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold",
                    active ? "bg-white text-ink" : done ? "bg-[#0b5b2b] text-white" : "bg-[#ececec] text-ink-muted",
                  )}
                >
                  {done && !active ? <Icon name="check" size={11} strokeWidth={2.6} /> : s.num}
                </span>
                {s.label}
              </button>
            );
          })}
        </nav>
      </header>

      <div className="mx-auto max-w-[1200px] px-6 pt-5">
        {stage === "brief" ? <BriefStage config={config} /> : null}
        {stage === "plan" ? <PlanStage config={config} /> : null}
        {stage === "voice" ? <BrandVoiceStage config={config} /> : null}
        {stage === "asset" ? <SourceAssetStage config={config} /> : null}
        {stage === "remix" ? <RemixStage config={config} /> : null}
        {stage === "approve" ? <ApproveStage config={config} /> : null}
        {stage === "schedule" ? <ScheduleStage config={config} /> : null}
      </div>
    </div>
  );
}

function BriefStage({ config }: { config: MarketingStudioConfig }) {
  const { world, dispatch } = useShell();
  const goal = world.ms.briefGoal ?? config.brief.goal;
  const audience = world.ms.briefAudience ?? config.brief.audience;
  const offer = world.ms.briefOffer ?? config.brief.offer;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]" data-testid="ms-brief-stage">
      <Card title="Campaign Brief" right={<Tag tone="pink">Marketing Studio</Tag>}>
        <p className="text-[13px] text-ink-muted">
          Define your goal, ICP audience, and core offer once. Breeze turns this brief into a coordinated multi-channel campaign plan.
        </p>

        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="text-[12.5px] font-semibold">Campaign goal</span>
            <textarea
              rows={2}
              value={goal}
              data-testid="ms-brief-goal"
              onChange={(e) => dispatch({ t: "ms.briefEdit", field: "goal", value: e.target.value })}
              className="mt-1 w-full rounded-[6px] border border-line bg-white px-3 py-2 text-[13.5px] focus:border-ink focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-[12.5px] font-semibold">Target ICP audience</span>
            <textarea
              rows={2}
              value={audience}
              data-testid="ms-brief-audience"
              onChange={(e) => dispatch({ t: "ms.briefEdit", field: "audience", value: e.target.value })}
              className="mt-1 w-full rounded-[6px] border border-line bg-white px-3 py-2 text-[13.5px] focus:border-ink focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-[12.5px] font-semibold">Offer & anchor asset</span>
            <textarea
              rows={2}
              value={offer}
              data-testid="ms-brief-offer"
              onChange={(e) => dispatch({ t: "ms.briefEdit", field: "offer", value: e.target.value })}
              className="mt-1 w-full rounded-[6px] border border-line bg-white px-3 py-2 text-[13.5px] focus:border-ink focus:outline-none"
            />
          </label>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-line-soft pt-4">
          <span className="text-[12.5px] text-ink-muted">{config.brief.timeline}</span>
          <Button variant="primary" data-testid="ms-brief-submit" onClick={() => dispatch({ t: "ms.briefSubmit" })}>
            <Sparkle size={14} /> Generate campaign plan
          </Button>
        </div>
      </Card>

      <div className="space-y-4">
        <Card title="Target ICP Segment">
          <dl className="grid grid-cols-2 gap-3">
            <div className="rounded-[8px] border border-line-soft bg-[#fafafa] p-3">
              <dt className="text-[11.5px] text-ink-muted">ICP Accounts</dt>
              <dd className="mt-0.5 text-[22px] font-bold">{config.brief.targetAccounts}</dd>
            </div>
            <div className="rounded-[8px] border border-line-soft bg-[#fafafa] p-3">
              <dt className="text-[11.5px] text-ink-muted">Buying Contacts</dt>
              <dd className="mt-0.5 text-[22px] font-bold">{config.brief.targetContacts}</dd>
            </div>
          </dl>
          <div className="mt-3 rounded-[8px] border border-[#bfe3cd] bg-[#f0faf4] p-3 text-[12.5px]">
            <p className="font-semibold text-[#0b5b2b]">Featured Tier 1 Account: Kestrel Ops</p>
            <p className="mt-0.5 text-ink-muted">ICP score 94/100 · Elena Morales, Marcus Bennett, Priya Nair enrolled.</p>
          </div>
        </Card>
        <Card title="Estimated HubSpot Credits">
          <p className="text-[24px] font-bold">~{config.plan.estimatedCredits} credits</p>
          <p className="mt-1 text-[12.5px] text-ink-muted">Covers AI campaign plan, 4-format Content Remix, and role-tailored ICP personalization.</p>
        </Card>
      </div>
    </div>
  );
}

function PlanStage({ config }: { config: MarketingStudioConfig }) {
  const { world, dispatch } = useShell();
  const [selectedDay, setSelectedDay] = useState(config.plan.sequence[0].day);
  const disabled = world.ms.disabledChannels;
  const activeChannelCount = config.plan.channels.length - disabled.length;

  return (
    <div className="space-y-5" data-testid="ms-plan-stage">
      <Card
        title={
          <span className="flex items-center gap-2">
            <span>Generated Campaign Plan</span>
            <AiPill />
          </span>
        }
        right={
          <span className="text-[12.5px] font-semibold text-ink-muted">
            {activeChannelCount} channels · {config.plan.sequence.length} sequenced touches · ~{config.plan.estimatedCredits} credits
          </span>
        }
      >
        <p className="text-[13.5px] text-ink-muted">{config.plan.summary}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {config.plan.channels.map((ch) => {
            const on = !disabled.includes(ch.id);
            return (
              <button
                key={ch.id}
                type="button"
                data-testid={`ms-channel-${ch.id}`}
                onClick={() => dispatch({ t: "ms.toggleChannel", channelId: ch.id })}
                className={cx(
                  "rounded-[10px] border p-3.5 text-left transition-colors",
                  on ? "border-[#0b5b2b]/40 bg-[#f6fcf8]" : "border-line bg-[#fafafa] opacity-65",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13.5px] font-semibold">{ch.label}</span>
                  <Tag tone={on ? "green" : "neutral"}>{on ? "Included" : "Paused"}</Tag>
                </div>
                <p className="mt-1 text-[12px] font-semibold text-link">{ch.cadence}</p>
                <p className="mt-1 text-[12px] text-ink-muted">{ch.role}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          <p className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Sequence & timing</p>
          <ol className="mt-2.5 grid gap-2.5 lg:grid-cols-5">
            {config.plan.sequence.map((touch) => {
              const selected = selectedDay === touch.day;
              return (
                <li key={touch.day}>
                  <button
                    type="button"
                    onClick={() => setSelectedDay(touch.day)}
                    data-testid={`ms-touch-${touch.day.toLowerCase().replace(/\s+/g, "-")}`}
                    className={cx(
                      "flex h-full w-full flex-col rounded-[10px] border p-3 text-left transition-colors",
                      selected ? "border-hs-orange bg-[#fff7f2]" : "border-line bg-white hover:border-ink",
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <Tag tone={selected ? "orange" : "neutral"}>{touch.day}</Tag>
                      <span className="text-[11px] text-ink-muted">{touch.credits} cr</span>
                    </div>
                    <p className="mt-2 text-[13px] font-semibold leading-snug">{touch.title}</p>
                    <p className="mt-1 text-[12px] text-ink-muted">{touch.channel}</p>
                    <p className="mt-1.5 text-[12px] leading-snug text-ink-muted">{touch.detail}</p>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-line-soft pt-4">
          <span className="text-[12.5px] text-ink-muted">Click any channel card to toggle or inspect timing before confirming.</span>
          <Button variant="primary" data-testid="ms-plan-confirm" onClick={() => dispatch({ t: "ms.planConfirm" })}>
            Confirm plan & set Brand Voice <Icon name="arrowRight" size={15} />
          </Button>
        </div>
      </Card>
    </div>
  );
}

function BrandVoiceStage({ config }: { config: MarketingStudioConfig }) {
  const { world, dispatch } = useShell();
  const voiceId = world.ms.voiceId ?? config.defaultVoiceId;
  const voice = config.voices.find((v) => v.id === voiceId) ?? config.voices[0];

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]" data-testid="ms-voice-stage">
      <Card title="Saved Brand Voices">
        <p className="text-[12.5px] text-ink-muted">Configure Brand Voice once in HubSpot. Marketing Studio enforces it across every remixed email, blog, social post, and landing page.</p>
        <div className="mt-3 space-y-2.5">
          {config.voices.map((v) => {
            const active = v.id === voice.id;
            return (
              <button
                key={v.id}
                type="button"
                data-testid={`ms-voice-${v.id}`}
                onClick={() => dispatch({ t: "ms.selectVoice", voiceId: v.id })}
                className={cx(
                  "block w-full rounded-[10px] border p-3.5 text-left transition-colors",
                  active ? "border-hs-orange bg-[#fff7f2]" : "border-line bg-white hover:border-ink",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13.5px] font-semibold">{v.name}</span>
                  {active ? <Tag tone="orange">Selected</Tag> : null}
                </div>
                <p className="mt-1 text-[12px] text-ink-muted">{v.tagline}</p>
              </button>
            );
          })}
        </div>
      </Card>

      <Card title={voice.name} right={<Tag tone="green">Applied globally to campaign</Tag>}>
        <div className="flex flex-wrap gap-2">
          {voice.tonePillars.map((pillar) => (
            <Tag key={pillar} tone="blue">
              {pillar}
            </Tag>
          ))}
        </div>
        <p className="mt-3 text-[13px] text-ink-muted">
          <span className="font-semibold text-ink">Target audience:</span> {voice.audience}
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[8px] border border-[#bfe3cd] bg-[#f6fcf8] p-3.5">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[#0b5b2b]">Writing rules: Do</p>
            <ul className="mt-2 space-y-1.5 text-[13px]">
              {voice.dos.map((d) => (
                <li key={d} className="flex gap-2">
                  <Icon name="check" size={14} className="mt-0.5 shrink-0 text-[#0b5b2b]" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[8px] border border-[#f5c2be] bg-[#fff8f7] p-3.5">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[#99201a]">Guardrails: Avoid</p>
            <ul className="mt-2 space-y-1.5 text-[13px]">
              {voice.donts.map((d) => (
                <li key={d} className="flex gap-2">
                  <Icon name="close" size={14} className="mt-0.5 shrink-0 text-[#99201a]" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 rounded-[8px] border border-line-soft bg-[#fafafa] p-3.5" data-testid="ms-voice-sample">
          <p className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Live Brand Voice Preview</p>
          <p className="mt-1.5 text-[14px] font-medium leading-relaxed text-ink">&ldquo;{voice.sampleLine}&rdquo;</p>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-line-soft pt-4">
          <span className="text-[12.5px] text-ink-muted">Set once — applied automatically to every format in Content Remix.</span>
          <Button variant="primary" data-testid="ms-voice-apply" onClick={() => dispatch({ t: "ms.voiceApply" })}>
            Apply Brand Voice to campaign <Icon name="arrowRight" size={15} />
          </Button>
        </div>
      </Card>
    </div>
  );
}

function SourceAssetStage({ config }: { config: MarketingStudioConfig }) {
  const { dispatch } = useShell();
  const [showChapters, setShowChapters] = useState(true);
  const asset = config.sourceAsset;

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]" data-testid="ms-asset-stage">
      <Card title="Source Asset Attached" right={<Tag tone="green">Ready</Tag>}>
        <div className="rounded-[10px] border border-[#d6dee6] bg-gradient-to-br from-[#16324a] to-[#0b6e6e] p-5 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/75">{asset.format}</p>
          <p className="mt-2 text-[19px] font-bold leading-snug">{asset.title}</p>
          <p className="mt-2 text-[12.5px] leading-relaxed text-white/80">{asset.subtitle}</p>
          <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-3 text-[11.5px] text-white/75">
            <span>{asset.author}</span>
            <span>{asset.publishedLabel}</span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2.5 rounded-[8px] border border-line-soft bg-[#fafafa] px-3 py-2.5 text-[12.5px]">
          <Icon name="book" size={16} className="shrink-0 text-hs-orange" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{asset.fileName}</p>
            <p className="text-ink-muted">{asset.fileSize} · Uploaded to HubSpot Files</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {asset.keyStats.map((st) => (
            <div key={st.value} className="rounded-[8px] border border-line-soft bg-white p-2.5 text-center">
              <p className="text-[16px] font-bold text-ink">{st.value}</p>
              <p className="mt-0.5 text-[11px] leading-tight text-ink-muted">{st.label}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card
        title="Source Content Breakdown"
        right={
          <Button size="sm" variant="ghost" onClick={() => setShowChapters((s) => !s)} data-testid="ms-toggle-chapters">
            {showChapters ? "Hide chapters" : "Preview chapters"}
          </Button>
        }
      >
        <p className="text-[13.5px] leading-relaxed text-ink-muted">{asset.summary}</p>
        {showChapters ? (
          <ol className="mt-4 space-y-2.5">
            {asset.chapters.map((ch) => (
              <li key={ch.number} className="flex gap-3 rounded-[8px] border border-line-soft bg-[#fafafa] px-3.5 py-2.5">
                <span className="font-mono text-[12px] font-bold text-hs-orange">{ch.number}</span>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold">{ch.title}</p>
                  <p className="mt-0.5 text-[12.5px] text-ink-muted">{ch.summary}</p>
                </div>
              </li>
            ))}
          </ol>
        ) : null}

        <div className="mt-5 flex items-center justify-between border-t border-line-soft pt-4">
          <span className="text-[12.5px] text-ink-muted">Marketing Studio will remix this single source asset into four campaign formats.</span>
          <Button variant="primary" data-testid="ms-asset-attach" onClick={() => dispatch({ t: "ms.assetAttach" })}>
            Attach & open Content Remix <Icon name="arrowRight" size={15} />
          </Button>
        </div>
      </Card>
    </div>
  );
}

function RemixStage({ config }: { config: MarketingStudioConfig }) {
  const { world, dispatch } = useShell();
  const voice = config.voices.find((v) => v.id === (world.ms.voiceId ?? config.defaultVoiceId)) ?? config.voices[0];
  const totalCredits = config.remixedAssets.reduce((s, r) => s + r.creditsUsed, 0);

  return (
    <div className="space-y-5" data-testid="ms-remix-stage">
      <Card
        title={
          <span className="flex items-center gap-2">
            <span>Content Remix Canvas</span>
            <AiPill />
          </span>
        }
        right={
          <span className="text-[12.5px] text-ink-muted">
            Brand Voice: <strong className="text-ink">{voice.name}</strong> · {totalCredits} HubSpot Credits
          </span>
        }
      >
        <div className="grid items-center gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="rounded-[10px] border-2 border-hs-orange/50 bg-[#fff7f2] p-4">
            <Tag tone="orange">1 Source Asset</Tag>
            <p className="mt-2.5 text-[15px] font-bold leading-snug">{config.sourceAsset.title}</p>
            <p className="mt-1.5 text-[12.5px] text-ink-muted">{config.sourceAsset.fileName}</p>
            <div className="mt-3 border-t border-[#f5c2a8] pt-2.5 text-[12px] text-ink-muted">
              Voice locked: <strong className="text-ink">{voice.name}</strong>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {config.remixedAssets.map((item) => (
              <div key={item.id} className="rounded-[10px] border border-line bg-white p-4" data-testid={`ms-remix-card-${item.id}`}>
                <div className="flex items-center justify-between gap-2">
                  <Tag tone="blue">{item.label}</Tag>
                  <Tag tone={world.ms.remixed ? "green" : "pink"}>{world.ms.remixed ? `Generated · ${item.voiceScore}% voice` : `${item.creditsUsed} credits`}</Tag>
                </div>
                <p className="mt-2 text-[14px] font-semibold leading-snug">{item.title}</p>
                <p className="mt-1 text-[12.5px] text-ink-muted">{item.summary}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-line-soft pt-4">
          <span className="text-[12.5px] text-ink-muted">
            One ebook produces an outreach email, a blog post, a 3-post LinkedIn series, and gated landing page copy in seconds.
          </span>
          <Button variant="primary" data-testid="ms-remix-generate" onClick={() => dispatch({ t: "ms.remix" })}>
            <Sparkle size={14} /> {world.ms.remixed ? "Open generated assets for review" : "Generate all 4 formats"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function ApproveStage({ config }: { config: MarketingStudioConfig }) {
  const { world, dispatch } = useShell();
  const [selectedId, setSelectedId] = useState<MsAssetFormatId>("email");
  const asset = config.remixedAssets.find((a) => a.id === selectedId) ?? config.remixedAssets[0];
  const approved = world.ms.approved;
  const isApproved = approved.includes(asset.id);
  const allApproved = approved.length >= config.remixedAssets.length;
  const body = world.ms.assetEdits[asset.id] ?? asset.body;

  return (
    <div className="grid gap-5 lg:grid-cols-[290px_minmax(0,1fr)]" data-testid="ms-approve-stage">
      <Card title={`Generated Assets (${approved.length}/${config.remixedAssets.length})`} pad={false}>
        <ul className="divide-y divide-line-soft">
          {config.remixedAssets.map((item) => {
            const done = approved.includes(item.id);
            const active = item.id === asset.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  data-testid={`ms-review-tab-${item.id}`}
                  onClick={() => setSelectedId(item.id)}
                  className={cx("block w-full px-4 py-3 text-left transition-colors hover:bg-[#f7f7f7]", active && "bg-[#fff7f2]")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13.5px] font-semibold">{item.label}</span>
                    <Tag tone={done ? "green" : "amber"}>{done ? "Approved" : "Needs review"}</Tag>
                  </div>
                  <p className="mt-1 truncate text-[12px] text-ink-muted">{item.title}</p>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="border-t border-line-soft p-3.5">
          <Button variant="primary" className="w-full" data-testid="ms-approve-all" onClick={() => dispatch({ t: "ms.approveAll" })}>
            <Icon name="check" size={14} /> {allApproved ? "Continue to Schedule Outreach" : "Approve all 4 assets"}
          </Button>
        </div>
      </Card>

      <Card
        title={
          <span className="flex items-center gap-2">
            <span>{asset.label}</span>
            <Tag tone={isApproved ? "green" : "amber"}>{isApproved ? "Approved" : "Needs review"}</Tag>
          </span>
        }
        right={
          <span className="text-[12px] text-ink-muted">
            Brand Voice match: <strong className="text-[#0b5b2b]">{asset.voiceScore}%</strong>
          </span>
        }
      >
        <div className="rounded-[8px] border border-line-soft bg-[#fafafa] p-3.5">
          <p className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Headline / Subject</p>
          <p className="mt-1 text-[14.5px] font-semibold">{asset.headline}</p>
          {asset.subheadline ? <p className="mt-0.5 text-[12.5px] text-ink-muted">{asset.subheadline}</p> : null}
        </div>

        <label className="mt-3 block">
          <span className="text-[12px] font-semibold text-ink-muted">Generated copy (editable before approval)</span>
          <textarea
            rows={10}
            value={body}
            data-testid={`ms-asset-body-${asset.id}`}
            onChange={(e) => dispatch({ t: "ms.editAsset", id: asset.id, body: e.target.value })}
            className="mt-1 w-full rounded-[6px] border border-line bg-white px-3.5 py-2.5 text-[13.5px] leading-relaxed focus:border-ink focus:outline-none"
          />
        </label>

        {asset.cta ? (
          <div className="mt-3 flex items-center gap-2 text-[12.5px]">
            <span className="font-semibold text-ink-muted">Primary CTA:</span>
            <span className="rounded-[5px] bg-hs-orange px-2.5 py-1 text-[12px] font-semibold text-white">{asset.cta}</span>
          </div>
        ) : null}

        <dl className="mt-4 grid gap-2 border-t border-line-soft pt-3 sm:grid-cols-3">
          {asset.meta.map((m) => (
            <div key={m.label}>
              <dt className="text-[11.5px] text-ink-muted">{m.label}</dt>
              <dd className="text-[12.5px] font-semibold">{m.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 flex items-center justify-end gap-2 border-t border-line-soft pt-3">
          <Button
            variant={isApproved ? "secondary" : "primary"}
            size="sm"
            disabled={isApproved}
            data-testid={`ms-approve-${asset.id}`}
            onClick={() => dispatch({ t: "ms.approveAsset", id: asset.id })}
          >
            <Icon name="check" size={14} /> {isApproved ? "Approved" : `Approve ${asset.label}`}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function ScheduleStage({ config }: { config: MarketingStudioConfig }) {
  const { world, dispatch, navigate } = useShell();
  const [selectedContactId, setSelectedContactId] = useState(config.outreach[0].contactId);
  const recipient = config.outreach.find((o) => o.contactId === selectedContactId) ?? config.outreach[0];
  const contact = world.contacts.find((c) => c.id === recipient.contactId);
  const scheduled = world.ms.scheduled;

  return (
    <div className="space-y-4" data-testid="ms-schedule-stage">
      {scheduled ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#bfe3cd] bg-[#f0faf4] px-5 py-3.5" data-testid="ms-scheduled-banner">
          <div className="flex items-start gap-2.5">
            <Icon name="check" size={18} className="mt-0.5 text-[#0b5b2b]" />
            <div>
              <p className="text-[14px] font-semibold text-[#0b5b2b]">
                ICP outreach scheduled for {config.brief.targetAccounts} Tier 1 accounts ({config.brief.targetContacts} contacts)
              </p>
              <p className="text-[12.5px] text-ink-muted">
                Role-tailored emails sent to Elena Morales, Marcus Bennett, and Priya Nair at Kestrel Ops.
              </p>
            </div>
          </div>
          <Button variant="primary" size="sm" data-testid="ms-go-inbox" onClick={() => navigate("/marketing/off-platform/inbox")}>
            Open prospect&apos;s inbox (Off-platform) <Icon name="arrowRight" size={14} />
          </Button>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[310px_minmax(0,1fr)]">
        <Card title="Kestrel Ops Buying Committee" pad={false}>
          <p className="border-b border-line-soft px-4 py-2.5 text-[12px] text-ink-muted">
            Each contact receives copy tailored to their role and Kestrel Ops&apos;s Snowflake + Okta stack.
          </p>
          <ul className="divide-y divide-line-soft">
            {config.outreach.map((item) => {
              const c = world.contacts.find((x) => x.id === item.contactId);
              const active = item.contactId === recipient.contactId;
              return (
                <li key={item.contactId}>
                  <button
                    type="button"
                    data-testid={`ms-recipient-${item.contactId}`}
                    onClick={() => setSelectedContactId(item.contactId)}
                    className={cx("flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-[#f7f7f7]", active && "bg-[#fff7f2]")}
                  >
                    <Avatar name={contactName(c)} color={colorFor(item.contactId)} size={30} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[13.5px] font-semibold">{contactName(c)}</span>
                        <Tag tone={item.priority === "Primary buyer" ? "orange" : "blue"}>{item.priority}</Tag>
                      </div>
                      <p className="truncate text-[12px] text-ink-muted">{item.role}</p>
                      <p className="mt-1 text-[11.5px] text-link">{item.sendWindow}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-line-soft p-3.5">
            <Button
              variant="primary"
              icon="send"
              className="w-full"
              disabled={scheduled}
              data-testid="ms-schedule-send"
              onClick={() => {
                dispatch({ t: "ms.schedule", at: nowMs() });
                navigate("/marketing/off-platform/inbox");
              }}
            >
              {scheduled ? "Outreach scheduled" : "Schedule & send ICP outreach"}
            </Button>
          </div>
        </Card>

        <Card title="Role-Tailored Email Preview" right={<Tag tone="teal">{recipient.sendWindow}</Tag>}>
          <div className="mb-3 rounded-[8px] border border-line-soft bg-[#fafafa] px-3.5 py-2.5 text-[12.5px]">
            <span className="font-semibold text-ink">Personalization angle:</span>{" "}
            <span className="text-ink-muted">{recipient.personalizationAngle}</span>
          </div>
          <dl className="space-y-1 text-[13px]">
            <div className="flex gap-2">
              <dt className="w-16 shrink-0 text-ink-muted">To</dt>
              <dd className="font-medium">
                {contactName(contact)} &lt;{contact?.email}&gt;
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-16 shrink-0 text-ink-muted">Subject</dt>
              <dd className="font-semibold" data-testid="ms-outreach-subject">
                {recipient.subject}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-16 shrink-0 text-ink-muted">Preview</dt>
              <dd className="text-ink-muted">{recipient.previewText}</dd>
            </div>
          </dl>
          <div className="mt-4 rounded-[8px] border border-line bg-white p-4">
            <p className="whitespace-pre-line text-[13.5px] leading-relaxed">{recipient.body}</p>
            <div className="mt-4">
              <span className="inline-flex h-9 items-center rounded-[6px] bg-hs-orange px-4 text-[13px] font-semibold text-white">
                {recipient.ctaLabel}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
