import type { AgentMessage, ToolCall, ToolResult } from "@/lib/agent/types";
import { agentTurns, pendingConfirmation } from "@/store/slices/agent";
import type { Action, World } from "@/store/slices/types";
import type { Pack } from "@/verticals/types";
import { getAgentDemo, type AgentDemoId } from "./catalog";
import { confirmTools, runTool } from "./tools";

/**
 * The scripted transcript: the same turns the mock provider replays, run in the browser with no
 * network. It is what the Next button plays, and what a run falls back to when no provider is
 * live. Every tool call goes through the same bridge as a live turn, so the store actions, the
 * screens, and the Penguin markers are identical either way.
 */

type Ctx = { w: World; pack: Pack };

const DECLINED = { declined: true, message: "The rep did not confirm this action." };

/** Runs the calls against `w` (mutating it) and returns the actions they produced plus the tool message. */
function execute(calls: ToolCall[], w: World, pack: Pack, now: number, decisions: Record<string, boolean> | null, allow: readonly string[]): Action[] {
  const out: Action[] = [];
  const results: ToolResult[] = [];
  const gated = confirmTools();
  for (const call of calls) {
    if (gated.includes(call.name) && decisions && decisions[call.id] !== true) {
      results.push({ id: call.id, name: call.name, result: DECLINED });
      continue;
    }
    const outcome = runTool(call, { w, pack, now }, allow);
    out.push(...outcome.actions);
    results.push({ id: call.id, name: call.name, result: outcome.error ? { error: outcome.error } : outcome.result });
  }
  const message: AgentMessage = { role: "tool", results };
  w.ag.messages.push(message);
  out.push({ t: "agent.message", message });
  const last = calls[calls.length - 1];
  if (last) out.push(...focusFor(last.name, pack, w.gq.quoteId).actions);
  return out;
}

/** The screen the last tool that ran in `actions` leaves the rep on. */
export function focusPathOf(actions: Action[], pack: Pack, w: Pick<World, "gq">): string | null {
  let quoteId = w.gq.quoteId;
  let last: string | null = null;
  for (const a of actions) {
    if (a.t === "gq.createQuote") quoteId = quoteId ?? "q-guided";
    // A quote going out is the moment to show; later housekeeping in the same turn does not move the screen.
    if (a.t === "quote.send") return `/quotes/${a.id}`;
    if (a.t === "agent.message" && a.message.role === "tool" && a.message.results.length > 0) last = a.message.results[a.message.results.length - 1].name;
  }
  return last ? focusFor(last, pack, quoteId).path : null;
}

function playTurn(w: World, pack: Pack, now: number, demoId: AgentDemoId): Action[] {
  const demo = getAgentDemo(demoId);
  if (!demo) return [];
  const k = agentTurns(w);
  const step = demo.sample(pack)[k];
  if (!step) return [];
  const calls: ToolCall[] = (step.toolCalls ?? []).map((c, i) => ({ id: `scripted-${k}-${i + 1}`, name: c.name, args: c.args }));
  const assistant: AgentMessage = { role: "assistant", text: step.text, toolCalls: calls };
  w.ag.messages.push(assistant);
  const out: Action[] = [{ t: "agent.message", message: assistant }];
  if (calls.some((c) => confirmTools().includes(c.name))) return out;
  return [...out, ...execute(calls, w, pack, now, null, demo.tools)];
}

/** One scripted turn from the current state. Ends early when the turn asks the rep to confirm something. */
export function scriptedTurn(ctx: Ctx, now: number, demoId: AgentDemoId = "agent-guided-quote"): Action[] {
  return playTurn(structuredClone(ctx.w), ctx.pack, now, demoId);
}

/**
 * The rep's answer to a pending confirmation, followed by the turn that comes after it. When nothing
 * is pending, the scripted turn that asks is played first, so the Next button always moves on.
 */
export function answerScripted(ctx: Ctx, approve: boolean, now: number, demoId: AgentDemoId = "agent-guided-quote"): Action[] {
  const demo = getAgentDemo(demoId);
  if (!demo) return [];
  const w = structuredClone(ctx.w);
  const out: Action[] = [];
  if (pendingConfirmation(w, confirmTools()).length === 0) out.push(...playTurn(w, ctx.pack, now, demoId));
  const last = w.ag.messages[w.ag.messages.length - 1];
  if (!last || last.role !== "assistant" || last.toolCalls.length === 0) return out;
  const decisions = Object.fromEntries(last.toolCalls.map((c) => [c.id, approve]));
  out.push(...execute(last.toolCalls, w, ctx.pack, now, decisions, demo.tools));
  if (approve) {
    out.push(...playTurn(w, ctx.pack, now, demoId));
  } else {
    const held: AgentMessage = { role: "assistant", text: demo.declineText, toolCalls: [] };
    out.push({ t: "agent.message", message: held });
  }
  return out;
}

/**
 * Where the screen should be after a tool ran, so the rep watches the agent work in the real
 * HubSpot screens: the Guided quote tab while it answers questions, the deal while it creates
 * the quote, the quote page once it is sent; the complaint email, then the ticket; the loan
 * portal, then the loan deal. Presentation only; the tools themselves know nothing of screens.
 * Tool names are unique across demos, so one map covers them all.
 */
export function focusFor(tool: string, pack: Pack, quoteId: string | null): { path: string; actions: Action[] } {
  const dealId = pack.demos.guidedQuote.dealId;
  const deal = `/deals/${dealId}`;
  const tab = (v: string): Action => ({ t: "ui", k: `tab.${dealId}`, v });
  const ticket = `/tickets/${pack.demos.tickets?.["complaint-sla"]?.ticket.id ?? ""}`;
  const loanDeal = `/deals/${pack.demos.intake?.["loan-application-pipeline"]?.createdRecords.dealId ?? ""}`;
  switch (tool) {
    case "get_complaint":
      return { path: "/ticket-app/complaint-sla/intake", actions: [] };
    case "ingest_complaint":
    case "open_ticket":
    case "escalate_ticket":
    case "send_resolution_letter":
    case "resolve_ticket":
      return { path: ticket, actions: [] };
    case "get_loan_application":
      return { path: "/intake/loan-application-pipeline/submit", actions: [] };
    case "submit_loan_application":
    case "set_missing_docs":
    case "confirm_los_checklist":
    case "start_doc_reminder_sequence":
    case "complete_document_packet":
    case "verify_funded_deal":
      return { path: loanDeal, actions: [] };
    case "get_guided_quote_state":
    case "guided_quote_select":
    case "guided_quote_set_quantity":
    case "guided_quote_set_need_by":
    case "guided_quote_generate":
      return { path: deal, actions: [tab("guided"), { t: "flag", k: "gq.opened" }] };
    case "create_quote":
    case "get_deal":
    case "list_products":
      return { path: deal, actions: [tab("overview")] };
    case "log_activity":
      return { path: deal, actions: [tab("activities")] };
    case "get_quote":
    case "apply_discount":
    case "request_approval":
    case "send_quote":
      return quoteId ? { path: `/quotes/${quoteId}`, actions: [] } : { path: deal, actions: [] };
    default:
      return { path: deal, actions: [] };
  }
}
