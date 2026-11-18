import { expect, test, type Page } from "@playwright/test";
import { openDemo, signIn, walk } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

async function openLineEditor(page: Page) {
  for (let i = 0; i < 4; i += 1) await page.getByTestId("demo-next").click();
  await expect(page.getByTestId("quote-page")).toBeVisible();
  await page.getByTestId("quote-module-lines").locator("h2").click();
  await page.getByTestId("quote-edit-lines").click();
  await expect(page.getByTestId("line-items-editor")).toBeVisible();
}

const rows = (page: Page) => page.getByTestId("line-items-editor").locator("tbody tr");

test("line item editor: add from the product library, add a custom line, clone, edit, delete, save", async ({ page }) => {
  await openDemo(page, "guided-quote");
  await openLineEditor(page);
  await expect(rows(page)).toHaveCount(4);
  await expect(page.getByTestId("line-editor-total")).toHaveText("$32,352.00");

  await page.getByTestId("add-line-item").click();
  await page.getByTestId("add-from-library").click();
  await page.getByTestId("library-search").fill("frame 40, 300");
  await page.getByTestId("library-item-HM-LA40-300").check();
  await page.getByTestId("library-add").click();
  await expect(rows(page)).toHaveCount(5);
  await expect(page.getByTestId("line-editor-total")).toHaveText("$33,792.00");

  await page.getByTestId("add-line-item").click();
  await page.getByTestId("add-custom").click();
  await page.locator("#line-name").fill("On-site commissioning");
  await page.locator("#line-price").fill("2400");
  await page.locator("#line-cost").fill("1500");
  await page.getByTestId("line-details-save").click();
  await expect(rows(page)).toHaveCount(6);
  await expect(page.getByTestId("line-editor-total")).toHaveText("$36,192.00");

  await rows(page).nth(0).hover();
  await page.getByTestId("line-actions-0").click();
  await page.getByTestId("line-clone-0").click();
  await expect(rows(page)).toHaveCount(7);
  await expect(page.getByTestId("line-editor-total")).toHaveText("$56,712.00");

  await rows(page).nth(1).hover();
  await page.getByTestId("line-actions-1").click();
  await page.getByTestId("line-edit-1").click();
  await page.locator("#line-qty").fill("2");
  await page.getByTestId("line-details-save").click();
  await expect(page.getByTestId("line-editor-total")).toHaveText("$41,322.00");

  await rows(page).nth(1).hover();
  await page.getByTestId("line-actions-1").click();
  await page.getByTestId("line-delete-1").click();
  await expect(rows(page)).toHaveCount(6);
  await expect(page.getByTestId("line-editor-total")).toHaveText("$36,192.00");

  await page.getByTestId("line-editor-save").click();
  await expect(page.getByTestId("quote-lines").locator("tbody tr")).toHaveCount(6);
  await expect(page.getByTestId("quote-total")).toContainText("$36,192.00");
  await expect(page.getByTestId("quote-lines")).toContainText("On-site commissioning");

  await walk(page);
  await expect(page.getByTestId("demo-wrap-up")).toBeVisible();
});

test("line item editor: Cancel leaves the quote as it was, and Edit columns changes the table", async ({ page }) => {
  await openDemo(page, "guided-quote");
  await openLineEditor(page);

  await page.getByTestId("edit-columns").click();
  await page.getByTestId("edit-columns-open").click();
  await page.getByTestId("column-description").check();
  await page.getByTestId("column-margin").uncheck();
  await page.getByTestId("columns-apply").click();
  const header = page.getByTestId("line-items-editor").locator("thead");
  await expect(header).toContainText("Description");
  await expect(header).not.toContainText("Margin");
  await expect(header).toContainText("Floor price");

  await rows(page).nth(0).hover();
  await page.getByTestId("line-actions-0").click();
  await page.getByTestId("line-delete-0").click();
  await expect(rows(page)).toHaveCount(3);
  await page.getByTestId("line-editor-cancel").click();
  await expect(page.getByTestId("quote-lines").locator("tbody tr")).toHaveCount(4);
  await expect(page.getByTestId("quote-total")).toContainText("$32,352.00");
});

test("deal Quotes card: + Add creates a quote from a template, and the published quote is tagged Primary", async ({ page }) => {
  await openDemo(page, "guided-quote");
  for (let i = 0; i < 5; i += 1) await page.getByTestId("demo-next").click();
  await page.getByTestId("share-close").click();
  await page.getByTestId("quote-exit").click();
  const card = page.getByTestId("deal-quotes");
  await expect(card).toContainText("Quotes (1)");
  await expect(card.getByTestId("deal-quote-primary")).toHaveCount(1);

  await card.getByTestId("deal-add-quote").click();
  await expect(page.getByTestId("create-quote-panel")).toContainText("Select a quote template");
  await page.getByTestId("quote-template").selectOption("proposal");
  await page.getByTestId("create-quote-confirm").click();
  await expect(page.getByTestId("quote-page")).toBeVisible();
  await expect(page.getByTestId("quote-status")).toContainText("Draft");
  await expect(page.getByTestId("quote-module-cover")).toBeVisible();
  await expect(page.getByTestId("quote-lines").locator("tbody tr")).toHaveCount(4);

  await page.getByTestId("quote-exit").click();
  await expect(page.getByTestId("deal-quotes")).toContainText("Quotes (2)");
  await expect(page.getByTestId("deal-quotes").getByTestId("deal-quote-primary")).toHaveCount(1);
});

test("quotes index: HubSpot's views and filters", async ({ page }) => {
  await openDemo(page, "discount-approval");
  for (let i = 0; i < 3; i += 1) await page.getByTestId("demo-next").click();
  await expect(page.getByTestId("index-table")).toBeVisible();
  for (const label of ["All quotes", "Expiring soon", "Pending acceptance", "Pending approval", "Status", "Last activity date", "Owner", "Signing status"]) {
    await expect(page.getByRole("button", { name: label, exact: true }).first()).toBeVisible();
  }
  await page.getByRole("button", { name: "Pending approval", exact: true }).click();
  await expect(page.getByTestId("index-count")).toHaveText("1 record");
  await expect(page.getByTestId("index-table").locator("tbody tr")).toHaveCount(1);
});
