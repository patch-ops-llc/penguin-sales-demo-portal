import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { replay, seedWorld } from "../src/store/world";
import { getTicketRun } from "../src/store/slices/tickets";
import { financialServicesPack } from "../src/verticals/financial-services/pack";
import { manufacturingPack } from "../src/verticals/manufacturing/pack";
import { signIn } from "./helpers";

/**
 * The agent API with the deterministic mock provider (AGENT_MOCK=1 on the portal under test).
 * No test here reaches a model vendor. The one that does is opt-in with AGENT_E2E_REAL=1 and is
 * skipped everywhere else, so CI never spends a cent or needs a key.
 */

type SseEvent = { event: string; data: Record<string, unknown> };

function parseSse(text: string): SseEvent[] {
  return text
    .split("\n\n")
    .filter((chunk) => chunk.trim())
    .map((chunk) => {
      const event = /^event: (.+)$/m.exec(chunk)?.[1] ?? "message";
      const data = /^data: (.+)$/m.exec(chunk)?.[1] ?? "{}";
      return { event, data: JSON.parse(data) };
    });
}

type Message = Record<string, unknown>;
type Action = { t: string } & Record<string, unknown>;

const DEMO = { demo: "agent-guided-quote", vertical: "manufacturing" };

async function turn(request: APIRequestContext, body: Record<string, unknown>) {
  const data = { provider: "mock", ...DEMO, messages: [], actions: [], ...body };
  let response = await request.post("/api/agent/turn", { data });
  // A run less than a minute after the previous one meets the per-user window the last test fills on purpose.
  if (response.status() === 429 && (await response.json()).error === "rate_limited") {
    test.setTimeout(150_000);
    await new Promise((r) => setTimeout(r, 61_000));
    response = await request.post("/api/agent/turn", { data });
  }
  return { response, events: response.ok() ? parseSse(await response.text()) : [] };
}

/** Plays a whole run the way the browser will: send, apply actions, append messages, answer confirmations. */
async function playRun(request: APIRequestContext, approve: boolean, which: typeof DEMO = DEMO) {
  const messages: Message[] = [];
  const actions: Action[] = [];
  const all: SseEvent[] = [];
  let pendingApproval: Record<string, boolean> | undefined;
  for (let i = 0; i < 6; i++) {
    const { response, events } = await turn(request, { ...which, messages, actions, approve: pendingApproval });
    expect(response.status(), await response.text().catch(() => "")).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/event-stream");
    pendingApproval = undefined;
    all.push(...events);
    for (const e of events) {
      if (e.event === "message") messages.push(e.data.message as Message);
      if (e.event === "tool_result") actions.push(...(e.data.actions as Action[]));
      if (e.event === "confirm") pendingApproval = Object.fromEntries((e.data.calls as { id: string }[]).map((c) => [c.id, approve]));
    }
    const done = events.find((e) => e.event === "done");
    expect(done, "every turn ends with done").toBeTruthy();
    if (done?.data.reason === "end") return { messages, actions, events: all, requests: i + 1 };
    expect(done?.data.reason).toBe("confirm");
  }
  throw new Error("The mock run did not finish.");
}

let signedIn: Page;
let api: APIRequestContext;
let mockOn = false;

test.beforeAll(async ({ browser }) => {
  signedIn = await browser.newPage();
  await signIn(signedIn);
  api = signedIn.request;
  const status = await api.get("/api/agent/status");
  mockOn = status.ok() && ((await status.json()).providers as { id: string }[]).some((p) => p.id === "mock");
});

test.afterAll(async () => {
  await signedIn?.close();
});

test("signed-out callers get nothing from the agent API", async ({ request }) => {
  expect((await request.get("/api/agent/status")).status()).toBe(401);
  expect((await request.post("/api/agent/turn", { data: { provider: "mock", ...DEMO } })).status()).toBe(401);
});

test("status and health say which providers are on, in booleans and ids only", async () => {
  const health = await api.get("/api/health");
  expect(health.ok()).toBe(true);
  expect(typeof (await health.json()).agent).toBe("boolean");

  const status = await api.get("/api/agent/status");
  expect(status.status()).toBe(200);
  const text = await status.text();
  const body = JSON.parse(text);
  expect(Array.isArray(body.providers)).toBe(true);
  for (const p of body.providers) expect(Object.keys(p).sort()).toEqual(["id", "label", "model"]);
  expect(body.demos.map((d: { id: string }) => d.id)).toContain("agent-guided-quote");
  // Nothing that looks like a key or a secret-bearing field may appear.
  expect(text).not.toMatch(/sk-[A-Za-z0-9_-]{8,}/);
  expect(text.toLowerCase()).not.toMatch(/"(api_?key|secret|token)"/);
});

