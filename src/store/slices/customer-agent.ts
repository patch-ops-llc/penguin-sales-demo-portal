import type { Pack } from "@/verticals/types";
import { addActivity, iso, touch } from "./helpers";
import type { Action, World } from "./types";

export type CustomerAgentState = {
  chatSent: boolean;
  chatMessage: string | null;
  chatMatched: boolean;
  chatVerified: boolean;
  chatResolved: boolean;
  emailSent: boolean;
  emailReplied: boolean;
  voiceCalled: boolean;
  voiceUnlocked: boolean;
  timelineReviewed: boolean;
  fraudHandedOff: boolean;
  ticketReviewed: boolean;
  repReplied: boolean;
  repReplyText: string | null;
  dashboardReviewed: boolean;
};

export type CustomerAgentAction =
  | { t: "ca.chatSend"; message?: string; at: number }
  | { t: "ca.chatMatch" }
  | { t: "ca.chatVerify" }
  | { t: "ca.chatResolve"; at: number }
  | { t: "ca.emailSend"; at: number }
  | { t: "ca.emailReply"; at: number }
  | { t: "ca.voiceCall"; at: number }
  | { t: "ca.voiceUnlock"; at: number }
  | { t: "ca.reviewTimeline" }
  | { t: "ca.fraudHandoff"; at: number }
  | { t: "ca.reviewTicket" }
  | { t: "ca.repReply"; text: string; at: number }
  | { t: "ca.reviewDashboard" };

export function seedCustomerAgent(): CustomerAgentState {
  return {
    chatSent: false,
    chatMessage: null,
    chatMatched: false,
    chatVerified: false,
    chatResolved: false,
    emailSent: false,
    emailReplied: false,
    voiceCalled: false,
    voiceUnlocked: false,
    timelineReviewed: false,
    fraudHandedOff: false,
    ticketReviewed: false,
    repReplied: false,
    repReplyText: null,
    dashboardReviewed: false,
  };
}

export function isCustomerAgentAction(a: Action): a is CustomerAgentAction {
  return a.t.startsWith("ca.");
}

