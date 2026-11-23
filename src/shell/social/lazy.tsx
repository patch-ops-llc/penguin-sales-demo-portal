"use client";

import { lazy, Suspense } from "react";
import { useShell } from "@/store/store";

type SocialRouteProps = {
  section: "campaigns" | "social" | "insights" | "offplatform" | "reactivation" | "branch-launch";
  id?: string;
};

type SocialMod = typeof import("./router-view");
let cached: SocialMod | null = null;

const loadSocial = () =>
  import("./router-view").then((m) => {
    cached = m;
    return m;
  });

const SocialRouteView = lazy(() => loadSocial().then((m) => ({ default: m.SocialRouteView })));
const CampaignAttributionCardInner = lazy(() => loadSocial().then((m) => ({ default: m.CampaignAttributionCard })));
const FollowupAutomationBannerInner = lazy(() => loadSocial().then((m) => ({ default: m.FollowupAutomationBanner })));
const PqlContactBannerInner = lazy(() => loadSocial().then((m) => ({ default: m.PqlContactBanner })));

export function preloadSocial(): Promise<unknown> {
  return loadSocial();
}

/**
 * Lazy-loads the Flow 3 social/ads UI as one cohesive chunk so other verticals'
 * initial demo shell JS bundle stays lean, while loading all Flow 3 screens together
 * on first entry into Healthcare so every step transition stays 0-network-request.
 */
export function SocialRoutes(props: SocialRouteProps) {
  if (cached) {
    const Comp = cached.SocialRouteView;
    return <Comp {...props} />;
  }
  return (
    <Suspense fallback={<div className="min-h-full bg-hs-bg" />}>
      <SocialRouteView {...props} />
    </Suspense>
  );
}

export function CampaignAttributionCard({ contactId, onOpenTimeline }: { contactId: string; onOpenTimeline: () => void }) {
  const { pack, world } = useShell();
  if (!pack.demos.socialAds || world.sa.contactId !== contactId) return null;
  if (cached) {
    const Comp = cached.CampaignAttributionCard;
    return <Comp contactId={contactId} onOpenTimeline={onOpenTimeline} />;
  }
  return (
    <Suspense fallback={null}>
      <CampaignAttributionCardInner contactId={contactId} onOpenTimeline={onOpenTimeline} />
    </Suspense>
  );
}

export function FollowupAutomationBanner({ contactId }: { contactId: string }) {
  const { pack, world } = useShell();
  if (!pack.demos.socialAds || world.sa.contactId !== contactId) return null;
  if (cached) {
    const Comp = cached.FollowupAutomationBanner;
    return <Comp contactId={contactId} />;
  }
  return (
    <Suspense fallback={null}>
      <FollowupAutomationBannerInner contactId={contactId} />
    </Suspense>
  );
}

export function PqlContactBanner({ contactId }: { contactId: string }) {
  const { pack, world, demo } = useShell();
  if (demo !== "pql-trial-prospecting" || !pack.demos.pqlTrial || pack.demos.pqlTrial.contactId !== contactId || !world.pql.milestoneHit) {
    return null;
  }
  if (cached) {
    const Comp = cached.PqlContactBanner;
    return <Comp contactId={contactId} />;
  }
  return (
    <Suspense fallback={null}>
      <PqlContactBannerInner contactId={contactId} />
    </Suspense>
  );
}
