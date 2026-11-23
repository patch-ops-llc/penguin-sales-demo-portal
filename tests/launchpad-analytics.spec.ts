import { expect, test } from "@playwright/test";
import { openDemo, signIn, VERTICAL_DEMOS } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test("launchpad: Hub filter pills, AI / Breeze toggle, client-side search, flagship ordering, and zero network calls", async ({ page }) => {
  await page.waitForLoadState("networkidle");

  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/events")) return;
    if (["document", "fetch", "xhr", "script", "stylesheet"].includes(r.resourceType())) {
      requests.push(`${r.resourceType()} ${r.url()}`);
    }
  });

  // Switch to Financial Services (7 demos spanning all 4 hubs)
  await page.getByTestId("vertical-financial-services").click();

  // Flagships sort to the top row by default, with headline AI flagship first
  const orderedIds = await page
    .locator('[data-testid^="demo-"]')
    .evaluateAll((els) => els.map((el) => el.getAttribute("data-testid")!.slice("demo-".length)));
  expect(orderedIds.slice(0, 3)).toEqual(["customer-agent", "guided-quote", "lead-capture"]);
  await expect(page.getByTestId("demo-customer-agent").getByTestId("badge-flagship")).toBeVisible();
  await expect(page.getByTestId("demo-customer-agent").getByTestId("badge-ai")).toBeVisible();

  // Hub filter: Service & CS shows Customer agent, Client onboarding, and Complaint SLA
  await page.getByTestId("hub-filter-service").click();
  await expect(page.getByTestId("hub-filter-service")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('[data-testid^="demo-"]')).toHaveCount(3);
  await expect(page.getByTestId("demo-customer-agent")).toBeVisible();
  await expect(page.getByTestId("demo-client-onboarding")).toBeVisible();
  await expect(page.getByTestId("demo-complaint-sla")).toBeVisible();

  // Hub filter: Sales & CPQ shows 3 demos
  await page.getByTestId("hub-filter-sales").click();
  await expect(page.locator('[data-testid^="demo-"]')).toHaveCount(3);
  await expect(page.getByTestId("demo-guided-quote")).toBeVisible();
  await expect(page.getByTestId("demo-discount-approval")).toBeVisible();
  await expect(page.getByTestId("demo-ai-prospecting")).toBeVisible();

  // AI / Breeze toggle combined with Sales & CPQ shows only AI prospecting
  await page.getByTestId("filter-ai-toggle").click();
  await expect(page.getByTestId("filter-ai-toggle")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('[data-testid^="demo-"]')).toHaveCount(1);
  await expect(page.getByTestId("demo-ai-prospecting")).toBeVisible();

  // Back to All hubs with AI / Breeze still toggled -> Customer agent + AI prospecting
  await page.getByTestId("hub-filter-all").click();
  await expect(page.locator('[data-testid^="demo-"]')).toHaveCount(2);
  await expect(page.getByTestId("demo-customer-agent")).toBeVisible();
  await expect(page.getByTestId("demo-ai-prospecting")).toBeVisible();

  // Turn off AI toggle and test client-side search across tags & summaries
  await page.getByTestId("filter-ai-toggle").click();
  await page.getByTestId("launchpad-search").fill("credits");
  await expect(page.locator('[data-testid^="demo-"]')).toHaveCount(1);
  await expect(page.getByTestId("demo-customer-agent")).toBeVisible();

  await page.getByTestId("launchpad-search").fill("nonexistent-xyz-term");
  await expect(page.getByTestId("launchpad-empty")).toBeVisible();
  await page.getByTestId("launchpad-clear-filters").click();
  await expect(page.locator('[data-testid^="demo-"]')).toHaveCount(VERTICAL_DEMOS["financial-services"].length);

  // Switch to SaaS: Marketing Studio is first flagship with AI badge
  await page.getByTestId("vertical-saas").click();
  const saasOrder = await page
    .locator('[data-testid^="demo-"]')
    .evaluateAll((els) => els.map((el) => el.getAttribute("data-testid")!.slice("demo-".length)));
  expect(saasOrder.slice(0, 3)).toEqual(["marketing-studio", "guided-quote", "lead-capture"]);
  await expect(page.getByTestId("demo-marketing-studio").getByTestId("badge-flagship")).toBeVisible();
  await expect(page.getByTestId("demo-marketing-studio").getByTestId("badge-ai")).toBeVisible();

  // Vertical picker grid looks balanced with zero horizontal overflow at 1280/1366/1440px
  for (const width of [1280, 1366, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    const layout = await page.evaluate(() => {
      const grid = document.querySelector('[data-testid="vertical-picker-grid"]')!;
      const cards = [...grid.children].map((el) => el.getBoundingClientRect());
      const rows = new Set(cards.map((r) => Math.round(r.top))).size;
      return {
        overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        rows,
        count: cards.length,
      };
    });
    expect(layout, `vertical picker at ${width}px`).toEqual({ overflowX: false, rows: 1, count: 5 });
  }

  expect(requests).toEqual([]);
});

