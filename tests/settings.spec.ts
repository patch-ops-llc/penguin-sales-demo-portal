import { expect, test, type Page } from "@playwright/test";
import { openDemo, signIn, walk } from "./helpers";

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

/** Each vertical's rule as its pack sets it, with the approval step's message written from the pack's wording. */
const RULES = [
  {
    vertical: "manufacturing",
    filters: ["discount", "floor"],
    limit: "10%",
    approver: "Priya Nair",
    approverId: "priya",
    note: "A discount over 10%, or a line priced under its floor price, needs approval from Priya Nair, Sales Director.",
  },
  {
    vertical: "saas",
    filters: ["discount", "floor", "terms"],
    limit: "10%",
    approver: "Mei Tanaka",
    approverId: "mei",
    note: "A discount over 10%, payment terms other than Net 30, or a line priced under its floor price, needs approval from Mei Tanaka, Deal Desk Manager.",
  },
  {
    vertical: "financial-services",
    filters: ["discount", "floor"],
    limit: "2%",
    approver: "Ruth Adeyemi",
    approverId: "ruth",
    note: "A rate exception over 2% off standard pricing, or a line priced under its floor price, needs approval from Ruth Adeyemi, Senior Credit Officer.",
  },
  {
    vertical: "professional-services",
    filters: ["discount", "floor"],
    limit: "10%",
    approver: "Omar Haddad",
    approverId: "omar",
    note: "A discount over 10%, or an hourly rate under its rate-card floor, needs approval from Omar Haddad, Practice Lead, Professional Services.",
  },
];

/** Sets the same unit discount on every line of the open quote, through the line item editor. */
async function setDiscount(page: Page, pct: string) {
  if (!(await page.getByTestId("quote-edit-lines").isVisible())) await page.getByTestId("quote-module-lines").locator("h2").click();
  await page.getByTestId("quote-edit-lines").click();
  const inputs = page.locator("[data-testid^=line-discount-]");
  for (let i = 0; i < (await inputs.count()); i += 1) await inputs.nth(i).fill(pct);
  await page.getByTestId("line-editor-save").click();
}

/** From a quote, opens the approval workflow through the Approvals panel and Settings. */
async function openWorkflow(page: Page) {
  if (!(await page.getByTestId("approval-card").count())) await page.getByTestId("approvals-toggle").click();
  await page.getByTestId("approval-settings-link").click();
  await page.getByTestId("advanced-approvals-edit").click();
  await expect(page.getByTestId("approval-workflow")).toBeVisible();
}

/** Changes the discount limit in the workflow's Branch panel and saves. */
async function saveLimit(page: Page, pct: string) {
  await page.getByTestId("aw-branch").click();
  await page.getByTestId("aw-limit").fill(pct);
  await page.getByTestId("aw-panel-save").click();
  await expect(page.getByTestId("aw-panel")).toHaveCount(0);
}

for (const rule of RULES) {
  test(`the approval workflow shows the rule the Approvals panel checks: ${rule.vertical}`, async ({ page }) => {
    await openApprovalsPanel(page, rule.vertical);
    const card = page.getByTestId("approval-card");
    await expect(card.getByTestId("approval-rule-source")).toContainText("Advanced approval for quotes: the Quote Approval Workflow, turned on in Settings > Objects > Quotes > Approvals.");
    await expect(card.locator("[data-testid^=approval-condition-]")).toHaveCount(rule.filters.length);
    const note = (await card.getByTestId("approval-rule-note").textContent()) ?? "";
    expect(note).toBe(rule.note);

    // Settings: advanced approvals are on, standard approvals are off, and Edit leads to the workflow.
    await card.getByTestId("approval-settings-link").click();
    await expect(page).toHaveURL(/\/settings\/objects\/quotes\/approvals\?from=q-\d+$/);
    await expect(page.getByTestId("advanced-approvals-switch")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("standard-approvals-switch")).toHaveAttribute("aria-checked", "false");
    await page.getByTestId("advanced-approvals-edit").click();
    await expect(page).toHaveURL(/\/workflows\/quote-approval\?from=q-\d+$/);

    const workflow = page.getByTestId("approval-workflow");
    await expect(workflow.locator("[data-testid^=aw-criteria-]")).toHaveCount(rule.filters.length);
    const sentences: Record<string, string> = {};
    for (const id of rule.filters) sentences[id] = (await workflow.getByTestId(`aw-criteria-${id}`).textContent()) ?? "";
    expect(sentences.discount).toBe(`Total discount percent is greater than ${rule.limit}`);
    expect(sentences.floor).toBe("Line item: Below floor price is equal to True");
    await expect(workflow.getByTestId("aw-step-approver")).toHaveText(rule.approver);
    await expect(workflow.getByTestId("aw-step-message")).toHaveText(note);

    await workflow.getByTestId("aw-branch").click();
    await expect(workflow.getByTestId("aw-panel").locator("[data-testid^=aw-group-]")).toHaveCount(rule.filters.length);
    await workflow.getByTestId("aw-step").click();
    await expect(workflow.getByTestId("aw-panel-message")).toHaveValue(note);
    await expect(workflow.getByTestId("aw-panel-approver")).toHaveValue(rule.approverId);
    await workflow.getByTestId("aw-panel-close").click();
    await expect(workflow.getByTestId("aw-panel")).toHaveCount(0);

    await workflow.getByTestId("aw-back-quote").click();
    await expect(page).toHaveURL(/\/approvals\/q-\d+$/);
    for (const id of rule.filters) await expect(page.getByTestId(`approval-condition-${id}`)).toContainText(sentences[id]);
  });
}

