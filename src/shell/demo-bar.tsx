"use client";

import { useEffect } from "react";
import { PenguinMark } from "@/components/brand";
import { stepText } from "@/demos/scripts";
import { useShell } from "@/store/store";
import { demoTile, getVertical } from "@/verticals/catalog";
import { Icon } from "./icons";
import { cx, Menu, MenuItem } from "./ui";

const barButton = "inline-flex h-8 items-center gap-1.5 rounded-[6px] px-2.5 text-[12.5px] font-semibold text-white/90 hover:bg-white/10 disabled:text-white/35 disabled:hover:bg-transparent";

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
    <div className="relative z-[60] flex h-12 shrink-0 items-center gap-1 bg-[#1c1340] px-3 text-white" style={{ fontFamily: "var(--font-penguin)" }} data-testid="demo-bar">
      <span className="mr-1 inline-flex items-center gap-2 text-[12px] text-white/70">
        <PenguinMark size={16} className="text-white" />
        {pack.vertical.name}
      </span>

      <Menu
        up
        width={300}
        button={({ toggle }) => (
          <button type="button" onClick={toggle} className={cx(barButton, "bg-white/10")} data-testid="demo-switcher">
            {demoTile(vertical, demo).title} <Icon name="chevronDown" size={14} />
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

      <div className="mx-2 flex min-w-0 flex-1 items-center gap-3" data-testid="demo-step">
        <span className="shrink-0 rounded-full bg-white/15 px-2.5 py-1 text-[11.5px] font-semibold" data-testid="demo-step-count">
          {step ? `Step ${stepIndex + 1} of ${total}` : "Complete"}
        </span>
        <p className="min-w-0 truncate text-[13px]">
          {step && text ? (
            <>
              <span className="font-semibold">{text.title}</span>
              {step.optional ? <span className="text-white/60"> (optional)</span> : null}
              <span className="text-white/65"> · {text.hint}</span>
            </>
          ) : (
            <span className="font-semibold">That is the whole story. Wrap up to see what was native and what Penguin built.</span>
          )}
        </p>
      </div>

      <button type="button" className={barButton} onClick={back} disabled={stepIndex === 0} title="Back one step (Left arrow)" data-testid="demo-back">
        <Icon name="arrowLeft" size={14} /> Back
      </button>
      {step ? (
        <button type="button" className={cx(barButton, "bg-white !text-[#1c1340] hover:!bg-white/90")} onClick={next} title="Do this step for me (Right arrow)" data-testid="demo-next">
          Next <Icon name="arrowRight" size={14} />
        </button>
      ) : null}
      {complete ? (
        <button type="button" className={cx(barButton, "bg-hs-orange !text-white hover:!bg-hs-orange-strong")} onClick={() => setEndCardOpen(true)} data-testid="demo-wrap-up">
          Wrap up
        </button>
      ) : null}

      <span className="mx-1 h-5 w-px bg-white/20" aria-hidden="true" />

      <Menu
        up
        align="right"
        width={250}
        button={({ toggle }) => (
          <button type="button" onClick={toggle} className={barButton} title="See the portal as another person" data-testid="view-as">
            <Icon name="eye" size={14} /> View as: {persona.viewAs}
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
      <button type="button" className={cx(barButton, highlight && "bg-penguin !text-white")} onClick={toggleHighlight} aria-pressed={highlight} title="Light up everything Penguin built on this screen (H)" data-testid="demo-highlight">
        <Icon name="highlight" size={14} /> Extensions
      </button>
      <button type="button" className={barButton} onClick={reset} title="Reset the demo to its starting state (R)" data-testid="demo-reset">
        <Icon name="reset" size={14} /> Reset
      </button>
      <button type="button" className={barButton} onClick={toggleBar} title="Hide this bar (B)" aria-label="Hide the demo bar" data-testid="demo-bar-hide">
        <Icon name="chevronDown" size={14} />
      </button>
    </div>
  );
}
