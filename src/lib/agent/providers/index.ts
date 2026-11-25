import "server-only";
import { env } from "@/lib/env";
import type { AgentProviderId, Provider } from "../types";
import { anthropicProvider } from "./anthropic";
import { mockProvider } from "./mock";
import { openaiProvider } from "./openai";

/** Providers that ship an adapter today. xAI is deferred: its key is read, its slot is here, no adapter yet. */
export const REAL_PROVIDERS = ["anthropic", "openai"] as const;
export type RealProviderId = (typeof REAL_PROVIDERS)[number];

export const PROVIDER_LABELS: Record<AgentProviderId, string> = {
  anthropic: "Claude",
  openai: "OpenAI",
  xai: "Grok",
  mock: "Sample (mock)",
};

/** Default model per provider. Pinned ids from the vendors' model pages, 25 Nov 2026. Override with AGENT_MODEL_<PROVIDER>. */
const DEFAULT_MODELS: Record<RealProviderId, string> = {
  anthropic: "claude-sonnet-5-5",
  openai: "gpt-6.2-sol",
};

function keyFor(id: RealProviderId): string | null {
  return id === "anthropic" ? env.anthropicApiKey : env.openaiApiKey;
}

function allowed(id: AgentProviderId): boolean {
  const list = env.agentProviders;
  return list.length === 0 || list.includes(id);
}

/** Provider ids the portal can use right now: a key is present (or the mock is on) and the allowlist agrees. Never exposes key values. */
export function enabledProviders(): AgentProviderId[] {
  const ids: AgentProviderId[] = [];
  for (const id of REAL_PROVIDERS) if (keyFor(id) && allowed(id)) ids.push(id);
  if (env.agentMock) ids.push("mock");
  return ids;
}

export function isProviderId(value: unknown): value is AgentProviderId {
  return value === "anthropic" || value === "openai" || value === "xai" || value === "mock";
}

export function modelFor(id: AgentProviderId): string {
  if (id === "mock") return "mock";
  if (id === "xai") return env.agentModel("xai") ?? "grok-4.7";
  return env.agentModel(id) ?? DEFAULT_MODELS[id];
}

/** The adapter for an enabled provider, or null when it is off, has no key, or (xAI) has no adapter yet. */
export function providerFor(id: AgentProviderId): Provider | null {
  if (!enabledProviders().includes(id)) return null;
  if (id === "mock") return mockProvider();
  if (id === "anthropic") return anthropicProvider(env.anthropicApiKey!);
  if (id === "openai") return openaiProvider(env.openaiApiKey!);
  return null;
}