test("approval settings follow HubSpot's layout: advanced approvals on, standard approvals not set up, no Penguin marker", async ({ page }) => {
  await openApprovalsPanel(page, "saas");
  await page.getByTestId("approval-settings-link").click();
  const settings = page.getByTestId("settings-page");
  await expect(settings.getByRole("heading", { name: "Objects", exact: true })).toBeVisible();
  await expect(settings.getByTestId("settings-object")).toHaveText("Quotes");
  await expect(settings.getByRole("tab", { name: "Approvals" })).toHaveAttribute("aria-selected", "true");
  await expect(settings.getByTestId("approvals-switch")).toHaveAttribute("aria-checked", "true");
  await expect(settings.getByTestId("standard-approvals")).toContainText("Use automation to set up approval on quotes that meet your choice of criteria and approvers.");
  await expect(settings.getByTestId("advanced-approvals")).toContainText("Use workflow automation for dynamic, property-driven logic, and sequential quote approval steps.");
  await expect(settings.getByTestId("advanced-approvals-links")).toContainText("Team approver settings");
  await expect(settings.getByTestId("approval-workflow-link")).toHaveText("Quote Approval Workflow");
  // The settings name the workflow and hold none of the rule, so nothing here is Penguin's.
  await expect(page.locator("[data-ext]")).toHaveCount(0);
  await expect(settings).not.toContainText("Super Admin");

  await settings.getByTestId("standard-approvals-edit").click();
  const standard = page.getByTestId("standard-approvals-panel");
  for (const text of ["And these conditions are met", "Filters", "Add filter", "Then do this", "Approvers", "Approver requirements", "With this approval note"]) {
    await expect(standard.getByText(text, { exact: true })).toBeVisible();
  }
  await expect(standard.getByTestId("standard-approvals-approvers")).toHaveText("");
  await expect(standard.getByLabel("All approvers required")).not.toBeChecked();
  await expect(standard.getByLabel("With this approval note")).toHaveValue("");
  await standard.getByTestId("standard-approvals-close").click();

  await settings.getByTestId("approval-workflow-link").click();
  await expect(page).toHaveURL(/\/workflows\/quote-approval\?from=q-2087$/);
});

