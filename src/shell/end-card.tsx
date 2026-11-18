"use client";

import { HubSpotSprocket, PenguinMark } from "@/components/brand";
import { useShell } from "@/store/store";
import { DEMOS, getVertical } from "@/verticals/catalog";
import { Icon } from "./icons";
import { Button, Modal } from "./ui";

/** "What you just saw": the native-versus-Penguin split for the demo, read from the same list that drives the callouts. */
export function EndCard() {
  const { pack, demo, vertical, reset, switchDemo, setEndCardOpen } = useShell();
  const list = pack.extensions[demo] ?? [];
  const native = list.filter((e) => e.by === "native");
  const penguin = list.filter((e) => e.by === "penguin");
  const order = getVertical(vertical)?.demos ?? [];
  const nextDemo = order[(order.indexOf(demo) + 1) % order.length];

  return (
    <Modal
      title={`What you just saw: ${DEMOS[demo].title}`}
      onClose={() => setEndCardOpen(false)}
      width={760}
      testId="end-card"
      footer={
        <>
          <a href="/launchpad" className="mr-auto text-[13.5px] font-semibold text-ink-muted hover:text-ink">
            Back to launchpad
          </a>
          <Button icon="reset" onClick={reset} data-testid="end-run-again">
            Run again
          </Button>
          {nextDemo && nextDemo !== demo ? (
            <Button variant="dark" onClick={() => switchDemo(nextDemo)} data-testid="end-next-demo">
              Next demo: {DEMOS[nextDemo].title} <Icon name="arrowRight" size={15} />
            </Button>
          ) : null}
        </>
      }
    >
      <p className="text-[15px] leading-relaxed">{DEMOS[demo].takeaway}</p>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <section className="rounded-[10px] border border-line p-4" data-testid="end-native">
          <h3 className="flex items-center gap-2 text-[13px] font-semibold">
            <HubSpotSprocket size={18} /> Native HubSpot
          </h3>
          <ul className="mt-3 space-y-2 text-[13.5px]">
            {native.map((e) => (
              <li key={e.id} className="flex gap-2">
                <Icon name="check" size={15} className="mt-0.5 shrink-0 text-[#0b5b2b]" />
                {e.name}
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-[10px] border border-penguin bg-penguin-soft/40 p-4" style={{ fontFamily: "var(--font-penguin)" }} data-testid="end-penguin">
          <h3 className="flex items-center gap-2 text-[13px] font-semibold text-penguin-strong">
            <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-penguin text-white">
              <PenguinMark size={10} />
            </span>
            Built by Penguin
          </h3>
          {penguin.length === 0 ? <p className="mt-3 text-[13.5px] text-ink-muted">Nothing custom in this demo. It is all native HubSpot, configured by Penguin.</p> : null}
          <ul className="mt-3 space-y-3 text-[13.5px]">
            {penguin.map((e) => (
              <li key={e.id}>
                <p className="font-semibold">{e.name}</p>
                {e.note ? <p className="mt-0.5 text-[12.5px] leading-snug text-ink-muted">{e.note}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Modal>
  );
}
