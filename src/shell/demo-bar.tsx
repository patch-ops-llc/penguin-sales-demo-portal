"use client";

import { useEffect } from "react";
import { PenguinMark } from "@/components/brand";
import { stepText } from "@/demos/scripts";
import { useShell } from "@/store/store";
import { demoTile, getVertical } from "@/verticals/catalog";
import { Icon } from "./icons";
import { cx, Menu, MenuItem } from "./ui";

const barButton = "inline-flex h-10 shrink-0 items-center gap-2 rounded-[8px] px-3 text-[14px] font-semibold text-white/90 hover:bg-white/10 disabled:text-white/35 disabled:hover:bg-transparent";
/** Labels the secondary controls drop at laptop widths, so the step instruction keeps its room. Each keeps its icon and tooltip. */
const wideOnly = "hidden min-[1340px]:inline";
/**
 * How the bar gives way when it is short of room. Flex shares a shortfall in proportion to these numbers,
 * so the vertical name absorbs it first, then the two menu labels; the step title (shrink 1) is effectively untouched until they have nothing left.
 */
const yieldFirst = "shrink-[1000000000]";
const yieldNext = "shrink-[1000000]";
const stepTitle = "line-clamp-2 text-[15px] font-semibold";
const stepHint = "mt-0.5 block w-0 min-w-full truncate text-[13px] text-white/75";

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return Boolean(el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable));
}

