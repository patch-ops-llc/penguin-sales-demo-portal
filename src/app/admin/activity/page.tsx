import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime, nowMs } from "@/lib/format";
import { DEMO_EVENTS, EVENT_LABELS, SIGN_IN_EVENTS } from "@/lib/log";
import { DEMOS, getVertical, isDemoId } from "@/verticals/catalog";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 200;
const DAY_MS = 24 * 60 * 60 * 1000;
const field = "rounded-md border border-[#cfcbe0] bg-white px-3 py-2 text-[13.5px] outline-none focus:border-penguin";

const GROUPS: Record<string, { label: string; types: readonly string[] | null }> = {
  all: { label: "All events", types: null },
  signin: { label: "Sign-ins", types: SIGN_IN_EVENTS },
  opened: { label: "Verticals and demos opened", types: ["vertical_opened", "demo_started"] },
  demo: { label: "All demo activity", types: DEMO_EVENTS },
};

function detail(event: { type: string; meta: Prisma.JsonValue }): string {
  const meta = event.meta && typeof event.meta === "object" && !Array.isArray(event.meta) ? (event.meta as Record<string, unknown>) : {};
  if (event.type === "login_success") return meta.method ? `Method: ${String(meta.method).replace("_", " ")}` : "";
  if (event.type === "login_failed") return [meta.method ? `Method: ${String(meta.method).replace("_", " ")}` : "", meta.reason ? `Reason: ${String(meta.reason).replaceAll("_", " ")}` : ""].filter(Boolean).join(". ");
  if (event.type === "invite_accepted") return meta.method ? `Method: ${String(meta.method)}` : "";
  if (event.type === "session_ended_by_admin") return meta.by ? `By ${String(meta.by)}` : "";
  if (event.type === "step_reached" && meta.title) return String(meta.title);
  return "";
}

export default async function ActivityPage({ searchParams }: PageProps<"/admin/activity">) {
  await requireAdmin();
  const params = await searchParams;
  const userFilter = typeof params.user === "string" ? params.user.trim().toLowerCase() : "";
  const group = typeof params.group === "string" && params.group in GROUPS ? params.group : "all";
  const before = typeof params.before === "string" && !Number.isNaN(Date.parse(params.before)) ? new Date(params.before) : null;

  const where: Prisma.AccessEventWhereInput = {
    ...(userFilter ? { email: { contains: userFilter } } : {}),
    ...(GROUPS[group].types ? { type: { in: [...GROUPS[group].types!] } } : {}),
    ...(before ? { at: { lt: before } } : {}),
  };

  const now = nowMs();
  const [events, active7, active30, runs7, logins7] = await Promise.all([
    db.accessEvent.findMany({ where, orderBy: { at: "desc" }, take: PAGE_SIZE + 1, include: { user: { select: { name: true } } } }),
    db.accessEvent.findMany({ where: { at: { gte: new Date(now - 7 * DAY_MS) }, userId: { not: null } }, distinct: ["userId"], select: { userId: true } }),
    db.accessEvent.findMany({ where: { at: { gte: new Date(now - 30 * DAY_MS) }, userId: { not: null } }, distinct: ["userId"], select: { userId: true } }),
    db.demoRun.count({ where: { startedAt: { gte: new Date(now - 7 * DAY_MS) } } }),
    db.accessEvent.count({ where: { type: "login_success", at: { gte: new Date(now - 7 * DAY_MS) } } }),
  ]);

  const hasMore = events.length > PAGE_SIZE;
  const rows = events.slice(0, PAGE_SIZE);
  const olderParams = new URLSearchParams();
  if (userFilter) olderParams.set("user", userFilter);
  if (group !== "all") olderParams.set("group", group);
  if (rows.length > 0) olderParams.set("before", rows[rows.length - 1].at.toISOString());

  const tiles = [
    { label: "Active users, 7 days", value: active7.length },
    { label: "Active users, 30 days", value: active30.length },
    { label: "Sign-ins, 7 days", value: logins7 },
    { label: "Demo runs, 7 days", value: runs7 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold tracking-tight">Access log</h1>
        <p className="mt-1 text-[13.5px] text-[#5f5b73]">
          Every sign-in, and every vertical and demo each user opened. Nothing typed into a demo is recorded.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl border border-[#e4e2ee] bg-white px-5 py-4">
            <div className="text-[12.5px] text-[#5f5b73]">{tile.label}</div>
            <div className="mt-1 text-[26px] font-semibold tabular-nums">{tile.value}</div>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-[#e4e2ee] bg-white">
        <form method="get" className="flex items-center gap-3 border-b border-[#e4e2ee] p-4">
          <input type="search" name="user" defaultValue={userFilter} placeholder="Filter by email" aria-label="Filter by email" className={`${field} w-72`} />
          <select name="group" defaultValue={group} aria-label="Event type" className={field}>
            {Object.entries(GROUPS).map(([key, g]) => (
              <option key={key} value={key}>
                {g.label}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-md bg-penguin px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-penguin-strong">
            Apply
          </button>
          {userFilter || group !== "all" || before ? (
            <Link href="/admin/activity" className="text-[13px] font-medium text-penguin underline underline-offset-2">
              Clear
            </Link>
          ) : null}
          <span className="ml-auto text-[12.5px] text-[#5f5b73]">
            {rows.length} {rows.length === 1 ? "event" : "events"}
            {hasMore ? ", more available" : ""}
          </span>
        </form>
        <table className="w-full text-left text-[13px]" data-testid="access-log">
          <thead className="bg-[#faf9fd] text-[11.5px] uppercase tracking-wide text-[#5f5b73]">
            <tr>
              {["Time", "User", "Event", "Vertical", "Demo", "Step", "Detail", "IP address"].map((h) => (
                <th key={h} className="whitespace-nowrap px-4 py-2.5 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((event) => (
              <tr key={event.id} className="border-t border-[#eeecf5]">
                <td className="whitespace-nowrap px-4 py-2.5 tabular-nums">{formatDateTime(event.at)}</td>
                <td className="px-4 py-2.5">
                  {event.user?.name ? <div className="font-medium">{event.user.name}</div> : null}
                  <div className="text-[#5f5b73]">{event.email ?? "Unknown"}</div>
                </td>
                <td className="px-4 py-2.5">
                  <span className={event.type === "login_failed" ? "font-medium text-[#a11212]" : "font-medium"}>{EVENT_LABELS[event.type] ?? event.type}</span>
                </td>
                <td className="px-4 py-2.5">{event.vertical ? (getVertical(event.vertical)?.name ?? event.vertical) : ""}</td>
                <td className="px-4 py-2.5">{event.demo ? (isDemoId(event.demo) ? DEMOS[event.demo].title : event.demo) : ""}</td>
                <td className="px-4 py-2.5 tabular-nums">{event.step ?? ""}</td>
                <td className="px-4 py-2.5 text-[#5f5b73]">{detail(event)}</td>
                <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-[#5f5b73]">{event.ip ?? ""}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-[#5f5b73]">
                  No events match.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        {hasMore ? (
          <div className="border-t border-[#e4e2ee] p-4 text-center">
            <Link href={`/admin/activity?${olderParams.toString()}`} className="text-[13.5px] font-medium text-penguin underline underline-offset-2">
              Show older events
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}
