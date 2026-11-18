function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function list(name: string): string[] {
  return (process.env[name] ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function positiveNumber(name: string, fallback: number): number {
  const n = Number(process.env[name] ?? "");
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const env = {
  get appUrl() {
    return required("APP_URL").replace(/\/$/, "");
  },
  get sessionSecret() {
    return required("SESSION_SECRET");
  },
  get adminEmails() {
    return list("ADMIN_EMAILS");
  },
  get resendApiKey() {
    return process.env.RESEND_API_KEY || null;
  },
  get emailFrom() {
    return process.env.EMAIL_FROM || "Penguin Sales Demo Portal <no-reply@example.com>";
  },
  get googleClientId() {
    return process.env.GOOGLE_CLIENT_ID || null;
  },
  get googleClientSecret() {
    return process.env.GOOGLE_CLIENT_SECRET || null;
  },
  /** Google sign-in is offered only when both credentials are set. */
  get googleEnabled() {
    return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  },
  get googleRedirectUri() {
    return `${required("APP_URL").replace(/\/$/, "")}/auth/google/callback`;
  },
  get sessionTtlDays() {
    return positiveNumber("SESSION_TTL_DAYS", 30);
  },
  get logRetentionDays() {
    return positiveNumber("LOG_RETENTION_DAYS", 730);
  },
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
  /** Cookies are marked Secure whenever the public URL is https, so plain-http local runs still work. */
  get secureCookies() {
    return (process.env.APP_URL ?? "").startsWith("https://");
  },
};
