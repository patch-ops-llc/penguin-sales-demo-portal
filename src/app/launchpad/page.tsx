import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { packVersion } from "@/verticals/server";
import { Launchpad } from "./launchpad";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Launchpad" };

export default async function LaunchpadPage() {
  const user = await requireUser();
  return <Launchpad user={{ name: user.name, email: user.email, isAdmin: user.role === "ADMIN" }} packVersion={packVersion("manufacturing")} />;
}
