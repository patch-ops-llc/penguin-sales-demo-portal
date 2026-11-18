"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { currentStep, requiredSteps, SCRIPTS, type DemoScript } from "@/demos/scripts";
import { newRunId, track } from "@/lib/beacon";
import { DEMOS, getVertical, isDemoId, type DemoId } from "@/verticals/catalog";
import type { Pack, Persona } from "@/verticals/types";
import { parseLocation, pushUrl, useLocation, type ShellRoute } from "./router";
import { saveSession, type Run, type Saved } from "./session";
import { replay, seedWorld, type Action, type World } from "./world";

type State = { changes: Action[]; runs: Partial<Record<DemoId, Run>> };

export type Shell = {
  pack: Pack;
  world: World;
  vertical: string;
  demo: DemoId;
  script: DemoScript;
  /** Index of the current step. Equals script.steps.length when the demo is complete. */
  stepIndex: number;
  complete: boolean;
  route: ShellRoute;
  persona: Persona;
  dispatch: (action: Action | Action[]) => void;
  navigate: (path: string, options?: { replace?: boolean }) => void;
  href: (path: string) => string;
  next: () => void;
  back: () => void;
  reset: () => void;
  switchDemo: (demo: DemoId) => void;
  /** Moves to another live vertical's portal, keeping this one's session for the way back. */
  switchVertical: (vertical: string) => void;
  viewAs: (personaId: string) => void;
  highlight: boolean;
  toggleHighlight: () => void;
  barHidden: boolean;
  toggleBar: () => void;
  endCardOpen: boolean;
  setEndCardOpen: (open: boolean) => void;
};

const ShellContext = createContext<Shell | null>(null);

export function useShell(): Shell {
  const shell = useContext(ShellContext);
  if (!shell) throw new Error("useShell must be used inside the shell");
  return shell;
}

function freshRun(base: number): Run {
  return { runId: newRunId(), marks: [base], furthest: 0, completed: false };
}

