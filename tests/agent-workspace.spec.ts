import { expect, test, type Page } from "@playwright/test";
import { openDemo, signIn } from "./helpers";

/**
 * The agent-run guided quote in Manufacturing. The portal under test runs with AGENT_MOCK=1, so the
 * "live" provider is the deterministic mock: the panel streams from /api/agent/turn exactly as it
 * would from Claude, with no key and no spend. Nothing here reaches a model vendor.
 */

const DEMO = "agent-guided-quote";

/** Requests a step may make in this demo: the agent API and the logging beacon. Anything else is a regression. */
function watchRequests(page: Page): string[] {
  const requests: string[] = [];
  page.on("request", (r) => {
    const url = r.url();
    if (url.includes("/api/events") || url.includes("/api/agent/")) return;
    if (["document", "fetch", "xhr", "script", "stylesheet"].includes(r.resourceType())) requests.push(`${r.resourceType()} ${url}`);
  });
  return requests;
}

async function waitOutRateLimit(page: Page, turns = 4) {
  // The API spec's last test fills this user's per-minute window on purpose, and the live tests in
  // this and the other agent specs spend from the same window: wait until this test's turns fit.
  const status = await page.request.get("/api/agent/status");
  const { limits } = (await status.json()) as { limits: { turnsLeftThisMinute?: number } };
  if ((limits.turnsLeftThisMinute ?? turns) < turns) {
    test.setTimeout(180_000);
    await page.waitForTimeout(61_000);
  }
}

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test("the rep briefs the agent, its tool calls land as HubSpot actions, and the send waits for approval", async ({ page }) => {
  await waitOutRateLimit(page);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await openDemo(page, DEMO);
  await page.waitForLoadState("networkidle");
  const requests = watchRequests(page);

  const dock = page.getByTestId("agent-dock");
  await expect(dock).toBeVisible();
  await expect(page.getByTestId("agent-mode-live")).toBeVisible();
  await expect(page.getByTestId("agent-provider")).toContainText("Sample (mock)");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 6");
  // Penguin built the panel and the bridge; both carry the marker.
  await expect(page.getByTestId("ext-pin-agent-workspace")).toBeVisible();
  await expect(page.getByTestId("ext-pin-agent-tool-bridge")).toBeVisible();

  await page.getByTestId("agent-suggest").click();
  await expect(page.getByTestId("agent-msg-user")).toBeVisible();
  // One request carries the model through discovery, pricing, and creating the quote, then stops to ask.
  await expect(page.getByTestId("agent-confirm")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("agent-msg-streaming")).toHaveCount(0);

  const chips = (name: string) => dock.locator(`[data-testid="agent-tool-${name}"]`);
  await expect(chips("get_deal").first()).toHaveAttribute("data-state", "ok");
  await expect(chips("guided_quote_select")).toHaveCount(4);
  await expect(chips("guided_quote_generate").first()).toHaveAttribute("data-state", "ok");
  await expect(chips("create_quote").first()).toHaveAttribute("data-state", "ok");
  await expect(chips("send_quote").first()).toHaveAttribute("data-state", "waiting");
  expect(Number(await page.getByTestId("agent-action-count").textContent())).toBeGreaterThanOrEqual(9);

  // The same store the clicked demo uses: the quote is on the deal, the step counter followed the agent.
  await expect(page).toHaveURL(/\/deals\/dl-line4/);
  await expect(page.getByTestId("deal-quotes")).toContainText("Draft");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 5 of 6");
  // Back undoes the agent's work one step at a time; Forward is the agent doing it again.
  await page.getByTestId("demo-back").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 4 of 6");
  await expect(page.getByTestId("agent-confirm")).toHaveCount(0);
  await page.getByTestId("demo-next").click();
  await expect(page.getByTestId("agent-confirm")).toBeVisible();

  await page.getByTestId("agent-approve").click();
  await expect(chips("send_quote").first()).toHaveAttribute("data-state", "ok", { timeout: 15_000 });
  await expect(page.getByTestId("agent-confirm")).toHaveCount(0);
  await expect(page).toHaveURL(/\/quotes\/q-guided/);
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 6 of 6");
  // Native quote screens carry no Penguin marker; only the panel does.
  await expect(page.locator('[data-testid^="ext-pin-"]:not([data-testid^="ext-pin-agent-"])')).toHaveCount(0);

  await page.getByTestId("demo-next").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
  await expect(page).toHaveURL(/\/deals\/dl-line4/);
  await page.getByTestId("demo-wrap-up").click();
  await expect(page.getByTestId("end-penguin")).toContainText("Agent workspace");
  await expect(page.getByTestId("end-penguin")).toContainText("Tool bridge");
  await expect(page.getByTestId("end-native")).toContainText("Deal record");

  expect(requests).toEqual([]);
  expect(errors).toEqual([]);

  // Reset drops the transcript with everything else.
  await page.keyboard.press("Escape");
  await page.getByTestId("demo-reset").click();
  await expect(page.getByTestId("agent-intro")).toBeVisible();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 6");
});

