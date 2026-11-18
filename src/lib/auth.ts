import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Role, User } from "@prisma/client";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/email";
import { logEvent } from "@/lib/log";
import { hashPassword, verifyPassword, MIN_PASSWORD_LENGTH } from "@/lib/password.mjs";
import { generateToken, hashToken } from "@/lib/tokens";

export const SESSION_COOKIE = "demo_portal_session";
const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;
const RESET_TTL_MS = 24 * 60 * 60 * 1000;
export const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const SLIDE_AFTER_MS = 60 * 60 * 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  sessionId: string;
};

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}

export type RequestMeta = { ip: string | null; userAgent: string | null };

export async function requestMeta(): Promise<RequestMeta> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : h.get("x-real-ip");
  return { ip: ip || null, userAgent: h.get("user-agent")?.slice(0, 300) || null };
}

// Failed sign-ins per email, held in memory. One app instance on Railway, so this is enough to slow guessing.
const failures = new Map<string, number[]>();
const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 8;

function tooManyFailures(email: string): boolean {
  const recent = (failures.get(email) ?? []).filter((t) => Date.now() - t < FAILURE_WINDOW_MS);
  failures.set(email, recent);
  return recent.length >= MAX_FAILURES;
}

function recordFailure(email: string): void {
  failures.set(email, [...(failures.get(email) ?? []), Date.now()]);
}

export type IssuedSession = { sessionToken: string; expiresAt: Date };

async function createSession(user: Pick<User, "id" | "email">, method: string): Promise<IssuedSession> {
  const meta = await requestMeta();
  const sessionToken = generateToken();
  const expiresAt = new Date(Date.now() + env.sessionTtlDays * DAY_MS);

  const [session] = await db.$transaction([
    db.session.create({
      data: { tokenHash: hashToken(sessionToken), userId: user.id, expiresAt, ip: meta.ip, userAgent: meta.userAgent },
    }),
    db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
  ]);

  await logEvent({ type: "login_success", userId: user.id, email: user.email, sessionId: session.id, meta: { method }, ...meta });
  return { sessionToken, expiresAt };
}

export type LoginResult =
  | ({ ok: true } & IssuedSession)
  | { ok: false; reason: "invalid_credentials" | "disabled" | "too_many_attempts" };

export async function loginWithPassword(rawEmail: string, password: string): Promise<LoginResult> {
  const email = normalizeEmail(rawEmail);
  const meta = await requestMeta();

  if (tooManyFailures(email)) {
    await logEvent({ type: "login_failed", email, meta: { method: "password", reason: "too_many_attempts" }, ...meta });
    return { ok: false, reason: "too_many_attempts" };
  }

  const user = await db.user.findUnique({ where: { email } });
  const passwordOk = await verifyPassword(password, user?.passwordHash);

  if (!user || !passwordOk) {
    recordFailure(email);
    await logEvent({ type: "login_failed", userId: user?.id, email, meta: { method: "password", reason: "invalid_credentials" }, ...meta });
    return { ok: false, reason: "invalid_credentials" };
  }
  if (user.status === "DISABLED") {
    await logEvent({ type: "login_failed", userId: user.id, email, meta: { method: "password", reason: "disabled" }, ...meta });
    return { ok: false, reason: "disabled" };
  }

  failures.delete(email);
  const session = await createSession(user, "password");
  return { ok: true, ...session };
}

export type GoogleLoginResult = ({ ok: true } & IssuedSession) | { ok: false; reason: "google_not_invited" | "google_disabled" | "google_unverified" };

/**
 * Signs in a person Google has vouched for. Access stays invite-only: the email must already
 * belong to a user an admin added, and this never creates one. A first Google sign-in by an
 * invited user accepts the invitation.
 */
