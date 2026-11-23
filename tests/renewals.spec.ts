import { expect, test } from "@playwright/test";
import { openDemo, signIn, walk } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test("launchpad: registers SaaS #3, SaaS #4, and IT Services #3 under the right Hubs", async ({ page }) => {
  // SaaS (Lumenstack)
  await page.getByTestId("vertical-saas").click();
  await expect(page.getByTestId("demo-premium-to-subscription")).toBeVisible();
  await expect(page.getByTestId("demo-renewal-churn-risk")).toBeVisible();

  await page.getByTestId("hub-filter-sales").click();
  await expect(page.getByTestId("demo-premium-to-subscription")).toBeVisible();
  await expect(page.getByTestId("demo-renewal-churn-risk")).toHaveCount(0);

  await page.getByTestId("hub-filter-service").click();
  await expect(page.getByTestId("demo-renewal-churn-risk")).toBeVisible();
  await expect(page.getByTestId("demo-premium-to-subscription")).toHaveCount(0);

  await page.getByTestId("hub-filter-all").click();

  // Professional & IT Services (Quillon Technology Partners)
  await page.getByTestId("vertical-professional-services").click();
  await expect(page.getByTestId("demo-contract-renewal")).toBeVisible();

  await page.getByTestId("hub-filter-sales").click();
  await expect(page.getByTestId("demo-contract-renewal")).toBeVisible();
});

test("saas premium-to-subscription (S3): full 6-step interactive walkthrough, 0 network calls, strict Penguin boundary, Next/Back/Reset", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  await openDemo(page, "premium-to-subscription", "saas");
  await page.waitForLoadState("networkidle");

  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/events")) return;
    if (["document", "fetch", "xhr", "script", "stylesheet"].includes(r.resourceType())) {
      requests.push(`${r.resourceType()} ${r.url()}`);
    }
  });

  // Step 1: Dual-pipeline Deals workspace (native HubSpot, ZERO Penguin markers)
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 6");
  await expect(page.getByTestId("renewals-dual-pipelines")).toBeVisible();
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("ren-close-premium-btn").click();
  await expect(page.getByTestId("hero-premium-stage-tag")).toContainText("Closed Won");
  await page.getByTestId("ren-open-checkout-btn").click();

  // Step 2: Off-platform Billing Checkout (ZERO Penguin markers)
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 2 of 6");
  await expect(page.getByTestId("renewals-billing-checkout")).toBeVisible();
  await expect(page.getByTestId("renewals-offplatform-pill")).toContainText("Off-platform view");
  await expect(page.getByTestId("renewals-return-hubspot")).toContainText("Return to HubSpot");
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("billing-option-quarterly").click();
  await expect(page.getByTestId("billing-option-quarterly")).toHaveAttribute("aria-pressed", "true");
  await page.getByTestId("billing-option-annual").click();
  await page.getByTestId("checkout-complete-btn").click();
  await expect(page.getByTestId("checkout-completed-panel")).toBeVisible();
  await page.getByTestId("checkout-open-sub-deal").click();

  // Step 3: Subscription Deal record — ONLY Penguin marker on billing-subscription-sync
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 3 of 6");
  await expect(page.getByTestId("record-title")).toContainText("Thistledown Veterinary Network: Annual Growth Subscription");
  await expect(page.getByTestId("deal-stage")).toHaveText("Active Subscription");
  await expect(page.getByTestId("s3-billing-sync-card")).toBeVisible();
  await expect(page.getByTestId("s3-cs-handoff-card").locator("[data-ext]")).toHaveCount(0);
  await expect(page.locator("[data-ext]")).toHaveCount(1);
  await expect(page.getByTestId("ext-pin-billing-subscription-sync")).toBeVisible();
  await page.getByTestId("s3-confirm-sync-btn").click();

  // Step 4: Native CS owner assignment & onboarding kickoff tasks
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 4 of 6");
  await expect(page.getByTestId("s3-sync-verified-tag")).toBeVisible();
  await page.getByTestId("s3-assign-cs-btn").click();
  await expect(page.getByTestId("s3-cs-assigned-panel")).toContainText("Nadia Kowalski");
  await expect(page.getByTestId("deal-stage")).toHaveText("Onboarding Kickoff");

  // Step 5: Open shared native Analytics report via dual-pipeline or direct link
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 5 of 6");
  await page.getByTestId("s3-back-to-pipelines").click();
  await expect(page.getByTestId("hero-subscription-deal-card")).toBeVisible();
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("ren-open-mrr-report").click();

  // Step 6: Native MRR, Conversion Rate & Upcoming Renewals report (ZERO Penguin markers)
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 6 of 6");
  await expect(page.getByTestId("analytics-report-page")).toBeVisible();
  await expect(page.getByTestId("analytics-report-title")).toHaveText("MRR, Conversion Rate & Upcoming Renewals");
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await expect(page.getByTestId("analytics-kpi-value-mrr")).toHaveText("$113,250");
  await page.getByTestId("analytics-filter-growth").click();
  await expect(page.getByTestId("analytics-kpi-value-mrr")).toHaveText("$64,850");
  await page.getByTestId("analytics-filter-all").click();
  await page.getByTestId("analytics-complete-review").click();

  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
  await page.getByTestId("demo-wrap-up").click();
  await expect(page.getByTestId("end-card")).toBeVisible();
  await expect(page.getByTestId("end-penguin")).toContainText("Billing Checkout & Subscription Sync");
  await expect(page.getByTestId("end-penguin").locator("li")).toHaveCount(1);
  await expect(page.getByTestId("end-native")).toContainText("Multiple Deals pipelines");
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("end-card")).toHaveCount(0);

  // Back & Reset + script walk via DemoBar Next
  await page.getByTestId("demo-back").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 6 of 6");
  await page.getByTestId("demo-reset").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 6");
  await expect(page.getByTestId("renewals-dual-pipelines")).toBeVisible();

  const walked = await walk(page);
  expect(walked).toBe(6);
  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");

  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});

