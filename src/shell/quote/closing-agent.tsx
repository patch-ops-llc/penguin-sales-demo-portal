"use client";

import { useEffect, useRef, useState } from "react";
import { nowMs } from "@/lib/format";
import { quoteTotals } from "@/store/quote-math";
import { useShell } from "@/store/store";
import { fill, labelsOf, timingOf } from "@/verticals/labels";
import type { Pack, Quote } from "@/verticals/types";
import { date, money2, pct, time } from "../format";
import { Icon } from "../icons";
import { cx } from "../ui";
import { AgentAvatar, CLOSING_AGENT_BRAND as BRAND, useClosingAgent } from "./closing-agent-state";
import { paymentTermsOf } from "./document";
import { useQuoteSettings } from "./settings";

export { useClosingAgent } from "./closing-agent-state";
export { ClosingAgentLauncher } from "./closing-agent-launcher";

export type Topic = "total" | "terms" | "timing" | "accept" | "handoff";
/** `topic` is what the message is about: a Topic, or "file-n" when a knowledge file answers it. */
type Message = {
  from: "agent" | "buyer";
  text: string[];
  at: number;
  topic?: string;
};

/** What a typed question is about. The first match wins, so the narrower subjects come first. */
const SUBJECTS: [Topic, RegExp][] = [
  [
    "handoff",
    /\b(human|person|representative|rep|someone|sales|talk|speak|call)\b/i,
  ],
  ["accept", /\b(sign|signature|accept|approve|next step)/i],
  [
    "timing",
    /\b(lead time|ship|deliver|arrive|when|schedule|billed|billing|how long)/i,
  ],
  ["terms", /\b(terms|net \d+|invoice|pay)/i],
  ["total", /\b(total|price|cost|how much|amount|discount)/i],
];

/**
 * The closing agent's answers. Each one is read off the quote, the way the real agent answers from the quote
 * and its knowledge sources, so nothing leaves the browser.
 */
export function answer(
  topic: Topic | null,
  pack: Pack,
  quote: Quote,
  acceptMethod: string,
): string[] {
  const labels = labelsOf(pack).pack;
  const noun = labels.document.heading.toLowerCase();
  const owner = pack.personas.find((p) => p.id === quote.ownerId);
  const totals = quoteTotals(quote);
  switch (topic) {
    case "total":
      return [
        `The ${labels.document.total.toLowerCase()} is ${money2(totals.total)}${totals.discount > 0 ? `, after a discount of ${pct(totals.discountPct)} (${money2(totals.discount)})` : ""}.`,
        `This ${noun} is valid until ${date(quote.validUntil)}.`,
      ];
    case "terms":
      return [
        `Payment terms are ${paymentTermsOf(pack, quote).paymentTerms}.`,
        `The full terms are in the Terms section of this ${noun}.`,
      ];
    case "timing":
      return [
        `Here is the ${labels.timing.toLowerCase()} for each line:`,
        ...quote.lineItems.slice(0, 6).map((l) => `${l.name}: ${timingOf(l)}`),
        ...(quote.lineItems.length > 6
          ? [`And ${quote.lineItems.length - 6} more in the line items table.`]
          : []),
      ];
    case "accept":
      if (quote.status === "Accepted")
        return [
          `This ${noun} was accepted on ${date(quote.acceptedAt ?? quote.createdAt)}. There is nothing more you need to do.`,
        ];
      if (acceptMethod === "print")
        return [
          `Print this ${noun}, sign it under Acceptance, and return it to ${owner?.name ?? "your sales representative"}.`,
        ];
      if (acceptMethod === "click")
        return ["Scroll to the Acceptance section and click Accept."];
      return [
        "Scroll to the Acceptance section and click Sign now.",
        "You can draw, type, or upload your signature, then click I agree to finish.",
      ];
    case "handoff":
      return [
        `I am connecting you with ${owner?.name ?? "your sales representative"}, who owns this ${noun}.`,
        `${owner?.name.split(" ")[0] ?? "They"} will reply here${owner ? `, or you can write to ${owner.email}` : ""}.`,
      ];
    default:
      return [
        `I could not find that in this ${noun} or the documents I have.`,
        "Would you like me to connect you with your sales representative for further assistance?",
      ];
  }
}

