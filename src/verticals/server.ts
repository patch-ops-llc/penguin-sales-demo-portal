import "server-only";
import { createHash } from "node:crypto";
import { LIVE_VERTICALS } from "./catalog";
import { manufacturingPack } from "./manufacturing/pack";
import { saasPack } from "./saas/pack";
import type { Pack } from "./types";

// Packs are bundled with the server only. The browser gets them from /api/packs/<version>/<vertical>
// after sign-in, cached under a version that is the hash of the content, so a new deploy with
// changed content is picked up automatically and an unchanged pack is never downloaded twice.

const PACKS: Record<string, Pack> = { manufacturing: manufacturingPack, saas: saasPack };

const cache = new Map<string, { json: string; version: string }>();

function load(vertical: string): { json: string; version: string } | null {
  const pack = PACKS[vertical];
  if (!pack) return null;
  let entry = cache.get(vertical);
  if (!entry) {
    const json = JSON.stringify(pack);
    entry = { json, version: createHash("sha256").update(json).digest("hex").slice(0, 16) };
    cache.set(vertical, entry);
  }
  return entry;
}

export function packVersion(vertical: string): string | null {
  return load(vertical)?.version ?? null;
}

export function packJson(vertical: string): { json: string; version: string } | null {
  return load(vertical);
}

/** Pack version of every live vertical, so the browser can warm and switch between them without asking again. */
export function livePackVersions(): Record<string, string> {
  const versions: Record<string, string> = {};
  for (const id of LIVE_VERTICALS) {
    const version = packVersion(id);
    if (version) versions[id] = version;
  }
  return versions;
}
