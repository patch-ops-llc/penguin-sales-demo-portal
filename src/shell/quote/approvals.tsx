"use client";

import { useState } from "react";
import { nowMs } from "@/lib/format";
import { approvalConditions, approvalReasons, floorPrice, linesBelowFloor, netUnitPrice, quoteTotals, reasonList } from "@/store/quote-math";
import { useShell } from "@/store/store";
import { fill, labelsOf } from "@/verticals/labels";
import type { Quote } from "@/verticals/types";
import { Ext } from "../ext";
import { dateTime, money2, pct, relative } from "../format";
import { Icon } from "../icons";
import { A, Avatar, Button, cx, Modal } from "../ui";
import { APPROVAL_SETTINGS_TRAIL, approvalRuleOf, approvalSettingsFrom } from "./approval-rule";

const DOT = { pending: "#f5c26b", approved: "#00bda5", changes: "#f2545b", none: "#b0b9c6" };

function Dot({ color }: { color: string }) {
  return <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />;
}

/** Penguin piece 1: each product's floor price and the check that flags lines below it. HubSpot's approval rule filters on that flag. */
export function FloorCheck({ quote, className }: { quote: Pick<Quote, "lineItems" | "discountPct">; className?: string }) {
  const { pack } = useShell();
  const rule = pack.demos.discountApproval;
  const below = linesBelowFloor(quote, rule);
  return (
    <div className={className} data-testid="floor-check">
      <Ext id="floor-price-rule" className="rounded-[8px] bg-[#fafafa] px-3 py-2 pr-10" pinClass="!right-1.5 !top-1">
        <p className="text-[12.5px] font-semibold">
          Floor price check:{" "}
          <span className={below.length > 0 ? "text-[#99201a]" : "text-[#0b5b2b]"} data-testid="floor-result">
            {below.length === 0 ? "every line is at or above its floor price" : `${below.length} of ${quote.lineItems.length} lines below floor price`}
          </span>
        </p>
        {below.length > 0 ? (
          <ul className="mt-1 space-y-1 text-[12px] text-ink-muted">
            {below.map((l, i) => (
              <li key={`${l.sku}-${i}`}>
                <span className="block truncate text-ink">{l.name}</span>
                <span className="tabular-nums">
                  {money2(netUnitPrice(quote, l))} against a floor of {money2(floorPrice(l, rule))}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </Ext>
    </div>
  );
}

/** Penguin piece 2: where the unit cost behind the margin comes from. Kept apart from the floor check so the two callouts do not overlap. */
export function CostFeed({ className }: { className?: string }) {
  const { pack } = useShell();
  return (
    <Ext id="erp-cost-feed" className={cx("rounded-[8px] bg-[#fafafa] px-3 py-2 pr-10", className)} pinClass="!right-1.5 !top-0.5">
      <p className="text-[12px] text-ink-muted" data-testid="cost-feed">
        {fill(labelsOf(pack).approval.costFeed, { backOffice: pack.terms.backOffice, when: relative(pack.demos.backOffice.syncedAt).toLowerCase() })}
      </p>
    </Ext>
  );
}

/** "Request approval", with HubSpot's one field: Notes to approver. */
export function RequestApprovalDialog({ quote, onClose }: { quote: Quote; onClose: () => void }) {
  const { pack, dispatch } = useShell();
  const rule = pack.demos.discountApproval;
  const approver = pack.personas.find((p) => p.id === rule.approverId);
  const reasons = approvalReasons(quote, rule);
  const [note, setNote] = useState("");
  return (
    <Modal
      title="Request approval"
      onClose={onClose}
      width={520}
      testId="request-approval-dialog"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            data-testid="request-approval-submit"
            onClick={() => {
              dispatch({ t: "quote.requestApproval", id: quote.id, at: nowMs(), note });
              onClose();
            }}
          >
            Request approval
          </Button>
        </>
      }
    >
      <p className="text-[13.5px]">
        This quote needs approval from <span className="font-semibold">{approver?.name}</span> before it can be shared: {reasonList(reasons)}.
      </p>
      <label className="mt-4 block text-[13px] font-semibold" htmlFor="approval-note">
        Notes to approver
      </label>
      <textarea
        id="approval-note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={4}
        data-testid="approval-note"
        className="mt-1.5 w-full resize-none rounded-[6px] border border-line px-3 py-2 text-[13.5px] focus:border-ink focus:outline-none"
      />
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="border-t border-line-soft px-5 py-4">
      <button type="button" className="flex items-center gap-2 text-[14px] font-semibold" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Icon name={open ? "chevronDown" : "chevronRight"} size={15} /> {title}
      </button>
      {open ? <div className="mt-3">{children}</div> : null}
    </section>
  );
}

/**
 * The Approvals panel of the quote editor's right sidebar: status, Approve and Request changes
 * for the approver, the request note, the approvers, and the approval activity.
 */
export function ApprovalsPanel({ quote, onClose }: { quote: Quote; onClose: () => void }) {
  const { pack, persona, dispatch } = useShell();
  const rule = pack.demos.discountApproval;
  const approval = quote.approval;
  const [form, setForm] = useState<"approve" | "changes" | null>(null);
  const [text, setText] = useState("");
  const totals = quoteTotals(quote);
  const reasons = approval?.reasons ?? approvalReasons(quote, rule);
  const conditions = approvalConditions(quote, rule);
  const approver = pack.personas.find((p) => p.id === (approval?.approverId ?? rule.approverId));
  const requester = pack.personas.find((p) => p.id === approval?.requestedById);
  const isApprover = persona.id === approver?.id;
  const pending = approval?.status === "pending";
  const state: { label: string; color: string } = !approval
    ? reasons.length > 0
      ? { label: "Approval required", color: DOT.pending }
      : { label: "Approval not needed", color: DOT.none }
    : approval.status === "approved"
      ? { label: "Approved", color: DOT.approved }
      : approval.status === "changes_requested"
        ? { label: "Changes requested", color: DOT.changes }
        : { label: isApprover ? "Pending your approval" : "Pending approval", color: DOT.pending };
  const facts = (
    <dl className="mt-3 divide-y divide-line-soft border-y border-line-soft text-[13px]">
      <div className="flex justify-between py-1.5">
        <dt>Total discount</dt>
        <dd className="tabular-nums">
          {pct(totals.discountPct)} ({money2(totals.discount)})
        </dd>
      </div>
      <div className="flex justify-between py-1.5">
        <dt>Quote margin %</dt>
        <dd className="tabular-nums" data-testid="approval-margin">
          {pct(totals.marginPct)}
        </dd>
      </div>
      <div className="flex justify-between py-1.5">
        <dt>Quote amount</dt>
        <dd className="tabular-nums">{money2(totals.total)}</dd>
      </div>
    </dl>
  );
  const submit = () => {
    if (form === "approve") dispatch({ t: "quote.approve", id: quote.id, at: nowMs(), message: text });
    else dispatch({ t: "quote.requestChanges", id: quote.id, at: nowMs(), feedback: text });
    setForm(null);
    setText("");
  };

  return (
    <aside className="hs-slide-in hs-scroll flex w-[380px] shrink-0 flex-col overflow-y-auto border-l border-line bg-white" data-testid="approval-card" aria-label="Approvals">
      <header className="flex items-center gap-2 px-5 py-4">
        <h2 className="text-[17px] font-semibold">Approvals</h2>
        <button type="button" onClick={onClose} aria-label="Close approvals" className="ml-auto rounded p-1 text-ink-muted hover:bg-[#f0f0f0]" data-testid="approvals-close">
          <Icon name="close" size={17} />
        </button>
      </header>

      <div className="border-t border-line-soft px-5 py-4">
        <p className="flex items-center gap-2 text-[14px] font-semibold">
          <Dot color={state.color} /> <span data-testid="approval-status">{state.label}</span>
        </p>
        {pending && isApprover ? (
          form ? (
            <div className="mt-3" data-testid="approval-form">
              <label className="block text-[12.5px] font-semibold" htmlFor="approval-text">
                {form === "approve" ? "Add a message to be included in the notification" : "Requested changes"}
              </label>
              <textarea
                id="approval-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                autoFocus
                className="mt-1.5 w-full resize-none rounded-[6px] border border-line px-3 py-2 text-[13px] focus:border-ink focus:outline-none"
              />
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="primary" onClick={submit} disabled={form === "changes" && !text.trim()} data-testid={form === "approve" ? "approve-confirm" : "reject-confirm"}>
                  {form === "approve" ? "Approve" : "Reject"}
                </Button>
                <Button size="sm" onClick={() => setForm(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => setForm("approve")} data-testid="approve">
                Approve
              </Button>
              <Button size="sm" onClick={() => setForm("changes")} data-testid="request-changes">
                Request changes
              </Button>
            </div>
          )
        ) : null}
        {pending && !isApprover ? (
          <p className="mt-2 text-[12.5px] text-ink-muted" data-testid="approval-not-approver">
            Waiting for {approver?.name}. The quote cannot be shared until it is approved.
          </p>
        ) : null}
        {approval?.status === "approved" ? (
          <p className="mt-2 text-[12.5px] text-ink-muted" data-testid="approval-done">
            Approved by {approver?.name} {approval.decidedAt ? relative(approval.decidedAt).toLowerCase() : ""}.{approval.feedback ? ` "${approval.feedback}"` : ""}
          </p>
        ) : null}
        {approval?.status === "changes_requested" ? (
          <p className="mt-2 text-[12.5px] text-ink-muted">
            {approver?.name} asked for changes{approval.feedback ? `: "${approval.feedback}"` : "."} Edit the quote, then request approval again.
          </p>
        ) : null}
        {!approval && reasons.length === 0 ? (
          <p className="mt-2 text-[12.5px] text-ink-muted">
            This quote is inside the approval limits and can be shared. The limits are set in{" "}
            <A to={approvalSettingsFrom(quote.id)} className="hs-link" data-testid="approval-settings-link">
              {APPROVAL_SETTINGS_TRAIL}
            </A>
            .
          </p>
        ) : null}
      </div>

      {reasons.length > 0 ? (
        <Section title="Approval conditions">
          <p className="flex items-start gap-2 text-[12.5px] text-ink-muted" data-testid="approval-rule-source">
            <Icon name="settings" size={14} className="mt-0.5 shrink-0" />
            <span>
              <span className="font-semibold text-ink">Standard approval rule</span> for quotes, set in{" "}
              <A to={approvalSettingsFrom(quote.id)} className="hs-link" data-testid="approval-settings-link">
                {APPROVAL_SETTINGS_TRAIL}
              </A>
              .
            </span>
          </p>
          <p className="mt-3 text-[12px] font-semibold">Approval is required when any of these conditions is met</p>
          <ul className="mt-1.5 space-y-1.5 text-[12.5px]" data-testid="approval-reasons">
            {conditions.map((c) => (
              <li key={c.id} className={cx("rounded-[6px] border px-2.5 py-1.5", c.reason ? "border-[#f5c26b] bg-[#fef8f0]" : "border-line")} data-testid={`approval-condition-${c.id}`} data-met={Boolean(c.reason)}>
                <p>
                  <span className="font-semibold">{c.property}</span> {c.operator} <span className="font-semibold">{c.value}</span>
                </p>
                {c.reason ? (
                  <p className="mt-0.5 flex items-center gap-1.5 text-[12px]">
                    <Icon name="warning" size={13} className="shrink-0 text-[#b36b00]" /> {c.reason}
                  </p>
                ) : (
                  <p className="mt-0.5 text-[12px] text-ink-muted">Not met on this quote</p>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12px] font-semibold">Approval note</p>
          <p className="mt-0.5 text-[12.5px] text-ink-muted" data-testid="approval-rule-note">
            {approvalRuleOf(pack).note}
          </p>
          <FloorCheck quote={quote} className="mt-3" />
          {facts}
          <CostFeed className="mt-3" />
        </Section>
      ) : null}

      {approval ? (
        <Section title="Request note">
          <div className="flex gap-3">
            <Avatar name={requester?.name ?? "?"} color={requester?.color} size={34} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px]">
                <span className="font-semibold">{requester?.name}</span> <span className="text-[12px] text-ink-muted">{dateTime(approval.requestedAt)}</span>
              </p>
              <p className="mt-0.5 text-[13px]">{approval.note ?? `${approval.reasons.join(". ")}.`}</p>
            </div>
          </div>
        </Section>
      ) : null}

      <Section title="Approvers">
        <p className="text-[12.5px] text-ink-muted">Quote needs to be approved by the following users:</p>
        <div className="mt-3 flex items-center gap-3">
          <Avatar name={approver?.name ?? "?"} color={approver?.color} size={34} />
          <div>
            <p className="text-[13px] font-semibold">{approver?.name}</p>
            <p className="flex items-center gap-1.5 text-[12.5px] text-ink-muted">
              <Dot color={!approval ? DOT.none : approval.status === "approved" ? DOT.approved : approval.status === "changes_requested" ? DOT.changes : DOT.pending} />
              {!approval ? "Not requested" : approval.status === "approved" ? "Approved" : approval.status === "changes_requested" ? "Changes requested" : "Pending"}
            </p>
          </div>
        </div>
      </Section>

      <Section title="Activity">
        <p className="text-[12.5px] text-ink-muted">Recent approval actions on this quote</p>
        {approval ? (
          <ol className="mt-3 space-y-3 text-[13px]">
            {approval.decidedAt ? (
              <li>
                <p>
                  {approver?.name} <span className="font-semibold">{approval.status === "approved" ? "approved" : "requested changes to"}</span> the quote
                </p>
                <p className="text-[12px] text-ink-muted">{dateTime(approval.decidedAt)}</p>
              </li>
            ) : null}
            <li>
              <p>
                {requester?.name} <span className="font-semibold">requested approval</span> from {approver?.name}
              </p>
              <p className="text-[12px] text-ink-muted">{dateTime(approval.requestedAt)}</p>
            </li>
          </ol>
        ) : (
          <p className="mt-3 text-[13px]">No approval has been requested yet.</p>
        )}
      </Section>
    </aside>
  );
}
