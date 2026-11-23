import { approvalReasons } from "@/store/quote-math";
import { ruleOf, type Action, type World } from "@/store/world";
import type { DemoId } from "@/verticals/catalog";
import type { Pack } from "@/verticals/types";
import { isComplete } from "./guided-quote/rules";

/**
 * One storyboard per demo, written once and shared by every vertical. A vertical's pack supplies
 * the records and rules the steps point at.
 *
 * `done` works out progress from the world, so clicking the real button and pressing Next in the
 * demo bar are the same thing: Next just runs `script`, which performs the step with default choices.
 */
export type StepCtx = { w: World; pack: Pack };

export type Step = {
  id: string;
  title: string;
  /** What the rep clicks, shown in the demo bar. */
  hint: string | ((c: StepCtx) => string);
  /** Full-path-only steps: the short path skips them. */
  optional?: boolean;
  /** The shell path where this step happens. */
  path: (c: StepCtx) => string;
  /** The screen that shows the step's result, when it is not simply where the next step starts. */
  after?: (c: StepCtx) => string;
  done: (c: StepCtx) => boolean;
  script: (c: StepCtx, now: number) => Action[];
};

export type DemoScript = { id: DemoId; steps: Step[] };

const flag = (k: string): Action => ({ t: "flag", k });
const has = (c: StepCtx, k: string) => c.w.flags[k] === true;

const guidedQuote: DemoScript = {
  id: "guided-quote",
  steps: [
    {
      id: "open",
      title: "Open Guided quote on the deal",
      hint: "Click the Guided quote tab",
      path: ({ pack }) => `/deals/${pack.demos.guidedQuote.dealId}`,
      done: (c) => has(c, "gq.opened"),
      script: ({ pack }) => [{ t: "ui", k: `tab.${pack.demos.guidedQuote.dealId}`, v: "guided" }, flag("gq.opened")],
    },
    {
      id: "requirements",
      title: "Pick the requirements",
      hint: "Choose load, stroke, environment, voltage, quantity, and need-by date",
      path: ({ pack }) => `/deals/${pack.demos.guidedQuote.dealId}`,
      done: ({ w, pack }) => isComplete(pack.demos.guidedQuote, w.gq.sel, w.gq.quantity, w.gq.needBy),
      script: ({ pack }) => {
        const { scripted, fields } = pack.demos.guidedQuote;
        return [
          ...fields.map((f): Action => ({ t: "gq.select", field: f.id, value: scripted.selections[f.id] })),
          { t: "gq.quantity", value: scripted.quantity },
          { t: "gq.needBy", value: scripted.needBy },
        ];
      },
    },
    {
      id: "generate",
      title: "Generate line items",
      hint: "Click Generate line items",
      path: ({ pack }) => `/deals/${pack.demos.guidedQuote.dealId}`,
      done: ({ w }) => w.gq.lines.length > 0 || w.gq.quoteId !== null,
      script: () => [{ t: "gq.generate" }],
    },
    {
      id: "create",
      title: "Create the quote",
      hint: "Click Create quote",
      path: ({ pack }) => `/deals/${pack.demos.guidedQuote.dealId}`,
      done: ({ w }) => w.gq.quoteId !== null,
      script: (_c, now) => [{ t: "gq.createQuote", at: now }],
    },
    {
      id: "send",
      title: "Preview and share",
      hint: "Click Preview, then Share",
      path: ({ w }) => `/quotes/${w.gq.quoteId ?? ""}`,
      after: ({ w }) => `/quotes/${w.gq.quoteId ?? ""}`,
      done: ({ w }) => w.quotes.some((q) => q.id === w.gq.quoteId && (q.status === "Sent" || q.status === "Accepted")),
      script: ({ w }, now) => (w.gq.quoteId ? [{ t: "quote.send", id: w.gq.quoteId, at: now }] : []),
    },
    {
      id: "deal",
      title: "See it on the deal",
      hint: "Close the dialog and click Exit. Timeline, amount, and stage are updated on the deal. Optional: View as buyer",
      path: ({ w }) => `/quotes/${w.gq.quoteId ?? ""}`,
      after: ({ pack }) => `/deals/${pack.demos.guidedQuote.dealId}`,
      done: (c) => has(c, "gq.dealSeen"),
      script: ({ pack }) => [{ t: "ui", k: `tab.${pack.demos.guidedQuote.dealId}`, v: "activities" }, flag("gq.dealSeen")],
    },
  ],
};

