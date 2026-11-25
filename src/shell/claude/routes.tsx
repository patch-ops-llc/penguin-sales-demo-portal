"use client";

import { BeatScreen } from "./beat";
import { CampaignPage } from "./campaign";
import { DashboardPage } from "./dashboard";
import type { ClaudeSection } from "./lazy";
import { ClaudeStage } from "./stage";
import { SupportIndex, TicketPage } from "./support";

export function ClaudeRoutes({ section, id }: { section: ClaudeSection; id?: string }) {
  switch (section) {
    case "claude":
      return <ClaudeStage />;
    case "beat":
      return <BeatScreen id={id ?? ""} />;
    case "campaigns":
      return <CampaignPage id={id ?? ""} />;
    case "support":
      return id ? <TicketPage key={id} id={id} /> : <SupportIndex />;
    case "dashboards":
      return <DashboardPage id={id ?? "marketing"} />;
  }
}
