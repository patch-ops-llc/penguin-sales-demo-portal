import { approvalReasons } from "@/store/quote-math";
import { ruleOf, type Action } from "@/store/world";
import { isComplete } from "../guided-quote/rules";
import { flag, has, type DemoScript, type StepCtx } from "./types";

export const guidedQuote: DemoScript = {
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

export const discountApproval: DemoScript = {
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
