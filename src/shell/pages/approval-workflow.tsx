"use client";

import { useState } from "react";
import { useShell } from "@/store/store";
import { APPROVERS_REQUIRED } from "@/store/world";
import { Icon, type IconName } from "../icons";
import { FilterFields, filterSentence, Marked, Picker, SmallButton } from "../quote/approval-controls";
import { APPROVAL_WORKFLOW_NAME, approvalMessage, approvalRuleOf, approvalSettingsFrom, type ApprovalRule } from "../quote/approval-rule";
import { A, Button, cx, statusTone, Tag } from "../ui";

const NONE_MET = "None met";
const STEP = { branch: "1. Branch", step: "2. Add quote approval step", flow: "3. Start quote approval flow" };
type Open = keyof typeof STEP;

function Plus() {
  return (
    <span className="flex flex-col items-center" aria-hidden="true">
      <span className="h-3 w-0.5 bg-[#8a8a8a]" />
      <span className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-[#8a8a8a] bg-white">
        <Icon name="plus" size={14} />
      </span>
      <span className="h-3 w-0.5 bg-[#8a8a8a]" />
    </span>
  );
}

/** A card of the workflow canvas. The ones with settings open them in the left panel, as clicking a card does in HubSpot. */
function Step({ title, icon, action, open, onOpen, details, testId, children }: { title: string; icon: IconName; action?: boolean; open?: boolean; onOpen?: () => void; details?: React.ReactNode; testId: string; children: React.ReactNode }) {
  return (
    <div
      onClick={onOpen}
      data-testid={testId}
      data-open={open}
      className={cx("w-[340px] rounded-[10px] border bg-white text-left", action && "border-t-[5px] border-t-[#007a3d]", open ? "border-ink shadow-[0_0_0_2px_rgba(20,20,20,0.18)]" : "border-[#8a8a8a]", onOpen && "cursor-pointer")}
    >
      <div className="flex items-center gap-3 px-4 pt-3.5">
        <span className={cx("flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2", action ? "border-[#007a3d] text-[#007a3d]" : "border-ink")}>
          <Icon name={icon} size={17} />
        </span>
        {onOpen ? (
          <button type="button" className="text-left text-[13.5px] font-bold hover:underline" aria-expanded={open}>
            {title}
          </button>
        ) : (
          <p className="text-[13.5px] font-bold">{title}</p>
        )}
      </div>
      <div className="px-4 pb-4 pt-3 text-[13.5px] leading-relaxed">{children}</div>
      {details !== undefined ? (
        <div className="flex items-center justify-end gap-3 border-t border-line px-4 py-2 text-[13px]">
          {details}
          <span className="font-semibold text-link underline">Details</span>
        </div>
      ) : null}
    </div>
  );
}

function BranchBox({ name, note, testId }: { name: string; note?: string; testId: string }) {
  return (
    <div className="w-[260px] rounded-[10px] border border-[#8a8a8a] bg-white px-3 py-2.5 text-center" data-testid={testId}>
      <p className="text-[13.5px] font-bold">{name}</p>
      {note ? <p className="text-[12.5px] italic">{note}</p> : null}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[13px] font-bold">{label}</p>
      {hint ? <p className="text-[12px] font-semibold text-ink-muted">{hint}</p> : null}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

/** The left panel of the workflow editor: the settings of the card that was opened, with Cancel and Save. */
function Panel({ open, onClose, onSave, children }: { open: Open; onClose: () => void; onSave?: () => void; children: React.ReactNode }) {
  return (
    <aside className="hs-scroll w-[400px] shrink-0 overflow-y-auto border-r border-line bg-white" aria-label={STEP[open]} data-testid="aw-panel" data-panel={open}>
      <header className="flex items-center gap-2 border-b border-line px-5 py-3.5">
        <button type="button" onClick={onClose} aria-label="Back" className="rounded p-0.5 hover:bg-[#f0f0f0]">
          <Icon name="chevronLeft" size={17} />
        </button>
        <h2 className="min-w-0 flex-1 truncate text-[15px] font-bold">{STEP[open].replace(/^\d+\. /, "")}</h2>
        <Button size="sm" onClick={onClose} data-testid="aw-panel-close">
          Cancel
        </Button>
        <Button size="sm" onClick={onSave} disabled={!onSave} data-testid="aw-panel-save">
          Save
        </Button>
      </header>
      <div className="space-y-5 px-5 py-5 text-[13.5px]">{children}</div>
    </aside>
  );
}

const BOX = "rounded-[4px] border border-[#8a8a8a] p-4";
const INPUT = "h-9 w-full cursor-default rounded-[4px] border border-[#7c8a99] bg-white px-3 text-[13.5px] focus:outline-none";

/** The Branch card's settings: the criteria that send a quote for approval. The limit can be changed, and each kind of filter removed or added back. */
function BranchPanel({ rule, onClose }: { rule: ApprovalRule; onClose: () => void }) {
  const { dispatch } = useShell();
  const saved = rule.filters.map((f) => f.id);
  const [set, setSet] = useState(saved);
  const [limit, setLimit] = useState(String(rule.config.thresholdPct));
  const [adding, setAdding] = useState(false);
  const shown = rule.kinds.filter((k) => set.includes(k.id));
  const rest = rule.kinds.filter((k) => !set.includes(k.id));
  const pct = Number(limit);
  const valid = !set.includes("discount") || (limit.trim() !== "" && Number.isFinite(pct) && pct >= 0 && pct <= 100);
  const save = () => {
    dispatch({ t: "approval.rule", edit: { filters: set, ...(set.includes("discount") ? { thresholdPct: pct } : {}) } });
    onClose();
  };
  const discard = () => {
    setSet(saved);
    setLimit(String(rule.config.thresholdPct));
    setAdding(false);
  };
  return (
    <Panel open="branch" onClose={onClose} onSave={valid ? save : undefined}>
      <div>
        <p className="mb-2 text-[13.5px] font-bold">First, check if:</p>
        <div className={BOX}>
          <Field label="Branch name">
            <input readOnly value={rule.branch} aria-label="Branch name" className={INPUT} />
          </Field>
          <div className="mt-2 flex justify-end">
            <SmallButton onClick={discard} testId="aw-discard">
              Discard
            </SmallButton>
          </div>
          {shown.map((f, i) => (
            <div key={f.id}>
              {i > 0 ? <p className="px-1 py-2 text-[13px] font-semibold">or</p> : null}
              <div className={cx("rounded-[12px] border border-line p-3", i === 0 && "mt-3")} data-testid={`aw-group-${f.id}`}>
                <p className="mb-2 px-1 text-[14px] font-bold">Group {i + 1}</p>
                <FilterFields filter={f} limit={limit} onLimit={setLimit} onRemove={() => setSet(set.filter((id) => id !== f.id))} />
              </div>
            </div>
          ))}
          {shown.length === 0 ? (
            <p className="pb-1 pt-5 text-center" data-testid="aw-no-criteria">
              This segment doesn&apos;t have any criteria
            </p>
          ) : null}
          {rest.length > 0 ? (
            <div className={cx("mt-3", shown.length === 0 && "flex flex-col items-center")}>
              <SmallButton onClick={() => setAdding((a) => !a)} testId="aw-add-criteria">
                <Icon name="plus" size={13} /> Add criteria
              </SmallButton>
              {adding ? (
                <ul className="mt-1.5 w-full rounded-[6px] border border-line py-1" data-testid="aw-add-list">
                  {rest.map((k) => (
                    <li key={k.id}>
                      <button
                        type="button"
                        className="block w-full px-3 py-1.5 text-left hover:bg-[#f0f0f0]"
                        data-testid={`aw-add-${k.id}`}
                        onClick={() => {
                          setSet([...set, k.id]);
                          setAdding(false);
                        }}
                      >
                        {k.property}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          {!valid ? (
            <p className="mt-2 text-[12.5px] text-[#99201a]" data-testid="aw-limit-error">
              Enter a percentage from 0 to 100.
            </p>
          ) : null}
        </div>
      </div>
      <div>
        <p className="mb-2 text-[13.5px] font-bold">If none of the criteria are met, go here:</p>
        <div className={BOX}>
          <Field label="Branch name">
            <input readOnly value={NONE_MET} aria-label="Branch name if none of the criteria are met" className={INPUT} />
          </Field>
        </div>
      </div>
    </Panel>
  );
}

/** The approval step's settings. The approver can be changed to another of the vertical's people; the message follows the criteria and the approver. */
function StepPanel({ rule, onClose }: { rule: ApprovalRule; onClose: () => void }) {
  const { pack, dispatch } = useShell();
  const [approverId, setApproverId] = useState(rule.config.approverId);
  const save = () => {
    dispatch({ t: "approval.rule", edit: { approverId } });
    onClose();
  };
  return (
    <Panel open="step" onClose={onClose} onSave={save}>
      <Field label="Quote *">
        <Picker>Enrolled quote</Picker>
      </Field>
      <Field label="Message to approver *" hint="Give the approver context on why they are approving this">
        <textarea
          readOnly
          rows={4}
          value={approvalMessage(pack, { ...rule.config, approverId })}
          aria-label="Message to approver"
          data-testid="aw-panel-message"
          className="w-full cursor-default resize-none rounded-[4px] border border-[#7c8a99] px-3 py-2 text-[13.5px] focus:outline-none"
        />
      </Field>
      <Field label="Approvers *" hint="Select the people to be added to the list of approvers">
        <select
          value={approverId}
          onChange={(e) => setApproverId(e.target.value)}
          aria-label="Approvers"
          data-testid="aw-panel-approver"
          className="h-9 w-full rounded-[4px] border border-[#7c8a99] bg-white px-2 text-[13.5px] focus:border-ink focus:outline-none focus:ring-2 focus:ring-[#b6d9d7]"
        >
          {rule.approvers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}, {p.title}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Sequential approval priority">
        <Picker>{rule.priority}</Picker>
      </Field>
    </Panel>
  );
}

function FlowPanel({ rule, onClose }: { rule: ApprovalRule; onClose: () => void }) {
  const { dispatch } = useShell();
  const [required, setRequired] = useState(rule.required);
  const save = () => {
    dispatch({ t: "approval.rule", edit: { required } });
    onClose();
  };
  return (
    <Panel open="flow" onClose={onClose} onSave={save}>
      <fieldset>
        <legend className="text-[13px] font-bold">Approvers required</legend>
        <div className="mt-1.5">
          {APPROVERS_REQUIRED.map((option) => (
            <label key={option} className="flex items-center gap-2 py-0.5">
              <input type="radio" name="approvers-required" checked={option === required} onChange={() => setRequired(option)} className="accent-ink" /> {option}
            </label>
          ))}
        </div>
      </fieldset>
    </Panel>
  );
}

/**
 * The Quote Approval Workflow: where HubSpot's advanced quote approvals keep their rule. Edit on
 * Settings > Objects > Quotes > Approvals leads here. One branch holds the rule's filters, and behind it
 * are the approval step and the approval flow. It reads the rule the quote's Approvals panel checks against,
 * and what is saved here changes that rule for the rest of the session.
 */
export function ApprovalWorkflowPage() {
  const { pack, world, route } = useShell();
  const rule = approvalRuleOf(pack, world);
  const [open, setOpen] = useState<Open | null>(null);
  const from = world.quotes.find((q) => q.id === route.query.get("from"));
  const toggle = (card: Open) => () => setOpen((o) => (o === card ? null : card));
  const close = () => setOpen(null);
  const dash = "border-dashed border-[#516f90]";

  return (
    <div className="flex h-full min-h-0 flex-col" data-testid="approval-workflow">
      <header className="flex items-center justify-between gap-4 border-b border-line bg-white px-6 py-3.5">
        <div className="min-w-0">
          <A to={approvalSettingsFrom(from?.id)} className="inline-flex items-center gap-1 text-[13px] font-semibold text-link hover:underline" data-testid="aw-back">
            <Icon name="chevronLeft" size={14} /> Quote approval settings
          </A>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-[19px] font-semibold">{APPROVAL_WORKFLOW_NAME}</h1>
            <Tag tone={statusTone("On")}>Workflow is on</Tag>
          </div>
          <p className="mt-0.5 text-[12.5px] text-ink-muted">Quote-based · Created when advanced quote approvals were turned on</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {from ? (
            // The quote reopens with its Approvals panel showing, where the link to this workflow is.
            <A to={`/approvals/${from.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-[6px] border border-ink bg-white px-4 text-[13.5px] font-semibold hover:bg-[#f5f5f5]" data-testid="aw-back-quote">
              <Icon name="arrowLeft" size={15} /> Back to {from.number}
            </A>
          ) : null}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {open === "branch" ? <BranchPanel rule={rule} onClose={close} /> : null}
        {open === "step" ? <StepPanel rule={rule} onClose={close} /> : null}
        {open === "flow" ? <FlowPanel rule={rule} onClose={close} /> : null}
        <div className="hs-scroll min-w-0 flex-1 overflow-auto bg-[#f0f0f0] bg-[radial-gradient(#c4c4c4_1px,transparent_1px)] bg-[length:18px_18px] px-8 py-6">
          <div className="mx-auto flex w-max flex-col items-center">
            <Step
              title="Trigger enrollment for quotes"
              icon="flag"
              testId="aw-trigger"
              details={
                <span className="flex items-center gap-1.5 border-r border-[#8a8a8a] pr-3">
                  <Icon name="refresh" size={13} /> Re-enroll on
                </span>
              }
            >
              <p className="text-[12.5px] font-bold">When this happens</p>
              <div className="mt-2 rounded-[10px] border border-line p-3">
                <p className="text-[14px] font-bold">Group 1</p>
                <div className="mt-2 space-y-1 rounded-[6px] bg-[#f0f0f0] px-3 py-2.5 text-[13px]">
                  <p>
                    <span className="font-bold">Property value changed has been completed</span> any number of times anytime
                  </p>
                  <p>and</p>
                  <p>
                    <span className="font-bold">Property name</span> is <span className="font-bold">Internal quote status</span>
                  </p>
                  <p>
                    <span className="font-bold">New value: Internal quote status</span> is any of <span className="font-bold">Pending approval</span>
                  </p>
                </div>
              </div>
            </Step>
            <Plus />
            <Step title={STEP.branch} icon="workflow" details={null} open={open === "branch"} onOpen={toggle("branch")} testId="aw-branch">
              <p>
                Go to <span className="font-bold">{rule.branch}</span> if these criteria are met:
              </p>
              <ul className="mt-1.5" data-testid="aw-criteria">
                {rule.filters.map((f, i) => (
                  <li key={f.id}>
                    {i > 0 ? <p className="py-0.5 text-[12.5px]">or</p> : null}
                    <Marked filter={f} marked={open !== "branch"} className="rounded-[6px] bg-[#f5f5f5] px-2.5 py-1">
                      <p data-testid={`aw-criteria-${f.id}`}>{filterSentence(f)}</p>
                    </Marked>
                  </li>
                ))}
              </ul>
              {rule.filters.length === 0 ? (
                <p className="mt-1 italic text-ink-muted" data-testid="aw-criteria-none">
                  This segment doesn&apos;t have any criteria
                </p>
              ) : null}
            </Step>
            <span className="h-4 w-0.5 bg-[#8a8a8a]" aria-hidden="true" />
            <span className="h-0.5 w-[402px] bg-[#8a8a8a]" aria-hidden="true" />

            <div className="grid grid-cols-[340px_340px] justify-items-center gap-x-[60px]">
              <div className="flex flex-col items-center">
                <span className="h-4 w-0.5 bg-[#8a8a8a]" aria-hidden="true" />
                <BranchBox name={rule.branch} note={rule.filters.length > 1 ? "Open branch to view conditions" : undefined} testId="aw-branch-met" />
                <Plus />
              </div>
              <div className="flex flex-col items-center">
                <span className="h-4 w-0.5 bg-[#8a8a8a]" aria-hidden="true" />
                <BranchBox name={NONE_MET} testId="aw-branch-none" />
                <Plus />
              </div>

              <Step title={STEP.step} icon="approvals" action open={open === "step"} onOpen={toggle("step")} testId="aw-step">
                Approval required from{" "}
                <span className="font-bold" data-testid="aw-step-approver">
                  {rule.approver?.name}
                </span>
                . Message:{" "}
                <span className="font-bold" data-testid="aw-step-message">
                  {rule.note}
                </span>
              </Step>
              <div className="flex h-full flex-col items-center">
                <Step title="Go to action" icon="arrowRight" testId="aw-goto">
                  Go to <span className="font-bold">{STEP.flow}</span>.
                </Step>
                <span className={cx("w-0 flex-1 border-l-2", dash)} aria-hidden="true" />
              </div>

              <Plus />
              <span className={cx("h-full w-0 border-l-2", dash)} aria-hidden="true" />

              <Step title={STEP.flow} icon="approvals" action open={open === "flow"} onOpen={toggle("flow")} testId="aw-flow">
                Create approval flow using previously executed approval steps. If no steps were added this quote will be automatically approved
              </Step>
              {/* The None met branch joins the approval flow, drawn as HubSpot draws a Go to action: a dashed line with an arrow. */}
              <div className="relative h-full w-full" aria-hidden="true">
                <span className={cx("absolute -left-[50px] right-1/2 top-0 h-9 rounded-br-[14px] border-b-2 border-r-2", dash)} />
                <span className="absolute -left-[60px] top-[29px] h-0 w-0 border-y-[6px] border-r-[10px] border-y-transparent border-r-[#516f90]" />
              </div>

              <div className="flex flex-col items-center">
                <Plus />
                <p className="rounded-[10px] border border-[#8a8a8a] bg-white px-5 py-2 text-[13px] font-bold">3. End</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
