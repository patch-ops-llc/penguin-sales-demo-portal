"use client";

import { useShell } from "@/store/store";
import { AnalyticsRoutes } from "./analytics/lazy";
import { IntakeRoutes } from "./intake/lazy";
import { LazyMarketingView } from "./marketing/lazy";
import { LazyApprovalWorkflowPage, LazySettingsPage } from "./pages/approval-settings-lazy";
import { CompaniesIndex, ContactsIndex, DealsIndex, ProductsIndex, QuotesIndex, TasksIndex, WorkflowsIndex } from "./pages/lists";
import { InboxPage } from "./pages/inbox";
import { ProspectingPage } from "./pages/prospecting";
import { ApprovalPage, QuotePage } from "./pages/quote";
import { CompanyRecord, ContactRecord, DealRecord } from "./pages/records";
import { LazySitePage } from "./pages/site-lazy";
import { WorkflowPage } from "./pages/workflow";
import { APPROVAL_WORKFLOW_ID } from "./quote/approval-rule";
import { LazyBuyerPage } from "./quote/buyer-lazy";
import { RenewalsRoutes } from "./renewals/lazy";
import { ServiceRoutes } from "./service/lazy";
import { SocialRoutes } from "./social/lazy";
import { TicketsRoutes } from "./tickets/lazy";
import { A, Card, Empty } from "./ui";

/**
 * Screens that fill the window instead of sitting inside HubSpot's navigation: the quote editor,
 * which HubSpot opens full screen, the buyer's quote page, the public website, and off-platform apps.
 */
export function isOutsideHubSpot(segments: string[]): boolean {
  return (
    ((segments[0] === "quotes" || segments[0] === "approvals") && Boolean(segments[1])) ||
    segments[0] === "site" ||
    segments[0] === "service-app" ||
    segments[0] === "ticket-app" ||
    segments[0] === "offplatform" ||
    segments[0] === "intake" ||
    segments[0] === "renewals-app" ||
    (segments[0] === "marketing" && segments[1] === "off-platform")
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
      if (id && sub === "buyer") return <LazyBuyerPage key={id} id={id} />;
      return id ? <QuotePage key={id} id={id} /> : <QuotesIndex />;
    case "approvals":
      return id ? <ApprovalPage key={id} id={id} /> : <QuotesIndex />;
    case "tasks":
      return <TasksIndex />;
    case "products":
      return <ProductsIndex />;
    case "workflows":
      if (id === APPROVAL_WORKFLOW_ID) return <LazyApprovalWorkflowPage />;
      return id ? <WorkflowPage key={id} id={id} /> : <WorkflowsIndex />;
    case "inbox":
      return <InboxPage />;
    case "prospecting":
      return <ProspectingPage />;
    case "marketing":
      return <LazyMarketingView id={id} sub={sub} />;
    case "site":
      return <LazySitePage id={id} />;
    case "service-app":
    case "service":
    case "service-dashboard":
      return <ServiceRoutes section={section} id={id} sub={sub} />;
    case "tickets":
    case "ticket-app":
      return <TicketsRoutes section={section} id={id} sub={sub} />;
    case "settings":
      return <LazySettingsPage />;
    case "campaigns":
    case "social":
    case "insights":
    case "offplatform":
    case "reactivation":
    case "branch-launch":
      return <SocialRoutes section={section} id={id} />;
    case "intake":
      return <IntakeRoutes demoId={id} view={sub} />;
    case "renewals":
    case "renewals-app":
      return <RenewalsRoutes section={section} demoId={id} view={sub} />;
    case "reports":
      return <AnalyticsRoutes reportId={id} />;
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