test("a declined send keeps the quote in draft and the agent says so", async ({ page }) => {
  await waitOutRateLimit(page);
  await openDemo(page, DEMO);
  await page.getByTestId("agent-suggest").click();
  await expect(page.getByTestId("agent-confirm")).toBeVisible({ timeout: 15_000 });
  await page.getByTestId("agent-decline").click();
  await expect(page.getByTestId("agent-confirm")).toHaveCount(0);
  await expect(page.getByTestId("agent-dock").locator('[data-testid="agent-tool-send_quote"]').first()).toContainText("declined", { timeout: 15_000 });
  await expect(page.getByTestId("agent-msg-streaming")).toHaveCount(0);
  await expect(page).toHaveURL(/\/deals\/dl-line4/);
  await expect(page.getByTestId("deal-quotes")).toContainText("Draft");
  await expect(page.getByTestId("demo-step-count")).toHaveText(/Step [45] of 6/);
});

test("with no live provider the panel plays the scripted transcript through the same tool bridge, offline", async ({ page }) => {
  await page.route("**/api/agent/status", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ live: false, providers: [], demos: [], limits: { sessionMaxTurns: 40, userTurnsPerMinute: 10 } }) }));
  const turns: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/agent/turn")) turns.push(r.url());
  });
  await openDemo(page, DEMO);
  await expect(page.getByTestId("agent-mode-scripted")).toBeVisible();
  await expect(page.getByTestId("agent-provider")).toHaveCount(0);
  await expect(page.getByTestId("agent-input")).toHaveCount(0);

  await page.getByTestId("agent-play").click();
  await expect(page.getByTestId("agent-msg-assistant").first()).toBeVisible();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 2 of 6");
  await page.getByTestId("agent-play").click();
  await page.getByTestId("agent-play").click();
  await page.getByTestId("agent-play").click();
  await expect(page.getByTestId("agent-confirm")).toBeVisible();
  await expect(page.getByTestId("agent-play")).toBeDisabled();
  await page.getByTestId("agent-approve").click();
  await expect(page).toHaveURL(/\/quotes\/q-guided/);
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 6 of 6");
  expect(turns).toEqual([]);
});

test("a refused live turn falls back to the scripted transcript instead of stalling", async ({ page }) => {
  await page.route("**/api/agent/turn", (route) => route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ error: "provider_disabled", message: "That provider is not available on this portal.", fallback: "scripted" }) }));
  await openDemo(page, DEMO);
  await expect(page.getByTestId("agent-mode-live")).toBeVisible();
  await page.getByTestId("agent-suggest").click();
  await expect(page.getByTestId("agent-notice")).toContainText("scripted transcript");
  await expect(page.getByTestId("agent-mode-scripted")).toBeVisible();
  await page.getByTestId("agent-play").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 2 of 6");
  // Reset clears the fallback along with the run.
  await page.getByTestId("demo-reset").click();
  await expect(page.getByTestId("agent-mode-live")).toBeVisible();
});
