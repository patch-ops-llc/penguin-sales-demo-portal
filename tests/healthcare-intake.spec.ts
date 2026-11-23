import { expect, test } from "@playwright/test";
import { openDemo, signIn } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test("launchpad: Healthcare shows unified brand and Hub-filtered tiles for H2 and H6", async ({ page }) => {
  await page.getByTestId("vertical-healthcare").click();
  await expect(page.getByTestId("vertical-healthcare")).toContainText("Crestline Clinical Staffing & Specialty Clinics");
  await expect(page.getByTestId("demo-social-ads")).toBeVisible();
  await expect(page.getByTestId("demo-referral-intake")).toBeVisible();
  await expect(page.getByTestId("demo-staffing-job-orders")).toBeVisible();

  await page.getByTestId("hub-filter-ops").click();
  await expect(page.getByTestId("demo-referral-intake")).toBeVisible();
  await expect(page.getByTestId("demo-staffing-job-orders")).toHaveCount(0);

  await page.getByTestId("hub-filter-sales").click();
  await expect(page.getByTestId("demo-staffing-job-orders")).toBeVisible();
  await expect(page.getByTestId("demo-referral-intake")).toHaveCount(0);

  await page.getByTestId("hub-filter-all").click();
  await expect(page.getByTestId("demo-referral-intake")).toBeVisible();
  await expect(page.getByTestId("demo-staffing-job-orders")).toBeVisible();
});

test("healthcare referral-intake (H2): interactive 6-step walkthrough, 0 network calls, strict Penguin marker boundary, Next/Back/Reset", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  await openDemo(page, "referral-intake", "healthcare");
  await page.waitForLoadState("networkidle");

  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/events")) return;
    if (["document", "fetch", "xhr", "script", "stylesheet"].includes(r.resourceType())) {
      requests.push(`${r.resourceType()} ${r.url()}`);
    }
  });

  // Step 1: Off-platform referring-clinic form (zero PHI, zero Penguin markers)
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 6");
  await expect(page.getByTestId("intake-submit-referral-intake")).toBeVisible();
  await expect(page.getByTestId("intake-offplatform-pill")).toContainText("Off-platform view");
  await expect(page.getByTestId("intake-return-hubspot")).toContainText("Return to HubSpot");
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("intake-submit-btn").click();
  await expect(page.getByTestId("intake-submitted")).toBeVisible();
  await page.getByTestId("intake-view-deal").click();

  // Step 2: HubSpot Deal record — native routing + ONLY Penguin marker on Referring-Provider Directory & EHR Referral Sync
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 2 of 6");
  await expect(page.getByTestId("record-title")).toHaveText("Oakwood Family Medicine → Cardiology (Scottsdale North)");
  await expect(page.getByTestId("deal-stage")).toHaveText("Referral Received");
  await expect(page.getByTestId("intake-routing-card")).toContainText("Devon Patel");
  await expect(page.getByTestId("intake-routing-card").locator("[data-ext]")).toHaveCount(0);
  await expect(page.getByTestId("intake-outreach-card").locator("[data-ext]")).toHaveCount(0);
  await expect(page.locator("[data-ext]")).toHaveCount(1);
  await expect(page.getByTestId("ext-pin-ehr-referral-sync")).toBeVisible();
  await page.getByTestId("intake-confirm-review").click();

  // Step 3: Native HubSpot coordinator outreach -> advances stage to Scheduling Link Sent
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 3 of 6");
  await expect(page.getByTestId("deal-stage")).toHaveText("Coordinator Review");
  await expect(page.getByTestId("intake-review-confirmed")).toBeVisible();
  await page.getByTestId("intake-send-outreach").click();
  await expect(page.getByTestId("intake-outreach-sent")).toBeVisible();
  await expect(page.getByTestId("deal-stage")).toHaveText("Scheduling Link Sent");
  await page.getByTestId("intake-open-followup").click();

  // Step 4: Off-platform patient inbox & scheduling slot picker (zero Penguin markers)
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 4 of 6");
  await expect(page.getByTestId("intake-followup-referral-intake")).toBeVisible();
  await expect(page.getByTestId("intake-offplatform-pill")).toContainText("Off-platform view");
  await expect(page.getByTestId("intake-return-hubspot")).toContainText("Return to HubSpot");
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("intake-option-slot-fri").click();
  await expect(page.getByTestId("intake-option-slot-fri")).toHaveAttribute("aria-pressed", "true");
  await page.getByTestId("intake-option-slot-thu").click();
  await page.getByTestId("intake-followup-confirm").click();
  await expect(page.getByTestId("intake-followup-confirmed")).toBeVisible();
  await page.getByTestId("intake-followup-return-deal").click();

  // Step 5: HubSpot Deal moves to Scheduled + EHR write-back confirmation -> open Analytics report
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 5 of 6");
  await expect(page.getByTestId("deal-stage")).toHaveText("Scheduled");
  await expect(page.getByTestId("intake-completion-card")).toBeVisible();
  await expect(page.getByTestId("intake-sync-complete")).toContainText("Oakwood Family Medicine EHR");
  await expect(page.locator("[data-ext]")).toHaveCount(1);
  await expect(page.getByTestId("ext-pin-ehr-referral-sync")).toBeVisible();
  await page.getByTestId("intake-open-report").click();

  // Step 6: Shared native Analytics funnel report (ZERO Penguin markers, interactive filters)
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 6 of 6");
  await expect(page.getByTestId("analytics-report-page")).toBeVisible();
  await expect(page.getByTestId("analytics-report-title")).toHaveText("Referral-to-Appointment Funnel by Specialty & Location");
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await expect(page.getByTestId("analytics-kpi-value-referrals")).toHaveText("234");
  await page.getByTestId("analytics-filter-cardiology-scottsdale").click();
  await expect(page.getByTestId("analytics-kpi-value-referrals")).toHaveText("94");
  await page.getByTestId("analytics-filter-all").click();
  await expect(page.getByTestId("analytics-kpi-value-referrals")).toHaveText("234");
  await page.getByTestId("analytics-complete-review").click();

  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
  await page.getByTestId("demo-wrap-up").click();
  await expect(page.getByTestId("end-card")).toBeVisible();
  await expect(page.getByTestId("end-penguin").locator("li")).toHaveCount(1);
  await expect(page.getByTestId("end-penguin")).toContainText("Referring-Provider Directory & EHR Referral Sync");

  // Back, Next, and Reset checks
  await page.keyboard.press("Escape");
  await page.getByTestId("demo-back").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 6 of 6");
  await page.getByTestId("demo-next").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
  await page.getByTestId("demo-reset").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 6");
  await expect(page.getByTestId("intake-submit-referral-intake")).toBeVisible();

  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});

