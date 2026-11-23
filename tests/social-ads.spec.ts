import { expect, test } from "@playwright/test";
import { openDemo, signIn } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test("launchpad shows all 5 live verticals including Healthcare", async ({ page }) => {
  for (const id of ["manufacturing", "saas", "financial-services", "professional-services", "healthcare"]) {
    await expect(page.getByTestId(`vertical-${id}`)).toBeVisible();
  }
  await page.getByTestId("vertical-healthcare").click();
  await expect(page.getByTestId("vertical-healthcare")).toContainText("Crestline Clinical Staffing");
  await expect(page.getByTestId("demo-social-ads")).toBeVisible();
  await expect(page.getByTestId("start-social-ads")).toBeVisible();
});

test("healthcare social-ads: interactive 13-step walkthrough, zero network requests, and Penguin marker rules", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  await openDemo(page, "social-ads", "healthcare");
  await page.waitForLoadState("networkidle");

  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/events")) return;
    if (["document", "fetch", "xhr", "script", "stylesheet"].includes(r.resourceType())) requests.push(`${r.resourceType()} ${r.url()}`);
  });

  // Step 1: Open the staffing campaign (native HubSpot, no Penguin markers)
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 13");
  await expect(page.getByTestId("campaigns-page")).toBeVisible();
  await expect(page.getByTestId("campaign-title")).toHaveText("Q1 Travel RN & ICU Surge Staffing");
  await expect(page.getByTestId("campaign-budget")).toContainText("$48,000");
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("campaign-plan-btn").click();

  // Step 2: Plan posts on the social calendar
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 2 of 13");
  await expect(page.getByTestId("social-calendar-view")).toBeVisible();
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("social-plan-month").click();
  await expect(page.getByTestId("cal-post-sp-10")).toBeVisible();
  await page.getByTestId("social-go-drafts").click();

  // Step 3: Approve brand-voice post drafts
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 3 of 13");
  await expect(page.getByTestId("social-drafts-view")).toBeVisible();
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("drafts-approve-all").click();
  await expect(page.getByTestId("drafts-all-approved")).toBeVisible();
  await page.getByTestId("social-back-calendar").click();

  // Step 4: Review post statuses on calendar (Published, Scheduled, Draft all visible & filterable)
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 4 of 13");
  await expect(page.getByTestId("status-filters")).toContainText("Published (4)");
  await expect(page.getByTestId("status-filters")).toContainText("Scheduled (7)");
  await expect(page.getByTestId("status-filters")).toContainText("Draft (1)");
  await page.getByTestId("filter-status-scheduled").click();
  await expect(page.getByTestId("cal-post-sp-7")).toHaveAttribute("data-status", "scheduled");
  await page.getByTestId("filter-status-all").click();
  await page.getByTestId("social-preview-ads").click();

  // Step 5 (Off-platform): Paid search ad in Google
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 5 of 13");
  await expect(page.getByTestId("offplatform-google")).toBeVisible();
  await expect(page.getByTestId("offplatform-back-hubspot")).toBeVisible();
  await expect(page.getByTestId("google-sponsored-ad")).toContainText("Crestline Clinical Staffing");
  await page.getByTestId("google-ad-headline").click();

  // Step 6 (Off-platform): Organic post and paid social ad in LinkedIn feed
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 6 of 13");
  await expect(page.getByTestId("offplatform-social-feed")).toBeVisible();
  await expect(page.getByTestId("social-organic-post")).toBeVisible();
  await expect(page.getByTestId("social-paid-ad")).toBeVisible();
  await page.getByTestId("social-ad-cta").click();

  // Step 7 (Off-platform): Hiring manager lands on landing page
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 7 of 13");
  await expect(page.getByTestId("offplatform-landing-page")).toBeVisible();
  await expect(page.getByTestId("offplatform-landing-page")).toContainText("utm_campaign=q1-travel-rn-surge");
  await page.getByTestId("landing-review-form").click();

  // Step 8 (Off-platform): Submit the staffing request form
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 8 of 13");
  await page.getByTestId("landing-submit").click();
  await expect(page.getByTestId("landing-submitted")).toBeVisible();
  await page.getByTestId("landing-go-hubspot").click();

  // Step 9 (HubSpot): Contact created with Paid Social source and campaign attached
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 9 of 13");
  await expect(page.getByTestId("record-title")).toHaveText("Rachel Morales");
  await expect(page.getByTestId("campaign-attribution-card")).toContainText("Q1 Travel RN & ICU Surge Staffing");
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("inspect-timeline-btn").click();

  // Step 10 (HubSpot): Contact timeline shows Google Search click, social activity, LinkedIn ad click, and form submission
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 10 of 13");
  const timeline = page.getByTestId("timeline");
  await expect(timeline).toContainText("Paid search ad click — Google Ads");
  await expect(timeline).toContainText("Social activity — LinkedIn organic post engagement");
  await expect(timeline).toContainText("Paid social ad click — LinkedIn Sponsored");
  await expect(timeline).toContainText("Form submission: Request your 48-hour RN shortlist");
  await page.getByTestId("continue-followup-btn").click();

  // Step 11 (HubSpot): Automated follow-up email goes out and rep is notified
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 11 of 13");
  await expect(page.getByTestId("followup-automation-card")).toBeVisible();
  await page.getByTestId("trigger-followup-btn").click();
  await expect(page.getByTestId("followup-sent-status")).toBeVisible();
  await expect(timeline).toContainText("Automated follow-up email sent");
  await expect(page.getByTestId("bell-count")).toBeVisible();
  await page.getByTestId("followup-to-social-inbox").click();

  // Step 12 (HubSpot): Social Inbox / Monitoring handles comments and messages in one place
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 12 of 13");
  await expect(page.getByTestId("social-inbox-view")).toBeVisible();
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("social-reply-send").click();
  await expect(page.getByTestId("social-reply-sent")).toBeVisible();
  await page.getByTestId("social-go-insights").click();

  // Step 13 (HubSpot): Insights dashboard with simulated spend, leads, CPL, pipeline + 1 custom Penguin marker (ATS attribution)
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 13 of 13");
  await expect(page.getByTestId("insights-page")).toBeVisible();
  await expect(page.getByTestId("insights-live-update")).toContainText("Rachel Morales");
  await expect(page.getByTestId("kpi-leads")).toHaveText("165");
  await expect(page.locator("[data-ext]")).toHaveCount(1);
  await expect(page.getByTestId("ext-pin-ats-placement-attribution")).toBeVisible();
  await page.getByTestId("insights-filter-google-search-ads").click();
  await expect(page.getByTestId("kpi-leads")).toHaveText("83");
  await page.getByTestId("insights-filter-all").click();
  await page.getByTestId("insights-finish").click();

  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
  await expect(page.getByTestId("end-card")).toBeVisible();
  await expect(page.getByTestId("end-penguin").locator("li")).toHaveCount(1);

  // Back & Reset checks
  await page.keyboard.press("Escape");
  await page.getByTestId("demo-back").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 13 of 13");
  await page.getByTestId("demo-reset").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 13");
  await expect(page.getByTestId("campaigns-page")).toBeVisible();

  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});

test("healthcare shell views (CRM, Revenue, Sales, Automation, Marketing) all render cleanly", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await openDemo(page, "social-ads", "healthcare");
  for (const section of ["campaigns", "social", "insights", "contacts", "companies", "deals", "inbox", "tasks", "quotes", "products", "prospecting", "workflows"]) {
    await page.getByTestId(`nav-${section}`).click();
    await expect(page).toHaveURL(new RegExp(`/${section}(/|$)`));
    await expect(page.getByTestId("shell-main")).not.toContainText("That page is not part of this demo");
  }
  expect(errors).toEqual([]);
});
