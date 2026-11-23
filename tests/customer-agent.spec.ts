import { expect, test } from "@playwright/test";
import { openDemo, signIn } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test("financial services launchpad preserves all 6 existing demos and adds Customer agent", async ({ page }) => {
  await page.getByTestId("vertical-financial-services").click();
  for (const id of ["guided-quote", "discount-approval", "back-office", "lead-capture", "email-to-deal", "ai-prospecting", "customer-agent"]) {
    await expect(page.getByTestId(`start-${id}`)).toBeVisible();
  }
  await expect(page.getByTestId("demo-customer-agent")).toContainText("Customer agent (chat, email, voice)");
});

test("customer agent: full 12-step interactive walkthrough across chat, email, voice, fraud handoff, and dashboard with zero network calls", async ({ page }) => {
  await openDemo(page, "customer-agent", "financial-services");
  await page.waitForLoadState("networkidle");

  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/events")) return;
    if (["document", "fetch", "xhr", "script", "stylesheet"].includes(r.resourceType())) {
      requests.push(`${r.resourceType()} ${r.url()}`);
    }
  });

  // Step 1: Off-platform fintech app chat
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 12");
  await expect(page.getByTestId("offplatform-chat")).toBeVisible();
  await page.getByTestId("chat-view-mobile").click();
  await expect(page.getByTestId("chat-view-mobile")).toHaveAttribute("aria-pressed", "true");
  await page.getByTestId("chat-view-desktop").click();
  await expect(page.getByTestId("app-chat-input")).toHaveValue("Why is my transfer still pending?");
  await page.getByTestId("app-chat-send").click();
  await expect(page.getByTestId("app-chat-sent-bubble")).toContainText("Why is my transfer still pending?");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 2 of 12");
  await page.getByTestId("app-chat-open-hubspot").click();

  // Step 2: HubSpot Help Desk matches Sabine Keller and pulls account & transfer (amounts masked before security check)
  await expect(page.getByTestId("help-desk-page")).toBeVisible();
  await page.getByTestId("ca-chat-match").click();
  await expect(page.getByTestId("hd-core-banking-card")).toContainText("FH-TR-44812");
  await expect(page.getByTestId("hd-core-banking-card")).toContainText("verify signer first");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 3 of 12");

  // Step 3: Security check unlocks transfer details
  await page.getByTestId("ca-chat-verify").click();
  await expect(page.getByTestId("ca-step3-card")).toContainText("SEC-CHK-90418");
  await expect(page.getByTestId("hd-core-banking-card")).toContainText("$48,500");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 4 of 12");

  // Step 4: Agent explains transfer timing and logs chat as resolved
  await page.getByTestId("ca-chat-resolve").click();
  await expect(page.getByTestId("ca-chat-resolved-banner")).toContainText("logged as resolved");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 5 of 12");
  await page.getByTestId("ca-next-email").click();

  // Step 5: Off-platform customer email client
  await expect(page.getByTestId("offplatform-email")).toBeVisible();
  await page.getByTestId("email-item-alert").click();
  await expect(page.getByText("Card Activity Alert")).toBeVisible();
  await page.getByTestId("email-item-compose").click();
  await page.getByTestId("email-send-btn").click();
  await expect(page.getByTestId("email-sent-banner")).toContainText("support@fernhillcapital.example");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 6 of 12");
  await page.getByTestId("email-open-hubspot").click();

  // Step 6: Email agent matches contact, replies with dispute steps, opens TKT-4089
  await expect(page.getByTestId("hd-panel-email")).toBeVisible();
  await page.getByTestId("ca-email-reply").click();
  await expect(page.getByTestId("ca-email-replied-banner")).toContainText("TKT-4089");
  await expect(page.getByTestId("hd-core-banking-card")).toContainText("Temporarily Frozen");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 7 of 12");
  await page.getByTestId("ca-next-phone").click();

  // Step 7: Off-platform realistic phone call screen
  await expect(page.getByTestId("offplatform-phone")).toBeVisible();
  await page.getByTestId("phone-mute").click();
  await expect(page.getByTestId("phone-mute")).toHaveAttribute("aria-pressed", "true");
  await page.getByTestId("phone-mute").click();
  await page.getByTestId("phone-keypad-toggle").click();
  await expect(page.getByTestId("phone-keypad")).toBeVisible();
  await page.getByTestId("phone-keypad-toggle").click();
  await page.getByTestId("phone-place-call").click();
  await expect(page.getByTestId("phone-line-vt-2")).toContainText("Halle Voss");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 8 of 12");
  await page.getByTestId("phone-open-hubspot").click();

  // Step 8: Voice agent verifies caller and unlocks account
  await expect(page.getByTestId("hd-panel-voice")).toBeVisible();
  await page.getByTestId("ca-voice-unlock").click();
  await expect(page.getByTestId("ca-voice-unlocked-banner")).toContainText("UNL-55209");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 9 of 12");
  await page.getByTestId("ca-view-halle-timeline").click();

  // Step 9: Native contact timeline on Halle Voss shows full voice transcript (with NO Penguin marker)
  await expect(page.getByTestId("record-title")).toHaveText("Halle Voss");
  await expect(page.getByTestId("timeline")).toContainText("Voice call transcribed & resolved");
  await expect(page.getByTestId("timeline")).toContainText("8-4-7, 2-9-1");
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(0);
  await page.getByTestId("ca-continue-fraud").click();

  // Step 10: Complex fraud report escalated to human rep with structured summary
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 10 of 12");
  await expect(page.getByTestId("hd-panel-fraud")).toBeVisible();
  await page.getByTestId("ca-fraud-handoff").click();
  await expect(page.getByTestId("ca-fraud-handed-off-banner")).toContainText("TKT-4091");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 11 of 12");
  await page.getByTestId("ca-open-fraud-ticket").click();

  // Step 11: Human rep opens Ticket TKT-4091 with unified chat, email, and voice history
  await expect(page.getByTestId("ticket-record-page")).toBeVisible();
  await expect(page.getByTestId("ticket-handoff-summary")).toContainText("Suspected account takeover");
  await expect(page.getByTestId("unified-entry-chat")).toBeVisible();
  await expect(page.getByTestId("unified-entry-email")).toBeVisible();
  await expect(page.getByTestId("unified-entry-voice")).toBeVisible();
  await page.getByTestId("ticket-filter-voice").click();
  await expect(page.getByTestId("unified-entry-voice")).toBeVisible();
  await expect(page.getByTestId("unified-entry-chat")).toHaveCount(0);
  await page.getByTestId("ticket-filter-all").click();
  await page.getByTestId("ticket-send-reply").click();
  await expect(page.getByTestId("ticket-rep-sent")).toBeVisible();
  await page.getByTestId("ticket-open-dashboard").click();

  // Step 12: Native Service Hub Dashboard (70%+ resolution, channel volume, handoffs, credits — NO Penguin pins)
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 12 of 12");
  await expect(page.getByTestId("service-dashboard-page")).toBeVisible();
  await expect(page.getByTestId("kpi-resolution-value")).toHaveText("74.6%");
  await expect(page.getByTestId("kpi-credits-value")).toContainText("1,633");
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(0);

  // Interactive dashboard filters
  await page.getByTestId("dash-period-7d").click();
  await expect(page.getByTestId("kpi-resolution-value")).toHaveText("75.6%");
  await page.getByTestId("dash-channel-chat").click();
  await expect(page.getByTestId("kpi-resolution-value")).toHaveText("80.3%");
  await page.getByTestId("dash-period-30d").click();
  await page.getByTestId("dash-channel-all").click();
  await expect(page.getByTestId("kpi-resolution-value")).toHaveText("74.6%");

  await page.getByTestId("dash-complete-btn").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
  await expect(page.getByTestId("end-card")).toBeVisible();
  expect(requests).toEqual([]);
});

test("customer agent: Penguin markers appear only on custom core-banking extensions, and Back/Reset work cleanly", async ({ page }) => {
  await openDemo(page, "customer-agent", "financial-services");

  // Step 1 -> Step 2 (Help Desk)
  await page.getByTestId("demo-next").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 2 of 12");
  const lookupPin = page.getByTestId("ext-pin-core-banking-lookup");
  const unlockPin = page.getByTestId("ext-pin-core-banking-unlock");
  await expect(lookupPin).toBeVisible();
  await expect(unlockPin).toBeVisible();
  await lookupPin.hover();
  await expect(page.getByTestId("ext-callout-core-banking-lookup")).toContainText("Core-banking ledger and transfer lookup action");

  // Back returns to Step 1 off-platform chat
  await page.getByTestId("demo-back").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 12");
  await expect(page.getByTestId("offplatform-chat")).toBeVisible();

  // Advance two steps, reload, verify persistence, then Reset
  await page.getByTestId("demo-next").click();
  await page.getByTestId("demo-next").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 3 of 12");
  await page.reload();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 3 of 12");

  await page.getByTestId("demo-reset").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 12");
  await expect(page.getByTestId("offplatform-chat")).toBeVisible();
});
