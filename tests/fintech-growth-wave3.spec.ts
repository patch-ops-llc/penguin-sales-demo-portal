import { expect, test } from "@playwright/test";
import { openDemo, signIn } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test("launchpad: Financial Services shows Fintech #2 (Loan Application Pipeline) and Fintech #5 (Branch Launch) in their Hubs", async ({ page }) => {
  await page.getByTestId("vertical-financial-services").click();
  await expect(page.getByTestId("demo-loan-application-pipeline")).toBeVisible();
  await expect(page.getByTestId("demo-branch-launch-campaign")).toBeVisible();

  await page.getByTestId("hub-filter-sales").click();
  await expect(page.getByTestId("demo-loan-application-pipeline")).toBeVisible();
  await expect(page.getByTestId("demo-branch-launch-campaign")).toHaveCount(0);

  await page.getByTestId("hub-filter-marketing").click();
  await expect(page.getByTestId("demo-branch-launch-campaign")).toBeVisible();
  await expect(page.getByTestId("demo-loan-application-pipeline")).toHaveCount(0);

  await page.getByTestId("hub-filter-all").click();
  await page.getByTestId("launchpad-search").fill("branch");
  await expect(page.getByTestId("demo-branch-launch-campaign")).toBeVisible();
  await expect(page.getByTestId("demo-loan-application-pipeline")).toHaveCount(0);

  await page.getByTestId("launchpad-search").fill("underwriting");
  await expect(page.getByTestId("demo-loan-application-pipeline")).toBeVisible();
});

test("Fintech #2 (loan-application-pipeline): 6-step walkthrough, 0 network calls, strict Penguin marker boundary, Back/Reset", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  await openDemo(page, "loan-application-pipeline", "financial-services");
  await page.waitForLoadState("networkidle");

  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/events")) return;
    if (["document", "fetch", "xhr", "script", "stylesheet"].includes(r.resourceType())) {
      requests.push(`${r.resourceType()} ${r.url()}`);
    }
  });

  // Step 1: Off-platform online loan application form (zero Penguin markers, masked IDs & consent)
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 6");
  await expect(page.getByTestId("intake-submit-loan-application-pipeline")).toBeVisible();
  await expect(page.getByTestId("intake-offplatform-pill")).toContainText("Off-platform view");
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("intake-submit-btn").click();
  await expect(page.getByTestId("intake-submitted")).toBeVisible();
  await page.getByTestId("intake-view-deal").click();

  // Step 2: HubSpot Deal — Commercial Loan Origination routing + ONLY Penguin marker on LOS & Document Completeness Card
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 2 of 6");
  await expect(page.getByTestId("record-title")).toHaveText("Harborline Cold Freight LLC: $640K Refrigerated Fleet Loan (APP-2027-4102)");
  await expect(page.getByTestId("deal-stage")).toHaveText("Application Received");
  await expect(page.getByTestId("intake-routing-card")).toContainText("Ruth Adeyemi");
  await expect(page.getByTestId("intake-routing-card").locator("[data-ext]")).toHaveCount(0);
  await expect(page.getByTestId("intake-outreach-card").locator("[data-ext]")).toHaveCount(0);
  await expect(page.locator("[data-ext]")).toHaveCount(1);
  await expect(page.getByTestId("ext-pin-los-document-completeness")).toBeVisible();
  await page.getByTestId("intake-confirm-review").click();

  // Step 3: Native automated borrower missing-document reminder sequence -> Documents Requested
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 3 of 6");
  await expect(page.getByTestId("deal-stage")).toHaveText("Underwriting Review");
  await expect(page.getByTestId("intake-review-confirmed")).toBeVisible();
  await page.getByTestId("intake-send-outreach").click();
  await expect(page.getByTestId("intake-outreach-sent")).toBeVisible();
  await expect(page.getByTestId("deal-stage")).toHaveText("Documents Requested");
  await page.getByTestId("intake-open-followup").click();

  // Step 4: Off-platform borrower inbox & secure missing-doc upload (zero Penguin markers)
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 4 of 6");
  await expect(page.getByTestId("intake-followup-loan-application-pipeline")).toBeVisible();
  await expect(page.getByTestId("intake-offplatform-pill")).toContainText("Off-platform view");
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("intake-followup-confirm").click();
  await expect(page.getByTestId("intake-followup-confirmed")).toBeVisible();
  await page.getByTestId("intake-followup-return-deal").click();

  // Step 5: HubSpot Deal moves to Approved & Funded ($640,000) -> Open conversion report
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 5 of 6");
  await expect(page.getByTestId("deal-stage")).toHaveText("Approved & Funded");
  await expect(page.getByTestId("intake-completion-card")).toBeVisible();
  await expect(page.getByTestId("intake-completion-card")).toContainText("$640,000");
  await expect(page.getByTestId("intake-sync-complete")).toContainText("Commercial LOS");
  await expect(page.locator("[data-ext]")).toHaveCount(1);
  await expect(page.getByTestId("ext-pin-los-document-completeness")).toBeVisible();
  await page.getByTestId("intake-open-report").click();

  // Step 6: Native Application-to-Funded Conversion report (ZERO Penguin markers, tier filters)
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 6 of 6");
  await expect(page.getByTestId("analytics-report-page")).toBeVisible();
  await expect(page.getByTestId("analytics-report-title")).toHaveText("Application-to-Funded Conversion & Pipeline");
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await expect(page.getByTestId("analytics-kpi-value-submitted")).toHaveText("94");
  await page.getByTestId("analytics-filter-high-amount").click();
  await expect(page.getByTestId("analytics-kpi-value-submitted")).toHaveText("22");
  await page.getByTestId("analytics-filter-all").click();
  await expect(page.getByTestId("analytics-kpi-value-submitted")).toHaveText("94");
  await page.getByTestId("analytics-complete-review").click();

  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
  await page.getByTestId("demo-wrap-up").click();
  await expect(page.getByTestId("end-card")).toBeVisible();
  await expect(page.getByTestId("end-card")).toContainText("Loan Origination System (LOS) & Document Completeness Card");

  // Back & Reset work cleanly
  await page.getByTestId("end-card").getByRole("button", { name: "Close" }).click();
  await page.getByTestId("demo-back").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 6 of 6");
  await page.getByTestId("demo-reset").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 6");
  await expect(page.getByTestId("intake-submit-loan-application-pipeline")).toBeVisible();

  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});

