import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { packJson } from "@/verticals/server";

export const dynamic = "force-dynamic";

/** Demo content for one vertical. Signed-in users only. Immutable under its content-hash version. */
export async function GET(_request: Request, context: RouteContext<"/api/packs/[version]/[vertical]">) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });

  const { version, vertical } = await context.params;
  const pack = packJson(vertical);
  if (!pack) return new NextResponse(null, { status: 404 });

  return new NextResponse(pack.json, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      // A stale version in the URL still gets current content, but must not be cached under the old name.
      "cache-control": version === pack.version ? "private, max-age=31536000, immutable" : "private, no-store",
      "x-pack-version": pack.version,
    },
  });
}
