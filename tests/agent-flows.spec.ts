import { expect, test, type Page } from "@playwright/test";
import { openDemo, signIn } from "./helpers";

/**
 * The three headless SaaS flows: a Claude conversation is the whole stage, every write waits for
 * approval, and HubSpot is only opened to show the record that changed. The portal under test runs
 * with AGENT_MOCK=1, so the "live" provider is the deterministic mock streaming from
 * /api/agent/turn; nothing here reaches a model vendor. The scripted path is covered offline.
 */

const VERTICAL = "saas";

/** Requests a step may make: the agent API and the logging beacon. Anything else is a regression. */
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

/** Mocks the status route so the stage believes no provider is live and plays the scripted conversation. */
async function goOffline(page: Page) {
  await page.route("**/api/agent/status", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ live: false, providers: [], demos: [], limits: { sessionMaxTurns: 40, userTurnsPerMinute: 10 } }) }));
}

const settled = (page: Page) => expect(page.getByTestId("claude-msg-streaming")).toHaveCount(0, { timeout: 15_000 });

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test("marketing: a campaign is built from Claude with the live mock, every write approved, then shown in HubSpot", async ({ page }) => {
  await waitOutRateLimit(page);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await openDemo(page, "agent-campaign", VERTICAL);
  await page.waitForLoadState("networkidle");
  const requests = watchRequests(page);

  // The stage is the whole window: no HubSpot chrome, Claude labeled, Penguin markers on the surface and the bridge only.
  await expect(page.getByTestId("claude-stage")).toBeVisible();
  await expect(page.getByTestId("claude-header")).toContainText("Claude");
  await expect(page.locator("nav")).toHaveCount(0);
  await expect(page.getByTestId("claude-mode-live")).toBeVisible();
  await expect(page.getByTestId("claude-provider")).toContainText("Sample (mock)");
  await expect(page.getByTestId("ext-pin-agent-workspace")).toBeVisible();
  await expect(page.getByTestId("ext-pin-agent-tool-bridge")).toBeVisible();
  await expect(page.locator('[data-testid^="ext-pin-"]:not([data-testid^="ext-pin-agent-"])')).toHaveCount(0);
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 10");

  // Turn 1: a read. The suggestion is the flow's own next prompt.
  await expect(page.getByTestId("claude-suggest")).toContainText("Which of our recent campaigns");
  await page.getByTestId("claude-suggest").click();
  await expect(page.getByTestId("claude-msg-user")).toHaveCount(1);
  await settled(page);
  await expect(page.locator('[data-testid="claude-tool-get_campaign_attribution"]').first()).toHaveAttribute("data-state", "ok");
  await expect(page.getByTestId("claude-confirm")).toHaveCount(0);
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 2 of 10");

  // Turn 2: two writes proposed together; the change preview shows what will land; nothing is written yet.
  await page.getByTestId("claude-suggest").click();
  await settled(page);
  await expect(page.getByTestId("claude-confirm")).toBeVisible();
  await expect(page.getByTestId("claude-preview-create_segment")).toContainText("1,284");
  await expect(page.getByTestId("claude-preview-create_campaign")).toContainText("Board-ready dashboards");
  await expect(page.locator('[data-testid="claude-tool-create_campaign"]').first()).toHaveAttribute("data-state", "waiting");
  await expect(page.getByTestId("claude-write-count")).toHaveText("0");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 3 of 10");

  await page.getByTestId("claude-approve").click();
  await settled(page);
  await expect(page.getByTestId("claude-confirm")).toHaveCount(0);
  await expect(page.locator('[data-testid="claude-tool-create_campaign"]').first()).toHaveAttribute("data-state", "ok");
  await expect(page.getByTestId("claude-write-count")).toHaveText("2");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 4 of 10");

  // The cut to HubSpot: the record the writes created, on the real campaign screen, inside the chrome.
  await page.getByTestId("claude-open-create_campaign").click();
  await expect(page).toHaveURL(/\/campaigns\/cmp-/);
  await expect(page.getByTestId("campaign-name")).toContainText("Board-ready dashboards");
  await expect(page.getByTestId("campaign-segment")).toContainText("1,284 contacts");
  await expect(page.locator("nav")).toHaveCount(1);
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(0);

  // Next plays the scripted turns from here through the same bridge, with no further model calls needed.
  const turnsBefore = requests.length;
  await page.getByTestId("demo-next").click();
  await expect(page).toHaveURL(/\/claude$/);
  await expect(page.getByTestId("claude-confirm")).toBeVisible();
  await expect(page.getByTestId("claude-preview-add_asset")).toHaveCount(4);
  await page.getByTestId("demo-next").click();
  await expect(page).toHaveURL(/\/campaigns\/cmp-/);
  await expect(page.getByTestId("campaign-assets")).toContainText("Your board deck should not take three tools");
  await page.getByTestId("demo-next").click();
  await page.getByTestId("demo-next").click();
  // The off-platform beat: the email in the contact's inbox, the form she submits. Not a HubSpot screen.
  await expect(page).toHaveURL(/\/beat\/campaign-inbox/);
  await expect(page.getByTestId("beat-screen")).toContainText("priya.nair@kestrelops.example");
  await page.getByTestId("beat-cta").click();
  await expect(page.getByTestId("beat-thanks")).toBeVisible();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 9 of 10");
  await page.getByTestId("beat-back").click();
  await page.getByTestId("demo-next").click();
  await page.getByTestId("demo-next").click();
  await expect(page).toHaveURL(/\/dashboards\/marketing/);
  await expect(page.getByTestId("dashboard-report")).toContainText("first 48 hours");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
  expect(requests.length).toBe(turnsBefore);

  await page.getByTestId("demo-wrap-up").click();
  await expect(page.getByTestId("end-penguin")).toContainText("Claude as the surface");
  await expect(page.getByTestId("end-penguin")).toContainText("Tool bridge");
  await expect(page.getByTestId("end-native")).toContainText("Marketing campaign");
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});

