import { expect, test, type Page } from "@playwright/test";
import { openDemo, signIn, walk } from "./helpers";

/** Watch for unexpected runtime network calls (excluding analytics telemetry) and console/page errors. */
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

test("launchpad: Quillon lists 8 demos including incident-comms (Service & CS) and updated lead-capture copy", async ({ page }) => {
  await page.getByTestId("vertical-professional-services").click();
  await expect(page.getByTestId("demo-incident-comms")).toBeVisible();
  await expect(page.getByTestId("demo-incident-comms")).toContainText("Incident communication");
  await expect(page.getByTestId("demo-lead-capture")).toContainText("findings report");

  // Hub filter: Service & CS shows customer-agent + incident-comms
  await page.getByTestId("hub-filter-service").click();
  await expect(page.getByTestId("demo-incident-comms")).toBeVisible();
  await expect(page.getByTestId("demo-customer-agent")).toBeVisible();
  await expect(page.getByTestId("demo-guided-quote")).toHaveCount(0);

  // Back to All hubs
  await page.getByTestId("hub-filter-all").click();
  await expect(page.getByTestId("demo-guided-quote")).toBeVisible();
});

test("IT #5 incident-comms: full interactive walkthrough, strict Penguin marker boundary, Back/Reset, 0 network calls", async ({ page }) => {
  await openDemo(page, "incident-comms", "professional-services");
  await page.waitForLoadState("networkidle");
  const rt = watchRuntime(page);

  // Step 1: Off-platform RMM outage alert — ONLY Penguin marker is rmm-outage-resolver
  await expect(page.getByTestId("ticket-offplatform-incident")).toBeVisible();
  await expect(page.getByTestId("incident-alert-card")).toContainText("Southeast Core VPN & Firewall Gateway (RDU-GW-02)");
  await expect(page.getByTestId("ext-rmm-outage-resolver")).toBeVisible();
  await expect(page.locator("[data-ext]")).toHaveCount(1);

  // Trigger HubSpot incident ticket & open pipeline -> incident record
  await page.getByTestId("incident-alert-submit").click();
  await expect(page.getByTestId("tickets-pipeline-page")).toBeVisible();
  await expect(page.locator("[data-ext]")).toHaveCount(0);

  await page.getByTestId("open-primary-ticket").click();
  await expect(page.getByTestId("ticket-workspace-page")).toBeVisible();
  await expect(page.getByTestId("ticket-number")).toContainText("INC-9042");

  // Ticket sidebar: ONLY Penguin marker is rmm-outage-resolver; 4 impacted managed companies visible
  await expect(page.getByTestId("ext-rmm-outage-resolver")).toBeVisible();
  await expect(page.locator("[data-ext]")).toHaveCount(1);
  await expect(page.getByTestId("ticket-incident-panel")).toContainText("Oriel Park Senior Living");
  await expect(page.getByTestId("ticket-incident-panel")).toContainText("Thornbury Legal Group");
  await expect(page.getByTestId("ticket-incident-panel")).toContainText("Wexcombe Plastics");
  await expect(page.getByTestId("ticket-incident-panel")).toContainText("Fenwick Lane Pediatrics");

  // Batch customer notification (native Service Hub)
  await page.getByTestId("incident-broadcast-btn").click();
  await expect(page.getByTestId("ticket-incident-panel")).toContainText("All 4 notified");

  // Optional native customer outage email preview (0 Penguin markers)
  await page.getByTestId("incident-preview-email").click();
  await expect(page.getByTestId("ticket-offplatform-secondary")).toBeVisible();
  await expect(page.getByTestId("ticket-offplatform-secondary")).toContainText("Vivian Achterberg");
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("ticket-secondary-continue").click();
  await expect(page.getByTestId("ticket-workspace-page")).toBeVisible();

  // Send recovery update & publish post-incident summary
  await page.getByTestId("ticket-send-outreach").click();
  await expect(page.getByTestId("ticket-outreach-sent")).toBeVisible();
  await page.getByTestId("ticket-resolve-btn").click();
  await expect(page.getByTestId("ticket-resolved-banner")).toBeVisible();

  // Open shared native Incidents, MTTR & Customers Affected report (0 Penguin markers!)
  await page.getByTestId("ticket-open-report").click();
  await expect(page.getByTestId("analytics-report-page")).toBeVisible();
  await expect(page.getByTestId("analytics-report-title")).toContainText("Incidents, MTTR & Customers Affected");
  await expect(page.locator("[data-ext]")).toHaveCount(0);

  // Exercise severity filter pills on the MTTR report
  await page.getByTestId("analytics-filter-sev1").click();
  await expect(page.getByTestId("analytics-kpi-value-incidents")).toContainText("4");
  await expect(page.getByTestId("analytics-kpi-value-mttr")).toContainText("36 min");
  await page.getByTestId("analytics-filter-all").click();
  await expect(page.getByTestId("analytics-kpi-value-incidents")).toContainText("18");

  // DemoBar Back & Reset work cleanly
  await page.getByTestId("demo-back").click();
  await expect(page.getByTestId("ticket-workspace-page")).toBeVisible();
  await page.getByTestId("demo-reset").click();
  await expect(page.getByTestId("ticket-offplatform-incident")).toBeVisible();
  await expect(page.getByTestId("demo-step-count")).toContainText("Step 1 of 5");

  expect(rt.requests).toEqual([]);
  expect(rt.consoleErrors).toEqual([]);
  expect(rt.pageErrors).toEqual([]);
});

