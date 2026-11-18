"use client";

import { useShell } from "@/store/store";
import { CompaniesIndex, ContactsIndex, DealsIndex, ProductsIndex, QuotesIndex, TasksIndex, WorkflowsIndex } from "./pages/lists";
import { ApprovalPage, BuyerPage, QuotePage } from "./pages/quote";
import { CompanyRecord, ContactRecord, DealRecord } from "./pages/records";
import { WorkflowPage } from "./pages/workflow";
import { A, Card, Empty } from "./ui";

/** Screens that sit outside the simulated HubSpot frame: the buyer's quote page and the public website. */
export function isOutsideHubSpot(segments: string[]): boolean {
  return (segments[0] === "quotes" && segments[2] === "buyer") || segments[0] === "site";
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
      return id ? <WorkflowPage key={id} id={id} /> : <WorkflowsIndex />;
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
