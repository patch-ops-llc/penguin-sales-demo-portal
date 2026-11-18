"use client";

import { useShell } from "@/store/store";
import type { Quote } from "@/verticals/types";

/** The modules of a quote, in the order HubSpot lists them in the editor's left sidebar. */
export const MODULES = [
  { id: "cover", label: "Cover letter", icon: "note" },
  { id: "exec", label: "Executive summary", icon: "note" },
  { id: "header", label: "Header", icon: "form" },
  { id: "parties", label: "Parties", icon: "contacts" },
  { id: "summary", label: "Summary", icon: "list" },
  { id: "lines", label: "Line items", icon: "board" },
  { id: "terms", label: "Terms", icon: "file" },
  { id: "payments", label: "Payments", icon: "deal" },
  { id: "acceptance", label: "Acceptance", icon: "edit" },
] as const;

export type ModuleId = (typeof MODULES)[number]["id"];

/** What a new quote shows before anyone touches the editor. Anything not listed is on. */
const DEFAULTS: Record<string, string> = {
  "hide.cover": "1",
  "hide.exec": "1",
  "show.po": "0",
  "show.term": "0",
  discountFormat: "both",
  accept: "esign",
};

export type QuoteSettings = {
  get: (key: string, fallback?: string) => string;
  set: (key: string, value: string) => void;
  /** A switch: on unless it was turned off, or off by default. */
  on: (key: string) => boolean;
  toggle: (key: string) => void;
  hidden: (module: ModuleId) => boolean;
};

/**
 * Editor choices for one quote (hidden sections, labels, acceptance method). They live in the
 * world's view state, so the buyer page shows what the editor set and a reset clears them.
 */
export function useQuoteSettings(quote: Pick<Quote, "id">): QuoteSettings {
  const { world, dispatch } = useShell();
  const key = (k: string) => `q.${quote.id}.${k}`;
  const get = (k: string, fallback = "") => world.ui[key(k)] ?? DEFAULTS[k] ?? fallback;
  const set = (k: string, value: string) => dispatch({ t: "ui", k: key(k), v: value });
  const on = (k: string) => get(k, "1") === "1";
  return {
    get,
    set,
    on,
    toggle: (k) => set(k, on(k) ? "0" : "1"),
    hidden: (module) => get(`hide.${module}`, "0") === "1",
  };
}

/** The quote reference as HubSpot writes it: the creation date and time, run together. */
export function quoteRef(quote: Pick<Quote, "createdAt">): string {
  const d = new Date(quote.createdAt);
  const p = (n: number, width = 2) => String(n).padStart(width, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}${p(d.getMilliseconds(), 3)}`;
}