test("IT #6 lead-capture: extended assessment-to-findings-to-proposal-to-funnel flow, strict markers, Back/Reset, 0 network calls", async ({ page }) => {
  await openDemo(page, "lead-capture", "professional-services");
  await page.waitForLoadState("networkidle");
  const rt = watchRuntime(page);

  // 9 total steps for Quillon (6 core + 3 assessment follow-up steps)
  await expect(page.getByTestId("demo-step-count")).toContainText("Step 1 of 9");

  // Step 1: Submit Security & compliance assessment request (Alderbrook Family Medicine)
  await page.getByTestId("lc-preset-hot").click();
  await page.getByTestId("lc-submit").click();
  await expect(page.getByTestId("lc-submitted")).toBeVisible();

  // Step 2 -> 3: Open contact record -> Why this score (ONLY Penguin marker here)
  await page.getByTestId("lc-go-hubspot").click();
  await page.getByTestId("demo-next").click();
  await expect(page.getByTestId("ext-why-this-score")).toBeVisible();
  await expect(page.locator("[data-ext]")).toHaveCount(1);

  // Step 3 -> 4 -> 5: Enriched company -> Score -> Workflow (territory-routing Penguin marker)
  await page.getByTestId("demo-next").click();
  await page.getByTestId("demo-next").click();
  await page.getByTestId("demo-next").click();
  await expect(page.getByTestId("ext-territory-routing")).toBeVisible();

  // Step 6: View as assigned rep (Imani Okoro) -> Tasks with Assessment Findings handoff banner
  await page.getByTestId("demo-next").click();
  await expect(page.getByTestId("lc-assessment-task-banner")).toBeVisible();

  // Step 7: Assessment Findings Report (native — 0 Penguin markers)
  await page.getByTestId("lc-open-findings").click();
  await expect(page.getByTestId("lc-findings-page")).toBeVisible();
  await expect(page.getByTestId("lc-findings-page")).toContainText("Alderbrook Family Medicine");
  await expect(page.locator("[data-ext]")).toHaveCount(0);

  // Send findings report email & log discovery call
  await page.getByTestId("lc-send-findings").click();
  await expect(page.getByTestId("lc-findings-sent-banner")).toBeVisible();

  // Step 8: Generate HubSpot proposal quote from findings (navigates to /quotes/q-lead-proposal, 0 Penguin markers)
  await page.getByTestId("lc-create-proposal").click();
  await expect(page.getByTestId("quote-assessment-banner")).toBeVisible();
  await expect(page.getByTestId("document-total")).toContainText("$133,980");
  await expect(page.locator("[data-ext]")).toHaveCount(0);

  // Step 9: Assessments to proposals to deals funnel report (native — 0 Penguin markers)
  await page.getByTestId("quote-open-funnel-report").click();
  await expect(page.getByTestId("analytics-report-page")).toBeVisible();
  await expect(page.getByTestId("analytics-report-title")).toContainText("Assessments to Proposals to Deals");
  await expect(page.locator("[data-ext]")).toHaveCount(0);

  // Exercise practice-area filter pills
  await page.getByTestId("analytics-filter-security").click();
  await expect(page.getByTestId("analytics-kpi-value-requests")).toContainText("38");
  await expect(page.getByTestId("analytics-kpi-value-won")).toContainText("$684,000");
  await page.getByTestId("analytics-filter-all").click();
  await expect(page.getByTestId("analytics-kpi-value-requests")).toContainText("78");

  // Back & Reset work cleanly
  await page.getByTestId("demo-back").click();
  await page.getByTestId("demo-reset").click();
  await expect(page.getByTestId("demo-step-count")).toContainText("Step 1 of 9");

  expect(rt.requests).toEqual([]);
  expect(rt.consoleErrors).toEqual([]);
  expect(rt.pageErrors).toEqual([]);
});

