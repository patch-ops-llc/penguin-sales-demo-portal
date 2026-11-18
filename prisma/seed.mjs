// Runs on every start, after migrations. Idempotent.
// 1. Makes sure every ADMIN_EMAILS address has an active admin account.
// 2. Purges access logs older than LOG_RETENTION_DAYS and expired sessions and links.
import { createHmac, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { hashPassword, MIN_PASSWORD_LENGTH } from "../src/lib/password.mjs";

const prisma = new PrismaClient();
const DAY_MS = 24 * 60 * 60 * 1000;

async function seedAdmins() {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || null;
  // ADMIN_PASSWORD_RESET=true forces ADMIN_INITIAL_PASSWORD onto every admin account,
  // even ones that already have a password. Set it for one deploy, then remove it.
  const forceReset = (process.env.ADMIN_PASSWORD_RESET ?? "").trim().toLowerCase() === "true";

  if (adminEmails.length === 0) {
    console.warn("[seed] ADMIN_EMAILS is empty. No admin account was created.");
    return;
  }
  if (initialPassword && initialPassword.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`ADMIN_INITIAL_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }

  for (const email of adminEmails) {
    const user = await prisma.user.upsert({
      where: { email },
      create: { email, role: "ADMIN", status: "ACTIVE" },
      update: { role: "ADMIN", status: "ACTIVE" },
    });

    if (initialPassword && (!user.passwordHash || forceReset)) {
      await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(initialPassword) } });
      console.log(`[seed] Admin ready, password ${forceReset ? "reset" : "set"} from ADMIN_INITIAL_PASSWORD: ${email}`);
    } else if (!user.passwordHash) {
      // No bootstrap password: print a one-time set-password link to the deploy log instead.
      const secret = process.env.SESSION_SECRET;
      const appUrl = (process.env.APP_URL ?? "").replace(/\/$/, "");
      if (!secret || !appUrl) throw new Error("SESSION_SECRET and APP_URL are required.");
      const token = randomBytes(32).toString("base64url");
      await prisma.invite.updateMany({ where: { userId: user.id, acceptedAt: null, revokedAt: null }, data: { revokedAt: new Date() } });
      await prisma.invite.create({
        data: {
          tokenHash: createHmac("sha256", secret).update(token).digest("hex"),
          userId: user.id,
          expiresAt: new Date(Date.now() + 14 * DAY_MS),
        },
      });
      console.log(`[seed] Admin ready, no password yet: ${email}\n[seed] Set a password with this one-time link (valid 14 days):\n${appUrl}/invite/${token}`);
    } else {
      console.log(`[seed] Admin ready: ${email}`);
    }
  }

  if (forceReset) {
    console.warn("[seed] ADMIN_PASSWORD_RESET is true. Remove it now so the next deploy does not reset passwords again.");
  }
}

async function purge() {
  const days = Number(process.env.LOG_RETENTION_DAYS ?? "");
  const retentionDays = Number.isFinite(days) && days > 0 ? days : 730;
  const cutoff = new Date(Date.now() - retentionDays * DAY_MS);
  const now = new Date();

  const [events, runs, audits, sessions] = await Promise.all([
    prisma.accessEvent.deleteMany({ where: { at: { lt: cutoff } } }),
    prisma.demoRun.deleteMany({ where: { startedAt: { lt: cutoff } } }),
    prisma.adminAudit.deleteMany({ where: { at: { lt: cutoff } } }),
    prisma.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.magicLinkToken.deleteMany({ where: { expiresAt: { lt: new Date(Date.now() - 7 * DAY_MS) } } }),
  ]);
  console.log(
    `[seed] Retention ${retentionDays} days: removed ${events.count} events, ${runs.count} demo runs, ${audits.count} audit rows, ${sessions.count} expired sessions.`,
  );
}

async function main() {
  await seedAdmins();
  await purge();
}

main()
  .catch((error) => {
    console.error("[seed] Failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
