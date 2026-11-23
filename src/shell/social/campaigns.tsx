"use client";

import { useState } from "react";
import { useShell } from "@/store/store";
import { date, money } from "../format";
import { Icon } from "../icons";
import { A, Button, Card, cx, Empty, Tag } from "../ui";

/**
 * HubSpot Marketing > Campaigns screen (Step 1 of Flow 3).
 * Native HubSpot Campaigns capability — carries no Penguin marker.
 */
export function CampaignsPage() {
  const { pack, world, dispatch, navigate } = useShell();
  const cfg = pack.demos.socialAds;
  const [selectedId, setSelectedId] = useState(cfg?.heroCampaignId ?? cfg?.campaigns[0]?.id ?? "");

  if (!cfg) {
    return (
      <div className="p-10">
        <Card>
          <Empty title="Campaigns are not part of this vertical's demos">
            <A to="/deals" className="hs-link">
              Go to deals
            </A>
          </Empty>
        </Card>
      </div>
    );
  }

  const campaign = cfg.campaigns.find((c) => c.id === selectedId) ?? cfg.campaigns[0];
  const owner = pack.personas.find((p) => p.id === campaign.ownerId);
  const spendPct = Math.min(100, Math.round((campaign.spendToDate / campaign.budget) * 100));

  const openCalendar = () => {
    dispatch({ t: "sa.openCampaign" });
    navigate("/social/calendar");
  };

  return (
    <div className="min-h-full px-6 py-5" data-testid="campaigns-page">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">Marketing &rsaquo; Campaigns</p>
          <h1 className="mt-0.5 text-[24px] font-semibold tracking-tight">Campaigns</h1>
        </div>
        <div className="flex items-center gap-2.5">
          <Tag tone="teal">HIPAA-safe B2B messaging</Tag>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[310px_minmax(0,1fr)] gap-4">
        <Card title={`Active campaigns (${cfg.campaigns.length})`} pad={false} testId="campaigns-list">
          <div className="divide-y divide-line-soft border-t border-line-soft">
            {cfg.campaigns.map((c) => {
              const active = c.id === campaign.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  data-testid={`campaign-row-${c.id}`}
                  className={cx("block w-full px-4 py-3 text-left transition-colors", active ? "border-l-[3px] border-l-hs-orange bg-[#fff7f2]" : "hover:bg-[#fafafa]")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13.5px] font-semibold leading-snug">{c.name}</span>
                    <Tag tone="green">{c.status}</Tag>
                  </div>
                  <p className="mt-1 text-[12px] text-ink-muted">
                    Budget: <span className="font-semibold text-ink">{money(c.budget)}</span> &middot; Spent {money(c.spendToDate)}
                  </p>
                </button>
              );
            })}
          </div>
        </Card>

        <div className="space-y-4" data-testid="campaign-detail">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line-soft pb-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Tag tone="green">{campaign.status}</Tag>
                  {world.sa.campaignOpened && campaign.id === cfg.heroCampaignId ? <Tag tone="blue">Calendar linked</Tag> : null}
                  <span className="text-[12px] text-ink-muted">
                    {date(campaign.startDate)} &ndash; {date(campaign.endDate)}
                  </span>
                </div>
                <h2 className="mt-1.5 text-[20px] font-semibold tracking-tight" data-testid="campaign-title">
                  {campaign.name}
                </h2>
                <p className="mt-1 text-[13px] text-ink-muted">
                  Owner: <span className="font-medium text-ink">{owner?.name ?? "Claire Bennett"}</span> ({owner?.title ?? "Marketing Manager"})
                </p>
              </div>
              <Button variant="primary" onClick={openCalendar} data-testid="campaign-plan-btn">
                Plan social calendar <Icon name="arrowRight" size={15} />
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="rounded-[8px] border border-line-soft bg-[#fafafa] p-3.5" data-testid="campaign-goal">
                <p className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Campaign goal</p>
                <p className="mt-1.5 text-[13.5px] leading-snug">{campaign.goal}</p>
              </div>
              <div className="rounded-[8px] border border-line-soft bg-[#fafafa] p-3.5" data-testid="campaign-audience">
                <p className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Target audience</p>
                <p className="mt-1.5 text-[13.5px] leading-snug">{campaign.audience}</p>
              </div>
              <div className="rounded-[8px] border border-line-soft bg-[#fafafa] p-3.5" data-testid="campaign-budget">
                <p className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Campaign budget</p>
                <p className="mt-1 text-[22px] font-bold tabular-nums">{money(campaign.budget)}</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e4e4e4]">
                  <div className="h-full rounded-full bg-hs-orange" style={{ width: `${spendPct}%` }} />
                </div>
                <p className="mt-1.5 text-[12px] text-ink-muted">
                  {money(campaign.spendToDate)} spent to date ({spendPct}%)
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2.5 rounded-[8px] border border-[#b9e1dc] bg-[#f1faf8] px-3.5 py-2.5 text-[12.5px] text-[#00514f]">
              <Icon name="shield" size={16} className="mt-0.5 shrink-0" />
              <span>{campaign.complianceNote}</span>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card title="Channel budget allocation">
              <div className="space-y-3">
                {campaign.budgetSplit.map((row) => (
                  <div key={row.channel}>
                    <div className="flex items-baseline justify-between text-[13px]">
                      <span className="font-semibold">{row.channel}</span>
                      <span className="tabular-nums text-ink-muted">
                        <span className="font-semibold text-ink">{money(row.allocated)}</span> ({row.sharePct}%) &middot; {money(row.spent)} spent
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#ececec]">
                      <div className="h-full rounded-full bg-[#2f7f80]" style={{ width: `${row.sharePct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Brand voice & campaign assets">
              <div className="rounded-[8px] border border-line-soft bg-[#fafafa] p-3">
                <p className="text-[12px] font-semibold text-ink">{campaign.brandVoice.name}</p>
                <p className="mt-1 text-[12.5px] leading-snug text-ink-muted">{campaign.brandVoice.tone}</p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {campaign.assets.map((asset) => (
                  <div key={asset.type} className="flex items-center justify-between rounded-[6px] border border-line-soft px-3 py-2 text-[12.5px]">
                    <span className="text-ink-muted">{asset.type}</span>
                    <span className="font-semibold tabular-nums">{asset.count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
