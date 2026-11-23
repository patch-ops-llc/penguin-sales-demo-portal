"use client";

import { useState } from "react";
import { nowMs } from "@/lib/format";
import { getTicketRun } from "@/store/slices/tickets";
import { useShell } from "@/store/store";
import type { TicketPriority, TicketsDemoConfig } from "./types";
import { ExternalIntegrationCard } from "./off-platform";
import { relative } from "../format";
import { Icon, type IconName } from "../icons";
import { A, Avatar, Button, Card, colorFor, cx, Prop, Tag, type Tone } from "../ui";

const PRIORITY_TONE: Record<TicketPriority, Tone> = {
  Urgent: "red",
  High: "orange",
  Medium: "amber",
  Low: "neutral",
};

const TIMELINE_ICON: Record<string, IconName> = {
  trigger: "form",
  workflow: "workflow",
  outreach: "email",
  note: "note",
  escalation: "warning",
  checklist: "check",
  broadcast: "megaphone",
  resolved: "approvals",
};

/**
 * HubSpot Service Hub 3-column Ticket Record workspace (`/tickets/:id`).
 * Supports `feedback`, `checklist`, `sla`, and `incident` modes cleanly via `TicketsDemoConfig`.
 * All native Service Hub surfaces carry ZERO Penguin markers; only `cfg.externalCard` (when present)
 * renders inside `<Ext id={cfg.externalCard.extId}>`.
 */