export function applyCustomerAgent(w: World, a: CustomerAgentAction, pack: Pack): void {
  switch (a.t) {
    case "ca.chatSend": {
      const cfg = pack.demos.customerAgent;
      if (!cfg) return;
      w.ca.chatSent = true;
      w.ca.chatMessage = a.message?.trim() || cfg.chatCase.customerQuestion;
      w.ui["service.case"] = cfg.chatCase.id;
      return;
    }
    case "ca.chatMatch": {
      const cfg = pack.demos.customerAgent;
      if (!cfg) return;
      w.ca.chatSent = true;
      w.ca.chatMatched = true;
      w.ui["service.case"] = cfg.chatCase.id;
      return;
    }
    case "ca.chatVerify": {
      const cfg = pack.demos.customerAgent;
      if (!cfg) return;
      w.ca.chatSent = true;
      w.ca.chatMatched = true;
      w.ca.chatVerified = true;
      w.ui["service.case"] = cfg.chatCase.id;
      return;
    }
    case "ca.chatResolve": {
      const cfg = pack.demos.customerAgent;
      if (!cfg || w.ca.chatResolved) return;
      const at = iso(a.at);
      w.ca.chatSent = true;
      w.ca.chatMatched = true;
      w.ca.chatVerified = true;
      w.ca.chatResolved = true;
      w.ui["service.case"] = cfg.chatCase.id;
      addActivity(w, {
        at,
        type: "chat",
        title: "Chat resolved by Breeze Customer Agent — Pending transfer TXN-884192",
        body: `Verified authorized signer (${cfg.chatCase.securityCheck.auditRef}). Explained 4:00 PM ET ACH cutoff and tomorrow 8:30 AM ET settlement for $48,500 transfer to Hopworks Fabrication LLC. Logged as autonomously resolved.`,
        byId: null,
        contactIds: [cfg.chatCase.contactId],
        companyIds: [cfg.chatCase.companyId],
        linkPath: "/service",
        linkLabel: "Open in Help Desk",
      });
      touch(w, at, { companyId: cfg.chatCase.companyId, contactIds: [cfg.chatCase.contactId] });
      return;
    }
    case "ca.emailSend": {
      const cfg = pack.demos.customerAgent;
      if (!cfg) return;
      w.ca.emailSent = true;
      w.ui["service.case"] = cfg.emailCase.id;
      return;
    }
    case "ca.emailReply": {
      const cfg = pack.demos.customerAgent;
      if (!cfg || w.ca.emailReplied) return;
      const at = iso(a.at);
      w.ca.emailSent = true;
      w.ca.emailReplied = true;
      w.ui["service.case"] = cfg.emailCase.id;
      addActivity(w, {
        at,
        type: "email",
        title: `Email reply & ticket ${cfg.emailCase.ticketNumber} opened — Card dispute (•••• ${cfg.emailCase.card.last4})`,
        body: `Breeze Customer Agent matched ${cfg.emailCase.fromName}, placed a temporary freeze on card •••• ${cfg.emailCase.card.last4}, replied with dispute steps for $1,842.50 at ${cfg.emailCase.card.merchant}, and opened ${cfg.emailCase.ticketNumber}.`,
        byId: null,
        contactIds: [cfg.emailCase.contactId],
        companyIds: [cfg.emailCase.companyId],
        linkPath: "/service",
        linkLabel: "Open in Help Desk",
      });
      touch(w, at, { companyId: cfg.emailCase.companyId, contactIds: [cfg.emailCase.contactId] });
      return;
    }
    case "ca.voiceCall": {
      const cfg = pack.demos.customerAgent;
      if (!cfg) return;
      w.ca.voiceCalled = true;
      w.ui["service.case"] = cfg.voiceCase.id;
      return;
    }
    case "ca.voiceUnlock": {
      const cfg = pack.demos.customerAgent;
      if (!cfg || w.ca.voiceUnlocked) return;
      const at = iso(a.at);
      w.ca.voiceCalled = true;
      w.ca.voiceUnlocked = true;
      w.ui["service.case"] = cfg.voiceCase.id;
      const transcriptText = cfg.voiceCase.transcript.map((line) => `[${line.time}] ${line.name}: ${line.text}`).join("\n");
      addActivity(w, {
        at,
        type: "call",
        title: `Voice call transcribed & resolved — Account unlock (${cfg.voiceCase.duration})`,
        body: `${cfg.voiceCase.timelineSummary}\n\nTranscript:\n${transcriptText}`,
        byId: null,
        contactIds: [cfg.voiceCase.contactId],
        companyIds: [cfg.voiceCase.companyId],
        linkPath: "/service",
        linkLabel: "View in Help Desk",
      });
      touch(w, at, { companyId: cfg.voiceCase.companyId, contactIds: [cfg.voiceCase.contactId] });
      return;
    }
    case "ca.reviewTimeline": {
      const cfg = pack.demos.customerAgent;
      if (!cfg) return;
      w.ca.timelineReviewed = true;
      w.ui["service.case"] = cfg.fraudCase.id;
      return;
    }
    case "ca.fraudHandoff": {
      const cfg = pack.demos.customerAgent;
      if (!cfg || w.ca.fraudHandedOff) return;
      const at = iso(a.at);
      w.ca.timelineReviewed = true;
      w.ca.fraudHandedOff = true;
      w.ui["service.case"] = cfg.fraudCase.id;
      w.notifications = w.notifications.filter((n) => n.id !== "nt-fraud-handoff");
      w.notifications.unshift({
        id: "nt-fraud-handoff",
        personaId: cfg.fraudCase.ownerId,
        at,
        kind: "mention",
        title: `Urgent handoff: ${cfg.fraudCase.ticketNumber} (${cfg.fraudCase.subject})`,
        body: `Breeze Customer Agent intercepted a $64,200 unauthorized wire and escalated Patrice Dunmore's account with full chat, email, and voice history.`,
        path: `/service/tickets/${cfg.fraudCase.ticketId}`,
        read: false,
      });
      addActivity(w, {
        at,
        type: "chat",
        title: `Escalated to human specialist — ${cfg.fraudCase.ticketNumber} (Protective hold active)`,
        body: `${cfg.fraudCase.handoffSummary.headline}\nProtective hold ${cfg.fraudCase.holdDetails.holdId} placed on wire ${cfg.fraudCase.holdDetails.wireRef} ($64,200) and card •••• ${cfg.fraudCase.holdDetails.cardLast4}.`,
        byId: null,
        contactIds: [cfg.fraudCase.contactId],
        companyIds: [cfg.fraudCase.companyId],
        linkPath: `/service/tickets/${cfg.fraudCase.ticketId}`,
        linkLabel: `Open ${cfg.fraudCase.ticketNumber}`,
      });
      touch(w, at, { companyId: cfg.fraudCase.companyId, contactIds: [cfg.fraudCase.contactId] });
      return;
    }
    case "ca.reviewTicket": {
      w.ca.ticketReviewed = true;
      return;
    }
    case "ca.repReply": {
      const cfg = pack.demos.customerAgent;
      if (!cfg) return;
      const at = iso(a.at);
      w.ca.repReplied = true;
      w.ca.repReplyText = a.text.trim() || cfg.fraudCase.defaultRepReply;
      addActivity(w, {
        at,
        type: "note",
        title: `Human specialist response on ${cfg.fraudCase.ticketNumber}`,
        body: w.ca.repReplyText,
        byId: w.persona,
        contactIds: [cfg.fraudCase.contactId],
        companyIds: [cfg.fraudCase.companyId],
        linkPath: `/service/tickets/${cfg.fraudCase.ticketId}`,
        linkLabel: `Open ${cfg.fraudCase.ticketNumber}`,
      });
      touch(w, at, { companyId: cfg.fraudCase.companyId, contactIds: [cfg.fraudCase.contactId] });
      return;
    }
    case "ca.reviewDashboard": {
      w.ca.dashboardReviewed = true;
      return;
    }
  }
}