/** Who the scripted quote's approval request went to, or will go to under the rule in force. */
const requestApprover = ({ w, pack }: StepCtx) => w.quotes.find((q) => q.id === pack.demos.discountApproval.quoteId)?.approval?.approverId ?? ruleOf(pack, w).approverId;

const discountApproval: DemoScript = {
  id: "discount-approval",
  steps: [
    {
      id: "discount",
      title: "Enter a discount over the threshold",
      hint: ({ pack }) => `Line items: click Edit all line items, set Unit discount to ${pack.demos.discountApproval.scriptedDiscountPct}% on each line, then Save`,
      path: ({ pack }) => `/quotes/${pack.demos.discountApproval.quoteId}`,
      done: ({ w, pack }) => {
        const quote = w.quotes.find((q) => q.id === pack.demos.discountApproval.quoteId);
        return Boolean(quote && (quote.approval || quote.status === "Sent" || approvalReasons(quote, ruleOf(pack, w)).length > 0));
      },
      script: ({ w, pack }) => {
        const { quoteId, scriptedDiscountPct, scriptedSkus } = pack.demos.discountApproval;
        const quote = w.quotes.find((q) => q.id === quoteId);
        if (!scriptedSkus || !quote) return [{ t: "quote.discount", id: quoteId, pct: scriptedDiscountPct }];
        return [{ t: "quote.setLines", id: quoteId, lines: quote.lineItems.map((l) => ({ ...l, discountPct: scriptedSkus.includes(l.sku) ? scriptedDiscountPct : 0 })) }];
      },
    },
    {
      id: "request",
      title: "Request approval",
      hint: "Click Request approval, add a note for the approver, and send it",
      path: ({ pack }) => `/quotes/${pack.demos.discountApproval.quoteId}`,
      done: ({ w, pack }) => w.quotes.some((q) => q.id === pack.demos.discountApproval.quoteId && (q.approval || q.status === "Sent")),
      script: ({ pack }, now) => [{ t: "quote.requestApproval", id: pack.demos.discountApproval.quoteId, at: now }],
    },
    {
      id: "view-as-approver",
      title: "Switch to the approver",
      hint: (c) => `Demo bar: View as, ${c.pack.personas.find((p) => p.id === requestApprover(c))?.viewAs ?? "the approver"}. The bell shows one new item`,
      path: ({ pack }) => `/quotes/${pack.demos.discountApproval.quoteId}`,
      after: () => "/quotes",
      done: (c) => has(c, "da.asApprover"),
      script: (c) => [{ t: "persona", id: requestApprover(c) }],
    },
    {
      id: "open-request",
      title: "Open the approval request",
      hint: "Open the bell and click Go to quote",
      path: () => "/quotes",
      after: ({ pack }) => `/quotes/${pack.demos.discountApproval.quoteId}`,
      done: (c) => has(c, "da.requestOpened"),
      script: () => [{ t: "ui", k: "bell", v: "closed" }, flag("da.requestOpened")],
    },
    {
      id: "approve",
      title: "Approve in one click",
      hint: "Approvals panel: discount, margin, and the floor-price check are on the request. Click Approve",
      path: ({ pack }) => `/quotes/${pack.demos.discountApproval.quoteId}`,
      after: ({ pack }) => `/quotes/${pack.demos.discountApproval.quoteId}`,
      done: ({ w, pack }) => w.quotes.some((q) => q.id === pack.demos.discountApproval.quoteId && (q.approval?.status === "approved" || q.status === "Sent")),
      script: ({ pack }, now) => [{ t: "quote.approve", id: pack.demos.discountApproval.quoteId, at: now }],
    },
    {
      id: "send",
      title: "Back as the rep, share the quote",
      hint: "Demo bar: View as, Rep. Then click Share",
      path: ({ pack }) => `/quotes/${pack.demos.discountApproval.quoteId}`,
      done: ({ w, pack }) => w.quotes.some((q) => q.id === pack.demos.discountApproval.quoteId && (q.status === "Sent" || q.status === "Accepted")),
      script: ({ pack }, now) => [
        { t: "persona", id: pack.defaultPersonaId },
        { t: "quote.send", id: pack.demos.discountApproval.quoteId, at: now },
      ],
    },
  ],
};

