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
  await expect(page.getByRole("button", { name: "Send quote" })).toBeVisible();
  await page.getByTestId("quote-terms").selectOption("net60");
  await expect(page.getByText("Non-standard payment terms: Net 60")).toBeVisible();
  await expect(page.getByRole("button", { name: "Request approval" })).toBeVisible();
  await page.getByTestId("quote-terms").selectOption("net30");
  await expect(page.getByRole("button", { name: "Send quote" })).toBeVisible();
});

test("the back-office card's third tab opens in every vertical", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const vertical of Object.keys(VERTICAL_DEMOS)) {
    await openDemo(page, "back-office", vertical);
    await page.getByTestId("demo-next").click();
    await page.getByTestId("erp-tab-stock").click();
    await expect(page.getByTestId("erp-stock").locator("tbody tr").first()).toBeVisible();
  }
  await expect(page.getByTestId("erp-usage-LS-GRO-SEAT")).toContainText("97 of 100");
  expect(errors).toEqual([]);
});
