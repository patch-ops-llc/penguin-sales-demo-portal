import { disabledOptions, isComplete } from "@/demos/guided-quote/rules";
import type { SampleTurn, ToolCall } from "@/lib/agent/types";
import { approvalReasons, quoteTotals } from "@/store/quote-math";
import { ruleOf } from "@/store/slices/helpers";
import type { World } from "@/store/slices/types";
import type { Pack, Quote } from "@/verticals/types";
import { apply, num, str, type ToolContext, type ToolOutcome, type ToolSpec } from "./bridge";
import { COMPLAINT_TOOLS, LOAN_TOOLS } from "./fintech-tools";

/**
 * The agent's view of the simulated portal. Every tool is a thin wrapper over the store: reads
 * project the World, writes return store Actions that the server applies to its copy and the
 * browser applies to its own. Nothing here talks to a network; nothing writes outside the store,
 * so Reset, Back, replay, and the Penguin markers behave exactly as they do for a clicked demo.
 */

export type { ToolContext, ToolOutcome } from "./bridge";

function quoteView(q: Quote, w: World, pack: Pack) {
  const totals = quoteTotals(q);
  const rule = ruleOf(pack, w);
  return {
    id: q.id,
    number: q.number,
    title: q.title,
    status: q.status,
    dealId: q.dealId,
    discountPct: q.discountPct,
    subtotal: totals.subtotal,
    total: totals.total,
    marginPct: Math.round(totals.marginPct * 10) / 10,
    maxLeadDays: totals.maxLead,
    needsApproval: approvalReasons(q, rule),
    lineItems: q.lineItems.map((l) => ({ sku: l.sku, name: l.name, qty: l.qty, unitPrice: l.unitPrice, leadDays: l.leadDays })),
  };
}

function guidedQuoteState(w: World, pack: Pack) {
  const config = pack.demos.guidedQuote;
  return {
    selections: w.gq.sel,
    quantity: w.gq.quantity,
    needBy: w.gq.needBy,
    complete: isComplete(config, w.gq.sel, w.gq.quantity, w.gq.needBy),
    generatedLines: w.gq.lines.map((l) => ({ sku: l.sku, name: l.name, qty: l.qty, unitPrice: l.unitPrice, leadDays: l.leadDays })),
    quoteId: w.gq.quoteId,
    fields: config.fields.map((f) => {
      const disabled = disabledOptions(config, w.gq.sel, f.id);
      return {
        id: f.id,
        label: f.label,
        help: f.help,
        options: f.options.map((o) => ({ id: o.id, label: o.label, hint: o.hint, ...(disabled[o.id] ? { unavailable: disabled[o.id] } : {}) })),
      };
    }),
    quantityOptions: config.quantity.options,
    needByOptions: config.needBy.options.map((o) => ({ id: o.id, label: o.label, days: o.days })),
  };
}

const guidedQuote = (w: World) => (w.gq.quoteId ? w.quotes.find((q) => q.id === w.gq.quoteId) ?? null : null);

