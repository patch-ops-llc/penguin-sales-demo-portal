import { expect, test, type Page } from "@playwright/test";
import { openDemo, signIn } from "./helpers";

/**
 * The agent-run Fintech demos on Fernhill Capital: the complaint-to-SLA ticket (OpenAI by default)
 * and the loan application pipeline (Claude by default). The portal under test runs with
 * AGENT_MOCK=1, so the "live" provider is the deterministic mock streaming through
 * /api/agent/turn. Nothing here reaches a model vendor.
 */

const VERTICAL = "financial-services";
const COMPLAINT = "agent-complaint-sla";
const LOAN = "agent-loan-pipeline";

/** Requests a step may make in these demos: the agent API and the logging beacon. Anything else is a regression. */
function watchRequests(page: Page): string[] {
  const requests: string[] = [];
  page.on("request", (r) => {
    const url = r.url();
    if (url.includes("/api/events") || url.includes("/api/agent/")) return;
    if (["document", "fetch", "xhr", "script", "stylesheet"].includes(r.resourceType())) requests.push(`${r.resourceType()} ${url}`);
  });
  return requests;
}

async function waitOutRateLimit(page: Page) {
  // The API spec's last test fills this user's per-minute window on purpose; a run that follows it closely waits it out.
  const probe = await page.request.post("/api/agent/turn", { data: { provider: "mock", demo: COMPLAINT, vertical: VERTICAL, messages: [{ role: "user", text: "ping" }], actions: [] } });
  if (probe.status() === 429 && (await probe.json()).error === "rate_limited") {
    test.setTimeout(180_000);
    await page.waitForTimeout(61_000);
  }
}

const chips = (page: Page, name: string) => page.getByTestId("agent-dock").locator(`[data-testid="agent-tool-${name}"]`);

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test("the complaint agent ingests, escalates, waits for the letter, and closes the ticket through the tickets slice", async ({ page }) => {
  await waitOutRateLimit(page);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await openDemo(page, COMPLAINT, VERTICAL);
  await page.waitForLoadState("networkidle");
  const requests = watchRequests(page);

  await expect(page.getByTestId("agent-dock")).toBeVisible();
  await expect(page.getByTestId("agent-mode-live")).toBeVisible();
  await expect(page.getByTestId("agent-provider")).toContainText("Sample (mock)");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 7");
  await expect(page.getByTestId("agent-intro")).toContainText("Marisol");
  // The run starts on the off-platform complaint email, where the clicked demo starts too.
  await expect(page).toHaveURL(/\/ticket-app\/complaint-sla\/intake/);
  await expect(page.getByTestId("ext-pin-agent-workspace")).toBeVisible();
  await expect(page.getByTestId("ext-pin-agent-tool-bridge")).toBeVisible();

  await page.getByTestId("agent-suggest").click();
  await expect(page.getByTestId("agent-msg-user")).toBeVisible();
  // One request carries the agent through intake, the ticket, and the escalation, then stops to ask.
  await expect(page.getByTestId("agent-confirm")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("agent-msg-streaming")).toHaveCount(0);
  await expect(chips(page, "get_complaint").first()).toHaveAttribute("data-state", "ok");
  await expect(chips(page, "ingest_complaint").first()).toHaveAttribute("data-state", "ok");
  await expect(chips(page, "escalate_ticket").first()).toHaveAttribute("data-state", "ok");
  await expect(chips(page, "send_resolution_letter").first()).toHaveAttribute("data-state", "waiting");
  await expect(page.getByTestId("agent-confirm")).toContainText("Marisol Quint");
  expect(Number(await page.getByTestId("agent-action-count").textContent())).toBe(4);

  // The same ticket the clicked demo builds: escalated to compliance, SLA timer on the record.
  await expect(page).toHaveURL(/\/tickets\/tkt-fin-sla-1/);
  await expect(page.getByTestId("ticket-number")).toContainText("CMP-7304");
  await expect(page.getByTestId("ticket-stage-badge")).toContainText("Manager Escalated");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 5 of 7");
  // Back undoes the agent's work one step at a time; Forward is the agent doing it again.
  await page.getByTestId("demo-back").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 4 of 7");
  await expect(page.getByTestId("agent-confirm")).toHaveCount(0);
  await page.getByTestId("demo-next").click();
  await expect(page.getByTestId("agent-confirm")).toBeVisible();

  await page.getByTestId("agent-approve").click();
  await expect(chips(page, "send_resolution_letter").first()).toHaveAttribute("data-state", "ok", { timeout: 15_000 });
  await expect(chips(page, "resolve_ticket").first()).toHaveAttribute("data-state", "ok", { timeout: 15_000 });
  await expect(page.getByTestId("agent-confirm")).toHaveCount(0);
  await expect(page.getByTestId("ticket-stage-badge")).toContainText("Resolved & Archived");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 7 of 7");
  // Native Service Hub surfaces carry no marker; the only pins are the panel, the bridge, and the register export the clicked demo already marks.
  await expect(page.locator('[data-testid^="ext-pin-"]:not([data-testid^="ext-pin-agent-"])')).toHaveCount(1);
  await expect(page.getByTestId("ext-pin-complaint-register-export")).toBeVisible();

  await page.getByTestId("demo-next").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
  await expect(page).toHaveURL(/\/reports\/fintech-complaint-sla/);
  await page.getByTestId("demo-wrap-up").click();
  await expect(page.getByTestId("end-penguin")).toContainText("Agent workspace");
  await expect(page.getByTestId("end-penguin")).toContainText("Tool bridge");
  await expect(page.getByTestId("end-native")).toContainText("24-hour");

  expect(requests).toEqual([]);
  expect(errors).toEqual([]);

  await page.keyboard.press("Escape");
  await page.getByTestId("demo-reset").click();
  await expect(page.getByTestId("agent-intro")).toBeVisible();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 7");
});

