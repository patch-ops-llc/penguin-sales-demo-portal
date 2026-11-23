import { expect, test } from "@playwright/test";
import { openDemo, signIn, walk } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test("launchpad lists post-visit-feedback under Healthcare Service & CS hub", async ({ page }) => {
  await page.getByTestId("vertical-healthcare").click();
  await expect(page.getByTestId("vertical-healthcare")).toContainText("Crestline Clinical Staffing & Specialty Clinics");
  await expect(page.getByTestId("demo-post-visit-feedback")).toBeVisible();

  await page.getByTestId("hub-filter-service").click();
  await expect(page.getByTestId("demo-post-visit-feedback")).toBeVisible();
  await expect(page.getByTestId("start-post-visit-feedback")).toBeVisible();
});

test("healthcare post-visit-feedback: full interactive walkthrough, 0 network calls, 0 console errors, exact Penguin markers, and Back/Reset", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  await openDemo(page, "post-visit-feedback", "healthcare");
  await page.waitForLoadState("networkidle");

  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/events")) return;
    if (["document", "fetch", "xhr", "script", "stylesheet"].includes(r.resourceType())) {
      requests.push(`${r.resourceType()} ${r.url()}`);
    }
  });

  // Step 1 (Off-platform): Post-visit CSAT survey triggered on checkout
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 5");
  await expect(page.getByTestId("ticket-offplatform-feedback")).toBeVisible();
  await expect(page.getByTestId("survey-compliance-banner")).toContainText("Zero PHI");

  // Strict Penguin marker check: ONLY the EHR Visit-Completion Trigger card has a Penguin pin
  await expect(page.locator("[data-ext]")).toHaveCount(1);
  await expect(page.getByTestId("ext-pin-ehr-visit-trigger")).toBeVisible();
  await expect(page.getByTestId("post-visit-survey-card").locator("[data-ext]")).toHaveCount(0);

  // Select low score (2/5) and submit survey
  await page.getByTestId("survey-score-2").click();
  await expect(page.getByTestId("survey-score-2")).toHaveAttribute("aria-checked", "true");
  await expect(page.getByTestId("survey-threshold-note")).toContainText("low-score trigger");
  await page.getByTestId("survey-submit").click();

  // Step 2 (HubSpot Service Hub): Auto-opened ticket in Tickets pipeline routed to Location Manager
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 2 of 5");
  await expect(page.getByTestId("tickets-pipeline-page")).toBeVisible();
  await expect(page.getByTestId("tickets-workflow-banner")).toContainText("TKT-5104");
  await expect(page.getByTestId("tickets-workflow-banner")).toContainText("Valerie Chen");
  await expect(page.getByTestId("ticket-card-tkt-hc-feedback-1")).toContainText("2/5 CSAT");

  // Native Service Hub Tickets queue has ZERO Penguin markers
  await expect(page.locator("[data-ext]")).toHaveCount(0);

  // Board / List view toggle works client-side
  await page.getByTestId("tickets-view-list").click();
  await expect(page.getByTestId("tickets-list")).toBeVisible();
  await page.getByTestId("tickets-view-board").click();
  await expect(page.getByTestId("tickets-board")).toBeVisible();

  // Open the routed ticket
  await page.getByTestId("open-primary-ticket").click();

  // Step 3 (HubSpot Service Hub): Ticket workspace — empathetic outreach
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 3 of 5");
  await expect(page.getByTestId("ticket-workspace-page")).toBeVisible();
  await expect(page.getByTestId("ticket-number")).toHaveText("TKT-5104");
  await expect(page.getByTestId("ticket-sla-card")).toContainText("Due in 3h 45m");
  await expect(page.getByTestId("ticket-feedback-summary")).toContainText("2 / 5 CSAT");
  await expect(page.getByTestId("ticket-compliance-note")).toContainText("zero clinical notes");

  // Strict Penguin marker check on ticket record: ONLY the right-sidebar EHR trigger card
  await expect(page.locator("[data-ext]")).toHaveCount(1);
  await expect(page.getByTestId("ext-pin-ehr-visit-trigger")).toBeVisible();
  await expect(page.getByTestId("ticket-properties-column").locator("[data-ext]")).toHaveCount(0);
  await expect(page.getByTestId("ticket-center-column").locator("[data-ext]")).toHaveCount(0);

  await page.getByTestId("ticket-send-outreach").click();

  // Step 4 (HubSpot Service Hub): Follow-up operational note & ticket resolution
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 4 of 5");
  await expect(page.getByTestId("ticket-outreach-sent")).toBeVisible();
  await expect(page.getByTestId("ticket-stage-badge")).toHaveText("Manager Outreach Sent");
  await page.getByTestId("ticket-resolve-btn").click();

  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 5 of 5");
  await expect(page.getByTestId("ticket-resolved-banner")).toBeVisible();
  await expect(page.getByTestId("ticket-stage-badge")).toHaveText("Resolved");
  await expect(page.getByTestId("ticket-sla-card")).toContainText("Met within SLA");
  await expect(page.getByTestId("ticket-timeline")).toContainText("Post-visit CSAT survey submitted (2/5)");
  await expect(page.getByTestId("ticket-timeline")).toContainText("Patient Outreach Email sent");
  await expect(page.getByTestId("ticket-timeline")).toContainText("Ticket TKT-5104 closed");

  await page.getByTestId("ticket-open-report").click();

  // Step 5 (HubSpot Reporting): Shared Analytics dashboard — ZERO Penguin markers
  await expect(page.getByTestId("analytics-report-page")).toBeVisible();
  await expect(page.getByTestId("analytics-report-title")).toHaveText("Patient satisfaction & resolution speed by location");
  await expect(page.getByTestId("analytics-kpi-value-csat")).toHaveText("4.6 / 5");
  await expect(page.getByTestId("analytics-kpi-value-sla")).toHaveText("96.2%");
  await expect(page.locator("[data-ext]")).toHaveCount(0);

  // Interactive location filter pills work with 0 network calls
  await page.getByTestId("analytics-filter-scottsdale").click();
  await expect(page.getByTestId("analytics-kpi-value-csat")).toHaveText("4.5 / 5");
  await expect(page.getByTestId("analytics-table-row-tkt-5104")).toBeVisible();
  await page.getByTestId("analytics-filter-all").click();
  await expect(page.getByTestId("analytics-kpi-value-csat")).toHaveText("4.6 / 5");

  await page.getByTestId("analytics-complete-review").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");

  // Wrap-up End Card shows exact native vs Penguin split
  await page.getByTestId("demo-wrap-up").click();
  await expect(page.getByTestId("end-card")).toBeVisible();
  await expect(page.getByTestId("end-native").locator("li")).toHaveCount(5);
  await expect(page.getByTestId("end-penguin").locator("li")).toHaveCount(1);
  await expect(page.getByTestId("end-penguin")).toContainText("EHR Visit-Completion Trigger");

  // Back & Reset verification
  await page.keyboard.press("Escape");
  await page.getByTestId("demo-back").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 5 of 5");
  await expect(page.getByTestId("analytics-complete-review")).toBeVisible();

  await page.getByTestId("demo-back").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 4 of 5");
  await expect(page.getByTestId("ticket-resolve-btn")).toBeVisible();

  await page.getByTestId("demo-reset").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 5");
  await expect(page.getByTestId("ticket-offplatform-feedback")).toBeVisible();

  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});

test("healthcare post-visit-feedback: Next button completes all 5 steps cleanly", async ({ page }) => {
  await openDemo(page, "post-visit-feedback", "healthcare");
  const steps = await walk(page);
  expect(steps).toBe(5);
  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
  await expect(page.getByTestId("analytics-report-page")).toBeVisible();
});
