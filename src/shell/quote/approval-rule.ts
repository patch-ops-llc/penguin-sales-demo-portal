import { approvalFilters, type ApprovalFilter } from "@/store/quote-math";
import { fill, labelsOf } from "@/verticals/labels";
import type { Pack, Persona } from "@/verticals/types";

/** Where HubSpot keeps quote approval rules: the Approvals tab of the Quotes object's settings. */
export const APPROVAL_SETTINGS_PATH = "/settings/objects/quotes/approvals";
export const APPROVAL_SETTINGS_TRAIL = "Settings > Objects > Quotes > Approvals";

/** The settings screen, opened from a quote so that it can lead back to it. */
export const approvalSettingsFrom = (quoteId: string) => `${APPROVAL_SETTINGS_PATH}?from=${encodeURIComponent(quoteId)}`;

export type ApprovalRule = { filters: ApprovalFilter[]; approver: Persona | undefined; note: string };

/**
 * The portal's standard quote approval rule: its filters, its approver, and its approval note.
 * The quote's Approvals panel and the settings screen both show this, so they cannot disagree.
 */
export function approvalRuleOf(pack: Pack): ApprovalRule {
  const rule = pack.demos.discountApproval;
  const approver = pack.personas.find((p) => p.id === rule.approverId);
  return {
    filters: approvalFilters(rule),
    approver,
    note: fill(labelsOf(pack).approval.rule, { limit: rule.thresholdPct, approver: approver?.name ?? "", title: approver?.title ?? "" }),
  };
}
