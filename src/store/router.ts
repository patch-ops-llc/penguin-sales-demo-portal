import { useSyncExternalStore } from "react";

// The shell owns navigation under /demo. It moves with history.pushState, which this Next.js
// version supports without a server round trip, and listens for the browser's back and forward.

const EVENT = "pdp:navigate";

function subscribe(callback: () => void): () => void {
  window.addEventListener("popstate", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener(EVENT, callback);
  };
}

const snapshot = () => window.location.pathname + window.location.search;

export function useLocation(initial: string): string {
  return useSyncExternalStore(subscribe, snapshot, () => initial);
}

export function pushUrl(url: string, replace = false): void {
  if (url === snapshot()) return;
  if (replace) window.history.replaceState(null, "", url);
  else window.history.pushState(null, "", url);
  window.dispatchEvent(new Event(EVENT));
}

export type ShellRoute = {
  vertical: string;
  demo: string | null;
  /** Shell-relative path, such as "/deals/dl-line4". Empty when the URL names only a demo. */
  path: string;
  segments: string[];
  query: URLSearchParams;
};

export function parseLocation(location: string): ShellRoute {
  const [pathname, search = ""] = location.split("?");
  const parts = pathname.split("/").filter(Boolean); // ["demo", vertical, demo, ...rest]
  const segments = parts.slice(3).map(decodeURIComponent);
  return {
    vertical: parts[1] ?? "",
    demo: parts[2] ?? null,
    path: segments.length > 0 ? `/${segments.join("/")}` : "",
    segments,
    query: new URLSearchParams(search),
  };
}
