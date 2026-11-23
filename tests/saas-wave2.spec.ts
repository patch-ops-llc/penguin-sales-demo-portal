import { expect, test } from "@playwright/test";
import { openDemo, signIn, walk } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test("saas pql-trial-prospecting: full interactive flow, strict Penguin boundaries, 0 network calls, Back & Reset", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  await openDemo(page, "pql-trial-prospecting", "saas");
  await page.waitForLoadState("networkidle");

  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/events")) return;
    if (["document", "fetch", "xhr", "script", "stylesheet"].includes(r.resourceType())) {
      requests.push(`${r.resourceType()} ${r.url()}`);
    }
  });

  // Step 1: Off-platform free-trial workspace — ONLY product-usage-sync carries a Penguin marker
  await expect(page.getByTestId("offplatform-pql-trial")).toBeVisible();
  await expect(page.getByTestId("ext-pin-product-usage-sync")).toBeVisible();
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(1);
  await page.getByTestId("pql-trigger-milestone").click();

  // Step 2: Nadia Osei's HubSpot contact record — ZERO Penguin markers on native contact timeline & lead score
  await expect(page.getByTestId("pql-contact-banner")).toBeVisible();
  await expect(page.getByTestId("pql-contact-banner")).toContainText("88");
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(0);

  // Step 3: Breeze Prospecting Agent — ONLY product-usage-sync on the custom usage signal panel
  await page.getByTestId("pql-go-prospecting").click();
  await expect(page.getByTestId("prospecting-page")).toBeVisible();
  await expect(page.getByTestId("ap-erp-signal")).toBeVisible();
  await expect(page.getByTestId("ext-pin-product-usage-sync")).toBeVisible();
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(1);

  // Step 4: Buying group tab — ZERO Penguin markers
  await page.getByTestId("ap-tab-group").click();
  await expect(page.getByTestId("ap-group")).toBeVisible();
  await expect(page.getByTestId("ap-group")).toContainText("Nadia Osei");
  await expect(page.getByTestId("ap-group")).toContainText("Graham Kowalski");
  await expect(page.getByTestId("ap-group")).toContainText("Sonia Subramanian");
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(0);

  // Step 5 & 6: Breeze drafts & rep approves outreach — ZERO Penguin markers
  await page.getByTestId("ap-tab-outreach").click();
  await page.getByTestId("ap-draft").click();
  await expect(page.getByTestId("ap-send")).toBeVisible();
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(0);
  await page.getByTestId("ap-send").click();
  await expect(page.getByTestId("ap-sent")).toBeVisible();
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(0);

  // Step 7: Off-platform prospect inbox & meeting booking creates $51,000 deal — ZERO Penguin markers
  await page.getByTestId("ap-open-offplatform").click();
  await expect(page.getByTestId("offplatform-prospect-meeting")).toBeVisible();
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(0);
  await page.getByTestId("ap-book-meeting").click();
  await expect(page.getByTestId("ap-meeting-confirmed")).toBeVisible();
  await expect(page.getByTestId("ap-deal-created")).toContainText("$51,000");
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(0);

  // Step 8: Trial-to-paid Analytics report — ONLY credits-outcome-bridge carries a Penguin marker
  await page.getByTestId("ap-go-report").click();
  await expect(page.getByTestId("analytics-report-page")).toBeVisible();
  await expect(page.getByTestId("analytics-report-title")).toHaveText("Trial-to-Paid Conversion by Source");
  await expect(page.getByTestId("analytics-credits-card")).toBeVisible();
  await expect(page.getByTestId("ext-pin-credits-outcome-bridge")).toBeVisible();
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(1);

  // Filter pill updates KPIs client-side with zero network calls
  await page.getByTestId("analytics-filter-organic").click();
  await expect(page.getByTestId("analytics-kpi-conv")).toContainText("36.8%");
  await expect(page.getByTestId("analytics-table-row-alderwave")).toBeVisible();
  await expect(page.getByTestId("analytics-table-row-wrenfield")).toBeVisible();

  // End card names native HubSpot + strictly the 2 Penguin integrations
  await page.getByTestId("analytics-complete-review").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
  await page.getByTestId("demo-wrap-up").click();
  await expect(page.getByTestId("end-card")).toBeVisible();
  await expect(page.getByTestId("end-penguin").locator("li")).toHaveCount(2);
  await expect(page.getByTestId("end-penguin")).toContainText("Product Usage Event Sync");
  await expect(page.getByTestId("end-penguin")).toContainText("Credits-to-Pipeline Outcome Attribution");
  await page.keyboard.press("Escape");

  // Back & Reset controls work cleanly
  await page.getByTestId("demo-back").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 8 of 8");
  await page.getByTestId("demo-back").click();
  await expect(page.getByTestId("offplatform-prospect-meeting")).toBeVisible();
  await page.getByTestId("demo-reset").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText(/Step 1 of/);
  await expect(page.getByTestId("offplatform-pql-trial")).toBeVisible();

  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});