const GUIDED_QUOTE_TOOLS: ToolSpec[] = [
  {
    name: "get_deal",
    run: (_args, { w, pack }) => {
      const config = pack.demos.guidedQuote;
      const deal = w.deals.find((d) => d.id === config.dealId);
      if (!deal) return { actions: [], result: null, error: "No deal is configured for this run." };
      const company = w.companies.find((c) => c.id === deal.companyId);
      const contacts = w.contacts.filter((c) => deal.contactIds.includes(c.id));
      const activities = w.activities
        .filter((a) => a.dealIds?.includes(deal.id))
        .slice(0, 5)
        .map((a) => ({ at: a.at, type: a.type, title: a.title, body: a.body }));
      return {
        actions: [],
        result: {
          id: deal.id,
          name: deal.name,
          stage: pack.stages.find((s) => s.id === deal.stage)?.label ?? deal.stage,
          amount: deal.amount,
          closeDate: deal.closeDate,
          company: company ? { id: company.id, name: company.name, industry: company.industry, city: company.city } : null,
          contacts: contacts.map((c) => ({ id: c.id, name: `${c.firstName} ${c.lastName}`, title: c.title, email: c.email })),
          primaryContactId: config.contactId,
          quotes: w.quotes.filter((q) => q.dealId === deal.id).map((q) => ({ id: q.id, number: q.number, status: q.status })),
          recentActivity: activities,
        },
      };
    },
  },
  {
    name: "get_guided_quote_state",
    run: (_args, { w, pack }) => ({ actions: [], result: guidedQuoteState(w, pack) }),
  },
  {
    name: "list_products",
    run: (args, { pack }) => {
      const query = str(args.query).toLowerCase();
      const products = pack.products
        .filter((p) => !query || p.sku.toLowerCase().includes(query) || p.name.toLowerCase().includes(query))
        .slice(0, 40)
        .map((p) => ({ sku: p.sku, name: p.name, family: p.family, listPrice: p.price, unitCost: p.cost, leadDays: p.leadDays, onHand: p.onHand }));
      return { actions: [], result: products };
    },
  },
  {
    name: "guided_quote_select",
    run: (args, { w, pack }) => {
      const config = pack.demos.guidedQuote;
      const field = config.fields.find((f) => f.id === str(args.field));
      if (!field) return { actions: [], result: null, error: `Unknown field "${str(args.field)}". Fields: ${config.fields.map((f) => f.id).join(", ")}.` };
      const option = field.options.find((o) => o.id === str(args.option));
      if (!option) return { actions: [], result: null, error: `Unknown option "${str(args.option)}" for ${field.id}. Options: ${field.options.map((o) => o.id).join(", ")}.` };
      const blocked = disabledOptions(config, w.gq.sel, field.id)[option.id];
      if (blocked) return { actions: [], result: null, error: `${option.label} is unavailable with the current answers: ${blocked}` };
      return apply([{ t: "gq.select", field: field.id, value: option.id }], w, pack, () => ({ selected: { field: field.id, option: option.id, label: option.label }, state: guidedQuoteState(w, pack) }));
    },
  },
  {
    name: "guided_quote_set_quantity",
    run: (args, { w, pack }) => {
      const config = pack.demos.guidedQuote;
      const quantity = num(args.quantity);
      if (quantity === null || !config.quantity.options.includes(quantity)) {
        return { actions: [], result: null, error: `Quantity must be one of ${config.quantity.options.join(", ")}.` };
      }
      return apply([{ t: "gq.quantity", value: quantity }], w, pack, () => ({ quantity, state: guidedQuoteState(w, pack) }));
    },
  },
  {
    name: "guided_quote_set_need_by",
    run: (args, { w, pack }) => {
      const config = pack.demos.guidedQuote;
      const option = config.needBy.options.find((o) => o.id === str(args.needBy));
      if (!option) return { actions: [], result: null, error: `Unknown need-by "${str(args.needBy)}". Options: ${config.needBy.options.map((o) => o.id).join(", ")}.` };
      return apply([{ t: "gq.needBy", value: option.id }], w, pack, () => ({ needBy: option.id, label: option.label, days: option.days }));
    },
  },
  {
    name: "guided_quote_generate",
    run: (_args, { w, pack }) => {
      const config = pack.demos.guidedQuote;
      if (!isComplete(config, w.gq.sel, w.gq.quantity, w.gq.needBy)) {
        return { actions: [], result: null, error: "Answer every question, the quantity, and the need-by first." };
      }
      return apply([{ t: "gq.generate" }], w, pack, () => {
        const need = config.needBy.options.find((o) => o.id === w.gq.needBy);
        const maxLead = w.gq.lines.reduce((m, l) => Math.max(m, l.leadDays), 0);
        return {
          lines: w.gq.lines.map((l) => ({ sku: l.sku, name: l.name, qty: l.qty, unitPrice: l.unitPrice, leadDays: l.leadDays })),
          subtotal: w.gq.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0),
          maxLeadDays: maxLead,
          needByDays: need?.days ?? null,
          leadTimeOk: need ? maxLead <= need.days : null,
          notes: config.notes.filter((n) => Object.entries(n.when).every(([f, opts]) => opts.includes(w.gq.sel[f]))).map((n) => n.text),
        };
      });
    },
  },
  {
    name: "create_quote",
    run: (_args, { w, pack, now }) => {
      if (w.gq.quoteId) return { actions: [], result: null, error: `A quote already exists for this run (${w.gq.quoteId}).` };
      if (w.gq.lines.length === 0) return { actions: [], result: null, error: "Generate the lines first." };
      return apply([{ t: "gq.createQuote", at: now }], w, pack, () => {
        const q = guidedQuote(w);
        return q ? quoteView(q, w, pack) : null;
      });
    },
  },
  {
    name: "get_quote",
    run: (_args, { w, pack }) => {
      const q = guidedQuote(w);
      return q ? { actions: [], result: quoteView(q, w, pack) } : { actions: [], result: null, error: "No quote has been created in this run yet." };
    },
  },
  {
    name: "apply_discount",
    run: (args, { w, pack }) => {
      const q = guidedQuote(w);
      if (!q) return { actions: [], result: null, error: "Create the quote first." };
      const pct = num(args.percent);
      if (pct === null || pct < 0 || pct > 100) return { actions: [], result: null, error: "percent must be between 0 and 100." };
      if (q.status === "Sent" || q.status === "Accepted") return { actions: [], result: null, error: `The quote is already ${q.status.toLowerCase()}.` };
      return apply([{ t: "quote.discount", id: q.id, pct }], w, pack, () => quoteView(guidedQuote(w)!, w, pack));
    },
  },
  {
    name: "request_approval",
    run: (args, { w, pack, now }) => {
      const q = guidedQuote(w);
      if (!q) return { actions: [], result: null, error: "Create the quote first." };
      if (approvalReasons(q, ruleOf(pack, w)).length === 0) return { actions: [], result: null, error: "This quote does not need approval. It can be sent." };
      const note = str(args.note) || undefined;
      return apply([{ t: "quote.requestApproval", id: q.id, at: now, ...(note ? { note } : {}) }], w, pack, () => quoteView(guidedQuote(w)!, w, pack));
    },
  },
  {
    name: "send_quote",
    confirm: true,
    run: (_args, { w, pack, now }) => {
      const q = guidedQuote(w);
      if (!q) return { actions: [], result: null, error: "Create the quote first." };
      if (q.status === "Sent" || q.status === "Accepted") return { actions: [], result: null, error: `The quote is already ${q.status.toLowerCase()}.` };
      if (approvalReasons(q, ruleOf(pack, w)).length > 0 && q.status !== "Approved") {
        return { actions: [], result: null, error: "The quote needs approval before it can be sent. Use request_approval." };
      }
      return apply([{ t: "quote.send", id: q.id, at: now }], w, pack, () => quoteView(guidedQuote(w)!, w, pack));
    },
  },
  {
    name: "log_activity",
    run: (args, { w, pack, now }) => {
      const config = pack.demos.guidedQuote;
      const deal = w.deals.find((d) => d.id === config.dealId);
      const kind = str(args.kind);
      const text = str(args.text).slice(0, 600);
      if (!deal) return { actions: [], result: null, error: "No deal is configured for this run." };
      if (kind !== "note" && kind !== "call" && kind !== "meeting") return { actions: [], result: null, error: "kind must be note, call, or meeting." };
      if (!text) return { actions: [], result: null, error: "text is required." };
      return apply([{ t: "log", kind, text, contactIds: [config.contactId], companyIds: [deal.companyId], dealIds: [deal.id], at: now }], w, pack, () => ({ logged: kind, dealId: deal.id }));
    },
  },
];

