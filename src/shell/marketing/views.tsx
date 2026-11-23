"use client";

import { MarketingDashboardPage } from "./dashboard";
import { OffPlatformInboxPage, OffPlatformLandingPage, OffPlatformMeetingPage } from "./off-platform";
import { MarketingStudioPage } from "./studio";

export { IcpMatchCard, MarketingContactBanner, MarketingDealBanner, MarketingTaskBanner } from "./icp-card";

export function MarketingView({ id, sub }: { id?: string; sub?: string }) {
  if (id === "dashboard") return <MarketingDashboardPage />;
  if (id === "off-platform") {
    if (sub === "landing") return <OffPlatformLandingPage />;
    if (sub === "meeting") return <OffPlatformMeetingPage />;
    return <OffPlatformInboxPage />;
  }
  return <MarketingStudioPage />;
}
