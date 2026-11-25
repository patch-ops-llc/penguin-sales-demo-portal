"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PenguinMark } from "@/components/brand";
import { getAgentDemo, sampleIndex } from "@/demos/agent/catalog";
import { answerScripted, scriptedTurn } from "@/demos/agent/scripted";
import { confirmTools } from "@/demos/agent/tools";
import { track } from "@/lib/beacon";
import type { AgentMessage, AgentProviderId, ToolCall } from "@/lib/agent/types";
import { pendingConfirmation } from "@/store/slices/agent";
import { useShell } from "@/store/store";
import { fetchAgentStatus, streamTurn, TurnRefused, type AgentStatus } from "../agent/client";
import { Ext } from "../ext";
import { Icon } from "../icons";
import { A, cx } from "../ui";
import { ChangePreview, describeCall, focusPathFor, WRITE_TOOLS } from "./calls";
import type { FlowConfig, FlowDemoId } from "./types";

const PROVIDER_ORDER: AgentProviderId[] = ["anthropic", "openai", "xai", "mock"];
const FLOW_IDS = new Set<string>(["agent-campaign", "agent-deal-follow-up", "agent-renewal"]);

type Draft = { text: string; calls: ToolCall[]; done: Record<string, "ok" | "error"> };
const EMPTY_DRAFT: Draft = { text: "", calls: [], done: {} };

function ClaudeMark({ size = 22 }: { size?: number }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#d97757] text-white" style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 24 24" width={size * 0.6} height={size * 0.6} fill="currentColor">
        <path d="M12 2.5 13.9 9l6.1-2.4-4.4 5 4.4 5-6.1-2.4L12 21.5 10.1 14.2 4 16.6l4.4-5L4 6.6 10.1 9 12 2.5Z" />
      </svg>
    </span>
  );
}

function ToolChip({ call, state, result, path }: { call: ToolCall; state: "ok" | "error" | "pending" | "waiting"; result?: unknown; path?: string | null }) {
  const error = state === "error" ? String((result as { error?: string } | undefined)?.error ?? "failed") : null;
  const declined = Boolean((result as { declined?: unknown } | undefined)?.declined);
  const write = WRITE_TOOLS.has(call.name);
  return (
    <li
      className={cx(
        "flex items-start gap-2 rounded-[8px] border px-2.5 py-1.5 text-[12.5px] leading-snug",
        state === "error" ? "border-[#f2b8b5] bg-[#fdf1f0] text-[#8a1f1a]" : declined ? "border-line bg-white text-ink-muted" : state === "waiting" ? "border-[#e9c46a] bg-[#fff8e6] text-[#7a5a00]" : "border-[#e4ddd0] bg-white text-ink",
      )}
      data-testid={`claude-tool-${call.name}`}
      data-state={declined ? "declined" : state}
      title={error ?? call.name}
    >
      {state === "pending" ? (
        <span className="mt-[4px] inline-block h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-[#d97757]" aria-hidden="true" />
      ) : (
        <Icon name={state === "error" ? "warning" : state === "waiting" ? "lock" : write && !declined ? "check" : "search"} size={13} className={cx("mt-0.5 shrink-0", state === "ok" && !declined && "text-[#0b5b45]")} />
      )}
      <span className="min-w-0 flex-1">
        <span className="font-semibold">{write && !declined && state === "ok" ? "HubSpot: " : write ? "HubSpot write: " : "HubSpot: "}</span>
        {describeCall(call, result)}
        <span className="ml-1.5 font-mono text-[10.5px] opacity-60">{call.name}</span>
        {error ? <span className="block text-[12px]">{error}</span> : null}
      </span>
      {path && write && state === "ok" && !declined ? (
        <A to={path} className="shrink-0 text-[12px] font-semibold text-penguin-strong hover:underline" data-testid={`claude-open-${call.name}`}>
          Open in HubSpot →
        </A>
      ) : null}
    </li>
  );
}

/**
 * The whole stage is a Claude conversation. The person asks, Claude reads and proposes through
 * HubSpot tools, and every write shows its change and waits for approval. The HubSpot screens are
 * only visited afterwards, to show the record that changed. With no live provider the same
 * surface plays the scripted transcript through the same tool bridge.
 */
