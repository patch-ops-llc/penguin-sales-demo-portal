"use client";

import { useState } from "react";
import { useShell } from "@/store/store";
import { labelsOf } from "@/verticals/labels";
import type { Pack, Quote } from "@/verticals/types";
import { Icon } from "../icons";
import { Button } from "../ui";
import { answer, quoteQuestions, useClosingAgent } from "./closing-agent";
import { useQuoteSettings } from "./settings";
import { Switch } from "./sidebar";

export { ClosingAgentStatus } from "./closing-agent-status";

type Sample = { question: string; answer: string[] | null; source: string };

/**
 * The knowledge score: how many of the questions buyers commonly ask the agent can answer from the quote
 * and from the given quote-specific files.
 */
function knowledge(pack: Pack, quote: Quote, acceptMethod: string, files: string[]) {
  const samples: Sample[] = [
    ...quoteQuestions(pack).map(([topic, question]): Sample => ({ question, answer: answer(topic, pack, quote, acceptMethod), source: `This ${labelsOf(pack).pack.document.heading.toLowerCase()}` })),
    ...labelsOf(pack).pack.agent.files.map((file): Sample => ({ question: file.question, answer: files.includes(file.name) ? [file.answer] : null, source: file.name })),
  ];
  const answered = samples.filter((sample) => sample.answer).length;
  const score = Math.round((answered / samples.length) * 100);
  return { samples, answered, score, level: score >= 85 ? "High" : score >= 55 ? "Medium" : "Low" };
}

