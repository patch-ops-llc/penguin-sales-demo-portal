import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, destroySession } from "@/lib/auth";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

// Redirects are built from APP_URL, not request.url, because behind the hosting
// proxy request.url resolves to the internal container address.
export async function POST(request: NextRequest) {
  await destroySession(request.cookies.get(SESSION_COOKIE)?.value);
  const response = NextResponse.redirect(new URL("/login", env.appUrl), { status: 303 });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
