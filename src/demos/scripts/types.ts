import type { Action, World } from "@/store/world";
import type { DemoId } from "@/verticals/catalog";
import type { Pack } from "@/verticals/types";

/**
 * One storyboard per demo, written once and shared by every vertical. A vertical's pack supplies
 * the records and rules the steps point at.
 *
 * `done` works out progress from the world, so clicking the real button and pressing Next in the
 * demo bar are the same thing: Next just runs `script`, which performs the step with default choices.
 */
export type StepCtx = { w: World; pack: Pack };

export type Step = {
  id: string;
  title: string;
  /** What the rep clicks, shown in the demo bar. */
  hint: string | ((c: StepCtx) => string);
  /** Full-path-only steps: the short path skips them. */
  optional?: boolean;
  /** Optional predicate to include this step only for packs that configure it. */
  when?: (pack: Pack) => boolean;
  /** The shell path where this step happens. */
  path: (c: StepCtx) => string;
  /** The screen that shows the step's result, when it is not simply where the next step starts. */
  after?: (c: StepCtx) => string;
  done: (c: StepCtx) => boolean;
  script: (c: StepCtx, now: number) => Action[];
};

export type DemoScript = { id: DemoId; steps: Step[] };

export const flag = (k: string): Action => ({ t: "flag", k });
export const has = (c: StepCtx, k: string) => c.w.flags[k] === true;

/** Index of the step the rep is on: one past the furthest finished step. Equals steps.length when complete. */
export function currentStep(script: DemoScript, ctx: StepCtx): number {
  for (let i = script.steps.length - 1; i >= 0; i--) {
    if (script.steps[i].done(ctx)) return i + 1;
  }
  return 0;
}

/** Steps a rep must finish for the demo to count as complete. Trailing optional steps do not hold it open. */
export function requiredSteps(script: DemoScript): number {
  for (let i = script.steps.length - 1; i >= 0; i--) {
    if (!script.steps[i].optional) return i + 1;
  }
  return script.steps.length;
}

export function hintOf(step: Step, ctx: StepCtx): string {
  return typeof step.hint === "function" ? step.hint(ctx) : step.hint;
}

/** What the demo bar shows for a step: the shared storyboard's wording, unless the vertical's pack words the step its own way. */
export function stepText(demo: DemoId, step: Step, ctx: StepCtx): { title: string; hint: string } {
  const note = ctx.pack.stepNotes?.[demo]?.[step.id];
  return { title: note?.title ?? step.title, hint: note?.hint ?? hintOf(step, ctx) };
}
