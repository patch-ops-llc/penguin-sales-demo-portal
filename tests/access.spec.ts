import { expect, test } from "@playwright/test";
import { credentials, isLocal, openDemo, signIn } from "./helpers";

test("signed-out visitors are sent to sign-in and get no demo data", async ({ page, request }) => {
  await page.goto("/launchpad");
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/demo/manufacturing/guided-quote");
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
  expect((await request.get("/api/packs/any/manufacturing")).status()).toBe(401);
});

test("the sign-in page carries Penguin branding only", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("Penguin Strategies").first()).toBeVisible();
  expect((await page.content()).toLowerCase()).not.toContain("hubspot");
});

test("a wrong password is refused and logged", async ({ page }) => {
  const { email } = credentials();
  await page.goto("/login");
  await page.fill("input[name=email]", email);
  await page.fill("input[name=password]", "not-the-password-1");
  await page.click("button[type=submit]");
  await expect(page).toHaveURL(/\/login/);
  await signIn(page);
  await page.goto(`/admin/activity?user=${encodeURIComponent(email)}`);
  await expect(page.getByTestId("access-log")).toContainText("Sign-in failed");
});

test("the access log records sign-ins and the demos a user opened", async ({ page }) => {
  const { email } = credentials();
  await signIn(page);
  await openDemo(page, "email-to-deal");
  await page.getByTestId("demo-next").click();
  await page.waitForTimeout(2500); // the logging beacon sends in batches
  await page.goto(`/admin/activity?user=${encodeURIComponent(email)}`);
  const log = page.getByTestId("access-log");
  await expect(log).toContainText("Signed in");
  await expect(log).toContainText("Started demo");
  await expect(log).toContainText("Email to deal");
  await expect(log).toContainText("Manufacturing");
});

test("an admin invites a rep, who accepts, signs in, and cannot reach admin", async ({ page, browser }) => {
  // Creates a user, so it only runs against a local portal. It never runs against a deployed one.
  test.skip(!isLocal, "Runs against a local portal only.");
  const rep = { email: `e2e-rep-${Date.now()}@example.com`, password: "e2e-rep-password-1" };

  await signIn(page);
  await page.goto("/admin");
  await page.fill("textarea[name=emails]", rep.email);
  await page.getByRole("button", { name: /invite/i }).first().click();
  const link = await page.getByTestId("admin-link").first().textContent();
  expect(link).toContain("/invite/");
  await expect(page.getByTestId(`user-row-${rep.email}`)).toContainText("Invited");

  const context = await browser.newContext();
  const repPage = await context.newPage();
  await repPage.goto(link!);
  await repPage.fill("input[name=name]", "E2E Rep");
  await repPage.fill("input[name=password]", rep.password);
  await repPage.fill("input[name=confirm]", rep.password);
  await repPage.click("button[type=submit]");
  await repPage.waitForURL("**/launchpad");
  await repPage.goto("/admin");
  await expect(repPage).not.toHaveURL(/\/admin$/);
  // The invite link works once.
  const again = await context.newPage();
  await again.goto(link!);
  await expect(again.locator("input[name=password]")).toHaveCount(0);
  await context.close();

  await page.goto(`/admin/activity?user=${encodeURIComponent(rep.email)}`);
  await expect(page.getByTestId("access-log")).toContainText("Invite accepted");

  // Clean up: remove the test user.
  await page.goto("/admin");
  page.once("dialog", (d) => d.accept());
  await page.getByTestId(`user-row-${rep.email}`).getByRole("button", { name: "Remove" }).click();
  await expect(page.getByTestId(`user-row-${rep.email}`)).toHaveCount(0);
});
