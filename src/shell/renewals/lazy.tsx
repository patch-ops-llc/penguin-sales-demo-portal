"use client";

import { lazy, Suspense } from "react";
import { useShell } from "@/store/store";
import type { RenewalsRouteProps } from "./views";

type RenewalsMod = typeof import("./views");
let cached: RenewalsMod | null = null;

const loadRenewals = () =>
  import("./views").then((m) => {
    cached = m;
    return m;
  });

const RenewalsRouteViewInner = lazy(() => loadRenewals().then((m) => ({ default: m.RenewalsRouteView })));
const RenewalsCompanyPanelInner = lazy(() => loadRenewals().then((m) => ({ default: m.RenewalsCompanyPanel })));
const RenewalsDealPanelInner = lazy(() => loadRenewals().then((m) => ({ default: m.RenewalsDealPanel })));

export function preloadRenewals(): Promise<unknown> {
  return loadRenewals();
}

/**
 * Lazy-loads the reusable Renewals & Subscriptions workspace (`dual-pipeline`, `health-churn`,
 * `contract-qbr`) as one cohesive chunk. Preloaded on demo entry for renewals demos so initial
 * shell JS stays lean and every step transition makes 0 network requests.
 */
export function RenewalsRoutes(props: RenewalsRouteProps) {
  if (cached) {
    const Comp = cached.RenewalsRouteView;
    return <Comp {...props} />;
  }
  return (
    <Suspense fallback={<div className="min-h-full bg-hs-bg" />}>
      <RenewalsRouteViewInner {...props} />
    </Suspense>
  );
}

export function RenewalsCompanyPanel({ companyId }: { companyId: string }) {
  const { pack } = useShell();
  const renewals = pack.demos.renewals;
  if (!renewals) return null;
  const matches = Object.values(renewals).some((cfg) => cfg && cfg.mode === "health-churn" && cfg.companyId === companyId);
  if (!matches) return null;
  if (cached) {
    const Comp = cached.RenewalsCompanyPanel;
    return <Comp companyId={companyId} />;
  }
  return (
    <Suspense fallback={null}>
      <RenewalsCompanyPanelInner companyId={companyId} />
    </Suspense>
  );
}

export function RenewalsDealPanel({ dealId }: { dealId: string }) {
  const { pack } = useShell();
  const renewals = pack.demos.renewals;
  if (!renewals) return null;
  const matches = Object.values(renewals).some((cfg) => {
    if (!cfg) return false;
    if (cfg.mode === "dual-pipeline") return cfg.premiumDealId === dealId || cfg.subscriptionDeal.dealId === dealId;
    return cfg.renewalDeal.dealId === dealId;
  });
  if (!matches) return null;
  if (cached) {
    const Comp = cached.RenewalsDealPanel;
    return <Comp dealId={dealId} />;
  }
  return (
    <Suspense fallback={null}>
      <RenewalsDealPanelInner dealId={dealId} />
    </Suspense>
  );
}
