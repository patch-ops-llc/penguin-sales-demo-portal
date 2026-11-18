import { nowMs } from "@/lib/format";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { DEMOS, getVertical, isDemoId } from "@/verticals/catalog";
import { UsersAdmin, type UserRow } from "./users-admin";

export const dynamic = "force-dynamic";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  const since = new Date(nowMs() - THIRTY_DAYS_MS);

  const [users, recentRuns, lastRuns] = await Promise.all([
    db.user.findMany({ orderBy: [{ createdAt: "asc" }], include: { invitedBy: { select: { email: true, name: true } } } }),
    db.demoRun.groupBy({ by: ["userId"], where: { startedAt: { gte: since } }, _count: { _all: true } }),
    db.demoRun.findMany({ orderBy: { startedAt: "desc" }, distinct: ["userId"], select: { userId: true, vertical: true, demo: true, startedAt: true } }),
  ]);

  const runCount = new Map(recentRuns.map((r) => [r.userId, r._count._all]));
  const lastRun = new Map(lastRuns.map((r) => [r.userId, r]));

  const rows: UserRow[] = users.map((u) => {
    const run = lastRun.get(u.id);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      organization: u.organization,
      role: u.role,
      status: u.status,
      invitedBy: u.invitedBy ? (u.invitedBy.name ?? u.invitedBy.email) : null,
      invitedAt: u.invitedAt?.toISOString() ?? null,
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
      lastDemo: run
        ? `${isDemoId(run.demo) ? DEMOS[run.demo].title : run.demo} (${getVertical(run.vertical)?.name ?? run.vertical})`
        : null,
      lastDemoAt: run?.startedAt.toISOString() ?? null,
      demos30d: runCount.get(u.id) ?? 0,
      isSelf: u.id === admin.id,
    };
  });

  return <UsersAdmin users={rows} emailConfigured={env.resendApiKey !== null} />;
}
