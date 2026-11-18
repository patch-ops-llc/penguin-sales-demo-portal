"use server";

import { revalidatePath } from "next/cache";
import type { Role, User } from "@prisma/client";
import { INVITE_TTL_MS, isValidEmail, normalizeEmail, requireAdmin, resetTokenExpiry, type SessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { logAudit, logEvent } from "@/lib/log";
import { generateToken, hashToken } from "@/lib/tokens";

export type ActionLink = { email: string; url: string; kind: "invite" | "reset" };
export type ActionResult = { ok: boolean; message: string; links?: ActionLink[] };

const MAX_INVITES_PER_CALL = 100;

async function issueInvite(user: Pick<User, "id" | "email">, actor: SessionUser): Promise<{ url: string; emailed: boolean }> {
  const token = generateToken();
  await db.$transaction([
    db.invite.updateMany({ where: { userId: user.id, acceptedAt: null, revokedAt: null }, data: { revokedAt: new Date() } }),
    db.invite.create({ data: { tokenHash: hashToken(token), userId: user.id, expiresAt: new Date(Date.now() + INVITE_TTL_MS) } }),
  ]);
  const url = `${env.appUrl}/invite/${encodeURIComponent(token)}`;
  const emailed = await sendEmail({
    to: user.email,
    subject: "You are invited to the Penguin Sales Demo Portal",
    text: [
      `${actor.name ?? actor.email} invited you to the Penguin Sales Demo Portal, the sales demo environment run by Penguin Strategies.`,
      "",
      "Use the link below to choose a password and sign in:",
      url,
      "",
      "The link is valid for 14 days and can be used once.",
    ].join("\n"),
  });
  return { url, emailed };
}

function linkMessage(emailed: boolean, what: string): string {
  return emailed ? `${what} sent by email. The same link is below as a backup.` : `${what} created, but not emailed. Copy the link below and send it yourself.`;
}

export async function inviteUsersAction(formData: FormData): Promise<ActionResult> {
  const actor = await requireAdmin();
  const role: Role = formData.get("role") === "ADMIN" ? "ADMIN" : "REP";
  const organization = String(formData.get("organization") ?? "").trim().slice(0, 120) || null;
  const emails = [...new Set(String(formData.get("emails") ?? "").split(/[\s,;]+/).map(normalizeEmail).filter(Boolean))];

  if (emails.length === 0) return { ok: false, message: "Enter at least one email address." };
  if (emails.length > MAX_INVITES_PER_CALL) return { ok: false, message: `Invite at most ${MAX_INVITES_PER_CALL} people at a time.` };
  const invalid = emails.filter((e) => !isValidEmail(e));
  if (invalid.length > 0) return { ok: false, message: `Not a valid email address: ${invalid.join(", ")}` };

  const links: ActionLink[] = [];
  const skipped: string[] = [];
  let emailedCount = 0;

  for (const email of emails) {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing && existing.status !== "INVITED") {
      skipped.push(email);
      continue;
    }
    const user =
      existing ??
      (await db.user.create({ data: { email, role, organization, status: "INVITED", invitedById: actor.id, invitedAt: new Date() } }));
    const { url, emailed } = await issueInvite(user, actor);
    if (emailed) emailedCount += 1;
    // The link is always shown to the admin, as a backup to the email.
    links.push({ email, url, kind: "invite" });
    await logAudit({ actor, action: existing ? "invite_resent" : "invite_sent", target: user, after: { role: user.role, organization: user.organization } });
  }

  revalidatePath("/admin");
  const invited = emails.length - skipped.length;
  const parts: string[] = [];
  if (invited > 0) parts.push(`${invited} ${invited === 1 ? "invite" : "invites"} created${emailedCount > 0 ? `, ${emailedCount} sent by email` : ""}.`);
  if (invited > emailedCount) parts.push(`${invited - emailedCount} not emailed: copy ${invited - emailedCount === 1 ? "the link" : "each link"} below and send it yourself.`);
  else if (invited > 0) parts.push("The same links are below as a backup.");
  if (skipped.length > 0) parts.push(`Already has an account, skipped: ${skipped.join(", ")}.`);
  return { ok: invited > 0, message: parts.join(" "), links };
}

async function loadTarget(userId: string): Promise<User | null> {
  return db.user.findUnique({ where: { id: userId } });
}

/** True when removing, disabling, or demoting this user would leave no active admin. */
async function isLastActiveAdmin(user: User): Promise<boolean> {
  if (user.role !== "ADMIN" || user.status !== "ACTIVE") return false;
  const others = await db.user.count({ where: { role: "ADMIN", status: "ACTIVE", id: { not: user.id } } });
  return others === 0;
}