export function ShellProvider({
  pack,
  version,
  initial,
  initialLocation,
  children,
}: {
  pack: Pack;
  version: string;
  initial: Saved | null;
  initialLocation: string;
  children: React.ReactNode;
}) {
  const verticalId = pack.vertical.id;
  const location = useLocation(initialLocation);
  const route = useMemo(() => parseLocation(location), [location]);
  const fallbackDemo = getVertical(verticalId)?.demos[0] ?? "guided-quote";
  const demo: DemoId = route.demo && isDemoId(route.demo) && getVertical(verticalId)?.demos.includes(route.demo) ? route.demo : fallbackDemo;
  const script = SCRIPTS[demo];

  const seed = useMemo(() => seedWorld(pack), [pack]);
  const [state, setState] = useState<State>(() => ({ changes: initial?.changes ?? [], runs: initial?.runs ?? {} }));
  const [highlight, setHighlight] = useState(false);
  const [barHidden, setBarHidden] = useState(false);
  const [endCardOpen, setEndCardOpen] = useState(false);

  const world = useMemo(() => replay(seed, state.changes, pack), [seed, state.changes, pack]);
  const stepIndex = useMemo(() => currentStep(script, { w: world, pack }), [script, world, pack]);
  const total = script.steps.length;
  const required = requiredSteps(script);
  const persona = pack.personas.find((p) => p.id === world.persona) ?? pack.personas[0];

  // Handlers read the latest values through a ref so they never act on a stale world.
  const live = useRef({ state, world, stepIndex, demo, script });
  useEffect(() => {
    live.current = { state, world, stepIndex, demo, script };
  });

  const href = useCallback((path: string) => `/demo/${verticalId}/${demo}${path}`, [verticalId, demo]);
  const navigate = useCallback((path: string, options?: { replace?: boolean }) => pushUrl(`/demo/${verticalId}/${live.current.demo}${path}`, options?.replace), [verticalId]);

  const dispatch = useCallback((action: Action | Action[]) => {
    const actions = Array.isArray(action) ? action : [action];
    if (actions.length === 0) return;
    setState((s) => ({ ...s, changes: [...s.changes, ...actions] }));
  }, []);

  useEffect(() => {
    saveSession(verticalId, { version, changes: state.changes, runs: state.runs });
  }, [verticalId, version, state]);

  // Entering a demo (first load, or a switch) starts a run and lands on the current step's screen.
  const run = state.runs[demo];
  useEffect(() => {
    if (run) return;
    const created = freshRun(live.current.state.changes.length);
    track({ type: "demo_started", vertical: verticalId, demo, runId: created.runId, step: 0, totalSteps: total });
    setState((s) => (s.runs[demo] ? s : { ...s, runs: { ...s.runs, [demo]: created } }));
  }, [run, demo, verticalId, total]);

  useEffect(() => {
    const canonical = route.demo === demo;
    if (canonical && route.path) return;
    const ctx = { w: live.current.world, pack };
    const index = Math.min(live.current.stepIndex, total - 1);
    const target = live.current.stepIndex >= total ? (script.steps[total - 1].after?.(ctx) ?? script.steps[total - 1].path(ctx)) : script.steps[index].path(ctx);
    pushUrl(`/demo/${verticalId}/${demo}${route.path || target}`, true);
  }, [route.demo, route.path, demo, script, total, pack, verticalId]);

  // Progress: remember where each step began (for Back) and log the furthest step reached.
  useEffect(() => {
    if (!run) return;
    const reached = run.marks.length - 1;
    if (stepIndex <= reached && (stepIndex < required || run.completed)) return;
    const marks = [...run.marks];
    for (let i = reached + 1; i <= stepIndex; i++) marks[i] = state.changes.length;
    const completed = stepIndex >= required;
    if (stepIndex > run.furthest) {
      const title = stepIndex > 0 ? script.steps[stepIndex - 1].title : undefined;
      track({ type: "step_reached", vertical: verticalId, demo, runId: run.runId, step: stepIndex, totalSteps: total, title });
    }
    if (completed && !run.completed) track({ type: "demo_completed", vertical: verticalId, demo, runId: run.runId, step: total, totalSteps: total });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((s) => ({ ...s, runs: { ...s.runs, [demo]: { ...run, marks, furthest: Math.max(run.furthest, stepIndex), completed: run.completed || completed } } }));
  }, [run, stepIndex, total, required, state.changes.length, demo, script, verticalId]);

  const next = useCallback(() => {
    const { state: s, world: w, stepIndex: index, script: sc } = live.current;
    if (index >= sc.steps.length) {
      setEndCardOpen(true);
      return;
    }
    const step = sc.steps[index];
    const changes = [...s.changes, ...step.script({ w, pack }, Date.now())];
    const after = { w: replay(seed, changes, pack), pack };
    setState((prev) => ({ ...prev, changes }));
    navigate(step.after?.(after) ?? sc.steps[index + 1]?.path(after) ?? step.path(after));
  }, [pack, seed, navigate]);

  const back = useCallback(() => {
    const { state: s, stepIndex: index, script: sc, demo: d } = live.current;
    const current = s.runs[d];
    if (!current || index === 0) return;
    setEndCardOpen(false);
    const target = Math.min(index, current.marks.length - 1) - 1;
    if (target < 0) return;
    const length = current.marks[target];
    const changes = s.changes.slice(0, length);
    const before = { w: replay(seed, changes, pack), pack };
    // Other demos' marks may point past the shortened list.
    const runs = Object.fromEntries(Object.entries(s.runs).map(([id, r]) => [id, { ...r!, marks: r!.marks.map((m) => Math.min(m, length)) }])) as State["runs"];
    runs[d] = { ...current, marks: current.marks.slice(0, target + 1), completed: false };
    setState({ changes, runs });
    navigate((target > 0 ? sc.steps[target - 1].after?.(before) : undefined) ?? sc.steps[target].path(before));
  }, [pack, seed, navigate]);

  const reset = useCallback(() => {
    const { state: s, script: sc, demo: d } = live.current;
    const old = s.runs[d];
    if (old) track({ type: "demo_reset", vertical: verticalId, demo: d, runId: old.runId, step: old.furthest, totalSteps: sc.steps.length });
    setEndCardOpen(false);
    // Dropping every run makes the active demo start a new one through the effect above.
    setState({ changes: [], runs: {} });
    navigate(sc.steps[0].path({ w: seed, pack }));
  }, [pack, seed, navigate, verticalId]);

  const switchDemo = useCallback(
    (target: DemoId) => {
      if (target === live.current.demo) return;
      setEndCardOpen(false);
      track({ type: "demo_switched", vertical: verticalId, demo: target });
      pushUrl(`/demo/${verticalId}/${target}`);
    },
    [verticalId],
  );

  const switchVertical = useCallback(
    (target: string) => {
      if (target === verticalId) return;
      track({ type: "vertical_opened", vertical: target });
      pushUrl(`/demo/${target}`);
    },
    [verticalId],
  );

  const viewAs = useCallback((personaId: string) => dispatch({ t: "persona", id: personaId }), [dispatch]);

  const toggleHighlight = useCallback(() => {
    setHighlight((on) => {
      if (!on) track({ type: "highlight_used", vertical: verticalId, demo: live.current.demo });
      return !on;
    });
  }, [verticalId]);
  const toggleBar = useCallback(() => setBarHidden((hidden) => !hidden), []);

  const shell: Shell = {
    pack,
    world,
    vertical: verticalId,
    demo,
    script,
    stepIndex,
    complete: stepIndex >= required,
    route,
    persona,
    dispatch,
    navigate,
    href,
    next,
    back,
    reset,
    switchDemo,
    switchVertical,
    viewAs,
    highlight,
    toggleHighlight,
    barHidden,
    toggleBar,
    endCardOpen,
    setEndCardOpen,
  };

  return <ShellContext.Provider value={shell}>{children}</ShellContext.Provider>;
}

/** Marks a "the rep has seen this" step when its screen is on display. */
export function useSeen(flag: string, when: boolean): void {
  const { world, dispatch } = useShell();
  const seen = world.flags[flag] === true;
  useEffect(() => {
    if (when && !seen) dispatch({ t: "flag", k: flag });
  }, [when, seen, flag, dispatch]);
}

export const demoTitle = (id: DemoId) => DEMOS[id].title;
