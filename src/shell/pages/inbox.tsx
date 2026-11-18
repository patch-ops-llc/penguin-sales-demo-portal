"use client";

import { useState } from "react";
import { ParsedRfqCard } from "@/demos/email-to-deal/parsed-card";
import { useShell } from "@/store/store";
import { dateTime, relative } from "../format";
import { Icon } from "../icons";
import { A, Avatar, Card, colorFor, cx, Empty, Tag } from "../ui";
import { companyOf } from "./lists";

/** The shared inbox: thread list, the open email with its attachment, and the parsed request beside it. */
export function InboxPage() {
  const { world, pack, dispatch } = useShell();
  const [hovered, setHovered] = useState<string | null>(null);
  const samples = pack.demos.emailToDeal.sampleIds;
  const thread = world.threads.find((t) => t.id === world.ui["inbox.thread"]);
  const company = thread ? companyOf(world, thread.companyId) : undefined;
  const contact = thread ? world.contacts.find((c) => c.id === thread.contactId) : undefined;

  return (
    <div className="grid h-full grid-cols-[320px_minmax(0,1fr)_360px]" data-testid="inbox-page">
      <aside className="hs-scroll overflow-y-auto border-r border-line bg-white">
        <header className="border-b border-line-soft px-4 py-3">
          <h1 className="text-[16px] font-semibold">Inbox</h1>
          <p className="text-[12.5px] text-ink-muted">sales@{pack.portal.domain} · {world.threads.filter((t) => t.unread).length} unread</p>
        </header>
        <ul>
          {world.threads.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => dispatch([{ t: "ed.open", threadId: t.id }, ...(samples.includes(t.id) ? [{ t: "flag" as const, k: "ed.opened" }] : [])])}
                data-testid={`thread-${t.id}`}
                className={cx("block w-full border-b border-line-soft px-4 py-3 text-left hover:bg-[#f7f7f7]", thread?.id === t.id && "bg-[#f1f7f7]")}
              >
                <span className="flex items-center gap-2">
                  {t.unread ? <span className="h-2 w-2 shrink-0 rounded-full bg-hs-orange" /> : null}
                  <span className={cx("truncate text-[13.5px]", t.unread ? "font-bold" : "font-semibold")}>{t.from.name}</span>
                  <span className="ml-auto shrink-0 text-[11.5px] text-ink-muted">{relative(t.at)}</span>
                </span>
                <span className={cx("mt-0.5 block truncate text-[13px]", t.unread && "font-semibold")}>{t.subject}</span>
                <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-ink-muted">
                  {t.attachment ? <Icon name="paperclip" size={12} className="shrink-0" /> : null}
                  <span className="truncate">{t.preview}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="hs-scroll min-w-0 overflow-y-auto px-5 py-4">
        {!thread ? (
          <Card>
            <Empty title="Select a conversation">New requests for quotes and purchase orders land here.</Empty>
          </Card>
        ) : (
          <article className="rounded-[10px] border border-line bg-white" data-testid="thread-view">
            <header className="border-b border-line-soft px-5 py-4">
              <h2 className="text-[17px] font-semibold">{thread.subject}</h2>
              <div className="mt-2.5 flex items-center gap-3">
                <Avatar name={thread.from.name} color={colorFor(thread.from.email)} size={34} />
                <div className="min-w-0 text-[13px]">
                  <p className="font-semibold">
                    {contact ? (
                      <A to={`/contacts/${contact.id}`} className="hs-link">
                        {thread.from.name}
                      </A>
                    ) : (
                      thread.from.name
                    )}
                    <span className="font-normal text-ink-muted"> &lt;{thread.from.email}&gt;</span>
                  </p>
                  <p className="text-ink-muted">
                    {company ? `${company.name} · ` : ""}
                    {dateTime(thread.at)}
                  </p>
                </div>
              </div>
            </header>
            <div className="whitespace-pre-line px-5 py-4 text-[14px] leading-relaxed" data-testid="thread-body">
              {thread.body.map((segment, i) =>
                segment.field ? (
                  <mark key={i} className={cx("rounded px-0.5", hovered === segment.field ? "bg-[#ffd37a]" : world.ui["inbox.review"] === thread.id ? "bg-[#fff1c9]" : "bg-transparent")}>
                    {segment.text}
                  </mark>
                ) : (
                  <span key={i}>{segment.text}</span>
                ),
              )}
            </div>
            {thread.attachment ? (
              <div className="border-t border-line-soft px-5 py-4" data-testid="thread-attachment">
                <p className="flex items-center gap-2 text-[13px] font-semibold">
                  <Icon name="paperclip" size={14} /> {thread.attachment.name} <Tag>{thread.attachment.kind}</Tag>
                </p>
                <div className="mt-2 rounded-[6px] border border-line bg-[#fafafa] px-5 py-4 font-mono text-[12px] leading-relaxed">
                  <p className="mb-2 font-sans text-[13px] font-bold">{thread.attachment.title}</p>
                  {thread.attachment.lines.map((line, i) => (
                    <p key={i} className="whitespace-pre">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
          </article>
        )}
      </section>

      <aside className="hs-scroll space-y-3 overflow-y-auto border-l border-line bg-[#f7f7f7] px-3 py-4">
        {thread ? (
          <>
            {thread.parsed ? <ParsedRfqCard thread={thread} onHoverField={setHovered} /> : null}
            <Card title="Contact">
              {contact ? (
                <p className="text-[13px]">
                  <A to={`/contacts/${contact.id}`} className="hs-link">
                    {contact.firstName} {contact.lastName}
                  </A>
                  <span className="block text-ink-muted">{contact.title}</span>
                  <span className="block text-ink-muted">{company?.name}</span>
                </p>
              ) : (
                <p className="text-[12.5px] text-ink-muted">Not matched to a contact.</p>
              )}
            </Card>
          </>
        ) : null}
      </aside>
    </div>
  );
}
