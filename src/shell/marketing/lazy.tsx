"use client";

import { lazy, Suspense } from "react";
import { useShell } from "@/store/store";

const loadMarketing = () => import("./views");

const MarketingViewInner = lazy(() => loadMarketing().then((m) => ({ default: m.MarketingView })));
const IcpMatchCardInner = lazy(() => loadMarketing().then((m) => ({ default: m.IcpMatchCard })));
const MarketingContactBannerInner = lazy(() => loadMarketing().then((m) => ({ default: m.MarketingContactBanner })));
const MarketingTaskBannerInner = lazy(() => loadMarketing().then((m) => ({ default: m.MarketingTaskBanner })));
const MarketingDealBannerInner = lazy(() => loadMarketing().then((m) => ({ default: m.MarketingDealBanner })));

export function LazyMarketingView({ id, sub }: { id?: string; sub?: string }) {
  return (
    <Suspense fallback={null}>
      <MarketingViewInner id={id} sub={sub} />
    </Suspense>
  );
}

export function IcpMatchCard({ companyId }: { companyId: string }) {
  const { pack } = useShell();
  if (pack.demos.marketingStudio?.companyId !== companyId) return null;
  return (
    <Suspense fallback={null}>
      <IcpMatchCardInner companyId={companyId} />
    </Suspense>
  );
}

export function MarketingContactBanner({ contactId }: { contactId: string }) {
  const { pack, world } = useShell();
  if (pack.demos.marketingStudio?.primaryContactId !== contactId || !world.ms.converted) return null;
  return (
    <Suspense fallback={null}>
      <MarketingContactBannerInner contactId={contactId} />
    </Suspense>
  );
}

export function MarketingTaskBanner() {
  const { pack, world } = useShell();
  if (!pack.demos.marketingStudio || !world.ms.converted) return null;
  return (
    <Suspense fallback={null}>
      <MarketingTaskBannerInner />
    </Suspense>
  );
}

export function MarketingDealBanner({ dealId }: { dealId: string }) {
  const { pack } = useShell();
  if (pack.demos.marketingStudio?.deal.id !== dealId) return null;
  return (
    <Suspense fallback={null}>
      <MarketingDealBannerInner dealId={dealId} />
    </Suspense>
  );
}
