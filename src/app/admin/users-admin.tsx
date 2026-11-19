"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  inviteUsersAction,
  removeUserAction,
  resendInviteAction,
  revokeInviteAction,
  sendPasswordResetAction,
  setRoleAction,
  setStatusAction,
  type ActionResult,
} from "./actions";
import { AdminTable, cell, cellNoWrap, Clip, EmptyRow, muted, Pill, type AdminColumn } from "./table";

export type UserRow = {
  id: string;
  name: string | null;
  email: string;
  organization: string | null;
  role: "REP" | "ADMIN";
  status: "INVITED" | "ACTIVE" | "DISABLED";
  invitedBy: string | null;
  invitedAt: string | null;
  lastLoginAt: string | null;
  lastDemo: string | null;
  lastDemoVertical: string | null;
  lastDemoAt: string | null;
  demos30d: number;
  isSelf: boolean;
};

/** The organization sits under the email, which leaves room for the action buttons on one or two full rows. */
const COLUMNS: AdminColumn[] = [
  { label: "User" },
  { label: "Role", width: 70 },
  { label: "Status", width: 96 },
  { label: "Invited", width: 128 },
  { label: "Last login", width: 130 },
  { label: "Last demo", width: 196 },
  { label: "Demos, 30 days", width: 78, wrapLabel: true },
  { label: "Actions", width: 272 },
];

const field = "rounded-md border border-[#cfcbe0] bg-white px-3 py-2 text-[13.5px] outline-none focus:border-penguin focus:ring-2 focus:ring-penguin/20";
const button = "rounded-md bg-penguin px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-penguin-strong disabled:opacity-50";
const ghost = "whitespace-nowrap rounded-md border border-[#cfcbe0] bg-white px-2 py-1 text-[12px] font-medium leading-[1.4] text-[#2c2747] hover:border-penguin hover:text-penguin disabled:opacity-40";

