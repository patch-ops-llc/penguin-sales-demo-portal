import type { Pack } from "@/verticals/types";
import { addActivity, iso, touch } from "./helpers";
import { APPROVERS_REQUIRED, type ApprovalRuleEdit, type World } from "./types";

export type CoreAction =
  | { t: "flag"; k: string }
  | { t: "ui"; k: string; v: string }
  | { t: "persona"; id: string }
  | { t: "approval.rule"; edit: ApprovalRuleEdit | null }
  | { t: "notif.read"; id: string }
  | { t: "task.toggle"; id: string }
  | { t: "log"; kind: "note" | "email" | "call" | "meeting" | "task"; text: string; contactIds: string[]; companyIds: string[]; dealIds: string[]; at: number };

export function applyCore(w: World, a: CoreAction, pack: Pack): void {
  switch (a.t) {
    case "flag":
      w.flags[a.k] = true;
      return;
    case "ui":
      w.ui[a.k] = a.v;
      return;
    case "persona": {
      if (!pack.personas.some((p) => p.id === a.id)) return;
      w.persona = a.id;
      // Playing the second person is a demo step in its own right. A request stays with the approver it was sent to.
      const request = w.quotes.find((q) => q.id === pack.demos.discountApproval.quoteId)?.approval;
      if (request && a.id === request.approverId) w.flags["da.asApprover"] = true;
      return;
    }
    case "approval.rule": {
      // Null puts the pack's rule back. Requests already sent keep their approver and their reasons.
      if (!a.edit) {
        w.approvalRule = {};
        return;
      }
      const base = pack.demos.discountApproval;
      const { thresholdPct, filters, approverId, required } = a.edit;
      const next = { ...w.approvalRule };
      if (thresholdPct !== undefined && Number.isFinite(thresholdPct)) next.thresholdPct = Math.min(100, Math.max(0, Math.round(thresholdPct * 100) / 100));
      if (filters) next.filters = (["discount", "floor", "terms"] as const).filter((id) => filters.includes(id) && (id !== "terms" || Boolean(base.terms)));
      if (approverId && pack.personas.some((p) => p.id === approverId)) next.approverId = approverId;
      if (required && APPROVERS_REQUIRED.includes(required)) next.required = required;
      w.approvalRule = next;
      return;
    }
    case "notif.read": {
      const n = w.notifications.find((x) => x.id === a.id);
      if (n) n.read = true;
      return;
    }
    case "task.toggle": {
      const task = w.tasks.find((x) => x.id === a.id);
      if (task) task.status = task.status === "open" ? "done" : "open";
      return;
    }
    case "log": {
      const labels = { note: "Note", email: "Email logged", call: "Call logged", meeting: "Meeting logged", task: "Task created" };
      const at = iso(a.at);
      addActivity(w, { at, type: a.kind, title: labels[a.kind], body: a.text, byId: w.persona, contactIds: a.contactIds, companyIds: a.companyIds, dealIds: a.dealIds });
      touch(w, at, { companyId: a.companyIds[0], contactIds: a.contactIds, dealId: a.dealIds[0] });
      return;
    }
  }
}