/** The questions the agent can answer from the quote alone, as the buyer would ask them. */
export function quoteQuestions(pack: Pack): [Topic, string][] {
  const labels = labelsOf(pack).pack;
  return [
    ["total", "What is the total?"],
    ["terms", "What are the payment terms?"],
    ["timing", labels.agent.timing],
    ["accept", `How do I accept this ${labels.document.heading.toLowerCase()}?`],
  ];
}

/**
 * One conversation with the closing agent. The buyer's conversation is kept with the quote; a test conversation
 * in the editor lives only as long as the editor is open, because buyers never see messages from testing.
 */
function useAgentChat(quote: Quote, test: boolean) {
  const { pack, world, dispatch } = useShell();
  const s = useQuoteSettings(quote);
  const { library, added } = useClosingAgent(quote);
  const [local, setLocal] = useState<Message[]>([]);
  const key = `q.${quote.id}.chat`;
  const stored = world.ui[key];
  const messages: Message[] = test ? local : stored ? (JSON.parse(stored) as Message[]) : [];
  const files = library.map((file, n) => ({ ...file, key: `file-${n}` })).filter((file) => added.includes(file.name));
  const quickReplies: [string, string][] = [...files.map((file): [string, string] => [file.key, file.question]), ...quoteQuestions(pack), ["handoff", "Talk to a representative"]];
  const send = (text: string, picked?: string) => {
    const said = text.trim();
    if (!said) return;
    const last = messages[messages.length - 1];
    const offered = last?.from === "agent" && !last.topic;
    // A knowledge file added to the quote answers before the quote does, because it is the more specific source.
    const file = picked ? files.find((f) => f.key === picked) : files.find((f) => new RegExp(`\\b(${f.keywords.join("|")})`, "i").test(said));
    const topic: Topic | null = file
      ? null
      : ((picked as Topic | undefined) ?? (offered && /^(yes|yeah|sure|ok|okay|please)\b/i.test(said) ? "handoff" : (SUBJECTS.find(([, pattern]) => pattern.test(said))?.[0] ?? null)));
    const about = file?.key ?? topic;
    const at = nowMs();
    const next: Message[] = [
      ...messages,
      { from: "buyer", text: [said], at, ...(about ? { topic: about } : {}) },
      { from: "agent", text: file ? [file.answer, `Source: ${file.name}`] : answer(topic, pack, quote, s.get("accept")), at, ...(about ? { topic: about } : {}) },
    ];
    if (test) setLocal(next);
    else dispatch({ t: "ui", k: key, v: JSON.stringify(next) });
  };
  const asked = new Set(messages.map((m) => m.topic));
  return { messages, send, quickReplies: quickReplies.filter(([topic]) => !asked.has(topic)).slice(0, 5) };
}

