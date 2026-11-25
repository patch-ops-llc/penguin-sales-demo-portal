"use client";

import { lazy, Suspense } from "react";

type ClaudeMod = typeof import("./routes");
let cached: ClaudeMod | null = null;

const loadClaude = () =>
  import("./routes").then((m) => {
    cached = m;
    return m;
  });

const LazyRoutes = lazy(() => loadClaude().then((m) => ({ default: m.ClaudeRoutes })));

export function preloadClaude(): Promise<unknown> {
  return loadClaude();
}

export type ClaudeSection = "claude" | "beat" | "campaigns" | "support" | "dashboards";

/**
 * The headless flows' screens load as one chunk, on entry into a flow demo: the Claude stage, the
 * off-platform beats, and the HubSpot records only these flows create (campaign, ticket, dashboard).
 * The clicked demos' shell bundle does not carry any of it.
 */
export function ClaudeRoutes(props: { section: ClaudeSection; id?: string }) {
  if (cached) {
    const Comp = cached.ClaudeRoutes;
    return <Comp {...props} />;
  }
  return (
    <Suspense fallback={<div className="min-h-full bg-[#f5f1ea]" aria-hidden="true" />}>
      <LazyRoutes {...props} />
    </Suspense>
  );
}
