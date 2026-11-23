import type { DemoId } from "@/verticals/catalog";
import type { Pack, TicketsDemoConfig } from "@/verticals/types";
import { addActivity, iso, touch } from "./helpers";
import type { Action, World } from "./types";

export type TicketTimelineItem = {
  id: string;
  at: string;
  kind: "trigger" | "workflow" | "outreach" | "note" | "escalation" | "checklist" | "broadcast" | "resolved";
  title: string;
  body: string;
  actor: string;
};

export type TicketRunState = {
  intakeSubmitted: boolean;
  feedbackScore: number | null;
  feedbackTopics: string[];
  feedbackComment: string;
  ticketOpened: boolean;
  stageId: string | null;
  completedChecklistIds: string[];
  escalated: boolean;
  notifiedCompanyIds: string[];
  outreachSent: boolean;
  outreachText: string;
  secondarySeen: boolean;
  resolved: boolean;
  resolutionNote: string;
  timeline: TicketTimelineItem[];
};

export type TicketsState = {
  byDemo: Record<string, TicketRunState>;
};

export type TicketsAction =
  | {
      t: "tk.submitIntake";
      demoId: DemoId;
      at: number;
      score?: number;
      topics?: string[];
      comment?: string;
    }
  | { t: "tk.openTicket"; demoId: DemoId }
  | { t: "tk.toggleChecklist"; demoId: DemoId; itemId: string; at: number }
  | { t: "tk.completeChecklist"; demoId: DemoId; at: number }
  | { t: "tk.escalate"; demoId: DemoId; at: number }
  | { t: "tk.broadcast"; demoId: DemoId; at: number }
  | { t: "tk.sendOutreach"; demoId: DemoId; text?: string; at: number }
  | { t: "tk.seenSecondary"; demoId: DemoId }
  | { t: "tk.resolve"; demoId: DemoId; note?: string; at: number };

export function emptyTicketRun(): TicketRunState {
  return {
    intakeSubmitted: false,
    feedbackScore: null,
    feedbackTopics: [],
    feedbackComment: "",
    ticketOpened: false,
    stageId: null,
    completedChecklistIds: [],
    escalated: false,
    notifiedCompanyIds: [],
    outreachSent: false,
    outreachText: "",
    secondarySeen: false,
    resolved: false,
    resolutionNote: "",
    timeline: [],
  };
}

export function seedTickets(): TicketsState {
  return { byDemo: {} };
}

export function getTicketRun(w: Pick<World, "tk">, demoId: string): TicketRunState {
  return w.tk.byDemo[demoId] ?? emptyTicketRun();
}

export function isTicketsAction(a: Action): a is TicketsAction {
  return a.t.startsWith("tk.");
}

function ensureRun(w: World, demoId: string): TicketRunState {
  if (!w.tk.byDemo[demoId]) w.tk.byDemo[demoId] = emptyTicketRun();
  return w.tk.byDemo[demoId];
}

function pushTimeline(w: World, run: TicketRunState, item: Omit<TicketTimelineItem, "id">): void {
  w.seq += 1;
  run.timeline.unshift({ id: `tk-ev-${w.seq}`, ...item });
}

function resolveConfig(pack: Pack, demoId: DemoId): TicketsDemoConfig | undefined {
  return pack.demos.tickets?.[demoId];
}

