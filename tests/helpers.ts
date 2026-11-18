import { expect, type Page } from "@playwright/test";

export const DEMOS = ["guided-quote", "discount-approval", "back-office", "lead-capture", "email-to-deal", "ai-prospecting"] as const;

export const isLocal = /localhost|127\.0\.0\.1/.test(process.env.E2E_BASE_URL ?? "http://localhost:3000");

export function credentials() {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (!email || !password) throw new Error("Set E2E_EMAIL and E2E_PASSWORD to the seeded admin's sign-in.");
  return { email, password };
}

export async function signIn(page: Page, who = credentials()) {
  await page.goto("/login");
  await page.fill("input[name=email]", who.email);
  await page.fill("input[name=password]", who.password);
  await page.click("button[type=submit]");
  await page.waitForURL("**/launchpad");
}

/** Opens a demo with a clean session. */
export async function openDemo(page: Page, demo: string, vertical = "manufacturing") {
  await page.goto(`/demo/${vertical}/${demo}?fresh=1`);
  await expect(page.getByTestId("demo-bar")).toBeVisible();
}

/** Clicks Next until the script is finished. Returns the number of steps taken. */
export async function walk(page: Page): Promise<number> {
  let steps = 0;
  while (await page.getByTestId("demo-next").count()) {
    const before = await page.getByTestId("demo-step-count").textContent();
    await page.getByTestId("demo-next").click();
    await expect(page.getByTestId("demo-step-count")).not.toHaveText(before ?? "");
    steps += 1;
    if (steps > 15) throw new Error("The demo did not finish.");
  }
  return steps;
}
