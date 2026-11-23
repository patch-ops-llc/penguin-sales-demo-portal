"use client";

import { A, Card, Empty } from "../ui";
import { IntakeDealPanel } from "./deal-panel";
import { IntakeFollowupPage, IntakeSubmitPage } from "./off-platform";
import type { IntakeDemoId } from "./types";

export { IntakeDealPanel };

function isIntakeDemoId(value: string | undefined): value is IntakeDemoId {
  return value === "referral-intake" || value === "staffing-job-orders" || value === "loan-application-pipeline";
}

export function IntakeRouteView({ demoId, view }: { demoId?: string; view?: string }) {
  if (!isIntakeDemoId(demoId)) {
    return (
      <div className="p-10">
        <Card>
          <Empty title="That intake view is not part of this demo">
            <A to="/deals" className="hs-link">
              Go to deals
            </A>
          </Empty>
        </Card>
      </div>
    );
  }
  if (view === "followup") return <IntakeFollowupPage demoId={demoId} />;
  return <IntakeSubmitPage demoId={demoId} />;
}
