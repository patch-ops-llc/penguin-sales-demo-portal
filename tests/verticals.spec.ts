import { expect, test } from "@playwright/test";
import { openDemo, signIn, VERTICAL_DEMOS } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test("the launchpad offers each live vertical its own demos", async ({ page }) => {
  for (const [vertical, demos] of Object.entries(VERTICAL_DEMOS)) {
    await page.getByTestId(`vertical-${vertical}`).click();
    const offered = await page.locator('[data-testid^="start-"]').evaluateAll((els) => els.map((el) => el.getAttribute("data-testid")!.slice("start-".length)));
    expect(offered.sort()).toEqual([...demos].sort());
  }
});

test("switching vertical from the account menu changes the portal without a server round trip", async ({ page }) => {
  await openDemo(page, "guided-quote");
  await page.waitForLoadState("networkidle");
  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/events")) return;
    if (["document", "fetch", "xhr", "script", "stylesheet"].includes(r.resourceType())) requests.push(`${r.resourceType()} ${r.url()}`);
  });

  await page.getByTestId("account-menu").click();
  await page.getByTestId("account-saas").click();
  await expect(page).toHaveURL(/\/demo\/saas/);
  await expect(page.getByTestId("account-menu")).toContainText("Lumenstack");
  await page.getByTestId("nav-companies").click();
  await expect(page.getByText("Quarrystone Outfitters").first()).toBeVisible();
  await expect(page.getByText("Brightwater Packaging")).toHaveCount(0);

  await page.getByTestId("account-menu").click();
  await page.getByTestId("account-manufacturing").click();
  await expect(page).toHaveURL(/\/demo\/manufacturing/);
  await expect(page.getByTestId("account-menu")).toContainText("Halvorsen Motion");
  expect(requests).toEqual([]);
});

test("a vertical without a demo does not offer it", async ({ page }) => {
  await openDemo(page, "guided-quote", "saas");
  await page.getByTestId("demo-switcher").click();
  await expect(page.getByTestId("switch-discount-approval")).toBeVisible();
  await expect(page.getByTestId("switch-email-to-deal")).toHaveCount(0);
});

test("saas guided quote: packaging rules, volume tier, and recurring totals", async ({ page }) => {
  await openDemo(page, "guided-quote", "saas");
  await page.getByTestId("demo-next").click();
  await page.getByTestId("gq-plan-starter").click();
  await expect(page.getByTestId("gq-addons-sec")).toBeDisabled();
  await page.getByTestId("gq-plan-growth").click();
  await page.getByTestId("gq-addons-both").click();
  await page.getByTestId("gq-term-24").click();
  await page.getByTestId("gq-billing-annual").click();
  await page.getByTestId("gq-quantity-100").click();
  await page.getByTestId("gq-needby-4w").click();
  await page.getByTestId("gq-generate").click();
  await expect(page.getByTestId("gq-subtotal")).toHaveText("$106,400");
  await expect(page.getByTestId("gq-lead-check")).toContainText("On time");
  await page.getByTestId("gq-create-quote").click();
  await expect(page.getByTestId("quote-recurring").first()).toContainText("$100,400.00");
});

test("saas discount approval: non-standard payment terms alone need approval", async ({ page }) => {
  await openDemo(page, "discount-approval", "saas");
  await expect(page.getByRole("button", { name: "Share", exact: true })).toBeVisible();
  // Payment terms are set in the editor of the quote's Payments section.
  await page.getByTestId("quote-module-payments").click();
  await page.getByTestId("quote-terms").selectOption("net60");
  await expect(page.getByText("Non-standard payment terms: Net 60")).toBeVisible();
  await expect(page.getByRole("button", { name: "Request approval" })).toBeVisible();
  await page.getByTestId("quote-terms").selectOption("net30");
  await expect(page.getByRole("button", { name: "Share", exact: true })).toBeVisible();
});

test("the back-office card's third tab opens in every vertical", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const vertical of Object.keys(VERTICAL_DEMOS)) {
    await openDemo(page, "back-office", vertical);
    await page.getByTestId("demo-next").click();
    await page.getByTestId("erp-tab-stock").click();
    await expect(page.getByTestId("erp-stock").locator("tbody tr").first()).toBeVisible();
    if (vertical === "saas") await expect(page.getByTestId("erp-usage-LS-GRO-SEAT")).toContainText("97 of 100");
    if (vertical === "financial-services") await expect(page.getByTestId("erp-usage-FC-LINE-300-60")).toContainText("$304,793");
  }
  expect(errors).toEqual([]);
});

