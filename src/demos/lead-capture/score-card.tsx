"use client";

import { Ext } from "@/shell/ext";
import { Icon } from "@/shell/icons";
import { Button, cx, Tag } from "@/shell/ui";
import { useShell } from "@/store/store";
import type { Contact } from "@/verticals/types";

/** The reasons behind a lead score, beside the score. */
export function WhyThisScoreCard({ contact }: { contact: Contact }) {
  const { pack, world, dispatch } = useShell();
  const preset = world.lc?.contactId === contact.id ? pack.demos.leadCapture.presets.find((p) => p.id === world.lc?.presetId) : undefined;
  if (!preset) return null;
  const open = world.ui["score.open"] === "yes";
  const max = Math.max(...preset.reasons.map((r) => r.points), 25);
  const tone = preset.score >= 70 ? "green" : preset.score >= 40 ? "amber" : "neutral";

  return (
    <Ext id="why-this-score">
      <section className="rounded-[10px] border border-line bg-white px-4 py-3.5" data-testid="score-card">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[3px] text-[19px] font-semibold tabular-nums" style={{ borderColor: preset.score >= 70 ? "#1a9e4b" : preset.score >= 40 ? "#d39b00" : "#9a9a9a" }} data-testid="score-value">
            {preset.score}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[14px] font-semibold">Lead score</h3>
            <p className="text-[12.5px] text-ink-muted">
              <Tag tone={tone}>{preset.outcome.split(":")[0]}</Tag> <span className="ml-1">{preset.route.summary}</span>
            </p>
          </div>
          <Button size="sm" className="mr-8" onClick={() => dispatch([{ t: "ui", k: "score.open", v: open ? "no" : "yes" }, { t: "flag", k: "lc.score" }])} data-testid="score-why">
            Why this score <Icon name="chevronDown" size={13} className={cx("transition-transform", open && "rotate-180")} />
          </Button>
        </div>
        {open ? (
          <ul className="hs-pop mt-3 space-y-2.5 border-t border-line-soft pt-3" data-testid="score-reasons">
            {preset.reasons.map((reason) => (
              <li key={reason.label} className="grid grid-cols-[150px_1fr_44px] items-center gap-3 text-[13px]">
                <span className="font-semibold">{reason.label}</span>
                <span>
                  <span className="block h-1.5 overflow-hidden rounded-full bg-[#ececec]">
                    <span className="block h-full rounded-full bg-[#1a9e4b]" style={{ width: `${(reason.points / max) * 100}%` }} />
                  </span>
                  <span className="mt-0.5 block text-[12px] text-ink-muted">{reason.detail}</span>
                </span>
                <span className="text-right font-semibold tabular-nums">+{reason.points}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </Ext>
  );
}
