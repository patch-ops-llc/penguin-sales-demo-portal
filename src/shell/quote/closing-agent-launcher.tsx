"use client";

import { lazy, Suspense, useState } from "react";
import { useShell } from "@/store/store";
import { fill, labelsOf } from "@/verticals/labels";
import type { Quote } from "@/verticals/types";
import { Icon } from "../icons";
import { cx } from "../ui";
import { AgentAvatar, CLOSING_AGENT_BRAND, useClosingAgent } from "./closing-agent-state";

const LazyChatWindow = lazy(() => import("./closing-agent").then((m) => ({ default: m.ChatWindow })));

/**
 * The agent in the bottom right corner: the launcher, its welcome message, and the chat window it opens.
 * In the quote editor it runs in test mode, so a rep can try it before the quote is shared.
 */
export function ClosingAgentLauncher({
  quote,
  test = false,
  className,
}: {
  quote: Quote;
  test?: boolean;
  className?: string;
}) {
  const { pack } = useShell();
  const labels = labelsOf(pack).pack.agent;
  const name = fill(labels.name, { company: pack.portal.company });
  const [open, setOpen] = useState(false);
  const [greeted, setGreeted] = useState(false);
  const [notice, setNotice] = useState(true);
  const { on } = useClosingAgent(quote);
  if (!on) return null;
  return (
    <div
      className={cx(
        "pointer-events-none absolute bottom-4 right-4 z-20 flex flex-col items-end gap-3 [&>*]:pointer-events-auto",
        className,
      )}
      data-testid="closing-agent"
    >
      {open ? (
        <>
          {test && notice ? (
            <p
              className="flex w-[360px] items-center gap-2 rounded-[4px] border border-[#7fd1de] bg-[#e5f5f8] px-3 py-1.5 text-[11.5px]"
              data-testid="closing-agent-test-mode"
            >
              <span className="min-w-0 flex-1">
                <span className="font-bold">Closing Agent test mode</span>{" "}
                Buyers won&apos;t see any messages from testing.
              </span>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => setNotice(false)}
                className="rounded p-0.5 hover:bg-black/5"
              >
                <Icon name="close" size={13} />
              </button>
            </p>
          ) : null}
          <Suspense fallback={<div className="h-[440px] max-h-[calc(100vh-260px)] w-[360px] rounded-[12px] bg-white shadow-[0_8px_30px_rgba(20,20,20,0.25)]" />}>
            <LazyChatWindow
              quote={quote}
              test={test}
              onClose={() => setOpen(false)}
              className="h-[440px] max-h-[calc(100vh-260px)] w-[360px] rounded-[12px] shadow-[0_8px_30px_rgba(20,20,20,0.25)]"
            />
          </Suspense>
        </>
      ) : greeted ? null : (
        <div
          className="relative w-[200px] rounded-[8px] bg-white px-3 pb-3 pt-5 text-center text-[12.5px] shadow-[0_4px_16px_rgba(20,20,20,0.18)]"
          data-testid="closing-agent-welcome"
        >
          <span className="absolute -top-4 left-1/2 -translate-x-1/2">
            <AgentAvatar name={name} size={30} />
          </span>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setGreeted(true)}
            className="absolute right-1.5 top-1.5 rounded p-0.5 text-ink-muted hover:bg-[#f0f0f0]"
          >
            <Icon name="close" size={12} />
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-left"
          >
            {labels.welcome}
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setGreeted(true);
        }}
        aria-label={open ? "Close chat" : `Chat with ${name}`}
        aria-expanded={open}
        className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-[0_4px_14px_rgba(20,20,20,0.3)] hover:brightness-110"
        style={{ background: CLOSING_AGENT_BRAND }}
        data-testid="closing-agent-launcher"
      >
        <Icon name={open ? "close" : "chat"} size={22} />
      </button>
    </div>
  );
}
