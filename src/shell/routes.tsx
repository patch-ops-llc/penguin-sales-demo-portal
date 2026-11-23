"use client";

import { useShell } from "@/store/store";
import { ApprovalWorkflowPage } from "./pages/approval-workflow";
import { CompaniesIndex, ContactsIndex, DealsIndex, ProductsIndex, QuotesIndex, TasksIndex, WorkflowsIndex } from "./pages/lists";
import { InboxPage } from "./pages/inbox";
import { ProspectingPage } from "./pages/prospecting";
import { ApprovalPage, BuyerPage, QuotePage } from "./pages/quote";
import { CompanyRecord, ContactRecord, DealRecord } from "./pages/records";
import { SettingsPage } from "./pages/settings";
import { SitePage } from "./pages/site";
import { WorkflowPage } from "./pages/workflow";
import { APPROVAL_WORKFLOW_ID } from "./quote/approval-rule";
import { ServiceDashboardPage } from "./service/dashboard";
import { HelpDeskPage } from "./service/help-desk";
import { OffplatformChatPage } from "./service/offplatform-chat";
import { OffplatformEmailPage } from "./service/offplatform-email";
import { OffplatformPhonePage } from "./service/offplatform-phone";
import { TicketRecordPage } from "./service/ticket";
import { A, Card, Empty } from "./ui";

/**
 * Screens that fill the window instead of sitting inside HubSpot's navigation: the quote editor,
 * which HubSpot opens full screen, the buyer's quote page, the public website, and off-platform apps.
 */
export function isOutsideHubSpot(segments: string[]): boolean {
  return (
    ((segments[0] === "quotes" || segments[0] === "approvals") && Boolean(segments[1])) ||
    segments[0] === "site" ||
    segments[0] === "service-app"
  );
}

export function Routes() {
  const { route } = useShell();
  const [section, id, sub] = route.segments;
  // Keying by record id gives each record a fresh screen, as a page load would.
  switch (section) {
    case "contacts":
      return id ? <ContactRecord key={id} id={id} /> : <ContactsIndex />;
    case "companies":
      return id ? <CompanyRecord key={id} id={id} /> : <CompaniesIndex />;
    case "deals":
      return id ? <DealRecord key={id} id={id} /> : <DealsIndex />;
    case "quotes":
      if (id && sub === "buyer") return <BuyerPage key={id} id={id} />;
      return id ? <QuotePage key={id} id={id} /> : <QuotesIndex />;
    case "approvals":
      return id ? <ApprovalPage key={id} id={id} /> : <QuotesIndex />;
    case "tasks":
      return <TasksIndex />;
    case "products":
      return <ProductsIndex />;
    case "workflows":
      if (id === APPROVAL_WORKFLOW_ID) return <ApprovalWorkflowPage />;
      return id ? <WorkflowPage key={id} id={id} /> : <WorkflowsIndex />;
    case "inbox":
      return <InboxPage />;
    case "prospecting":
      return <ProspectingPage />;
    case "site":
      return <SitePage />;
    case "service-app":
      if (id === "email") return <OffplatformEmailPage />;
      if (id === "phone") return <OffplatformPhonePage />;
      return <OffplatformChatPage />;
    case "service":
      if (id === "tickets" && sub) return <TicketRecordPage key={sub} id={sub} />;
      return <HelpDeskPage />;
    case "service-dashboard":
      return <ServiceDashboardPage />;
    case "settings":
      return <SettingsPage />;
    case undefined:
      return null;
    default:
      return (
        <div className="p-10">
          <Card>
            <Empty title="That page is not part of this demo">
              <A to="/deals" className="hs-link">
                Go to deals
              </A>
            </Empty>
          </Card>
        </div>
      );
  }
}
