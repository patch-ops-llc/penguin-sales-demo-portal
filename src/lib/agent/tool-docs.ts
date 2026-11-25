import type { ToolDef } from "@/lib/agent/types";
import { confirmTools, toolNames } from "@/demos/agent/tools";

/**
 * What the model reads about each tool: the description and the JSON Schema for its arguments.
 * Server-only. The browser carries the handlers (it runs them for the scripted transcript) but
 * never needs this text, which keeps it out of the demo shell's JavaScript budget.
 */
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
  get_complaint: {
    description: "Read the inbound complaint (channel, sender, text), the Service Hub ticket it maps to, the SLA policy and escalation rule, the current ticket state, and the rest of the complaint queue. Call this first.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  ingest_complaint: {
    description: "Ingest the complaint into Service Hub: opens the categorized ticket with its priority, sends the automated 24-hour written acknowledgement to the complainant, and starts the SLA timer. Call once.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  open_ticket: {
    description: "Open the ticket record in Service Hub so the rep sees the acknowledgement, the SLA timer, and the timeline. Requires the complaint to be ingested.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  escalate_ticket: {
    description: "Trigger the overdue-SLA escalation: reassigns the ticket to the escalation owner named by the rule and logs it on the timeline. Only when the SLA is overdue or at its warning threshold.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  send_resolution_letter: {
    description: "Send the formal written resolution letter to the complainant and log it on the ticket. Omit text to send the compliance-approved letter. The rep confirms this step before it runs.",
    parameters: { type: "object", properties: { text: { type: "string", description: "Optional letter body to send instead of the approved draft." } }, additionalProperties: false },
  },
  resolve_ticket: {
    description: "Log the root-cause and follow-up note, close the ticket as resolved, and complete the follow-up task. Omit note to use the compliance note. Send the resolution letter first.",
    parameters: { type: "object", properties: { note: { type: "string", description: "Optional resolution note for the audit trail." } }, additionalProperties: false },
  },
  get_loan_application: {
    description: "Read the borrower's online loan application as submitted on the portal, the loan origination pipeline stages, the LOS document checklist (received and missing items), the uploads the borrower can send, and the deal state. Call this first.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  submit_loan_application: {
    description: "Ingest the submitted application into HubSpot: creates the borrower company, the authorized signer, and the loan deal in the origination pipeline, routes it to the underwriter, and opens the underwriting task. Call once.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  set_missing_docs: {
    description: "Choose which missing LOS documents go into the borrower reminder sequence, by item id from get_loan_application. Only items reported as missing can be chosen; at least one must stay selected.",
    parameters: { type: "object", properties: { itemIds: { type: "array", items: { type: "string" } } }, required: ["itemIds"], additionalProperties: false },
  },
  confirm_los_checklist: {
    description: "Confirm the LOS underwriting checklist on the deal: moves it to underwriting review and logs the verified packet state. Requires the application to be in the pipeline.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  start_doc_reminder_sequence: {
    description: "Email the borrower the missing-document request and enroll them in the automated reminder sequence; the deal moves to Documents Requested. Omit subject and body to use the approved template. The rep confirms this step before it runs.",
    parameters: { type: "object", properties: { subject: { type: "string" }, body: { type: "string" } }, additionalProperties: false },
  },
  complete_document_packet: {
    description: "Record the documents the borrower uploaded on the portal and their acceptance of the approved terms, by upload id from get_loan_application (omit for all). Completes the LOS packet, pauses the reminder sequence, and moves the deal to its funded stage.",
    parameters: { type: "object", properties: { uploadIds: { type: "array", items: { type: "string" } } }, additionalProperties: false },
  },
  verify_funded_deal: {
    description: "Re-read the deal after funding and mark the underwriting verification complete on it. Requires the document packet to be complete.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
};

const CONFIRM = new Set(confirmTools());

export function toolDef(name: string): ToolDef | undefined {
  const doc = TOOL_DOCS[name];
  return doc ? { name, ...doc, ...(CONFIRM.has(name) ? { confirm: true } : {}) } : undefined;
}

/** The definitions for the tools a demo allows, in the order the bridge declares them. Throws on a tool without documentation, so a missing entry fails the first turn loudly rather than silently hiding a tool. */
export function toolDefs(allow?: readonly string[]): ToolDef[] {
  return toolNames()
    .filter((name) => !allow || allow.includes(name))
    .map((name) => {
      const def = toolDef(name);
      if (!def) throw new Error(`Tool "${name}" has no documentation for the model.`);
      return def;
    });
}