function day(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function dayTime(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function UsersAdmin({ users, emailConfigured }: { users: UserRow[]; emailConfigured: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | UserRow["status"]>("ALL");
  const [copied, setCopied] = useState<string | null>(null);

  function run(action: () => Promise<ActionResult>, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    startTransition(async () => {
      const outcome = await action();
      setResult(outcome);
      router.refresh();
    });
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(
      (u) =>
        (status === "ALL" || u.status === status) &&
        (!q || u.email.includes(q) || (u.name ?? "").toLowerCase().includes(q) || (u.organization ?? "").toLowerCase().includes(q)),
    );
  }, [users, query, status]);

  const counts = useMemo(
    () => ({
      active: users.filter((u) => u.status === "ACTIVE").length,
      invited: users.filter((u) => u.status === "INVITED").length,
      disabled: users.filter((u) => u.status === "DISABLED").length,
    }),
    [users],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-[13.5px] text-[#5f5b73]">
            {counts.active} active, {counts.invited} invited, {counts.disabled} disabled. Access is invite-only.
          </p>
        </div>
      </div>

      {result ? (
        <div
          role="status"
          data-testid="admin-result"
          className={`rounded-lg border px-4 py-3 text-[13.5px] ${result.ok ? "border-[#bfe3cd] bg-[#f0faf4]" : "border-[#f3b4b4] bg-[#fdf1f1] text-[#8a1212]"}`}
        >
          <div className="flex items-start justify-between gap-4">
            <p>{result.message}</p>
            <button type="button" className="text-[12.5px] font-medium underline" onClick={() => setResult(null)}>
              Dismiss
            </button>
          </div>
          {result.links && result.links.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {result.links.map((link) => (
                <li key={link.url} className="flex items-center gap-3 rounded-md border border-[#d9e9df] bg-white px-3 py-2">
                  <span className="w-56 shrink-0 truncate font-medium" title={link.email}>
                    {link.email}
                  </span>
                  <code data-testid="admin-link" className="min-w-0 flex-1 truncate text-[12px] text-[#3d3857]">
                    {link.url}
                  </code>
                  <button
                    type="button"
                    className={ghost}
                    onClick={() => {
                      navigator.clipboard?.writeText(link.url).then(
                        () => setCopied(link.url),
                        () => setCopied(null),
                      );
                    }}
                  >
                    {copied === link.url ? "Copied" : "Copy link"}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <section className="rounded-xl border border-[#e4e2ee] bg-white p-5">
        <h2 className="text-[15px] font-semibold">Invite people</h2>
        <p className="mt-1 text-[13px] text-[#5f5b73]">
          Paste one or many email addresses, separated by commas, spaces, or new lines.{" "}
          {emailConfigured ? "Each person gets an email with a link to set a password." : "Email is not configured, so you will get a link per person to send yourself."}
        </p>
        <form
          className="mt-4 grid grid-cols-[1fr_220px_150px_auto] items-start gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            startTransition(async () => {
              const outcome = await inviteUsersAction(data);
              setResult(outcome);
              if (outcome.ok) form.reset();
              router.refresh();
            });
          }}
        >
          <textarea name="emails" required rows={2} placeholder="ae@hubspot.com, another.ae@hubspot.com" aria-label="Email addresses" className={`${field} resize-y`} />
          <input name="organization" placeholder="Organization (optional)" aria-label="Organization" maxLength={120} className={field} />
          <select name="role" aria-label="Role" defaultValue="REP" className={field}>
            <option value="REP">Rep</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button type="submit" disabled={pending} className={button}>
            Send invites
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-[#e4e2ee] bg-white">
        <div className="flex items-center gap-3 border-b border-[#e4e2ee] p-4">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, or organization"
            aria-label="Search users"
            className={`${field} w-80`}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="Filter by status" className={field}>
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INVITED">Invited</option>
            <option value="DISABLED">Disabled</option>
          </select>
          <span className="ml-auto text-[12.5px] text-[#5f5b73]">
            {visible.length} of {users.length}
          </span>
        </div>
        <AdminTable columns={COLUMNS} minWidth={1200}>
          {visible.map((u) => (
            <tr key={u.id} data-testid={`user-row-${u.email}`} className="border-t border-[#eeecf5]">
              <td className={cell}>
                <div className="font-medium">
                  {u.name ?? "Name not set"}
                  {u.isSelf ? <span className="ml-2 inline-block rounded bg-penguin-soft px-1.5 py-0.5 align-[1px] text-[11px] font-semibold leading-none text-penguin">You</span> : null}
                </div>
                <Clip className={muted}>{u.email}</Clip>
                {u.organization ? <div className={muted}>{u.organization}</div> : null}
              </td>
              <td className={cellNoWrap}>{u.role === "ADMIN" ? "Admin" : "Rep"}</td>
              <td className={cellNoWrap}>
                <Pill tone={u.status === "ACTIVE" ? "green" : u.status === "INVITED" ? "amber" : "gray"}>
                  {u.status === "ACTIVE" ? "Active" : u.status === "INVITED" ? "Invited" : "Disabled"}
                </Pill>
              </td>
              <td className={cell}>
                {u.invitedAt ? (
                  <>
                    <div className="whitespace-nowrap">{day(u.invitedAt)}</div>
                    <Clip className={muted}>{`by ${u.invitedBy ?? "a removed user"}`}</Clip>
                  </>
                ) : (
                  <span className={muted}>Seeded</span>
                )}
              </td>
              <td className={cellNoWrap}>{dayTime(u.lastLoginAt)}</td>
              <td className={cell}>
                {u.lastDemo ? (
                  <>
                    <div>{u.lastDemo}</div>
                    {u.lastDemoVertical ? <div className={muted}>{u.lastDemoVertical}</div> : null}
                    <div className={`whitespace-nowrap ${muted}`}>{dayTime(u.lastDemoAt)}</div>
                  </>
                ) : (
                  <span className={muted}>None yet</span>
                )}
              </td>
              <td className={cellNoWrap}>{u.demos30d}</td>
              <td className={cell}>
                {/* Ordered so the buttons fill at most two even rows: three short ones, then the two that are left. */}
                <div className="flex flex-wrap gap-1.5">
                  <Link href={`/admin/activity?user=${encodeURIComponent(u.email)}`} className={ghost}>
                    View log
                  </Link>
                  {u.status === "INVITED" ? (
                    <>
                      <button type="button" disabled={pending} className={ghost} onClick={() => run(() => resendInviteAction(u.id))}>
                        Resend invite
                      </button>
                      <button type="button" disabled={pending} className={ghost} onClick={() => run(() => revokeInviteAction(u.id), `Revoke the invite for ${u.email}?`)}>
                        Revoke
                      </button>
                    </>
                  ) : null}
                  {u.status === "ACTIVE" && !u.isSelf ? (
                    <>
                      <button type="button" disabled={pending} className={ghost} onClick={() => run(() => setRoleAction(u.id, u.role === "ADMIN" ? "REP" : "ADMIN"))}>
                        {u.role === "ADMIN" ? "Make rep" : "Make admin"}
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        className={ghost}
                        onClick={() => run(() => setStatusAction(u.id, true), `Disable ${u.email}? They are signed out at once.`)}
                      >
                        Disable
                      </button>
                      <button type="button" disabled={pending} className={ghost} onClick={() => run(() => sendPasswordResetAction(u.id))}>
                        Reset password
                      </button>
                    </>
                  ) : null}
                  {u.status === "DISABLED" ? (
                    <button type="button" disabled={pending} className={ghost} onClick={() => run(() => setStatusAction(u.id, false))}>
                      Enable
                    </button>
                  ) : null}
                  {u.status !== "INVITED" && !u.isSelf ? (
                    <button
                      type="button"
                      disabled={pending}
                      className={ghost}
                      onClick={() => run(() => removeUserAction(u.id), `Remove ${u.email}? Their demo runs are deleted. Access log rows are kept.`)}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
          {visible.length === 0 ? <EmptyRow columns={COLUMNS.length}>No users match.</EmptyRow> : null}
        </AdminTable>
      </section>
    </div>
  );
}