test("zero regression: Manufacturing lead-capture remains 6 steps unchanged", async ({ page }) => {
  await openDemo(page, "lead-capture", "manufacturing");
  await expect(page.getByTestId("demo-step-count")).toContainText("Step 1 of 6");
  const steps = await walk(page);
  expect(steps).toBe(6);
  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
});

test("IT #2 guided-quote & discount-approval: native Tier Win-Rate report link & filters (0 Penguin markers)", async ({ page }) => {
  await openDemo(page, "guided-quote", "professional-services");
  await page.waitForLoadState("networkidle");
  const rt = watchRuntime(page);

  // Deal record offers direct link to Win rate & average discount by service tier report
  await expect(page.getByTestId("deal-reporting-card")).toBeVisible();
  await page.getByTestId("deal-open-report").click();
  await expect(page.getByTestId("analytics-report-page")).toBeVisible();
  await expect(page.getByTestId("analytics-report-title")).toContainText("Win Rate & Average Discount by Service Tier");
  await expect(page.locator("[data-ext]")).toHaveCount(0);

  // Filter across Essentials / Complete / Complete Plus
  await page.getByTestId("analytics-filter-essentials").click();
  await expect(page.getByTestId("analytics-kpi-value-win-rate")).toContainText("31.4%");
  await page.getByTestId("analytics-filter-complete").click();
  await expect(page.getByTestId("analytics-kpi-value-win-rate")).toContainText("46.2%");
  await page.getByTestId("analytics-filter-plus").click();
  await expect(page.getByTestId("analytics-kpi-value-win-rate")).toContainText("52.9%");
  await page.getByTestId("analytics-filter-all").click();
  await expect(page.getByTestId("analytics-kpi-value-win-rate")).toContainText("44.2%");

  expect(rt.requests).toEqual([]);
  expect(rt.consoleErrors).toEqual([]);
  expect(rt.pageErrors).toEqual([]);

  // Discount approval quote also links cleanly to the same Tier Win-Rate report
  await openDemo(page, "discount-approval", "professional-services");
  await page.waitForLoadState("networkidle");
  const rt2 = watchRuntime(page);
  await expect(page.getByTestId("quote-open-report")).toBeVisible();
  await page.getByTestId("quote-open-report").click();
  await expect(page.getByTestId("analytics-report-title")).toContainText("Win Rate & Average Discount by Service Tier");
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  expect(rt2.requests).toEqual([]);
  expect(rt2.consoleErrors).toEqual([]);
  expect(rt2.pageErrors).toEqual([]);
});

