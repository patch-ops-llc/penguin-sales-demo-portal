import { isServiceDeskConfig, type Pack } from "@/verticals/types";
import type { DemoScript } from "./types";

export const customerAgent: DemoScript = {
  id: "customer-agent",
  steps: [
    {
      id: "chat-app",
      title: "Customer chats in the fintech app",
      hint: "Fernhill app: send Sabine Keller's transfer question, then open HubSpot",
      path: () => "/service-app/chat",
      done: ({ w }) => w.ca.chatSent,
      script: (_c, now) => [{ t: "ca.chatSend", at: now }],
    },
    {
      id: "chat-match",
      title: "Agent matches contact and transfer",
      hint: "Help Desk: click Match contact & pull transfer to pull Sabine's HubSpot record and transfer",
      path: () => "/service",
      after: () => "/service",
      done: ({ w }) => w.ca.chatMatched,
      script: () => [{ t: "ca.chatMatch" }],
    },
    {
      id: "chat-verify",
      title: "Agent runs a security check",
      hint: "Click Run security check to verify identity before sharing account details",
      path: () => "/service",
      after: () => "/service",
      done: ({ w }) => w.ca.chatVerified,
      script: () => [{ t: "ca.chatVerify" }],
    },
    {
      id: "chat-resolve",
      title: "Agent explains timing and resolves",
      hint: "Click Send answer & resolve to explain ACH timing and close the chat",
      path: () => "/service",
      done: ({ w }) => w.ca.chatResolved,
      script: (_c, now) => [{ t: "ca.chatResolve", at: now }],
    },
    {
      id: "email-send",
      title: "Second customer emails card dispute",
      hint: "Email client: send Ansel Quenby's unrecognized card charge email to support",
      path: () => "/service-app/email",
      done: ({ w }) => w.ca.emailSent,
      script: (_c, now) => [{ t: "ca.emailSend", at: now }],
    },
    {
      id: "email-ticket",
      title: "Agent replies and opens a ticket",
      hint: "Help Desk: click Reply & open ticket to send dispute steps and create TKT-4089",
      path: () => "/service",
      done: ({ w }) => w.ca.emailReplied,
      script: (_c, now) => [{ t: "ca.emailReply", at: now }],
    },
    {
      id: "voice-call",
      title: "Third customer calls about lock",
      hint: "Phone screen: connect Halle Voss's call about her locked account",
      path: () => "/service-app/phone",
      done: ({ w }) => w.ca.voiceCalled,
      script: (_c, now) => [{ t: "ca.voiceCall", at: now }],
    },
    {
      id: "voice-unlock",
      title: "Voice agent verifies and unlocks",
      hint: "Help Desk: click Verify & unlock account to guide Halle through unlock steps",
      path: () => "/service",
      done: ({ w }) => w.ca.voiceUnlocked,
      script: (_c, now) => [{ t: "ca.voiceUnlock", at: now }],
    },
    {
      id: "voice-timeline",
      title: "Call logs on the contact timeline",
      hint: "Contact timeline: review the full call transcript logged on Halle Voss",
      path: ({ pack }) => {
        const cfg = pack.demos.customerAgent;
        const cid = cfg && !isServiceDeskConfig(cfg) ? cfg.voiceCase.contactId : "ct-halle";
        return `/contacts/${cid}`;
      },
      done: ({ w }) => w.ca.timelineReviewed,
      script: () => [{ t: "ca.reviewTimeline" }],
    },
    {
      id: "fraud-handoff",
      title: "Agent hands fraud case to a human",
      hint: "Help Desk: click Hand over to human rep to escalate Patrice Dunmore with a summary",
      path: () => "/service",
      done: ({ w }) => w.ca.fraudHandedOff,
      script: (_c, now) => [{ t: "ca.fraudHandoff", at: now }],
    },
    {
      id: "human-ticket",
      title: "Rep opens unified ticket history",
      hint: "Ticket TKT-4091: review Breeze summary and unified chat, email, and voice history",
      path: ({ pack }) => {
        const cfg = pack.demos.customerAgent;
        const tid = cfg && !isServiceDeskConfig(cfg) ? cfg.fraudCase.ticketId : "tkt-fraud-4091";
        return `/service/tickets/${tid}`;
      },
      done: ({ w }) => w.ca.ticketReviewed,
      script: () => [{ t: "ca.reviewTicket" }],
    },
    {
      id: "service-dashboard",
      title: "Review Service Hub dashboard",
      hint: "Service Dashboard: inspect channel volume, 74.6% resolution rate, handoffs, and credits",
      path: () => "/service-dashboard",
      after: () => "/service-dashboard",
      done: ({ w }) => w.ca.dashboardReviewed,
      script: () => [{ t: "ca.reviewDashboard" }],
    },
  ],
};

