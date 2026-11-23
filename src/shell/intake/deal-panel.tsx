"use client";

import { useState } from "react";
import { nowMs } from "@/lib/format";
import { useShell } from "@/store/store";
import { Ext } from "../ext";
import { Icon } from "../icons";
import { A, Button, Card, cx, Tag } from "../ui";
import type { IntakeDemoId, IntakeFlowConfig } from "./types";

function findMatchingIntake(
  intakeMap: Partial<Record<IntakeDemoId, IntakeFlowConfig>> | undefined,
  worldIntake: ReturnType<typeof useShell>["world"]["intake"],
  dealId: string,
): { demoId: IntakeDemoId; cfg: IntakeFlowConfig } | null {
  if (!intakeMap) return null;
  for (const [key, cfg] of Object.entries(intakeMap) as [IntakeDemoId, IntakeFlowConfig | undefined][]) {
    if (!cfg) continue;
    const stateDealId = worldIntake[key]?.dealId;
    if (stateDealId === dealId || cfg.createdRecords.dealId === dealId) {
      return { demoId: key, cfg };
    }
  }
  return null;
}

/**
 * Rendered inside HubSpot's native DealRecord overview tab for Intake deals (`H2`, `H6`, and future `F2`).
 * Strict Penguin marker boundary:
 * - Native HubSpot cards (Completion banner, Routing & Assignment, Coordinator/Recruiter Outreach) carry NO `<Ext>` wrapper.
 * - ONLY the custom external integration card (`cfg.integrationCard.extId`) carries `<Ext>`.
 */
