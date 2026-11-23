"use client";

import { useState } from "react";
import { nowMs } from "@/lib/format";
import { useShell } from "@/store/store";
import { Ext } from "../ext";
import { money } from "../format";
import { Icon, Sparkle } from "../icons";
import { A, Avatar, Button, Card, colorFor, Tag } from "../ui";
import { contactName } from "../pages/lists";

/**
 * Custom ICP Fit & Buying Committee Card shown on the target SaaS company record (Step 1).
 * Wrapped in <Ext id="icp-fit-scoring"> so it carries the pulsing Penguin extension marker.
 */
export function IcpMatchCard({ companyId }: { companyId: string }) {
  const { pack, world, dispatch, navigate } = useShell();
  const config = pack.demos.marketingStudio;
  if (!config || config.companyId !== companyId) return null;

  const totalPoints = config.icp.matchedSignals.reduce((s, x) => s + x.points, 0);
  const launched = world.flags["ms.icpReviewed"] === true;

  return (
    <Ext id="icp-fit-scoring">
      <Card
        title={
          <span className="flex items-center gap-2">
            <span>ICP Fit & Buying Committee</span>
            <Tag tone="green">{config.icp.tier}</Tag>
          </span>
        }
        right={
          <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#0b5b2b]" data-testid="ms-icp-score">
            {config.icp.score} / 100
          </span>
        }
        testId="ms-icp-card"
      >
        <div className="mb-3 h-2 overflow-hidden rounded-full bg-[#e8edf2]">
          <div className="h-full rounded-full bg-[#1a9e4b]" style={{ width: `${Math.min(100, config.icp.score)}%` }} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Matched ICP criteria ({totalPoints} pts)</p>
            <ul className="mt-2 space-y-2">
              {config.icp.matchedSignals.map((sig) => (
                <li key={sig.label} className="flex items-start justify-between gap-3 rounded-[8px] border border-line-soft bg-[#fafafa] px-3 py-2 text-[12.5px]">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{sig.label}</p>
                    <p className="text-ink-muted">{sig.value}</p>
                  </div>
                  <Tag tone="teal">+{sig.points}</Tag>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Buying committee ({config.icp.buyingRoles.length} contacts)</p>
            <ul className="mt-2 space-y-2">
              {config.icp.buyingRoles.map((br) => {
                const contact = world.contacts.find((c) => c.id === br.contactId);
                if (!contact) return null;
                const name = contactName(contact);
                return (
                  <li key={br.contactId} className="flex items-start gap-2.5 rounded-[8px] border border-line-soft bg-white px-3 py-2">
                    <Avatar name={name} color={colorFor(contact.id)} size={30} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <A to={`/contacts/${contact.id}`} className="hs-link text-[13px]" data-testid={`ms-icp-contact-${contact.id}`}>
                          {name}
                        </A>
                        <Tag tone={br.contactId === config.primaryContactId ? "orange" : "blue"}>{br.role}</Tag>
                      </div>
                      <p className="text-[12px] text-ink-muted">
                        {contact.title} · {br.influence}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-3">
          <p className="text-[12.5px] text-ink-muted">
            Ready to enroll Kestrel Ops and {config.brief.targetAccounts - 1} other Tier 1 SaaS accounts in an automated ICP campaign.
          </p>
          <Button
            variant="primary"
            size="sm"
            data-testid="ms-launch-studio"
            onClick={() => {
              dispatch([{ t: "flag", k: "ms.icpReviewed" }, { t: "ui", k: "ms.stage", v: "brief" }]);
              navigate("/marketing/studio");
            }}
          >
            <Sparkle size={13} />
            {launched ? "Return to Marketing Studio" : "Launch ICP campaign in Marketing Studio"}
          </Button>
        </div>
      </Card>
    </Ext>
  );
}

/**
 * Native HubSpot conversion summary banner shown on Elena Morales's contact record (Step 11).
 * Carries NO Penguin marker: contact conversion, lifecycle transition, and timeline logging are native HubSpot.
 */
export function MarketingContactBanner({ contactId }: { contactId: string }) {
  const { pack, world, dispatch, navigate } = useShell();
  const config = pack.demos.marketingStudio;
  if (!config || config.primaryContactId !== contactId || !world.ms.converted) return null;

  const contact = world.contacts.find((c) => c.id === contactId);
  return (
    <Card testId="ms-contact-converted">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Tag tone="green">Converted via Marketing Studio</Tag>
            <Tag tone="blue">Lifecycle: {contact?.lifecycle ?? "Marketing Qualified Lead"}</Tag>
          </div>
          <p className="mt-2 text-[14px] font-semibold">
            Downloaded {config.sourceAsset.title.split(":")[0]} — moved from Lead to {contact?.lifecycle ?? "Marketing Qualified Lead"}
          </p>
          <p className="mt-0.5 text-[12.5px] text-ink-muted">
            Campaign: {config.campaignName}. Email open, CTA click, and landing-page form submission are logged on the timeline below.
          </p>
        </div>
        {!world.ms.repSent ? (
          <Button
            variant="primary"
            size="sm"
            data-testid="ms-go-tasks"
            onClick={() => {
              dispatch([{ t: "flag", k: "ms.convertReviewed" }, { t: "ui", k: "bell", v: "open" }]);
              navigate("/tasks");
            }}
          >
            View rep alert & task <Icon name="arrowRight" size={14} />
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

/**
 * Native HubSpot rep notification & follow-up callout shown above Tasks (Step 12).
 * Carries NO Penguin marker: notifications, tasks, and sales follow-up emails are native HubSpot.
 */
export function MarketingTaskBanner() {
  const { pack, world, dispatch, navigate } = useShell();
  const config = pack.demos.marketingStudio;
  const [previewOpen, setPreviewOpen] = useState(false);
  if (!config || !world.ms.converted || world.ms.repSent) return null;

  const rep = pack.personas.find((p) => p.id === config.repId);
  return (
    <div className="mx-6 mt-4 rounded-[10px] border border-[#f5c2a8] bg-[#fff7f2] px-5 py-4" data-testid="ms-task-banner">
      <div className="max-w-[740px]">
        <div className="flex flex-wrap items-center gap-2">
          <Tag tone="orange">New MQL Handoff</Tag>
          <span className="text-[12.5px] font-semibold text-ink-muted">
            Assigned to {rep?.name ?? "Jordan Avery"} · Slack posted to {config.repFollowUp.slackChannel}
          </span>
        </div>
        <p className="mt-1.5 text-[14.5px] font-semibold">{config.repFollowUp.taskTitle}</p>
        <p className="mt-0.5 text-[13px] text-ink-muted">{config.repFollowUp.taskNotes}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            icon="send"
            data-testid="ms-send-rep-followup"
            onClick={() => {
              dispatch({ t: "ms.repFollowUp", at: nowMs() });
              navigate("/marketing/off-platform/meeting");
            }}
          >
            Send rep follow-up
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setPreviewOpen((o) => !o)} data-testid="ms-preview-rep-email">
            {previewOpen ? "Hide email" : "Preview follow-up"}
          </Button>
        </div>
      </div>
      {previewOpen ? (
        <div className="mt-3 max-w-[740px] rounded-[8px] border border-line bg-white p-3.5 text-[13px]">
          <p className="font-semibold">Subject: {config.repFollowUp.emailSubject}</p>
          <p className="mt-2 whitespace-pre-line text-ink-muted">{config.repFollowUp.emailBody}</p>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Native HubSpot campaign attribution banner shown on the newly created deal (Step 14).
 * Carries NO Penguin marker: deal creation and campaign attribution are native HubSpot.
 */
export function MarketingDealBanner({ dealId }: { dealId: string }) {
  const { pack, world, dispatch, navigate } = useShell();
  const config = pack.demos.marketingStudio;
  if (!config || world.ms.dealId !== dealId) return null;

  const deal = world.deals.find((d) => d.id === dealId);
  const slot = config.repFollowUp.meetingSlots.find((s) => s.id === world.ms.meetingSlotId) ?? config.repFollowUp.meetingSlots[0];

  return (
    <Card testId="ms-deal-banner">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Tag tone="green">Created from Booked Meeting</Tag>
            <Tag tone="blue">{config.campaignName}</Tag>
          </div>
          <p className="mt-2 text-[14px] font-semibold">
            {deal ? money(deal.amount) : money(config.deal.amount)} pipeline attributed · Meeting booked for {slot.day} at {slot.time} {slot.tz}
          </p>
          <p className="mt-0.5 text-[12.5px] text-ink-muted">
            All 3 Kestrel Ops buying-committee contacts, the booked meeting, and the 2027 Playbook conversion are associated automatically.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon="chart"
          data-testid="ms-go-dashboard"
          onClick={() => {
            dispatch({ t: "flag", k: "ms.dealReviewed" });
            navigate("/marketing/dashboard");
          }}
        >
          Open Campaign Dashboard
        </Button>
      </div>
    </Card>
  );
}