test("a declined write changes nothing in HubSpot and Claude says so", async ({ page }) => {
  await waitOutRateLimit(page);
  await openDemo(page, "agent-deal-follow-up", VERTICAL);
  await expect(page.getByTestId("claude-mode-live")).toBeVisible();
  // Straight to the write: Next plays the two reads offline, the third turn asks for approval.
  await page.getByTestId("demo-next").click();
  await page.getByTestId("demo-next").click();
  await page.getByTestId("demo-next").click();
  await expect(page.getByTestId("claude-confirm")).toBeVisible();
  await expect(page.getByTestId("claude-preview-log_email")).toContainText("Priscilla Vance");
  await expect(page.getByTestId("claude-preview-create_task")).toContainText("in 2 days");
  await page.getByTestId("claude-decline").click();
  await settled(page);
  await expect(page.getByTestId("claude-confirm")).toHaveCount(0);
  await expect(page.locator('[data-testid="claude-tool-log_email"]').first()).toHaveAttribute("data-state", "declined");
  await expect(page.getByTestId("claude-msg-assistant").last()).toContainText("Nothing was changed");
  await expect(page.getByTestId("claude-write-count")).toHaveText("0");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 4 of 9");
  await page.goto(`/demo/${VERTICAL}/agent-deal-follow-up/deals/dl-marlowe`);
  // Only the pack's seeded call task is on the record; the declined prep task never landed.
  await expect(page.getByTestId("record-tasks")).not.toContainText("two-year pricing");
  await expect(page.getByTestId("deal-stage")).toHaveText("Solution Fit");
});