export const clinicCustomerAgent: DemoScript = {
  id: "customer-agent",
  steps: [
    {
      id: "hc-chat-app",
      title: "Patient chats after hours",
      hint: "Clinic portal: send Nora Castell's insurance, parking & visit-prep question, then open HubSpot",
      path: () => "/service-app/chat",
      done: ({ w }) => w.ca.chatSent,
      script: (_c, now) => [{ t: "ca.chatSend", at: now }],
    },
    {
      id: "hc-kb-answer",
      title: "Agent answers from clinic KB",
      hint: "Help Desk: click Send clinic KB answer to resolve logistics from the clinic knowledge base",
      path: () => "/service",
      after: () => "/service",
      done: ({ w }) => w.ca.chatResolved,
      script: (_c, now) => [{ t: "ca.kbAnswer", at: now }],
    },
    {
      id: "hc-schedule-link",
      title: "Agent sends scheduling link",
      hint: "Help Desk: click Send scheduling link to book Nora's morning orthopedic slot via EHR sync",
      path: () => "/service",
      done: ({ w }) => w.ca.appointmentBooked,
      script: (_c, now) => [{ t: "ca.bookAppointment", at: now }],
    },
    {
      id: "hc-timeline",
      title: "Appointment logs on timeline",
      hint: "Contact timeline: review the confirmed clinic appointment logged on Nora Castell",
      path: ({ pack }) => `/contacts/${pack.demos.customerAgent?.chatCase.contactId ?? "ct-nora"}`,
      done: ({ w }) => w.ca.timelineReviewed,
      script: () => [{ t: "ca.reviewTimeline" }],
    },
    {
      id: "hc-clinical-chat",
      title: "Patient asks a clinical question",
      hint: "Clinic chat: send Owen Gallagher's post-PT symptom & medication question, then open HubSpot",
      path: () => "/service-app/escalation",
      done: ({ w }) => w.ca.escalationChatSent,
      script: (_c, now) => [{ t: "ca.escalationSend", at: now }],
    },
    {
      id: "hc-clinical-handoff",
      title: "Guardrail hands off to staff",
      hint: "Help Desk: enforce No Medical Advice guardrail and hand off to clinic staff with AI summary",
      path: () => "/service",
      done: ({ w }) => w.ca.fraudHandedOff,
      script: (_c, now) => [{ t: "ca.fraudHandoff", at: now }],
    },
    {
      id: "hc-staff-ticket",
      title: "Clinic staff resolves ticket",
      hint: "Ticket TKT-HC-204: review AI summary & HIPAA guardrail log, send staff callback resolution",
      path: ({ pack }) => {
        const cfg = pack.demos.customerAgent;
        const tid = cfg && isServiceDeskConfig(cfg) ? cfg.escalationCase.ticketId : "tkt-hc-204";
        return `/service/tickets/${tid}`;
      },
      done: ({ w }) => w.ca.ticketReviewed,
      script: ({ pack }, now) => {
        const cfg = pack.demos.customerAgent;
        const reply = cfg && isServiceDeskConfig(cfg) ? cfg.escalationCase.defaultRepReply : "";
        return [{ t: "ca.repReply", text: reply, at: now }, { t: "ca.reviewTicket" }];
      },
    },
    {
      id: "hc-dashboard",
      title: "Review clinic Service Analytics",
      hint: "Service Analytics: inspect resolutions, after-hours coverage, handoffs, and Credits-to-Outcome ROI",
      path: () => "/service-dashboard",
      after: () => "/service-dashboard",
      done: ({ w }) => w.ca.dashboardReviewed,
      script: () => [{ t: "ca.reviewDashboard" }],
    },
  ],
};