test("saas customer-onboarding: full checklist handoff, CSAT survey, Analytics report, strict Penguin boundary, 0 network calls", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  await openDemo(page, "customer-onboarding", "saas");
  await page.waitForLoadState("networkidle");

  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/events")) return;
    if (["document", "fetch", "xhr", "script", "stylesheet"].includes(r.resourceType())) {
      requests.push(`${r.resourceType()} ${r.url()}`);
    }
  });

  // Step 1: Native HubSpot Service Hub onboarding ticket queue — ZERO Penguin markers
  await expect(page.getByTestId("tickets-pipeline-title")).toContainText("Customer Onboarding");
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(0);
  await page.getByTestId("open-primary-ticket").click();

  // Ticket workspace opens — ONLY product-provisioning-card carries a Penguin marker
  await expect(page.getByTestId("ticket-workspace-page")).toBeVisible();
  await expect(page.getByTestId("ticket-number")).toHaveText("ONB-6201");
  await expect(page.getByTestId("ext-pin-product-provisioning-card")).toBeVisible();
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(1);

  // Step 2: Open off-platform customer kickoff portal directly from ticket workspace — ZERO Penguin markers
  await page.getByTestId("ticket-open-intake").click();
  await expect(page.getByTestId("ticket-offplatform-checklist")).toBeVisible();
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(0);
  await page.getByTestId("checklist-intake-submit").click();

  // Step 3: Back on ticket workspace — check off all 4 onboarding checklist items
  await expect(page.getByTestId("ticket-workspace-page")).toBeVisible();
  await expect(page.getByTestId("ext-pin-product-provisioning-card")).toBeVisible();
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(1);
  for (const itemId of ["chk-sso", "chk-connector", "chk-training", "chk-golive"]) {
    await page.getByTestId(`checklist-item-${itemId}`).click();
  }
  await expect(page.getByTestId("ticket-checklist-panel")).toContainText("4 / 4 verified");

  // Step 4: Send kickoff email & resolve ticket
  await page.getByTestId("ticket-send-outreach").click();
  await expect(page.getByTestId("ticket-outreach-sent")).toBeVisible();
  await page.getByTestId("ticket-resolve-btn").click();
  await expect(page.getByTestId("ticket-resolved-banner")).toBeVisible();
  await expect(page.getByTestId("ticket-stage-badge")).toContainText("Onboarded");

  // Step 5: Off-platform post-onboarding CSAT survey — ZERO Penguin markers
  await page.getByTestId("ticket-open-secondary").click();
  await expect(page.getByTestId("ticket-offplatform-secondary")).toBeVisible();
  await expect(page.getByTestId("ticket-secondary-csat")).toContainText("5 / 5 CSAT");
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(0);

  // Step 6: Native HubSpot Onboarding Analytics report — ZERO Penguin markers
  await page.getByTestId("ticket-secondary-continue").click();
  await expect(page.getByTestId("analytics-report-page")).toBeVisible();
  await expect(page.getByTestId("analytics-report-title")).toHaveText("Time to Onboard & Onboarding Status by Customer");
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(0);

  // Filter pill updates KPIs cleanly
  await page.getByTestId("analytics-filter-enterprise").click();
  await expect(page.getByTestId("analytics-kpi-time")).toContainText("28.4 days");
  await expect(page.getByTestId("analytics-table-row-onb-saltmarsh")).toBeVisible();
  await expect(page.getByTestId("analytics-table-row-onb-cindermoor")).toHaveCount(0);

  // End card & Back/Reset verification
  await page.getByTestId("analytics-complete-review").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
  await page.getByTestId("demo-wrap-up").click();
  await expect(page.getByTestId("end-penguin").locator("li")).toHaveCount(1);
  await expect(page.getByTestId("end-penguin")).toContainText("Product Provisioning Status Card");
  await page.keyboard.press("Escape");

  await page.getByTestId("demo-back").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 6 of 6");
  await page.getByTestId("demo-back").click();
  await expect(page.getByTestId("ticket-offplatform-secondary")).toBeVisible();
  await page.getByTestId("demo-reset").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText(/Step 1 of/);
  await expect(page.getByTestId("tickets-pipeline-title")).toContainText("Customer Onboarding");

  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});

