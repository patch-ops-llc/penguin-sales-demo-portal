import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ShellApp } from "@/shell/shell-app";
import { getVertical } from "@/verticals/catalog";
import { packVersion } from "@/verticals/server";

export const dynamic = "force-dynamic";
// Inside the demo the browser tab looks like HubSpot too.
export const metadata: Metadata = { title: { absolute: "HubSpot" }, icons: { icon: "/brand/hubspot-sprocket.svg" } };

// One route mounts the whole simulated HubSpot shell. After this first render the shell does its
// own routing with the browser history, so moving around inside a demo never asks the server for a page.
export default async function DemoPage({ params }: PageProps<"/demo/[[...path]]">) {
  await requireUser();
  const { path } = await params;
  const verticalId = path?.[0];
  const vertical = verticalId ? getVertical(verticalId) : undefined;
  const version = vertical ? packVersion(vertical.id) : null;
  if (!vertical || vertical.status !== "live" || !version) redirect("/launchpad");

  return <ShellApp verticalId={vertical.id} packVersion={version} />;
}
