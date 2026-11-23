import { expect, test } from "@playwright/test";
import { openDemo, signIn } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test("saas marketing studio: interactive walkthrough across all 15 steps, off-platform screens, and Penguin markers", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  await openDemo(page, "marketing-studio", "saas");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 15");

  // Step 1: Kestrel Ops ICP match company record + Penguin ICP fit marker.
  await expect(page).toHaveURL(/\/companies\/co-kestrel$/);
  await expect(page.getByTestId("ms-icp-card")).toBeVisible();
  await expect(page.getByTestId("ms-icp-score")).toHaveText("94 / 100");
  await expect(page.getByTestId("ext-pin-icp-fit-scoring")).toBeVisible();
  await page.getByTestId("ms-launch-studio").click();

  // Step 2: Marketing Studio brief (native — no Penguin pin).
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 2 of 15");
  await expect(page.getByTestId("ms-brief-stage")).toBeVisible();
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(0);
  await page.getByTestId("ms-brief-goal").fill("Book 15 qualified meetings and $500K+ pipeline from Tier 1 SaaS ICP accounts.");
  await page.getByTestId("ms-brief-submit").click();

  // Step 3: Campaign plan (toggle channel interactively, then confirm).
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 3 of 15");
  await expect(page.getByTestId("ms-plan-stage")).toBeVisible();
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(0);
  await page.getByTestId("ms-channel-blog").click();
  await expect(page.getByTestId("ms-channel-blog")).toContainText("Paused");
  await page.getByTestId("ms-channel-blog").click();
  await expect(page.getByTestId("ms-channel-blog")).toContainText("Included");
  await page.getByTestId("ms-plan-confirm").click();

  // Step 4: Brand Voice configured once.
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 4 of 15");
  await expect(page.getByTestId("ms-voice-stage")).toBeVisible();
  await page.getByTestId("ms-voice-product-led").click();
  await expect(page.getByTestId("ms-voice-sample")).toContainText("Connect Snowflake on Monday");
  await page.getByTestId("ms-voice-analytical").click();
  await expect(page.getByTestId("ms-voice-sample")).toContainText("68%");
  await page.getByTestId("ms-voice-apply").click();

  // Step 5: Source ebook asset.
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 5 of 15");
  await expect(page.getByTestId("ms-asset-stage")).toBeVisible();
  await expect(page.getByTestId("ms-asset-stage")).toContainText("The 2027 SaaS Analytics Playbook");
  await page.getByTestId("ms-asset-attach").click();

  // Step 6: Content Remix (1 source -> 4 formats).
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 6 of 15");
  await expect(page.getByTestId("ms-remix-stage")).toBeVisible();
  for (const id of ["email", "blog", "social", "landing"]) {
    await expect(page.getByTestId(`ms-remix-card-${id}`)).toBeVisible();
  }
  await page.getByTestId("ms-remix-generate").click();

  // Step 7: Review and approve assets (inspect, approve one individually, then approve all).
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 7 of 15");
  await expect(page.getByTestId("ms-approve-stage")).toBeVisible();
  await page.getByTestId("ms-review-tab-blog").click();
  await expect(page.getByTestId("ms-asset-body-blog")).toBeVisible();
  await page.getByTestId("ms-approve-blog").click();
  await expect(page.getByTestId("ms-approve-blog")).toBeDisabled();
  await page.getByTestId("ms-approve-all").click();

  // Step 8: Schedule tailored ICP outreach (check role personalization per contact).
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 8 of 15");
  await expect(page.getByTestId("ms-schedule-stage")).toBeVisible();
  await page.getByTestId("ms-recipient-ct-marcus").click();
  await expect(page.getByTestId("ms-outreach-subject")).toContainText("Marcus");
  await page.getByTestId("ms-recipient-ct-priya").click();
  await expect(page.getByTestId("ms-outreach-subject")).toContainText("Priya");
  await page.getByTestId("ms-recipient-ct-elena").click();
  await expect(page.getByTestId("ms-outreach-subject")).toContainText("Elena");
  await page.getByTestId("ms-schedule-send").click();

  // Step 9: Off-platform prospect inbox (no HubSpot chrome, clear Return to HubSpot).
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 9 of 15");
  await expect(page.getByTestId("off-platform-inbox")).toBeVisible();
  await expect(page.locator('nav[aria-label="Main"]')).toHaveCount(0);
  await expect(page.getByTestId("off-platform-return")).toBeVisible();
  await page.getByTestId("ms-email-cta").click();

  // Step 10: Off-platform buyer landing page (form submission).
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 10 of 15");
  await expect(page.getByTestId("off-platform-landing")).toBeVisible();
  await expect(page.locator('nav[aria-label="Main"]')).toHaveCount(0);
  await expect(page.getByTestId("off-platform-return")).toBeVisible();
  await page.getByTestId("ms-landing-submit").click();
  await expect(page.getByTestId("ms-landing-submitted")).toBeVisible();
  await page.getByTestId("ms-back-to-contact").click();

  // Step 11: Back in HubSpot — Elena Morales converted to MQL with timeline activity.
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 11 of 15");
  await expect(page).toHaveURL(/\/contacts\/ct-elena$/);
  await expect(page.locator('nav[aria-label="Main"]')).toBeVisible();
  await expect(page.getByTestId("ms-contact-converted")).toContainText("Marketing Qualified Lead");
  await expect(page.getByTestId("timeline")).toContainText("Form submission: The 2027 SaaS Analytics Playbook");
  await expect(page.getByTestId("timeline")).toContainText("Marketing email opened & clicked");
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(0);
  await page.getByTestId("ms-go-tasks").click();

  // Step 12: Rep notified (bell + Slack preview) & follow-up task created.
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 12 of 15");
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(page.getByTestId("bell-panel")).toBeVisible();
  await expect(page.getByTestId("slack-alert")).toContainText("#sales-west-icp");
  await expect(page.getByTestId("ms-task-banner")).toBeVisible();
  await page.getByTestId("ms-preview-rep-email").click();
  await page.getByTestId("ms-send-rep-followup").click();

  // Step 13: Off-platform rep follow-up email & meeting booking.
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 13 of 15");
  await expect(page.getByTestId("off-platform-meeting")).toBeVisible();
  await expect(page.locator('nav[aria-label="Main"]')).toHaveCount(0);
  await page.getByTestId("ms-slot-thu-pm").click();
  await page.getByTestId("ms-confirm-meeting").click();
  await expect(page.getByTestId("ms-meeting-confirmed")).toContainText("2:00 PM MT");
  await page.getByTestId("ms-back-to-deal").click();

  // Step 14: Back in HubSpot — Deal created from booked meeting.
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 14 of 15");
  await expect(page).toHaveURL(/\/deals\/dl-kestrel-icp$/);
  await expect(page.getByTestId("deal-amount")).toHaveText("$98,400");
  await expect(page.getByTestId("ms-deal-banner")).toContainText("2:00 PM MT");
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(0);
  await page.getByTestId("ms-go-dashboard").click();

  // Step 15: Campaign Performance Dashboard + Credits-to-Pipeline Penguin extension.
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 15 of 15");
  await expect(page.getByTestId("marketing-dashboard-page")).toBeVisible();
  await expect(page.getByTestId("ms-kpi-leads")).toContainText("42");
  await expect(page.getByTestId("ms-kpi-meetings")).toContainText("8");
  await expect(page.getByTestId("ms-kpi-pipeline")).toContainText("$624,000");
  await expect(page.getByTestId("ms-credits-used")).toContainText("310 credits");
  await expect(page.getByTestId("ext-pin-credits-outcome-bridge")).toBeVisible();

  await page.getByTestId("ms-scope-kestrel").click();
  await expect(page.getByTestId("ms-kpi-pipeline")).toContainText("$98,400");
  await page.getByTestId("ms-scope-all").click();

  await page.getByTestId("ms-finish-dashboard").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");

  await page.getByTestId("demo-wrap-up").click();
  await expect(page.getByTestId("end-card")).toBeVisible();
  await expect(page.getByTestId("end-penguin")).toContainText("Custom ICP Fit & Buying Committee Card");
  await expect(page.getByTestId("end-penguin")).toContainText("HubSpot Credits-to-Pipeline Outcome Attribution");
  expect(errors).toEqual([]);
});

test("saas marketing studio: Next, Back, Reset, and zero network requests across all 15 steps", async ({ page }) => {
  await openDemo(page, "marketing-studio", "saas");
  await page.waitForLoadState("networkidle");

  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/events")) return;
    if (["document", "fetch", "xhr", "script", "stylesheet"].includes(r.resourceType())) {
      requests.push(`${r.resourceType()} ${r.url()}`);
    }
  });

  for (let expected = 1; expected <= 15; expected++) {
    await expect(page.getByTestId("demo-step-count")).toHaveText(`Step ${expected} of 15`);
    await page.getByTestId("demo-next").click();
  }
  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");

  // Back across HubSpot and off-platform boundaries.
  await page.getByTestId("demo-back").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 15 of 15");
  await page.getByTestId("demo-back").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 14 of 15");
  await expect(page).toHaveURL(/\/deals\/dl-kestrel-icp$/);
  await page.getByTestId("demo-back").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 13 of 15");
  await expect(page.getByTestId("off-platform-meeting")).toBeVisible();

  // Reset back to Step 1 on Kestrel Ops.
  await page.getByTestId("demo-reset").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 15");
  await expect(page).toHaveURL(/\/companies\/co-kestrel$/);

  expect(requests).toEqual([]);
});
