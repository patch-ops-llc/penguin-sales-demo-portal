import { approvalFilters, type ApprovalFilter } from "@/store/quote-math";
import { fill, labelsOf } from "@/verticals/labels";
import type { Pack, Persona } from "@/verticals/types";

/** Where HubSpot turns quote approvals on: the Approvals tab of the Quotes object's settings. */
export const APPROVAL_SETTINGS_PATH = "/settings/objects/quotes/approvals";
export const APPROVAL_SETTINGS_TRAIL = "Settings > Objects > Quotes > Approvals";

/** The workflow HubSpot creates when advanced quote approvals are turned on. Edit in the settings leads to it. */
export const APPROVAL_WORKFLOW_ID = "quote-approval";
export const APPROVAL_WORKFLOW_NAME = "Quote Approval Workflow";
const APPROVAL_WORKFLOW_PATH = `/workflows/${APPROVAL_WORKFLOW_ID}`;

const from = (path: string, quoteId?: string | null) => (quoteId ? `${path}?from=${encodeURIComponent(quoteId)}` : path);

/** The settings screen and the workflow, opened from a quote so that they can lead back to it. */
export const approvalSettingsFrom = (quoteId?: string | null) => from(APPROVAL_SETTINGS_PATH, quoteId);
export const approvalWorkflowFrom = (quoteId?: string | null) => from(APPROVAL_WORKFLOW_PATH, quoteId);

export type ApprovalRule = {
  /** Name of the workflow branch a quote takes when it meets any of the filters. */
  branch: string;
  /** One filter group each. A quote that meets any group needs approval. */
  filters: ApprovalFilter[];
  approver: Persona | undefined;
  /** The approval step's message to the approver. */
  note: string;
  /** The step's sequential approval priority. */
  priority: number;
  /** What the approval flow asks of the step's approvers. */
  required: string;
};

/**
 * The portal's quote approval rule, as HubSpot's advanced approval holds it: one branch of the
 * Quote Approval Workflow with its filter groups, and the approval step behind it.
 * The quote's Approvals panel and the workflow both show this, so they cannot disagree.
 */
export function approvalRuleOf(pack: Pack): ApprovalRule {
  const rule = pack.demos.discountApproval;
  const approver = pack.personas.find((p) => p.id === rule.approverId);
  return {
    branch: "Needs approval",
    filters: approvalFilters(rule),
    approver,
    note: fill(labelsOf(pack).approval.rule, { limit: rule.thresholdPct, approver: approver?.name ?? "", title: approver?.title ?? "" }),
    priority: 1,
    required: "All approvers",
  };
}
