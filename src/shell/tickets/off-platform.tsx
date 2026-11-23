"use client";

import { useState } from "react";
import { nowMs } from "@/lib/format";
import { getTicketRun } from "@/store/slices/tickets";
import { useShell } from "@/store/store";
import type { TicketExternalCard, TicketsDemoConfig } from "./types";
import { Ext } from "../ext";
import { Icon } from "../icons";
import { A, Button, Card, cx, Prop, Tag } from "../ui";

function OffPlatformBrowser({
  channelLabel,
  windowTitle,
  address,
  backTo,
  backLabel = "Return to HubSpot",
  action,
  testId,
  children,
}: {
  channelLabel: string;
  windowTitle: string;
  address: string;
  backTo: string;
  backLabel?: string;
  action?: React.ReactNode;
  testId: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#dfe3e8] p-3.5" data-testid={testId}>
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 text-[12.5px]">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-[11.5px] font-semibold text-white">
            <Icon name="external" size={12} /> Off-platform &middot; {channelLabel}
          </span>
          <span className="text-ink-muted">Happens outside HubSpot, synced into Service Hub in real time.</span>
        </div>
        <div className="flex items-center gap-2">
          {action}
          <A
            to={backTo}
            data-testid="ticket-offplatform-back"
            className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-ink bg-white px-3 text-[12.5px] font-semibold text-ink hover:bg-[#f5f5f5]"
          >
            <Icon name="arrowLeft" size={13} /> {backLabel}
          </A>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] border border-[#b8c0cc] bg-white shadow-[0_12px_36px_rgba(15,23,42,0.14)]">
        <div className="flex items-center gap-3 border-b border-[#e2e8f0] bg-[#f1f5f9] px-4 py-2">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </span>
          <span className="text-[12px] font-semibold text-[#475569]">{windowTitle}</span>
          <span className="flex h-7 flex-1 items-center gap-2 truncate rounded-full bg-white px-3 text-[12px] text-[#64748b] ring-1 ring-[#cbd5e1]">
            <Icon name="lock" size={11} className="shrink-0" />
            <span className="truncate">{address}</span>
          </span>
        </div>
        <div className="hs-scroll min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function ExternalIntegrationCard({ card, testId }: { card: TicketExternalCard; testId?: string }) {
  return (
    <Ext id={card.extId}>
      <Card
        title={card.title}
        right={<Tag tone={card.badgeTone ?? "teal"}>{card.badge}</Tag>}
        testId={testId ?? `ticket-ext-card-${card.extId}`}
      >
        <p className="text-[12.5px] leading-snug text-ink-muted">{card.subtitle}</p>
        <dl className="mt-2.5 divide-y divide-line-soft/70 text-[12.5px]">
          {card.fields.map((field) => (
            <Prop key={field.label} label={field.label}>
              {field.value}
            </Prop>
          ))}
        </dl>
        {card.footnote ? (
          <p className="mt-2.5 rounded-[6px] bg-hs-bg/60 px-2.5 py-2 text-[11.5px] leading-snug text-ink-muted">
            {card.footnote}
          </p>
        ) : null}
      </Card>
    </Ext>
  );
}

function FeedbackSurveyBody({ cfg }: { cfg: TicketsDemoConfig }) {
  const { world, dispatch, navigate } = useShell();
  const fb = cfg.offPlatform.feedback!;
  const run = getTicketRun(world, cfg.demoId);
  const [score, setScore] = useState<number>(run.feedbackScore ?? fb.scriptedScore);
  const [topics, setTopics] = useState<string[]>(run.feedbackTopics.length > 0 ? run.feedbackTopics : fb.scriptedTopics);
  const [comment, setComment] = useState<string>(run.feedbackComment || fb.scriptedComment);

  const toggleTopic = (topic: string) => {
    setTopics((prev) => (prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]));
  };

  const submit = () => {
    dispatch({ t: "tk.submitIntake", demoId: cfg.demoId, at: nowMs(), score, topics, comment });
    navigate("/tickets");
  };

  const isLowScore = score <= fb.lowScoreThreshold;

  return (
    <div className="min-h-full bg-[#f6f8fa] px-6 py-6">
      <div className="mx-auto max-w-[1040px]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#dce4ec] bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#0b6e6e] text-white">
              <Icon name="check" size={20} />
            </span>
            <div>
              <p className="text-[15.5px] font-bold text-[#0f172a]">{cfg.offPlatform.brandName}</p>
              <p className="text-[12.5px] text-[#475569]">{cfg.offPlatform.brandSubtitle ?? fb.visitLocation}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Tag tone="teal">{fb.visitLocation}</Tag>
            <Tag tone="neutral">{fb.visitDateLabel}</Tag>
          </div>
        </div>

        {cfg.offPlatform.complianceNote ? (
          <div className="mb-5 flex items-center gap-2.5 rounded-[10px] border border-[#cde6df] bg-[#f1faf7] px-4 py-2.5 text-[12.5px] text-[#0c5649]" data-testid="survey-compliance-banner">
            <Icon name="shield" size={16} className="shrink-0" />
            <span>{cfg.offPlatform.complianceNote}</span>
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
          {/* Native HubSpot Post-Visit Feedback Survey (ZERO Penguin markers) */}
          <div className="rounded-[12px] border border-[#dce4ec] bg-white p-6 shadow-sm" data-testid="post-visit-survey-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11.5px] font-semibold uppercase tracking-wide text-[#0b6e6e]">
                HubSpot Post-Visit Experience Survey
              </span>
              <span className="text-[12px] text-[#64748b]">{fb.visitDepartment}</span>
            </div>
            <h1 className="mt-1.5 text-[21px] font-bold leading-snug text-[#0f172a]">{cfg.offPlatform.headline}</h1>
            <p className="mt-1 text-[13.5px] leading-relaxed text-[#475569]">{cfg.offPlatform.intro}</p>

            {run.intakeSubmitted ? (
              <div className="mt-5 rounded-[10px] border border-[#bfe3cd] bg-[#f2fbf5] p-5" data-testid="survey-submitted-state">
                <p className="text-[15px] font-bold text-[#0b5b2b]">{fb.thankYouHeadline}</p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-[#334155]">{fb.thankYouBody}</p>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  <Button variant="primary" size="sm" onClick={() => navigate("/tickets")} data-testid="survey-go-queue">
                    View ticket in Service Hub <Icon name="arrowRight" size={14} />
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => navigate(`/tickets/${cfg.ticket.id}`)}>
                    Open {cfg.ticket.number}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-5">
                  <p className="text-[13px] font-semibold text-[#0f172a]">
                    1. How would you rate your check-in and overall visit experience today?
                  </p>
                  <div className="mt-2.5 grid grid-cols-5 gap-2" role="radiogroup" aria-label="Post-visit satisfaction score">
                    {Array.from({ length: fb.scaleMax }, (_, i) => i + 1).map((n) => {
                      const active = score === n;
                      const low = n <= fb.lowScoreThreshold;
                      return (
                        <button
                          key={n}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          data-testid={`survey-score-${n}`}
                          onClick={() => setScore(n)}
                          className={cx(
                            "flex flex-col items-center rounded-[10px] border px-2 py-3 text-center transition-colors",
                            active
                              ? low
                                ? "border-[#dc2626] bg-[#fef2f2] text-[#991b1b] ring-2 ring-[#dc2626]/20"
                                : "border-[#0b7a4b] bg-[#f0fdf4] text-[#0b5b2b] ring-2 ring-[#0b7a4b]/20"
                              : "border-[#dce4ec] bg-white text-[#334155] hover:border-[#94a3b8]",
                          )}
                        >
                          <span className="text-[20px] font-bold tabular-nums leading-none">{n}</span>
                          <span className="mt-1 text-[11px] font-medium leading-tight">{fb.scoreLabels[n] ?? ""}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-[13px] font-semibold text-[#0f172a]">2. Which parts of your visit could we improve? (Non-clinical logistics)</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {fb.topics.map((topic) => {
                      const active = topics.includes(topic);
                      return (
                        <button
                          key={topic}
                          type="button"
                          aria-pressed={active}
                          data-testid={`survey-topic-${topic.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                          onClick={() => toggleTopic(topic)}
                          className={cx(
                            "rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-colors",
                            active ? "border-[#0f172a] bg-[#0f172a] text-white" : "border-[#cbd5e1] bg-[#f8fafc] text-[#334155] hover:border-[#64748b]",
                          )}
                        >
                          {topic}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5">
                  <label htmlFor="survey-comment-input" className="block text-[13px] font-semibold text-[#0f172a]">
                    3. Share feedback about wait time, check-in, or clinic service
                  </label>
                  <textarea
                    id="survey-comment-input"
                    rows={3}
                    data-testid="survey-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="mt-2 w-full resize-none rounded-[8px] border border-[#cbd5e1] bg-white p-3 text-[13.5px] leading-relaxed text-[#0f172a] focus:border-[#0f172a] focus:outline-none"
                  />
                  <p className="mt-1 text-[11.5px] text-[#64748b]">
                    Please do not include medical diagnoses or clinical details; this form routes directly to Clinic Operations.
                  </p>
                </div>

                <div
                  className={cx(
                    "mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border px-4 py-3 text-[12.5px]",
                    isLowScore ? "border-[#f3d48c] bg-[#fffbeb] text-[#754c00]" : "border-[#bfe3cd] bg-[#f0faf4] text-[#0b5b2b]",
                  )}
                  data-testid="survey-threshold-note"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <Icon name={isLowScore ? "warning" : "check"} size={15} className="shrink-0" />
                    {isLowScore
                      ? `Score ${score}/${fb.scaleMax} meets the HubSpot low-score trigger (<= ${fb.lowScoreThreshold}/${fb.scaleMax}) — opens a Service Hub ticket for the Location Manager.`
                      : `Score ${score}/${fb.scaleMax} logs positive CSAT to the location satisfaction report.`}
                  </span>
                  <Button variant="primary" onClick={submit} data-testid="survey-submit">
                    {fb.submitLabel} <Icon name="arrowRight" size={14} />
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Right column: Visit context + Custom Penguin EHR Visit-Completion Trigger card */}
          <div className="space-y-4">
            {cfg.offPlatform.triggerExt ? (
              <ExternalIntegrationCard card={cfg.offPlatform.triggerExt} testId="survey-ehr-trigger-card" />
            ) : null}

            <Card title="Survey Recipient (Fictional)" testId="survey-recipient-card">
              <dl className="text-[12.5px]">
                <Prop label="Visitor">{fb.visitorName}</Prop>
                <Prop label="Email">{fb.visitorEmail}</Prop>
                <Prop label="Clinic location">{fb.visitLocation}</Prop>
                <Prop label="Visit area">{fb.visitDepartment}</Prop>
                <Prop label="Data scope">Service experience only (Zero PHI)</Prop>
              </dl>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChecklistIntakeBody({ cfg }: { cfg: TicketsDemoConfig }) {
  const { world, dispatch, navigate } = useShell();
  const ch = cfg.offPlatform.checklist!;
  const run = getTicketRun(world, cfg.demoId);
  const [checkedIds, setCheckedIds] = useState<string[]>(ch.requestedItems.map((i) => i.id));

  const toggleItem = (id: string) => {
    setCheckedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const submit = () => {
    dispatch({ t: "tk.submitIntake", demoId: cfg.demoId, at: nowMs() });
    navigate(`/tickets/${cfg.ticket.id}`);
  };

  return (
    <div className="min-h-full bg-[#f6f8fa] px-6 py-6">
      <div className="mx-auto max-w-[920px] space-y-4">
        <Card testId="checklist-offplatform-card">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line-soft pb-4">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-wide text-link">{cfg.offPlatform.brandName}</p>
              <h1 className="mt-1 text-[20px] font-bold">{cfg.offPlatform.headline}</h1>
              <p className="mt-1 text-[13.5px] text-ink-muted">{cfg.offPlatform.intro}</p>
            </div>
            <Tag tone="blue">{ch.kind === "doc-request" ? "Document Portal" : "Onboarding Kickoff"}</Tag>
          </div>
          <dl className="mt-3 grid gap-2 text-[12.5px] sm:grid-cols-2">
            <Prop label="From">{ch.fromName} ({ch.fromEmail})</Prop>
            <Prop label="To">{ch.toName} ({ch.toEmail})</Prop>
          </dl>
          <p className="mt-3 whitespace-pre-line rounded-[8px] border border-line-soft bg-[#fafafa] p-3.5 text-[13.5px] leading-relaxed">
            {ch.body}
          </p>
          <div className="mt-4 space-y-2">
            <p className="text-[12.5px] font-semibold uppercase tracking-wide text-ink-muted">Requested items</p>
            {ch.requestedItems.map((item) => {
              const ready = checkedIds.includes(item.id);
              return (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-[8px] border border-line-soft bg-white px-3.5 py-2.5 hover:bg-[#fafafa]"
                >
                  <span className="flex items-center gap-2.5">
                    <input type="checkbox" checked={ready} onChange={() => toggleItem(item.id)} className="h-4 w-4 accent-[#0f172a]" />
                    <span className="text-[13.5px] font-semibold">{item.label}</span>
                  </span>
                  <span className="text-[12px] text-ink-muted">
                    {item.fileName} &middot; {item.size}
                  </span>
                </label>
              );
            })}
          </div>
          <div className="mt-5 flex items-center justify-end gap-3">
            {run.intakeSubmitted ? (
              <Button variant="primary" onClick={() => navigate(`/tickets/${cfg.ticket.id}`)}>
                Return to onboarding ticket <Icon name="arrowRight" size={14} />
              </Button>
            ) : (
              <Button variant="primary" onClick={submit} data-testid="checklist-intake-submit">
                {ch.ctaLabel} <Icon name="arrowRight" size={14} />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function SlaIntakeBody({ cfg }: { cfg: TicketsDemoConfig }) {
  const { world, dispatch, navigate } = useShell();
  const s = cfg.offPlatform.sla!;
  const run = getTicketRun(world, cfg.demoId);

  const submit = () => {
    dispatch({ t: "tk.submitIntake", demoId: cfg.demoId, at: nowMs() });
    navigate("/tickets");
  };

  return (
    <div className="min-h-full bg-[#f6f8fa] px-6 py-6">
      <div className="mx-auto max-w-[920px] space-y-4">
        <Card testId="sla-offplatform-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft pb-4">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-wide text-link">{s.channel} Intake &middot; {s.referenceId}</p>
              <h1 className="mt-1 text-[20px] font-bold">{s.subject}</h1>
            </div>
            <Tag tone="amber">{s.category}</Tag>
          </div>
          <dl className="mt-3 grid gap-2 text-[12.5px] sm:grid-cols-2">
            <Prop label="From">{s.fromName} ({s.fromEmail})</Prop>
            <Prop label="Delivered to">{s.toEmail}</Prop>
          </dl>
          <p className="mt-3 whitespace-pre-line rounded-[8px] border border-line-soft bg-[#fafafa] p-4 text-[13.5px] leading-relaxed">
            {s.body}
          </p>
          <div className="mt-5 flex justify-end">
            {run.intakeSubmitted ? (
              <Button variant="primary" onClick={() => navigate("/tickets")}>
                Open SLA ticket queue <Icon name="arrowRight" size={14} />
              </Button>
            ) : (
              <Button variant="primary" onClick={submit} data-testid="sla-intake-submit">
                {s.ctaLabel} <Icon name="arrowRight" size={14} />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function IncidentAlertBody({ cfg }: { cfg: TicketsDemoConfig }) {
  const { world, dispatch, navigate } = useShell();
  const inc = cfg.offPlatform.incident!;
  const run = getTicketRun(world, cfg.demoId);

  const submit = () => {
    dispatch({ t: "tk.submitIntake", demoId: cfg.demoId, at: nowMs() });
    navigate("/tickets");
  };

  return (
    <div className="min-h-full bg-[#0f172a] px-6 py-6 text-white">
      <div className="mx-auto max-w-[980px] space-y-4">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-[12px] border border-white/15 bg-[#1e293b] p-6" data-testid="incident-alert-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-[#fca5a5]">
                <Icon name="warning" size={15} /> {inc.monitorTool} &middot; {inc.alertId}
              </span>
              <Tag tone="red">{inc.severity} Active Outage</Tag>
            </div>
            <h1 className="mt-2 text-[22px] font-bold">{inc.serviceName}</h1>
            <p className="mt-1.5 text-[14px] leading-relaxed text-white/80">{inc.summary}</p>
            <p className="mt-1 text-[12px] text-white/60">Detected: {inc.detectedAtLabel}</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {inc.metrics.map((m) => (
                <div key={m.label} className="rounded-[8px] border border-white/10 bg-[#0f172a]/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-white/60">{m.label}</p>
                  <p className="mt-1 text-[18px] font-bold tabular-nums text-white">{m.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              {run.intakeSubmitted ? (
                <Button variant="primary" onClick={() => navigate("/tickets")}>
                  Open HubSpot incident queue <Icon name="arrowRight" size={14} />
                </Button>
              ) : (
                <Button variant="primary" onClick={submit} data-testid="incident-alert-submit">
                  {inc.ctaLabel} <Icon name="arrowRight" size={14} />
                </Button>
              )}
            </div>
          </div>

          <div className="text-ink">
            {cfg.offPlatform.triggerExt ? <ExternalIntegrationCard card={cfg.offPlatform.triggerExt} /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TicketOffPlatformIntakePage({ cfg }: { cfg: TicketsDemoConfig }) {
  return (
    <OffPlatformBrowser
      channelLabel={cfg.offPlatform.channelLabel}
      windowTitle={cfg.offPlatform.windowTitle}
      address={cfg.offPlatform.address}
      backTo="/tickets"
      testId={`ticket-offplatform-${cfg.mode}`}
    >
      {cfg.mode === "feedback" && cfg.offPlatform.feedback ? <FeedbackSurveyBody cfg={cfg} /> : null}
      {cfg.mode === "checklist" && cfg.offPlatform.checklist ? <ChecklistIntakeBody cfg={cfg} /> : null}
      {cfg.mode === "sla" && cfg.offPlatform.sla ? <SlaIntakeBody cfg={cfg} /> : null}
      {cfg.mode === "incident" && cfg.offPlatform.incident ? <IncidentAlertBody cfg={cfg} /> : null}
    </OffPlatformBrowser>
  );
}

export function TicketOffPlatformOutreachPage({ cfg }: { cfg: TicketsDemoConfig }) {
  const { dispatch, navigate } = useShell();
  const sec = cfg.secondaryOffPlatform;
  if (!sec) return null;

  const confirmAndReturn = () => {
    dispatch({ t: "tk.seenSecondary", demoId: cfg.demoId });
    navigate(`/tickets/${cfg.ticket.id}`);
  };

  return (
    <OffPlatformBrowser
      channelLabel={sec.channelLabel}
      windowTitle={sec.windowTitle}
      address={sec.address}
      backTo={`/tickets/${cfg.ticket.id}`}
      backLabel={`Return to ${cfg.ticket.number}`}
      testId="ticket-offplatform-secondary"
    >
      <div className="min-h-full bg-[#f6f8fa] px-6 py-6">
        <div className="mx-auto max-w-[820px]">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft pb-3">
              <h1 className="text-[18px] font-bold">{sec.subject}</h1>
              {sec.badge ? <Tag tone="green">{sec.badge}</Tag> : null}
            </div>
            <dl className="mt-3 grid gap-2 text-[12.5px] sm:grid-cols-2">
              <Prop label="From">{sec.fromName} ({sec.fromEmail})</Prop>
              <Prop label="To">{sec.toName} ({sec.toEmail})</Prop>
            </dl>
            <p className="mt-4 whitespace-pre-line rounded-[8px] border border-line-soft bg-[#fafafa] p-4 text-[13.5px] leading-relaxed">
              {sec.body}
            </p>
            {sec.footnote ? <p className="mt-3 text-[12px] text-ink-muted">{sec.footnote}</p> : null}
            <div className="mt-5 flex justify-end">
              <Button variant="primary" onClick={confirmAndReturn} data-testid="ticket-secondary-continue">
                {sec.ctaLabel} <Icon name="arrowRight" size={14} />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </OffPlatformBrowser>
  );
}