export async function loginWithGoogle(profile: { email: string; emailVerified: boolean; name: string | null }): Promise<GoogleLoginResult> {
  const email = normalizeEmail(profile.email);
  const meta = await requestMeta();
  const fail = async (reason: "google_not_invited" | "google_disabled" | "google_unverified", userId?: string): Promise<GoogleLoginResult> => {
    await logEvent({ type: "login_failed", userId, email, meta: { method: "google", reason: reason.replace("google_", "") }, ...meta });
    return { ok: false, reason };
  };

  if (!profile.emailVerified) return fail("google_unverified");
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return fail("google_not_invited");
  if (user.status === "DISABLED") return fail("google_disabled", user.id);

  if (user.status === "INVITED") {
    await db.$transaction([
      db.user.update({ where: { id: user.id }, data: { status: "ACTIVE", ...(user.name || !profile.name ? {} : { name: profile.name.slice(0, 120) }) } }),
      db.invite.updateMany({ where: { userId: user.id, acceptedAt: null, revokedAt: null }, data: { acceptedAt: new Date() } }),
    ]);
    await logEvent({ type: "invite_accepted", userId: user.id, email, meta: { method: "google" }, ...meta });
  }

  const session = await createSession(user, "google");
  return { ok: true, ...session };
}

export type ChangePasswordResult = { ok: true } | { ok: false; reason: "wrong_password" | "password_too_short" | "password_mismatch" };

/** Changes the signed-in user's password and ends their other sessions. The current session stays. */
export async function changePassword(current: SessionUser, currentPassword: string, password: string, confirm: string): Promise<ChangePasswordResult> {
  if (password.length < MIN_PASSWORD_LENGTH) return { ok: false, reason: "password_too_short" };
  if (password !== confirm) return { ok: false, reason: "password_mismatch" };
  const user = await db.user.findUnique({ where: { id: current.id } });
  if (!user) return { ok: false, reason: "wrong_password" };
  // Someone who joined with Google has no password yet and may set a first one.
  if (user.passwordHash && !(await verifyPassword(currentPassword, user.passwordHash))) return { ok: false, reason: "wrong_password" };

  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password) } }),
    db.session.deleteMany({ where: { userId: user.id, id: { not: current.sessionId } } }),
  ]);
  const meta = await requestMeta();
  await logEvent({ type: "password_changed", userId: user.id, email: user.email, sessionId: current.sessionId, ...meta });
  return { ok: true };
}

/** Always answers the same way, so the form does not reveal which emails have accounts. */
export async function requestMagicLink(rawEmail: string): Promise<void> {
  const email = normalizeEmail(rawEmail);
  if (!isValidEmail(email) || !env.resendApiKey) return;

  const user = await db.user.findUnique({ where: { email } });
  if (!user || user.status !== "ACTIVE") return;

  const token = generateToken();
  await db.magicLinkToken.create({
    data: { tokenHash: hashToken(token), purpose: "LOGIN", userId: user.id, expiresAt: new Date(Date.now() + MAGIC_LINK_TTL_MS) },
  });

  await sendEmail({
    to: email,
    subject: "Your sign-in link for the Penguin Sales Demo Portal",
    text: [
      "Use the link below to sign in to the Penguin Sales Demo Portal.",
      "",
      `${env.appUrl}/auth/verify?token=${encodeURIComponent(token)}`,
      "",
      "This link expires in 15 minutes and can be used once.",
      "If you did not request it, you can ignore this email.",
    ].join("\n"),
  });
}

export type VerifyResult = ({ ok: true } & IssuedSession) | { ok: false; reason: "invalid" | "expired" | "used" | "disabled" };

export async function verifyMagicLink(token: string): Promise<VerifyResult> {
  if (!token) return { ok: false, reason: "invalid" };

  const record = await db.magicLinkToken.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!record || record.purpose !== "LOGIN") return { ok: false, reason: "invalid" };
  if (record.usedAt) return { ok: false, reason: "used" };
  if (record.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };
  if (record.user.status !== "ACTIVE") return { ok: false, reason: "disabled" };

  // Claim atomically so a double click on the link cannot mint two sessions.
  const claimed = await db.magicLinkToken.updateMany({ where: { id: record.id, usedAt: null }, data: { usedAt: new Date() } });
  if (claimed.count !== 1) return { ok: false, reason: "used" };

  const session = await createSession(record.user, "magic_link");
  return { ok: true, ...session };
}

export type TokenLookup =
  | { ok: true; kind: "invite" | "reset"; recordId: string; user: Pick<User, "id" | "email" | "name" | "status"> }
  | { ok: false };

