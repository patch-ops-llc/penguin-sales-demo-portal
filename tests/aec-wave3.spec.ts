import { expect, test } from "@playwright/test";
import { openDemo, signIn, walk } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test("launchpad: balanced 6-vertical grid, AEC Hub/AI filters, search, and zero network calls", async ({ page }) => {
  await page.waitForLoadState("networkidle");

  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/events")) return;
    if (["document", "fetch", "xhr", "script", "stylesheet"].includes(r.resourceType())) {
      requests.push(`${r.resourceType()} ${r.url()}`);
    }
  });

  // Verify all 6 live verticals render in a single balanced row at 1280/1366/1440px with zero horizontal overflow
  for (const width of [1280, 1366, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    const layout = await page.evaluate(() => {
      const grid = document.querySelector('[data-testid="vertical-picker-grid"]')!;
      const cards = [...grid.children].map((el) => el.getBoundingClientRect());
      const rows = new Set(cards.map((r) => Math.round(r.top))).size;
      return {
        overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        rows,
        count: cards.length,
      };
    });
    expect(layout, `6-vertical picker at ${width}px`).toEqual({ overflowX: false, rows: 1, count: 6 });
  }

  await page.setViewportSize({ width: 1280, height: 800 });
  const aecCard = page.getByTestId("vertical-aec");
  await expect(aecCard).toContainText("AEC and construction");
  await expect(aecCard).toContainText("Meridian Civil & Builders");
  await expect(aecCard).toContainText("6 demos");
  await aecCard.click();

  // All 6 core RevOps/CPQ/Sales demos appear for AEC
  await expect(page.locator('[data-testid^="demo-"]')).toHaveCount(6);
  await expect(page.getByTestId("demo-guided-quote")).toContainText("Guided commercial bid quote");
  await expect(page.getByTestId("demo-discount-approval")).toContainText("VE margin & discount approval");
  await expect(page.getByTestId("demo-back-office")).toContainText("Procore & Sage Intacct job costing");
  await expect(page.getByTestId("demo-lead-capture")).toContainText("RFP & bid-invite intake");
  await expect(page.getByTestId("demo-email-to-deal")).toContainText("Bid inquiry email to deal");
  await expect(page.getByTestId("demo-ai-prospecting")).toContainText("Permit & RFP AI prospecting");

  // Hub filter pills work cleanly on AEC
  await page.getByTestId("hub-filter-sales").click();
  await expect(page.locator('[data-testid^="demo-"]')).toHaveCount(3);
  await page.getByTestId("hub-filter-ops").click();
  await expect(page.locator('[data-testid^="demo-"]')).toHaveCount(2);
  await page.getByTestId("hub-filter-marketing").click();
  await expect(page.locator('[data-testid^="demo-"]')).toHaveCount(1);
  await page.getByTestId("hub-filter-all").click();
  await expect(page.locator('[data-testid^="demo-"]')).toHaveCount(6);

  // AI / Breeze toggle filters to Permit & RFP AI prospecting
  await page.getByTestId("filter-ai-toggle").click();
  await expect(page.locator('[data-testid^="demo-"]')).toHaveCount(1);
  await expect(page.getByTestId("demo-ai-prospecting")).toBeVisible();
  await page.getByTestId("filter-ai-toggle").click();

  // Client-side search across AEC tags and summaries
  await page.getByTestId("launchpad-search").fill("procore");
  await expect(page.locator('[data-testid^="demo-"]')).toHaveCount(1);
  await expect(page.getByTestId("demo-back-office")).toBeVisible();

  await page.getByTestId("launchpad-search").fill("subcontractor");
  await expect(page.locator('[data-testid^="demo-"]')).toHaveCount(1);
  await expect(page.getByTestId("demo-discount-approval")).toBeVisible();

  await page.getByTestId("launchpad-search-clear").click();
  await expect(page.locator('[data-testid^="demo-"]')).toHaveCount(6);
  expect(requests).toEqual([]);
});