export function applyTickets(w: World, a: TicketsAction, pack: Pack): void {
  const cfg = resolveConfig(pack, a.demoId);
  if (!cfg) return;
  const run = ensureRun(w, a.demoId);
  const owner = pack.personas.find((p) => p.id === cfg.ticket.ownerId);
  const ownerName = owner?.name ?? "Service Manager";
  const ids = {
    contactIds: [cfg.ticket.contactId],
    companyIds: [cfg.ticket.companyId],
    ...(cfg.ticket.dealId ? { dealIds: [cfg.ticket.dealId] } : {}),
  };

  switch (a.t) {
    case "tk.submitIntake": {
      if (run.intakeSubmitted) return;
      const at = iso(a.at);
      run.intakeSubmitted = true;
      run.stageId = cfg.ticket.initialStageId;

      if (cfg.mode === "feedback" && cfg.offPlatform.feedback) {
        const fb = cfg.offPlatform.feedback;
        const score = a.score ?? fb.scriptedScore;
        const topics = a.topics && a.topics.length > 0 ? a.topics : fb.scriptedTopics;
        const comment = a.comment?.trim() || fb.scriptedComment;
        run.feedbackScore = score;
        run.feedbackTopics = topics;
        run.feedbackComment = comment;

        pushTimeline(w, run, {
          at: iso(a.at - 4_000),
          kind: "trigger",
          title: `Post-visit CSAT survey submitted (${score}/${fb.scaleMax})`,
          body: `${fb.visitorName} rated ${fb.visitLocation} ${score}/${fb.scaleMax} (${topics.join(", ")}). "${comment}"`,
          actor: fb.visitorName,
        });
        pushTimeline(w, run, {
          at,
          kind: "workflow",
          title: `Workflow routed ${cfg.ticket.number} to ${ownerName}`,
          body: cfg.workflowNote
            ? `${cfg.workflowNote.name}: ${cfg.workflowNote.action}`
            : `Score ${score}/${fb.scaleMax} met threshold (<= ${fb.lowScoreThreshold}/${fb.scaleMax}); Service Hub ticket opened and assigned to ${ownerName}.`,
          actor: "HubSpot Service Automation",
        });

        addActivity(w, {
          at,
          type: "workflow",
          title: `Low-score feedback ticket ${cfg.ticket.number} opened (${score}/${fb.scaleMax})`,
          body: `${fb.visitLocation} — ${topics.join(", ")}. Routed automatically to ${ownerName}.`,
          byId: null,
          ...ids,
          linkPath: `/tickets/${cfg.ticket.id}`,
          linkLabel: "View ticket",
        });
      } else if (cfg.mode === "checklist" && cfg.offPlatform.checklist) {
        const ch = cfg.offPlatform.checklist;
        pushTimeline(w, run, {
          at,
          kind: "trigger",
          title: `Customer completed ${ch.kind === "doc-request" ? "document upload" : "onboarding kickoff"}`,
          body: `${ch.toName} submitted ${ch.requestedItems.length} requested item(s) via off-platform portal.`,
          actor: ch.toName,
        });
        addActivity(w, {
          at,
          type: "form",
          title: `${cfg.ticket.number}: Onboarding submission received`,
          body: `${ch.toName} uploaded ${ch.requestedItems.map((i) => i.label).join(", ")}.`,
          byId: null,
          ...ids,
          linkPath: `/tickets/${cfg.ticket.id}`,
          linkLabel: "View ticket",
        });
      } else if (cfg.mode === "sla" && cfg.offPlatform.sla) {
        const s = cfg.offPlatform.sla;
        pushTimeline(w, run, {
          at: iso(a.at - 4_000),
          kind: "trigger",
          title: `${s.channel} complaint logged (${s.referenceId})`,
          body: `${s.fromName}: "${s.subject}". Categorized as ${s.category} with ${cfg.sla?.targetLabel ?? "priority SLA"}.`,
          actor: s.fromName,
        });
        if (cfg.workflowNote) {
          pushTimeline(w, run, {
            at,
            kind: "workflow",
            title: `Automated 24h acknowledgement sent & SLA started (${cfg.ticket.number})`,
            body: `${cfg.workflowNote.name}: ${cfg.workflowNote.action}`,
            actor: "HubSpot Service Automation",
          });
        }
        addActivity(w, {
          at,
          type: "workflow",
          title: `Complaint ticket ${cfg.ticket.number} opened with SLA`,
          body: `${s.category} · ${cfg.sla?.targetLabel ?? "Priority SLA"} assigned to ${ownerName}.`,
          byId: null,
          ...ids,
          linkPath: `/tickets/${cfg.ticket.id}`,
          linkLabel: "View ticket",
        });
      } else if (cfg.mode === "incident" && cfg.offPlatform.incident) {
        const inc = cfg.offPlatform.incident;
        pushTimeline(w, run, {
          at,
          kind: "trigger",
          title: `${inc.severity} monitoring alert ingested (${inc.alertId})`,
          body: `${inc.monitorTool} flagged ${inc.serviceName}: ${inc.summary} (${cfg.impactedAccounts?.length ?? 0} managed companies linked).`,
          actor: inc.monitorTool,
        });
        addActivity(w, {
          at,
          type: "workflow",
          title: `Incident ticket ${cfg.ticket.number} opened (${inc.severity})`,
          body: `${inc.serviceName} · ${cfg.impactedAccounts?.length ?? 0} impacted companies attached.`,
          byId: null,
          ...ids,
          linkPath: `/tickets/${cfg.ticket.id}`,
          linkLabel: "View ticket",
        });
      }

      const taskId = `tk-task-${cfg.ticket.id}`;
      if (!w.tasks.some((t) => t.id === taskId)) {
        w.tasks.unshift({
          id: taskId,
          title: `Follow up on ${cfg.ticket.number}: ${cfg.ticket.subject}`,
          type: "Email",
          priority: cfg.ticket.priority === "Low" ? "Medium" : "High",
          dueAt: iso(a.at + 4 * 3_600_000),
          ownerId: cfg.ticket.ownerId,
          status: "open",
          contactId: cfg.ticket.contactId,
          companyId: cfg.ticket.companyId,
          ...(cfg.ticket.dealId ? { dealId: cfg.ticket.dealId } : {}),
          notes: cfg.ticket.summary,
          isNew: true,
        });
      }

      const notifId = `nt-tk-${cfg.ticket.id}`;
      if (!w.notifications.some((n) => n.id === notifId)) {
        w.notifications.unshift({
          id: notifId,
          personaId: cfg.ticket.ownerId,
          at,
          kind: "task",
          title: `New ${cfg.ticket.priority} ticket assigned: ${cfg.ticket.number}`,
          body: `${cfg.ticket.subject} (${cfg.ticket.locationLabel})`,
          path: `/tickets/${cfg.ticket.id}`,
          read: false,
        });
        if (cfg.ticket.ownerId !== pack.defaultPersonaId) {
          w.notifications.unshift({
            id: `${notifId}-default`,
            personaId: pack.defaultPersonaId,
            at,
            kind: "task",
            title: `Ticket ${cfg.ticket.number} routed to ${ownerName}`,
            body: `${cfg.ticket.subject} (${cfg.ticket.locationLabel})`,
            path: `/tickets/${cfg.ticket.id}`,
            read: false,
          });
        }
      }

      touch(w, at, { companyId: cfg.ticket.companyId, contactIds: [cfg.ticket.contactId], dealId: cfg.ticket.dealId ?? null });
      return;
    }

    case "tk.openTicket": {
      run.ticketOpened = true;
      if (!run.stageId) run.stageId = cfg.ticket.initialStageId;
      if (cfg.mode === "checklist" && run.timeline.length === 0 && cfg.workflowNote) {
        pushTimeline(w, run, {
          at: new Date().toISOString(),
          kind: "workflow",
          title: `${cfg.workflowNote.name} (${cfg.ticket.number})`,
          body: `${cfg.workflowNote.trigger} — ${cfg.workflowNote.action}`,
          actor: "HubSpot Service Automation",
        });
      }
      return;
    }

    case "tk.toggleChecklist": {
      const item = cfg.checklist?.find((i) => i.id === a.itemId);
      if (!item) return;
      const exists = run.completedChecklistIds.includes(a.itemId);
      if (exists) {
        run.completedChecklistIds = run.completedChecklistIds.filter((id) => id !== a.itemId);
      } else {
        run.completedChecklistIds.push(a.itemId);
        run.stageId = cfg.ticket.inProgressStageId;
        pushTimeline(w, run, {
          at: iso(a.at),
          kind: "checklist",
          title: `Verified checklist item: ${item.label}`,
          body: `${item.category} · ${item.verificationSource ?? item.ownerLabel}`,
          actor: ownerName,
        });
      }
      return;
    }

    case "tk.completeChecklist": {
      const items = cfg.checklist ?? [];
      for (const item of items) {
        if (!run.completedChecklistIds.includes(item.id)) run.completedChecklistIds.push(item.id);
      }
      run.stageId = cfg.ticket.inProgressStageId;
      pushTimeline(w, run, {
        at: iso(a.at),
        kind: "checklist",
        title: `All ${items.length} onboarding checklist items verified`,
        body: items.map((i) => i.label).join(" · "),
        actor: ownerName,
      });
      return;
    }

    case "tk.escalate": {
      if (run.escalated) return;
      const at = iso(a.at);
      run.escalated = true;
      if (cfg.ticket.escalatedStageId) run.stageId = cfg.ticket.escalatedStageId;
      const escOwner = pack.personas.find((p) => p.id === cfg.sla?.escalationOwnerId);
      pushTimeline(w, run, {
        at,
        kind: "escalation",
        title: `Overdue SLA escalation triggered — assigned to ${escOwner?.name ?? ownerName}`,
        body: cfg.sla?.escalationNote ?? "SLA threshold exceeded; manager notified and priority elevated.",
        actor: "HubSpot SLA Automation",
      });
      addActivity(w, {
        at,
        type: "workflow",
        title: `Ticket ${cfg.ticket.number} escalated for SLA compliance`,
        body: cfg.sla?.escalationNote ?? `Escalated to ${escOwner?.name ?? ownerName}.`,
        byId: null,
        ...ids,
        linkPath: `/tickets/${cfg.ticket.id}`,
        linkLabel: "View ticket",
      });
      return;
    }

    case "tk.broadcast": {
      const accounts = cfg.impactedAccounts ?? [];
      if (accounts.length === 0) return;
      const at = iso(a.at);
      run.notifiedCompanyIds = accounts.map((acc) => acc.companyId);
      run.stageId = cfg.ticket.inProgressStageId;
      pushTimeline(w, run, {
        at,
        kind: "broadcast",
        title: `Incident notification sent to ${accounts.length} impacted companies`,
        body: accounts.map((acc) => `${acc.companyName} (${acc.primaryContactEmail})`).join(", "),
        actor: ownerName,
      });
      addActivity(w, {
        at,
        type: "email",
        title: `${cfg.ticket.number}: Batch incident alert sent to ${accounts.length} accounts`,
        body: `Proactive status alert delivered to primary IT contacts for all affected managed companies.`,
        byId: cfg.ticket.ownerId,
        ...ids,
      });
      return;
    }

    case "tk.sendOutreach": {
      if (run.outreachSent) return;
      const at = iso(a.at);
      const body = a.text?.trim() || cfg.outreach.defaultBody;
      run.outreachSent = true;
      run.outreachText = body;
      run.ticketOpened = true;
      run.stageId = cfg.ticket.inProgressStageId;

      pushTimeline(w, run, {
        at,
        kind: "outreach",
        title: `${cfg.outreach.channelLabel} sent: ${cfg.outreach.subject}`,
        body,
        actor: ownerName,
      });
      addActivity(w, {
        at,
        type: "email",
        title: `${cfg.outreach.channelLabel} sent (${cfg.ticket.number})`,
        body: `To ${cfg.outreach.recipientLabel}: ${cfg.outreach.subject}`,
        byId: cfg.ticket.ownerId,
        ...ids,
        linkPath: `/tickets/${cfg.ticket.id}`,
        linkLabel: "View ticket",
      });
      touch(w, at, { companyId: cfg.ticket.companyId, contactIds: [cfg.ticket.contactId], dealId: cfg.ticket.dealId ?? null });
      return;
    }

    case "tk.seenSecondary": {
      run.secondarySeen = true;
      return;
    }

    case "tk.resolve": {
      if (run.resolved) return;
      const at = iso(a.at);
      const note = a.note?.trim() || cfg.outreach.followUpNote;
      run.resolved = true;
      run.resolutionNote = note;
      run.stageId = cfg.ticket.resolvedStageId;

      pushTimeline(w, run, {
        at: iso(a.at - 1_000),
        kind: "note",
        title: "Follow-up & operational resolution note logged",
        body: note,
        actor: ownerName,
      });
      pushTimeline(w, run, {
        at,
        kind: "resolved",
        title: `Ticket ${cfg.ticket.number} closed — ${cfg.outreach.resolutionSummary}`,
        body: `Moved to ${cfg.stages.find((s) => s.id === cfg.ticket.resolvedStageId)?.label ?? "Resolved"}.`,
        actor: ownerName,
      });
      addActivity(w, {
        at,
        type: "note",
        title: `Ticket ${cfg.ticket.number} resolved`,
        body: `${note} (${cfg.outreach.resolutionSummary})`,
        byId: cfg.ticket.ownerId,
        ...ids,
        linkPath: `/tickets/${cfg.ticket.id}`,
        linkLabel: "View ticket",
      });

      const task = w.tasks.find((t) => t.id === `tk-task-${cfg.ticket.id}`);
      if (task) task.status = "done";
      for (const n of w.notifications) {
        if (n.id.startsWith(`nt-tk-${cfg.ticket.id}`)) n.read = true;
      }
      touch(w, at, { companyId: cfg.ticket.companyId, contactIds: [cfg.ticket.contactId], dealId: cfg.ticket.dealId ?? null });
      return;
    }
  }
}