export async function lookupInvite(token: string): Promise<TokenLookup> {
  const invite = await db.invite.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!invite || invite.revokedAt || invite.acceptedAt || invite.expiresAt.getTime() < Date.now()) return { ok: false };
  if (invite.user.status === "DISABLED") return { ok: false };
  return { ok: true, kind: "invite", recordId: invite.id, user: invite.user };
}

export async function lookupReset(token: string): Promise<TokenLookup> {
  const record = await db.magicLinkToken.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!record || record.purpose !== "RESET" || record.usedAt || record.expiresAt.getTime() < Date.now()) return { ok: false };
  if (record.user.status === "DISABLED") return { ok: false };
  return { ok: true, kind: "reset", recordId: record.id, user: record.user };
}

export type SetPasswordResult =
  | ({ ok: true } & IssuedSession)
  | { ok: false; reason: "link_invalid" | "password_too_short" | "password_mismatch" };

/** Completes an invite or a password reset: stores the password, activates the account, and signs the user in. */
export async function setPasswordWithToken(
  kind: "invite" | "reset",
  token: string,
  password: string,
  confirm: string,
  name: string | null,
): Promise<SetPasswordResult> {
  if (password.length < MIN_PASSWORD_LENGTH) return { ok: false, reason: "password_too_short" };
  if (password !== confirm) return { ok: false, reason: "password_mismatch" };

  const lookup = kind === "invite" ? await lookupInvite(token) : await lookupReset(token);
  if (!lookup.ok) return { ok: false, reason: "link_invalid" };

  const claimed =
    kind === "invite"
      ? await db.invite.updateMany({ where: { id: lookup.recordId, acceptedAt: null, revokedAt: null }, data: { acceptedAt: new Date() } })
      : await db.magicLinkToken.updateMany({ where: { id: lookup.recordId, usedAt: null }, data: { usedAt: new Date() } });
  if (claimed.count !== 1) return { ok: false, reason: "link_invalid" };

  const passwordHash = await hashPassword(password);
  const user = await db.user.update({
    where: { id: lookup.user.id },
    data: { passwordHash, status: "ACTIVE", ...(name ? { name } : {}) },
  });
  // A new password ends every older session for the account.
  await db.session.deleteMany({ where: { userId: user.id } });

  const meta = await requestMeta();
  await logEvent({ type: kind === "invite" ? "invite_accepted" : "password_reset", userId: user.id, email: user.email, ...meta });

  const session = await createSession(user, kind);
  return { ok: true, ...session };
}

export function resetTokenExpiry(): Date {
  return new Date(Date.now() + RESET_TTL_MS);
}

export function sessionCookieOptions(expiresAt: Date) {
  return { httpOnly: true, secure: env.secureCookies, sameSite: "lax" as const, path: "/", expires: expiresAt };
}

/** For server actions, which set cookies through next/headers rather than a NextResponse. */
export async function setSessionCookie(session: IssuedSession): Promise<void> {
  const cookieStore = await cookies();
  // The cookie outlives the server-side session so the sliding expiry in the database decides validity.
  cookieStore.set(SESSION_COOKIE, session.sessionToken, sessionCookieOptions(new Date(Date.now() + 365 * DAY_MS)));
}

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!session || session.expiresAt.getTime() < Date.now()) return null;
  if (session.user.status !== "ACTIVE") return null;

  // Sliding lifetime: an active rep is never signed out before a call.
  if (Date.now() - session.lastSeenAt.getTime() > SLIDE_AFTER_MS) {
    await db.session
      .update({ where: { id: session.id }, data: { lastSeenAt: new Date(), expiresAt: new Date(Date.now() + env.sessionTtlDays * DAY_MS) } })
      .catch(() => {});
  }

  const { user } = session;
  return { id: user.id, email: user.email, name: user.name, role: user.role, sessionId: session.id };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/launchpad");
  return user;
}

export async function destroySession(token: string | undefined): Promise<void> {
  if (!token) return;
  const session = await db.session.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: { select: { email: true } } } });
  if (!session) return;
  await db.session.delete({ where: { id: session.id } }).catch(() => {});
  const meta = await requestMeta();
  await logEvent({ type: "logout", userId: session.userId, email: session.user.email, sessionId: session.id, ...meta });
}
