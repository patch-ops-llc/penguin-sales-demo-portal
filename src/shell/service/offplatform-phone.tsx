"use client";

import { useState } from "react";
import { nowMs } from "@/lib/format";
import { useShell } from "@/store/store";
import { relative } from "../format";
import { Icon } from "../icons";
import { A, Avatar, Button, cx, Tag } from "../ui";

const WAVE_HEIGHTS = [14, 28, 20, 36, 18, 32, 24, 38, 16, 30, 22, 34, 18, 26, 14];

/**
 * Off-platform screen (Step 7): Realistic smartphone & voice call screen for Halle Voss calling
 * Fernhill Capital Support because her business account is locked after failed MFA prompts.
 */
export function OffplatformPhonePage() {
  const { pack, world, dispatch } = useShell();
  const cfg = pack.demos.customerAgent;
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [keypad, setKeypad] = useState(false);
  const [dialed, setDialed] = useState("");

  if (!cfg) return null;
  const v = cfg.voiceCase;
  const called = world.ca.voiceCalled;
  const unlocked = world.ca.voiceUnlocked;
  const contact = world.contacts.find((c) => c.id === v.contactId);
  const company = world.companies.find((c) => c.id === v.companyId);
  const openingLines = v.transcript.filter((l) => l.phase === "opening");
  const shownLines = unlocked ? v.transcript : called ? openingLines : [];

  const placeCall = () => {
    if (called) return;
    dispatch({ t: "ca.voiceCall", at: nowMs() });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#1b2230] p-4 text-white" data-testid="offplatform-phone">
      <div className="mb-3 flex items-center justify-between gap-3 text-[12.5px]">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#313e56] px-3 py-1 font-semibold text-white">
            <Icon name="call" size={13} /> Off-platform · Customer Voice Call
          </span>
          <span className="text-white/70">
            Caller: {contact ? `${contact.firstName} ${contact.lastName}` : "Halle Voss"}, {company?.name ?? "Wintergreen Landscape Supply"}
          </span>
        </div>
        <A
          to="/service"
          data-testid="offplatform-back-hubspot"
          className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-white/25 bg-white/10 px-3 text-[12.5px] font-semibold text-white hover:bg-white/20"
        >
          Back to HubSpot <Icon name="arrowRight" size={14} />
        </A>
      </div>

      <div className="mx-auto grid min-h-0 w-full max-w-[1060px] flex-1 grid-cols-[360px_minmax(0,1fr)] items-center gap-7">
        {/* Realistic Phone Handset */}
        <div className="mx-auto flex h-[600px] w-[320px] flex-col overflow-hidden rounded-[36px] border-[5px] border-[#3a455a] bg-[#0f1623] shadow-[0_24px_60px_rgba(0,0,0,0.55)]" data-testid="phone-handset">
          {/* Status bar */}
          <div className="flex items-center justify-between px-6 pt-3 text-[11px] font-semibold text-white/70">
            <span>9:41</span>
            <span className="h-4 w-20 rounded-full bg-black" aria-hidden="true" />
            <span>5G · 88%</span>
          </div>

          {/* Lock notification banner */}
          <div className="mx-4 mt-3 rounded-[12px] border border-[#f59e0b]/40 bg-[#f59e0b]/15 px-3 py-2 text-[11.5px] text-[#fde68a]">
            <p className="flex items-center gap-1.5 font-semibold">
              <Icon name="lock" size={12} /> Fernhill Account Locked
            </p>
            <p className="mt-0.5 text-white/80">{v.failedAttempts} failed authenticator attempts ({relative(v.lockedAt).toLowerCase()})</p>
          </div>

          {/* Caller Identity & Live Status */}
          <div className="mt-5 flex flex-col items-center px-5 text-center">
            <Avatar name="Fernhill Support" color="#134e4a" size={64} />
            <h1 className="mt-3 text-[19px] font-bold tracking-tight">Fernhill Support</h1>
            <p className="text-[13px] text-white/70">{v.supportNumber}</p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[12px] font-semibold" data-testid="phone-call-status">
              <span className={cx("h-2 w-2 rounded-full", called ? "bg-[#34d399]" : "bg-[#fbbf24]")} />
              {unlocked ? `Call completed · ${v.duration}` : called ? "Connected · 00:22 · Breeze Voice" : "Ready to dial"}
            </p>
          </div>

          {/* Audio Waveform or Dialpad */}
          <div className="flex flex-1 flex-col items-center justify-center px-6">
            {keypad ? (
              <div className="w-full" data-testid="phone-keypad">
                <p className="mb-2 h-5 text-center font-mono text-[14px] tracking-widest text-white/90">{dialed || "Enter digits"}</p>
                <div className="grid grid-cols-3 gap-2">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setDialed((d) => (d + key).slice(0, 12))}
                      className="h-10 rounded-full bg-white/10 text-[15px] font-semibold hover:bg-white/20"
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-12 items-center gap-1.5" aria-label="Voice audio level">
                {WAVE_HEIGHTS.map((h, i) => (
                  <span
                    key={i}
                    className={cx("w-1 rounded-full transition-all", called && !muted ? "bg-[#34d399]" : "bg-white/20")}
                    style={{ height: called && !muted ? `${h}px` : "8px" }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="px-6 pb-6">
            <div className="grid grid-cols-3 gap-3 text-center text-[11px] text-white/75">
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                aria-pressed={muted}
                data-testid="phone-mute"
                className="flex flex-col items-center gap-1"
              >
                <span className={cx("inline-flex h-11 w-11 items-center justify-center rounded-full", muted ? "bg-white text-[#0f1623]" : "bg-white/15 text-white hover:bg-white/25")}>
                  <Icon name="mic" size={18} />
                </span>
                {muted ? "Muted" : "Mute"}
              </button>
              <button
                type="button"
                onClick={() => setKeypad((k) => !k)}
                aria-pressed={keypad}
                data-testid="phone-keypad-toggle"
                className="flex flex-col items-center gap-1"
              >
                <span className={cx("inline-flex h-11 w-11 items-center justify-center rounded-full", keypad ? "bg-white text-[#0f1623]" : "bg-white/15 text-white hover:bg-white/25")}>
                  <Icon name="grid" size={18} />
                </span>
                Keypad
              </button>
              <button
                type="button"
                onClick={() => setSpeaker((s) => !s)}
                aria-pressed={speaker}
                data-testid="phone-speaker"
                className="flex flex-col items-center gap-1"
              >
                <span className={cx("inline-flex h-11 w-11 items-center justify-center rounded-full", speaker ? "bg-white text-[#0f1623]" : "bg-white/15 text-white hover:bg-white/25")}>
                  <Icon name="volume" size={18} />
                </span>
                Speaker
              </button>
            </div>

            <div className="mt-5 flex justify-center">
              {!called ? (
                <button
                  type="button"
                  onClick={placeCall}
                  data-testid="phone-place-call"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-[#16a34a] px-6 text-[14px] font-bold text-white shadow-lg hover:bg-[#15803d]"
                >
                  <Icon name="call" size={17} /> Place call
                </button>
              ) : (
                <span className="inline-flex h-11 items-center gap-2 rounded-full bg-white/10 px-5 text-[12.5px] font-semibold text-[#86efac]">
                  <Icon name="check" size={15} /> Live with Breeze Voice Agent
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Live Transcript & HubSpot Transition */}
        <section className="flex max-h-[600px] flex-col overflow-hidden rounded-[14px] border border-white/15 bg-[#252f42] shadow-xl" data-testid="phone-transcript-panel">
          <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <h2 className="text-[16px] font-semibold">Live Voice Stream &amp; Transcript</h2>
              <p className="text-[12.5px] text-white/65">
                Caller ID: {v.callerNumber} · Account {v.accountNumber}
              </p>
            </div>
            <Tag tone={called ? "green" : "amber"}>{called ? "Breeze Voice Active" : "Waiting to dial"}</Tag>
          </header>

          <div className="hs-scroll flex-1 space-y-3 overflow-y-auto p-5">
            {!called ? (
              <div className="rounded-[10px] border border-white/10 bg-[#1c2434] p-5">
                <p className="text-[14px] font-semibold text-white">Scenario: Locked business account while traveling</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/75">
                  Halle Voss (Finance Manager at Wintergreen Landscape Supply) triggered a 5-attempt MFA lockout on account {v.accountNumber} while traveling in Chicago and needs to approve payroll transfers before noon.
                </p>
                <div className="mt-4">
                  <Button variant="primary" icon="call" onClick={placeCall} data-testid="phone-start-call-cta">
                    Dial Fernhill Support ({v.supportNumber})
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {shownLines.map((line) => (
                  <div
                    key={line.id}
                    className={cx(
                      "rounded-[10px] border px-4 py-3 text-[13.5px] leading-relaxed",
                      line.speaker === "agent" ? "border-[#d20587]/40 bg-[#2d1e37]" : "border-white/15 bg-[#1b2333]",
                    )}
                    data-testid={`phone-line-${line.id}`}
                  >
                    <div className="flex items-center justify-between text-[11.5px] font-semibold">
                      <span className={line.speaker === "agent" ? "text-[#f48fd0]" : "text-[#93c5fd]"}>{line.name}</span>
                      <span className="font-mono text-white/50">{line.time}</span>
                    </div>
                    <p className="mt-1 text-white/90">{line.text}</p>
                  </div>
                ))}

                <div className="hs-pop rounded-[10px] border border-[#ff4800]/50 bg-[#2b1f22] p-4" data-testid="phone-hubspot-handoff">
                  <p className="text-[14px] font-semibold text-white">Breeze Voice Agent answered in HubSpot</p>
                  <p className="mt-1 text-[12.5px] text-white/75">
                    Switch into HubSpot Help Desk to watch Breeze verify Halle via SMS OTP, clear her MFA lockout through Core Banking, and log the full transcript on her contact timeline.
                  </p>
                  <A
                    to="/service"
                    data-testid="phone-open-hubspot"
                    className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-[6px] bg-hs-orange px-4 text-[13.5px] font-semibold text-white hover:bg-hs-orange-strong"
                  >
                    Open in HubSpot Help Desk <Icon name="arrowRight" size={15} />
                  </A>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
