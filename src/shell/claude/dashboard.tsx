"use client";

import { useShell } from "@/store/store";
import { dateTime } from "../format";
import { Icon } from "../icons";
import { Card, cx, Empty, Tag } from "../ui";

const TILE: Record<string, string> = {
  green: "border-[#bfe3cd] bg-[#f8fdf9]",
  amber: "border-[#f3d48c] bg-[#fffcf4]",
  red: "border-[#f3bdb7] bg-[#fff8f7]",
  neutral: "border-line bg-white",
};

/** A HubSpot dashboard: the pack's standing tiles plus the reports Claude saved to it this run. */
export function DashboardPage({ id }: { id: string }) {
  const { world, pack } = useShell();
  const dashboard = pack.demos.flows?.dashboards[id];
  const reports = world.hf.reports.filter((r) => r.dashboard === id);
  if (!dashboard) {
    return (
      <div className="p-6">
        <Empty title="Dashboard not found" />
      </div>
    );
  }
  return (
    <div className="min-h-full bg-hs-bg" data-testid="dashboard-page" data-dashboard={id}>
      <div className="border-b border-line bg-white px-6 py-4">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight">{dashboard.title}</h1>
            <p className="text-[13px] text-ink-muted">
              {dashboard.subtitle} · Owner {dashboard.owner}
            </p>
          </div>
          <Tag tone="neutral">{reports.length + dashboard.tiles.length} reports</Tag>
        </div>
      </div>
      <div className="mx-auto max-w-[1200px] space-y-5 px-6 py-5">
        <div className="grid grid-cols-4 gap-3">
          {dashboard.tiles.map((t) => (
            <div key={t.label} className={cx("rounded-[10px] border px-4 py-3", TILE[t.tone ?? "neutral"])}>
              <p className="text-[12px] text-ink-muted">{t.label}</p>
              <p className="mt-1 text-[24px] font-semibold tabular-nums leading-tight">{t.value}</p>
              {t.delta ? <p className="mt-0.5 text-[12px] text-ink-muted">{t.delta}</p> : null}
            </div>
          ))}
        </div>

        {reports.length === 0 ? (
          <Card>
            <p className="text-[13px] text-ink-muted">No reports saved from Claude yet. Ask for a breakdown in the conversation and approve the save.</p>
          </Card>
        ) : (
          reports.map((r) => (
            <Card
              key={r.id}
              title={
                <span className="flex items-center gap-2">
                  <Icon name="chart" size={15} /> {r.title}
                  <Tag tone="purple">Saved from Claude</Tag>
                </span>
              }
              right={<span className="text-[12px] text-ink-muted">Saved {dateTime(r.createdAt)}</span>}
              testId="dashboard-report"
            >
              <p className="text-[13px] text-ink-muted">{r.summary}</p>
              {r.kpis.length > 0 ? (
                <div className={cx("mt-3 grid gap-3", r.kpis.length >= 4 ? "grid-cols-4" : "grid-cols-3")}>
                  {r.kpis.map((k) => (
                    <div key={k.label} className="rounded-[8px] border border-line-soft px-3 py-2.5">
                      <p className="text-[11.5px] text-ink-muted">{k.label}</p>
                      <p className="mt-0.5 text-[20px] font-semibold tabular-nums leading-tight">{k.value}</p>
                      {k.delta ? <p className="text-[11.5px] text-ink-muted">{k.delta}</p> : null}
                    </div>
                  ))}
                </div>
              ) : null}
              {r.columns.length > 0 ? (
                <table className="mt-4 w-full text-[13px]">
                  <thead>
                    <tr className="border-y border-line-soft bg-[#fafafa] text-left text-[11.5px] uppercase tracking-wide text-ink-muted">
                      {r.columns.map((c) => (
                        <th key={c} className="px-3 py-2 font-semibold">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {r.rows.map((row, i) => (
                      <tr key={i} className="border-b border-line-soft last:border-b-0">
                        {row.map((cell, j) => (
                          <td key={j} className={cx("px-3 py-2 tabular-nums", j === 0 && "font-semibold")}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
