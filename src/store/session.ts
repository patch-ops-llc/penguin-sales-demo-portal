import type { DemoId } from "@/verticals/catalog";
import type { Action } from "./world";

/** Progress through one demo. `marks[i]` is the length of the action list when step i became current. */
export type Run = { runId: string; marks: number[]; furthest: number; completed: boolean };

export type Saved = { version: string; changes: Action[]; runs: Partial<Record<DemoId, Run>> };

const key = (vertical: string) => `pdp.session.${vertical}`;

// Session storage: state survives an accidental refresh and is gone when the tab closes.
function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function loadSession(vertical: string, version: string): Saved | null {
  try {
    const raw = storage()?.getItem(key(vertical));
    if (!raw) return null;
    const saved = JSON.parse(raw) as Saved;
    // Actions recorded against older content may not replay cleanly, so a new pack version starts clean.
    return saved.version === version && Array.isArray(saved.changes) ? saved : null;
  } catch {
    return null;
  }
}

export function saveSession(vertical: string, saved: Saved): void {
  try {
    storage()?.setItem(key(vertical), JSON.stringify(saved));
  } catch {
    // Storage full or blocked: the demo still works, it just will not survive a refresh.
  }
}

export function clearSession(vertical: string): void {
  try {
    storage()?.removeItem(key(vertical));
  } catch {
    // Nothing to clear.
  }
}

export function hasSavedChanges(vertical: string): boolean {
  try {
    const raw = storage()?.getItem(key(vertical));
    return raw ? (JSON.parse(raw) as Saved).changes.length > 0 : false;
  } catch {
    return false;
  }
}
