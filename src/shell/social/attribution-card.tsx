"use client";

import { nowMs } from "@/lib/format";
import { useShell } from "@/store/store";
import { Icon } from "../icons";
import { A, Button, Card, Tag } from "../ui";

/**
 * Native HubSpot Campaign Attribution & Follow-up Automation cards rendered on Rachel Morales's
 * contact record during Steps 9, 10, and 11 of Flow 3. No Penguin markers (100% native HubSpot).
 */
export function CampaignAttributionCard({ contactId, onOpenTimeline }: { contactId: string; onOpenTimeline: () => void }) {
  const { pack, world } = useShell();
  const cfg = pack.demos.socialAds;
  if (!cfg || world.sa.contactId !== contactId) return null;
  const hero = cfg.campaigns.find((c) => c.id === cfg.heroCampaignId) ?? cfg.campaigns[0];
  const lp = cfg.landingPage;

  return (
    <Card
      title="Campaign & ad attribution"
      right={<Tag tone="blue">Paid Social</Tag>}
      testId="campaign-attribution-card"
    >
      <div className="grid grid-cols-3 gap-3 text-[13px]">
        <div className="rounded-[8px] border border-line-soft bg-[#fafafa] p-3">
          <p className="text-[11.5px] text-ink-muted">Attached campaign</p>
          <p className="mt-0.5 font-semibold">{hero.name}</p>
        </div>
        <div className="rounded-[8px] border border-line-soft bg-[#fafafa] p-3">
          <p className="text-[11.5px] text-ink-muted">Converting ad &amp; UTM</p>
          <p className="mt-0.5 font-semibold">LinkedIn Paid Social</p>
          <p className="text-[11.5px] text-ink-muted">utm_campaign={lp.utmCampaign}</p>
        </div>
        <div className="rounded-[8px] border border-line-soft bg-[#fafafa] p-3">
          <p className="text-[11.5px] text-ink-muted">Assisted touchpoints</p>
          <p className="mt-0.5 font-semibold">Google Search + LinkedIn Post</p>
          <p className="text-[11.5px] text-ink-muted">3 interactions prior to form</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-line-soft pt-3">
        <span className="text-[12.5px] text-ink-muted">
          Associated job-order deal: <strong className="text-ink">$168,000</strong> ({lp.lead.rolesNeeded})
        </span>
        <Button size="sm" variant="primary" onClick={onOpenTimeline} data-testid="inspect-timeline-btn">
          Inspect activity timeline <Icon name="arrowRight" size={14} />
        </Button>
      </div>
    </Card>
  );
}

export function FollowupAutomationBanner({ contactId }: { contactId: string }) {
  const { pack, world, dispatch, navigate } = useShell();
  const cfg = pack.demos.socialAds;
  if (!cfg || world.sa.contactId !== contactId) return null;
  const lp = cfg.landingPage;
  const rep = pack.personas.find((p) => p.id === lp.lead.assignedRepId);

  if (!world.sa.timelineSeen) {
    return (
      <Card className="mb-4" testId="timeline-summary-banner">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[13.5px] font-semibold">Full ad-to-form timeline captured automatically</p>
            <p className="mt-0.5 text-[12.5px] text-ink-muted">
              Google Search ad click, LinkedIn organic post engagement, LinkedIn paid ad click, and staffing form submission are all linked to this contact.
            </p>
          </div>
          <Button size="sm" variant="primary" data-testid="continue-followup-btn" onClick={() => dispatch({ t: "sa.seenTimeline" })}>
            Continue to follow-up <Icon name="arrowRight" size={14} />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className="mb-4"
      title="Automated follow-up email & rep notification"
      right={
        world.sa.followupSent ? (
          <Tag tone="green">Sent &amp; rep notified</Tag>
        ) : (
          <Tag tone="amber">Ready to trigger</Tag>
        )
      }
      testId="followup-automation-card"
    >
      <div className="grid grid-cols-2 gap-3 text-[13px]">
        <div className="rounded-[8px] border border-line-soft bg-[#fafafa] p-3">
          <p className="flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">
            <Icon name="email" size={13} /> Automated follow-up email
          </p>
          <p className="mt-1 font-semibold">{lp.followUpEmail.subject}</p>
          <p className="mt-1 text-[12.5px] leading-snug text-ink-muted">{lp.followUpEmail.preview}</p>
        </div>
        <div className="rounded-[8px] border border-line-soft bg-[#fafafa] p-3">
          <p className="flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">
            <Icon name="bell" size={13} /> Rep notification ({rep?.name ?? "Marcus Delgado"})
          </p>
          <p className="mt-1 font-semibold">{lp.repAlert.taskTitle}</p>
          <p className="mt-1 text-[12.5px] leading-snug text-ink-muted">
            In-app Bell alert + Slack post to <strong>{lp.repAlert.channel}</strong>.
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-3">
        {world.sa.followupSent ? (
          <>
            <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0b5b2b]" data-testid="followup-sent-status">
              <Icon name="check" size={15} /> Follow-up email logged on timeline &amp; {rep?.name ?? "Marcus Delgado"} notified
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => dispatch({ t: "ui", k: "bell", v: "open" })} data-testid="open-rep-bell">
                View bell alert
              </Button>
              <Button size="sm" variant="primary" onClick={() => navigate("/social/inbox")} data-testid="followup-to-social-inbox">
                Open Social Inbox <Icon name="arrowRight" size={14} />
              </Button>
            </div>
          </>
        ) : (
          <>
            <A to="/workflows/wf-staffing-followup" className="hs-link text-[12.5px]">
              View follow-up workflow
            </A>
            <Button
              size="sm"
              variant="primary"
              data-testid="trigger-followup-btn"
              onClick={() => dispatch({ t: "sa.sendFollowup", at: nowMs() })}
            >
              Send follow-up &amp; notify rep <Icon name="send" size={14} />
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