test("financial services guided proposal: payment from cost, down payment, tier, and term", async ({ page }) => {
  await openDemo(page, "guided-quote", "financial-services");
  await page.getByTestId("demo-next").click();
  await page.getByTestId("gq-cost-75").click();
  await expect(page.getByTestId("gq-program-fmv")).toBeDisabled();
  await page.getByTestId("gq-tier-c").click();
  await expect(page.getByTestId("gq-down-none")).toBeDisabled();
  await page.getByTestId("gq-program-efa").click();
  await page.getByTestId("gq-cost-250").click();
  await page.getByTestId("gq-down-ten").click();
  await page.getByTestId("gq-tier-a").click();
  await page.getByTestId("gq-quantity-60").click();
  await page.getByTestId("gq-needby-2w").click();
  await page.getByTestId("gq-generate").click();
  await expect(page.getByTestId("gq-lines")).toContainText("$225,000 financed over 60 months after 10% down. Fixed rate 7.25%.");
  await expect(page.getByTestId("gq-lines")).toContainText("$4,482");
  await expect(page.getByTestId("gq-subtotal")).toHaveText("$270,115");
  await expect(page.getByTestId("gq-lead-check")).toContainText("On time");
});

test("financial services rate exception: on the payment line only, with the approval activity naming both people", async ({ page }) => {
  await openDemo(page, "discount-approval", "financial-services");
  await page.getByTestId("quote-module-lines").click();
  await page.getByTestId("quote-edit-lines").click();
  await page.getByTestId("line-discount-0").fill("4");
  await expect(page.getByTestId("line-editor-approval")).toContainText("rate exception over 2%, 1 line below floor price");
  await expect(page.getByTestId("below-floor-0")).toBeVisible();
  await page.getByTestId("line-editor-save").click();
  await page.getByTestId("quote-request-approval").click();
  await page.getByTestId("request-approval-submit").click();
  await expect(page.getByTestId("approval-reasons")).toContainText("Rate exception over 2%");
  await expect(page.getByTestId("approval-reasons")).toContainText("1 line below floor price");
  await expect(page.getByTestId("approval-card")).toContainText("Dana Whitlock requested approval from Ruth Adeyemi");
  await page.getByTestId("demo-next").click();
  await page.getByTestId("demo-next").click();
  await page.getByTestId("demo-next").click();
  await expect(page.getByTestId("approval-card")).toContainText("Ruth Adeyemi approved the quote");
});

test("financial services rate exception: the scripted step leaves the fees at list price", async ({ page }) => {
  await openDemo(page, "discount-approval", "financial-services");
  await page.getByTestId("demo-next").click();
  await expect(page.getByTestId("quote-lines")).toContainText("4%");
  await expect(page.getByTestId("document-total")).toHaveText("$345,412.60");
  await expect(page.getByTestId("quote-locked")).toContainText("rate exception over 2%, 1 line below floor price");
});

test("financial services email to deal: the application is for the borrower, priced from the invoice", async ({ page }) => {
  await openDemo(page, "email-to-deal", "financial-services");
  await page.getByTestId("thread-th-stonegate-request").click();
  await page.getByTestId("parsed-review").click();
  await expect(page.getByTestId("parsed-create-deal")).toBeDisabled();
  await page.getByTestId("parsed-suggest-FC-EFU-PMT").click();
  await expect(page.getByTestId("parsed-total")).toHaveText("$127,980");
  await page.getByTestId("parsed-create-deal").click();
  await page.getByTestId("parsed-view-deal").click();
  await expect(page.getByText("Larkspur Excavating").first()).toBeVisible();
  await expect(page.getByText("Hank Brouwer").first()).toBeVisible();
  await expect(page.getByText("Funding Request Source")).toBeVisible();
});

test("manufacturing keeps its own wording where a vertical can now override it", async ({ page }) => {
  await openDemo(page, "discount-approval");
  await page.getByTestId("demo-next").click();
  await expect(page.getByTestId("quote-locked")).toContainText("discount over 10%");
  await expect(page.getByTestId("quote-lines")).toContainText("18%");
});

for (const [vertical, demos] of Object.entries(VERTICAL_DEMOS)) {
  test(`${vertical}: the demo bar shows every step title in full at laptop widths`, async ({ page }) => {
    test.setTimeout(60_000);
    for (const demo of demos) {
      await openDemo(page, demo, vertical);
      for (;;) {
        for (const width of [1440, 1366, 1280]) {
          await page.setViewportSize({ width, height: 800 });
          const title = page.getByTestId("demo-step-title");
          const state = await title.evaluate((el) => {
            const range = document.createRange();
            range.selectNodeContents(el);
            const lines = new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size;
            const bar = document.querySelector('[data-testid="demo-bar"]')!.getBoundingClientRect();
            const last = document.querySelector('[data-testid="demo-bar-hide"]')!.getBoundingClientRect();
            return { cut: el.scrollWidth > el.clientWidth + 0.5 || el.scrollHeight > el.clientHeight + 0.5, lines, barHeight: bar.height, controlsFit: last.right <= bar.right };
          });
          expect(state, `${demo} at ${width}px: "${await title.textContent()}"`).toEqual({ cut: false, lines: 1, barHeight: 60, controlsFit: true });
        }
        if (!(await page.getByTestId("demo-next").count())) break;
        const before = await page.getByTestId("demo-step-count").textContent();
        await page.getByTestId("demo-next").click();
        await expect(page.getByTestId("demo-step-count")).not.toHaveText(before ?? "");
      }
    }
  });
}