const backOffice: DemoScript = {
  id: "back-office",
  steps: [
    {
      id: "company",
      title: "Open the company",
      hint: ({ w, pack }) => `Companies: click ${w.companies.find((c) => c.id === pack.demos.backOffice.companyId)?.name ?? "the company"}. Synced ERP fields and the ERP card are on the record`,
      path: () => "/companies",
      after: ({ pack }) => `/companies/${pack.demos.backOffice.companyId}`,
      done: (c) => has(c, "bo.viewed"),
      script: () => [flag("bo.viewed")],
    },
    {
      id: "orders",
      title: "Expand an order",
      hint: "ERP card, Orders tab: click an order row",
      path: ({ pack }) => `/companies/${pack.demos.backOffice.companyId}`,
      done: (c) => has(c, "bo.order"),
      script: ({ pack }) => [{ t: "ui", k: "erp.tab", v: "orders" }, { t: "ui", k: "erp.order", v: pack.demos.backOffice.scriptedOrderId }, flag("bo.order")],
    },
    {
      id: "balance",
      title: "Check the balance",
      hint: "ERP card: click the Balance tab",
      path: ({ pack }) => `/companies/${pack.demos.backOffice.companyId}`,
      done: (c) => has(c, "bo.balance"),
      script: () => [{ t: "ui", k: "erp.tab", v: "balance" }, flag("bo.balance")],
    },
    {
      id: "stock",
      title: "Pick stock and add to a quote",
      hint: "Stock tab: tick three items, then Add to quote",
      path: ({ pack }) => `/companies/${pack.demos.backOffice.companyId}`,
      done: ({ w }) => w.bo.quoteId !== null,
      script: ({ w, pack }, now) => [
        { t: "ui", k: "erp.tab", v: "stock" },
        ...(w.bo.picked.length > 0 ? [] : pack.demos.backOffice.scriptedSkus.map((sku): Action => ({ t: "bo.pick", sku }))),
        { t: "bo.addToQuote", at: now },
      ],
    },
    {
      id: "send",
      title: "Preview and share",
      hint: "Quote is prefilled at the contract price. Click Preview, then Share",
      path: ({ w }) => `/quotes/${w.bo.quoteId ?? ""}`,
      done: ({ w }) => w.quotes.some((q) => q.id === w.bo.quoteId && (q.status === "Sent" || q.status === "Accepted")),
      script: ({ w }, now) => (w.bo.quoteId ? [{ t: "quote.send", id: w.bo.quoteId, at: now }] : []),
    },
  ],
};