test("saas renewal-churn-risk (S4): full 8-step interactive walkthrough, 0 network calls, strict Penguin boundary, Next/Back/Reset", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  await openDemo(page, "renewal-churn-risk", "saas");
  await page.waitForLoadState("networkidle");

  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/events")) return;
    if (["document", "fetch", "xhr", "script", "stylesheet"].includes(r.resourceType())) {
      requests.push(`${r.resourceType()} ${r.url()}`);
    }
  });

  // Step 1: 90-day Renewal Trigger Queue (native HubSpot, ZERO Penguin markers)
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 8");
  await expect(page.getByTestId("renewals-trigger-renewal-churn-risk")).toBeVisible();
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("ren-trigger-run").click();
  await expect(page.getByTestId("ren-trigger-confirmed")).toBeVisible();
  await page.getByTestId("ren-trigger-next").click();

  // Step 2: Company Record — ONLY Penguin marker on Account Health Score Card
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 2 of 8");
  await expect(page.getByTestId("record-title")).toHaveText("Northquay Marine Supply");
  await expect(page.getByTestId("account-health-score-card")).toBeVisible();
  await expect(page.getByTestId("health-score-value")).toHaveText("42/100");
  await expect(page.locator("[data-ext]")).toHaveCount(1);
  await expect(page.getByTestId("ext-pin-account-health-score")).toBeVisible();
  await page.getByTestId("health-flag-and-quote").click();

  // Step 3: Native Quote Editor (15% retention discount pre-applied) — verify ZERO Penguin markers in editor + line items editor, then request approval
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 3 of 8");
  await expect(page.getByTestId("quote-page")).toBeVisible();
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("quote-module-lines").locator("h2").click();
  await page.getByTestId("quote-edit-lines").click();
  await expect(page.getByTestId("line-items-editor")).toBeVisible();
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("line-editor-save").click();

  await page.getByTestId("quote-request-approval").click();
  await page.getByTestId("approval-note").fill("Account Health is 42/100; 15% retention discount saves $65.3K ARR.");
  await page.getByTestId("request-approval-submit").click();

  // Step 4: Switch to Deal Desk approver & approve (ZERO Penguin markers)
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 4 of 8");
  await page.getByTestId("view-as").click();
  await page.getByTestId("view-as-mei").click();
  await expect(page.getByTestId("approval-card")).toBeVisible();
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("approve").click();
  await page.getByTestId("approve-confirm").click();
  await expect(page.getByTestId("approval-done")).toBeVisible();

  // Step 5: Publish quote & open Buyer acceptance page (ZERO Penguin markers)
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 5 of 8");
  await page.getByTestId("quote-send").click();
  await page.getByTestId("share-close").click();
  await page.getByTestId("quote-view-as-buyer").click();

  // Step 6: Buyer accepts retention quote -> deal closes won (ZERO Penguin markers)
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 6 of 8");
  await expect(page.getByTestId("buyer-page")).toBeVisible();
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("buyer-accept").click();
  await expect(page.getByTestId("buyer-accepted")).toBeVisible();
  await page.getByTestId("buyer-view-deal").click();

  // Step 7: Deal closes Renewed Won -> open native Renewal Forecast report
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 7 of 8");
  await expect(page.getByTestId("deal-stage")).toHaveText("Renewed Won");
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("s4-open-report-btn").click();

  // Step 8: Native Renewal Forecast & Retention Risk report (ZERO Penguin markers)
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 8 of 8");
  await expect(page.getByTestId("analytics-report-page")).toBeVisible();
  await expect(page.getByTestId("analytics-report-title")).toHaveText("Renewal Forecast & Retention Risk");
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("analytics-filter-at-risk").click();
  await expect(page.getByTestId("analytics-kpi-value-saved-mrr")).toHaveText("$5,440");
  await page.getByTestId("analytics-filter-all").click();
  await page.getByTestId("analytics-complete-review").click();

  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
  await page.getByTestId("demo-wrap-up").click();
  await expect(page.getByTestId("end-card")).toBeVisible();
  await expect(page.getByTestId("end-penguin")).toContainText("Account Health Score Card");
  await expect(page.getByTestId("end-penguin").locator("li")).toHaveCount(1);
  await expect(page.getByTestId("end-native")).toContainText("Native Quote approval rules");
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("end-card")).toHaveCount(0);

  // Back & Reset + script walk via DemoBar Next
  await page.getByTestId("demo-back").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 8 of 8");
  await page.getByTestId("demo-reset").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 8");

  const walked = await walk(page);
  expect(walked).toBe(8);
  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");

  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});

