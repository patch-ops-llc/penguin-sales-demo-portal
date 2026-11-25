import type { Usage } from "./types";

/**
 * List prices in USD per million tokens, from the vendors' pricing pages on 25 Nov 2026
 * (platform.claude.com/docs/en/about-claude/pricing, developers.openai.com/api/docs/pricing).
 * Used for the daily budget and the admin cost column. Estimates, not invoices.
 */
type Price = { input: number; cachedInput: number; output: number };

const PRICES: Record<string, Price> = {
  "claude-opus-5-5": { input: 4, cachedInput: 0.2, output: 20 },
  "claude-sonnet-5-5": { input: 2, cachedInput: 0.1, output: 10 },
  "claude-haiku-5-5": { input: 0.1, cachedInput: 0.01, output: 0.5 },
  "gpt-6.2-astra": { input: 8, cachedInput: 0.4, output: 40 },
  "gpt-6.2-sol": { input: 2, cachedInput: 0.1, output: 10 },
  "gpt-6.1-terra": { input: 1, cachedInput: 0.05, output: 5 },
  "gpt-6-luna": { input: 0.1, cachedInput: 0.01, output: 0.5 },
  "grok-4.7": { input: 2, cachedInput: 0.5, output: 6 },
  mock: { input: 0, cachedInput: 0, output: 0 },
};

/** An unknown model is priced like the most expensive one we know, so a typo can never under-count spend. */
const FALLBACK: Price = { input: 8, cachedInput: 0.4, output: 40 };

/** `usage.inputTokens` is the total prompt size; `cachedInputTokens` is the part of it served from cache. */
export function estimateCostUsd(model: string, usage: Usage): number {
  const price = PRICES[model] ?? FALLBACK;
  const uncached = Math.max(0, usage.inputTokens - usage.cachedInputTokens);
  const usd = (uncached * price.input + usage.cachedInputTokens * price.cachedInput + usage.outputTokens * price.output) / 1_000_000;
  return Math.round(usd * 1_000_000) / 1_000_000;
}
