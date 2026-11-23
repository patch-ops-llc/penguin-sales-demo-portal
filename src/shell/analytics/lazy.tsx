"use client";

import { lazy, Suspense } from "react";

type AnalyticsMod = typeof import("./report-page");
let cached: AnalyticsMod | null = null;

const loadAnalytics = () =>
  import("./report-page").then((m) => {
    cached = m;
    return m;
  });

const AnalyticsRouteViewInner = lazy(() => loadAnalytics().then((m) => ({ default: m.AnalyticsRouteView })));

export function preloadAnalytics(): Promise<unknown> {
  return loadAnalytics();
}

/**
 * Lazy-loads the shared declarative Analytics & Credits-to-Outcome module as one cohesive chunk.
 * Preloaded on demo entry whenever a demo attaches reports (or on `/reports/*` entry), keeping
 * initial shell JS unaffected for core demos and preserving 0 network calls during demo steps.
 */
export function AnalyticsRoutes({ reportId }: { reportId?: string }) {
  if (cached) {
    const Comp = cached.AnalyticsRouteView;
    return <Comp reportId={reportId} />;
  }
  return (
    <Suspense fallback={<div className="min-h-full bg-hs-bg" />}>
      <AnalyticsRouteViewInner reportId={reportId} />
    </Suspense>
  );
}
