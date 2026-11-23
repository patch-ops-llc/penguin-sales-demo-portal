import { expect, test, type Page } from "@playwright/test";
import { openDemo, signIn } from "./helpers";

const STEP_BUDGET_MS = 250;

function watchRuntime(page: Page) {
  const requests: string[] = [];
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/events")) return;
    if (["document", "fetch", "xhr", "script", "stylesheet"].includes(r.resourceType())) {
      requests.push(`${r.resourceType()} ${r.url()}`);
    }
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(err.message));
  return { requests, consoleErrors, pageErrors };
}

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test("launchpad: Financial Services registers client-onboarding and complaint-sla under Service & CS", async ({ page }) => {
  await page.getByTestId("vertical-financial-services").click();
  await expect(page.getByTestId("demo-client-onboarding")).toBeVisible();
  await expect(page.getByTestId("demo-complaint-sla")).toBeVisible();

  await page.getByTestId("hub-filter-service").click();
  await expect(page.getByTestId("demo-customer-agent")).toBeVisible();
  await expect(page.getByTestId("demo-client-onboarding")).toBeVisible();
  await expect(page.getByTestId("demo-complaint-sla")).toBeVisible();
  await expect(page.getByTestId("demo-guided-quote")).toHaveCount(0);

  await page.getByTestId("hub-filter-all").click();
  await page.getByTestId("launchpad-search").fill("kyc");
  await expect(page.getByTestId("demo-client-onboarding")).toBeVisible();
  await expect(page.getByTestId("demo-complaint-sla")).toHaveCount(0);

  await page.getByTestId("launchpad-search").fill("regulatory");
  await expect(page.getByTestId("demo-complaint-sla")).toBeVisible();
  await expect(page.getByTestId("demo-client-onboarding")).toHaveCount(0);
});

test("Fintech #3 client-onboarding: full KYC/KYB checklist flow, strict Penguin marker boundary, Back/Reset, 0 network calls", async ({ page }) => {
  await openDemo(page, "client-onboarding", "financial-services");
  await page.waitForLoadState("networkidle");
  const rt = watchRuntime(page);

  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 5");

  // Step 1: Native Service Hub Client Onboarding & KYC queue — ZERO Penguin markers
  await expect(page.getByTestId("tickets-pipeline-title")).toContainText("Client Onboarding & KYC");
  await expect(page.getByTestId("tickets-workflow-banner")).toContainText("KYC-4812");
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(0);
  await page.getByTestId("open-primary-ticket").click();

  // Ticket workspace: ONLY kyc-verification-connector carries a Penguin marker
  await expect(page.getByTestId("ticket-workspace-page")).toBeVisible();
  await expect(page.getByTestId("ticket-number")).toHaveText("KYC-4812");
  await expect(page.getByTestId("ticket-compliance-note")).toContainText("EIN •••• 7419");
  await expect(page.getByTestId("ext-pin-kyc-verification-connector")).toBeVisible();
  await expect(page.locator("[data-ext]")).toHaveCount(1);
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(1);

  // Native ticket properties, checklist, outreach card, and timeline carry ZERO Penguin markers
  await expect(page.getByTestId("ticket-properties-column").locator("[data-ext]")).toHaveCount(0);
  await expect(page.getByTestId("ticket-center-column").locator("[data-ext]")).toHaveCount(0);

  // Step 2: Off-platform Client Document Collection Portal — ZERO Penguin markers
  await page.getByTestId("ticket-open-intake").click();
  await expect(page.getByTestId("ticket-offplatform-checklist")).toBeVisible();
  await expect(page.getByTestId("ticket-compliance-banner")).toContainText("Zero real PII");
  await expect(page.getByTestId("checklist-offplatform-card")).toContainText("48-hour reminder");
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("checklist-intake-submit").click();

  // Step 3: Back on KYC-4812 workspace — verify all 4 KYC/KYB checklist items
  await expect(page.getByTestId("ticket-workspace-page")).toBeVisible();
  await expect(page.getByTestId("ext-pin-kyc-verification-connector")).toBeVisible();
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(1);
  for (const itemId of ["kyc-entity-id", "kyb-ubo-form", "kyc-master-agreement", "kyc-loss-payee"]) {
    await page.getByTestId(`checklist-item-${itemId}`).click();
  }
  await expect(page.getByTestId("ticket-checklist-panel")).toContainText("4 / 4 verified");

  // Step 4: Send compliance approval email & mark Onboarding Complete
  await page.getByTestId("ticket-send-outreach").click();
  await expect(page.getByTestId("ticket-outreach-sent")).toBeVisible();
  await page.getByTestId("ticket-resolve-btn").click();
  await expect(page.getByTestId("ticket-resolved-banner")).toBeVisible();
  await expect(page.getByTestId("ticket-stage-badge")).toContainText("Onboarding Complete");

  // Step 5: Native Onboarding Time & KYC Completion report — ZERO Penguin markers
  await page.getByTestId("ticket-open-report").click();
  await expect(page.getByTestId("analytics-report-page")).toBeVisible();
  await expect(page.getByTestId("analytics-report-title")).toHaveText("Client Onboarding Time & KYC Completion");
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(0);

  // Interactive program filters update KPIs & table client-side with 0 network calls
  await page.getByTestId("analytics-filter-trac").click();
  await expect(page.getByTestId("analytics-kpi-value-time")).toHaveText("3.4 days");
  await expect(page.getByTestId("analytics-table-row-onb-kelbrook")).toBeVisible();
  await page.getByTestId("analytics-filter-efa").click();
  await expect(page.getByTestId("analytics-kpi-value-time")).toHaveText("3.9 days");
  await expect(page.getByTestId("analytics-table-row-onb-brackenridge")).toBeVisible();
  await page.getByTestId("analytics-filter-all").click();
  await expect(page.getByTestId("analytics-kpi-value-time")).toHaveText("3.8 days");

  // Complete review & verify End Card lists strictly 1 Penguin extension
  await page.getByTestId("analytics-complete-review").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
  await page.getByTestId("demo-wrap-up").click();
  await expect(page.getByTestId("end-card")).toBeVisible();
  await expect(page.getByTestId("end-penguin").locator("li")).toHaveCount(1);
  await expect(page.getByTestId("end-penguin")).toContainText("KYC / KYB Document Verification Connector");
  await page.keyboard.press("Escape");

  // Back & Reset controls
  await page.getByTestId("demo-back").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 5 of 5");
  await page.getByTestId("demo-reset").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 5");
  await expect(page.getByTestId("tickets-pipeline-title")).toContainText("Client Onboarding & KYC");

  expect(rt.requests).toEqual([]);
  expect(rt.consoleErrors).toEqual([]);
  expect(rt.pageErrors).toEqual([]);
});

