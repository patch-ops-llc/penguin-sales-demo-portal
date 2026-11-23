"use client";

import { lazy, Suspense } from "react";
import type { ServiceRouteProps } from "./router-view";

type ServiceMod = typeof import("./router-view");
let cached: ServiceMod | null = null;

const loadService = () =>
  import("./router-view").then((m) => {
    cached = m;
    return m;
  });

const ServiceRouteView = lazy(() => loadService().then((m) => ({ default: m.ServiceRouteView })));

export function preloadService(): Promise<unknown> {
  return loadService();
}

/**
 * Lazy-loads the Service Hub Customer Agent UI as one cohesive chunk so other demos'
 * initial shell JS bundle stays lean, while loading all service screens together on
 * entry into a customer-agent demo so every step transition stays 0-network-request.
 */
export function ServiceRoutes(props: ServiceRouteProps) {
  if (cached) {
    const Comp = cached.ServiceRouteView;
    return <Comp {...props} />;
  }
  return (
    <Suspense fallback={<div className="min-h-full bg-hs-bg" />}>
      <ServiceRouteView {...props} />
    </Suspense>
  );
}