function Disclosure({ label, testId, startOpen = false, children }: { label: string; testId: string; startOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(startOpen);
  return (
    <div className="mt-3">
      <button type="button" className="hs-link inline-flex items-center gap-1 text-[13px]" aria-expanded={open} onClick={() => setOpen((o) => !o)} data-testid={testId}>
        <Icon name={open ? "chevronDown" : "chevronRight"} size={14} /> {label}
      </button>
      {open ? <div className="mt-2">{children}</div> : null}
    </div>
  );
}

/** The slide-in file picker: files already in the files tool, or one from the rep's device. Nothing is uploaded; a picked file is kept by name. */
function AddFiles({ library, added, noun, onInsert, onClose }: { library: string[]; added: string[]; noun: string; onInsert: (names: string[]) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [all, setAll] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [local, setLocal] = useState<string[]>([]);
  const available = [...local, ...library].filter((name) => !added.includes(name));
  const matches = available.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase()));
  const shown = all || query.trim() ? matches : matches.slice(0, local.length + 2);
  const toggle = (name: string) => setPicked((names) => (names.includes(name) ? names.filter((n) => n !== name) : [...names, name]));
  return (
    <div className="hs-slide-in absolute inset-0 z-10 flex flex-col bg-white" data-testid="agent-add-files">
      <header className="flex items-center gap-2 border-b border-line-soft px-5 py-4">
        <button type="button" onClick={onClose} aria-label="Back" className="rounded p-1 text-ink-muted hover:bg-[#f0f0f0]">
          <Icon name="chevronLeft" size={17} />
        </button>
        <h3 className="text-[16px] font-semibold">Add file</h3>
      </header>
      <div className="hs-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div className="flex gap-2">
          <label className="relative min-w-0 flex-1">
            <Icon name="search" size={15} className="pointer-events-none absolute left-2.5 top-2.5 text-ink-muted" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search files" aria-label="Search files" className="h-9 w-full rounded-[4px] border border-[#7c98b6] pl-8 pr-3 text-[13.5px] focus:border-ink focus:outline-none" data-testid="agent-file-search" />
          </label>
          <label className="inline-flex h-9 cursor-pointer items-center rounded-[4px] border border-ink px-3 text-[13px] font-semibold hover:bg-[#f5f5f5]">
            Upload
            <input
              type="file"
              className="sr-only"
              data-testid="agent-file-upload"
              onChange={(e) => {
                const name = e.target.files?.[0]?.name;
                if (!name || added.includes(name) || library.includes(name)) return;
                setLocal((names) => (names.includes(name) ? names : [name, ...names]));
                setPicked((names) => (names.includes(name) ? names : [...names, name]));
              }}
            />
          </label>
        </div>
        <div className="mt-5 flex items-center justify-between">
          <h4 className="text-[13.5px] font-semibold">{all || query.trim() ? "All files" : "Recently updated"}</h4>
          {matches.length > shown.length ? (
            <button type="button" className="hs-link text-[13px]" onClick={() => setAll(true)} data-testid="agent-files-view-all">
              View all
            </button>
          ) : null}
        </div>
        {shown.length === 0 ? (
          <p className="mt-3 text-[13px] text-ink-muted">{available.length === 0 ? `Every file is already on this ${noun}.` : "No files match your search."}</p>
        ) : (
          <ul className="mt-2 divide-y divide-line-soft border-y border-line-soft">
            {shown.map((name) => (
              <li key={name}>
                <label className="flex cursor-pointer items-center gap-2.5 py-2.5 text-[13.5px] hover:bg-[#fafafa]">
                  <input type="checkbox" checked={picked.includes(name)} onChange={() => toggle(name)} data-testid={`agent-file-${library.indexOf(name)}`} />
                  <Icon name="file" size={16} className="shrink-0 text-ink-muted" />
                  <span className="min-w-0 flex-1 truncate">{name}</span>
                  {local.includes(name) ? <span className="shrink-0 text-[12px] text-ink-muted">From your device</span> : null}
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
      <footer className="flex gap-2 border-t border-line-soft bg-[#fafafa] px-5 py-3">
        <Button variant="primary" disabled={picked.length === 0} onClick={() => onInsert(picked)} data-testid="agent-insert-files">
          Insert files
        </Button>
        <Button onClick={onClose}>Cancel</Button>
      </footer>
    </div>
  );
}

/**
 * The closing agent's panel in the quote editor: the switch, the quote-specific knowledge files, and the
 * knowledge score. The switch takes effect on Save; files and the score are kept as they change.
 */
export function ClosingAgentSettings({ quote, onClose }: { quote: Quote; onClose: () => void }) {
  const { pack } = useShell();
  const s = useQuoteSettings(quote);
  const agent = useClosingAgent(quote);
  const [on, setOn] = useState(agent.on);
  const [adding, setAdding] = useState(false);
  const [where, setWhere] = useState(false);
  const noun = labelsOf(pack).pack.document.heading.toLowerCase();
  const scored = knowledge(pack, quote, s.get("accept"), agent.scored);
  const stale = agent.added.join("|") !== agent.scored.join("|");
  const levelColor = scored.level === "High" ? "#00bda5" : scored.level === "Medium" ? "#f5c26b" : "#f2545b";
  const heading = "text-[14px] font-semibold";

  return (
    <aside className="hs-slide-in absolute inset-y-0 right-0 z-30 flex w-[400px] max-w-full flex-col border-l border-line bg-white shadow-[-6px_0_24px_rgba(20,20,20,0.12)]" aria-label="Closing agent" data-testid="closing-agent-settings">
      <header className="flex items-center gap-2 px-5 py-4">
        <h2 className="text-[17px] font-semibold">Closing agent</h2>
        <button type="button" onClick={onClose} aria-label="Close" className="ml-auto rounded p-1 text-ink-muted hover:bg-[#f0f0f0]" data-testid="closing-agent-settings-close">
          <Icon name="close" size={17} />
        </button>
      </header>

      <div className="hs-scroll min-h-0 flex-1 overflow-y-auto">
        <section className="border-t border-line-soft px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className={heading}>Turn on closing agent</h3>
            <span data-testid="closing-agent-switch">
              <Switch on={on} onChange={() => setOn((value) => !value)} label="Turn on closing agent" />
            </span>
          </div>
          <p className="mt-1.5 text-[12.5px] text-ink-muted">Buyers can ask the agent questions while they view the {noun}.</p>
          <button type="button" className="hs-link mt-3 inline-flex items-center gap-1 text-[13px]" onClick={() => setWhere((value) => !value)} aria-expanded={where} data-testid="closing-agent-configuration">
            Closing agent configuration <Icon name="external" size={13} />
          </button>
          {where ? (
            <p className="mt-2 rounded-[6px] bg-[#fafafa] px-3 py-2 text-[12.5px] text-ink-muted" data-testid="closing-agent-configuration-note">
              The agent&apos;s name, knowledge sources, handoff rules, and messages are set by a Super Admin in Revenue &gt; Closing Agent &gt; Manage.
            </p>
          ) : null}
        </section>

        <section className="border-t border-line-soft px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className={heading}>Quote-specific knowledge</h3>
            <button type="button" className="hs-link inline-flex items-center gap-1 text-[13px]" onClick={() => setAdding(true)} data-testid="agent-add-file">
              <Icon name="plus" size={13} /> Add file
            </button>
          </div>
          <p className="mt-1.5 text-[12.5px] text-ink-muted">Files the agent uses to answer questions about this {noun} only.</p>
          <Disclosure key={agent.added.length > 0 ? "files" : "none"} startOpen={agent.added.length > 0} label={`See files (${agent.added.length})`} testId="agent-see-files">
            {agent.added.length === 0 ? (
              <p className="text-[13px] text-ink-muted">No files have been added to this {noun}.</p>
            ) : (
              <ul className="space-y-1.5" data-testid="agent-files">
                {agent.added.map((name) => (
                  <li key={name} className="flex items-center gap-2 rounded-[6px] border border-line px-2.5 py-1.5 text-[13px]">
                    <Icon name="file" size={15} className="shrink-0 text-ink-muted" />
                    <span className="min-w-0 flex-1 truncate">{name}</span>
                    <button type="button" aria-label={`Remove ${name}`} className="rounded p-0.5 text-ink-muted hover:bg-[#f0f0f0]" onClick={() => agent.setAdded(agent.added.filter((n) => n !== name))}>
                      <Icon name="close" size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Disclosure>
        </section>

        <section className="border-t border-line-soft px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className={heading}>Knowledge score</h3>
            <button type="button" className="hs-link inline-flex items-center gap-1 text-[13px]" onClick={() => agent.setScored(agent.added)} data-testid="agent-refresh-score">
              <Icon name="refresh" size={13} /> Refresh score
            </button>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <p className="text-[26px] font-bold leading-none tabular-nums" data-testid="agent-score">
              {scored.score}
            </p>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[13px] font-semibold" data-testid="agent-score-level">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: levelColor }} aria-hidden="true" /> {scored.level}
              </p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#eaf0f6]" aria-hidden="true">
                <div className="h-full rounded-full" style={{ width: `${scored.score}%`, background: levelColor }} />
              </div>
            </div>
          </div>
          <p className="mt-2 text-[12.5px] text-ink-muted">
            The agent can answer {scored.answered} of {scored.samples.length} common buyer questions.
          </p>
          {stale ? (
            <p className="mt-2 rounded-[6px] bg-[#fef8f0] px-3 py-2 text-[12.5px]" data-testid="agent-score-stale">
              The files on this {noun} have changed. Click Refresh score to get a new knowledge score.
            </p>
          ) : null}
          <Disclosure label="See details" testId="agent-score-details">
            <ul className="space-y-2.5" data-testid="agent-score-samples">
              {scored.samples.map((sample) => (
                <li key={sample.question} className="rounded-[6px] border border-line px-3 py-2 text-[12.5px]">
                  <p className="font-semibold">{sample.question}</p>
                  {sample.answer ? (
                    <>
                      {sample.answer.map((line, n) => (
                        <p key={n} className={n === 0 ? "mt-1" : "mt-0.5"}>
                          {line}
                        </p>
                      ))}
                      <p className="mt-1 text-[11.5px] text-ink-muted">Source: {sample.source}</p>
                    </>
                  ) : (
                    <p className="mt-1 text-ink-muted">No answer in the agent&apos;s knowledge for this {noun}.</p>
                  )}
                </li>
              ))}
            </ul>
          </Disclosure>
        </section>
      </div>

      <footer className="flex gap-2 border-t border-line-soft bg-[#fafafa] px-5 py-3">
        <Button
          variant="primary"
          disabled={on === agent.on}
          data-testid="closing-agent-save"
          onClick={() => {
            agent.setOn(on);
            onClose();
          }}
        >
          Save
        </Button>
        <Button onClick={onClose}>Cancel</Button>
      </footer>

      {adding ? (
        <AddFiles
          noun={noun}
          library={agent.library.map((file) => file.name)}
          added={agent.added}
          onClose={() => setAdding(false)}
          onInsert={(names) => {
            agent.setAdded([...agent.added, ...names]);
            setAdding(false);
          }}
        />
      ) : null}
    </aside>
  );
}