test("sales: with no live provider the deal follow-up runs scripted and offline, and the deal record shows every write", async ({ page }) => {
  await goOffline(page);
  const turns: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/agent/turn")) turns.push(r.url());
  });
  await openDemo(page, "agent-deal-follow-up", VERTICAL);
  await expect(page.getByTestId("claude-mode-scripted")).toBeVisible();
  await expect(page.getByTestId("claude-provider")).toHaveCount(0);
  await expect(page.getByTestId("claude-input")).toBeDisabled();

  // Send plays the scripted turn: the person's message appears as typed, then Claude's answer.
  await page.getByTestId("claude-play").click();
  await expect(page.getByTestId("claude-msg-user").first()).toContainText("What should I focus on today?");
  await expect(page.getByTestId("claude-msg-assistant").first()).toContainText("Marlowe Ridge Health");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 2 of 9");
  await page.getByTestId("claude-play").click();
  await page.getByTestId("claude-play").click();
  await expect(page.getByTestId("claude-confirm")).toBeVisible();
  await expect(page.getByTestId("claude-play")).toHaveCount(0);
  await page.getByTestId("claude-approve").click();
  await expect(page.getByTestId("claude-confirm")).toHaveCount(0);
  await expect(page.getByTestId("claude-write-count")).toHaveText("2");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 5 of 9");

  // Next: the beat (Priscilla's reply) lands on the deal; the update moves the deal.
  await page.getByTestId("demo-next").click();
  await expect(page).toHaveURL(/\/beat\/deal-reply/);
  await expect(page.getByTestId("beat-sent")).toBeVisible();
  await expect(page.getByTestId("beat-done")).toContainText("logs the reply");
  await page.getByTestId("beat-back").click();
  await page.getByTestId("demo-next").click();
  await expect(page.getByTestId("claude-preview-update_deal")).toContainText("Contract Review");
  await page.getByTestId("demo-next").click();
  await expect(page).toHaveURL(/\/deals\/dl-marlowe/);
  await expect(page.getByTestId("deal-stage")).toHaveText("Contract Review");
  await expect(page.getByTestId("record")).toContainText("Next step");
  await expect(page.getByTestId("record-tasks")).toContainText("Prep two-year pricing options");
  await expect(page.getByTestId("record")).toContainText("Email from Priscilla Vance");
  await page.getByTestId("demo-next").click();
  await page.getByTestId("demo-next").click();
  await expect(page).toHaveURL(/\/dashboards\/sales/);
  await expect(page.getByTestId("dashboard-report")).toContainText("Pipeline by stage");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
  expect(turns).toEqual([]);

  // Back undoes the last approval; Reset drops the whole conversation.
  await page.getByTestId("demo-back").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 9 of 9");
  await page.getByTestId("demo-reset").click();
  await expect(page.getByTestId("claude-intro")).toBeVisible();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 9");
});

test("customer success: the renewal flow spans CRM and Service Hub, scripted and offline", async ({ page }) => {
  await goOffline(page);
  const requests = watchRequests(page);
  await openDemo(page, "agent-renewal", VERTICAL);
  await page.waitForLoadState("networkidle");
  requests.length = 0;
  await expect(page.getByTestId("claude-header")).toContainText("Nadia Kowalski");

  const next = async (n: number) => {
    for (let i = 0; i < n; i++) {
      const before = await page.getByTestId("demo-step-count").textContent();
      await page.getByTestId("demo-next").click();
      await expect(page.getByTestId("demo-step-count")).not.toHaveText(before ?? "");
    }
  };
  await next(4);
  await expect(page).toHaveURL(/\/companies\/co-ambleforth/);
  await expect(page.getByTestId("record-tasks")).toContainText("call Ingrid Solberg");
  await expect(page.getByTestId("record")).toContainText("Talking points");
  await next(1);
  await expect(page).toHaveURL(/\/beat\/renewal-reply/);
  await next(2);
  await expect(page).toHaveURL(/\/support\/tkt-hf-1/);
  await expect(page.getByTestId("ticket-page")).toHaveAttribute("data-status", "new");
  await expect(page.getByTestId("ticket-subject")).toContainText("TKT-5132");
  await next(2);
  await expect(page).toHaveURL(/\/beat\/renewal-fixed/);
  await expect(page.getByTestId("beat-screen")).toContainText("[TKT-5132]");
  await next(3);
  await expect(page).toHaveURL(/\/support\/tkt-hf-1/);
  await expect(page.getByTestId("ticket-page")).toHaveAttribute("data-status", "closed");
  await expect(page.getByTestId("ticket-resolution")).toContainText("compatibility mode");
  await expect(page.getByTestId("ticket-timeline").locator("li")).toHaveCount(5);
  await next(2);
  await expect(page).toHaveURL(/\/dashboards\/service/);
  await expect(page.getByTestId("dashboard-report")).toContainText("Renewals at risk");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
  expect(requests).toEqual([]);
  await page.goto(`/demo/${VERTICAL}/agent-renewal/support`);
  await expect(page.getByTestId("support-index")).toContainText("TKT-5132");
});

test("the flow demos are not offered outside their vertical, in the API or the launchpad", async ({ page }) => {
  const refused = await page.request.post("/api/agent/turn", { data: { provider: "mock", demo: "agent-renewal", vertical: "manufacturing", messages: [{ role: "user", text: "hi" }], actions: [] } });
  expect(refused.status()).toBe(400);
  expect((await refused.json()).error).toBe("unknown_demo");
  await page.goto("/launchpad");
  await page.getByTestId("vertical-manufacturing").click();
  await expect(page.getByTestId("start-agent-campaign")).toHaveCount(0);
  await page.getByTestId("vertical-saas").click();
  await expect(page.getByTestId("demo-agent-campaign").getByTestId("badge-ai")).toBeVisible();
  await expect(page.getByTestId("demo-agent-renewal")).toBeVisible();
});