test("aec guided-quote: CSI division rules, branded bid quote, Penguin boundary, and 0 network calls", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  await openDemo(page, "guided-quote", "aec");
  await page.waitForLoadState("networkidle");

  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/events")) return;
    if (["document", "fetch", "xhr", "script", "stylesheet"].includes(r.resourceType())) requests.push(`${r.resourceType()} ${r.url()}`);
  });

  await page.getByTestId("demo-next").click();

  // Verify AEC compatibility constraints
  await page.getByTestId("gq-project-civil").click();
  await expect(page.getByTestId("gq-structure-timber")).toBeDisabled();
  await page.getByTestId("gq-delivery-stipulated").click();
  await expect(page.getByTestId("gq-mep-mission")).toBeDisabled();

  // Pick Redrock Transit Authority 45k sq ft GMP scope
  await page.getByTestId("gq-project-industrial").click();
  await page.getByTestId("gq-structure-steel").click();
  await page.getByTestId("gq-mep-evfleet").click();
  await page.getByTestId("gq-delivery-cmar").click();
  await page.getByTestId("gq-quantity-45").click();
  await page.getByTestId("gq-needby-60d").click();
  await page.getByTestId("gq-generate").click();

  await expect(page.getByTestId("gq-subtotal")).toHaveText("$2,703,600");
  await expect(page.getByTestId("gq-lead-check")).toContainText("On time");
  await expect(page.getByTestId("gq-lines")).toContainText("Div 02/31");
  await expect(page.getByTestId("gq-lines")).toContainText("MCB-D02-SITE-IND");
  await expect(page.getByTestId("gq-lines")).toContainText("MCB-D26-MEP-EVH");
  await expect(page.getByTestId("gq-lines")).toContainText("480V EV & Fleet MEP");
  expect(await page.getByTestId("gq-lines").textContent()).not.toContain("{");

  // Only the custom Guided Selling panel carries a Penguin pin on this screen
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(1);
  await expect(page.getByTestId("ext-pin-guided-selling")).toBeVisible();

  await page.getByTestId("gq-create-quote").click();
  await expect(page.getByTestId("quote-page")).toBeVisible();
  await expect(page.getByTestId("document-total")).toHaveText("$2,703,600.00");
  // Native HubSpot quote editor has zero Penguin pins on guided-quote
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(0);

  await walk(page);
  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});

test("aec discount-approval: 5% VE passes, 10% breaches subcontractor floor, VP Estimating approves", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  await openDemo(page, "discount-approval", "aec");
  await page.waitForLoadState("networkidle");

  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/events")) return;
    if (["document", "fetch", "xhr", "script", "stylesheet"].includes(r.resourceType())) requests.push(`${r.resourceType()} ${r.url()}`);
  });

  // 5% discount stays within 6% limit and above 18% subcontractor margin floor -> no approval needed
  await page.getByTestId("quote-module-lines").click();
  await page.getByTestId("quote-edit-lines").click();
  for (const idx of [0, 1, 2]) await page.getByTestId(`line-discount-${idx}`).fill("5");
  await expect(page.getByTestId("below-floor-0")).toHaveCount(0);
  await page.getByTestId("line-editor-save").click();
  await expect(page.getByRole("button", { name: "Share", exact: true })).toBeVisible();

  // Reset and run 10% VE discount through VP Estimating approval
  await page.getByTestId("demo-reset").click();
  await page.getByTestId("demo-next").click();
  await expect(page.getByTestId("document-total")).toHaveText("$434,520.00");
  await expect(page.getByTestId("quote-locked")).toContainText("discount over 6%, 3 lines below floor price");

  // Open Approvals panel and check Penguin markers ONLY on external ERP cost feed & floor rule
  await page.getByTestId("view-approval-conditions").click();
  await expect(page.getByTestId("ext-pin-erp-cost-feed")).toBeVisible();
  await expect(page.getByTestId("ext-pin-floor-price-rule")).toBeVisible();

  await page.getByTestId("demo-next").click();
  await expect(page.getByTestId("approval-card")).toContainText("Elena Vance requested approval from Derek Holloway");

  await walk(page);
  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
  await expect(page.getByTestId("approval-card")).toContainText("Derek Holloway approved the quote");
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});