export function IntakeDealPanel({ dealId }: { dealId: string }) {
  const { pack, world, dispatch, navigate } = useShell();
  const match = findMatchingIntake(pack.demos.intake, world.intake, dealId);
  const demoId = match?.demoId;
  const cfg = match?.cfg;
  const st = demoId ? world.intake[demoId] : undefined;

  const [subject, setSubject] = useState(st?.outreachSubject ?? cfg?.outreach.subject ?? "");
  const [body, setBody] = useState(st?.outreachBody ?? cfg?.outreach.body ?? "");

  if (!match || !demoId || !cfg || !st || !st.submitted) return null;

  const owner = pack.personas.find((p) => p.id === cfg.createdRecords.ownerId);
  const ic = cfg.integrationCard;
  const out = cfg.outreach;
  const chosenFollowup = cfg.followup.options.filter((o) => st.selectedOptionIds.includes(o.id));
  const selectedItemCount = ic.items.filter((i) => !i.selectable || st.selectedItemIds.includes(i.id)).length;

  return (
    <div className="space-y-4" data-testid={`intake-deal-panel-${demoId}`}>
      {/* 1. Native HubSpot completion banner once off-platform booking/selection completes (NO Penguin marker) */}
      {st.followupCompleted ? (
        <div
          className="rounded-[10px] border border-[#bfe3cd] bg-[#f0faf4] p-4"
          data-testid="intake-completion-card"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-[14.5px] font-bold text-[#0b5b2b]">
                <Icon name="check" size={16} strokeWidth={2.5} /> {cfg.completion.headline}
              </p>
              <p className="mt-1 text-[13px] text-[#244232]">{cfg.completion.summary}</p>
              {chosenFollowup.length > 0 ? (
                <p className="mt-1.5 text-[12.5px] font-semibold text-[#0b5b2b]">
                  Confirmed: {chosenFollowup.map((o) => o.title).join(" · ")}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-[8px] border border-[#bfe3cd] bg-white px-3 py-1.5 text-right">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{cfg.completion.revenueLabel}</p>
                <p className="text-[16px] font-bold tabular-nums text-[#0b5b2b]" data-testid="intake-completion-value">
                  {cfg.completion.revenueValue}
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                data-testid="intake-open-report"
                onClick={() => {
                  dispatch({ t: "intake.reviewCompletion", demoId });
                  navigate(`/reports/${cfg.reportId}`);
                }}
              >
                {cfg.reportButtonLabel} <Icon name="arrowRight" size={14} />
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* 2. Native HubSpot Intake Routing & Assignment summary (NO Penguin marker) */}
      <Card
        title="Intake routing & assignment"
        right={
          <div className="flex items-center gap-2">
            <Tag tone="green">Routed automatically</Tag>
            {cfg.createdRecords.workflowId ? (
              <A to={`/workflows/${cfg.createdRecords.workflowId}`} className="hs-link text-[12.5px]" data-testid="intake-workflow-link">
                View workflow
              </A>
            ) : null}
          </div>
        }
        testId="intake-routing-card"
      >
        <p className="text-[13px] text-ink-muted">
          <strong className="text-ink">{cfg.createdRecords.routingRuleLabel}:</strong> {cfg.createdRecords.routingSummary} (Owner:{" "}
          <strong className="text-ink">{owner?.name ?? cfg.createdRecords.ownerId}</strong>).
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-3 rounded-[8px] border border-line-soft bg-[#fafafa] px-3.5 py-2.5 sm:grid-cols-4">
          {cfg.createdRecords.routingCriteria.map((c) => (
            <div key={c.label}>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{c.label}</dt>
              <dd className="mt-0.5 text-[12.5px] font-semibold text-ink">{c.value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {/* 3. Custom Penguin-built external integration card — ONLY Penguin marker in the demo */}
      <Ext id={ic.extId}>
        <Card
          title={
            <span className="flex items-center gap-2">
              <span>{ic.title}</span>
              <Tag tone="teal">{ic.systemName}</Tag>
            </span>
          }
          right={
            <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap pr-5 text-[12px] text-ink-muted">
              <Icon name="sync" size={13} /> {ic.syncedLabel}
            </span>
          }
          testId="intake-integration-card"
        >
          <p className="text-[13px] text-ink-muted">{ic.summary}</p>

          <div className="mt-3">
            <div className="mb-2 flex items-center justify-between text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">
              <span>{ic.itemsHeading}</span>
              <Tag tone="green">{ic.badge}</Tag>
            </div>
            <ul className="space-y-2">
              {ic.items.map((item) => {
                const selected = !item.selectable || st.selectedItemIds.includes(item.id);
                return (
                  <li
                    key={item.id}
                    data-testid={`intake-review-item-${item.id}`}
                    className={cx(
                      "rounded-[8px] border px-3.5 py-2.5 transition-colors",
                      selected ? "border-line bg-white" : "border-line-soft bg-[#fafafa] opacity-75",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-start gap-2.5">
                        {item.selectable ? (
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={selected}
                            disabled={st.outreachSent}
                            data-testid={`intake-toggle-${item.id}`}
                            onClick={() => dispatch({ t: "intake.toggleItem", demoId, itemId: item.id })}
                            className={cx(
                              "mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border",
                              selected ? "border-hs-orange bg-hs-orange text-white" : "border-line bg-white",
                            )}
                          >
                            {selected ? <Icon name="check" size={11} strokeWidth={2.8} /> : null}
                          </button>
                        ) : (
                          <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#dff4e4] text-[#0b5b2b]">
                            <Icon name="check" size={11} strokeWidth={2.6} />
                          </span>
                        )}
                        <div>
                          <p className="text-[13.5px] font-semibold text-ink">{item.title}</p>
                          <p className="text-[12.5px] text-ink-muted">{item.subtitle}</p>
                        </div>
                      </div>
                      <Tag tone={item.badgeTone ?? "green"}>{item.badge}</Tag>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-2 pl-6 text-[11.5px] text-ink-muted">
                      {item.meta.map((m) => (
                        <span key={m} className="rounded bg-[#f4f6f8] px-2 py-0.5">
                          {m}
                        </span>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {st.followupCompleted ? (
            <div className="mt-3 rounded-[8px] border border-[#bfe3cd] bg-[#f0faf4] px-3.5 py-2.5 text-[12.5px] text-[#0b5b2b]" data-testid="intake-sync-complete">
              <p className="font-semibold">{ic.completedSyncTitle}</p>
              <p className="mt-0.5 text-[#244232]">{ic.completedSyncDetail}</p>
            </div>
          ) : st.reviewed ? (
            <div className="mt-3 flex items-center justify-between gap-2 rounded-[8px] border border-[#bfe3cd] bg-[#f0faf4] px-3.5 py-2 text-[12.5px] font-semibold text-[#0b5b2b]" data-testid="intake-review-confirmed">
              <span className="flex items-center gap-1.5">
                <Icon name="check" size={14} /> {ic.confirmedStatusText} ({selectedItemCount} ready)
              </span>
              <span className="text-[12px] font-normal text-[#244232]">Proceed to outreach below</span>
            </div>
          ) : (
            <div className="mt-3 flex items-center justify-end border-t border-line-soft pt-3">
              <Button
                variant="primary"
                size="sm"
                data-testid="intake-confirm-review"
                onClick={() => dispatch({ t: "intake.review", demoId, at: nowMs() })}
              >
                <Icon name="check" size={14} /> {ic.confirmButtonLabel}
              </Button>
            </div>
          )}
        </Card>
      </Ext>

      {/* 4. Native HubSpot Coordinator / Recruiter Outreach card (NO Penguin marker) */}
      <Card
        title={out.title}
        right={st.outreachSent ? <Tag tone="blue">Sent</Tag> : <Tag tone={st.reviewed ? "orange" : "neutral"}>{st.reviewed ? "Ready to send" : "Pending review"}</Tag>}
        testId="intake-outreach-card"
      >
        <p className="text-[12.5px] text-ink-muted">
          {out.subtitle} · To: <strong className="text-ink">{out.recipientName}</strong> ({out.recipientRole}) &lt;{out.recipientEmail}&gt;
        </p>

        {st.outreachSent ? (
          <div className="mt-3 rounded-[8px] border border-[#c5ddf5] bg-[#f4f9fe] p-3.5" data-testid="intake-outreach-sent">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[13px] font-semibold text-[#0b4a78]">{out.sentConfirmation}</p>
                <p className="mt-0.5 text-[12.5px] text-ink-muted">Subject: {st.outreachSubject ?? out.subject}</p>
              </div>
              {!st.followupCompleted ? (
                <Button
                  variant="primary"
                  size="sm"
                  data-testid="intake-open-followup"
                  onClick={() => navigate(`/intake/${demoId}/followup`)}
                >
                  Open off-platform view <Icon name="arrowRight" size={14} />
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-2.5">
            <label className="block text-[12px]">
              <span className="font-semibold text-ink-muted">Subject</span>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                data-testid="intake-outreach-subject"
                className="mt-1 h-8 w-full rounded-[6px] border border-line px-2.5 text-[13px]"
              />
            </label>
            <label className="block text-[12px]">
              <span className="font-semibold text-ink-muted">Message</span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                data-testid="intake-outreach-body"
                className="mt-1 w-full resize-none rounded-[6px] border border-line px-2.5 py-2 text-[13px]"
              />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef5f5] px-2.5 py-1 text-[12px] font-semibold text-link">
                <Icon name="external" size={12} /> {out.ctaPreviewLabel}
              </span>
              <Button
                variant="primary"
                size="sm"
                icon="send"
                data-testid="intake-send-outreach"
                onClick={() => dispatch({ t: "intake.sendOutreach", demoId, at: nowMs(), subject, body })}
              >
                {out.sendButtonLabel}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
