"use client";

import { useEffect, useState } from "react";
import { clearSession, loadSession, type Saved } from "@/store/session";
import { resolveDates } from "@/store/dates";
import { parseLocation, useLocation } from "@/store/router";
import { ShellProvider, useShell } from "@/store/store";
import type { Pack } from "@/verticals/types";
import { Chrome } from "./chrome";
import { DemoBar } from "./demo-bar";
import { EndCard } from "./end-card";
import { isOutsideHubSpot, Routes } from "./routes";
import { cx } from "./ui";

type Loaded = { vertical: string; pack: Pack; saved: Saved | null; location: string };

// Packs stay in memory for the life of the page, so switching vertical never waits on the network.
const packs = new Map<string, Promise<Pack>>();

function loadPack(vertical: string, version: string): Promise<Pack> {
  const key = `${version}/${vertical}`;
  let pending = packs.get(key);
  if (!pending) {
    pending = fetch(`/api/packs/${key}`, { credentials: "same-origin" })
      .then((response) => {
        if (!response.ok) throw new Error(`Pack request failed: ${response.status}`);
        return response.json() as Promise<Pack>;
      })
      .then((pack) => resolveDates(pack, Date.now()));
    pending.catch(() => packs.delete(key));
    packs.set(key, pending);
  }
  return pending;
}

function Frame() {
  const { route, highlight, endCardOpen } = useShell();
  const outside = isOutsideHubSpot(route.segments);
  return (
    <div className={cx("flex h-screen min-w-[1180px] flex-col overflow-hidden", highlight && "px-highlight")} data-testid="shell" data-path={route.path}>
      {outside ? (
        <Routes />
      ) : (
        <Chrome>
          <Routes />
        </Chrome>
      )}
      {highlight ? <div className="px-dim" aria-hidden="true" /> : null}
      <DemoBar />
      {endCardOpen ? <EndCard /> : null}
    </div>
  );
}

/**
 * Entry point of the simulated HubSpot shell. Fetches the vertical pack once (it is cached by the
 * browser after the launchpad warms it), then everything runs in the browser. The vertical comes
 * from the URL, so the account switcher moves between live verticals without a page load.
 */
export function ShellApp({ initialVertical, packVersions }: { initialVertical: string; packVersions: Record<string, string> }) {
  const requested = parseLocation(useLocation(`/demo/${initialVertical}`)).vertical;
  const verticalId = packVersions[requested] ? requested : initialVertical;
  const packVersion = packVersions[verticalId];
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const url = new URL(window.location.href);
    if (url.searchParams.get("fresh") === "1") {
      clearSession(verticalId);
      url.searchParams.delete("fresh");
      window.history.replaceState(null, "", url.pathname + url.search);
    }
    loadPack(verticalId, packVersion)
      .then((pack) => {
        if (cancelled) return;
        setLoaded({ vertical: verticalId, pack, saved: loadSession(verticalId, packVersion), location: window.location.pathname + window.location.search });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    for (const [id, version] of Object.entries(packVersions)) {
      if (id !== verticalId) loadPack(id, version).catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [verticalId, packVersion, packVersions]);

  if (failed) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-hs-bg">
        <p className="text-[16px] font-semibold">The demo could not load.</p>
        <p className="text-[13.5px] text-ink-muted">Your session may have ended.</p>
        <a href="/launchpad" className="hs-link">
          Back to the launchpad
        </a>
      </div>
    );
  }
  // The frame paints at once so the first screen never jumps; the pack arrives from the browser cache.
  if (!loaded || loaded.vertical !== verticalId) return <div className="h-screen bg-nav" data-testid="shell-loading" />;

  return (
    <ShellProvider key={verticalId} pack={loaded.pack} version={packVersion} initial={loaded.saved} initialLocation={loaded.location}>
      <Frame />
    </ShellProvider>
  );
}
