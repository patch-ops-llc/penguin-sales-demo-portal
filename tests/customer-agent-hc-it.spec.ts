import { expect, test } from "@playwright/test";
import { openDemo, signIn, walk } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test("launchpad registers Healthcare #1 and IT Services #1 under Service Hub & AI filter", async ({ page }) => {
  await page.getByTestId("vertical-healthcare").click();
  await expect(page.getByTestId("demo-customer-agent")).toBeVisible();
  await expect(page.getByTestId("demo-customer-agent")).toContainText("Customer agent: clinic front desk");

  await page.getByTestId("hub-filter-service").click();
  await expect(page.getByTestId("demo-customer-agent")).toBeVisible();
  await expect(page.getByTestId("demo-social-ads")).toHaveCount(0);

  await page.getByTestId("hub-filter-all").click();
  await page.getByTestId("vertical-professional-services").click();
  await expect(page.getByTestId("demo-customer-agent")).toBeVisible();
  await expect(page.getByTestId("demo-customer-agent")).toContainText("Customer agent: IT service desk");

  await page.getByTestId("filter-ai-toggle").click();
  await expect(page.getByTestId("demo-customer-agent")).toBeVisible();
});

test("healthcare #1 (clinic front desk): full 8-step walkthrough, HIPAA no-medical-advice guardrail, exact Penguin pins, zero network calls & zero console errors", async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(err.message));

  await openDemo(page, "customer-agent", "healthcare");
  await page.waitForLoadState("networkidle");

  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/events")) return;
    if (["document", "fetch", "xhr", "script", "stylesheet"].includes(r.resourceType())) {
      requests.push(`${r.resourceType()} ${r.url()}`);
    }
  });

  // Step 1: Off-platform clinic patient chat widget (after hours, HIPAA/BAA zero-PHI posture)
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 8");
  await expect(page.getByTestId("offplatform-chat")).toBeVisible();
  await expect(page.getByTestId("offplatform-compliance-note")).toContainText("HIPAA / BAA");
  await expect(page.getByTestId("offplatform-compliance-note")).toContainText("Zero clinical PHI");
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(0);

  await page.getByTestId("chat-view-mobile").click();
  await expect(page.getByTestId("chat-view-mobile")).toHaveAttribute("aria-pressed", "true");
  await page.getByTestId("chat-view-desktop").click();
  await expect(page.getByTestId("app-chat-input")).toHaveValue(/BlueCross PPO/);
  await page.getByTestId("app-chat-send").click();
  await expect(page.getByTestId("app-chat-sent-bubble")).toContainText("BlueCross PPO");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 2 of 8");
  await page.getByTestId("app-chat-open-hubspot").click();

  // Step 2: HubSpot Help Desk — Breeze answers logistics from Clinic KB; ONLY 1 Penguin marker (EHR scheduling & HIPAA guardrail)
  await expect(page.getByTestId("help-desk-page")).toBeVisible();
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(1);
  await expect(page.getByTestId("ext-pin-ehr-scheduling-guardrail")).toBeVisible();
  await page.getByTestId("ca-kb-answer").click();
  await expect(page.getByTestId("ca-kb-answered-banner")).toContainText("Clinic KB");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 3 of 8");

  // Step 3: Send EHR-synced scheduling link & log appointment on Nora Castell's timeline
  await page.getByTestId("ca-send-schedule").click();
  await expect(page.getByTestId("ca-appointment-booked-banner")).toContainText("APT-SC-4821");
  await expect(page.getByTestId("hd-external-card")).toContainText("APT-SC-4821");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 4 of 8");
  await page.getByTestId("ca-view-patient-timeline").click();

  // Step 4: Native contact timeline on Nora Castell — appointment & KB chat logged with ZERO Penguin markers
  await expect(page.getByTestId("record-title")).toHaveText("Nora Castell");
  await expect(page.getByTestId("timeline")).toContainText("APT-SC-4821");
  await expect(page.getByTestId("timeline")).toContainText("After-hours chat answered from Clinic KB");
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(0);
  await page.getByTestId("ca-continue-escalation").click();

  // Step 5: Second inquiry — symptom / blood-thinner question triggers strict No Medical Advice guardrail
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 5 of 8");
  await expect(page.getByTestId("offplatform-chat")).toBeVisible();
  await expect(page.getByTestId("app-chat-input")).toHaveValue(/blood thinner/);
  await page.getByTestId("app-chat-send").click();
  await expect(page.getByTestId("app-chat-hubspot-handoff")).toContainText("No Medical Advice guardrail");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 6 of 8");
  await page.getByTestId("app-chat-open-hubspot").click();

  // Step 6: Help Desk clinical guardrail handoff — explicit "No medical advice provided", 1 Penguin pin
  await expect(page.getByTestId("hd-panel-escalation")).toBeVisible();
  await expect(page.getByTestId("ca-guardrail-banner")).toContainText("No medical advice provided");
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(1);
  await expect(page.getByTestId("ext-pin-ehr-scheduling-guardrail")).toBeVisible();
  await page.getByTestId("ca-escalation-handoff").click();
  await expect(page.getByTestId("ca-escalation-handed-off-banner")).toContainText("TKT-HC-204");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 7 of 8");
  await page.getByTestId("ca-open-escalation-ticket").click();

  // Step 7: Ticket TKT-HC-204 — AI summary with No Medical Advice badge + staff resolution; 1 Penguin pin
  await expect(page.getByTestId("ticket-record-page")).toBeVisible();
  await expect(page.getByTestId("ticket-handoff-summary")).toContainText("NO MEDICAL ADVICE PROVIDED");
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(1);
  await expect(page.getByTestId("ext-pin-ehr-scheduling-guardrail")).toBeVisible();
  await page.getByTestId("ticket-send-reply").click();
  await expect(page.getByTestId("ticket-rep-sent")).toContainText("TKT-HC-204 resolved");
  await page.getByTestId("ticket-open-dashboard").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 8 of 8");

  // Step 8: Service Analytics dashboard — native KPIs unmarked, ONLY 1 Penguin pin on Credits-to-Outcome panel
  await expect(page.getByTestId("service-dashboard-page")).toBeVisible();
  await expect(page.getByTestId("kpi-resolution-value")).toContainText("78.4%");
  await expect(page.getByTestId("kpi-highlight-value")).toContainText("62.8%");
  await expect(page.getByTestId("service-credits-outcome-card")).toContainText("312 visits");
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(1);
  await expect(page.getByTestId("ext-pin-credits-outcome-bridge")).toBeVisible();

  await page.getByTestId("dash-period-7d").click();
  await expect(page.getByTestId("kpi-resolution-value")).toContainText("79.5%");
  await page.getByTestId("dash-period-30d").click();
  await expect(page.getByTestId("kpi-resolution-value")).toContainText("78.4%");

  // Complete Step 8 & inspect End Card: Built by Penguin has ONLY the 2 custom items
  await page.getByTestId("dash-complete-btn").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
  await expect(page.getByTestId("end-card")).toBeVisible();
  await expect(page.getByTestId("end-card")).toContainText("EHR / Practice Scheduling Sync & HIPAA Clinical-Guardrail Action");
  await expect(page.getByTestId("end-card")).toContainText("HubSpot Credits-to-Outcome Attribution Panel");

  expect(requests).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("it services #1 (IT service desk): full 8-step walkthrough across chat, email, L2 VPN escalation & dashboard with exact Penguin pins, zero network calls & zero console errors", async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(err.message));

  await openDemo(page, "customer-agent", "professional-services");
  await page.waitForLoadState("networkidle");

  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/events")) return;
    if (["document", "fetch", "xhr", "script", "stylesheet"].includes(r.resourceType())) {
      requests.push(`${r.resourceType()} ${r.url()}`);
    }
  });

  // Step 1: Off-platform Quillon IT Service Desk chat portal (password reset + INC-7741 status)
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 8");
  await expect(page.getByTestId("offplatform-chat")).toBeVisible();
  await expect(page.getByTestId("app-chat-input")).toHaveValue(/INC-7741/);
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(0);
  await page.getByTestId("app-chat-send").click();
  await expect(page.getByTestId("app-chat-sent-bubble")).toContainText("INC-7741");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 2 of 8");
  await page.getByTestId("app-chat-open-hubspot").click();

  // Step 2: HubSpot Help Desk resolves M365 password reset from IT KB + checks live PSA tier & INC-7741
  await expect(page.getByTestId("help-desk-page")).toBeVisible();
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(1);
  await expect(page.getByTestId("ext-pin-psa-rmm-lookup")).toBeVisible();
  await expect(page.getByTestId("hd-external-card")).toContainText("Managed IT Complete");
  await page.getByTestId("ca-kb-answer").click();
  await expect(page.getByTestId("ca-chat-resolved-banner")).toContainText("Chat resolved autonomously");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 3 of 8");
  await page.getByTestId("ca-next-email").click();

  // Step 3: Off-platform client email (REQ-7812 status + MFA setup guide)
  await expect(page.getByTestId("offplatform-email")).toBeVisible();
  await page.getByTestId("email-item-alert").click();
  await expect(page.getByText("PSA Ticket Receipt")).toBeVisible();
  await page.getByTestId("email-item-compose").click();
  await page.getByTestId("email-send-btn").click();
  await expect(page.getByTestId("email-sent-banner")).toContainText("servicedesk@quillontech.example");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 4 of 8");
  await page.getByTestId("email-open-hubspot").click();

  // Step 4: Help Desk Email resolves REQ-7812 status & MFA guide via PSA lookup + IT KB
  await expect(page.getByTestId("hd-panel-email")).toBeVisible();
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(1);
  await expect(page.getByTestId("ext-pin-psa-rmm-lookup")).toBeVisible();
  await page.getByTestId("ca-email-reply").click();
  await expect(page.getByTestId("ca-email-replied-banner")).toContainText("REQ-7812");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 5 of 8");
  await page.getByTestId("ca-next-escalation").click();

  // Step 5: Complex multi-site VPN & firewall outage submitted via IT portal chat
  await expect(page.getByTestId("offplatform-chat")).toBeVisible();
  await expect(page.getByTestId("app-chat-input")).toHaveValue(/IPsec VPN/);
  await page.getByTestId("app-chat-send").click();
  await expect(page.getByTestId("app-chat-hubspot-handoff")).toContainText("L2 network engineer");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 6 of 8");
  await page.getByTestId("app-chat-open-hubspot").click();

  // Step 6: Help Desk escalates to L2 engineer Soledad Ruiz with AI summary & PSA/RMM telemetry
  await expect(page.getByTestId("hd-panel-escalation")).toBeVisible();
  await expect(page.getByTestId("ca-guardrail-banner")).toContainText("15-Min P1 SLA");
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(1);
  await expect(page.getByTestId("ext-pin-psa-rmm-lookup")).toBeVisible();
  await page.getByTestId("ca-escalation-handoff").click();
  await expect(page.getByTestId("ca-escalation-handed-off-banner")).toContainText("TKT-IT-8904");
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 7 of 8");
  await page.getByTestId("ca-open-escalation-ticket").click();

  // Step 7: L2 Ticket TKT-IT-8904 with unified Chat & Email history, channel filters, 1 Penguin pin, engineer resolves
  await expect(page.getByTestId("ticket-record-page")).toBeVisible();
  await expect(page.getByTestId("ticket-handoff-summary")).toContainText("FW-ATL-01");
  await expect(page.getByTestId("unified-entry-chat").first()).toBeVisible();
  await expect(page.getByTestId("unified-entry-email")).toBeVisible();
  await page.getByTestId("ticket-filter-email").click();
  await expect(page.getByTestId("unified-entry-email")).toBeVisible();
  await expect(page.getByTestId("unified-entry-chat")).toHaveCount(0);
  await page.getByTestId("ticket-filter-all").click();
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(1);
  await expect(page.getByTestId("ext-pin-psa-rmm-lookup")).toBeVisible();

  await page.getByTestId("ticket-send-reply").click();
  await expect(page.getByTestId("ticket-rep-sent")).toContainText("TKT-IT-8904 closed");
  await page.getByTestId("ticket-open-dashboard").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Step 8 of 8");

  // Step 8: Service Analytics dashboard — tickets by channel, auto-resolution rate, FRT; ONLY 1 Penguin pin
  await expect(page.getByTestId("service-dashboard-page")).toBeVisible();
  await expect(page.getByTestId("kpi-resolution-value")).toContainText("72.8%");
  await expect(page.getByTestId("kpi-highlight-value")).toContainText("42s");
  await expect(page.getByTestId("service-credits-outcome-card")).toContainText("298 hrs / mo");
  await expect(page.locator('[data-testid^="ext-pin-"]')).toHaveCount(1);
  await expect(page.getByTestId("ext-pin-credits-outcome-bridge")).toBeVisible();

  await page.getByTestId("dash-channel-email-service-desk-").click();
  await expect(page.getByTestId("kpi-resolution-value")).toContainText("68.5%");
  await page.getByTestId("dash-channel-all").click();
  await expect(page.getByTestId("kpi-resolution-value")).toContainText("72.8%");

  await page.getByTestId("dash-complete-btn").click();
  await expect(page.getByTestId("demo-step-count")).toHaveText("Complete");
  await expect(page.getByTestId("end-card")).toBeVisible();
  await expect(page.getByTestId("end-card")).toContainText("PSA / RMM Account Plan & Ticket-Status Action");
  await expect(page.getByTestId("end-card")).toContainText("HubSpot Credits-to-Outcome Attribution Panel");

  expect(requests).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("healthcare and IT services customer-agent support Next, Back, Reset, reload persistence, and shared Analytics reports", async ({ page }) => {
  for (const { vertical, reportId, reportHeading } of [
    {
      vertical: "healthcare",
      reportId: "clinic-service-analytics",
      reportHeading: "Clinic Front Desk: Resolutions, After-Hours & Handoffs",
    },
    {
      vertical: "professional-services",
      reportId: "it-service-desk-analytics",
      reportHeading: "IT Service Desk: Tickets by Channel, Auto-Resolution & FRT",
    },
  ]) {
    await openDemo(page, "customer-agent", vertical);
    const taken = await walk(page);
    expect(taken).toBe(8);
    await expect(page.getByTestId("service-dashboard-page")).toBeVisible();

    // Open shared declarative report view via lazy analytics module
    await page.getByTestId("dash-open-report").click();
    await expect(page.getByTestId("analytics-report-page")).toHaveAttribute("data-report-id", reportId);
    await expect(page.getByTestId("analytics-report-title")).toContainText(reportHeading);

    // Go Back (first click unwinds completed Step 8, second click navigates back to Step 7 Ticket)
    await page.getByTestId("demo-back").click();
    await expect(page.getByTestId("demo-step-count")).toHaveText("Step 8 of 8");
    await page.getByTestId("demo-back").click();
    await expect(page.getByTestId("demo-step-count")).toHaveText("Step 7 of 8");
    await expect(page.getByTestId("ticket-record-page")).toBeVisible();

    // Reload and verify state persists
    await page.reload();
    await expect(page.getByTestId("demo-step-count")).toHaveText("Step 7 of 8");

    // Reset returns to Step 1
    await page.getByTestId("demo-reset").click();
    await expect(page.getByTestId("demo-step-count")).toHaveText("Step 1 of 8");
    await expect(page.getByTestId("offplatform-chat")).toBeVisible();
  }
});
