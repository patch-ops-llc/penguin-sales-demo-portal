"use client";

import { lazy, Suspense } from "react";

type AgentMod = typeof import("./dock");
let cached: AgentMod | null = null;

const loadAgent = () =>
  import("./dock").then((m) => {
    cached = m;
    return m;
  });

const LazyDock = lazy(() => loadAgent().then((m) => ({ default: m.AgentDock })));

export function preloadAgent(): Promise<unknown> {
  return loadAgent();
}

/**
 * The agent workspace loads as its own chunk, on entry into an agent-run demo, so the clicked
 * demos' shell bundle does not carry it and their steps stay free of network requests.
 */
export function AgentDockLazy() {
  if (cached) {
    const Comp = cached.AgentDock;
    return <Comp />;
  }
  return (
    <Suspense fallback={<aside className="w-[380px] shrink-0 border-l border-[#3b2a7a] bg-white" aria-hidden="true" />}>
      <LazyDock />
    </Suspense>
  );
}
