"use client";

import { nowMs } from "@/lib/format";
import { useShell } from "@/store/store";
import { Ext } from "../ext";
import { Icon } from "../icons";
import { Button, Card, cx, Prop, Tag } from "../ui";
import { OffPlatformFrame } from "./off-platform";

/**
 * Off-platform free-trial product workspace for SaaS #2 (`pql-trial-prospecting`).
 * Lives inside the lazy `src/shell/social/` chunk so 0 KB is added to the initial shell bundle.
 *
 * Strict Penguin marker boundary:
 * - ONLY the custom Product Usage Event Sync card (`<Ext id={syncCard.extId}>`) carries a Penguin marker.
 * - The off-platform trial workspace itself carries ZERO Penguin markers.
 */
export function PqlTrialOffPlatformPage() {
  const { pack, world, dispatch, navigate } = useShell();
  const cfg = pack.demos.pqlTrial;
  if (!cfg) return null;

  const { trialApp } = cfg;
  const hit = world.pql.milestoneHit;
  const contact = world.contacts.find((c) => c.id === cfg.contactId);

  const triggerMilestone = () => {
    dispatch({ t: "pql.hitMilestone", at: nowMs() });
    navigate(`/contacts/${cfg.contactId}`);
  };

  return (
    <OffPlatformFrame
      channelLabel="Free-Trial Product Workspace"
      url={trialApp.workspaceUrl}
      backTo={`/contacts/${cfg.contactId}`}
      backLabel="Open HubSpot Contact"
      testId="offplatform-pql-trial"
      action={
        hit ? (
          <Button variant="primary" size="sm" data-testid="pql-go-contact-top" onClick={() => navigate(`/contacts/${cfg.contactId}`)}>
            Inspect PQL contact in HubSpot <Icon name="arrowRight" size={14} />
          </Button>
        ) : undefined
      }
    >
      <div className="min-h-full bg-[#f4f6f9] p-6">
        <div className="mx-auto max-w-[1100px] space-y-5">
          {/* Off-platform Lumenstack App Header (ZERO Penguin markers) */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#dce4ec] bg-white px-5 py-4 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#0b6e6e] text-white">
                <Icon name="layers" size={19} />
              </span>
              <div>
                <p className="text-[15.5px] font-bold text-[#0f172a]" data-testid="pql-workspace-name">
                  {trialApp.workspaceName}
                </p>
                <p className="text-[12.5px] text-[#475569]">
                  {trialApp.planLabel} &middot; {contact ? `${contact.firstName} ${contact.lastName} (${contact.title})` : "Trial Admin"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Tag tone="teal">{trialApp.trialDayLabel}</Tag>
              <Tag tone={hit ? "green" : "amber"}>{hit ? "PQL Milestone Synced" : "Activation Threshold Ready"}</Tag>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_350px]">
            {/* Left: Free-Trial Product Milestone Card (ZERO Penguin markers) */}
            <div className="rounded-[12px] border border-[#dce4ec] bg-white p-6 shadow-xs" data-testid="pql-trial-workspace-card">
              <span className="text-[11.5px] font-semibold uppercase tracking-wide text-[#0b6e6e]">
                Lumenstack In-App Activation Tracker
              </span>
              <h1 className="mt-1.5 text-[21px] font-bold leading-snug text-[#0f172a]">{trialApp.headline}</h1>
              <p className="mt-1 text-[13.5px] leading-relaxed text-[#475569]">{trialApp.intro}</p>

              <div className="mt-5 space-y-2.5">
                {trialApp.milestones.map((m) => {
                  const activeTrigger = m.status === "trigger";
                  return (
                    <div
                      key={m.id}
                      data-testid={`pql-milestone-${m.id}`}
                      className={cx(
                        "flex items-start justify-between gap-3 rounded-[10px] border px-4 py-3",
                        hit || m.status === "done"
                          ? "border-[#bfe3cd] bg-[#f4fbf6]"
                          : activeTrigger
                            ? "border-[#f3d48c] bg-[#fffcf4]"
                            : "border-[#dce4ec] bg-white",
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={cx(
                            "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white",
                            hit || m.status === "done" ? "bg-[#0b7a4b]" : "bg-[#d97706]",
                          )}
                        >
                          <Icon name={hit || m.status === "done" ? "check" : "lifecycle"} size={12} strokeWidth={2.5} />
                        </span>
                        <div>
                          <p className="text-[13.5px] font-semibold text-[#0f172a]">{m.label}</p>
                          <p className="mt-0.5 text-[12.5px] text-[#475569]">{m.detail}</p>
                        </div>
                      </div>
                      <Tag tone={hit || m.status === "done" ? "green" : "amber"}>{m.metric}</Tag>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#dce4ec] bg-[#f8fafc] px-4 py-3.5">
                {hit ? (
                  <>
                    <div className="text-[13px]" data-testid="pql-milestone-synced">
                      <p className="font-semibold text-[#0b5b2b]">
                        Event streamed to HubSpot &mdash; Lead score rose from {cfg.initialScore} to {cfg.pqlScore} (PQL)
                      </p>
                      <p className="text-[12px] text-[#475569]">
                        Logged on {contact ? `${contact.firstName} ${contact.lastName}` : "contact"}&apos;s HubSpot timeline and queued for Breeze Prospecting Agent.
                      </p>
                    </div>
                    <Button variant="primary" size="sm" onClick={() => navigate(`/contacts/${cfg.contactId}`)} data-testid="pql-open-contact">
                      Open HubSpot contact <Icon name="arrowRight" size={14} />
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-[12.5px] text-[#475569]">
                      <strong className="text-[#0f172a]">Current HubSpot Lead Score:</strong>{" "}
                      <span className="font-mono font-semibold text-[#0f172a]">{cfg.initialScore}</span> (Free Trial) &rarr;{" "}
                      <span className="font-mono font-semibold text-[#0b5b2b]">{cfg.pqlScore} (PQL)</span>
                    </div>
                    <Button variant="primary" onClick={triggerMilestone} data-testid="pql-trigger-milestone">
                      {trialApp.ctaLabel} <Icon name="arrowRight" size={14} />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Right: Custom Penguin Product Usage Event Sync Card (ONLY Penguin marker on this screen) */}
            <div className="space-y-4">
              <Ext id={trialApp.syncCard.extId}>
                <Card
                  title={trialApp.syncCard.title}
                  right={<Tag tone="purple">{trialApp.syncCard.badge}</Tag>}
                  testId="pql-usage-sync-card"
                >
                  <p className="text-[12.5px] leading-snug text-ink-muted">{trialApp.syncCard.subtitle}</p>
                  <dl className="mt-2.5 divide-y divide-line-soft/70 text-[12.5px]">
                    <Prop label="Event name">
                      <span className="font-mono text-[12px]">{trialApp.syncCard.eventName}</span>
                    </Prop>
                    {trialApp.syncCard.fields.map((f) => (
                      <Prop key={f.label} label={f.label}>
                        {f.value}
                      </Prop>
                    ))}
                  </dl>
                  <p className="mt-2.5 rounded-[6px] bg-hs-bg/60 px-2.5 py-2 text-[11.5px] leading-snug text-ink-muted">
                    {trialApp.syncCard.footnote}
                  </p>
                </Card>
              </Ext>

              <Card title="Trial Account Context" testId="pql-trial-account-card">
                <dl className="text-[12.5px]">
                  <Prop label="Company">Alderwave Logistics</Prop>
                  <Prop label="Trial Champion">{contact ? `${contact.firstName} ${contact.lastName}` : "Nadia Osei"}</Prop>
                  <Prop label="Email">{contact?.email ?? "nadia.osei@alderwavelogistics.example"}</Prop>
                  <Prop label="Trial source">Organic search (Snowflake docs)</Prop>
                  <Prop label="Current score">{hit ? `${cfg.pqlScore} (PQL)` : `${cfg.initialScore} (Trial)`}</Prop>
                </dl>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </OffPlatformFrame>
  );
}

/**
 * Native HubSpot Contact Record banner shown after the PQL usage milestone bumps lead score.
 * Carries ZERO Penguin markers (native lead scoring & contact timeline).
 */
export function PqlContactBanner({ contactId }: { contactId: string }) {
  const { pack, world, demo, dispatch, navigate } = useShell();
  const cfg = pack.demos.pqlTrial;
  if (demo !== "pql-trial-prospecting" || !cfg || cfg.contactId !== contactId || !world.pql.milestoneHit) return null;

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#bfe3cd] bg-[#f0faf4] px-4 py-3 text-[13px]"
      data-testid="pql-contact-banner"
    >
      <div>
        <p className="font-semibold text-[#0b5b2b]">
          Lead score bumped from {cfg.initialScore} to {cfg.pqlScore} ({cfg.pqlLeadStatus})
        </p>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          Free-trial usage milestone logged on timeline. Breeze Prospecting Agent flagged Alderwave Logistics for trial-to-paid outreach.
        </p>
      </div>
      <Button
        variant="primary"
        size="sm"
        data-testid="pql-go-prospecting"
        onClick={() => {
          dispatch([
            { t: "flag", k: "pql.contactSeen" },
            { t: "ui", k: "prospecting.account", v: cfg.companyId },
            { t: "ui", k: "prospecting.tab", v: "signals" },
          ]);
          navigate("/prospecting");
        }}
      >
        Open Breeze Prospecting Agent <Icon name="arrowRight" size={14} />
      </Button>
    </div>
  );
}
