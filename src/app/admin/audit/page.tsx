import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const LABELS: Record<string, string> = {
  invite_sent: "Invite sent",
  invite_resent: "Invite resent",
  invite_revoked: "Invite revoked",
  role_changed: "Role changed",
  user_disabled: "User disabled",
  user_enabled: "User enabled",
  user_removed: "User removed",
  password_reset_sent: "Password reset sent",
};

function show(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  return Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(", ");
}

export default async function AuditPage() {
  await requireAdmin();
  const rows = await db.adminAudit.findMany({ orderBy: { at: "desc" }, take: 300 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold tracking-tight">Admin audit</h1>
        <p className="mt-1 text-[13.5px] text-[#5f5b73]">Changes admins made to users, with before and after values. The latest 300 are shown.</p>
      </div>
      <section className="rounded-xl border border-[#e4e2ee] bg-white">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-[#faf9fd] text-[11.5px] uppercase tracking-wide text-[#5f5b73]">
            <tr>
              {["Time", "Admin", "Action", "User", "Before", "After"].map((h) => (
                <th key={h} className="whitespace-nowrap px-4 py-2.5 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[#eeecf5]">
                <td className="whitespace-nowrap px-4 py-2.5 tabular-nums">{formatDateTime(row.at)}</td>
                <td className="px-4 py-2.5">{row.actorEmail}</td>
                <td className="px-4 py-2.5 font-medium">{LABELS[row.action] ?? row.action}</td>
                <td className="px-4 py-2.5">{row.targetEmail ?? ""}</td>
                <td className="px-4 py-2.5 text-[#5f5b73]">{show(row.before)}</td>
                <td className="px-4 py-2.5 text-[#5f5b73]">{show(row.after)}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[#5f5b73]">
                  No admin actions yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