export const itCustomerAgent: DemoScript = {
  id: "customer-agent",
  steps: [
    {
      id: "it-chat-app",
      title: "User chats for password reset",
      hint: "IT portal: send Joel Banerjee's M365 password-reset & ticket-status chat, then open HubSpot",
      path: () => "/service-app/chat",
      done: ({ w }) => w.ca.chatSent,
      script: (_c, now) => [{ t: "ca.chatSend", at: now }],
    },
    {
      id: "it-chat-resolve",
      title: "Agent resolves from IT KB & PSA",
      hint: "Help Desk: resolve routine password reset from IT KB with live PSA SLA & ticket lookup",
      path: () => "/service",
      done: ({ w }) => w.ca.chatResolved,
      script: (_c, now) => [{ t: "ca.kbAnswer", at: now }],
    },
    {
      id: "it-email-send",
      title: "Client emails ticket status check",
      hint: "Email client: send Rashid Mahmoud's REQ-7812 status & MFA guide email to servicedesk",
      path: () => "/service-app/email",
      done: ({ w }) => w.ca.emailSent,
      script: (_c, now) => [{ t: "ca.emailSend", at: now }],
    },
    {
      id: "it-email-resolve",
      title: "Agent replies via IT KB & PSA",
      hint: "Help Desk: click Reply & resolve email to answer ticket status and send MFA runbook",
      path: () => "/service",
      done: ({ w }) => w.ca.emailReplied,
      script: (_c, now) => [{ t: "ca.emailReply", at: now }],
    },
    {
      id: "it-vpn-chat",
      title: "VPN outage arrives in chat",
      hint: "IT portal: send Vivian Achterberg's multi-site IPsec VPN & firewall outage report",
      path: () => "/service-app/escalation",
      done: ({ w }) => w.ca.escalationChatSent,
      script: (_c, now) => [{ t: "ca.escalationSend", at: now }],
    },
    {
      id: "it-l2-handoff",
      title: "Agent escalates to L2 engineer",
      hint: "Help Desk: escalate VPN/firewall outage to L2 engineer Soledad Ruiz with AI summary",
      path: () => "/service",
      done: ({ w }) => w.ca.fraudHandedOff,
      script: (_c, now) => [{ t: "ca.fraudHandoff", at: now }],
    },
    {
      id: "it-l2-ticket",
      title: "Engineer resolves & notifies user",
      hint: "Ticket TKT-IT-8904: review AI summary & PSA diagnostics, resolve and notify Vivian",
      path: ({ pack }) => {
        const cfg = pack.demos.customerAgent;
        const tid = cfg && isServiceDeskConfig(cfg) ? cfg.escalationCase.ticketId : "tkt-it-8904";
        return `/service/tickets/${tid}`;
      },
      done: ({ w }) => w.ca.ticketReviewed,
      script: ({ pack }, now) => {
        const cfg = pack.demos.customerAgent;
        const reply = cfg && isServiceDeskConfig(cfg) ? cfg.escalationCase.defaultRepReply : "";
        return [{ t: "ca.repReply", text: reply, at: now }, { t: "ca.reviewTicket" }];
      },
    },
    {
      id: "it-dashboard",
      title: "Review IT Service Desk analytics",
      hint: "Service Dashboard: inspect tickets by channel, auto-resolution rate, FRT, and Credits ROI",
      path: () => "/service-dashboard",
      after: () => "/service-dashboard",
      done: ({ w }) => w.ca.dashboardReviewed,
      script: () => [{ t: "ca.reviewDashboard" }],
    },
  ],
};

export function customerAgentScriptFor(pack: Pack): DemoScript {
  const cfg = pack.demos.customerAgent;
  if (cfg && isServiceDeskConfig(cfg)) {
    return cfg.mode === "clinic-front-desk" ? clinicCustomerAgent : itCustomerAgent;
  }
  return customerAgent;
}
