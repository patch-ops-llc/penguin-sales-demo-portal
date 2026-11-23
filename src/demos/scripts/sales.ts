import type { Action } from "@/store/world";
import { flag, has, type DemoScript } from "./types";

export const backOffice: DemoScript = {
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

export const leadCapture: DemoScript = {
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

export const emailToDeal: DemoScript = {
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

export const aiProspecting: DemoScript = {
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
