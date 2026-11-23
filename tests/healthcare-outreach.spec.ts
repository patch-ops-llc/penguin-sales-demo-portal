import { expect, test } from "@playwright/test";
import { openDemo, signIn } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test("launchpad registers Healthcare referral-source outreach (Sales + AI) and patient reactivation (Marketing)", async ({ page }) => {
  await page.getByTestId("vertical-healthcare").click();
  await expect(page.getByTestId("vertical-healthcare")).toContainText("Crestline Clinical Staffing & Specialty Clinics");

  await expect(page.getByTestId("demo-ai-prospecting")).toBeVisible();
  await expect(page.getByTestId("demo-ai-prospecting").getByTestId("badge-ai")).toBeVisible();
  await expect(page.getByTestId("demo-patient-reactivation")).toBeVisible();
  await expect(page.getByTestId("demo-patient-reactivation").getByTestId("badge-ai")).toHaveCount(0);

  // Hub filter checks
  await page.getByTestId("hub-filter-sales").click();
  await expect(page.getByTestId("demo-ai-prospecting")).toBeVisible();
  await expect(page.getByTestId("demo-patient-reactivation")).toHaveCount(0);

  await page.getByTestId("hub-filter-marketing").click();
  await expect(page.getByTestId("demo-patient-reactivation")).toBeVisible();
  await expect(page.getByTestId("demo-social-ads")).toBeVisible();
  await expect(page.getByTestId("demo-ai-prospecting")).toHaveCount(0);
});