/** The rep's control strip. It belongs to the portal, not to the simulated HubSpot, so it carries the Penguin mark. */
export function DemoBar() {
  const shell = useShell();
  const { pack, world, demo, vertical, script, stepIndex, complete, persona, next, back, reset, switchDemo, viewAs, highlight, toggleHighlight, barHidden, toggleBar, setEndCardOpen } = shell;
  const total = script.steps.length;
  const step = stepIndex < total ? script.steps[stepIndex] : null;
  const text = step ? stepText(demo, step, { w: world, pack }) : null;
  const demos = getVertical(vertical)?.demos ?? [];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") back();
      else if (e.key === "r" || e.key === "R") reset();
      else if (e.key === "h" || e.key === "H") toggleHighlight();
      else if (e.key === "b" || e.key === "B") toggleBar();
      else return;
      e.preventDefault();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [next, back, reset, toggleHighlight, toggleBar]);

  if (barHidden) {
    return (
      <button type="button" onClick={toggleBar} title="Show the demo bar (B)" data-testid="demo-bar-show" className="fixed bottom-2 right-2 z-[60] inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#1c1340] text-white opacity-40 shadow hover:opacity-100">
        <PenguinMark size={12} />
      </button>
    );
  }

  return (
    <div
      className="relative z-[60] flex h-[60px] shrink-0 items-center gap-1.5 border-t-2 border-[#6f55e8] bg-[#1c1340] px-4 text-white shadow-[0_-6px_18px_rgba(28,19,64,0.22)]"
      style={{ fontFamily: "var(--font-penguin)" }}
      data-testid="demo-bar"
    >
      {/*
        Room goes to the bold step title first. The title's column never gives way while anything else can:
        the vertical name shortens first, then the demo switcher and View as labels, and only then does the title wrap to a second line.
      */}
      <span className={cx("mr-1.5 flex min-w-5 items-center gap-2 text-[13px] text-white/75", yieldFirst)}>
        <PenguinMark size={20} className="shrink-0 text-white" />
        <span className="hidden min-w-0 truncate min-[1600px]:block">{pack.vertical.name}</span>
      </span>

      <Menu
        up
        width={300}
        className={cx("flex min-w-[120px]", yieldNext)}
        button={({ toggle }) => (
          <button type="button" onClick={toggle} title="Switch demo" className={cx(barButton, "min-w-0 !shrink border border-white/30 bg-white/[0.14] !text-white hover:!bg-white/20")} data-testid="demo-switcher">
            <span className="max-w-[210px] min-w-0 truncate">{demoTile(vertical, demo).title}</span> <Icon name="chevronDown" size={16} className="shrink-0" />
          </button>
        )}
      >
        {(close) =>
          demos.map((id, i) => (
            <MenuItem
              key={id}
              active={id === demo}
              testId={`switch-${id}`}
              onClick={() => {
                close();
                switchDemo(id);
              }}
            >
              <span className="text-ink-muted">{i + 1}.</span> {demoTile(vertical, id).title}
            </MenuItem>
          ))
        }
      </Menu>

      <div className="mx-2.5 flex min-w-0 flex-[1_1_auto] items-center gap-3" data-testid="demo-step">
        <span className="shrink-0 rounded-full bg-[#6f55e8] px-3 py-1.5 text-[13px] font-semibold leading-none" data-testid="demo-step-count">
          {step ? `Step ${stepIndex + 1} of ${total}` : "Complete"}
        </span>
        {/*
          Two lines: what the step is, then what to click. The title sets this column's width and is always shown in full.
          The hint takes whatever width is left (it asks for none of its own) and shortens with an ellipsis; the tooltip has the full text.
        */}
        <p className="min-w-0 flex-[1_1_auto] leading-tight" title={step && text ? `${text.title}. ${text.hint}` : undefined}>
          {step && text ? (
            <>
              <span className={stepTitle} data-testid="demo-step-title">
                {text.title}
                {step.optional ? <span className="font-normal text-white/65"> (optional)</span> : null}
              </span>
              <span className={stepHint}>{text.hint}</span>
            </>
          ) : (
            <>
              <span className={stepTitle} data-testid="demo-step-title">
                That is the whole story.
              </span>
              <span className={stepHint}>Wrap up: what was native, what Penguin built.</span>
            </>
          )}
        </p>
      </div>

      <button type="button" className={barButton} onClick={back} disabled={stepIndex === 0} title="Back one step (Left arrow)" data-testid="demo-back">
        <Icon name="arrowLeft" size={16} /> Back
      </button>
      {step ? (
        <button
          type="button"
          className={cx(barButton, "bg-white px-5 text-[15px] font-bold !text-[#1c1340] shadow-[0_0_0_3px_rgba(255,255,255,0.2)] hover:!bg-white/90")}
          onClick={next}
          title="Do this step for me (Right arrow)"
          data-testid="demo-next"
        >
          Next <Icon name="arrowRight" size={17} strokeWidth={2.2} />
        </button>
      ) : null}
      {complete ? (
        <button type="button" className={cx(barButton, "bg-hs-orange px-5 text-[15px] font-bold !text-white hover:!bg-hs-orange-strong")} onClick={() => setEndCardOpen(true)} data-testid="demo-wrap-up">
          Wrap up
        </button>
      ) : null}

      <span className="mx-1.5 h-7 w-px bg-white/20" aria-hidden="true" />

      <Menu
        up
        align="right"
        width={250}
        className={cx("flex min-w-[76px]", yieldNext)}
        button={({ toggle }) => (
          <button type="button" onClick={toggle} className={cx(barButton, "min-w-0 !shrink")} title="See the portal as another person" data-testid="view-as">
            <Icon name="eye" size={16} className="shrink-0" />
            <span className="max-w-[230px] min-w-0 truncate">
              <span className={wideOnly}>View as: </span>
              {persona.viewAs}
            </span>
          </button>
        )}
      >
        {(close) =>
          pack.personas.map((p) => (
            <MenuItem
              key={p.id}
              active={p.id === persona.id}
              testId={`view-as-${p.id}`}
              onClick={() => {
                close();
                viewAs(p.id);
              }}
            >
              <span className="block">{p.viewAs}</span>
              <span className="block text-[12px] font-normal text-ink-muted">
                {p.name}, {p.title}
              </span>
            </MenuItem>
          ))
        }
      </Menu>
      <button type="button" className={cx(barButton, highlight && "bg-penguin !text-white")} onClick={toggleHighlight} aria-pressed={highlight} title="Light up everything Penguin built on this screen (H)" aria-label="Highlight Penguin extensions" data-testid="demo-highlight">
        <Icon name="highlight" size={16} /> <span className={wideOnly}>Extensions</span>
      </button>
      <button type="button" className={barButton} onClick={reset} title="Reset the demo to its starting state (R)" aria-label="Reset the demo" data-testid="demo-reset">
        <Icon name="reset" size={16} /> <span className={wideOnly}>Reset</span>
      </button>
      <button type="button" className={cx(barButton, "!px-2.5 text-white/60")} onClick={toggleBar} title="Hide this bar (B)" aria-label="Hide the demo bar" data-testid="demo-bar-hide">
        <Icon name="chevronDown" size={16} />
      </button>
    </div>
  );
}