test("IT #4 ai-prospecting: 7-step walkthrough with CIO meeting booking, Pipeline by Signal report & strict Penguin markers", async ({ page }) => {
  await openDemo(page, "ai-prospecting", "professional-services");
  await page.waitForLoadState("networkidle");
  const rt = watchRuntime(page);

  await expect(page.getByTestId("demo-step-count")).toContainText("Step 1 of 7");

  // Step 1: Signal list -> open Oriel Park Senior Living
  await page.getByTestId("demo-next").click();
  // Step 2: Signals tab — ONLY Penguin marker is erp-signal
  await expect(page.getByTestId("ext-erp-signal")).toBeVisible();
  await expect(page.locator("[data-ext]")).toHaveCount(1);

  // Step 3: Why Now (0 Penguin markers)
  await page.getByTestId("demo-next").click();
  await expect(page.locator("[data-ext]")).toHaveCount(0);

  // Step 4: Buying Group (0 Penguin markers)
  await page.getByTestId("demo-next").click();
  await expect(page.locator("[data-ext]")).toHaveCount(0);

  // Step 5: Outreach drafts (0 Penguin markers)
  await page.getByTestId("demo-next").click();
  await expect(page.locator("[data-ext]")).toHaveCount(0);

  // Step 6: Off-platform CIO inbox & meeting booking (0 Penguin markers)
  await page.getByTestId("demo-next").click();
  await expect(page.getByTestId("ap-practice-inbox")).toBeVisible();
  await expect(page.getByTestId("ap-practice-inbox")).toContainText("Ingrid Solberg");
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await page.getByTestId("ap-book-meeting").click();
  await expect(page.getByTestId("ap-meeting-confirmed")).toBeVisible();
  await expect(page.getByTestId("ap-deal-created-line")).toContainText("$194,000");

  // Step 7: Pipeline by Technology Signal Type report — ONLY Penguin marker is credits-outcome-bridge
  await page.getByTestId("ap-go-report").click();
  await expect(page.getByTestId("analytics-report-page")).toBeVisible();
  await expect(page.getByTestId("analytics-report-title")).toContainText("Pipeline by Technology Signal Type");
  await expect(page.getByTestId("ext-credits-outcome-bridge")).toBeVisible();
  await expect(page.locator("[data-ext]")).toHaveCount(1);

  // Exercise technology signal filter pills
  await page.getByTestId("analytics-filter-eos").click();
  await expect(page.getByTestId("analytics-kpi-value-pipeline")).toContainText("$462,000");
  await page.getByTestId("analytics-filter-cio").click();
  await expect(page.getByTestId("analytics-kpi-value-pipeline")).toContainText("$298,000");
  await page.getByTestId("analytics-filter-acquisition").click();
  await expect(page.getByTestId("analytics-kpi-value-pipeline")).toContainText("$246,000");
  await page.getByTestId("analytics-filter-renewal").click();
  await expect(page.getByTestId("analytics-kpi-value-pipeline")).toContainText("$178,000");
  await page.getByTestId("analytics-filter-all").click();
  await expect(page.getByTestId("analytics-kpi-value-pipeline")).toContainText("$1,184,000");

  // Back & Reset work cleanly
  await page.getByTestId("demo-back").click();
  await expect(page.getByTestId("ap-practice-inbox")).toBeVisible();
  await page.getByTestId("demo-reset").click();
  await expect(page.getByTestId("demo-step-count")).toContainText("Step 1 of 7");

  expect(rt.requests).toEqual([]);
  expect(rt.consoleErrors).toEqual([]);
  expect(rt.pageErrors).toEqual([]);
});
