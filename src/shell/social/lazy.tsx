"use client";

import { Suspense, lazy } from "react";

type SocialRouteProps = {
  section: "campaigns" | "social" | "insights" | "offplatform";
  id?: string;
};

const SocialRouteView = lazy(() => import("./router-view"));

/**
 * Lazy-loads the Flow 3 social/ads UI as one cohesive chunk so other verticals'
 * initial demo shell JS bundle stays lean, while loading all Flow 3 screens together
 * on first entry into Healthcare so every step transition stays 0-network-request.
 */
export function SocialRoutes(props: SocialRouteProps) {
  return (
    <Suspense fallback={<div className="min-h-full bg-hs-bg" />}>
      <SocialRouteView {...props} />
    </Suspense>
  );
}