test("healthcare staffing-job-orders (H6): interactive 6-step walkthrough, 0 network calls, strict Penguin marker boundary, Next/Back/Reset", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  await openDemo(page, "staffing-job-orders", "healthcare");
  await page.waitForLoadState("networkidle");

  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/events")) return;
    if (["document", "fetch", "xhr", "script", "stylesheet"].includes(r.resourceType())) {
      requests.push(`${r.resourceType()} ${r.url()}`);
    }
  });

  // Step 1: Off-platform hospital travel-RN request form (zero Penguin markers)
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 6");
  await expect(page.getByTestId("intake-submit-staffing-job-orders")).toBeVisible();
  await expect(page.getByTestId("intake-offplatform-pill")).toContainText("Off-platform view");
  await expect(page.getByTestId("intake-return-hubspot")).toContainText("Return to HubSpot");
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("intake-submit-btn").click();
  await expect(page.getByTestId("intake-submitted")).toBeVisible();
  await page.getByTestId("intake-view-deal").click();

  // Step 2: HubSpot Job-Order Deal — existing healthcare stages + ONLY Penguin marker on ATS/VMS Shortlist & Credentialing Card
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 2 of 6");
  await expect(page.getByTestId("record-title")).toHaveText("Summit Ridge Medical Center: 2 ICU Night-Shift Travel RNs");
  await expect(page.getByTestId("deal-stage")).toHaveText("Staffing Request");
  await expect(page.getByTestId("intake-routing-card")).toContainText("Marcus Delgado");
  await expect(page.getByTestId("intake-routing-card").locator("[data-ext]")).toHaveCount(0);
  await expect(page.getByTestId("intake-outreach-card").locator("[data-ext]")).toHaveCount(0);
  await expect(page.locator("[data-ext]")).toHaveCount(1);
  await expect(page.getByTestId("ext-pin-ats-shortlist-card")).toBeVisible();

  // Toggle candidate inclusion on the ATS card
  await page.getByTestId("intake-toggle-rn-priya").click();
  await expect(page.getByTestId("intake-toggle-rn-priya")).toHaveAttribute("aria-checked", "true");
  await page.getByTestId("intake-toggle-rn-priya").click();
  await expect(page.getByTestId("intake-toggle-rn-priya")).toHaveAttribute("aria-checked", "false");
  await page.getByTestId("intake-confirm-review").click();

  // Step 3: Native HubSpot recruiter shortlist outreach -> stage moves to Shortlist Sent
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 3 of 6");
  await expect(page.getByTestId("intake-review-confirmed")).toBeVisible();
  await page.getByTestId("intake-send-outreach").click();
  await expect(page.getByTestId("intake-outreach-sent")).toBeVisible();
  await expect(page.getByTestId("deal-stage")).toHaveText("Shortlist Sent");
  await page.getByTestId("intake-open-followup").click();

  // Step 4: Off-platform hospital hiring manager selects candidates (zero Penguin markers)
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 4 of 6");
  await expect(page.getByTestId("intake-followup-staffing-job-orders")).toBeVisible();
  await expect(page.getByTestId("intake-offplatform-pill")).toContainText("Off-platform view");
  await expect(page.getByTestId("intake-return-hubspot")).toContainText("Return to HubSpot");
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("intake-followup-confirm").click();
  await expect(page.getByTestId("intake-followup-confirmed")).toBeVisible();
  await page.getByTestId("intake-followup-return-deal").click();

  // Step 5: HubSpot Deal moves to Placed with $57,200 placement revenue + Bullhorn sync -> open Analytics report
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 5 of 6");
  await expect(page.getByTestId("deal-stage")).toHaveText("Placed");
  await expect(page.getByTestId("deal-amount")).toHaveText("$57,200");
  await expect(page.getByTestId("intake-completion-card")).toBeVisible();
  await expect(page.getByTestId("intake-sync-complete")).toContainText("Bullhorn ATS / VMS");
  await expect(page.locator("[data-ext]")).toHaveCount(1);
  await expect(page.getByTestId("ext-pin-ats-shortlist-card")).toBeVisible();
  await page.getByTestId("intake-open-report").click();

  // Step 6: Shared native Analytics Fill Rate & Time to Fill report (ZERO Penguin markers, interactive specialty filters)
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 6 of 6");
  await expect(page.getByTestId("analytics-report-page")).toBeVisible();
  await expect(page.getByTestId("analytics-report-title")).toHaveText("Fill Rate & Time to Fill by Specialty");
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await expect(page.getByTestId("analytics-kpi-value-fill-rate")).toHaveText("86.4%");
  await page.getByTestId("analytics-filter-icu").click();
  await expect(page.getByTestId("analytics-kpi-value-fill-rate")).toHaveText("88.9%");
  await page.getByTestId("analytics-filter-all").click();
  await expect(page.getByTestId("analytics-kpi-value-fill-rate")).toHaveText("86.4%");
  await page.getByTestId("analytics-complete-review").click();

  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
  await page.getByTestId("demo-wrap-up").click();
  await expect(page.getByTestId("end-card")).toBeVisible();
  await expect(page.getByTestId("end-penguin").locator("li")).toHaveCount(1);
  await expect(page.getByTestId("end-penguin")).toContainText("ATS / VMS Shortlist & Credentialing Card");

  // Back, Next, and Reset checks
  await page.keyboard.press("Escape");
  await page.getByTestId("demo-back").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 6 of 6");
  await page.getByTestId("demo-next").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
  await page.getByTestId("demo-reset").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 6");
  await expect(page.getByTestId("intake-submit-staffing-job-orders")).toBeVisible();

  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});