test("Fintech #5 (branch-launch-campaign): 6-step walkthrough, 0 network calls, strict Penguin marker boundary, Back/Reset", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  await openDemo(page, "branch-launch-campaign", "financial-services");
  await page.waitForLoadState("networkidle");

  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/events")) return;
    if (["document", "fetch", "xhr", "script", "stylesheet"].includes(r.resourceType())) {
      requests.push(`${r.resourceType()} ${r.url()}`);
    }
  });

  // Step 1: Geo-targeted segment — ONLY Penguin marker is Core-Banking Geo-Eligibility sync card
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 6");
  await expect(page.getByTestId("bl-segment-view")).toBeVisible();
  await expect(page.getByTestId("ext-core-banking-geo-sync")).toContainText("Zero account balances");
  await expect(page.locator("[data-ext]")).toHaveCount(1);
  await expect(page.getByTestId("ext-pin-core-banking-geo-sync")).toBeVisible();
  await page.getByTestId("bl-submarket-filters").getByRole("button", { name: "South End & Uptown" }).click();
  await expect(page.getByTestId("bl-row-bl-tessa")).toBeVisible();
  await page.getByTestId("bl-submarket-all").click();
  await page.getByTestId("bl-go-studio").click();

  // Step 2: Native HubSpot Marketing Studio — email, paid local ads, social calendar (ZERO Penguin markers)
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 2 of 6");
  await expect(page.getByTestId("bl-studio-view")).toBeVisible();
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("bl-channel-ad").click();
  await expect(page.getByTestId("bl-preview-ad")).toBeVisible();
  await page.getByTestId("bl-channel-social").click();
  await expect(page.getByTestId("bl-preview-social")).toBeVisible();
  await page.getByTestId("bl-channel-email").click();
  await expect(page.getByTestId("bl-preview-email")).toBeVisible();
  await page.getByTestId("bl-launch-btn").click();
  await expect(page.getByTestId("bl-campaign-launched")).toBeVisible();
  await page.getByTestId("bl-open-offplatform").click();

  // Step 3: Off-platform prospect launch email & local ad engagement (ZERO Penguin markers)
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 3 of 6");
  await expect(page.getByTestId("bl-prospect-inbox")).toBeVisible();
  await expect(page.getByTestId("offplatform-back-hubspot")).toBeVisible();
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("bl-open-booking").click();

  // Step 4: UTM-attributed branch appointment landing page & slot booking
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 4 of 6");
  await expect(page.getByTestId("bl-booking-page")).toBeVisible();
  await page.getByTestId("bl-slot-slot-wed").click();
  await expect(page.getByTestId("bl-slot-slot-wed")).toHaveAttribute("aria-pressed", "true");
  await page.getByTestId("bl-confirm-booking").click();
  await expect(page.getByTestId("bl-booking-confirmed")).toBeVisible();
  await page.getByTestId("bl-verify-crm").click();

  // Step 5: HubSpot Campaign attribution, booked appointment & RM task verification
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 5 of 6");
  await expect(page.getByTestId("bl-booked-banner")).toBeVisible();
  await expect(page.getByTestId("bl-booked-banner")).toContainText("Tessa Halstead");
  await expect(page.getByTestId("bl-booked-banner")).toContainText("$420,000");
  await expect(page.locator("[data-ext]")).toHaveCount(1);
  await expect(page.getByTestId("ext-pin-core-banking-geo-sync")).toBeVisible();
  await page.getByTestId("bl-go-report").click();

  // Step 6: Native Campaign Attribution & New Accounts report (ZERO Penguin markers, channel filters)
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 6 of 6");
  await expect(page.getByTestId("analytics-report-page")).toBeVisible();
  await expect(page.getByTestId("analytics-report-title")).toHaveText("Campaign Attribution & New Accounts");
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await expect(page.getByTestId("analytics-kpi-value-leads")).toHaveText("263");
  await expect(page.getByTestId("analytics-kpi-value-accounts")).toHaveText("28");
  await page.getByTestId("analytics-filter-email").click();
  await expect(page.getByTestId("analytics-kpi-value-appointments")).toHaveText("34");
  await page.getByTestId("analytics-filter-paid-ads").click();
  await expect(page.getByTestId("analytics-kpi-value-appointments")).toHaveText("21");
  await page.getByTestId("analytics-filter-all").click();
  await expect(page.getByTestId("analytics-kpi-value-appointments")).toHaveText("69");
  await page.getByTestId("analytics-complete-review").click();

  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
  await page.getByTestId("demo-wrap-up").click();
  await expect(page.getByTestId("end-card")).toBeVisible();
  await expect(page.getByTestId("end-card")).toContainText("Core-Banking Geo-Eligibility & Product-Holding Segment Sync");

  // Back & Reset work cleanly
  await page.getByTestId("end-card").getByRole("button", { name: "Close" }).click();
  await page.getByTestId("demo-back").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 6 of 6");
  await page.getByTestId("demo-reset").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 6");
  await expect(page.getByTestId("bl-segment-view")).toBeVisible();

  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});

