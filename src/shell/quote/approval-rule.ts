import { approvalFilters, type ApprovalFilter } from "@/store/quote-math";
import { APPROVERS_REQUIRED, ruleOf, type World } from "@/store/world";
import { fill, labelsOf } from "@/verticals/labels";
import type { ApprovalFilterId, DiscountApprovalConfig, Pack, Persona } from "@/verticals/types";

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
  /** The rule in force: the pack's, with what the rep has changed. */
  config: DiscountApprovalConfig;
  /** Name of the workflow branch a quote takes when it meets any of the filters. */
  branch: string;
  /** One filter group each. A quote that meets any group needs approval. */
  filters: ApprovalFilter[];
  /** Every kind of filter the vertical's rule can have, set or not. */
  kinds: ApprovalFilter[];
  approver: Persona | undefined;
  /** Who can be the approver: the vertical's people other than the rep who writes the quotes. */
  approvers: Persona[];
  /** The approval step's message to the approver. */
  note: string;
  /** The step's sequential approval priority. */
  priority: number;
  /** What the approval flow asks of the step's approvers. */
  required: string;
};

/**
 * The approval step's message, written from the pack's wording for each kind of criteria so that it follows
 * the criteria that are set: the discount first, then terms, then the floor price.
 */
export function approvalMessage(pack: Pack, rule: DiscountApprovalConfig): string {
  const labels = labelsOf(pack).approval;
  const approver = pack.personas.find((p) => p.id === rule.approverId);
  const set = approvalFilters(rule).map((f) => f.id);
  const words: Record<ApprovalFilterId, string> = { discount: fill(labels.ruleDiscount, { limit: rule.thresholdPct }), terms: labels.ruleTerms, floor: labels.ruleFloor };
  const parts = (["discount", "terms", "floor"] as const).filter((id) => set.includes(id)).map((id) => words[id]);
  if (parts.length === 0) return labels.ruleNone;
  const criteria = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")}, or ${parts[parts.length - 1]},`;
  return fill(labels.rule, { criteria: criteria.charAt(0).toUpperCase() + criteria.slice(1), approver: approver?.name ?? "", title: approver?.title ?? "" });
}

/**
 * The portal's quote approval rule, as HubSpot's advanced approval holds it: one branch of the
 * Quote Approval Workflow with its filter groups, and the approval step behind it.
 * The quote's Approvals panel and the workflow both show this, so they cannot disagree.
 */
export function approvalRuleOf(pack: Pack, world: Pick<World, "approvalRule">): ApprovalRule {
  const config = ruleOf(pack, world);
  return {
    config,
    branch: "Needs approval",
    filters: approvalFilters(config),
    kinds: approvalFilters({ ...config, filters: undefined }),
    approver: pack.personas.find((p) => p.id === config.approverId),
    approvers: pack.personas.filter((p) => p.id !== pack.defaultPersonaId),
    note: approvalMessage(pack, config),
    priority: 1,
    required: world.approvalRule.required ?? APPROVERS_REQUIRED[0],
  };
}