test("the approval workflow follows HubSpot's layout, with the Penguin marker only on the floor price flag", async ({ page }) => {
  await openApprovalsPanel(page, "saas");
  await page.getByTestId("approval-workflow-link").click();
  const workflow = page.getByTestId("approval-workflow");
  await expect(workflow.getByRole("heading", { name: "Quote Approval Workflow" })).toBeVisible();
  await expect(workflow.getByTestId("aw-trigger")).toContainText("Trigger enrollment for quotes");
  await expect(workflow.getByTestId("aw-trigger")).toContainText("New value: Internal quote status is any of Pending approval");
  await expect(workflow.getByTestId("aw-branch")).toContainText("1. Branch");
  await expect(workflow.getByTestId("aw-branch")).toContainText("Go to Needs approval if these criteria are met:");
  await expect(workflow.getByTestId("aw-criteria").getByText("or", { exact: true })).toHaveCount(2);
  await expect(workflow.getByTestId("aw-criteria-terms")).toHaveText("Net payment terms is none of Net 30");
  await expect(workflow.getByTestId("aw-branch-met")).toContainText("Needs approval");
  await expect(workflow.getByTestId("aw-branch-none")).toHaveText("None met");
  await expect(workflow.getByTestId("aw-step")).toContainText("2. Add quote approval step");
  await expect(workflow.getByTestId("aw-step")).toContainText("Approval required from Mei Tanaka. Message:");
  await expect(workflow.getByTestId("aw-goto")).toContainText("Go to 3. Start quote approval flow.");
  await expect(workflow.getByTestId("aw-flow")).toContainText("Create approval flow using previously executed approval steps. If no steps were added this quote will be automatically approved");
  await expect(workflow.getByText("3. End", { exact: true })).toBeVisible();

  // The workflow is HubSpot's own. Only the criteria that read Penguin's line item flag are marked.
  await expect(page.locator("[data-ext]")).toHaveCount(1);
  await expect(workflow.locator("[data-ext=floor-price-rule]").getByTestId("aw-criteria-floor")).toBeVisible();

  await workflow.getByTestId("aw-branch").click();
  const panel = workflow.getByTestId("aw-panel");
  await expect(panel).toHaveAttribute("data-panel", "branch");
  for (const text of ["First, check if:", "Group 1", "Group 2", "Group 3", "If none of the criteria are met, go here:"]) {
    await expect(panel.getByText(text, { exact: true })).toBeVisible();
  }
  await expect(panel.getByLabel("Branch name", { exact: true })).toHaveValue("Needs approval");
  await expect(panel.getByText("or", { exact: true })).toHaveCount(2);
  await expect(panel.getByLabel("Total discount percent value")).toHaveValue("10");
  await expect(page.locator("[data-ext]")).toHaveCount(1);
  await expect(panel.getByTestId("aw-group-floor").getByTestId("ext-pin-floor-price-rule")).toBeVisible();

  await workflow.getByTestId("aw-step").click();
  await expect(panel).toHaveAttribute("data-panel", "step");
  for (const text of ["Quote *", "Enrolled quote", "Message to approver *", "Give the approver context on why they are approving this", "Approvers *", "Select the people to be added to the list of approvers", "Sequential approval priority"]) {
    await expect(panel.getByText(text, { exact: true })).toBeVisible();
  }
  await workflow.getByTestId("aw-flow").click();
  await expect(panel).toHaveAttribute("data-panel", "flow");
  await expect(panel.getByLabel("All approvers")).toBeChecked();
  await expect(panel.getByLabel("Any approvers")).not.toBeChecked();

  await workflow.getByTestId("aw-back").click();
  await expect(page).toHaveURL(/\/settings\/objects\/quotes\/approvals\?from=q-2087$/);
  await page.getByTestId("settings-back").click();
  await expect(page).toHaveURL(/\/approvals\/q-2087$/);
  await expect(page.getByTestId("approval-card")).toBeVisible();
});

test("the settings gear opens approval settings and the workflow without a server round trip", async ({ page }) => {
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
  await page.getByTestId("advanced-approvals-edit").click();
  await expect(page).toHaveURL(/\/workflows\/quote-approval$/);
  await expect(page.getByTestId("aw-criteria-discount")).toHaveText("Total discount percent is greater than 10%");
  await expect(page.getByTestId("aw-back-quote")).toHaveCount(0);
  await page.getByTestId("aw-branch").click();
  await page.getByTestId("aw-panel-close").click();
  await page.getByTestId("aw-back").click();
  await expect(page.getByTestId("settings-back")).toHaveText("Back to quotes");
  await page.getByTestId("settings-back").click();
  await expect(page.getByTestId("index-table")).toBeVisible();
  expect(requests).toEqual([]);
});

