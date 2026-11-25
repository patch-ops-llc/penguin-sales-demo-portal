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

  // ---------- Agent demos (LLM providers). Keys are read here and nowhere else, server-side only. ----------

  get anthropicApiKey() {
    return process.env.ANTHROPIC_API_KEY || null;
  },
  get openaiApiKey() {
    return process.env.OPENAI_API_KEY || null;
  },
  /** xAI is deferred: the adapter slot exists, the key is read, but no adapter ships yet. */
  get xaiApiKey() {
    return process.env.XAI_API_KEY || null;
  },
  /** Optional allowlist of provider ids. Empty means every provider with a key is on. */
  get agentProviders() {
    return list("AGENT_PROVIDERS");
  },
  /** Deterministic in-process provider for CI and local work. Never set in production. */
  get agentMock() {
    return process.env.AGENT_MOCK === "1" || process.env.AGENT_MOCK === "true";
  },
  agentModel(provider: "anthropic" | "openai" | "xai"): string | null {
    return process.env[`AGENT_MODEL_${provider.toUpperCase()}`] || null;
  },
  get agentDailyBudgetUsd() {
    return positiveNumber("AGENT_DAILY_BUDGET_USD", 25);
  },
  get agentSessionMaxTurns() {
    return positiveNumber("AGENT_SESSION_MAX_TURNS", 40);
  },
  get agentUserTurnsPerMinute() {
    return positiveNumber("AGENT_USER_TURNS_PER_MINUTE", 10);
  },
  /** Store transcript text with each logged turn. Off by default: only metadata is kept. */
  get agentLogTranscripts() {
    return process.env.AGENT_LOG_TRANSCRIPTS === "true";
  },
  /** Cookies are marked Secure whenever the public URL is https, so plain-http local runs still work. */
  get secureCookies() {
    return (process.env.APP_URL ?? "").startsWith("https://");
  },
};
