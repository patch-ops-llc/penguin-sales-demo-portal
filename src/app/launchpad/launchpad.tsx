"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Lockup } from "@/components/brand";
import { track } from "@/lib/beacon";
import { hasSavedChanges } from "@/store/session";
import { DEMOS, VERTICALS } from "@/verticals/catalog";

type Props = { user: { name: string | null; email: string; isAdmin: boolean }; packVersion: string | null };

export function Launchpad({ user, packVersion }: Props) {
  const [verticalId, setVerticalId] = useState("manufacturing");
  const [resumable, setResumable] = useState(false);
  const vertical = VERTICALS.find((v) => v.id === verticalId) ?? VERTICALS[0];

  useEffect(() => {
    track({ type: "launchpad_opened" });
    // Read after mount: session storage does not exist on the server.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResumable(hasSavedChanges("manufacturing"));
    // Warm the browser cache so the shell opens with its data already local.
    if (packVersion) fetch(`/api/packs/${packVersion}/manufacturing`, { credentials: "same-origin" }).catch(() => {});
  }, [packVersion]);

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-line-soft bg-white">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-8 py-4">
          <Lockup height={28} />
          <div className="flex items-center gap-5 text-[13.5px]">
            <span className="text-ink-muted">{user.name ?? user.email}</span>
            {user.isAdmin ? (
              <Link href="/admin" className="hs-link">
                Admin
              </Link>
            ) : null}
            <Link href="/account" className="hs-link" data-testid="account-link">
              Account
            </Link>
            <form action="/auth/signout" method="post">
              <button type="submit" className="hs-link">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-8 py-10">
        <h1 className="text-[30px] font-semibold tracking-tight">Pick a vertical, then a demo</h1>
        <p className="mt-2 max-w-[720px] text-[15px] text-ink-muted">
          Each demo runs inside a focused HubSpot portal with sample data. Everything is loaded up front, so nothing waits on the network once you start.
        </p>

        <h2 className="mt-9 text-[13px] font-semibold uppercase tracking-wider text-ink-muted">1. Vertical</h2>
        <div className="mt-3 grid grid-cols-4 gap-4">
          {VERTICALS.map((v) => {
            const live = v.status === "live";
            const selected = v.id === vertical.id;
            const body = (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[16px] font-semibold">{v.name}</span>
                  {live ? null : <span className="shrink-0 rounded-full bg-hs-bg px-2 py-0.5 text-[11px] font-semibold text-ink-muted">Coming soon</span>}
                </div>
                <div className="mt-1 text-[13px] font-medium">{v.company}</div>
                <p className="mt-1.5 text-[12.5px] leading-snug text-ink-muted">{v.blurb}</p>
                <div className="mt-3 text-[12px] text-ink-muted">{v.demos.length} demos</div>
              </>
            );
            return live ? (
              <button
                key={v.id}
                type="button"
                data-testid={`vertical-${v.id}`}
                aria-pressed={selected}
                onClick={() => {
                  setVerticalId(v.id);
                  track({ type: "vertical_opened", vertical: v.id });
                }}
                className={`rounded-xl border bg-white p-4 text-left transition-shadow hover:shadow-[0_4px_16px_rgba(20,20,20,0.08)] ${selected ? "border-hs-orange ring-2 ring-hs-orange/25" : "border-line"}`}
              >
                {body}
              </button>
            ) : (
              <div key={v.id} data-testid={`vertical-${v.id}`} aria-disabled="true" className="rounded-xl border border-dashed border-line bg-white/60 p-4 text-ink-muted">
                {body}
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex items-baseline justify-between">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-muted">2. Demo: {vertical.name}</h2>
          <p className="text-[12.5px] text-ink-muted">
            In a demo: arrow keys step forward and back, <kbd className="rounded border border-line bg-white px-1">R</kbd> resets,{" "}
            <kbd className="rounded border border-line bg-white px-1">H</kbd> highlights what Penguin built.
          </p>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-4">
          {vertical.demos.map((id, index) => {
            const demo = DEMOS[id];
            return (
              <div key={id} data-testid={`demo-${id}`} className="flex flex-col rounded-xl border border-line bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-ink-muted">Demo {index + 1}</span>
                  <span className="rounded-full bg-hs-bg px-2 py-0.5 text-[11.5px] font-medium text-ink-muted">About {demo.minutes} min</span>
                </div>
                <h3 className="mt-2 text-[18px] font-semibold tracking-tight">{demo.title}</h3>
                <p className="mt-1.5 text-[13px] leading-snug text-ink-muted">{demo.summary}</p>
                <p className="mt-3 border-l-2 border-hs-orange pl-3 text-[13px] leading-snug">{demo.takeaway}</p>
                <div className="mt-auto flex items-center gap-4 pt-5">
                  <Link
                    href={`/demo/${vertical.id}/${id}?fresh=1`}
                    data-testid={`start-${id}`}
                    className="inline-flex items-center rounded-[4px] bg-hs-orange px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-hs-orange-strong"
                  >
                    Start demo
                  </Link>
                  {resumable ? (
                    <Link href={`/demo/${vertical.id}/${id}`} className="hs-link text-[13px]">
                      Continue where I left off
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