test("Fintech #6 complaint-sla: full regulatory complaint SLA, 24h auto-ack, escalation, audit trail & report with 0 network calls", async ({ page }) => {
  await openDemo(page, "complaint-sla", "financial-services");
  await page.waitForLoadState("networkidle");
  const rt = watchRuntime(page);

  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 5");

  // Step 1: Off-platform regulatory complaint email intake — ZERO Penguin markers
  await expect(page.getByTestId("ticket-offplatform-sla")).toBeVisible();
  await expect(page.getByTestId("ticket-compliance-banner")).toContainText("Acct •••• 1960");
  await expect(page.getByTestId("sla-offplatform-card")).toContainText("Duplicate $685 Late Fee");
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("sla-intake-submit").click();

  // Step 2: Native Service Hub Regulatory Complaints & SLA pipeline — ZERO Penguin markers
  await expect(page.getByTestId("tickets-pipeline-title")).toContainText("Regulatory Complaints & SLA");
  await expect(page.getByTestId("tickets-workflow-banner")).toContainText("24h");
  await expect(page.getByTestId("tickets-workflow-banner")).toContainText("CMP-7304");
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("open-primary-ticket").click();

  // Step 3: Ticket workspace CMP-7304 — ONLY complaint-register-export carries a Penguin marker
  await expect(page.getByTestId("ticket-workspace-page")).toBeVisible();
  await expect(page.getByTestId("ticket-number")).toHaveText("CMP-7304");
  await expect(page.getByTestId("ticket-sla-card")).toContainText("SLA Overdue — Escalate");
  await expect(page.getByTestId("ticket-timeline-workflow")).toContainText("Automated 24h acknowledgement");
  await expect(page.getByTestId("ext-pin-complaint-register-export")).toBeVisible();
  await expect(page.locator("[data-ext]")).toHaveCount(1);
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(1);

  // Native properties, SLA timer, escalation controls, outreach, and timeline carry ZERO Penguin markers
  await expect(page.getByTestId("ticket-properties-column").locator("[data-ext]")).toHaveCount(0);
  await expect(page.getByTestId("ticket-center-column").locator("[data-ext]")).toHaveCount(0);

  // Trigger overdue manager escalation to Senior Credit & Compliance Officer Ruth Adeyemi
  await page.getByTestId("sla-escalate-btn").click();
  await expect(page.getByTestId("sla-escalated-status")).toContainText("Ruth Adeyemi");
  await expect(page.getByTestId("ticket-stage-badge")).toContainText("Manager Escalated");
  await expect(page.getByTestId("ticket-sla-card")).toContainText("Escalated to Manager");

  // Preview off-platform written resolution letter (0 Penguin markers)
  await page.getByTestId("sla-preview-letter").click();
  await expect(page.getByTestId("ticket-offplatform-secondary")).toBeVisible();
  await expect(page.getByTestId("ticket-offplatform-secondary")).toContainText("CR-2026-7304");
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("ticket-secondary-continue").click();
  await expect(page.getByTestId("ticket-workspace-page")).toBeVisible();

  // Step 4: Send formal resolution letter & log documented audit trail
  await page.getByTestId("ticket-send-outreach").click();
  await expect(page.getByTestId("ticket-outreach-sent")).toBeVisible();
  await page.getByTestId("ticket-resolve-btn").click();
  await expect(page.getByTestId("ticket-resolved-banner")).toBeVisible();
  await expect(page.getByTestId("ticket-stage-badge")).toContainText("Resolved & Archived");
  await expect(page.getByTestId("ticket-sla-card")).toContainText("Met within SLA");
  await expect(page.getByTestId("ticket-timeline-escalation")).toBeVisible();
  await expect(page.getByTestId("ticket-timeline-resolved")).toBeVisible();

  // Step 5: Native Complaints by Type, Resolution Time & SLA Compliance report — ZERO Penguin markers
  await page.getByTestId("ticket-open-report").click();
  await expect(page.getByTestId("analytics-report-page")).toBeVisible();
  await expect(page.getByTestId("analytics-report-title")).toHaveText("Complaints by Type, Resolution Time & SLA Compliance");
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(0);

  // Interactive category filter pills update KPIs & table client-side with 0 network calls
  await page.getByTestId("analytics-filter-billing").click();
  await expect(page.getByTestId("analytics-kpi-value-sla")).toHaveText("96.4%");
  await expect(page.getByTestId("analytics-table-row-cmp-7304")).toBeVisible();
  await page.getByTestId("analytics-filter-ach").click();
  await expect(page.getByTestId("analytics-kpi-value-sla")).toHaveText("100%");
  await page.getByTestId("analytics-filter-all").click();
  await expect(page.getByTestId("analytics-kpi-value-sla")).toHaveText("97.1%");

  // Complete review & verify End Card lists strictly 1 Penguin extension
  await page.getByTestId("analytics-complete-review").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
  await page.getByTestId("demo-wrap-up").click();
  await expect(page.getByTestId("end-card")).toBeVisible();
  await expect(page.getByTestId("end-penguin").locator("li")).toHaveCount(1);
  await expect(page.getByTestId("end-penguin")).toContainText("Regulatory Complaint Register Export & Audit Feed");
  await page.keyboard.press("Escape");

  // Back & Reset controls
  await page.getByTestId("demo-back").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 5 of 5");
  await page.getByTestId("demo-reset").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 5");
  await expect(page.getByTestId("ticket-offplatform-sla")).toBeVisible();

  expect(rt.requests).toEqual([]);
  expect(rt.consoleErrors).toEqual([]);
  expect(rt.pageErrors).toEqual([]);
});

