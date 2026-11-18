import { expect, test, type Page } from "@playwright/test";
import { openDemo, signIn } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

/** Opens the rule quote's Approvals panel in the Discount approval demo. */
async function openApprovalsPanel(page: Page, vertical: string) {
  await openDemo(page, "discount-approval", vertical);
  await page.getByTestId("demo-next").click();
  await page.getByTestId("view-approval-conditions").click();
  await expect(page.getByTestId("approval-card")).toBeVisible();
}

const RULES = [
  { vertical: "manufacturing", filters: ["discount", "floor"], limit: "10%", approver: "Priya Nair", title: "Sales Director" },
  { vertical: "saas", filters: ["discount", "floor", "terms"], limit: "10%", approver: "Mei Tanaka", title: "Deal Desk Manager" },
  { vertical: "financial-services", filters: ["discount", "floor"], limit: "2%", approver: "Ruth Adeyemi", title: "Senior Credit Officer" },
  { vertical: "professional-services", filters: ["discount", "floor"], limit: "10%" },
];

for (const rule of RULES) {
  test(`approval settings show the rule the Approvals panel checks: ${rule.vertical}`, async ({ page }) => {
    await openApprovalsPanel(page, rule.vertical);
    const card = page.getByTestId("approval-card");
    await expect(card.locator("[data-testid^=approval-condition-]")).toHaveCount(rule.filters.length);
    const note = (await card.getByTestId("approval-rule-note").textContent()) ?? "";
    expect(note.length).toBeGreaterThan(20);

    await card.getByTestId("approval-settings-link").click();
    await expect(page).toHaveURL(/\/settings\/objects\/quotes\/approvals\?from=q-\d+$/);
    const summary = page.getByTestId("approval-rule-summary");
    await expect(summary.locator("[data-testid^=settings-condition-]")).toHaveCount(rule.filters.length);
    const sentences: Record<string, string> = {};
    for (const id of rule.filters) sentences[id] = (await summary.getByTestId(`settings-condition-${id}`).textContent()) ?? "";
    expect(sentences.discount).toBe(`Total discount percent is greater than ${rule.limit}`);
    expect(sentences.floor).toBe("Line item: Below floor price is equal to True");
    await expect(page.getByTestId("settings-approval-note")).toHaveText(note);
    if (rule.approver) {
      await expect(page.getByTestId("settings-approver")).toContainText(`${rule.approver}, ${rule.title}`);
      expect(note).toContain(rule.approver);
    }

    await page.getByTestId("standard-approvals-edit").click();
    const panel = page.getByTestId("approval-rule-panel");
    await expect(panel.locator("[data-testid^=settings-filter-]")).toHaveCount(rule.filters.length);
    await expect(panel.getByTestId("settings-panel-note")).toHaveValue(note);
    if (rule.approver) await expect(panel.getByTestId("settings-panel-approver")).toContainText(rule.approver);
    await panel.getByTestId("approval-rule-close").click();

    await page.getByTestId("settings-back").click();
    await expect(page).toHaveURL(/\/approvals\/q-\d+$/);
    for (const id of rule.filters) await expect(page.getByTestId(`approval-condition-${id}`)).toContainText(sentences[id]);
  });
}

test("approval settings follow HubSpot's layout, with the Penguin marker only on the floor price flag", async ({ page }) => {
  await openApprovalsPanel(page, "saas");
  await page.getByTestId("approval-settings-link").click();
  const settings = page.getByTestId("settings-page");
  await expect(settings.getByRole("heading", { name: "Objects", exact: true })).toBeVisible();
  await expect(settings.getByTestId("settings-object")).toHaveText("Quotes");
  await expect(settings.getByRole("tab", { name: "Approvals" })).toHaveAttribute("aria-selected", "true");
  await expect(settings.getByTestId("approvals-switch")).toHaveAttribute("aria-checked", "true");
  await expect(settings.getByTestId("standard-approvals-switch")).toHaveAttribute("aria-checked", "true");
  await expect(settings.getByTestId("standard-approvals")).toContainText("Use automation to set up approval on quotes that meet your choice of criteria and approvers.");
  await expect(settings.getByTestId("advanced-approvals").getByRole("switch")).toHaveAttribute("aria-checked", "false");
  await expect(settings.getByTestId("settings-condition-terms")).toHaveText("Payment terms is none of Net 30");

  // The rule is HubSpot's own. Only the filter that reads Penguin's line item flag is marked.
  await expect(settings.locator("[data-ext]")).toHaveCount(1);
  await expect(settings.locator("[data-ext=floor-price-rule]").getByTestId("settings-condition-floor")).toBeVisible();

  await settings.getByTestId("standard-approvals-edit").click();
  const panel = page.getByTestId("approval-rule-panel");
  for (const text of ["And these conditions are met", "Filters", "Then do this", "Approvers", "Approver requirements", "With this approval note", "Quote creators and approvers will see this note when an approval takes place."]) {
    await expect(panel.getByText(text, { exact: true })).toBeVisible();
  }
  await expect(panel.getByLabel("All approvers required")).toBeChecked();
  await expect(panel.getByLabel("At least one approver required")).not.toBeChecked();
  await expect(panel.getByLabel("Total discount percent value")).toHaveValue("10");
  await expect(panel.locator("[data-ext]")).toHaveCount(1);
  await expect(panel.getByTestId("settings-filter-floor").getByTestId("ext-pin-floor-price-rule")).toBeVisible();
  await expect(page.locator("[data-ext]")).toHaveCount(1);
});

test("the settings gear opens approval settings from the shell without a server round trip", async ({ page }) => {
  await openDemo(page, "discount-approval");
  for (let i = 0; i < 3; i += 1) await page.getByTestId("demo-next").click();
  await expect(page.getByTestId("index-table")).toBeVisible();
  await page.waitForLoadState("networkidle");
  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/events")) return;
    if (["document", "fetch", "xhr", "script", "stylesheet"].includes(r.resourceType())) requests.push(`${r.resourceType()} ${r.url()}`);
  });

  await page.getByTestId("settings-gear").click();
  await expect(page).toHaveURL(/\/settings\/objects\/quotes\/approvals$/);
  await expect(page.getByTestId("settings-condition-discount")).toHaveText("Total discount percent is greater than 10%");
  await page.getByTestId("standard-approvals-edit").click();
  await page.getByTestId("approval-rule-close").click();
  await expect(page.getByTestId("settings-back")).toHaveText("Back to quotes");
  await page.getByTestId("settings-back").click();
  await expect(page.getByTestId("index-table")).toBeVisible();
  expect(requests).toEqual([]);
});
