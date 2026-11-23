"use client";

import { ServiceDashboardPage } from "./dashboard";
import { HelpDeskPage } from "./help-desk";
import { OffplatformChatPage } from "./offplatform-chat";
import { OffplatformEmailPage } from "./offplatform-email";
import { OffplatformPhonePage } from "./offplatform-phone";
import { TicketRecordPage } from "./ticket";

export type ServiceRouteProps = {
  section: "service" | "service-app" | "service-dashboard";
  id?: string;
  sub?: string;
};

export function ServiceRouteView({ section, id, sub }: ServiceRouteProps) {
  if (section === "service-app") {
    if (id === "email") return <OffplatformEmailPage />;
    if (id === "phone") return <OffplatformPhonePage />;
    return <OffplatformChatPage />;
  }
  if (section === "service-dashboard") return <ServiceDashboardPage />;
  if (id === "tickets" && sub) return <TicketRecordPage key={sub} id={sub} />;
  return <HelpDeskPage />;
}