export function TicketRecordWorkspace({ cfg }: { cfg: TicketsDemoConfig }) {
  const { pack, world, dispatch, navigate } = useShell();
  const run = getTicketRun(world, cfg.demoId);

  const [outreachBody, setOutreachBody] = useState(run.outreachText || cfg.outreach.defaultBody);
  const [resolutionNote, setResolutionNote] = useState(run.resolutionNote || cfg.outreach.followUpNote);

  const owner = pack.personas.find((p) => p.id === cfg.ticket.ownerId);
  const contact = world.contacts.find((c) => c.id === cfg.ticket.contactId);
  const company = world.companies.find((c) => c.id === cfg.ticket.companyId);
  const deal = cfg.ticket.dealId ? world.deals.find((d) => d.id === cfg.ticket.dealId) : undefined;

  const activeStageId = run.stageId ?? cfg.ticket.initialStageId;
  const activeStageIndex = Math.max(
    0,
    cfg.stages.findIndex((s) => s.id === activeStageId),
  );
  const activeStage = cfg.stages[activeStageIndex] ?? cfg.stages[0];

  const handleSendOutreach = () => {
    dispatch({ t: "tk.sendOutreach", demoId: cfg.demoId, text: outreachBody, at: nowMs() });
  };

  const handleResolve = () => {
    dispatch({ t: "tk.resolve", demoId: cfg.demoId, note: resolutionNote, at: nowMs() });
  };

  const slaBarPct = run.resolved ? 100 : Math.min(100, cfg.sla?.elapsedPct ?? 18);
  const slaOverdue = !run.resolved && Boolean(cfg.sla?.overdue || (cfg.sla?.elapsedPct ?? 0) >= 100);

  return (
    <div className="grid min-h-full grid-cols-[296px_minmax(0,1fr)_316px]" data-testid="ticket-workspace-page">
      {/* Left Column: Native HubSpot Ticket Properties & SLA Status (ZERO Penguin markers) */}
      <aside className="border-r border-line bg-white px-4 py-4" data-testid="ticket-properties-column">
        <A to="/tickets" className="inline-flex items-center gap-1 text-[13px] font-semibold text-link hover:underline" data-testid="ticket-back-queue">
          <Icon name="chevronLeft" size={14} /> Tickets
        </A>

        <div className="mt-3 flex items-start gap-3">
          <span
            className={cx(
              "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px]",
              run.resolved ? "bg-[#dff4e4] text-[#0b5b2b]" : "bg-[#ffe4d6] text-[#a03400]",
            )}
          >
            <Icon name="ticket" size={20} />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[12px] font-semibold text-ink-muted" data-testid="ticket-number">
              {cfg.ticket.number}
            </p>
            <h1 className="text-[16px] font-semibold leading-snug" data-testid="ticket-subject">
              {cfg.ticket.subject}
            </h1>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Tag tone={PRIORITY_TONE[cfg.ticket.priority]}>{cfg.ticket.priority} Priority</Tag>
              <span data-testid="ticket-stage-badge">
                <Tag tone={run.resolved ? "green" : "blue"}>{activeStage?.label ?? activeStageId}</Tag>
              </span>
            </div>
          </div>
        </div>

        {/* Native HubSpot Service Hub SLA Card */}
        {cfg.sla ? (
          <div
            className={cx(
              "mt-4 rounded-[9px] border p-3",
              run.resolved
                ? "border-[#bfe3cd] bg-[#f2fbf5]"
                : slaOverdue
                  ? "border-[#f3bdb7] bg-[#fff8f7]"
                  : "border-line-soft bg-[#fafafa]",
            )}
            data-testid="ticket-sla-card"
          >
            <div className="flex items-center justify-between gap-2 text-[12px]">
              <span className="font-semibold text-ink">Service SLA</span>
              <span className={cx("font-semibold", run.resolved ? "text-[#0b5b2b]" : slaOverdue ? "text-[#99201a]" : "text-[#0b4a78]")}>
                {run.resolved ? "Met within SLA" : run.escalated ? "Escalated to Manager" : cfg.sla.dueLabel}
              </span>
            </div>
            <p className="mt-0.5 text-[11.5px] text-ink-muted">{cfg.sla.targetLabel}</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e6eaee]">
              <div
                className={cx(
                  "h-full rounded-full transition-[width] duration-200",
                  run.resolved ? "bg-[#0b7a4b]" : slaOverdue ? "bg-[#dc2626]" : "bg-[#2563eb]",
                )}
                style={{ width: `${Math.max(8, slaBarPct)}%` }}
              />
            </div>
          </div>
        ) : null}

        <div className="mt-4 border-t border-line-soft pt-3">
          <h2 className="text-[13px] font-semibold">About this ticket</h2>
          <dl className="mt-1">
            <Prop label="Ticket ID">{cfg.ticket.number}</Prop>
            <Prop label="Pipeline">{cfg.pipelineName}</Prop>
            <Prop label="Ticket status">{activeStage?.label}</Prop>
            <Prop label="Ticket owner">{owner ? `${owner.name} (${owner.title})` : "Service Manager"}</Prop>
            <Prop label="Category">{cfg.ticket.category}</Prop>
            <Prop label="Location / Segment">{cfg.ticket.locationLabel}</Prop>
            <Prop label="Source">{cfg.ticket.sourceLabel}</Prop>
          </dl>
        </div>

        {cfg.ticket.complianceNote ? (
          <div className="mt-3 rounded-[8px] border border-[#cde6df] bg-[#f1faf7] p-3 text-[11.5px] leading-snug text-[#0c5649]" data-testid="ticket-compliance-note">
            <p className="flex items-center gap-1.5 font-semibold">
              <Icon name="shield" size={13} /> Compliance guardrail
            </p>
            <p className="mt-1">{cfg.ticket.complianceNote}</p>
          </div>
        ) : null}
      </aside>

      {/* Center Column: Stage Stepper + Mode Panel + Outreach/Resolution + Timeline (ZERO Penguin markers) */}
      <div className="min-w-0 space-y-4 px-5 py-4" data-testid="ticket-center-column">
        {/* Stage Progress Bar */}
        <Card pad={false} testId="ticket-stage-stepper">
          <div className="grid divide-x divide-line-soft" style={{ gridTemplateColumns: `repeat(${cfg.stages.length}, minmax(0, 1fr))` }}>
            {cfg.stages.map((stage, idx) => {
              const reached = idx <= activeStageIndex;
              const current = idx === activeStageIndex;
              return (
                <div
                  key={stage.id}
                  className={cx(
                    "px-3 py-2.5 text-center text-[12px] font-semibold",
                    current ? "bg-[#eef5f5] text-link" : reached ? "bg-[#f4fbf6] text-[#0b5b2b]" : "bg-white text-ink-muted",
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {reached && !current ? <Icon name="check" size={12} /> : null}
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* MODE 1: Feedback Summary & Native Low-Score Workflow Card */}
        {cfg.mode === "feedback" && cfg.offPlatform.feedback ? (
          <Card
            title="Post-Visit Feedback Submission"
            right={
              <Tag tone="red">
                {run.feedbackScore ?? cfg.offPlatform.feedback.scriptedScore} / {cfg.offPlatform.feedback.scaleMax} CSAT
              </Tag>
            }
            testId="ticket-feedback-summary"
          >
            <div className="flex flex-wrap items-center gap-1.5">
              {(run.feedbackTopics.length > 0 ? run.feedbackTopics : cfg.offPlatform.feedback.scriptedTopics).map((topic) => (
                <Tag key={topic} tone="amber">
                  {topic}
                </Tag>
              ))}
              <Tag tone="teal">{cfg.offPlatform.feedback.visitLocation}</Tag>
            </div>
            <blockquote className="mt-3 rounded-[8px] border-l-4 border-[#d97706] bg-[#fffcf4] px-4 py-3 text-[13.5px] leading-relaxed text-ink">
              &ldquo;{run.feedbackComment || cfg.offPlatform.feedback.scriptedComment}&rdquo;
            </blockquote>
            {cfg.workflowNote ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-line-soft bg-[#fafafa] px-3.5 py-2.5 text-[12.5px]">
                <span className="flex items-center gap-2 text-ink-muted">
                  <Icon name="workflow" size={14} className="text-ink" />
                  <span>
                    <strong className="text-ink">{cfg.workflowNote.name}:</strong> {cfg.workflowNote.action}
                  </span>
                </span>
                {cfg.workflowNote.id ? (
                  <A to={`/workflows/${cfg.workflowNote.id}`} className="hs-link shrink-0 text-[12px]">
                    View workflow
                  </A>
                ) : null}
              </div>
            ) : null}
          </Card>
        ) : null}

        {/* MODE 2: Checklist & Document Verification Panel */}
        {cfg.mode === "checklist" && cfg.checklist ? (
          <Card
            title="Onboarding Checklist & Verification"
            right={
              <div className="flex items-center gap-2">
                <Tag tone={run.completedChecklistIds.length >= cfg.checklist.length ? "green" : "blue"}>
                  {run.completedChecklistIds.length} / {cfg.checklist.length} verified
                </Tag>
                {run.completedChecklistIds.length < cfg.checklist.length ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => dispatch({ t: "tk.completeChecklist", demoId: cfg.demoId, at: nowMs() })}
                    data-testid="checklist-verify-all"
                  >
                    Verify all items
                  </Button>
                ) : null}
              </div>
            }
            testId="ticket-checklist-panel"
          >
            <div className="space-y-2">
              {cfg.checklist.map((item) => {
                const done = run.completedChecklistIds.includes(item.id);
                const effectiveStatus = done ? "Verified" : run.intakeSubmitted ? "Received" : "Pending";
                return (
                  <label
                    key={item.id}
                    data-testid={`checklist-item-${item.id}`}
                    className={cx(
                      "flex cursor-pointer items-start justify-between gap-3 rounded-[8px] border p-3 transition-colors",
                      done ? "border-[#bfe3cd] bg-[#f4fbf6]" : "border-line-soft bg-white hover:bg-[#fafafa]",
                    )}
                  >
                    <span className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={() => dispatch({ t: "tk.toggleChecklist", demoId: cfg.demoId, itemId: item.id, at: nowMs() })}
                        className="mt-0.5 h-4 w-4 accent-[#0b7a4b]"
                      />
                      <span>
                        <span className="block text-[13.5px] font-semibold">{item.label}</span>
                        <span className="block text-[12px] text-ink-muted">
                          {item.category} &middot; {item.detail}
                        </span>
                      </span>
                    </span>
                    <Tag tone={done ? "green" : run.intakeSubmitted ? "blue" : "amber"}>{effectiveStatus}</Tag>
                  </label>
                );
              })}
            </div>
            {!run.intakeSubmitted ? (
              <div className="mt-3 flex justify-end">
                <Button variant="secondary" size="sm" icon="external" data-testid="ticket-open-intake" onClick={() => navigate(`/ticket-app/${cfg.demoId}/intake`)}>
                  Open off-platform customer portal
                </Button>
              </div>
            ) : null}
          </Card>
        ) : null}

        {/* MODE 3: Priority SLA Timer & Overdue Manager Escalation */}
        {cfg.mode === "sla" && cfg.sla ? (
          <Card
            title="Priority SLA & Escalation Controls"
            right={<Tag tone={run.escalated ? "orange" : "red"}>{run.escalated ? "Escalated to Manager" : cfg.sla.dueLabel}</Tag>}
            testId="ticket-sla-escalation-panel"
          >
            <p className="text-[13.5px] leading-relaxed text-ink">{cfg.ticket.summary}</p>
            {cfg.sla.escalationRuleLabel ? (
              <p className="mt-2 text-[12.5px] text-ink-muted">
                <strong className="text-ink">Escalation rule:</strong> {cfg.sla.escalationRuleLabel}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              {run.escalated ? (
                <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#a03400]" data-testid="sla-escalated-status">
                  <Icon name="check" size={15} /> {cfg.sla.escalationNote ?? "Escalated to manager for immediate review."}
                </span>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  icon="warning"
                  onClick={() => dispatch({ t: "tk.escalate", demoId: cfg.demoId, at: nowMs() })}
                  data-testid="sla-escalate-btn"
                >
                  Trigger overdue manager escalation
                </Button>
              )}
              {cfg.secondaryOffPlatform ? (
                <Button
                  variant="secondary"
                  size="sm"
                  icon="external"
                  data-testid="sla-preview-letter"
                  onClick={() => navigate(`/ticket-app/${cfg.demoId}/outreach`)}
                >
                  Preview resolution letter
                </Button>
              ) : null}
            </div>
          </Card>
        ) : null}

        {/* MODE 4: Incident Impacted Companies Broadcast Panel */}
        {cfg.mode === "incident" && cfg.impactedAccounts ? (
          <Card
            title={`Impacted Managed Companies (${cfg.impactedAccounts.length})`}
            right={
              run.notifiedCompanyIds.length >= cfg.impactedAccounts.length ? (
                <div className="flex items-center gap-2">
                  <Tag tone="green">All {cfg.impactedAccounts.length} notified</Tag>
                  {cfg.secondaryOffPlatform ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon="external"
                      data-testid="incident-preview-email"
                      onClick={() => navigate(`/ticket-app/${cfg.demoId}/outreach`)}
                    >
                      Preview customer email
                    </Button>
                  ) : null}
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  icon="megaphone"
                  onClick={() => dispatch({ t: "tk.broadcast", demoId: cfg.demoId, at: nowMs() })}
                  data-testid="incident-broadcast-btn"
                >
                  Notify all impacted customers
                </Button>
              )
            }
            testId="ticket-incident-panel"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="border-b border-line-soft text-left text-[11px] uppercase tracking-wide text-ink-muted">
                    <th className="pb-2 pr-3 font-semibold">Company</th>
                    <th className="pb-2 pr-3 font-semibold">Affected Assets</th>
                    <th className="pb-2 pr-3 font-semibold">Primary Contact</th>
                    <th className="pb-2 text-right font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cfg.impactedAccounts.map((acc) => {
                    const notified = run.notifiedCompanyIds.includes(acc.companyId);
                    return (
                      <tr key={acc.companyId} className="border-b border-line-soft last:border-b-0">
                        <td className="py-2 pr-3 font-semibold">{acc.companyName}</td>
                        <td className="py-2 pr-3 text-ink-muted">{acc.affectedAssets}</td>
                        <td className="py-2 pr-3 text-ink-muted">{acc.primaryContactName}</td>
                        <td className="py-2 text-right">
                          <Tag tone={notified ? "green" : "amber"}>{notified ? "Notified" : "Pending"}</Tag>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ) : null}

        {/* Shared Outreach, Follow-up Note & Resolution Card */}
        <Card
          title={cfg.outreach.heading}
          right={
            run.resolved ? (
              <Tag tone="green">Ticket Resolved</Tag>
            ) : run.outreachSent ? (
              <Tag tone="blue">Outreach Sent</Tag>
            ) : (
              <Tag tone="amber">Action Required</Tag>
            )
          }
          testId="ticket-outreach-card"
        >
          {!run.outreachSent ? (
            <div>
              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 text-[12.5px] text-ink-muted">
                <span>
                  <strong className="text-ink">To:</strong> {cfg.outreach.recipientLabel}
                </span>
                <span>
                  <strong className="text-ink">Subject:</strong> {cfg.outreach.subject}
                </span>
              </div>
              <textarea
                rows={4}
                aria-label={cfg.outreach.heading}
                data-testid="ticket-outreach-input"
                value={outreachBody}
                onChange={(e) => setOutreachBody(e.target.value)}
                className="w-full resize-none rounded-[8px] border border-line p-3 text-[13px] leading-relaxed focus:border-ink focus:outline-none"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[12px] text-ink-muted">
                  Sending logs the {cfg.outreach.channelLabel.toLowerCase()} on the ticket and contact timeline.
                </span>
                <Button variant="primary" size="sm" icon="send" onClick={handleSendOutreach} data-testid="ticket-send-outreach">
                  {cfg.outreach.sendButtonLabel}
                </Button>
              </div>
            </div>
          ) : !run.resolved ? (
            <div className="space-y-3.5">
              <div className="rounded-[8px] border border-[#bfe3cd] bg-[#f2fbf5] p-3 text-[13px]" data-testid="ticket-outreach-sent">
                <p className="font-semibold text-[#0b5b2b]">
                  {cfg.outreach.channelLabel} sent to {cfg.outreach.recipientLabel}
                </p>
                <p className="mt-1 text-ink-muted">{run.outreachText}</p>
              </div>

              <div>
                <label htmlFor="ticket-resolution-note-input" className="block text-[12.5px] font-semibold text-ink">
                  Internal operational follow-up &amp; resolution note
                </label>
                <textarea
                  id="ticket-resolution-note-input"
                  rows={3}
                  data-testid="ticket-resolution-note"
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="mt-1.5 w-full resize-none rounded-[8px] border border-line p-3 text-[13px] leading-relaxed focus:border-ink focus:outline-none"
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[12px] text-ink-muted">
                    Closing moves {cfg.ticket.number} to <strong>{cfg.stages.find((s) => s.id === cfg.ticket.resolvedStageId)?.label ?? "Resolved"}</strong> and updates Service Hub metrics.
                  </span>
                  <Button variant="primary" size="sm" icon="check" onClick={handleResolve} data-testid="ticket-resolve-btn">
                    {cfg.outreach.resolveButtonLabel}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3" data-testid="ticket-resolved-banner">
              <div className="rounded-[8px] border border-[#bfe3cd] bg-[#f2fbf5] p-3.5 text-[13px]">
                <p className="flex items-center gap-1.5 font-semibold text-[#0b5b2b]">
                  <Icon name="check" size={15} /> {cfg.ticket.number} closed &mdash; {cfg.outreach.resolutionSummary}
                </p>
                <p className="mt-1 text-ink-muted">{run.resolutionNote}</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[12.5px] text-ink-muted">
                  {cfg.secondaryOffPlatform && !run.secondarySeen
                    ? cfg.secondaryOffPlatform.csatSurvey
                      ? "Customer survey logged — review CSAT response or open HubSpot Reporting."
                      : "Written notice ready — preview customer communication or open HubSpot Reporting."
                    : "Ready to review live metrics in HubSpot Reporting."}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {cfg.secondaryOffPlatform ? (
                    <Button
                      variant={run.secondarySeen ? "secondary" : "primary"}
                      size="sm"
                      icon="external"
                      onClick={() => navigate(`/ticket-app/${cfg.demoId}/outreach`)}
                      data-testid="ticket-open-secondary"
                    >
                      {cfg.secondaryOffPlatform.badge ?? "View customer survey"} <Icon name="arrowRight" size={14} />
                    </Button>
                  ) : null}
                  <Button
                    variant={cfg.secondaryOffPlatform && !run.secondarySeen ? "secondary" : "primary"}
                    size="sm"
                    icon="chart"
                    onClick={() => navigate(`/reports/${cfg.reportId}`)}
                    data-testid="ticket-open-report"
                  >
                    {cfg.reportButtonLabel} <Icon name="arrowRight" size={14} />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Live Ticket Activity Timeline */}
        <Card title={`Activity Timeline (${run.timeline.length})`} testId="ticket-timeline">
          {run.timeline.length === 0 ? (
            <p className="text-[13px] text-ink-muted">
              Ticket created from {cfg.ticket.sourceLabel}. Complete the steps above to log outreach and resolution.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {run.timeline.map((ev) => (
                <li key={ev.id} className="rounded-[8px] border border-line-soft bg-[#fcfcfc] p-3" data-testid={`ticket-timeline-${ev.kind}`}>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-hs-bg text-ink">
                      <Icon name={TIMELINE_ICON[ev.kind] ?? "note"} size={13} />
                    </span>
                    <span className="text-[13px] font-semibold">{ev.title}</span>
                    <span className="ml-auto shrink-0 text-[11.5px] text-ink-muted">{relative(ev.at)}</span>
                  </div>
                  <p className="mt-1.5 pl-8 text-[12.5px] leading-relaxed text-ink-muted">{ev.body}</p>
                  <p className="mt-1 pl-8 text-[11px] text-ink-muted">Logged by {ev.actor}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Right Column: Associated CRM Records + Optional Custom Penguin Integration Card */}
      <aside className="space-y-3 border-l border-line bg-[#f7f7f7] px-3 py-4" data-testid="ticket-associations-column">
        <Card title="Contact (1)">
          {contact ? (
            <div className="flex items-center gap-2.5 text-[13px]">
              <Avatar name={`${contact.firstName} ${contact.lastName}`} color={colorFor(contact.id)} size={32} />
              <div className="min-w-0">
                <A to={`/contacts/${contact.id}`} className="hs-link block truncate">
                  {contact.firstName} {contact.lastName}
                </A>
                <p className="truncate text-[12px] text-ink-muted">{contact.title}</p>
                <p className="truncate text-[12px] text-ink-muted">{contact.email}</p>
              </div>
            </div>
          ) : null}
        </Card>

        <Card title={cfg.mode === "feedback" ? "Company / Clinic (1)" : "Company (1)"}>
          {company ? (
            <div className="text-[13px]">
              <A to={`/companies/${company.id}`} className="hs-link">
                {company.name}
              </A>
              <p className="mt-0.5 text-[12px] text-ink-muted">
                {company.industry} &middot; {company.city}, {company.state}
              </p>
            </div>
          ) : null}
        </Card>

        {deal ? (
          <Card title="Deal (1)">
            <div className="text-[13px]">
              <A to={`/deals/${deal.id}`} className="hs-link">
                {deal.name}
              </A>
              <p className="mt-0.5 text-[12px] text-ink-muted">{deal.type}</p>
            </div>
          </Card>
        ) : null}

        {/* Optional Custom Penguin Extension Card (e.g. EHR Visit-Completion Trigger on H5) */}
        {cfg.externalCard ? <ExternalIntegrationCard card={cfg.externalCard} /> : null}
      </aside>
    </div>
  );
}
