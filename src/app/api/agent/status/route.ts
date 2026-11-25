import { NextResponse } from "next/server";
import { AGENT_DEMOS } from "@/demos/agent/catalog";
import { enabledProviders, modelFor, PROVIDER_LABELS } from "@/lib/agent/providers";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * What the browser needs to decide between a live agent and the scripted walk: which providers
 * are on, by id and label, and the agent demos that exist. Ids, labels, and model names only;
 * no key material, no spend figures.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });

  const providers = enabledProviders().map((id) => ({ id, label: PROVIDER_LABELS[id], model: modelFor(id) }));
  return NextResponse.json(
    {
      live: providers.some((p) => p.id !== "mock"),
      providers,
      demos: Object.values(AGENT_DEMOS).map((d) => ({ id: d.id, title: d.title, baseDemo: d.baseDemo })),
      limits: { sessionMaxTurns: env.agentSessionMaxTurns, userTurnsPerMinute: env.agentUserTurnsPerMinute },
    },
    { headers: { "cache-control": "private, no-store" } },
  );
}