test("professional-services contract-renewal (I3): full 7-step interactive walkthrough, 0 network calls, strict Penguin boundary, Next/Back/Reset", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  await openDemo(page, "contract-renewal", "professional-services");
  await page.waitForLoadState("networkidle");

  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/events")) return;
    if (["document", "fetch", "xhr", "script", "stylesheet"].includes(r.resourceType())) {
      requests.push(`${r.resourceType()} ${r.url()}`);
    }
  });

  // Step 1: 120-day Renewal Workflow trigger (native HubSpot, ZERO Penguin markers)
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 7");
  await expect(page.getByTestId("renewals-trigger-contract-renewal")).toBeVisible();
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("ren-trigger-run").click();
  await expect(page.getByTestId("ren-trigger-confirmed")).toBeVisible();
  await page.getByTestId("ren-trigger-next").click();

  // Step 2: Off-platform QBR Scheduler (ZERO Penguin markers)
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 2 of 7");
  await expect(page.getByTestId("renewals-qbr-scheduler")).toBeVisible();
  await expect(page.getByTestId("renewals-offplatform-pill")).toContainText("Off-platform view");
  await expect(page.getByTestId("renewals-return-hubspot")).toContainText("Return to HubSpot");
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("qbr-slot-slot-wed").click();
  await expect(page.getByTestId("qbr-slot-slot-wed")).toHaveAttribute("aria-pressed", "true");
  await page.getByTestId("qbr-slot-slot-tue").click();
  await page.getByTestId("qbr-confirm-btn").click();
  await expect(page.getByTestId("qbr-confirmed-panel")).toBeVisible();
  await page.getByTestId("qbr-open-deal").click();

  // Step 3: Renewal Deal — QBR booked, prepare renewal quote (PSA sync card has ONLY Penguin marker)
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 3 of 7");
  await expect(page.getByTestId("deal-stage")).toHaveText("QBR Scheduled");
  await expect(page.getByTestId("i3-native-renewal-card").locator("[data-ext]")).toHaveCount(0);
  await expect(page.locator("[data-ext]")).toHaveCount(1);
  await expect(page.getByTestId("ext-pin-psa-contract-sync")).toBeVisible();
  await page.getByTestId("i3-create-quote-btn").click();

  // Step 4: Native Renewal Quote Editor — publish (ZERO Penguin markers)
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 4 of 7");
  await expect(page.getByTestId("quote-page")).toBeVisible();
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("quote-send").click();
  await page.getByTestId("share-close").click();
  await page.getByTestId("quote-view-as-buyer").click();

  // Step 5: Client accepts renewal quote on Buyer page (ZERO Penguin markers)
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 5 of 7");
  await expect(page.getByTestId("buyer-page")).toBeVisible();
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("buyer-accept").click();
  await expect(page.getByTestId("buyer-accepted")).toBeVisible();
  await page.getByTestId("buyer-view-deal").click();

  // Step 6: Renewal Deal closed -> run PSA Agreement & Contract-Date Roll-Forward Sync (ONLY Penguin marker)
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 6 of 7");
  await expect(page.getByTestId("deal-stage")).toHaveText("Renewed & Synced");
  await expect(page.getByTestId("i3-psa-sync-card")).toBeVisible();
  await expect(page.locator("[data-ext]")).toHaveCount(1);
  await expect(page.getByTestId("ext-pin-psa-contract-sync")).toBeVisible();
  await page.getByTestId("i3-sync-psa-btn").click();
  await expect(page.getByTestId("i3-psa-synced-banner")).toContainText("AGR-20914");
  await page.getByTestId("i3-open-report-btn").click();

  // Step 7: Native Renewal Pipeline & At-Risk ARR report (ZERO Penguin markers)
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 7 of 7");
  await expect(page.getByTestId("analytics-report-page")).toBeVisible();
  await expect(page.getByTestId("analytics-report-title")).toHaveText("Renewal Pipeline & At-Risk ARR");
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await expect(page.getByTestId("analytics-kpi-value-pipeline")).toHaveText("$1,376,300");
  await page.getByTestId("analytics-filter-complete").click();
  await expect(page.getByTestId("analytics-kpi-value-pipeline")).toHaveText("$989,900");
  await page.getByTestId("analytics-filter-all").click();
  await page.getByTestId("analytics-complete-review").click();

  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
  await page.getByTestId("demo-wrap-up").click();
  await expect(page.getByTestId("end-card")).toBeVisible();
  await expect(page.getByTestId("end-penguin")).toContainText("PSA Agreement & Contract-Date Roll-Forward Sync");
  await expect(page.getByTestId("end-penguin").locator("li")).toHaveCount(1);
  await expect(page.getByTestId("end-native")).toContainText("HubSpot Meetings QBR scheduling");
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("end-card")).toHaveCount(0);

  // Back & Reset + script walk via DemoBar Next
  await page.getByTestId("demo-back").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 7 of 7");
  await page.getByTestId("demo-reset").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 7");

  const walked = await walk(page);
  expect(walked).toBe(7);
  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");

  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});