test("grouped DemoBar switcher: groups demos by Hub with scrollable max-h-[420px] panel", async ({ page }) => {
  await openDemo(page, "guided-quote", "financial-services");
  await page.getByTestId("demo-switcher").click();

  const menu = page.getByTestId("demo-switcher-menu");
  await expect(menu).toBeVisible();

  // All 4 HubSpot Hub groups appear for Financial Services
  await expect(page.getByTestId("switcher-group-marketing")).toContainText("Marketing");
  await expect(page.getByTestId("switcher-group-sales")).toContainText("Sales & CPQ");
  await expect(page.getByTestId("switcher-group-service")).toContainText("Service & CS");
  await expect(page.getByTestId("switcher-group-ops")).toContainText("Ops & RevOps");

  // Bounded scroll container so 10-11 demos never clip off-screen
  const styles = await menu.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { maxHeight: cs.maxHeight, overflowY: cs.overflowY };
  });
  expect(styles).toEqual({ maxHeight: "420px", overflowY: "auto" });

  // Switching to a demo in another hub updates the script cleanly
  await page.getByTestId("switch-customer-agent").click();
  await expect(page).toHaveURL(/\/demo\/financial-services\/customer-agent\//);
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 12");
});

test("shared analytics module: declarative KPIs, filter pills, 0 network calls, and strict Penguin marker boundary on Credits-to-Outcome only", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  // Entering SaaS ai-prospecting preloads the lazy analytics chunk automatically
  await openDemo(page, "ai-prospecting", "saas");
  await page.waitForLoadState("networkidle");

  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/events")) return;
    if (["document", "fetch", "xhr", "script", "stylesheet"].includes(r.resourceType())) {
      requests.push(`${r.resourceType()} ${r.url()}`);
    }
  });

  // Navigate to Reporting -> Reports index -> Signal-Sourced Pipeline report (0 network calls)
  await page.getByTestId("nav-reports").click();
  await expect(page.getByTestId("analytics-reports-index")).toBeVisible();
  await page.getByTestId("open-report-signal-pipeline").click();

  await expect(page.getByTestId("analytics-report-page")).toBeVisible();
  await expect(page.getByTestId("analytics-report-title")).toHaveText("Signal-Sourced Pipeline & Credits ROI");
  await expect(page.getByTestId("analytics-kpi-value-pipeline")).toHaveText("$926,000");
  await expect(page.getByTestId("analytics-credits-used")).toContainText("324 credits");

  // Strict Penguin marker boundary: ONLY the Credits-to-Outcome card carries a pulsing Penguin pin
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(1);
  await expect(page.getByTestId("ext-pin-credits-outcome-bridge")).toBeVisible();
  await expect(page.getByTestId("analytics-kpi-grid").locator('[data-testid^="ext-pin-"]')).toHaveCount(0);
  await expect(page.getByTestId("analytics-breakdowns").locator('[data-testid^="ext-pin-"]')).toHaveCount(0);
  await expect(page.getByTestId("analytics-table-card").locator('[data-testid^="ext-pin-"]')).toHaveCount(0);
  await expect(page.getByTestId("analytics-filter-bar").locator('[data-testid^="ext-pin-"]')).toHaveCount(0);

  // Interactive client-side filter pills update KPIs, table, and Credits panel with 0 network calls
  await page.getByTestId("analytics-filter-seat-cap").click();
  await expect(page.getByTestId("analytics-filter-seat-cap")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("analytics-kpi-value-pipeline")).toHaveText("$428,000");
  await expect(page.getByTestId("analytics-credits-used")).toContainText("142 credits");
  await expect(page.getByTestId("analytics-table-row-vireo")).toBeVisible();
  await expect(page.getByTestId("analytics-table-row-saltmarsh")).toHaveCount(0);

  await page.getByTestId("analytics-filter-pricing").click();
  await expect(page.getByTestId("analytics-kpi-value-pipeline")).toHaveText("$186,000");
  await expect(page.getByTestId("analytics-credits-used")).toContainText("74 credits");
  await expect(page.getByTestId("analytics-table-row-saltmarsh")).toBeVisible();

  await page.getByTestId("analytics-filter-all").click();
  await expect(page.getByTestId("analytics-kpi-value-pipeline")).toHaveText("$926,000");

  // Pure native HubSpot report (no creditsOutcome) has ZERO Penguin markers anywhere
  await page.getByTestId("analytics-all-reports").click();
  await page.getByTestId("open-report-expansion-mrr").click();
  await expect(page.getByTestId("analytics-report-title")).toHaveText("Expansion MRR by Account");
  await expect(page.getByTestId("analytics-kpi-value-exp-mrr")).toHaveText("$34,200");
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(0);

  await page.getByTestId("analytics-filter-enterprise").click();
  await expect(page.getByTestId("analytics-kpi-value-exp-mrr")).toHaveText("$14,800");
  await expect(page.getByTestId("analytics-table-row-saltmarsh")).toBeVisible();
  await expect(page.getByTestId("analytics-table-row-quarry")).toHaveCount(0);

  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});
