"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PenguinMark } from "@/components/brand";
import { useShell } from "@/store/store";
import type { Extension } from "@/verticals/types";
import { cx } from "./ui";

/** Finds an element in the pack's native-versus-Penguin list: the demo on screen first, then any demo. */
export function useExtension(id: string): Extension | undefined {
  const { pack, demo } = useShell();
  const own = pack.extensions[demo]?.find((e) => e.id === id);
  if (own) return own;
  for (const list of Object.values(pack.extensions)) {
    const found = list.find((e) => e.id === id);
    if (found) return found;
  }
  return undefined;
}

type Position = { left: number; top: number; side: "top" | "bottom"; arrow: number };
const CALLOUT_WIDTH = 296;

/**
 * Marks a part of the screen that Penguin would build. Whether it shows is decided by the pack
 * (`by: "penguin"` or `"native"` in the vertical's extensions file), never by the screen.
 *
 * A Penguin element gets a small pin. Pointing at the pin or the element shows a ring and a
 * callout with one line on what Penguin built. Native elements render with no marker at all.
 */
export function Ext({ id, children, className, pinClass }: { id: string; children: React.ReactNode; className?: string; pinClass?: string }) {
  const extension = useExtension(id);
  const { highlight } = useShell();
  const [hover, setHover] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const pinRef = useRef<HTMLButtonElement>(null);
  const penguin = extension?.by === "penguin";
  const open = penguin && (hover || highlight);

  const place = useCallback(() => {
    const pin = pinRef.current;
    if (!pin) return;
    const rect = pin.getBoundingClientRect();
    const left = Math.max(8, Math.min(window.innerWidth - CALLOUT_WIDTH - 8, rect.right - CALLOUT_WIDTH + 12));
    const side: Position["side"] = rect.top > 150 ? "top" : "bottom";
    setPosition({ left, top: side === "top" ? rect.top - 10 : rect.bottom + 10, side, arrow: Math.max(12, left + CALLOUT_WIDTH - rect.right + rect.width / 2 - 5) });
  }, []);

  useEffect(() => {
    if (!open) return;
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, place]);

  if (!penguin || !extension) return <div className={className}>{children}</div>;

  return (
    <div className={cx("px", className)} data-open={open} data-ext={id} data-testid={`ext-${id}`}>
      {children}
      <span className="px-ring" aria-hidden="true" />
      <button
        ref={pinRef}
        type="button"
        className={cx("px-pin", pinClass)}
        aria-label={`Penguin extension: ${extension.name}`}
        data-testid={`ext-pin-${id}`}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
      >
        <PenguinMark size={12} />
      </button>
      {open && position
        ? createPortal(
            <div
              role="tooltip"
              className="px-callout"
              data-side={position.side}
              data-testid={`ext-callout-${id}`}
              style={{ left: position.left, top: position.top, transform: position.side === "top" ? "translateY(-100%)" : undefined, ["--px-arrow" as string]: `${position.arrow}px` }}
            >
              <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#c9bdf5]">
                <PenguinMark size={11} /> Penguin extension
              </p>
              <p className="mt-1 text-[13.5px] font-semibold leading-snug">{extension.name}</p>
              {extension.note ? <p className="mt-1 text-[12.5px] leading-snug text-[#ddd6f7]">{extension.note}</p> : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