test("changing the discount limit changes at once which quotes need approval, and Reset puts the pack's rule back", async ({ page }) => {
  await openDemo(page, "discount-approval");
  await setDiscount(page, "8");
  await expect(page.getByTestId("quote-send")).toBeVisible();
  await expect(page.getByTestId("quote-locked")).toHaveCount(0);
  await page.waitForLoadState("networkidle");
  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/events")) return;
    if (["document", "fetch", "xhr", "script", "stylesheet"].includes(r.resourceType())) requests.push(`${r.resourceType()} ${r.url()}`);
  });

  // Lowered to 5%, the same 8% quote needs approval.
  await openWorkflow(page);
  await saveLimit(page, "5");
  await expect(page.getByTestId("aw-criteria-discount")).toHaveText("Total discount percent is greater than 5%");
  await expect(page.getByTestId("aw-step-message")).toHaveText("A discount over 5%, or a line priced under its floor price, needs approval from Priya Nair, Sales Director.");
  await page.getByTestId("aw-back-quote").click();
  await expect(page.getByTestId("approval-status")).toHaveText("Approval required");
  await expect(page.getByTestId("quote-locked")).toContainText("discount over 5%");
  await expect(page.getByTestId("approval-condition-discount")).toHaveAttribute("data-met", "true");
  await expect(page.getByTestId("approval-rule-note")).toContainText("A discount over 5%");
  await expect(page.getByTestId("quote-request-approval")).toBeVisible();
  await expect(page.getByTestId("quote-send")).toHaveCount(0);

  // Raised to 15%, a 12% discount passes.
  await page.getByTestId("approval-workflow-link").click();
  await saveLimit(page, "15");
  await page.getByTestId("aw-back-quote").click();
  await page.getByTestId("approvals-close").click();
  await setDiscount(page, "12");
  await expect(page.getByTestId("quote-locked")).toHaveCount(0);
  await expect(page.getByTestId("quote-send")).toBeVisible();
  await page.getByTestId("approvals-toggle").click();
  await expect(page.getByTestId("approval-status")).toHaveText("Approval not needed");
  expect(requests).toEqual([]);

  // The edit lives in this vertical's demo session only.
  await page.goto("/demo/saas/discount-approval/workflows/quote-approval");
  await expect(page.getByTestId("aw-criteria-discount")).toHaveText("Total discount percent is greater than 10%");
  await page.goto("/demo/manufacturing/discount-approval/workflows/quote-approval");
  await expect(page.getByTestId("aw-criteria-discount")).toHaveText("Total discount percent is greater than 15%");

  // Reset starts the next call from the pack's rule.
  await page.getByTestId("demo-reset").click();
  await expect(page.getByTestId("quote-page")).toBeVisible();
  await setDiscount(page, "12");
  await expect(page.getByTestId("quote-locked")).toContainText("discount over 10%");
  await openWorkflow(page);
  await expect(page.getByTestId("aw-criteria-discount")).toHaveText("Total discount percent is greater than 10%");
});

