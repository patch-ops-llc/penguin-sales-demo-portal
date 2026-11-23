"use client";

import { useState } from "react";
import { getTicketRun } from "@/store/slices/tickets";
import { useShell } from "@/store/store";
import type { TicketPriority, TicketsDemoConfig } from "./types";
import { relative } from "../format";
import { Icon } from "../icons";
import { A, Avatar, Button, Card, cx, Tag, type Tone } from "../ui";

const PRIORITY_TONE: Record<TicketPriority, Tone> = {
  Urgent: "red",
  High: "orange",
  Medium: "amber",
  Low: "neutral",
};

type DisplayTicket = {
  id: string;
  number: string;
  subject: string;
  stageId: string;
  priority: TicketPriority;
  ownerName: string;
  ownerColor: string;
  locationOrCategory: string;
  slaLabel: string;
  scoreLabel?: string;
  createdAtLabel: string;
  isPrimary?: boolean;
};

/**
 * Native HubSpot Service Hub Tickets Pipeline & Queue view (`/tickets`).
 * Parameterized across all 4 workspace modes (`feedback`, `checklist`, `sla`, `incident`)
 * with zero vertical hardcoding and ZERO Penguin markers.
 */
export function TicketsPipelinePage({ cfg }: { cfg: TicketsDemoConfig }) {
  const { pack, world, dispatch, navigate } = useShell();
  const [view, setView] = useState<"board" | "list">("board");
  const run = getTicketRun(world, cfg.demoId);

  const primaryVisible = cfg.mode === "checklist" || run.intakeSubmitted;
  const primaryStageId = run.stageId ?? cfg.ticket.initialStageId;
  const owner = pack.personas.find((p) => p.id === cfg.ticket.ownerId);

  const primaryTicket: DisplayTicket | null = primaryVisible
    ? {
        id: cfg.ticket.id,
        number: cfg.ticket.number,
        subject: cfg.ticket.subject,
        stageId: primaryStageId,
        priority: cfg.ticket.priority,
        ownerName: owner?.name ?? "Service Manager",
        ownerColor: owner?.color ?? "#0b7a4b",
        locationOrCategory: cfg.ticket.locationLabel,
        slaLabel: run.resolved ? "Resolved within SLA" : cfg.sla?.dueLabel ?? "24h SLA",
        scoreLabel:
          cfg.mode === "feedback" && cfg.offPlatform.feedback
            ? `${run.feedbackScore ?? cfg.offPlatform.feedback.scriptedScore}/${cfg.offPlatform.feedback.scaleMax} CSAT`
            : undefined,
        createdAtLabel: "Just now",
        isPrimary: true,
      }
    : null;

  const seededTickets: DisplayTicket[] = cfg.queueSeeds.map((seed) => {
    const seedOwner = pack.personas.find((p) => p.id === seed.ownerId);
    return {
      id: seed.id,
      number: seed.number,
      subject: seed.subject,
      stageId: seed.stageId,
      priority: seed.priority,
      ownerName: seedOwner?.name ?? "Service Team",
      ownerColor: seedOwner?.color ?? "#516f90",
      locationOrCategory: seed.locationOrCategory,
      slaLabel: seed.slaLabel,
      scoreLabel: seed.scoreLabel,
      createdAtLabel: relative(seed.createdAt),
    };
  });

  const allTickets: DisplayTicket[] = primaryTicket ? [primaryTicket, ...seededTickets] : seededTickets;
  const closedStageIds = new Set(cfg.stages.filter((s) => s.closed).map((s) => s.id));
  const openCount = allTickets.filter((t) => !closedStageIds.has(t.stageId)).length;
  const highPriorityCount = allTickets.filter((t) => !closedStageIds.has(t.stageId) && (t.priority === "High" || t.priority === "Urgent")).length;
  const resolvedCount = allTickets.filter((t) => closedStageIds.has(t.stageId)).length;

  const openPrimary = () => {
    dispatch({ t: "tk.openTicket", demoId: cfg.demoId });
    navigate(`/tickets/${cfg.ticket.id}`);
  };

  return (
    <div className="min-h-full pb-8" data-testid="tickets-pipeline-page">
      <header className="border-b border-line bg-white px-6 py-4">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#fff1ea] text-hs-orange">
              <Icon name="ticket" size={19} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[18px] font-semibold leading-tight" data-testid="tickets-pipeline-title">
                  Tickets &middot; {cfg.pipelineName}
                </h1>
                <Tag tone="blue">{allTickets.length} tickets</Tag>
              </div>
              <p className="mt-0.5 text-[12.5px] text-ink-muted">
                {pack.portal.company} &middot; HubSpot Service Hub
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-[6px] border border-line bg-white p-0.5">
              <button
                type="button"
                onClick={() => setView("board")}
                data-testid="tickets-view-board"
                className={cx("inline-flex h-7 items-center gap-1.5 rounded-[4px] px-2.5 text-[12.5px] font-semibold", view === "board" ? "bg-ink text-white" : "text-ink-muted hover:text-ink")}
              >
                <Icon name="board" size={14} /> Board
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                data-testid="tickets-view-list"
                className={cx("inline-flex h-7 items-center gap-1.5 rounded-[4px] px-2.5 text-[12.5px] font-semibold", view === "list" ? "bg-ink text-white" : "text-ink-muted hover:text-ink")}
              >
                <Icon name="list" size={14} /> List
              </button>
            </div>
            <A
              to={`/ticket-app/${cfg.demoId}/intake`}
              className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-line bg-white px-3 text-[12.5px] font-semibold hover:bg-[#f5f5f5]"
            >
              <Icon name="external" size={13} /> Off-platform view
            </A>
            <A
              to={`/reports/${cfg.reportId}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-line bg-white px-3 text-[12.5px] font-semibold hover:bg-[#f5f5f5]"
            >
              <Icon name="chart" size={13} /> {cfg.reportButtonLabel}
            </A>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1320px] space-y-4 px-6 pt-5">
        {/* Native Service Hub Workflow Routing Banner (ZERO Penguin markers) */}
        {primaryVisible && cfg.workflowNote ? (
          <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#f3d48c] bg-[#fffcf4] px-4 py-3"
            data-testid="tickets-workflow-banner"
          >
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#fdefc8] text-[#754c00]">
                <Icon name="workflow" size={15} />
              </span>
              <div>
                <p className="text-[13.5px] font-semibold text-ink">
                  {cfg.workflowNote.name} &mdash; {cfg.ticket.number} created &amp; routed to {owner?.name ?? "Location Manager"}
                </p>
                <p className="mt-0.5 text-[12.5px] text-ink-muted">
                  Trigger: {cfg.workflowNote.trigger} &middot; {cfg.workflowNote.action}
                </p>
              </div>
            </div>
            <Button variant="primary" size="sm" onClick={openPrimary} data-testid="open-primary-ticket">
              Open {cfg.ticket.number} <Icon name="arrowRight" size={14} />
            </Button>
          </div>
        ) : null}

        {/* Native Summary Strip */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="py-0">
            <p className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Open tickets</p>
            <p className="mt-1 text-[24px] font-bold tabular-nums">{openCount}</p>
          </Card>
          <Card className="py-0">
            <p className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">High / Urgent priority</p>
            <p className="mt-1 text-[24px] font-bold tabular-nums text-[#a03400]">{highPriorityCount}</p>
          </Card>
          <Card className="py-0">
            <p className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Resolved in pipeline</p>
            <p className="mt-1 text-[24px] font-bold tabular-nums text-[#0b5b2b]">{resolvedCount}</p>
          </Card>
        </div>

        {view === "board" ? (
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cfg.stages.length}, minmax(0, 1fr))` }} data-testid="tickets-board">
            {cfg.stages.map((stage) => {
              const items = allTickets.filter((t) => t.stageId === stage.id);
              return (
                <div key={stage.id} className="flex flex-col rounded-[10px] border border-line bg-[#f7f8fa]" data-testid={`ticket-stage-${stage.id}`}>
                  <div className="flex items-center justify-between border-b border-line-soft px-3.5 py-2.5">
                    <span className="text-[13px] font-semibold">{stage.label}</span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11.5px] font-semibold text-ink-muted ring-1 ring-line-soft">
                      {items.length}
                    </span>
                  </div>
                  <div className="space-y-2.5 p-2.5">
                    {items.length === 0 ? (
                      <p className="py-6 text-center text-[12px] text-ink-muted">No tickets in stage</p>
                    ) : null}
                    {items.map((t) => (
                      <div
                        key={t.id}
                        data-testid={`ticket-card-${t.id}`}
                        className={cx(
                          "rounded-[8px] border bg-white p-3 shadow-xs transition-colors",
                          t.isPrimary ? "border-hs-orange ring-1 ring-hs-orange/25" : "border-line-soft",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11.5px] font-semibold text-ink-muted">{t.number}</span>
                          <div className="flex items-center gap-1">
                            {t.scoreLabel ? <Tag tone={t.isPrimary ? "red" : "green"}>{t.scoreLabel}</Tag> : null}
                            <Tag tone={PRIORITY_TONE[t.priority]}>{t.priority}</Tag>
                          </div>
                        </div>
                        {t.isPrimary ? (
                          <button
                            type="button"
                            onClick={openPrimary}
                            data-testid={`ticket-link-${t.id}`}
                            className="mt-1.5 block text-left text-[13.5px] font-semibold leading-snug text-link hover:underline"
                          >
                            {t.subject}
                          </button>
                        ) : (
                          <p className="mt-1.5 text-[13.5px] font-semibold leading-snug text-ink">{t.subject}</p>
                        )}
                        <p className="mt-1 text-[12px] text-ink-muted">{t.locationOrCategory}</p>
                        <div className="mt-2.5 flex items-center justify-between border-t border-line-soft pt-2 text-[11.5px] text-ink-muted">
                          <span className="flex items-center gap-1.5 truncate">
                            <Avatar name={t.ownerName} color={t.ownerColor} size={20} />
                            <span className="truncate">{t.ownerName}</span>
                          </span>
                          <span className="shrink-0 font-medium">{t.slaLabel}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Card pad={false} testId="tickets-list">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-line-soft bg-[#fafafa] text-left text-[11.5px] uppercase tracking-wide text-ink-muted">
                    <th className="px-4 py-2.5 font-semibold">Ticket</th>
                    <th className="px-4 py-2.5 font-semibold">Location / Category</th>
                    <th className="px-4 py-2.5 font-semibold">Stage</th>
                    <th className="px-4 py-2.5 font-semibold">Priority</th>
                    <th className="px-4 py-2.5 font-semibold">Owner</th>
                    <th className="px-4 py-2.5 text-right font-semibold">SLA / Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allTickets.map((t) => {
                    const stageLabel = cfg.stages.find((s) => s.id === t.stageId)?.label ?? t.stageId;
                    return (
                      <tr key={t.id} className="border-b border-line-soft last:border-b-0">
                        <td className="px-4 py-2.5">
                          <p className="font-mono text-[11.5px] text-ink-muted">{t.number}</p>
                          {t.isPrimary ? (
                            <button type="button" onClick={openPrimary} className="hs-link text-left">
                              {t.subject}
                            </button>
                          ) : (
                            <span className="font-semibold">{t.subject}</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-ink-muted">{t.locationOrCategory}</td>
                        <td className="px-4 py-2.5">
                          <Tag tone={closedStageIds.has(t.stageId) ? "green" : "blue"}>{stageLabel}</Tag>
                        </td>
                        <td className="px-4 py-2.5">
                          <Tag tone={PRIORITY_TONE[t.priority]}>{t.priority}</Tag>
                        </td>
                        <td className="px-4 py-2.5">{t.ownerName}</td>
                        <td className="px-4 py-2.5 text-right font-medium text-ink-muted">{t.slaLabel}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