const leadCapture: DemoScript = {
  id: "lead-capture",
  steps: [
    {
      id: "form",
      title: "Submit the web form",
      hint: "Pick one of the three leads, then Submit",
      path: ({ pack }) => `/site/${pack.demos.leadCapture.site.url.split("/").pop() || "form"}`,
      done: ({ w }) => w.lc !== null,
      script: ({ w, pack }, now) => [{ t: "lc.submit", presetId: w.ui["lc.preset"] ?? pack.demos.leadCapture.scriptedPresetId, at: now }],
    },
    {
      id: "contact",
      title: "Open the new contact",
      hint: "Contacts: click the new row at the top",
      path: () => "/contacts",
      after: ({ w }) => `/contacts/${w.lc?.contactId ?? ""}`,
      done: (c) => has(c, "lc.contact"),
      script: () => [flag("lc.contact")],
    },
    {
      id: "company",
      title: "See the enriched company",
      hint: "Click the associated company",
      optional: true,
      path: ({ w }) => `/contacts/${w.lc?.contactId ?? ""}`,
      after: ({ w }) => `/companies/${w.lc?.companyId ?? ""}`,
      done: (c) => has(c, "lc.company"),
      script: () => [flag("lc.company")],
    },
    {
      id: "score",
      title: "Why this score",
      hint: "On the contact: open the Why this score card",
      optional: true,
      path: ({ w }) => `/contacts/${w.lc?.contactId ?? ""}`,
      after: ({ w }) => `/contacts/${w.lc?.contactId ?? ""}`,
      done: (c) => has(c, "lc.score"),
      script: () => [{ t: "ui", k: "score.open", v: "yes" }, flag("lc.score")],
    },
    {
      id: "workflow",
      title: "See the routing",
      hint: "On the contact timeline: click View in workflow",
      path: ({ w }) => `/contacts/${w.lc?.contactId ?? ""}`,
      after: ({ pack }) => `/workflows/${pack.demos.leadCapture.workflowId}`,
      done: (c) => has(c, "lc.workflow"),
      script: () => [flag("lc.workflow")],
    },
    {
      id: "rep",
      title: "View as the assigned rep",
      hint: ({ w, pack }) => {
        const owner = pack.personas.find((p) => p.id === w.lc?.ownerId);
        return owner ? `Demo bar: View as, ${owner.viewAs}. Then open the bell` : "No rep is assigned: this lead went to nurture. Open the bell to finish";
      },
      path: ({ pack }) => `/workflows/${pack.demos.leadCapture.workflowId}`,
      after: () => "/tasks",
      done: (c) => has(c, "lc.bell"),
      script: ({ w }) => [...(w.lc?.ownerId ? [{ t: "persona", id: w.lc.ownerId } as Action] : []), { t: "ui", k: "bell", v: "open" }, flag("lc.bell")],
    },
  ],
};

const emailToDeal: DemoScript = {
  id: "email-to-deal",
  steps: [
    {
      id: "open",
      title: "Open the new email",
      hint: "Inbox: click one of the three new emails",
      path: () => "/inbox",
      done: (c) => has(c, "ed.opened"),
      script: ({ pack }) => [{ t: "ed.open", threadId: pack.demos.emailToDeal.scriptedThreadId }, flag("ed.opened")],
    },
    {
      id: "review",
      title: "Review what was parsed",
      hint: "Click Review on the parsed request card beside the email",
      path: () => "/inbox",
      done: (c) => has(c, "ed.reviewed"),
      script: () => [flag("ed.reviewed")],
    },
    {
      id: "create",
      title: "Confirm the flagged part and create the deal",
      hint: "Pick the suggested match for the flagged line, then Create deal",
      path: () => "/inbox",
      after: () => "/inbox",
      done: ({ w }) => Object.keys(w.ed.deals).length > 0,
      script: ({ w, pack }, now) => {
        const threadId = w.ui["inbox.thread"] ?? pack.demos.emailToDeal.scriptedThreadId;
        const thread = w.threads.find((t) => t.id === threadId);
        const matches = (thread?.parsed?.lines ?? [])
          .filter((l) => l.sku === null && !w.ed.matches[`${threadId}:${l.id}`] && l.suggestions?.[0])
          .map((l): Action => ({ t: "ed.match", threadId, lineId: l.id, sku: l.suggestions![0].sku }));
        return [...matches, { t: "ed.createDeal", threadId, at: now }];
      },
    },
    {
      id: "deal",
      title: "See the deal",
      hint: "Click View deal. Line items, amount, and close date are filled. The email is on the timeline",
      path: () => "/inbox",
      after: ({ w }) => `/deals/${Object.values(w.ed.deals)[0] ?? ""}`,
      done: (c) => has(c, "ed.dealSeen"),
      script: () => [flag("ed.dealSeen")],
    },
    {
      id: "quote",
      title: "Generate a quote",
      hint: "Optional: click Create quote on the deal",
      optional: true,
      path: ({ w }) => `/deals/${Object.values(w.ed.deals)[0] ?? ""}`,
      after: ({ w }) => `/quotes/${Object.values(w.ed.quotes)[0] ?? ""}`,
      done: ({ w }) => Object.keys(w.ed.quotes).length > 0,
      script: ({ w }, now) => {
        const threadId = Object.keys(w.ed.deals)[0];
        return threadId ? [{ t: "ed.createQuote", threadId, at: now }] : [];
      },
    },
  ],
};

