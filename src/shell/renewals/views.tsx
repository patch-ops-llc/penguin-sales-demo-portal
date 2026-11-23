"use client";

import { useShell } from "@/store/store";
import { A, Card, Empty } from "../ui";
import { BillingCheckoutView, QbrSchedulerView } from "./off-platform";
import type { RenewalsDemoId } from "./types";
import { DualPipelinesView, RenewalsIndexView, RenewalTriggerView } from "./workspace";

export { RenewalsCompanyPanel, RenewalsDealPanel } from "./panels";

export type RenewalsRouteProps = {
  section: "renewals" | "renewals-app";
  demoId?: string;
  view?: string;
};

function isRenewalsDemoId(value: string | undefined): value is RenewalsDemoId {
  return value === "premium-to-subscription" || value === "renewal-churn-risk" || value === "contract-renewal";
}

export function RenewalsRouteView({ section, demoId, view }: RenewalsRouteProps) {
  const { pack } = useShell();

  if (section === "renewals" && !demoId) {
    return <RenewalsIndexView />;
  }

  const cfg = isRenewalsDemoId(demoId) ? pack.demos.renewals?.[demoId] : undefined;
  if (!cfg) {
    return (
      <div className="p-10">
        <Card>
          <Empty title="This renewals workspace is not configured for this portal">
            <A to="/deals" className="hs-link">
              Return to Deals
            </A>
          </Empty>
        </Card>
      </div>
    );
  }

  if (section === "renewals-app") {
    if (cfg.mode === "dual-pipeline" && view === "checkout") {
      return <BillingCheckoutView cfg={cfg} />;
    }
    if (cfg.mode === "contract-qbr" && view === "qbr") {
      return <QbrSchedulerView cfg={cfg} />;
    }
  }

  if (cfg.mode === "dual-pipeline") {
    return <DualPipelinesView cfg={cfg} />;
  }
  if (cfg.mode === "health-churn") {
    return <RenewalTriggerView demoId="renewal-churn-risk" cfg={cfg} />;
  }
  return <RenewalTriggerView demoId="contract-renewal" cfg={cfg} />;
}