/** The chat window: the agent's name on the brand color, the conversation, quick replies, and the message field. */
export function ChatWindow({
  quote,
  test = false,
  onClose,
  className,
}: {
  quote: Quote;
  test?: boolean;
  onClose?: () => void;
  className?: string;
}) {
  const { pack } = useShell();
  const labels = labelsOf(pack).pack.agent;
  const name = fill(labels.name, { company: pack.portal.company });
  const { messages, send, quickReplies } = useAgentChat(quote, test);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight });
  }, [messages.length, typing]);

  // The answer is already in the conversation; the dots only hold it back for a moment, as the agent does while it reads.
  const say = (text: string, topic?: string) => {
    if (!text.trim()) return;
    send(text, topic);
    setDraft("");
    setTyping(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setTyping(false), 450);
  };
  const shown = typing ? messages.slice(0, -1) : messages;
  const bubble =
    "max-w-[236px] rounded-[10px] bg-[#f3f2f1] px-3 py-2 text-[13px] leading-snug [overflow-wrap:anywhere]";

  return (
    <section
      className={cx(
        "flex min-h-0 flex-col overflow-hidden bg-white",
        className,
      )}
      aria-label={`Chat with ${name}`}
      data-testid="closing-agent-chat"
    >
      <header
        className="flex shrink-0 items-center gap-2.5 px-4 py-3 text-white"
        style={{ background: BRAND }}
      >
        <AgentAvatar name={name} size={30} online />
        <h2
          className="min-w-0 flex-1 truncate text-[14px] font-bold"
          data-testid="closing-agent-name"
        >
          {name}
        </h2>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className="rounded p-1 hover:bg-white/15"
            data-testid="closing-agent-close"
          >
            <Icon name="close" size={18} />
          </button>
        ) : null}
      </header>
      <div
        ref={list}
        className="hs-scroll min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3"
        data-testid="closing-agent-messages"
      >
        <div className="flex gap-2">
          <AgentAvatar name={name} size={26} />
          <div className="space-y-1.5">
            <p className={bubble}>{labels.welcome}</p>
            <p className={bubble}>{labels.firstAction}</p>
          </div>
        </div>
        {shown.map((m, i) =>
          m.from === "buyer" ? (
            <div key={i} className="flex justify-end pt-1">
              <div
                className="max-w-[236px] rounded-[10px] px-3 py-2 text-[13px] leading-snug text-white"
                style={{ background: BRAND }}
                data-testid="closing-agent-question"
              >
                <p>{m.text[0]}</p>
                <p className="mt-0.5 text-right text-[10.5px] opacity-80">
                  {time(new Date(m.at).toISOString())}
                </p>
              </div>
            </div>
          ) : (
            <div key={i} className="flex gap-2">
              <AgentAvatar name={name} size={26} />
              <div>
                <p className="mb-1 text-[12px] font-bold">{name}</p>
                <div
                  className={cx(bubble, "space-y-1.5")}
                  data-testid="closing-agent-answer"
                >
                  {m.text.map((line, n) => (
                    <p key={n}>{line}</p>
                  ))}
                  <p className="text-[10.5px] text-ink-muted">
                    {time(new Date(m.at).toISOString())}
                  </p>
                </div>
              </div>
            </div>
          ),
        )}
        {typing ? (
          <div className="flex gap-2" data-testid="closing-agent-typing">
            <AgentAvatar name={name} size={26} />
            <p
              className={cx(bubble, "flex items-center gap-1 py-3")}
              aria-label={`${name} is typing`}
            >
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7c8a99]"
                  style={{ animationDelay: `${dot * 120}ms` }}
                />
              ))}
            </p>
          </div>
        ) : quickReplies.length > 0 ? (
          <div
            className="flex flex-wrap justify-end gap-1.5 pt-1"
            data-testid="closing-agent-quick-replies"
          >
            {quickReplies.map(([topic, label]) => (
              <button
                key={topic}
                type="button"
                onClick={() => say(label, topic)}
                className="rounded-full border px-2.5 py-1 text-[12px] font-semibold hover:bg-[#f3f2f1]"
                style={{ borderColor: BRAND, color: BRAND }}
                data-testid={`closing-agent-reply-${topic}`}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <form
        className="shrink-0 px-3 pb-3 pt-1"
        onSubmit={(e) => {
          e.preventDefault();
          say(draft);
        }}
      >
        <div className="flex h-9 items-center gap-2 rounded-full border border-[#7c8a99] pl-3.5 pr-2 focus-within:border-ink">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              messages.length > 0 ? "Write a message..." : "Ask me anything..."
            }
            aria-label="Message"
            className="min-w-0 flex-1 bg-transparent text-[13px] focus:outline-none focus-visible:outline-none"
            data-testid="closing-agent-input"
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={!draft.trim()}
            className="rounded p-1 text-ink-muted hover:text-ink disabled:opacity-50"
            data-testid="closing-agent-send"
          >
            <Icon name="send" size={16} />
          </button>
        </div>
      </form>
    </section>
  );
}

/** The agent on the published quote: it sits in the right panel beside the document. */
export function ClosingAgentPanel({
  quote,
  className,
}: {
  quote: Quote;
  className?: string;
}) {
  const { on } = useClosingAgent(quote);
  if (!on) return null;
  return (
    <ChatWindow
      quote={quote}
      className={cx("w-[300px] shrink-0 border-l border-line-soft", className)}
    />
  );
}