test("healthcare ai-prospecting (H3): full 7-step walkthrough, Back/Reset, 0 network calls, and strict Penguin markers", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  await openDemo(page, "ai-prospecting", "healthcare");
  await page.waitForLoadState("networkidle");

  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/events")) return;
    if (["document", "fetch", "xhr", "script", "stylesheet"].includes(r.resourceType())) {
      requests.push(`${r.resourceType()} ${r.url()}`);
    }
  });

  // Step 1: Open flagged referring practice -> ONLY Referral-Volume Signal Feed has a Penguin marker
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 7");
  await expect(page.getByTestId("prospecting-page")).toBeVisible();
  await page.getByTestId("ap-account-co-summit-creek").click();
  await expect(page.getByTestId("ap-erp-signal")).toContainText("Referral-Volume Signal Feed");
  await expect(page.getByTestId("ap-erp-signal")).toContainText("30 referrals");
  await expect(page.locator("[data-ext]")).toHaveCount(1);
  await expect(page.getByTestId("ext-pin-erp-signal")).toBeVisible();

  // Step 2: Why now (new physician, new clinic location, referral drop) -> ZERO Penguin markers
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 2 of 7");
  await page.getByTestId("ap-tab-why").click();
  await expect(page.getByTestId("ap-why")).toContainText("Dr. Priya Nair");
  await expect(page.getByTestId("ap-why")).toContainText("Lakewood, CO");
  await expect(page.getByTestId("ap-why")).toContainText("Referral volume drop");
  await expect(page.locator("[data-ext]")).toHaveCount(0);

  // Step 3: Buying group (referring physicians + office manager) -> ZERO Penguin markers
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 3 of 7");
  await page.getByTestId("ap-see-group").click();
  await expect(page.getByTestId("ap-group")).toContainText("Dr. Priya Nair, MD");
  await expect(page.getByTestId("ap-group")).toContainText("Martha Lindholm");
  await expect(page.getByTestId("ap-group")).toContainText("Practice & Office Manager");
  await expect(page.locator("[data-ext]")).toHaveCount(0);

  // Step 4: Breeze drafts role-tailored outreach -> ZERO Penguin markers
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 4 of 7");
  await page.getByTestId("ap-go-outreach").click();
  await page.getByTestId("ap-draft").click();
  await expect(page.getByTestId("ap-outreach")).toBeVisible();
  await page.getByTestId("ap-member-bg-martha").click();
  await expect(page.getByTestId("ap-subject")).toContainText("Lakewood");
  await expect(page.locator("[data-ext]")).toHaveCount(0);

  // Step 5: Liaison approves and sends outreach -> ZERO Penguin markers
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 5 of 7");
  await page.getByTestId("ap-send").click();
  await expect(page.getByTestId("ap-sent")).toBeVisible();
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("ap-open-offplatform").click();

  // Step 6: Off-platform practice email inbox & lunch-and-learn booking -> ZERO Penguin markers
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 6 of 7");
  await expect(page.getByTestId("offplatform-prospect-meeting")).toBeVisible();
  await expect(page.getByTestId("ap-practice-inbox")).toContainText("Martha Lindholm");
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("ap-slot-slot-2").click();
  await page.getByTestId("ap-book-meeting").click();
  await expect(page.getByTestId("ap-meeting-confirmed")).toContainText("Thu, Jan 28");
  await page.getByTestId("ap-go-report").click();

  // Step 7: Shared Analytics report (Before/after referral volume + Credits & Outcomes) -> ONLY Credits card marked
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 7 of 7");
  await expect(page.getByTestId("analytics-report-page")).toBeVisible();
  await expect(page.getByTestId("analytics-report-title")).toHaveText("Before & After Referral Volume by Practice");
  await expect(page.getByTestId("analytics-kpi-value-referrals-after")).toHaveText("196");
  await expect(page.locator("[data-ext]")).toHaveCount(1);
  await expect(page.getByTestId("ext-pin-credits-outcome-bridge")).toBeVisible();
  await expect(page.getByTestId("analytics-kpi-grid").locator("[data-ext]")).toHaveCount(0);
  await expect(page.getByTestId("analytics-breakdowns").locator("[data-ext]")).toHaveCount(0);
  await expect(page.getByTestId("analytics-table-card").locator("[data-ext]")).toHaveCount(0);

  // Client-side filter pills switch slices with 0 network calls
  await page.getByTestId("analytics-filter-referral-drop").click();
  await expect(page.getByTestId("analytics-kpi-value-referrals-after")).toHaveText("104");
  await page.getByTestId("analytics-filter-all").click();
  await expect(page.getByTestId("analytics-kpi-value-referrals-after")).toHaveText("196");

  // Complete review & verify End Card split (2 Penguin extensions ONLY)
  await page.getByTestId("analytics-complete-review").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
  await page.getByTestId("demo-wrap-up").click();
  await expect(page.getByTestId("end-card")).toBeVisible();
  await expect(page.getByTestId("end-penguin").locator("li")).toHaveCount(2);
  await expect(page.getByTestId("end-penguin")).toContainText("Referral-Volume Signal Feed");
  await expect(page.getByTestId("end-penguin")).toContainText("HubSpot Credits & Outcomes Attribution");

  // Back & Reset checks
  await page.keyboard.press("Escape");
  await page.getByTestId("demo-back").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 7 of 7");
  await page.getByTestId("demo-back").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 6 of 7");
  await expect(page.getByTestId("offplatform-prospect-meeting")).toBeVisible();
  await page.getByTestId("demo-reset").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 7");
  await expect(page.getByTestId("prospecting-page")).toBeVisible();

  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});

