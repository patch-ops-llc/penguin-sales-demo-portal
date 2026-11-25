"use client";

import { useState } from "react";
import { playBeat } from "@/demos/scripts";
import { useShell } from "@/store/store";
import { Icon } from "../icons";
import { A, cx } from "../ui";
import type { FlowDemoId } from "./types";

const FLOW_IDS = new Set<string>(["agent-campaign", "agent-deal-follow-up", "agent-renewal"]);

/**
 * An off-platform beat: the customer's inbox, where the email Claude wrote arrives and the reply
 * (or the form submission) goes back. A short screen between Claude and HubSpot, not a HubSpot
 * screen. Playing it dispatches the same store actions a connected inbox would log.
 */
export function BeatScreen({ id }: { id: string }) {
  const { pack, world, demo, dispatch } = useShell();
  const flowId = (FLOW_IDS.has(demo) ? demo : "agent-campaign") as FlowDemoId;
  const beat = pack.demos.flows?.flows[flowId]?.beats[id];
  const played = world.hf.beats.includes(id);
  const [opened, setOpened] = useState(0);
  if (!beat) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#eef0f3] text-[13px] text-ink-muted" data-testid="beat-screen">
        This moment is not part of the current flow. <A to="/claude" className="ml-1 hs-link">Back to Claude</A>
      </div>
    );
  }
  const message = beat.messages[opened] ?? beat.messages[0];
  const play = () => dispatch(playBeat(pack, flowId, id, Date.now()));

  return (
    <div className="flex min-h-full flex-col bg-[#eef0f3]" data-testid="beat-screen" data-beat={id} style={{ fontFamily: "var(--font-penguin)" }}>
      <div className="flex items-center gap-3 border-b border-[#d7dbe0] bg-white px-4 py-2 text-[12px] text-ink-muted">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </span>
        <span className="flex-1 truncate rounded-[6px] bg-[#f1f3f5] px-3 py-1 text-center font-mono text-[11.5px]">{beat.address}</span>
        <span className="rounded-full border border-[#d7dbe0] px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide">Off platform</span>
      </div>

      <p className="px-6 pt-4 text-center text-[13px] text-ink-muted" data-testid="beat-caption">
        {beat.caption}
      </p>

      <div className="mx-auto mt-3 grid w-full max-w-[1100px] flex-1 grid-cols-[260px_minmax(0,1fr)] gap-0 overflow-hidden rounded-t-[12px] border border-b-0 border-[#d7dbe0] bg-white shadow-sm">
        <aside className="border-r border-[#e6e9ed] bg-[#f8f9fa]">
          <div className="flex items-center gap-2.5 border-b border-[#e6e9ed] px-4 py-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#2b5797] text-[12px] font-bold text-white">{beat.mailbox.initials}</span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold">{beat.mailbox.name}</span>
              <span className="block truncate text-[11.5px] text-ink-muted">{beat.mailbox.email}</span>
            </span>
          </div>
          <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{beat.app}</p>
          <p className="px-4 pb-2 text-[12.5px] font-semibold">Inbox</p>
          <ul>
            {beat.messages.map((m, i) => (
              <li key={i}>
                <button type="button" onClick={() => setOpened(i)} className={cx("w-full border-l-2 px-4 py-2.5 text-left", i === opened ? "border-[#2b5797] bg-white" : "border-transparent hover:bg-white/60")} data-testid={`beat-message-${i}`}>
                  <span className="flex items-center justify-between gap-2">
                    <span className={cx("truncate text-[12.5px]", m.unread && !played ? "font-bold" : "font-semibold")}>{m.from}</span>
                    <span className="shrink-0 text-[11px] text-ink-muted">{m.when}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] text-ink">{m.subject}</span>
                  <span className="block truncate text-[11.5px] text-ink-muted">{m.body.split("\n").find(Boolean)}</span>
                </button>
              </li>
            ))}
            {played && beat.reply ? (
              <li className="border-l-2 border-transparent px-4 py-2.5" data-testid="beat-sent">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-[12.5px] font-semibold text-ink-muted">You</span>
                  <span className="shrink-0 text-[11px] text-ink-muted">Sent</span>
                </span>
                <span className="mt-0.5 block truncate text-[12px] text-ink">{beat.reply.subject}</span>
              </li>
            ) : null}
          </ul>
        </aside>

        <section className="flex min-w-0 flex-col">
          <div className="border-b border-[#e6e9ed] px-6 py-4">
            <h2 className="text-[17px] font-semibold leading-tight">{message.subject}</h2>
            <p className="mt-1.5 text-[12.5px] text-ink-muted">
              <span className="font-semibold text-ink">{message.from}</span> &lt;{message.fromEmail}&gt; · to {message.to} · {message.when}
            </p>
          </div>
          <div className="hs-scroll min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <p className="max-w-[640px] whitespace-pre-wrap text-[13.5px] leading-[1.55]" data-testid="beat-body">
              {message.body}
            </p>

            {beat.form ? (
              <div className="mt-5 max-w-[640px] overflow-hidden rounded-[10px] border border-[#d7dbe0]" data-testid="beat-form">
                <div className="flex items-center gap-2 border-b border-[#d7dbe0] bg-[#f8f9fa] px-3 py-1.5 font-mono text-[11px] text-ink-muted">
                  <Icon name="search" size={12} /> {beat.form.eyebrow}
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_240px] gap-5 bg-white p-5">
                  <div>
                    <h3 className="text-[18px] font-semibold leading-tight tracking-tight">{beat.form.headline}</h3>
                    <p className="mt-2 text-[12.5px] leading-snug text-ink-muted">One dashboard for pipeline, usage, and ARR. Live in a week.</p>
                  </div>
                  <div className="rounded-[8px] border border-[#e6e9ed] p-3">
                    {played ? (
                      <p className="text-[12.5px] leading-snug text-[#0b5b45]" data-testid="beat-thanks">
                        <Icon name="check" size={14} className="mr-1 inline" /> {beat.form.thanks}
                      </p>
                    ) : (
                      <>
                        {beat.form.fields.map((f) => (
                          <label key={f.label} className="mb-2 block text-[11.5px] font-semibold text-ink-muted">
                            {f.label}
                            <span className="mt-0.5 block rounded-[6px] border border-[#d7dbe0] bg-white px-2 py-1.5 text-[12.5px] font-normal text-ink">{f.value}</span>
                          </label>
                        ))}
                        <button type="button" onClick={play} className="mt-1 inline-flex h-8 w-full items-center justify-center rounded-[6px] bg-[#1c1340] text-[12.5px] font-semibold text-white hover:bg-[#2a1d5e]" data-testid="beat-cta">
                          {beat.form.submitLabel}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {beat.reply ? (
              <div className={cx("mt-5 max-w-[640px] rounded-[10px] border p-4", played ? "border-[#9fd3b9] bg-[#f3fbf6]" : "border-[#d7dbe0] bg-[#fbfbfc]")} data-testid="beat-reply">
                <p className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">{played ? "Sent" : "Reply"}</p>
                <p className="mt-1 text-[12.5px] text-ink-muted">
                  To: <span className="text-ink">{message.fromEmail}</span>
                </p>
                <p className="text-[12.5px] text-ink-muted">
                  Subject: <span className="text-ink">{beat.reply.subject}</span>
                </p>
                <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-[1.55]">{beat.reply.body}</p>
                {!played ? (
                  <button type="button" onClick={play} className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-[#2b5797] px-3 text-[12.5px] font-semibold text-white hover:bg-[#234a7d]" data-testid="beat-cta">
                    <Icon name="send" size={14} /> Send
                  </button>
                ) : null}
              </div>
            ) : null}

            {played ? (
              <div className="mt-5 flex max-w-[640px] items-start gap-2 rounded-[10px] border border-penguin/30 bg-penguin-soft/50 px-3 py-2.5 text-[12.5px] leading-snug text-penguin-strong" data-testid="beat-done">
                <Icon name="sync" size={14} className="mt-0.5 shrink-0" />
                <span>
                  {beat.result} <A to="/claude" className="font-semibold underline" data-testid="beat-back">Back to Claude</A>
                </span>
              </div>
            ) : (
              <p className="mt-5 text-[12px] text-ink-muted">{beat.cta}, or press Next.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