test("F4 consolidation (financial-services ai-prospecting): 7-step walkthrough, CFO meeting, Signal-to-Pipeline Attribution & strict Penguin markers", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  await openDemo(page, "ai-prospecting", "financial-services");
  await page.waitForLoadState("networkidle");

  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/events")) return;
    if (["document", "fetch", "xhr", "script", "stylesheet"].includes(r.resourceType())) {
      requests.push(`${r.resourceType()} ${r.url()}`);
    }
  });

  // Step 1: Select Tidewater Cold Storage signal
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 7");
  await page.getByTestId("ap-account-co-tidewater").click();

  // Step 2: Signals tab — ONLY erp-signal carries a Penguin marker
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 2 of 7");
  await expect(page.locator("[data-ext]")).toHaveCount(1);
  await expect(page.getByTestId("ext-pin-erp-signal")).toBeVisible();

  // Step 3: Why Now (native — 0 markers)
  await page.getByTestId("ap-tab-why").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 3 of 7");
  await expect(page.locator("[data-ext]")).toHaveCount(0);

  // Step 4: Buying group -> Draft outreach (native — 0 markers)
  await page.getByTestId("ap-tab-group").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 4 of 7");
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("ap-go-outreach").click();
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("ap-draft").click();

  // Step 5: Outreach drafts & human approval (native — 0 markers)
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 5 of 7");
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("ap-send").click();
  await expect(page.getByTestId("ap-open-offplatform")).toBeVisible();
  await page.getByTestId("ap-open-offplatform").click();

  // Step 6: Off-platform CFO Amara Nwosu inbox & meeting booking (native — 0 markers)
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 6 of 7");
  await expect(page.getByTestId("ap-practice-inbox")).toBeVisible();
  await expect(page.getByTestId("ap-practice-inbox")).toContainText("Amara Nwosu");
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("ap-slot-slot-wed").click();
  await page.getByTestId("ap-book-meeting").click();
  await expect(page.getByTestId("ap-meeting-confirmed")).toBeVisible();
  await expect(page.getByTestId("ap-deal-created-line")).toContainText("$1,450,000");
  await page.getByTestId("ap-go-report").click();

  // Step 7: Signal-to-Pipeline Attribution report — ONLY credits-outcome-bridge carries a Penguin marker
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 7 of 7");
  await expect(page.getByTestId("analytics-report-page")).toBeVisible();
  await expect(page.getByTestId("analytics-report-title")).toHaveText("Signal-to-Pipeline Attribution");
  await expect(page.getByTestId("analytics-kpi-value-pipeline")).toHaveText("$7,520,000");
  await expect(page.locator("[data-ext]")).toHaveCount(1);
  await expect(page.getByTestId("ext-pin-credits-outcome-bridge")).toBeVisible();
  await expect(page.getByTestId("analytics-kpi-grid").locator("[data-ext]")).toHaveCount(0);
  await expect(page.getByTestId("analytics-breakdowns").locator("[data-ext]")).toHaveCount(0);
  await expect(page.getByTestId("analytics-table-card").locator("[data-ext]")).toHaveCount(0);

  // Buying signal filters update KPIs & Credits panel client-side
  await page.getByTestId("analytics-filter-maturity").click();
  await expect(page.getByTestId("analytics-kpi-value-pipeline")).toHaveText("$3,250,000");
  await expect(page.getByTestId("analytics-credits-used")).toContainText("112 credits");
  await page.getByTestId("analytics-filter-all").click();
  await expect(page.getByTestId("analytics-kpi-value-pipeline")).toHaveText("$7,520,000");
  await page.getByTestId("analytics-complete-review").click();

  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
  await page.getByTestId("demo-wrap-up").click();
  await expect(page.getByTestId("end-card")).toBeVisible();
  await expect(page.getByTestId("end-card")).toContainText("HubSpot Credits-to-Outcome Attribution Panel");

  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});
