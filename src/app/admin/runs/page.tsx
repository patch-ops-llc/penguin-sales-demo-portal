import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime, formatDuration } from "@/lib/format";
import { DEMOS, getVertical, isDemoId } from "@/verticals/catalog";

export const dynamic = "force-dynamic";

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
        <table className="w-full text-left text-[13px]" data-testid="demo-runs">
          <thead className="bg-[#faf9fd] text-[11.5px] uppercase tracking-wide text-[#5f5b73]">
            <tr>
              {["Started", "User", "Vertical", "Demo", "Furthest step", "Length", "Resets", "Outcome"].map((h) => (
                <th key={h} className="whitespace-nowrap px-4 py-2.5 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr key={run.id} className="border-t border-[#eeecf5]">
                <td className="whitespace-nowrap px-4 py-2.5 tabular-nums">{formatDateTime(run.startedAt)}</td>
                <td className="px-4 py-2.5">
                  {run.user.name ? <div className="font-medium">{run.user.name}</div> : null}
                  <div className="text-[#5f5b73]">{run.user.email}</div>
                </td>
                <td className="px-4 py-2.5">{getVertical(run.vertical)?.name ?? run.vertical}</td>
                <td className="px-4 py-2.5">{isDemoId(run.demo) ? DEMOS[run.demo].title : run.demo}</td>
                <td className="px-4 py-2.5 tabular-nums">
                  {run.furthestStep} of {run.totalSteps}
                </td>
                <td className="px-4 py-2.5 tabular-nums">{formatDuration(run.lastEventAt.getTime() - run.startedAt.getTime())}</td>
                <td className="px-4 py-2.5 tabular-nums">{run.resets}</td>
                <td className="px-4 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${run.completed ? "bg-[#e5f5ec] text-[#11603a]" : "bg-[#ececf1] text-[#55516b]"}`}>
                    {run.completed ? "Completed" : "Not finished"}
                  </span>
                </td>
              </tr>
            ))}
            {runs.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-[#5f5b73]">
                  No demo runs yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