test("bad requests are refused with a scripted fallback hint", async () => {
  test.skip(!mockOn, "AGENT_MOCK=1 is not set on the portal under test.");
  const invalid = await api.post("/api/agent/turn", { data: "not json", headers: { "content-type": "application/json" } });
  expect(invalid.status()).toBe(400);
  expect((await invalid.json()).fallback).toBe("scripted");

  const unknownDemo = await api.post("/api/agent/turn", { data: { provider: "mock", demo: "no-such-demo", vertical: "manufacturing" } });
  expect(unknownDemo.status()).toBe(400);
  expect((await unknownDemo.json()).error).toBe("unknown_demo");

  // A vertical only runs its own agent demos: Manufacturing has no complaint pipeline for the agent to work.
  const wrongVertical = await api.post("/api/agent/turn", { data: { provider: "mock", demo: "agent-complaint-sla", vertical: "manufacturing" } });
  expect(wrongVertical.status()).toBe(400);
  expect((await wrongVertical.json()).error).toBe("unknown_demo");

  const badTranscript = await api.post("/api/agent/turn", { data: { provider: "mock", ...DEMO, messages: [{ role: "wizard" }] } });
  expect(badTranscript.status()).toBe(400);

  const badActions = await api.post("/api/agent/turn", { data: { provider: "mock", ...DEMO, actions: ["gq.generate"] } });
  expect(badActions.status()).toBe(400);
});

test("a provider without an adapter or a key is refused, not attempted", async () => {
  const response = await api.post("/api/agent/turn", { data: { provider: "xai", ...DEMO } });
  expect(response.status()).toBe(409);
  const body = await response.json();
  expect(body.error).toBe("provider_disabled");
  expect(body.fallback).toBe("scripted");
  expect(body.providers).not.toContain("xai");
});

test("a run that hit its turn cap is stopped before any model call", async () => {
  test.skip(!mockOn, "AGENT_MOCK=1 is not set on the portal under test.");
  const messages = Array.from({ length: 40 }, () => ({ role: "assistant", text: "…", toolCalls: [] }));
  const response = await api.post("/api/agent/turn", { data: { provider: "mock", ...DEMO, messages } });
  expect(response.status()).toBe(429);
  expect((await response.json()).error).toBe("run_cap");
});

test("the mock provider drives a guided quote from discovery to a sent quote through store actions", async () => {
  test.skip(!mockOn, "AGENT_MOCK=1 is not set on the portal under test.");
  const run = await playRun(api, true);

  const names = (kind: string) => run.events.filter((e) => e.event === kind);
  expect(names("text_delta").length).toBeGreaterThan(0);
  expect(names("tool_call").map((e) => (e.data.call as { name: string }).name)).toEqual(
    expect.arrayContaining(["get_deal", "get_guided_quote_state", "guided_quote_select", "guided_quote_generate", "create_quote", "send_quote"]),
  );
  expect(names("confirm").length).toBe(1);
  expect(names("usage").every((e) => e.data.costUsd === 0 && e.data.provider === "mock")).toBe(true);
  expect(names("error")).toEqual([]);

  // Every tool call came back as store actions: the same shapes the clicked demo dispatches.
  const types = run.actions.map((a) => a.t);
  expect(types).toEqual(expect.arrayContaining(["gq.select", "gq.quantity", "gq.needBy", "gq.generate", "gq.createQuote", "quote.send", "log"]));
  expect(run.actions.every((a) => typeof a.t === "string")).toBe(true);
  for (const e of names("tool_result")) expect(e.data).not.toHaveProperty("error");

  // Replaying those actions in the browser's own store gives the world the server described.
  const world = replay(seedWorld(manufacturingPack), run.actions as never[], manufacturingPack);
  const quote = world.quotes.find((q) => q.id === world.gq.quoteId);
  expect(quote?.status).toBe("Sent");
  expect(quote?.lineItems.length).toBeGreaterThan(0);
  const deal = world.deals.find((d) => d.id === manufacturingPack.demos.guidedQuote.dealId);
  expect(deal?.stage).toBe("quote-sent");
  expect(world.activities.some((a) => a.title.startsWith("Quote") && a.title.endsWith("sent"))).toBe(true);
});

test("the mock provider works a Fintech complaint from intake to a closed SLA ticket through the tickets slice", async () => {
  test.skip(!mockOn, "AGENT_MOCK=1 is not set on the portal under test.");
  const run = await playRun(api, true, { demo: "agent-complaint-sla", vertical: "financial-services" });
  const names = (kind: string) => run.events.filter((e) => e.event === kind);
  expect(names("tool_call").map((e) => (e.data.call as { name: string }).name)).toEqual(["get_complaint", "ingest_complaint", "open_ticket", "escalate_ticket", "send_resolution_letter", "resolve_ticket"]);
  expect(names("confirm").length).toBe(1);
  expect(names("error")).toEqual([]);
  for (const e of names("tool_result")) expect(e.data).not.toHaveProperty("error");
  // The very actions the clicked complaint-sla demo dispatches, nothing else.
  expect(run.actions.map((a) => a.t)).toEqual(["tk.submitIntake", "tk.openTicket", "tk.escalate", "tk.sendOutreach", "tk.resolve"]);
  expect(run.actions.every((a) => a.demoId === "complaint-sla")).toBe(true);
  const world = replay(seedWorld(financialServicesPack), run.actions as never[], financialServicesPack);
  const ticket = getTicketRun(world, "complaint-sla");
  expect(ticket).toMatchObject({ intakeSubmitted: true, escalated: true, outreachSent: true, resolved: true, stageId: "resolved-archived" });
  expect(ticket.timeline.some((t) => t.kind === "escalation")).toBe(true);
});

