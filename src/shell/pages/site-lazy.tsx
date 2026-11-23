"use client";

import { lazy, Suspense } from "react";

type SiteMod = typeof import("./site");
let cached: SiteMod | null = null;

const loadSite = () =>
  import("./site").then((m) => {
    cached = m;
    return m;
  });

const SitePageInner = lazy(() => loadSite().then((m) => ({ default: m.SitePage })));

export function preloadSite(): Promise<unknown> {
  return loadSite();
}

export function LazySitePage({ id }: { id?: string }) {
  if (cached) {
    const Comp = cached.SitePage;
    return <Comp id={id} />;
  }
  return (
    <Suspense fallback={<div className="flex min-h-0 flex-1 bg-[#d9d9d9]" />}>
      <SitePageInner id={id} />
    </Suspense>
  );
}