test("a declined letter keeps the complaint ticket open and escalated", async ({ page }) => {
  await waitOutRateLimit(page);
  await openDemo(page, COMPLAINT, VERTICAL);
  await page.getByTestId("agent-suggest").click();
  await expect(page.getByTestId("agent-confirm")).toBeVisible({ timeout: 15_000 });
  await page.getByTestId("agent-decline").click();
  await expect(page.getByTestId("agent-confirm")).toHaveCount(0);
  await expect(chips(page, "send_resolution_letter").first()).toContainText("held", { timeout: 15_000 });
  await expect(page.getByTestId("agent-msg-streaming")).toHaveCount(0);
  await expect(page.getByTestId("ticket-stage-badge")).toContainText("Manager Escalated");
  await expect(page.getByTestId("demo-step-count")).toHaveText(/Step [45] of 7/);
});

test("the loan agent opens the deal, confirms the LOS checklist, waits for the borrower email, and funds through the intake slice", async ({ page }) => {
  await waitOutRateLimit(page);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await openDemo(page, LOAN, VERTICAL);
  await page.waitForLoadState("networkidle");
  const requests = watchRequests(page);

  await expect(page.getByTestId("agent-dock")).toBeVisible();
  await expect(page.getByTestId("agent-mode-live")).toBeVisible();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 7");
  await expect(page.getByTestId("agent-intro")).toContainText("Nolan");
  await expect(page).toHaveURL(/\/intake\/loan-application-pipeline\/submit/);

  await page.getByTestId("agent-suggest").click();
  await expect(page.getByTestId("agent-confirm")).toBeVisible({ timeout: 15_000 });
  await expect(chips(page, "get_loan_application").first()).toHaveAttribute("data-state", "ok");
  await expect(chips(page, "submit_loan_application").first()).toHaveAttribute("data-state", "ok");
  await expect(chips(page, "set_missing_docs").first()).toHaveAttribute("data-state", "ok");
  await expect(chips(page, "confirm_los_checklist").first()).toHaveAttribute("data-state", "ok");
  await expect(chips(page, "start_doc_reminder_sequence").first()).toHaveAttribute("data-state", "waiting");
  await expect(page.getByTestId("agent-confirm")).toContainText("Nolan Becker");

  // The same deal the clicked demo creates, with the LOS card confirmed and the deal in underwriting review.
  await expect(page).toHaveURL(/\/deals\/dl-intake-loan/);
  await expect(page.getByTestId("intake-deal-panel-loan-application-pipeline")).toBeVisible();
  await expect(page.getByTestId("intake-review-confirmed")).toBeVisible();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 5 of 7");

  await page.getByTestId("agent-approve").click();
  await expect(chips(page, "start_doc_reminder_sequence").first()).toHaveAttribute("data-state", "ok", { timeout: 15_000 });
  await expect(chips(page, "complete_document_packet").first()).toHaveAttribute("data-state", "ok", { timeout: 15_000 });
  await expect(chips(page, "verify_funded_deal").first()).toHaveAttribute("data-state", "ok", { timeout: 15_000 });
  await expect(page.getByTestId("agent-confirm")).toHaveCount(0);
  await expect(page.getByTestId("intake-completion-card")).toBeVisible();
  await expect(page.getByTestId("intake-completion-value")).toContainText("640,000");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 7 of 7");
  // The LOS card is the one Penguin pin the clicked demo has; the agent adds only the panel and the bridge.
  await expect(page.locator('[data-testid^="ext-pin-"]:not([data-testid^="ext-pin-agent-"])')).toHaveCount(1);
  await expect(page.getByTestId("ext-pin-los-document-completeness")).toBeVisible();

  await page.getByTestId("demo-next").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
  await expect(page).toHaveURL(/\/reports\/loan-application-conversion/);
  await page.getByTestId("demo-wrap-up").click();
  await expect(page.getByTestId("end-penguin")).toContainText("Agent workspace");
  await expect(page.getByTestId("end-native")).toContainText("Commercial Loan Origination pipeline");

  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});

