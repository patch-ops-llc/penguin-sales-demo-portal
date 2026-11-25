import { NextResponse } from "next/server";
import { enabledProviders } from "@/lib/agent/providers";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Railway's health check. A deploy takes traffic only once the app can reach its database.
// `agent` says whether any live model provider is configured: a boolean, never a key or a name.
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, agent: enabledProviders().some((id) => id !== "mock") });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