for (const demoId of ["client-onboarding", "complaint-sla"] as const) {
  test(`performance: financial-services ${demoId} lands every step under ${STEP_BUDGET_MS}ms with 0 network calls`, async ({ page }) => {
    await openDemo(page, demoId, "financial-services");
    await page.waitForLoadState("networkidle");
    const rt = watchRuntime(page);

    const timings: number[] = [];
    while (await page.getByTestId("demo-next").count()) {
      const before = await page.getByTestId("demo-step-count").textContent();
      const elapsed = await page.evaluate(
        ([label]) =>
          new Promise<number>((resolve) => {
            const start = performance.now();
            const count = document.querySelector('[data-testid="demo-step-count"]')!;
            const observer = new MutationObserver(() => {
              if (count.textContent === label) return;
              observer.disconnect();
              requestAnimationFrame(() => requestAnimationFrame(() => resolve(performance.now() - start)));
            });
            observer.observe(document.body, { subtree: true, childList: true, characterData: true });
            document.querySelector<HTMLButtonElement>('[data-testid="demo-next"]')!.click();
          }),
        [before],
      );
      timings.push(Math.round(elapsed));
    }

    expect(timings.length).toBe(5);
    expect(Math.max(...timings)).toBeLessThan(STEP_BUDGET_MS);
    expect(rt.requests).toEqual([]);
    expect(rt.consoleErrors).toEqual([]);
    expect(rt.pageErrors).toEqual([]);
  });
}