test("healthcare patient-reactivation (H4): full 6-step walkthrough, auto-removal, Back/Reset, 0 network calls, and strict Penguin markers", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  await openDemo(page, "patient-reactivation", "healthcare");
  await page.waitForLoadState("networkidle");

  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/events")) return;
    if (["document", "fetch", "xhr", "script", "stylesheet"].includes(r.resourceType())) {
      requests.push(`${r.resourceType()} ${r.url()}`);
    }
  });

  // Step 1: Dynamic overdue segment -> ONLY EHR Annual-Visit Eligibility Sync card has a Penguin marker
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 6");
  await expect(page.getByTestId("pr-segment-view")).toBeVisible();
  await expect(page.getByTestId("pr-ehr-sync-card")).toContainText("last_visit_bucket");
  await expect(page.getByTestId("pr-ehr-sync-card")).toContainText("Zero PHI");
  await expect(page.getByTestId("pr-row-pat-camila")).toBeVisible();
  await expect(page.locator("[data-ext]")).toHaveCount(1);
  await expect(page.getByTestId("ext-pin-ehr-eligibility-sync")).toBeVisible();
  await expect(page.getByTestId("pr-segment-card").locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("pr-go-emails").click();

  // Step 2: 3-touch reminder email series preview & approval -> ZERO Penguin markers
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 2 of 6");
  await expect(page.getByTestId("pr-emails-view")).toBeVisible();
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("pr-touch-2").click();
  await expect(page.getByTestId("pr-preview-subject")).toContainText("Saturday");
  await page.getByTestId("pr-touch-3").click();
  await expect(page.getByTestId("pr-preview-subject")).toContainText("annual-visit");
  await page.getByTestId("pr-touch-1").click();
  await page.getByTestId("pr-approve-series").click();
  await expect(page.getByTestId("pr-series-approved")).toBeVisible();
  await page.getByTestId("pr-open-inbox").click();

  // Step 3: Off-platform patient reminder inbox -> ZERO Penguin markers
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 3 of 6");
  await expect(page.getByTestId("pr-patient-inbox")).toBeVisible();
  await expect(page.getByTestId("pr-inbox-subject")).toContainText("Camila");
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("pr-open-scheduler").click();

  // Step 4: Off-platform annual-visit booking -> ZERO Penguin markers
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 4 of 6");
  await expect(page.getByTestId("pr-clinic-scheduler")).toBeVisible();
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("pr-slot-slot-2").click();
  await page.getByTestId("pr-confirm-booking").click();
  await expect(page.getByTestId("pr-booking-confirmed")).toContainText("Fri, Feb 5");
  await page.getByTestId("pr-verify-segment").click();

  // Step 5: Booked patient automatically removed from dynamic overdue segment & logged on timeline
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 5 of 6");
  await expect(page.getByTestId("pr-auto-removed-banner")).toBeVisible();
  await expect(page.getByTestId("pr-active-count")).toHaveText("1,247");
  await expect(page.getByTestId("pr-row-pat-camila")).toHaveCount(0);
  await expect(page.getByTestId("pr-timeline-summary")).toContainText("Annual wellness visit booked");
  await expect(page.getByTestId("pr-timeline-summary")).toContainText("Auto-removed");
  await expect(page.locator("[data-ext]")).toHaveCount(1);
  await expect(page.getByTestId("ext-pin-ehr-eligibility-sync")).toBeVisible();

  // Inspect Camila's native Contact Record timeline (ZERO Penguin markers), then return
  await page.getByTestId("pr-view-contact").click();
  await expect(page.getByTestId("record-title")).toHaveText("Camila Reyes");
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("tab-activities").click();
  await expect(page.getByTestId("timeline")).toContainText("Annual wellness visit booked");
  await expect(page.getByTestId("timeline")).toContainText("Auto-removed");
  await page.getByTestId("nav-reactivation").click();
  await page.getByTestId("pr-go-report").click();

  // Step 6: Shared Analytics report (Reactivation rate by clinic location) -> ZERO Penguin markers
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 6 of 6");
  await expect(page.getByTestId("analytics-report-page")).toBeVisible();
  await expect(page.getByTestId("analytics-report-title")).toHaveText("Patient Reactivation Rate & Visits Booked by Location");
  await expect(page.getByTestId("analytics-kpi-value-rate")).toHaveText("31.1%");
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(0);

  await page.getByTestId("analytics-filter-denver").click();
  await expect(page.getByTestId("analytics-kpi-value-rate")).toHaveText("35.4%");
  await page.getByTestId("analytics-filter-all").click();
  await expect(page.getByTestId("analytics-kpi-value-rate")).toHaveText("31.1%");

  // Complete review & verify End Card split (ONLY 1 Penguin extension: EHR Annual-Visit Eligibility Sync)
  await page.getByTestId("analytics-complete-review").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
  await page.getByTestId("demo-wrap-up").click();
  await expect(page.getByTestId("end-card")).toBeVisible();
  await expect(page.getByTestId("end-penguin").locator("li")).toHaveCount(1);
  await expect(page.getByTestId("end-penguin")).toContainText("EHR Annual-Visit Eligibility Sync");

  // Back & Reset checks
  await page.keyboard.press("Escape");
  await page.getByTestId("demo-back").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 6 of 6");
  await page.getByTestId("demo-back").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 5 of 6");
  await page.getByTestId("demo-reset").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 6");
  await expect(page.getByTestId("pr-row-pat-camila")).toBeVisible();

  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});
