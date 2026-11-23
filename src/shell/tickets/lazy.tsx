"use client";

import { lazy, Suspense } from "react";
import type { TicketsRouteProps } from "./router-view";

type TicketsMod = typeof import("./router-view");
let cached: TicketsMod | null = null;

const loadTickets = () =>
  import("./router-view").then((m) => {
    cached = m;
    return m;
  });

const TicketsRouteViewInner = lazy(() => loadTickets().then((m) => ({ default: m.TicketsRouteView })));

export function preloadTickets(): Promise<unknown> {
  return loadTickets();
}

/**
 * Lazy-loads the reusable multi-mode Tickets workspace (`feedback`, `checklist`, `sla`, `incident`)
 * as one cohesive chunk. Preloaded on demo entry whenever a demo uses `pack.demos.tickets`, keeping
 * 0 KB added to initial shell JS for core demos and preserving 0 network requests during steps.
 */
export function TicketsRoutes(props: TicketsRouteProps) {
  if (cached) {
    const Comp = cached.TicketsRouteView;
    return <Comp {...props} />;
  }
  return (
    <Suspense fallback={<div className="min-h-full bg-hs-bg" />}>
      <TicketsRouteViewInner {...props} />
    </Suspense>
  );
}
