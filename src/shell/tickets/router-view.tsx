"use client";

import { baseDemoOf } from "@/demos/agent/ids";
import { useShell } from "@/store/store";
import type { DemoId } from "@/verticals/catalog";
import type { Pack } from "@/verticals/types";
import type { TicketsDemoConfig } from "./types";
import { TicketOffPlatformIntakePage, TicketOffPlatformOutreachPage } from "./off-platform";
import { TicketRecordWorkspace } from "./ticket-record";
import { TicketsPipelinePage } from "./tickets-pipeline";
import { A, Card, Empty } from "../ui";

export type TicketsRouteProps = {
  section: "tickets" | "ticket-app";
  id?: string;
  sub?: string;
};

function resolveConfig(pack: Pack, activeDemo: DemoId, section: "tickets" | "ticket-app", id?: string): TicketsDemoConfig | undefined {
  const map = pack.demos.tickets;
  if (!map) return undefined;
  const configs = Object.values(map).filter((c): c is TicketsDemoConfig => Boolean(c));
  if (configs.length === 0) return undefined;

  if (section === "ticket-app" && id && map[id as DemoId]) {
    return map[id as DemoId];
  }
  if (section === "tickets" && id) {
    const byTicketId = configs.find((c) => c.ticket.id === id);
    if (byTicketId) return byTicketId;
  }
  if (map[activeDemo]) return map[activeDemo];
  // An agent-run demo shows the ticket pipeline of the clicked demo it drives.
  const base = baseDemoOf(activeDemo) as DemoId;
  if (map[base]) return map[base];
  return configs[0];
}

export function TicketsRouteView({ section, id, sub }: TicketsRouteProps) {
  const { pack, demo } = useShell();
  const cfg = resolveConfig(pack, demo, section, id);

  if (!cfg) {
    return (
      <div className="p-10">
        <Card>
          <Empty title="No Service Hub ticket pipeline is configured for this vertical">
            <A to="/deals" className="hs-link">
              Go to deals
            </A>
          </Empty>
        </Card>
      </div>
    );
  }

  if (section === "ticket-app") {
    if (sub === "outreach") return <TicketOffPlatformOutreachPage cfg={cfg} />;
    return <TicketOffPlatformIntakePage cfg={cfg} />;
  }

  if (id) return <TicketRecordWorkspace key={cfg.ticket.id} cfg={cfg} />;
  return <TicketsPipelinePage cfg={cfg} />;
}