test("the mock provider takes a Fintech loan application to a funded deal through the intake slice", async () => {
  test.skip(!mockOn, "AGENT_MOCK=1 is not set on the portal under test.");
  const run = await playRun(api, true, { demo: "agent-loan-pipeline", vertical: "financial-services" });
  const names = (kind: string) => run.events.filter((e) => e.event === kind);
  expect(names("tool_call").map((e) => (e.data.call as { name: string }).name)).toEqual([
    "get_loan_application",
    "submit_loan_application",
    "set_missing_docs",
    "confirm_los_checklist",
    "start_doc_reminder_sequence",
    "complete_document_packet",
    "verify_funded_deal",
  ]);
  expect(names("confirm").length).toBe(1);
  for (const e of names("tool_result")) expect(e.data).not.toHaveProperty("error");
  expect(run.actions.map((a) => a.t)).toEqual(["intake.submit", "intake.review", "intake.sendOutreach", "intake.completeFollowup", "intake.reviewCompletion"]);
  expect(run.actions.every((a) => a.demoId === "loan-application-pipeline")).toBe(true);
  const world = replay(seedWorld(financialServicesPack), run.actions as never[], financialServicesPack);
  const st = world.intake["loan-application-pipeline"];
  expect(st).toMatchObject({ submitted: true, reviewed: true, outreachSent: true, followupCompleted: true, completionReviewed: true });
  const deal = world.deals.find((d) => d.id === st.dealId);
  expect(deal?.stage).toBe("approved-funded");
  expect(deal?.amount).toBe(640_000);
});

test("a declined confirmation leaves the quote unsent and tells the model so", async () => {
  test.skip(!mockOn, "AGENT_MOCK=1 is not set on the portal under test.");
  const run = await playRun(api, false);
  const declined = run.events.filter((e) => e.event === "tool_result" && (e.data.name as string) === "send_quote");
  expect(declined.length).toBe(1);
  expect((declined[0].data.result as { declined?: boolean }).declined).toBe(true);
  expect(declined[0].data.actions).toEqual([]);
  expect(run.actions.map((a) => a.t)).not.toContain("quote.send");
  const world = replay(seedWorld(manufacturingPack), run.actions as never[], manufacturingPack);
  expect(world.quotes.find((q) => q.id === world.gq.quoteId)?.status).toBe("Draft");
});

test("a real provider answers a first turn (opt-in: AGENT_E2E_REAL=1, spends real money)", async () => {
  test.skip(!process.env.AGENT_E2E_REAL, "Set AGENT_E2E_REAL=1 to call the configured live providers.");
  const status = await (await api.get("/api/agent/status")).json();
  const live = (status.providers as { id: string }[]).map((p) => p.id).filter((id) => id !== "mock");
  test.skip(live.length === 0, "No live provider is configured on the portal under test.");
  for (const provider of live) {
    const response = await api.post("/api/agent/turn", { data: { provider, ...DEMO, messages: [{ role: "user", text: "Read the deal, then stop and tell me the buyer's name in one sentence." }], actions: [] } });
    expect(response.status(), provider).toBe(200);
    const events = parseSse(await response.text());
    expect(events.filter((e) => e.event === "error"), provider).toEqual([]);
    expect(events.some((e) => e.event === "text_delta" || e.event === "tool_call"), provider).toBe(true);
    expect(events.some((e) => e.event === "usage" && (e.data.outputTokens as number) > 0), provider).toBe(true);
    expect(events.find((e) => e.event === "done")?.data.reason, provider).toMatch(/^(end|confirm|max_tokens|loop_cap)$/);
  }
});

test("a rep is held to the per-minute turn limit", async () => {
  test.skip(!mockOn, "AGENT_MOCK=1 is not set on the portal under test.");
  // Last on purpose: it uses up this user's allowance for the current minute.
  let limited: number | null = null;
  for (let i = 0; i < 14; i++) {
    const response = await api.post("/api/agent/turn", { data: { provider: "mock", ...DEMO, messages: [{ role: "user", text: "hi" }], actions: [] } });
    if (response.status() === 429) {
      limited = i;
      expect((await response.json()).error).toBe("rate_limited");
      break;
    }
    expect(response.status()).toBe(200);
  }
  expect(limited, "a 429 arrived within the window").not.toBeNull();
});