/** Every tool set the portal knows; each demo allowlists its own subset. Tool names are unique across sets. */
const TOOLS: ToolSpec[] = [...GUIDED_QUOTE_TOOLS, ...COMPLAINT_TOOLS, ...LOAN_TOOLS];

const BY_NAME = new Map(TOOLS.map((t) => [t.name, t]));

/** Every tool name the bridge knows, in declaration order. */
export function toolNames(): string[] {
  return TOOLS.map((t) => t.name);
}

/** Tools the rep must confirm before they run. */
export function confirmTools(): string[] {
  return TOOLS.filter((t) => t.confirm).map((t) => t.name);
}

export function runTool(call: ToolCall, ctx: ToolContext, allow?: readonly string[]): ToolOutcome {
  const tool = BY_NAME.get(call.name);
  if (!tool || (allow && !allow.includes(call.name))) return { actions: [], result: null, error: `Unknown tool "${call.name}".` };
  try {
    return tool.run(call.args ?? {}, ctx);
  } catch (error) {
    return { actions: [], result: null, error: `Tool failed: ${error instanceof Error ? error.message : "unknown error"}` };
  }
}

/**
 * The scripted run the mock provider replays, built from the pack's own scripted choices so it
 * is the same walk the Next button takes. Also the Option C fallback when no provider is live.
 */
export function guidedQuoteSample(pack: Pack): SampleTurn[] {
  const config = pack.demos.guidedQuote;
  const deal = pack.deals.find((d) => d.id === config.dealId);
  const company = pack.companies.find((c) => c.id === deal?.companyId);
  const selections = Object.entries(config.scripted.selections).map(([field, option]) => ({ name: "guided_quote_select", args: { field, option } }));
  return [
    { text: `Let me pull up the deal${company ? ` with ${company.name}` : ""} and the discovery questions.`, toolCalls: [{ name: "get_deal", args: {} }, { name: "get_guided_quote_state", args: {} }] },
    {
      text: "Answering the discovery questions from what the buyer told us, then running the rate card.",
      toolCalls: [
        ...selections,
        { name: "guided_quote_set_quantity", args: { quantity: config.scripted.quantity } },
        { name: "guided_quote_set_need_by", args: { needBy: config.scripted.needBy } },
        { name: "guided_quote_generate", args: {} },
      ],
    },
    { text: "The lines are priced and the lead time clears the need-by date. Creating the quote on the deal.", toolCalls: [{ name: "create_quote", args: {} }] },
    { text: `The quote is ready on the deal${company ? ` for ${company.name}` : ""}. Say the word and I will send it to the buyer.`, toolCalls: [{ name: "send_quote", args: {} }] },
    { text: "Sent. The deal moved to Quote sent and the timeline shows the quote going out.", toolCalls: [{ name: "log_activity", args: { kind: "note", text: "Quote drafted and sent from the guided-quote agent run." } }] },
  ];
}
