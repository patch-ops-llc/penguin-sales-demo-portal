import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTimeUtc, formatDuration } from "@/lib/format";
import { DEMOS, getVertical, isDemoId } from "@/verticals/catalog";
import { AdminTable, cell, cellNoWrap, Clip, EmptyRow, muted, Pill, type AdminColumn } from "../table";

export const dynamic = "force-dynamic";

const COLUMNS: AdminColumn[] = [
  { label: "Started (UTC)", width: 172 },
  { label: "User", width: 256 },
  { label: "Vertical" },
  { label: "Demo" },
  { label: "Furthest step", width: 128 },
  { label: "Length", width: 84 },
  { label: "Resets", width: 76 },
  { label: "Outcome", width: 124 },
];

export default async function RunsPage() {
  await requireAdmin();
  const runs = await db.demoRun.findMany({ orderBy: { startedAt: "desc" }, take: 300, include: { user: { select: { name: true, email: true } } } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold tracking-tight">Demo runs</h1>
        <p className="mt-1 text-[13.5px] text-[#5f5b73]">One row per user per demo, from start to the last step reached. The latest 300 are shown.</p>
      </div>
      <section className="rounded-xl border border-[#e4e2ee] bg-white">
        <AdminTable columns={COLUMNS} minWidth={1160} testId="demo-runs">
          {runs.map((run) => (
            <tr key={run.id} className="border-t border-[#eeecf5]">
              <td className={cellNoWrap}>{formatDateTimeUtc(run.startedAt)}</td>
              <td className={cell}>
                {run.user.name ? <div className="font-medium">{run.user.name}</div> : null}
                <Clip className={muted}>{run.user.email}</Clip>
              </td>
              <td className={cell}>{getVertical(run.vertical)?.name ?? run.vertical}</td>
              <td className={cell}>{isDemoId(run.demo) ? DEMOS[run.demo].title : run.demo}</td>
              <td className={cellNoWrap}>
                {run.furthestStep} of {run.totalSteps}
              </td>
              <td className={cellNoWrap}>{formatDuration(run.lastEventAt.getTime() - run.startedAt.getTime())}</td>
              <td className={cellNoWrap}>{run.resets}</td>
              <td className={cellNoWrap}>
                <Pill tone={run.completed ? "green" : "gray"}>{run.completed ? "Completed" : "Not finished"}</Pill>
              </td>
            </tr>
          ))}
          {runs.length === 0 ? <EmptyRow columns={COLUMNS.length}>No demo runs yet.</EmptyRow> : null}
        </AdminTable>
      </section>
    </div>
  );
}