test("saas back-office consolidation (SaaS #5): seat-limit alert and Expansion MRR report with 0 network calls", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  await openDemo(page, "back-office", "saas");
  await page.waitForLoadState("networkidle");

  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/events")) return;
    if (["document", "fetch", "xhr", "script", "stylesheet"].includes(r.resourceType())) {
      requests.push(`${r.resourceType()} ${r.url()}`);
    }
  });

  // Step 2: Quarrystone company record shows crisp seat-limit alert & report link inside Billing & Usage card
  await page.getByTestId("demo-next").click();
  await expect(page.getByTestId("erp-usage-alert")).toBeVisible();
  await expect(page.getByTestId("erp-usage-alert")).toContainText("97/100 Growth seats");
  await expect(page.getByTestId("erp-usage-alert")).toContainText("40/40");

  // Quick CTA jumps directly to Seat usage tab
  await page.getByTestId("erp-usage-alert-cta").click();
  await expect(page.getByTestId("erp-usage-LS-GRO-SEAT")).toContainText("97 of 100");
  await expect(page.getByTestId("erp-usage-LS-AI-SEAT")).toContainText("40 of 40");

  // Click report link directly into native Expansion MRR by Account report (0 Penguin markers)
  await page.getByTestId("erp-report-link").click();
  await expect(page.getByTestId("analytics-report-page")).toBeVisible();
  await expect(page.getByTestId("analytics-report-title")).toHaveText("Expansion MRR by Account");
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(0);

  // Reset and walk full 6-step script via Next
  await page.getByTestId("demo-reset").click();
  const steps = await walk(page);
  expect(steps).toBe(6);
  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
  await expect(page.getByTestId("analytics-report-title")).toHaveText("Expansion MRR by Account");

  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});

test("saas launchpad catalog: registers pql-trial-prospecting (Sales, AI) and customer-onboarding (Service) without duplicate back-office tile", async ({ page }) => {
  await page.getByTestId("vertical-saas").click();

  await expect(page.getByTestId("demo-pql-trial-prospecting")).toBeVisible();
  await expect(page.getByTestId("demo-pql-trial-prospecting").getByTestId("badge-ai")).toBeVisible();
  await expect(page.getByTestId("demo-customer-onboarding")).toBeVisible();
  await expect(page.getByTestId("demo-back-office")).toBeVisible();
  await expect(page.locator('[data-testid="demo-back-office"]')).toHaveCount(1);

  // Service & CS filter shows customer-onboarding
  await page.getByTestId("hub-filter-service").click();
  await expect(page.getByTestId("demo-customer-onboarding")).toBeVisible();

  // Sales & CPQ + AI / Breeze filter shows pql-trial-prospecting and ai-prospecting
  await page.getByTestId("hub-filter-sales").click();
  await page.getByTestId("filter-ai-toggle").click();
  await expect(page.getByTestId("demo-pql-trial-prospecting")).toBeVisible();
  await expect(page.getByTestId("demo-ai-prospecting")).toBeVisible();
});
