import "server-only";
import type { ToolDef } from "./types";
import { toolSpecs } from "@/demos/agent/tools";

/**
 * What the model reads about each tool: the description and the JSON Schema for its arguments.
 * Server-only. The browser carries the handlers (it runs them for the scripted transcript and the
 * tool bridge) but never needs this text, which keeps it out of the demo shell's JavaScript budget.
 */
const obj = (properties: Record<string, unknown>, required: string[] = []): Record<string, unknown> => ({ type: "object", properties, ...(required.length ? { required } : {}), additionalProperties: false });
const S = (description?: string) => ({ type: "string", ...(description ? { description } : {}) });
const N = (description?: string) => ({ type: "number", ...(description ? { description } : {}) });
const A = (description?: string) => ({ type: "array", items: { type: "string" }, ...(description ? { description } : {}) });

const TOOL_DOCS: Record<string, Pick<ToolDef, "description" | "parameters">> = {
  get_deal: {
    description: "Read the deal this run is about: company, contacts, stage, amount, and recent activity. Call this first.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  get_guided_quote_state: {
    description: "Read the Guided quote card: the discovery questions with their option ids, which options the current answers rule out, the quantity and need-by choices, what has been answered so far, and any generated lines.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  list_products: {
    description: "List the products in the catalog with SKU, list price, unit cost, and lead time.",
    parameters: { type: "object", properties: { query: { type: "string", description: "Optional text to match against SKU or name." } }, additionalProperties: false },
  },
  guided_quote_select: {
    description: "Answer one discovery question on the Guided quote card by field id and option id (from get_guided_quote_state). Answering clears any generated lines.",
    parameters: {
        type: "object",
        properties: { field: { type: "string", description: "Field id." }, option: { type: "string", description: "Option id for that field." } },
        required: ["field", "option"],
        additionalProperties: false,
      },
  },
  guided_quote_set_quantity: {
    description: "Set the quantity on the Guided quote card. Must be one of the quantity options.",
    parameters: { type: "object", properties: { quantity: { type: "integer" } }, required: ["quantity"], additionalProperties: false },
  },
  guided_quote_set_need_by: {
    description: "Set when the buyer needs the goods, by need-by option id.",
    parameters: { type: "object", properties: { needBy: { type: "string", description: "Need-by option id." } }, required: ["needBy"], additionalProperties: false },
  },
  guided_quote_generate: {
    description: "Run the rate card: turn the completed answers into line items with prices and lead times. Requires every question, the quantity, and the need-by to be answered.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  create_quote: {
    description: "Create the HubSpot quote on the deal from the generated lines. Call once, after guided_quote_generate.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  get_quote: {
    description: "Read the quote created in this run: status, totals, margin, and whether it needs approval before it can be sent.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  apply_discount: {
    description: "Set the quote-level discount in percent (0 to 100). A discount over the approval rule's limit, or one that takes a line under its floor price, will need approval.",
    parameters: { type: "object", properties: { percent: { type: "number" } }, required: ["percent"], additionalProperties: false },
  },
  request_approval: {
    description: "Send the quote to the approver named by the approval rule. Only possible when get_quote reports needsApproval reasons.",
    parameters: { type: "object", properties: { note: { type: "string", description: "A short note for the approver." } }, additionalProperties: false },
  },
  send_quote: {
    description: "Publish the quote and send it to the buyer. The rep confirms this step before it runs.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  log_activity: {
    description: "Log a note, call, or meeting on the deal's timeline.",
    parameters: {
        type: "object",
        properties: { kind: { type: "string", enum: ["note", "call", "meeting"] }, text: { type: "string" } },
        required: ["kind", "text"],
        additionalProperties: false,
      },
  },
  get_campaign_attribution: {
    description: "Recent campaigns with leads, deals, and pipeline created, best first.",
    parameters: obj({}),
  },
  create_segment: {
    description: "Create a contact segment (active list) from plain-language criteria. Confirmed by the marketer.",
    parameters: obj({ name: S(), criteria: A("One line per rule."), estimatedSize: N("Contacts the rules match.") }, ["name", "criteria"]),
  },
  create_campaign: {
    description: "Create a marketing campaign on a segment. Defaults to the segment created most recently. Confirmed by the marketer.",
    parameters: obj({ name: S(), goal: S(), segmentId: S(), channels: A(), startsOn: S("Plain-language start, e.g. Tuesday.") }, ["name", "goal", "channels"]),
  },
  add_asset: {
    description: "Attach a drafted email, landing page, or social post to the latest campaign. Confirmed by the marketer.",
    parameters: obj({ kind: { type: "string", enum: ["email", "landing", "social"] }, title: S(), body: S(), channel: S("Network, for social posts.") }, ["kind", "title", "body"]),
  },
  schedule_email: {
    description: "Schedule the latest campaign's email to its segment. Confirmed by the marketer.",
    parameters: obj({ sendAtLabel: S("Human wording of the send time."), sendInDays: N("Days from today.") }, ["sendAtLabel", "sendInDays"]),
  },
  get_campaign_performance: {
    description: "Delivery, opens, clicks, and form submissions for the latest campaign, with the contacts who submitted.",
    parameters: obj({}),
  },
  save_report: {
    description: "Save a report with KPIs and a table to a dashboard (marketing, sales, or service). Confirmed by the person.",
    parameters: obj(
        {
          dashboard: { type: "string", enum: ["marketing", "sales", "service"] },
          title: S(),
          summary: S(),
          kpis: { type: "array", items: obj({ label: S(), value: S(), delta: S() }, ["label", "value"]) },
          columns: A(),
          rows: { type: "array", items: { type: "array", items: { type: "string" } } },
        },
        ["dashboard", "title", "summary", "kpis", "columns", "rows"],
      ),
  },
  get_focus_list: {
    description: "The rep's open deals ranked by what needs attention today, with reasons, plus tasks due.",
    parameters: obj({}),
  },
  get_deal_brief: {
    description: "One deal in full: stage, amount, people, recent timeline, open tasks, and next step.",
    parameters: obj({ dealId: S() }, ["dealId"]),
  },
  log_email: {
    description: "Send an email to a contact and log it on the deal or company timeline. Confirmed by the person.",
    parameters: obj({ contactId: S(), subject: S(), body: S(), dealId: S(), companyId: S() }, ["contactId", "subject", "body"]),
  },
  create_task: {
    description: "Create a HubSpot task. dueInDays is relative to today. Confirmed by the person.",
    parameters: obj(
        { title: S(), type: { type: "string", enum: ["Call", "Email", "To-do"] }, priority: { type: "string", enum: ["High", "Medium", "Low"] }, dueInDays: N(), dealId: S(), companyId: S(), contactId: S(), notes: S() },
        ["title", "type", "priority", "dueInDays"],
      ),
  },
  update_deal: {
    description: "Change a deal's stage (by stage id), close date (closeInDays from today), or next step. Confirmed by the person.",
    parameters: obj({ dealId: S(), stage: S(), closeInDays: N(), nextStep: S() }, ["dealId"]),
  },
  get_pipeline_by_stage: {
    description: "Open pipeline for the whole team by stage, with this week's biggest movements.",
    parameters: obj({}),
  },
  get_renewals_at_risk: {
    description: "Renewal deals in the next 90 days scored for risk: health, days since contact, open tickets, reasons.",
    parameters: obj({}),
  },
  get_account_brief: {
    description: "One customer account in full: plan, renewal deal, people, open tickets, recent timeline.",
    parameters: obj({ companyId: S() }, ["companyId"]),
  },
  add_note: {
    description: "Pin a note on a company record. Confirmed by the person.",
    parameters: obj({ companyId: S(), text: S() }, ["companyId", "text"]),
  },
  create_ticket: {
    description: "Open a Service Hub ticket on a company and contact. Confirmed by the person.",
    parameters: obj({ subject: S(), description: S(), priority: { type: "string", enum: ["Low", "Medium", "High", "Urgent"] }, companyId: S(), contactId: S() }, ["subject", "description", "priority", "companyId", "contactId"]),
  },
  search_past_tickets: {
    description: "Resolved tickets whose subject or resolution matches the query, with how they were fixed and how long it took.",
    parameters: obj({ query: S() }, ["query"]),
  },
  reply_on_ticket: {
    description: "Send a reply to the customer from the latest ticket and set it to waiting on them. Confirmed by the person.",
    parameters: obj({ text: S(), ticketId: S() }, ["text"]),
  },
  close_ticket: {
    description: "Close the latest ticket with a resolution note. Confirmed by the person.",
    parameters: obj({ resolution: S(), ticketId: S() }, ["resolution"]),
  },
  get_renewal_risk_breakdown: {
    description: "Renewals in the next 90 days by 30-day window: at-risk count and ARR, open tickets behind them, median time to resolve.",
    parameters: obj({}),
  },
};

const DEFS: ToolDef[] = toolSpecs().map((t) => {
  const doc = TOOL_DOCS[t.name];
  if (!doc) throw new Error(`Tool "${t.name}" has no model-facing docs.`);
  return { name: t.name, ...doc, ...(t.confirm ? { confirm: true } : {}) };
});
const BY_NAME = new Map(DEFS.map((d) => [d.name, d]));

export function toolDefs(allow?: readonly string[]): ToolDef[] {
  return DEFS.filter((d) => !allow || allow.includes(d.name));
}

export function toolDef(name: string): ToolDef | undefined {
  return BY_NAME.get(name);
}
