"use client";

import { lazy, Suspense } from "react";
import { useShell } from "@/store/store";

type MarketingMod = typeof import("./views");
let cached: MarketingMod | null = null;

const loadMarketing = () =>
  import("./views").then((m) => {
    cached = m;
    return m;
  });

export function preloadMarketing(): Promise<unknown> {
  return loadMarketing();
}

const MarketingViewInner = lazy(() => loadMarketing().then((m) => ({ default: m.MarketingView })));
const IcpMatchCardInner = lazy(() => loadMarketing().then((m) => ({ default: m.IcpMatchCard })));
const MarketingContactBannerInner = lazy(() => loadMarketing().then((m) => ({ default: m.MarketingContactBanner })));
const MarketingTaskBannerInner = lazy(() => loadMarketing().then((m) => ({ default: m.MarketingTaskBanner })));
const MarketingDealBannerInner = lazy(() => loadMarketing().then((m) => ({ default: m.MarketingDealBanner })));

export function LazyMarketingView({ id, sub }: { id?: string; sub?: string }) {
  if (cached) {
    const Comp = cached.MarketingView;
    return <Comp id={id} sub={sub} />;
  }
  return (
    <Suspense fallback={null}>
      <MarketingViewInner id={id} sub={sub} />
    </Suspense>
  );
}

export function IcpMatchCard({ companyId }: { companyId: string }) {
  const { pack } = useShell();
  if (pack.demos.marketingStudio?.companyId !== companyId) return null;
  if (cached) {
    const Comp = cached.IcpMatchCard;
    return <Comp companyId={companyId} />;
  }
  return (
    <Suspense fallback={null}>
      <IcpMatchCardInner companyId={companyId} />
    </Suspense>
  );
}

export function MarketingContactBanner({ contactId }: { contactId: string }) {
  const { pack, world } = useShell();
  if (pack.demos.marketingStudio?.primaryContactId !== contactId || !world.ms.converted) return null;
  if (cached) {
    const Comp = cached.MarketingContactBanner;
    return <Comp contactId={contactId} />;
  }
  return (
    <Suspense fallback={null}>
      <MarketingContactBannerInner contactId={contactId} />
    </Suspense>
  );
}

export function MarketingTaskBanner() {
  const { pack, world } = useShell();
  if (!pack.demos.marketingStudio || !world.ms.converted) return null;
  if (cached) {
    const Comp = cached.MarketingTaskBanner;
    return <Comp />;
  }
  return (
    <Suspense fallback={null}>
      <MarketingTaskBannerInner />
    </Suspense>
  );
}

export function MarketingDealBanner({ dealId }: { dealId: string }) {
  const { pack } = useShell();
  if (pack.demos.marketingStudio?.deal.id !== dealId) return null;
  if (cached) {
    const Comp = cached.MarketingDealBanner;
    return <Comp dealId={dealId} />;
  }
  return (
    <Suspense fallback={null}>
      <MarketingDealBannerInner dealId={dealId} />
    </Suspense>
  );
}