export async function resendInviteAction(userId: string): Promise<ActionResult> {
  const actor = await requireAdmin();
  const user = await loadTarget(userId);
  if (!user || user.status !== "INVITED") return { ok: false, message: "That invite is no longer pending." };

  const { url, emailed } = await issueInvite(user, actor);
  await logAudit({ actor, action: "invite_resent", target: user });
  revalidatePath("/admin");
  return { ok: true, message: linkMessage(emailed, "New invite"), links: [{ email: user.email, url, kind: "invite" }] };
}

export async function revokeInviteAction(userId: string): Promise<ActionResult> {
  const actor = await requireAdmin();
  const user = await loadTarget(userId);
  if (!user || user.status !== "INVITED") return { ok: false, message: "That invite is no longer pending." };

  await db.user.delete({ where: { id: user.id } });
  await logAudit({ actor, action: "invite_revoked", target: user });
  revalidatePath("/admin");
  return { ok: true, message: `Invite for ${user.email} revoked.` };
}

export async function setStatusAction(userId: string, disabled: boolean): Promise<ActionResult> {
  const actor = await requireAdmin();
  const user = await loadTarget(userId);
  if (!user || user.status === "INVITED") return { ok: false, message: "User not found." };
  if (user.id === actor.id) return { ok: false, message: "You cannot disable your own account." };
  if (disabled && (await isLastActiveAdmin(user))) return { ok: false, message: "The last admin cannot be disabled." };

  const status = disabled ? "DISABLED" : "ACTIVE";
  if (user.status === status) return { ok: true, message: "No change." };

  await db.user.update({ where: { id: user.id }, data: { status } });
  if (disabled) {
    // Disabling ends every session at once.
    const ended = await db.session.deleteMany({ where: { userId: user.id } });
    if (ended.count > 0) await logEvent({ type: "session_ended_by_admin", userId: user.id, email: user.email, meta: { by: actor.email, sessions: ended.count } });
  }
  await logAudit({ actor, action: disabled ? "user_disabled" : "user_enabled", target: user, before: { status: user.status }, after: { status } });
  revalidatePath("/admin");
  return { ok: true, message: disabled ? `${user.email} disabled and signed out.` : `${user.email} enabled.` };
}

export async function setRoleAction(userId: string, role: Role): Promise<ActionResult> {
  const actor = await requireAdmin();
  const user = await loadTarget(userId);
  if (!user) return { ok: false, message: "User not found." };
  if (role !== "ADMIN" && role !== "REP") return { ok: false, message: "Unknown role." };
  if (user.id === actor.id) return { ok: false, message: "You cannot change your own role." };
  if (role === "REP" && (await isLastActiveAdmin(user))) return { ok: false, message: "The last admin cannot be demoted." };
  if (user.role === role) return { ok: true, message: "No change." };

  await db.user.update({ where: { id: user.id }, data: { role } });
  await logAudit({ actor, action: "role_changed", target: user, before: { role: user.role }, after: { role } });
  revalidatePath("/admin");
  const note = role === "REP" && env.adminEmails.includes(user.email) ? " This address is in ADMIN_EMAILS, so the next deploy makes it an admin again." : "";
  return { ok: true, message: `${user.email} is now ${role === "ADMIN" ? "an admin" : "a rep"}.${note}` };
}

export async function sendPasswordResetAction(userId: string): Promise<ActionResult> {
  const actor = await requireAdmin();
  const user = await loadTarget(userId);
  if (!user || user.status !== "ACTIVE") return { ok: false, message: "Only active users can reset a password." };

  const token = generateToken();
  await db.magicLinkToken.create({ data: { tokenHash: hashToken(token), purpose: "RESET", userId: user.id, expiresAt: resetTokenExpiry() } });
  const url = `${env.appUrl}/reset/${encodeURIComponent(token)}`;
  const emailed = await sendEmail({
    to: user.email,
    subject: "Reset your Penguin Sales Demo Portal password",
    text: ["Use the link below to choose a new password.", "", url, "", "The link is valid for 24 hours and can be used once."].join("\n"),
  });
  await logAudit({ actor, action: "password_reset_sent", target: user });
  return { ok: true, message: linkMessage(emailed, "Password reset link"), links: [{ email: user.email, url, kind: "reset" }] };
}

export async function removeUserAction(userId: string): Promise<ActionResult> {
  const actor = await requireAdmin();
  const user = await loadTarget(userId);
  if (!user) return { ok: false, message: "User not found." };
  if (user.id === actor.id) return { ok: false, message: "You cannot remove your own account." };
  if (await isLastActiveAdmin(user)) return { ok: false, message: "The last admin cannot be removed." };

  // Sessions and demo runs go with the user. Access events stay, keyed by the email they recorded.
  await db.user.delete({ where: { id: user.id } });
  await logAudit({ actor, action: "user_removed", target: user, before: { role: user.role, status: user.status } });
  revalidatePath("/admin");
  return { ok: true, message: `${user.email} removed.` };
}