test("criteria can be removed and added back, and the approver changed to another of the vertical's people", async ({ page }) => {
  await openApprovalsPanel(page, "saas");
  await page.getByTestId("approval-workflow-link").click();
  const workflow = page.getByTestId("approval-workflow");
  const panel = workflow.getByTestId("aw-panel");

  // Removing criteria: only what is saved changes the rule, and Discard puts the panel back.
  await workflow.getByTestId("aw-branch").click();
  await panel.getByTestId("aw-remove-terms").click();
  await panel.getByTestId("aw-remove-floor").click();
  await expect(panel.locator("[data-testid^=aw-group-]")).toHaveCount(1);
  await expect(workflow.locator("[data-testid^=aw-criteria-]")).toHaveCount(3);
  await panel.getByTestId("aw-discard").click();
  await expect(panel.locator("[data-testid^=aw-group-]")).toHaveCount(3);
  await panel.getByTestId("aw-remove-terms").click();
  await panel.getByTestId("aw-remove-floor").click();
  await panel.getByTestId("aw-limit").fill("ten");
  await expect(panel.getByTestId("aw-limit-error")).toBeVisible();
  await expect(panel.getByTestId("aw-panel-save")).toBeDisabled();
  await panel.getByTestId("aw-limit").fill("10");
  await panel.getByTestId("aw-panel-save").click();
  await expect(workflow.locator("[data-testid^=aw-criteria-]")).toHaveCount(1);
  await expect(workflow.getByTestId("aw-step-message")).toHaveText("A discount over 10% needs approval from Mei Tanaka, Deal Desk Manager.");
  await expect(page.locator("[data-ext]")).toHaveCount(0);

  // Adding back: the kinds this vertical's rule can have, and no others.
  await workflow.getByTestId("aw-branch").click();
  await panel.getByTestId("aw-add-criteria").click();
  await expect(panel.getByTestId("aw-add-list").locator("button")).toHaveText(["Line item: Below floor price", "Net payment terms"]);
  await panel.getByTestId("aw-add-floor").click();
  await expect(panel.getByTestId("aw-group-floor").getByTestId("ext-pin-floor-price-rule")).toBeVisible();
  await panel.getByTestId("aw-panel-save").click();
  await expect(workflow.getByTestId("aw-criteria-floor")).toHaveText("Line item: Below floor price is equal to True");
  await expect(workflow.getByTestId("aw-criteria-terms")).toHaveCount(0);
  await expect(page.locator("[data-ext]")).toHaveCount(1);
  await expect(page.locator("[data-ext=floor-price-rule]")).toHaveCount(1);

  // With every criteria removed, nothing asks for approval.
  await workflow.getByTestId("aw-branch").click();
  await panel.getByTestId("aw-remove-discount").click();
  await panel.getByTestId("aw-remove-floor").click();
  await expect(panel.getByTestId("aw-no-criteria")).toHaveText("This segment doesn't have any criteria");
  await panel.getByTestId("aw-panel-save").click();
  await expect(workflow.getByTestId("aw-criteria-none")).toBeVisible();
  await expect(workflow.getByTestId("aw-step-message")).toHaveText("No criteria are set, so quotes are approved automatically.");
  await workflow.getByTestId("aw-back-quote").click();
  await expect(page.getByTestId("approval-status")).toHaveText("Approval not needed");
  await expect(page.getByTestId("quote-send")).toBeVisible();
  await page.getByTestId("approval-settings-link").click();
  await page.getByTestId("advanced-approvals-edit").click();
  await workflow.getByTestId("aw-branch").click();
  await panel.getByTestId("aw-add-criteria").click();
  await panel.getByTestId("aw-add-discount").click();
  await panel.getByTestId("aw-panel-save").click();
  await expect(workflow.getByTestId("aw-criteria-discount")).toHaveText("Total discount percent is greater than 10%");

  // The approver: the vertical's people, without the rep who writes the quotes.
  await workflow.getByTestId("aw-step").click();
  await expect(panel.getByTestId("aw-panel-approver").locator("option")).toHaveCount(5);
  await expect(panel.getByTestId("aw-panel-approver")).not.toContainText("Jordan Avery");
  await panel.getByTestId("aw-panel-approver").selectOption("carmen");
  await expect(panel.getByTestId("aw-panel-message")).toHaveValue("A discount over 10% needs approval from Carmen Okoye, Enterprise Account Executive, West.");
  await expect(workflow.getByTestId("aw-step-approver")).toHaveText("Mei Tanaka");
  await panel.getByTestId("aw-panel-save").click();
  await expect(workflow.getByTestId("aw-step-approver")).toHaveText("Carmen Okoye");

  await workflow.getByTestId("aw-flow").click();
  await panel.getByLabel("Any approvers").check();
  await panel.getByTestId("aw-panel-save").click();
  await workflow.getByTestId("aw-flow").click();
  await expect(panel.getByLabel("Any approvers")).toBeChecked();
  await panel.getByTestId("aw-panel-close").click();

  // The request goes to the new approver, and the guided steps follow it to the end.
  await workflow.getByTestId("aw-back-quote").click();
  await page.getByTestId("quote-request-approval").click();
  await expect(page.getByRole("dialog")).toContainText("Carmen Okoye");
  await page.getByTestId("request-approval-submit").click();
  await expect(page.getByTestId("approval-card")).toContainText("requested approval from Carmen Okoye");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 3 of 6");
  await page.getByTestId("demo-next").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 4 of 6");
  await walk(page);
  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
});

for (const { vertical } of RULES) {
  test(`the guided steps still finish after the rule was edited so the scripted discount passes: ${vertical}`, async ({ page }) => {
    await openDemo(page, "discount-approval", vertical);
    await page.goto(`/demo/${vertical}/discount-approval/workflows/quote-approval`);
    const workflow = page.getByTestId("approval-workflow");
    await workflow.getByTestId("aw-branch").click();
    await workflow.getByTestId("aw-limit").fill("60");
    const others = workflow.locator("[data-testid^=aw-remove-]:not([data-testid=aw-remove-discount])");
    while (await others.count()) await others.first().click();
    await workflow.getByTestId("aw-panel-save").click();
    await expect(workflow.locator("[data-testid^=aw-criteria-]")).toHaveCount(1);
    await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 6");

    // Next puts the pack's rule back where the scripted step could not finish under the edited one.
    expect(await walk(page)).toBe(6);
    await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
  });
}
