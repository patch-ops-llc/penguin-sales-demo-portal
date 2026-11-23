"use client";

import { useEffect, useRef, useState } from "react";
import { preloadErpCard } from "@/demos/back-office/erp-card-lazy";
import { clearSession, loadSession, type Saved } from "@/store/session";
import { resolveDates } from "@/store/dates";
import { parseLocation, useLocation } from "@/store/router";
import { ShellProvider, useShell } from "@/store/store";
import { getVertical, isDemoId } from "@/verticals/catalog";
import type { Pack } from "@/verticals/types";
import { Chrome } from "./chrome";
import { DemoBar } from "./demo-bar";
import { EndCard } from "./end-card";
import { preloadAnalytics } from "./analytics/lazy";
import { preloadIntake } from "./intake/lazy";
import { preloadMarketing } from "./marketing/lazy";
import { preloadApprovalSettings } from "./pages/approval-settings-lazy";
import { preloadSite } from "./pages/site-lazy";
import { APPROVAL_WORKFLOW_ID } from "./quote/approval-rule";
import { preloadBuyer } from "./quote/buyer-lazy";
import { preloadQuoteEditorPanels } from "./quote/editor-lazy";
import { preloadRenewals } from "./renewals/lazy";
import { isOutsideHubSpot, Routes } from "./routes";
import { preloadService } from "./service/lazy";
import { preloadSocial } from "./social/lazy";
import { preloadTickets } from "./tickets/lazy";
import { cx } from "./ui";

function preloadForInitialEntry(verticalId: string, location: string): Promise<unknown> {
  const parsed = parseLocation(location);
  const demo = parsed.demo ?? getVertical(verticalId)?.demos[0];
  const section = parsed.segments[0];
  const tasks: Promise<unknown>[] = [];
  if (demo === "customer-agent" || section === "service" || section === "service-app" || section === "service-dashboard") {
    tasks.push(preloadService());
  }
  if (
    demo === "post-visit-feedback" ||
    demo === "incident-comms" ||
    demo === "customer-onboarding" ||
    demo === "client-onboarding" ||
    demo === "complaint-sla" ||
    section === "tickets" ||
    section === "ticket-app"
  ) {
    tasks.push(preloadTickets());
  }
  if (
    demo === "social-ads" ||
    demo === "patient-reactivation" ||
    demo === "pql-trial-prospecting" ||
    section === "campaigns" ||
    section === "social" ||
    section === "insights" ||
    section === "offplatform" ||
    section === "reactivation"
  ) {
    tasks.push(preloadSocial());
  }
  if (demo === "marketing-studio" || section === "marketing") {
    tasks.push(preloadMarketing());
  }
  if (demo === "lead-capture" || section === "site") {
    tasks.push(preloadSite());
  }
  if (demo === "discount-approval" || section === "settings" || (section === "workflows" && parsed.segments[1] === APPROVAL_WORKFLOW_ID)) {
    tasks.push(preloadApprovalSettings(), preloadQuoteEditorPanels());
  }
  if (demo === "back-office") {
    tasks.push(preloadErpCard());
  }
  if (demo === "referral-intake" || demo === "staffing-job-orders" || demo === "loan-application-pipeline" || section === "intake") {
    tasks.push(preloadIntake());
  }
  if (
    demo === "premium-to-subscription" ||
    demo === "renewal-churn-risk" ||
    demo === "contract-renewal" ||
    section === "renewals" ||
    section === "renewals-app"
  ) {
    tasks.push(preloadRenewals());
    if (demo === "renewal-churn-risk" || demo === "contract-renewal") {
      tasks.push(preloadApprovalSettings(), preloadQuoteEditorPanels(), preloadBuyer());
    }
  }
  if (section === "reports") {
    tasks.push(preloadAnalytics());
  }
  return tasks.length > 0 ? Promise.all(tasks) : Promise.resolve();
}

function shouldPreloadRenewals(pack: Pack, verticalId: string, location: string): boolean {
  const renewals = pack.demos.renewals;
  if (!renewals) return false;
  const parsed = parseLocation(location);
  if (parsed.segments[0] === "renewals" || parsed.segments[0] === "renewals-app") return true;
  const demo = parsed.demo ?? getVertical(verticalId)?.demos[0];
  if (!demo || !isDemoId(demo)) return false;
  return demo in renewals;
}

function shouldPreloadTickets(pack: Pack, verticalId: string, location: string): boolean {
  const tickets = pack.demos.tickets;
  if (!tickets) return false;
  const parsed = parseLocation(location);
  if (parsed.segments[0] === "tickets" || parsed.segments[0] === "ticket-app") return true;
  const demo = parsed.demo ?? getVertical(verticalId)?.demos[0];
  if (!demo || !isDemoId(demo)) return false;
  return Boolean(tickets[demo]);
}

function shouldPreloadAnalytics(pack: Pack, verticalId: string, location: string): boolean {
  const reports = pack.reports;
  if (!reports) return false;
  const parsed = parseLocation(location);
  if (parsed.segments[0] === "reports") return true;
  const demo = parsed.demo ?? getVertical(verticalId)?.demos[0];
  if (!demo || !isDemoId(demo)) return false;
  return Object.values(reports).some((r) => r.demoId === demo || r.demoIds?.includes(demo));
}

function shouldPreloadSocial(pack: Pack, verticalId: string, location: string): boolean {
  const parsed = parseLocation(location);
  const demo = parsed.demo ?? getVertical(verticalId)?.demos[0];
  return Boolean(
    (demo === "ai-prospecting" && pack.demos.aiProspecting.offPlatformMeeting) ||
      (demo === "pql-trial-prospecting" && pack.demos.pqlTrial),
  );
}

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
  const preloaded = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const url = new URL(window.location.href);
    if (url.searchParams.get("fresh") === "1") {
      clearSession(verticalId);
      url.searchParams.delete("fresh");
      window.history.replaceState(null, "", url.pathname + url.search);
    }
    const initialLocation = window.location.pathname + window.location.search;
    const isInitialMount = !preloaded.current;
    preloaded.current = true;
    const preload = isInitialMount ? preloadForInitialEntry(verticalId, initialLocation) : Promise.resolve();
    Promise.all([loadPack(verticalId, packVersion), preload])
      .then(async ([pack]) => {
        if (isInitialMount) {
          const postPreloads: Promise<unknown>[] = [];
          if (shouldPreloadAnalytics(pack, verticalId, initialLocation)) postPreloads.push(preloadAnalytics());
          if (shouldPreloadTickets(pack, verticalId, initialLocation)) postPreloads.push(preloadTickets());
          if (shouldPreloadSocial(pack, verticalId, initialLocation)) postPreloads.push(preloadSocial());
          if (shouldPreloadRenewals(pack, verticalId, initialLocation)) postPreloads.push(preloadRenewals());
          if (postPreloads.length > 0) await Promise.all(postPreloads);
        }
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
