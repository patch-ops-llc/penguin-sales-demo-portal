import type { Pack, Task } from "@/verticals/types";
import { addActivity, iso, touch } from "./helpers";
import { APPROVERS_REQUIRED, type ApprovalRuleEdit, type World } from "./types";

export type CoreAction =
  | { t: "flag"; k: string }
  | { t: "ui"; k: string; v: string }
  | { t: "persona"; id: string }
  | { t: "approval.rule"; edit: ApprovalRuleEdit | null }
  | { t: "notif.read"; id: string }
  | { t: "task.toggle"; id: string }
  | { t: "task.create"; task: Omit<Task, "status" | "isNew"> }
  | { t: "deal.update"; id: string; stage?: string; closeDate?: string; nextStep?: string; at: number }
  | { t: "log"; kind: "note" | "email" | "call" | "meeting" | "task"; text: string; title?: string; byId?: string | null; contactIds: string[]; companyIds: string[]; dealIds: string[]; at: number };

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
    case "task.create": {
      if (w.tasks.some((x) => x.id === a.task.id)) return;
      w.tasks.unshift({ ...a.task, status: "open", isNew: true });
      return;
    }
    case "deal.update": {
      const deal = w.deals.find((d) => d.id === a.id);
      if (!deal) return;
      const at = iso(a.at);
      const stages = deal.pipelineStages ?? pack.stages;
      const changes: string[] = [];
      if (a.stage && a.stage !== deal.stage && stages.some((s) => s.id === a.stage)) {
        changes.push(`Stage: ${stages.find((s) => s.id === deal.stage)?.label ?? deal.stage} → ${stages.find((s) => s.id === a.stage)?.label ?? a.stage}`);
        deal.stage = a.stage;
      }
      if (a.closeDate && a.closeDate !== deal.closeDate) {
        changes.push(`Close date: ${deal.closeDate.slice(0, 10)} → ${a.closeDate.slice(0, 10)}`);
        deal.closeDate = a.closeDate;
      }
      if (a.nextStep !== undefined && a.nextStep !== deal.nextStep) {
        changes.push(`Next step: ${a.nextStep}`);
        deal.nextStep = a.nextStep;
      }
      if (changes.length === 0) return;
      deal.lastActivityAt = at;
      addActivity(w, { at, type: "deal", title: "Deal updated", body: changes.join(" · "), byId: w.persona, contactIds: deal.contactIds, companyIds: [deal.companyId], dealIds: [deal.id] });
      touch(w, at, { companyId: deal.companyId, contactIds: deal.contactIds, dealId: deal.id });
      return;
    }
    case "log": {
      const labels = { note: "Note", email: "Email logged", call: "Call logged", meeting: "Meeting logged", task: "Task created" };
      const at = iso(a.at);
      addActivity(w, { at, type: a.kind, title: a.title ?? labels[a.kind], body: a.text, byId: a.byId === undefined ? w.persona : a.byId, contactIds: a.contactIds, companyIds: a.companyIds, dealIds: a.dealIds });
      touch(w, at, { companyId: a.companyIds[0], contactIds: a.contactIds, dealId: a.dealIds[0] });
      return;
    }
  }
}
