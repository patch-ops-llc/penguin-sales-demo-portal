"use client";

import { CampaignsPage } from "./campaigns";
import { InsightsPage } from "./insights";
import { GoogleSearchAdPage, LandingPage, SocialFeedPage } from "./off-platform";
import { SocialHubPage } from "./social-hub";

export default function SocialRouteView({ section, id }: { section: "campaigns" | "social" | "insights" | "offplatform"; id?: string }) {
  if (section === "campaigns") return <CampaignsPage />;
  if (section === "social") return <SocialHubPage sub={id} />;
  if (section === "insights") return <InsightsPage />;
  if (id === "social-feed") return <SocialFeedPage />;
  if (id === "landing-page") return <LandingPage />;
  return <GoogleSearchAdPage />;
}
