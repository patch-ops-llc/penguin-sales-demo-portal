import { NextResponse } from "next/server";
import { getCurrentUser, requestMeta } from "@/lib/auth";
import { db } from "@/lib/db";
import { DEMO_EVENTS } from "@/lib/log";
import { getVertical, isDemoId } from "@/verticals/catalog";

export const dynamic = "force-dynamic";

const MAX_EVENTS = 50;
const RUN_ID = /^[a-zA-Z0-9-]{8,64}$/;
const ALLOWED = new Set<string>(DEMO_EVENTS);

type Incoming = { type?: unknown; vertical?: unknown; demo?: unknown; step?: unknown; totalSteps?: unknown; runId?: unknown; at?: unknown; title?: unknown };

/**
 * Receives the browser's background beacon. Only event names, vertical, demo, and step numbers
 * are accepted: nothing a rep types into a demo ever reaches the server.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });

  let body: { events?: Incoming[] };
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const incoming = Array.isArray(body.events) ? body.events.slice(0, MAX_EVENTS) : [];
  const meta = await requestMeta();
  const now = Date.now();

  const events = incoming.flatMap((raw) => {
    if (typeof raw.type !== "string" || !ALLOWED.has(raw.type)) return [];
    const vertical = typeof raw.vertical === "string" && getVertical(raw.vertical) ? raw.vertical : null;
    const demo = typeof raw.demo === "string" && isDemoId(raw.demo) ? raw.demo : null;
    const step = typeof raw.step === "number" && Number.isInteger(raw.step) && raw.step >= 0 && raw.step <= 50 ? raw.step : null;
    const totalSteps = typeof raw.totalSteps === "number" && Number.isInteger(raw.totalSteps) && raw.totalSteps >= 0 && raw.totalSteps <= 50 ? raw.totalSteps : null;
    const runId = typeof raw.runId === "string" && RUN_ID.test(raw.runId) ? raw.runId : null;
    // Trust the browser clock only within a day, so queued events keep their order without allowing backdating.
    const clientAt = typeof raw.at === "number" ? raw.at : now;
    const at = new Date(Math.abs(clientAt - now) < 24 * 60 * 60 * 1000 ? Math.min(clientAt, now) : now);
    const title = typeof raw.title === "string" ? raw.title.slice(0, 120) : null;
    return [{ type: raw.type, vertical, demo, step, totalSteps, runId, at, title }];
  });

  if (events.length === 0) return new NextResponse(null, { status: 204 });

  try {
    await db.accessEvent.createMany({
      data: events.map((e) => ({
        type: e.type,
        at: e.at,
        userId: user.id,
        email: user.email,
        sessionId: user.sessionId,
        runId: e.runId,
        vertical: e.vertical,
        demo: e.demo,
        step: e.step,
        ip: meta.ip,
        userAgent: meta.userAgent,
        ...(e.title ? { meta: { title: e.title } } : {}),
      })),
    });

    for (const e of events) {
      if (!e.runId || !e.vertical || !e.demo) continue;
      const existing = await db.demoRun.findUnique({ where: { id: e.runId } });
      if (existing && existing.userId !== user.id) continue;
      const step = e.step ?? 0;
      if (!existing) {
        await db.demoRun.create({
          data: {
            id: e.runId,
            userId: user.id,
            vertical: e.vertical,
            demo: e.demo,
            startedAt: e.at,
            lastEventAt: e.at,
            furthestStep: step,
            totalSteps: e.totalSteps ?? 0,
            completed: e.type === "demo_completed",
            endedAt: e.type === "demo_completed" ? e.at : null,
            resets: e.type === "demo_reset" ? 1 : 0,
          },
        });
      } else {
        await db.demoRun.update({
          where: { id: e.runId },
          data: {
            lastEventAt: e.at > existing.lastEventAt ? e.at : existing.lastEventAt,
            furthestStep: Math.max(existing.furthestStep, step),
            totalSteps: Math.max(existing.totalSteps, e.totalSteps ?? 0),
            ...(e.type === "demo_completed" ? { completed: true, endedAt: e.at } : {}),
            ...(e.type === "demo_reset" ? { resets: { increment: 1 } } : {}),
          },
        });
      }
    }
  } catch (error) {
    console.error("[events] Failed to record:", error);
  }

  return new NextResponse(null, { status: 204 });
}
