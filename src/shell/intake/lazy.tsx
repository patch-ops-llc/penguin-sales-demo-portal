"use client";

import { lazy, Suspense } from "react";
import { useShell } from "@/store/store";

type IntakeMod = typeof import("./views");
let cached: IntakeMod | null = null;

const loadIntake = () =>
  import("./views").then((m) => {
    cached = m;
    return m;
  });

const IntakeRouteViewInner = lazy(() => loadIntake().then((m) => ({ default: m.IntakeRouteView })));
const IntakeDealPanelInner = lazy(() => loadIntake().then((m) => ({ default: m.IntakeDealPanel })));

export function preloadIntake(): Promise<unknown> {
  return loadIntake();
}

/**
 * Lazy-loads the reusable Intake & Scheduling workspace as one cohesive chunk.
 * Preloaded on demo entry for intake demos (`referral-intake`, `staffing-job-orders`, and Wave 3 `F2`)
 * so initial shell JS stays lean and every step transition makes 0 network requests.
 */
export function IntakeRoutes({ demoId, view }: { demoId?: string; view?: string }) {
  if (cached) {
    const Comp = cached.IntakeRouteView;
    return <Comp demoId={demoId} view={view} />;
  }
  return (
    <Suspense fallback={<div className="min-h-full bg-hs-bg" />}>
      <IntakeRouteViewInner demoId={demoId} view={view} />
    </Suspense>
  );
}

export function IntakeDealPanel({ dealId }: { dealId: string }) {
  const { pack } = useShell();
  if (!pack.demos.intake) return null;
  if (cached) {
    const Comp = cached.IntakeDealPanel;
    return <Comp dealId={dealId} />;
  }
  return (
    <Suspense fallback={null}>
      <IntakeDealPanelInner dealId={dealId} />
    </Suspense>
  );
}