test("aec back-office: Procore & Sage Intacct job-costing sync card, commitments, retainage, and CO quote", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  await openDemo(page, "back-office", "aec");
  await page.waitForLoadState("networkidle");

  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/events")) return;
    if (["document", "fetch", "xhr", "script", "stylesheet"].includes(r.resourceType())) requests.push(`${r.resourceType()} ${r.url()}`);
  });

  await page.getByTestId("demo-next").click();
  await expect(page.getByTestId("erp-card")).toContainText("Procore & Sage Intacct: Summit Valley Logistics");
  // Strictly 2 Penguin pins on the company record: synced job fields + Procore & Sage Intacct card
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(2);
  await expect(page.getByTestId("ext-pin-erp-synced-fields")).toBeVisible();
  await expect(page.getByTestId("ext-pin-erp-card")).toBeVisible();

  // Commitments & COs tab
  await page.getByTestId("erp-order-job-4410-co3").click();
  await expect(page.getByTestId("erp-order-lines")).toContainText("MCB-D03-SLAB");

  // Job Billing & Retainage tab
  await page.getByTestId("erp-tab-balance").click();
  await expect(page.getByTestId("erp-balance")).toContainText("AIA-APP-114");
  await expect(page.getByTestId("erp-balance")).toContainText("AIA-RET-108");

  // Division Unit Rates tab -> add 3 items to change-order quote
  await page.getByTestId("erp-tab-stock").click();
  await expect(page.getByTestId("erp-usage-MCB-D03-SLAB")).toContainText("3 concrete crews open");
  await expect(page.getByTestId("erp-usage-MCB-D08-DOCK")).toContainText("14 of 16");

  await walk(page);
  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
  await expect(page.getByTestId("quote-page")).toContainText("Summit Valley Logistics: Building B Change Order #4");
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});

test("aec lead-capture, email-to-deal, and ai-prospecting: full walkthroughs, Penguin rules, and 0 network calls", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  // 1. Lead capture: Municipal RFP intake -> score 91 -> Civil division estimator Nadia Al-Mansoor
  await openDemo(page, "lead-capture", "aec");
  await page.waitForLoadState("networkidle");
  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/events")) return;
    if (["document", "fetch", "xhr", "script", "stylesheet"].includes(r.resourceType())) requests.push(`${r.resourceType()} ${r.url()}`);
  });

  await expect(page.getByTestId("site-page")).toContainText("Submit a project RFP or bid invite");
  // Native public website form has 0 Penguin pins
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(0);
  await page.getByTestId("lc-submit").click();
  await expect(page.getByTestId("lc-submitted")).toContainText("Lead score set to 91");
  await page.getByTestId("lc-go-hubspot").click();
  await page.getByTestId("demo-next").click();
  await expect(page.getByTestId("score-value")).toHaveText("91");
  await expect(page.getByTestId("ext-pin-why-this-score")).toBeVisible();
  await walk(page);
  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
  await expect(page.getByTestId("slack-alert")).toContainText("#estimating-civil");

  // 2. Email to deal: Owner-rep ITB-2026-0418 -> confirm legacy DOCK-44 -> deal created
  await page.getByTestId("demo-switcher").click();
  await page.getByTestId("switch-email-to-deal").click();
  await page.getByTestId("thread-th-frontrange-itb").click();
  await page.getByTestId("parsed-review").click();
  await expect(page.getByTestId("ext-pin-rfq-parser")).toBeVisible();
  await expect(page.getByTestId("parsed-create-deal")).toBeDisabled();
  await page.getByTestId("parsed-suggest-MCB-D08-DOCK").click();
  await expect(page.getByTestId("parsed-create-deal")).toBeEnabled();
  await page.getByTestId("parsed-create-deal").click();
  await page.getByTestId("parsed-view-deal").click();
  await expect(page.getByText("Front Range Logistics: Aurora Cross-Dock Bid (ITB-2026-0418)").first()).toBeVisible();
  // Native HubSpot deal record has 0 Penguin pins
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(0);

  // 3. AI prospecting: Municipal Permit & RFP Signal -> Breeze Prospecting Agent
  await page.getByTestId("demo-switcher").click();
  await page.getByTestId("switch-ai-prospecting").click();
  await page.getByTestId("ap-account-co-clearwater-dev").click();
  await expect(page.getByTestId("ap-erp-signal")).toContainText("Municipal building-permit & RFP surge");
  // Strictly 1 Penguin pin on Signals tab (only the custom Municipal Permit & RFP Feed; native planning signal has 0)
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(1);
  await expect(page.getByTestId("ext-pin-erp-signal")).toBeVisible();

  // Native Breeze tabs (Why now, Buying group, Outreach) have 0 Penguin pins
  await page.getByTestId("ap-tab-why").click();
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(0);
  await page.getByTestId("ap-tab-group").click();
  await expect(page.getByTestId("ap-group")).toContainText("Keiko Takahashi");
  await expect(page.getByTestId("ap-group")).toContainText("Architect of Record");
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(0);

  await walk(page);
  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
  await expect(page.getByTestId("ap-sent")).toContainText("4 emails sent and logged");
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(0);

  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});
