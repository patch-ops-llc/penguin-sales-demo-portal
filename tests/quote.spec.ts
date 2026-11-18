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

test("approval conditions read as HubSpot's own approval rule, with the Penguin marker only on the floor price check", async ({ page }) => {
  await openDemo(page, "discount-approval");
  await page.getByTestId("demo-next").click();
  await page.getByTestId("view-approval-conditions").click();
  const card = page.getByTestId("approval-card");
  await expect(card.getByTestId("approval-rule-source")).toContainText("Standard approval rule for quotes, set in Settings > Objects > Quotes > Approvals.");
  await expect(card.getByTestId("approval-condition-discount")).toContainText("Total discount percent is greater than 10%");
  await expect(card.getByTestId("approval-condition-discount")).toHaveAttribute("data-met", "true");
  await expect(card.getByTestId("approval-condition-floor")).toContainText("Line item: Below floor price is equal to True");
  await expect(card.getByTestId("approval-condition-floor")).toContainText("3 lines below floor price");
  await expect(card.getByTestId("approval-reasons").locator("[data-ext]")).toHaveCount(0);
  await expect(card.getByTestId("floor-check").getByTestId("ext-pin-floor-price-rule")).toBeVisible();
  await expect(card.getByTestId("ext-pin-erp-cost-feed")).toBeVisible();
});

test("the quote document takes its heading and total label from the vertical", async ({ page }) => {
  await openDemo(page, "discount-approval");
  await expect(page.getByTestId("quote-heading")).toHaveText("Quote");
  await expect(page.getByTestId("quote-document")).toContainText("Total contract value");
  await openDemo(page, "discount-approval", "financial-services");
  await expect(page.getByTestId("quote-heading")).toHaveText("Financing proposal");
  await expect(page.getByTestId("quote-document")).toContainText("Proposal ref.");
  await expect(page.getByTestId("quote-document")).toContainText("Total of payments and fees");
  await expect(page.getByTestId("quote-document")).not.toContainText("Total contract value");
});

test("buyer e-signature: Sign now, Get started, Click to sign, Insert, Continue, I agree, Close", async ({ page }) => {
  await openDemo(page, "guided-quote");
  for (let i = 0; i < 5; i += 1) await page.getByTestId("demo-next").click();
  await page.getByTestId("share-close").click();
  await page.getByTestId("quote-view-as-buyer").click();
  await expect(page.getByTestId("buyer-banner")).toHaveText("Waiting for acceptance");

  await page.getByTestId("buyer-accept").click();
  await expect(page.getByTestId("buyer-banner")).toHaveCount(0);
  await page.getByTestId("sign-get-started").click();
  await expect(page.getByTestId("sign-continue")).toBeDisabled();
  await expect(page.getByTestId("sign-field")).toHaveText(/Click to sign/);

  await page.getByTestId("sign-field").click();
  await page.getByTestId("sign-tab-draw").click();
  await expect(page.getByTestId("buyer-sign-insert")).toBeDisabled();
  const pad = await page.getByTestId("sign-pad").boundingBox();
  if (!pad) throw new Error("no signature pad");
  await page.mouse.move(pad.x + 40, pad.y + 60);
  await page.mouse.down();
  await page.mouse.move(pad.x + 120, pad.y + 30, { steps: 4 });
  await page.mouse.move(pad.x + 200, pad.y + 70, { steps: 4 });
  await page.mouse.up();
  await page.getByTestId("buyer-sign-insert").click();
  await expect(page.getByTestId("sign-field")).toHaveAttribute("data-signed", "true");

  await page.getByTestId("sign-continue").click();
  await page.getByTestId("sign-edit").click();
  await page.getByTestId("sign-tab-type").click();
  await page.getByTestId("buyer-sign-insert").click();
  await expect(page.getByTestId("sign-field")).toHaveText("Hannah Weiss");
  await page.getByTestId("sign-continue").click();
  await page.getByTestId("sign-agree").click();
  await page.getByTestId("sign-close").click();

  await expect(page.getByTestId("buyer-banner")).toHaveText("Accepted");
  await expect(page.getByTestId("buyer-accepted")).toContainText("Hannah Weiss");
  await expect(page.getByTestId("buyer-accepted")).toContainText("Signed");
  await page.getByTestId("buyer-back").click();
  await expect(page.getByTestId("quote-page")).toContainText("Accepted");
});

test("closing agent: test mode in the editor, then the chat panel on the published quote", async ({ page }) => {
  await openDemo(page, "guided-quote");
  for (let i = 0; i < 4; i += 1) await page.getByTestId("demo-next").click();
  await expect(page.getByTestId("closing-agent-welcome")).toContainText("Greetings, I am an AI assistant.");
  await page.getByTestId("closing-agent-launcher").click();
  await expect(page.getByTestId("closing-agent-test-mode")).toContainText("Buyers won't see any messages from testing.");
  await expect(page.getByTestId("closing-agent-name")).toHaveText("Halvorsen Motion Assistant");
  await page.getByTestId("closing-agent-input").fill("How much is it?");
  await page.getByTestId("closing-agent-input").press("Enter");
  await expect(page.getByTestId("closing-agent-answer").last()).toContainText("The total contract value is $32,352.00.");
  await page.getByTestId("closing-agent-close").click();

  await page.getByTestId("demo-next").click();
  await page.getByTestId("share-close").click();
  await page.getByTestId("quote-view-as-buyer").click();
  const chat = page.getByTestId("closing-agent-chat");
  await expect(chat).toContainText("I can answer questions or transfer you to a representative. How can I help?");
  await expect(chat.getByTestId("closing-agent-answer")).toHaveCount(0);
  await expect(chat.locator("[data-ext]")).toHaveCount(0);

  await page.getByTestId("closing-agent-reply-terms").click();
  await expect(chat.getByTestId("closing-agent-answer").last()).toContainText("Payment terms are");
  await expect(page.getByTestId("closing-agent-reply-terms")).toHaveCount(0);
  await page.getByTestId("closing-agent-input").fill("Can I change the warranty?");
  await page.getByTestId("closing-agent-send").click();
  await expect(chat.getByTestId("closing-agent-answer").last()).toContainText("Would you like me to connect you with your sales representative");
  await page.getByTestId("closing-agent-input").fill("Yes please");
  await page.getByTestId("closing-agent-send").click();
  await expect(chat.getByTestId("closing-agent-answer").last()).toContainText("I am connecting you with Alex Morgan");

  await page.getByTestId("buyer-back").click();
  await page.getByTestId("quote-view-as-buyer").click();
  await expect(page.getByTestId("closing-agent-answer")).toHaveCount(3);
  await page.getByTestId("buyer-accept").click();
  await expect(page.getByTestId("signing-bar")).toBeVisible();
  await expect(page.getByTestId("closing-agent-chat")).toHaveCount(0);
});

test("closing agent quick replies use the vertical's wording", async ({ page }) => {
  await openDemo(page, "guided-quote", "financial-services");
  for (let i = 0; i < 5; i += 1) await page.getByTestId("demo-next").click();
  await page.getByTestId("share-close").click();
  await page.getByTestId("quote-view-as-buyer").click();
  await expect(page.getByTestId("closing-agent-name")).toHaveText("Fernhill Capital Assistant");
  await expect(page.getByTestId("closing-agent-reply-timing")).toHaveText("What is the payment schedule?");
  await expect(page.getByTestId("closing-agent-reply-accept")).toHaveText("How do I accept this financing proposal?");
  await page.getByTestId("closing-agent-reply-total").click();
  await expect(page.getByTestId("closing-agent-answer")).toContainText("The total of payments and fees is $270,115.00.");
});
