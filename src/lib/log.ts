import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export const SIGN_IN_EVENTS = ["login_success", "login_failed", "logout", "invite_accepted", "password_reset", "password_changed", "session_ended_by_admin"] as const;

/** Events the browser may report. Anything else posted to /api/events is dropped. */
export const DEMO_EVENTS = [
  "launchpad_opened",
  "vertical_opened",
  "demo_started",
  "step_reached",
  "demo_completed",
  "demo_reset",
  "demo_switched",
  "highlight_used",
  "agent_fallback",
] as const;

export const EVENT_LABELS: Record<string, string> = {
  login_success: "Signed in",
  login_failed: "Sign-in failed",
  logout: "Signed out",
  invite_accepted: "Invite accepted",
  password_reset: "Password reset",
  password_changed: "Password changed",
  session_ended_by_admin: "Sessions ended by admin",
  launchpad_opened: "Opened launchpad",
  vertical_opened: "Opened vertical",
  demo_started: "Started demo",
  step_reached: "Reached step",
  demo_completed: "Completed demo",
  demo_reset: "Reset demo",
  demo_switched: "Switched demo",
  highlight_used: "Highlighted Penguin extensions",
  agent_turn: "Agent turn",
  agent_fallback: "Agent fell back to scripted",
};

export type LogInput = {
  type: string;
  userId?: string | null;
  email?: string | null;
  sessionId?: string | null;
  runId?: string | null;
  vertical?: string | null;
  demo?: string | null;
  step?: number | null;
  ip?: string | null;
  userAgent?: string | null;
  meta?: Prisma.InputJsonValue;
  at?: Date;
};

/** Never throws: a logging failure must not break a sign-in or a demo. */
export async function logEvent(input: LogInput): Promise<void> {
  try {
    await db.accessEvent.create({ data: input });
  } catch (error) {
    console.error("[log] Failed to record event:", error);
  }
}

export async function logAudit(input: {
  actor: { id: string; email: string };
  action: string;
  target?: { id?: string | null; email?: string | null };
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
}): Promise<void> {
  try {
    await db.adminAudit.create({
      data: {
        actorId: input.actor.id,
        actorEmail: input.actor.email,
        action: input.action,
        targetId: input.target?.id ?? null,
        targetEmail: input.target?.email ?? null,
        before: input.before,
        after: input.after,
      },
    });
  } catch (error) {
    console.error("[audit] Failed to record:", error);
  }
}
