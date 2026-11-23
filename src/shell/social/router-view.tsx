"use client";

import { CampaignsPage } from "./campaigns";
import { InsightsPage } from "./insights";
import { GoogleSearchAdPage, LandingPage, SocialFeedPage } from "./off-platform";
import { ProspectMeetingOffPlatformPage } from "./prospect-meeting";
import { PatientBookingOffPlatformPage, PatientReactivationPage } from "./reactivation";
import { SocialHubPage } from "./social-hub";

export { CampaignAttributionCard, FollowupAutomationBanner } from "./attribution-card";

export function SocialRouteView({
  section,
  id,
}: {
  section: "campaigns" | "social" | "insights" | "offplatform" | "reactivation";
  id?: string;
}) {
  if (section === "campaigns") return <CampaignsPage />;
  if (section === "social") return <SocialHubPage sub={id} />;
  if (section === "insights") return <InsightsPage />;
  if (section === "reactivation") return <PatientReactivationPage sub={id} />;
  if (id === "prospect-meeting") return <ProspectMeetingOffPlatformPage />;
  if (id === "patient-booking") return <PatientBookingOffPlatformPage />;
  if (id === "social-feed") return <SocialFeedPage />;
  if (id === "landing-page") return <LandingPage />;
  return <GoogleSearchAdPage />;
}
