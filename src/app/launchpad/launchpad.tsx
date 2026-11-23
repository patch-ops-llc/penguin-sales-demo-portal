"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Lockup } from "@/components/brand";
import { track } from "@/lib/beacon";
import { Icon, Sparkle } from "@/shell/icons";
import { hasSavedChanges } from "@/store/session";
import { DEMO_HUBS, demoTile, hubLabel, VERTICALS, type DemoHub, type DemoTile } from "@/verticals/catalog";

type Props = { user: { name: string | null; email: string; isAdmin: boolean }; packVersions: Record<string, string> };

function matchesSearch(tile: DemoTile, query: string): boolean {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = [
    tile.title,
    tile.summary,
    tile.takeaway,
    hubLabel(tile.hub),
    ...(tile.tags ?? []),
    tile.ai ? "ai breeze" : "",
    tile.flagship ? "flagship" : "",
  ]
    .join(" ")
    .toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

export function Launchpad({ user, packVersions }: Props) {
  const [verticalId, setVerticalId] = useState("manufacturing");
  const [hubFilter, setHubFilter] = useState<"all" | DemoHub>("all");
  const [aiOnly, setAiOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [resumable, setResumable] = useState<string[]>([]);
  const vertical = VERTICALS.find((v) => v.id === verticalId) ?? VERTICALS[0];

  useEffect(() => {
    track({ type: "launchpad_opened" });
    // Read after mount: session storage does not exist on the server.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResumable(Object.keys(packVersions).filter(hasSavedChanges));
    // Warm the browser cache so the shell opens with its data already local.
    for (const [id, version] of Object.entries(packVersions)) fetch(`/api/packs/${version}/${id}`, { credentials: "same-origin" }).catch(() => {});
  }, [packVersions]);

  const orderedTiles = useMemo(() => {
    return vertical.demos
      .map((id, index) => ({ tile: demoTile(vertical.id, id), index }))
      .sort((a, b) => {
        const flagshipDiff = Number(Boolean(b.tile.flagship)) - Number(Boolean(a.tile.flagship));
        if (flagshipDiff !== 0) return flagshipDiff;
        if (a.tile.flagship && b.tile.flagship) {
          const aiDiff = Number(Boolean(b.tile.ai)) - Number(Boolean(a.tile.ai));
          if (aiDiff !== 0) return aiDiff;
        }
        return a.index - b.index;
      })
      .map((entry) => entry.tile);
  }, [vertical]);

  const hubCounts = useMemo(() => {
    const counts: Record<DemoHub, number> = { marketing: 0, sales: 0, service: 0, ops: 0 };
    for (const tile of orderedTiles) counts[tile.hub] += 1;
    return counts;
  }, [orderedTiles]);

  const aiCount = useMemo(() => orderedTiles.filter((tile) => tile.ai).length, [orderedTiles]);

  const filteredTiles = useMemo(() => {
    return orderedTiles.filter((tile) => {
      if (hubFilter !== "all" && tile.hub !== hubFilter) return false;
      if (aiOnly && !tile.ai) return false;
      return matchesSearch(tile, search);
    });
  }, [orderedTiles, hubFilter, aiOnly, search]);

  const hasActiveFilters = hubFilter !== "all" || aiOnly || search.trim().length > 0;
  const verticalGridCols = VERTICALS.length >= 6 ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-6" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-5";

  const clearFilters = () => {
    setHubFilter("all");
    setAiOnly(false);
    setSearch("");
  };

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-line-soft bg-white">
        <div className="mx-auto flex max-w-[1220px] items-center justify-between px-6 py-4">
          <Lockup height={28} />
          <div className="flex items-center gap-5 text-[13.5px]">
            <span className="text-ink-muted">{user.name ?? user.email}</span>
            {user.isAdmin ? (
              <Link href="/admin" className="hs-link">
                Admin
              </Link>
            ) : null}
            <Link href="/account" className="hs-link" data-testid="account-link">
              Account
            </Link>
            <form action="/auth/signout" method="post">
              <button type="submit" className="hs-link">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1220px] px-6 py-9">
        <h1 className="text-[30px] font-semibold tracking-tight">Pick a vertical, then a demo</h1>
        <p className="mt-2 max-w-[720px] text-[15px] text-ink-muted">
          Each demo runs inside a focused HubSpot portal with sample data. Everything is loaded up front, so nothing waits on the network once you start.
        </p>

        <h2 className="mt-8 text-[13px] font-semibold uppercase tracking-wider text-ink-muted">1. Vertical</h2>
        <div className={`mt-3 grid gap-3 ${verticalGridCols}`} data-testid="vertical-picker-grid">
          {VERTICALS.map((v) => {
            const live = v.status === "live";
            const selected = v.id === vertical.id;
            const body = (
              <div className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[15.5px] font-semibold leading-snug">{v.name}</span>
                  {live ? null : <span className="shrink-0 rounded-full bg-hs-bg px-2 py-0.5 text-[11px] font-semibold text-ink-muted">Coming soon</span>}
                </div>
                <div className="mt-1 text-[13px] font-medium text-ink">{v.company}</div>
                <p className="mt-1.5 text-[12.5px] leading-snug text-ink-muted">{v.blurb}</p>
                <div className="mt-auto pt-3 text-[12px] font-medium text-ink-muted">
                  {v.demos.length} {v.demos.length === 1 ? "demo" : "demos"}
                </div>
              </div>
            );
            return live ? (
              <button
                key={v.id}
                type="button"
                data-testid={`vertical-${v.id}`}
                aria-pressed={selected}
                onClick={() => {
                  setVerticalId(v.id);
                  clearFilters();
                  track({ type: "vertical_opened", vertical: v.id });
                }}
                className={`rounded-xl border bg-white p-3.5 text-left transition-shadow hover:shadow-[0_4px_16px_rgba(20,20,20,0.08)] ${selected ? "border-hs-orange ring-2 ring-hs-orange/25" : "border-line"}`}
              >
                {body}
              </button>
            ) : (
              <div key={v.id} data-testid={`vertical-${v.id}`} aria-disabled="true" className="rounded-xl border border-dashed border-line bg-white/60 p-3.5 text-ink-muted">
                {body}
              </div>
            );
          })}
        </div>

        <div className="mt-9 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-muted">2. Demo: {vertical.name}</h2>
          <p className="text-[12.5px] text-ink-muted">
            In a demo: arrow keys step forward and back, <kbd className="rounded border border-line bg-white px-1">R</kbd> resets,{" "}
            <kbd className="rounded border border-line bg-white px-1">H</kbd> highlights what Penguin built.
          </p>
        </div>

        {/* Hub / journey filter pills, AI / Breeze toggle, and instant client-side search */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line-soft bg-white px-3.5 py-2.5" data-testid="launchpad-filter-bar">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter demos by HubSpot hub">
            <button
              type="button"
              data-testid="hub-filter-all"
              aria-pressed={hubFilter === "all"}
              onClick={() => setHubFilter("all")}
              className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold transition-colors ${
                hubFilter === "all" ? "bg-ink text-white" : "bg-hs-bg/70 text-ink hover:bg-hs-bg"
              }`}
            >
              <span>All</span>
              <span className={`text-[11px] ${hubFilter === "all" ? "text-white/75" : "text-ink-muted"}`}>({orderedTiles.length})</span>
            </button>

            {DEMO_HUBS.map((hub) => {
              const count = hubCounts[hub.id];
              const active = hubFilter === hub.id;
              return (
                <button
                  key={hub.id}
                  type="button"
                  data-testid={`hub-filter-${hub.id}`}
                  aria-pressed={active}
                  onClick={() => setHubFilter(hub.id)}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold transition-colors ${
                    active
                      ? "bg-ink text-white"
                      : count === 0
                        ? "bg-transparent text-ink-muted/70 hover:bg-hs-bg/50 hover:text-ink-muted"
                        : "bg-hs-bg/70 text-ink hover:bg-hs-bg"
                  }`}
                >
                  <span>{hub.label}</span>
                  <span className={`text-[11px] ${active ? "text-white/75" : "text-ink-muted"}`}>({count})</span>
                </button>
              );
            })}

            <span className="mx-1 h-5 w-px bg-line-soft" aria-hidden="true" />

            <button
              type="button"
              data-testid="filter-ai-toggle"
              aria-pressed={aiOnly}
              onClick={() => setAiOnly((on) => !on)}
              className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-semibold transition-colors ${
                aiOnly
                  ? "border-[#7c3aed] bg-[#6d28d9] text-white shadow-xs"
                  : "border-[#ddd6fe] bg-[#f5f0ff] text-[#6d28d9] hover:bg-[#ede5ff]"
              }`}
            >
              <Sparkle size={12} />
              <span>AI / Breeze</span>
              <span className={`text-[11px] ${aiOnly ? "text-white/80" : "text-[#7c3aed]/80"}`}>({aiCount})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-[260px]">
            <Icon name="search" size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search demos..."
              aria-label="Search demos"
              data-testid="launchpad-search"
              className="h-8 w-full rounded-full border border-line bg-cream pl-8 pr-8 text-[12.5px] text-ink placeholder:text-ink-muted focus:border-ink focus:bg-white focus:outline-none"
            />
            {search ? (
              <button
                type="button"
                aria-label="Clear search"
                data-testid="launchpad-search-clear"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-ink-muted hover:bg-hs-bg hover:text-ink"
              >
                <Icon name="close" size={13} />
              </button>
            ) : null}
          </div>
        </div>

        {filteredTiles.length === 0 ? (
          <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-white px-6 py-12 text-center" data-testid="launchpad-empty">
            <p className="text-[15px] font-semibold">No demos match those filters in {vertical.name}</p>
            <p className="mt-1 text-[13px] text-ink-muted">Try another Hub, turn off the AI / Breeze filter, or clear your search.</p>
            {hasActiveFilters ? (
              <button
                type="button"
                data-testid="launchpad-clear-filters"
                onClick={clearFilters}
                className="mt-4 inline-flex h-8 items-center rounded-[5px] border border-ink bg-white px-3.5 text-[12.5px] font-semibold text-ink hover:bg-[#f5f5f5]"
              >
                Reset filters
              </button>
            ) : null}
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="launchpad-demo-grid">
            {filteredTiles.map((demo) => (
              <div key={demo.id} data-testid={`demo-${demo.id}`} className="flex flex-col rounded-xl border border-line bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-[4px] bg-hs-bg px-2 py-0.5 text-[11px] font-semibold text-ink-muted">{hubLabel(demo.hub)}</span>
                    {demo.flagship ? (
                      <span data-testid="badge-flagship" className="inline-flex items-center rounded-full bg-[#fff3eb] px-2 py-0.5 text-[11px] font-semibold text-[#b43c00] ring-1 ring-inset ring-[#ffd2b8]">
                        Flagship
                      </span>
                    ) : null}
                    {demo.ai ? (
                      <span data-testid="badge-ai" className="inline-flex items-center gap-1 rounded-full bg-[#f3e8ff] px-2 py-0.5 text-[11px] font-semibold text-[#6d28d9] ring-1 ring-inset ring-[#ddd6fe]">
                        <Sparkle size={10} />
                        AI
                      </span>
                    ) : null}
                  </div>
                  <span className="shrink-0 rounded-full bg-hs-bg px-2 py-0.5 text-[11.5px] font-medium text-ink-muted">About {demo.minutes} min</span>
                </div>
                <h3 className="mt-2.5 text-[18px] font-semibold tracking-tight">{demo.title}</h3>
                <p className="mt-1.5 text-[13px] leading-snug text-ink-muted">{demo.summary}</p>
                <p className="mt-3 border-l-2 border-hs-orange pl-3 text-[13px] leading-snug">{demo.takeaway}</p>
                <div className="mt-auto flex items-center gap-4 pt-5">
                  <Link
                    href={`/demo/${vertical.id}/${demo.id}?fresh=1`}
                    prefetch={false}
                    data-testid={`start-${demo.id}`}
                    className="inline-flex items-center rounded-[4px] bg-hs-orange px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-hs-orange-strong"
                  >
                    Start demo
                  </Link>
                  {resumable.includes(vertical.id) ? (
                    <Link href={`/demo/${vertical.id}/${demo.id}`} prefetch={false} className="hs-link text-[13px]">
                      Continue where I left off
                    </Link>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
