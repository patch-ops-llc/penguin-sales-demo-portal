import { expect, test } from "@playwright/test";
import { ALL_DEMOS, openDemo, signIn } from "./helpers";

/** Budget for one in-demo step: click to the next screen being on the page. */
const STEP_BUDGET_MS = 250;
/** Budget for the JavaScript the demo shell loads, compressed, on a first visit. */
const SHELL_JS_BUDGET_KB = 250;

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test("in-demo navigation makes no server round trip", async ({ page }) => {
  await openDemo(page, "guided-quote");
  await page.waitForLoadState("networkidle");

  // Anything that would mean the server took part in a screen change: documents, data, scripts, styles.
  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/events")) return; // the logging beacon, fire and forget
    if (["document", "fetch", "xhr", "script", "stylesheet"].includes(r.resourceType())) requests.push(`${r.resourceType()} ${r.url()}`);
  });

  while (await page.getByTestId("demo-next").count()) await page.getByTestId("demo-next").click();
  await page.goBack();
  await page.goForward();
  for (const section of ["contacts", "companies", "deals", "quotes", "tasks", "products", "workflows", "inbox", "prospecting"]) {
    await page.getByTestId(`nav-${section}`).click();
    await expect(page).toHaveURL(new RegExp(`/${section}$`));
  }
  await page.getByTestId("demo-switcher").click();
  await page.getByTestId("switch-discount-approval").click();
  await page.getByTestId("demo-reset").click();

  expect(requests).toEqual([]);
});

for (const { vertical, demo } of ALL_DEMOS) {
  test(`${vertical} ${demo}: every step lands inside the ${STEP_BUDGET_MS} ms budget`, async ({ page }) => {
    await openDemo(page, demo, vertical);
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
              // Two frames, so the measured time includes the paint of the new screen.
              requestAnimationFrame(() => requestAnimationFrame(() => resolve(performance.now() - start)));
            });
            observer.observe(document.body, { subtree: true, childList: true, characterData: true });
            document.querySelector<HTMLButtonElement>('[data-testid="demo-next"]')!.click();
          }),
        [before],
      );
      timings.push(Math.round(elapsed));
    }
    console.log(`${vertical} ${demo}: step times in ms: ${timings.join(", ")}`);
    expect(Math.max(...timings)).toBeLessThan(STEP_BUDGET_MS);
  });
}

test(`the demo shell loads under ${SHELL_JS_BUDGET_KB} KB of compressed JavaScript`, async ({ page }) => {
  await openDemo(page, "guided-quote");
  await page.waitForLoadState("networkidle");
  const scripts = await page.evaluate(() =>
    (performance.getEntriesByType("resource") as PerformanceResourceTiming[]).filter((r) => r.initiatorType === "script" || r.name.endsWith(".js")).map((r) => r.encodedBodySize),
  );
  const kb = scripts.reduce((sum, size) => sum + size, 0) / 1024;
  console.log(`demo shell: ${scripts.length} scripts, ${kb.toFixed(1)} KB compressed`);
  expect(kb).toBeGreaterThan(0);
  expect(kb).toBeLessThan(SHELL_JS_BUDGET_KB);
});