export function ClaudeStage() {
  const { pack, world, changes, vertical, demo: demoId, dispatch } = useShell();
  const flowId = (FLOW_IDS.has(demoId) ? demoId : "agent-campaign") as FlowDemoId;
  const demo = getAgentDemo(flowId);
  const flow: FlowConfig | undefined = pack.demos.flows?.flows[flowId];
  const [status, setStatus] = useState<AgentStatus | null | "loading">("loading");
  const [picked, setPicked] = useState<AgentProviderId | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [usage, setUsage] = useState({ tokens: 0, costUsd: 0 });
  const [notice, setNotice] = useState<string | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);
  const latest = useRef({ world, changes });
  useEffect(() => {
    latest.current = { world, changes };
  });

  useEffect(() => {
    let cancelled = false;
    fetchAgentStatus().then((s) => {
      if (!cancelled) setStatus(s);
    });
    return () => {
      cancelled = true;
      abort.current?.abort();
    };
  }, []);

  const available = useMemo(() => {
    const ids = status && status !== "loading" ? status.providers.map((p) => p.id) : [];
    return PROVIDER_ORDER.filter((id) => ids.includes(id));
  }, [status]);
  const preferred = demo?.defaultProvider && available.includes(demo.defaultProvider) ? demo.defaultProvider : (available[0] ?? null);
  const provider: AgentProviderId | null = world.ag.provider && available.includes(world.ag.provider) ? world.ag.provider : picked && available.includes(picked) ? picked : preferred;
  const providerInfo = status && status !== "loading" ? status.providers.find((p) => p.id === provider) : undefined;
  const scripted = status !== "loading" && (provider === null || world.ag.fallback !== null);
  const gated = useMemo(() => confirmTools(), []);
  const pending = pendingConfirmation(world, gated);
  const messages = world.ag.messages;
  const sample = useMemo(() => (demo ? demo.sample(pack) : []), [demo, pack]);
  const nextPrompt = pending.length === 0 ? (sample[sampleIndex(sample, messages)]?.user ?? null) : null;
  const results = useMemo(() => {
    const map = new Map<string, unknown>();
    for (const m of messages) if (m.role === "tool") for (const r of m.results) map.set(r.id, r.result);
    return map;
  }, [messages]);
  const writes = useMemo(() => messages.reduce((n, m) => (m.role === "tool" ? n + m.results.filter((r) => WRITE_TOOLS.has(r.name) && !(r.result as { error?: unknown } | null)?.error && !(r.result as { declined?: unknown } | null)?.declined).length : n), 0), [messages]);

  useEffect(() => {
    const el = list.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, draft, busy, pending.length]);

  const playScripted = useCallback(
    (approve: boolean | null) => {
      const { world: w } = latest.current;
      const now = Date.now();
      const actions = approve === null ? scriptedTurn({ w, pack }, now, flowId) : answerScripted({ w, pack }, approve, now, flowId);
      if (actions.length > 0) dispatch(actions);
    },
    [pack, dispatch, flowId],
  );

  const fallBack = useCallback(
    (reason: string) => {
      setNotice(reason);
      if (latest.current.world.ag.fallback === null) {
        dispatch({ t: "agent.fallback", reason });
        track({ type: "agent_fallback", vertical, demo: flowId });
      }
    },
    [dispatch, vertical, flowId],
  );

  const runLive = useCallback(
    async (live: AgentProviderId, text: string | null, approve: Record<string, boolean> | undefined) => {
      const { world: w, changes: log } = latest.current;
      const user: AgentMessage | null = text ? { role: "user", text } : null;
      const history = [...w.ag.messages, ...(user ? [user] : [])];
      const actions = [...log, ...(user ? [{ t: "agent.message" as const, message: user }] : [])];
      const first: { t: "agent.provider"; id: AgentProviderId }[] = w.ag.provider ? [] : [{ t: "agent.provider", id: live }];
      dispatch([...first, ...(user ? [{ t: "agent.message" as const, message: user }] : [])]);
      setBusy(true);
      setNotice(null);
      setDraft(EMPTY_DRAFT);
      const controller = new AbortController();
      abort.current = controller;
      try {
        for await (const e of streamTurn({ provider: live, demo: flowId, vertical, messages: history, actions, approve, signal: controller.signal })) {
          switch (e.event) {
            case "text_delta":
              setDraft((d) => ({ ...d, text: d.text + e.data.text }));
              break;
            case "tool_call":
              setDraft((d) => ({ ...d, calls: [...d.calls, e.data.call] }));
              break;
            case "tool_result":
              if (e.data.actions.length > 0) dispatch(e.data.actions);
              setDraft((d) => ({ ...d, done: { ...d.done, [e.data.id]: e.data.error ? "error" : "ok" } }));
              break;
            case "message":
              dispatch({ t: "agent.message", message: e.data.message });
              if (e.data.message.role === "assistant") setDraft(EMPTY_DRAFT);
              break;
            case "usage":
              setUsage((u) => ({ tokens: u.tokens + e.data.inputTokens + e.data.outputTokens, costUsd: u.costUsd + e.data.costUsd }));
              break;
            case "error":
              fallBack(`${e.data.message} The scripted conversation continues from here.`);
              break;
            default:
              break;
          }
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        if (error instanceof TurnRefused) fallBack(`${error.message} The scripted conversation continues from here.`);
        else fallBack("The live model could not be reached. The scripted conversation continues from here.");
      } finally {
        if (abort.current === controller) abort.current = null;
        setBusy(false);
        setDraft(EMPTY_DRAFT);
      }
    },
    [vertical, dispatch, fallBack, flowId],
  );

  const send = useCallback(
    (text: string | null, approve?: Record<string, boolean>) => {
      if (busy) return;
      if (scripted || !provider) {
        playScripted(approve ? Object.values(approve).every(Boolean) : null);
        return;
      }
      void runLive(provider, text, approve);
    },
    [busy, scripted, provider, playScripted, runLive],
  );

  const submit = () => {
    const text = input.trim();
    if (!text || busy || scripted) return;
    setInput("");
    send(text);
  };

  const decide = (approve: boolean) => {
    if (pending.length === 0) return;
    send(null, Object.fromEntries(pending.map((c) => [c.id, approve])));
  };

  if (!demo || !flow) return null;

  return (
    <div className="flex min-h-full flex-col bg-[#f5f1ea] text-ink" style={{ fontFamily: "var(--font-penguin)" }} data-testid="claude-stage" aria-label="Claude">
      <Ext id="agent-workspace" className="shrink-0">
        <header className="flex items-center gap-3 border-b border-[#3b2a7a] bg-[#1c1340] py-2 pl-4 pr-10 text-white" data-testid="claude-header">
          <ClaudeMark size={24} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-[14px] font-bold leading-tight">
              Claude
              <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/10 px-2 py-0.5 text-[10.5px] font-semibold text-white/90">
                <PenguinMark size={11} /> Penguin agent surface
              </span>
            </p>
            <p className="truncate text-[11.5px] text-white/70">
              {flow.chatTitle} · {flow.actor.name}, {flow.actor.title}
            </p>
          </div>
          {available.length > 0 ? (
            <label className="flex items-center gap-1 text-[11px] text-white/80">
              <span className="sr-only">Model provider</span>
              <select
                value={provider ?? ""}
                onChange={(e) => {
                  const id = e.target.value as AgentProviderId;
                  setPicked(id);
                  dispatch({ t: "agent.provider", id });
                }}
                disabled={busy}
                className="h-7 max-w-[170px] rounded-[6px] border border-white/25 bg-white/10 px-1.5 text-[12px] font-semibold text-white outline-none focus:border-white/60 [&>option]:text-ink"
                data-testid="claude-provider"
              >
                {available.map((id) => {
                  const p = status !== "loading" && status ? status.providers.find((x) => x.id === id) : undefined;
                  return (
                    <option key={id} value={id}>
                      {p?.label ?? id}
                    </option>
                  );
                })}
              </select>
            </label>
          ) : null}
          {scripted ? (
            <span className="shrink-0 rounded-full border border-[#e9c46a] bg-[#fff8e6] px-2 py-0.5 text-[10.5px] font-semibold text-[#7a5a00]" data-testid="claude-mode-scripted">
              Scripted conversation
            </span>
          ) : status === "loading" ? null : (
            <span className="shrink-0 rounded-full border border-[#9fd3b9] bg-[#e8f7ef] px-2 py-0.5 text-[10.5px] font-semibold text-[#0b5b45]" data-testid="claude-mode-live">
              Live{providerInfo ? ` · ${providerInfo.model}` : ""}
            </span>
          )}
        </header>
      </Ext>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[232px] shrink-0 flex-col border-r border-[#e4ddd0] bg-[#efe9df] px-3 py-3 lg:flex" data-testid="claude-sidebar">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Chats</p>
          <p className="mt-1.5 truncate rounded-[8px] bg-white px-2.5 py-1.5 text-[13px] font-semibold shadow-sm">{flow.chatTitle}</p>
          <p className="mt-4 px-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Connectors</p>
          <Ext id="agent-tool-bridge" className="mt-1.5">
            <div className="rounded-[8px] border border-penguin/30 bg-white px-2.5 py-2" data-testid="claude-connector">
              <p className="flex items-center gap-1.5 text-[12.5px] font-semibold">
                <span className="inline-block h-2 w-2 rounded-full bg-[#1a9e4b]" aria-hidden="true" /> HubSpot · {pack.portal.company}
              </p>
              <p className="mt-0.5 text-[11.5px] text-ink-muted">
                {demo.tools.length} tools · <strong data-testid="claude-write-count">{writes}</strong> write{writes === 1 ? "" : "s"} approved this run
              </p>
            </div>
          </Ext>
          <div className="mt-auto flex items-center gap-2 px-1 pt-3">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#1c1340] text-[11px] font-bold text-white">{flow.actor.initials}</span>
            <span className="min-w-0">
              <span className="block truncate text-[12.5px] font-semibold">{flow.actor.name}</span>
              <span className="block truncate text-[11px] text-ink-muted">{flow.actor.title}</span>
            </span>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div ref={list} className="hs-scroll min-h-0 flex-1 overflow-y-auto px-6 py-5" data-testid="claude-messages">
            <div className="mx-auto w-full max-w-[760px] space-y-5">
              {messages.length === 0 && !busy ? (
                <div className="pt-10 text-center" data-testid="claude-intro">
                  <ClaudeMark size={40} />
                  <h1 className="mt-4 text-[22px] font-semibold tracking-tight">Good morning, {flow.actor.name.split(" ")[0]}.</h1>
                  <p className="mx-auto mt-2 max-w-[520px] text-[13.5px] leading-snug text-ink-muted">{flow.intro}</p>
                  {scripted ? (
                    <p className="mx-auto mt-3 max-w-[520px] text-[12px] text-ink-muted">
                      {status === null ? "The agent service is unavailable." : "No live model is configured on this portal."} The scripted conversation makes the same tool calls.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {messages.map((m, i) => {
                if (m.role === "user") {
                  return (
                    <div key={i} className="flex justify-end" data-testid="claude-msg-user">
                      <p className="max-w-[80%] whitespace-pre-wrap rounded-[14px] rounded-br-[4px] bg-[#e8e1d4] px-3.5 py-2 text-[14px] leading-snug">{m.text}</p>
                    </div>
                  );
                }
                if (m.role === "tool") return null;
                if (!m.text.trim() && m.toolCalls.length === 0) return null;
                const waiting = i === messages.length - 1 && pending.length > 0;
                return (
                  <div key={i} className="flex gap-3" data-testid="claude-msg-assistant">
                    <ClaudeMark size={26} />
                    <div className="min-w-0 flex-1 pt-0.5">
                      {m.text.trim() ? <p className="whitespace-pre-wrap text-[14px] leading-[1.5]">{m.text}</p> : null}
                      {m.toolCalls.length > 0 ? (
                        <ul className="mt-2 space-y-1">
                          {m.toolCalls.map((c) => {
                            const r = results.get(c.id);
                            const state = results.has(c.id) ? ((r as { error?: unknown } | null)?.error ? "error" : "ok") : waiting && gated.includes(c.name) ? "waiting" : "pending";
                            return <ToolChip key={c.id} call={c} state={state} result={r} path={state === "ok" ? focusPathFor(c, r, world) : null} />;
                          })}
                        </ul>
                      ) : null}
                    </div>
                  </div>
                );
              })}

              {busy ? (
                <div className="flex gap-3" data-testid="claude-msg-streaming">
                  <ClaudeMark size={26} />
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="whitespace-pre-wrap text-[14px] leading-[1.5]">
                      {draft.text || <span className="text-ink-muted">Thinking…</span>}
                      <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-[#d97757] align-middle" aria-hidden="true" />
                    </p>
                    {draft.calls.length > 0 ? (
                      <ul className="mt-2 space-y-1">
                        {draft.calls.map((c) => (
                          <ToolChip key={c.id} call={c} state={draft.done[c.id] ?? "pending"} />
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {pending.length > 0 && !busy ? (
                <div className="ml-[38px] rounded-[12px] border border-[#e9c46a] bg-[#fff8e6] p-3.5" data-testid="claude-confirm">
                  <p className="flex items-center gap-1.5 text-[13px] font-semibold text-[#7a5a00]">
                    <Icon name="lock" size={14} /> Review before it lands in HubSpot
                  </p>
                  <p className="mt-1 text-[12.5px] leading-snug text-ink">
                    {pending.length === 1 ? "One change" : `${pending.length} changes`} waiting for your approval. Nothing is written until you say so.
                  </p>
                  <div className="mt-2.5 space-y-2">
                    {pending.map((c) => (
                      <ChangePreview key={c.id} call={c} w={world} pack={pack} />
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => decide(true)} className="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-[#1c1340] px-3 text-[12.5px] font-semibold text-white hover:bg-[#2a1d5e]" data-testid="claude-approve">
                      <Icon name="check" size={14} /> Approve {pending.length === 1 ? "" : "all"}
                    </button>
                    <button type="button" onClick={() => decide(false)} className="inline-flex h-8 items-center rounded-[6px] border border-ink bg-white px-3 text-[12.5px] font-semibold hover:bg-[#f5f5f5]" data-testid="claude-decline">
                      Not now
                    </button>
                  </div>
                </div>
              ) : null}

              {notice ? (
                <p className="ml-[38px] rounded-[8px] border border-[#e9c46a] bg-[#fff8e6] px-3 py-2 text-[12px] leading-snug text-[#7a5a00]" data-testid="claude-notice">
                  {notice}
                </p>
              ) : null}
            </div>
          </div>

          <div className="shrink-0 px-6 pb-4 pt-2">
            <div className="mx-auto w-full max-w-[760px]">
              {nextPrompt && !busy ? (
                <button
                  type="button"
                  onClick={() => (scripted ? send(null) : send(nextPrompt))}
                  className="mb-2 w-full rounded-[10px] border border-[#e4ddd0] bg-white px-3 py-2 text-left text-[12.5px] leading-snug text-ink hover:border-[#d97757]"
                  data-testid={scripted ? "claude-play" : "claude-suggest"}
                >
                  <span className="font-semibold text-[#b5532f]">{scripted ? "Send: " : "Try: "}</span>
                  {nextPrompt}
                </button>
              ) : null}
              <div className={cx("flex items-end gap-2 rounded-[14px] border bg-white p-2 shadow-sm", scripted ? "border-[#e4ddd0]" : "border-[#d9d1c3] focus-within:border-[#d97757]")}>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submit();
                    }
                  }}
                  rows={2}
                  placeholder={busy ? "Working…" : scripted ? "No live model on this portal. Use Send above, or Next in the demo bar." : pending.length > 0 ? "Answer above, or tell Claude what to change" : "Message Claude"}
                  disabled={busy || scripted}
                  className="hs-scroll min-h-[44px] flex-1 resize-none bg-transparent px-2 py-1.5 text-[14px] leading-snug outline-none disabled:text-ink-muted"
                  data-testid="claude-input"
                />
                <button
                  type="button"
                  onClick={submit}
                  disabled={busy || scripted || !input.trim()}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#d97757] text-white hover:bg-[#b5532f] disabled:bg-[#e6e6e6] disabled:text-[#8a8a8a]"
                  aria-label="Send"
                  data-testid="claude-send"
                >
                  <Icon name="send" size={16} />
                </button>
              </div>
              <p className="mt-2 flex items-center justify-between text-[10.5px] text-ink-muted">
                <span data-testid="claude-usage">{scripted ? "No model calls made" : `${usage.tokens.toLocaleString("en-US")} tokens · ~$${usage.costUsd.toFixed(4)}`}</span>
                <span>Fictional data. Every write to HubSpot waits for your approval.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