const aiProspecting: DemoScript = {
  id: "ai-prospecting",
  steps: [
    {
      id: "signal",
      title: "Open the flagged account",
      hint: "Prospecting: click the account at the top of the list",
      path: () => "/prospecting",
      done: (c) => has(c, "ap.signal"),
      script: ({ pack }) => [{ t: "ui", k: "prospecting.account", v: pack.demos.aiProspecting.companyId }, flag("ap.signal")],
    },
    {
      id: "why-now",
      title: "Why now",
      hint: "Click Why now",
      path: () => "/prospecting",
      done: (c) => has(c, "ap.whyNow"),
      script: () => [{ t: "ui", k: "prospecting.tab", v: "why" }, flag("ap.whyNow")],
    },
    {
      id: "group",
      title: "See the buying group",
      hint: "Click Buying group",
      path: () => "/prospecting",
      done: (c) => has(c, "ap.group"),
      script: () => [{ t: "ui", k: "prospecting.tab", v: "group" }, flag("ap.group")],
    },
    {
      id: "draft",
      title: "Draft outreach",
      hint: "Click Draft outreach. Regenerate and edit both work",
      path: () => "/prospecting",
      done: ({ w }) => w.ap.drafted,
      script: () => [{ t: "ui", k: "prospecting.tab", v: "outreach" }, { t: "ap.draft" }],
    },
    {
      id: "send",
      title: "Approve and send",
      hint: "Click Approve and send",
      path: () => "/prospecting",
      done: ({ w }) => w.ap.sent,
      script: (_c, now) => [{ t: "ap.send", at: now }],
    },
  ],
};

const customerAgent: DemoScript = {
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
      path: ({ pack }) => `/contacts/${pack.demos.customerAgent?.voiceCase.contactId ?? "ct-halle"}`,
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
      path: ({ pack }) => `/service/tickets/${pack.demos.customerAgent?.fraudCase.ticketId ?? "tkt-fraud-4091"}`,
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

export const SCRIPTS: Record<DemoId, DemoScript> = {
  "guided-quote": guidedQuote,
  "discount-approval": discountApproval,
  "back-office": backOffice,
  "lead-capture": leadCapture,
  "email-to-deal": emailToDeal,
  "ai-prospecting": aiProspecting,
  "customer-agent": customerAgent,
};

/** Index of the step the rep is on: one past the furthest finished step. Equals steps.length when complete. */
export function currentStep(script: DemoScript, ctx: StepCtx): number {
  for (let i = script.steps.length - 1; i >= 0; i--) {
    if (script.steps[i].done(ctx)) return i + 1;
  }
  return 0;
}

/** Steps a rep must finish for the demo to count as complete. Trailing optional steps do not hold it open. */
export function requiredSteps(script: DemoScript): number {
  for (let i = script.steps.length - 1; i >= 0; i--) {
    if (!script.steps[i].optional) return i + 1;
  }
  return script.steps.length;
}

export function hintOf(step: Step, ctx: StepCtx): string {
  return typeof step.hint === "function" ? step.hint(ctx) : step.hint;
}

/** What the demo bar shows for a step: the shared storyboard's wording, unless the vertical's pack words the step its own way. */
export function stepText(demo: DemoId, step: Step, ctx: StepCtx): { title: string; hint: string } {
  const note = ctx.pack.stepNotes?.[demo]?.[step.id];
  return { title: note?.title ?? step.title, hint: note?.hint ?? hintOf(step, ctx) };
}
