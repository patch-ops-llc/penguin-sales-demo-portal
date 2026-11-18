// Background access logging from the browser. Events are queued and sent in small batches;
// a failed send is dropped silently so logging can never delay or break a demo.

export type BeaconEvent = {
  type: "launchpad_opened" | "vertical_opened" | "demo_started" | "step_reached" | "demo_completed" | "demo_reset" | "demo_switched" | "highlight_used";
  vertical?: string;
  demo?: string;
  step?: number;
  totalSteps?: number;
  runId?: string;
  title?: string;
};

const ENDPOINT = "/api/events";
const FLUSH_MS = 1500;
let queue: (BeaconEvent & { at: number })[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let bound = false;

export function flushEvents(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (queue.length === 0 || typeof navigator === "undefined") return;
  const payload = JSON.stringify({ events: queue });
  queue = [];
  try {
    if (typeof navigator.sendBeacon === "function" && navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: "application/json" }))) return;
    fetch(ENDPOINT, { method: "POST", headers: { "content-type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
  } catch {
    // Dropped on purpose.
  }
}

export function track(event: BeaconEvent): void {
  if (typeof window === "undefined") return;
  if (!bound) {
    bound = true;
    window.addEventListener("pagehide", flushEvents);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushEvents();
    });
  }
  queue.push({ ...event, at: Date.now() });
  if (!timer) timer = setTimeout(flushEvents, FLUSH_MS);
}

export function newRunId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `run-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
