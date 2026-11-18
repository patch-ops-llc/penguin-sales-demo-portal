import { expect, test } from "@playwright/test";
import { ALL_DEMOS, openDemo, signIn, walk } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

for (const { vertical, demo } of ALL_DEMOS) {
  test(`${vertical} ${demo}: runs start to finish and ends on the end card`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));

    await openDemo(page, demo, vertical);
    const steps = await walk(page);
    expect(steps).toBeGreaterThanOrEqual(4);
    await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");

    await page.getByTestId("demo-wrap-up").click();
    await expect(page.getByTestId("end-card")).toBeVisible();
    // Every demo names what is native and at least one thing Penguin built.
    expect(await page.getByTestId("end-native").locator("li").count()).toBeGreaterThan(0);
    expect(await page.getByTestId("end-penguin").locator("li").count()).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });
}

test("reset returns a finished demo to step 1", async ({ page }) => {
  await openDemo(page, "guided-quote");
  await walk(page);
  await page.getByTestId("demo-reset").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText(/Step 1 of/);
});

test("a demo survives a reload in the same tab", async ({ page }) => {
  await openDemo(page, "back-office");
  await page.getByTestId("demo-next").click();
  await page.getByTestId("demo-next").click();
  const step = await page.getByTestId("demo-step-count").textContent();
  await page.reload();
  await expect(page.getByTestId("demo-step-count")).toHaveText(step ?? "");
});

test("Penguin callouts: pin shows the callout, highlight mode shows them all", async ({ page }) => {
  await openDemo(page, "back-office");
  await page.getByTestId("demo-next").click();
  const pin = page.getByTestId("ext-pin-erp-card");
  await expect(pin).toBeVisible();
  await pin.hover();
  await expect(page.getByTestId("ext-callout-erp-card")).toBeVisible();
  await page.mouse.move(5, 300);
  await expect(page.getByTestId("ext-callout-erp-card")).toHaveCount(0);

  await page.getByTestId("demo-highlight").click();
  await expect(page.getByTestId("ext-callout-erp-card")).toBeVisible();
  await expect(page.getByTestId("ext-callout-erp-synced-fields")).toBeVisible();
});

test("switching demo keeps the portal and changes the script", async ({ page }) => {
  await openDemo(page, "guided-quote");
  await page.getByTestId("demo-switcher").click();
  await page.getByTestId("switch-ai-prospecting").click();
  await expect(page).toHaveURL(/\/demo\/manufacturing\/ai-prospecting\//);
  await expect(page.getByTestId("demo-step-count")).toHaveText(/Step 1 of/);
});
