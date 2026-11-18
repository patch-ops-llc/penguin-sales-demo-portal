/* eslint-disable @next/next/no-img-element */
import { HUBSPOT_SPROCKET_PATH, HUBSPOT_SPROCKET_VIEWBOX, PENGUIN_MARK_PATHS, PENGUIN_MARK_VIEWBOX } from "./brand-paths";

export function HubSpotSprocket({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox={HUBSPOT_SPROCKET_VIEWBOX} width={size} height={size} className={className} role="img" aria-label="HubSpot">
      <path fill="#ff4800" d={HUBSPOT_SPROCKET_PATH} />
    </svg>
  );
}

export function HubSpotLogo({ height = 28, cream = false }: { height?: number; cream?: boolean }) {
  return <img src={cream ? "/brand/hubspot-logo-cream.svg" : "/brand/hubspot-logo.svg"} alt="HubSpot" style={{ height, width: "auto" }} />;
}

export function PenguinLogo({ height = 28, invert = false }: { height?: number; invert?: boolean }) {
  return (
    <img
      src="/penguin-logo.svg"
      alt="Penguin Strategies"
      style={{ height, width: "auto", filter: invert ? "invert(1)" : undefined }}
    />
  );
}

export function PenguinMark({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox={PENGUIN_MARK_VIEWBOX} height={size} width={(size * 30) / 41} className={className} fill="currentColor" aria-hidden="true">
      {PENGUIN_MARK_PATHS.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

/** HubSpot-led lockup for the login page and launchpad. */
export function Lockup({ height = 30 }: { height?: number }) {
  return (
    <div className="flex items-center gap-4">
      <HubSpotLogo height={height} />
      <span className="h-7 w-px bg-line" aria-hidden="true" />
      <span className="flex items-center gap-2 text-[13px] text-ink-muted">
        with <PenguinLogo height={height * 0.9} />
      </span>
    </div>
  );
}
