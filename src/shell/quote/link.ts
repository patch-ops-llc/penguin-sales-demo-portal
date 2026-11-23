import type { Quote } from "@/verticals/types";

/** The public link of a published quote, in the shape HubSpot gives it. */
export function quoteLink(hubId: string, quote: Pick<Quote, "id" | "number">): string {
  let hash = 0;
  for (const ch of `${hubId}${quote.id}`) hash = (hash * 33 + ch.charCodeAt(0)) >>> 0;
  return `${hubId}.hs-sites.com/${hash.toString(36)}${quote.number.replace(/\W/g, "").toLowerCase()}`;
}