test("each demo starts on its default provider when more than one is on: OpenAI for the complaint, Claude for the loan", async ({ page }) => {
  await page.route("**/api/agent/status", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        live: true,
        providers: [
          { id: "anthropic", label: "Claude", model: "claude-sonnet-5-5" },
          { id: "openai", label: "OpenAI", model: "gpt-6.2-sol" },
          { id: "mock", label: "Sample (mock)", model: "sample" },
        ],
        demos: [],
        limits: { sessionMaxTurns: 40, userTurnsPerMinute: 10 },
      }),
    }),
  );
  await openDemo(page, COMPLAINT, VERTICAL);
  await expect(page.getByTestId("agent-provider")).toHaveValue("openai");
  await expect(page.getByTestId("agent-tool-bridge")).toContainText("gpt-6.2-sol");
  // Claude stays one click away.
  await page.getByTestId("agent-provider").selectOption("anthropic");
  await expect(page.getByTestId("agent-tool-bridge")).toContainText("claude-sonnet-5-5");

  await openDemo(page, LOAN, VERTICAL);
  await expect(page.getByTestId("agent-provider")).toHaveValue("anthropic");
  await expect(page.getByTestId("agent-tool-bridge")).toContainText("claude-sonnet-5-5");
});

test("with no live provider both Fintech agent demos play their scripted transcripts through the same tool bridge, offline", async ({ page }) => {
  await page.route("**/api/agent/status", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ live: false, providers: [], demos: [], limits: { sessionMaxTurns: 40, userTurnsPerMinute: 10 } }) }));
  const turns: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/agent/turn")) turns.push(r.url());
  });

  await openDemo(page, COMPLAINT, VERTICAL);
  await expect(page.getByTestId("agent-mode-scripted")).toBeVisible();
  await expect(page.getByTestId("agent-provider")).toHaveCount(0);
  await expect(page.getByTestId("agent-input")).toHaveCount(0);
  await page.getByTestId("agent-play").click();
  await expect(page.getByTestId("agent-msg-assistant").first()).toBeVisible();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 2 of 7");
  await page.getByTestId("agent-play").click();
  await expect(page).toHaveURL(/\/tickets\/tkt-fin-sla-1/);
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 3 of 7");
  await page.getByTestId("agent-play").click();
  await page.getByTestId("agent-play").click();
  await expect(page.getByTestId("agent-confirm")).toBeVisible();
  await expect(page.getByTestId("agent-play")).toBeDisabled();
  await page.getByTestId("agent-approve").click();
  await expect(page.getByTestId("ticket-stage-badge")).toContainText("Resolved & Archived");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 7 of 7");
  await expect(page.getByTestId("agent-play")).toBeDisabled();

  await openDemo(page, LOAN, VERTICAL);
  await expect(page.getByTestId("agent-mode-scripted")).toBeVisible();
  await page.getByTestId("agent-play").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 2 of 7");
  await page.getByTestId("agent-play").click();
  await expect(page).toHaveURL(/\/deals\/dl-intake-loan/);
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 3 of 7");
  await page.getByTestId("agent-play").click();
  await expect(page.getByTestId("intake-review-confirmed")).toBeVisible();
  await page.getByTestId("agent-play").click();
  await expect(page.getByTestId("agent-confirm")).toBeVisible();
  await page.getByTestId("agent-approve").click();
  await expect(page.getByTestId("intake-completion-card")).toBeVisible();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 7 of 7");
  // The Next button drives the same transcript: the report step is the rep's click.
  await page.getByTestId("demo-next").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
  await expect(page).toHaveURL(/\/reports\/loan-application-conversion/);

  expect(turns).toEqual([]);
});
