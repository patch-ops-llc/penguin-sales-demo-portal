"use client";

import { useEffect, useState } from "react";
import { quoteTotals } from "@/store/quote-math";
import { useShell } from "@/store/store";
import type { Quote } from "@/verticals/types";
import { money2 } from "../format";
import { Icon } from "../icons";
import { contactName } from "../pages/lists";
import { cx, LineTabs } from "../ui";
import { BuyerView, quoteLink } from "./buyer";

const field = "h-9 w-full rounded-[4px] border border-line bg-white px-3 text-[13.5px] focus:border-ink focus:outline-none";
const label = "mb-1 block text-[12.5px] font-semibold";
const dark = "inline-flex h-9 items-center justify-center rounded-[4px] bg-ink px-4 text-[13px] font-semibold text-white hover:bg-[#333]";

/**
 * What HubSpot shows after Share finalizes a quote: "Quote created and ready to send", with the
 * quote email on one tab and the link and PDF on the other. Nothing leaves the portal.
 *
 * It opens by itself when a scripted step shares the quote, so it covers the quote page only and
 * leaves the demo bar free.
 */
export function ShareDialog({ quote, onClose, onSent }: { quote: Quote; onClose: () => void; onSent: (message: string) => void }) {
  const { world, pack } = useShell();
  const [tab, setTab] = useState<"email" | "link">("email");
  const contact = world.contacts.find((c) => c.id === quote.contactId);
  const owner = pack.personas.find((p) => p.id === quote.ownerId);
  const [subject, setSubject] = useState(`${pack.portal.company} has sent you a quote`);
  const [message, setMessage] = useState("");
  const [cc, setCc] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pdf, setPdf] = useState(false);
  const link = `https://${quoteLink(pack.portal.hubId, quote)}`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-[rgba(20,20,20,0.5)] p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Quote created and ready to send" className="hs-pop flex max-h-full w-[1080px] flex-col overflow-hidden rounded-[8px] bg-white shadow-[0_20px_60px_rgba(20,20,20,0.35)]" data-testid="share-dialog">
        <header className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-[17px] font-semibold">Quote created and ready to send</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-ink-muted hover:bg-[#f0f0f0]">
            <Icon name="close" size={18} />
          </button>
        </header>

        <div className="hs-scroll grid min-h-0 grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-8 overflow-y-auto px-6 py-4">
          <div className="min-w-0">
            <LineTabs
              tabs={[
                { id: "email", label: "Send quote email", testId: "share-tab-email" },
                { id: "link", label: "Copy link or download PDF", testId: "share-tab-link" },
              ]}
              value={tab}
              onChange={setTab}
            />
            {tab === "email" ? (
              <div className="mt-4 space-y-3">
                <div>
                  <label className={label} htmlFor="share-to">
                    To
                  </label>
                  <select id="share-to" className={field} defaultValue={contact?.email}>
                    <option value={contact?.email}>
                      {contactName(contact)} ({contact?.email})
                    </option>
                  </select>
                  {cc ? (
                    <input className={cx(field, "mt-2")} placeholder="Cc" aria-label="Cc recipients" autoFocus />
                  ) : (
                    <button type="button" className="mt-1.5 text-[12.5px] font-semibold text-link hover:underline" onClick={() => setCc(true)}>
                      Add Cc recipients
                    </button>
                  )}
                </div>
                <div>
                  <label className={label} htmlFor="share-from">
                    From
                  </label>
                  <select id="share-from" className={field} defaultValue={owner?.email}>
                    <option value={owner?.email}>
                      {owner?.name} ({owner?.email})
                    </option>
                  </select>
                </div>
                <div>
                  <label className={label} htmlFor="share-subject">
                    Subject
                  </label>
                  <input id="share-subject" className={field} value={subject} onChange={(e) => setSubject(e.target.value)} />
                </div>
                <div className="rounded-[4px] border border-line">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    placeholder="Write your message here..."
                    aria-label="Email message"
                    className="block w-full resize-none rounded-t-[4px] px-3 py-2 text-[13.5px] focus:outline-none"
                  />
                  <p className="flex gap-4 border-t border-line-soft px-3 py-1.5 text-[12.5px] font-semibold text-[#9a9a9a]" title="Not part of this demo">
                    <span>Templates</span>
                    <span>Documents</span>
                    <span>Meetings</span>
                  </p>
                </div>
                <div className="flex items-center gap-4 pt-1">
                  <button type="button" className={dark} data-testid="share-send-email" onClick={() => onSent(`Quote email sent to ${contactName(contact)}`)}>
                    Send quote email
                  </button>
                  <span className="text-[12.5px] font-semibold text-[#9a9a9a]" title="Not part of this demo">
                    Create custom email in your CRM
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-[13.5px]">Copy the quote link or download the quote PDF file to share with your client.</p>
                <div className="mt-3 flex">
                  <input readOnly value={link} aria-label="Quote link" className={cx(field, "rounded-r-none")} data-testid="share-link" onFocus={(e) => e.target.select()} />
                  <button
                    type="button"
                    className={cx(dark, "shrink-0 rounded-l-none")}
                    data-testid="share-copy-link"
                    onClick={() => {
                      void navigator.clipboard?.writeText(link).catch(() => undefined);
                      setCopied(true);
                    }}
                  >
                    {copied ? "Copied" : "Copy link"}
                  </button>
                </div>
                <hr className="my-4 border-line-soft" />
                <button type="button" className={cx(dark, "w-full")} onClick={() => setPdf(true)}>
                  Download PDF
                </button>
                {pdf ? <p className="mt-2 text-[12.5px] text-ink-muted">PDF download is not part of this demo.</p> : null}
              </div>
            )}
          </div>

          <div className="min-w-0">
            {tab === "email" ? (
              <div className="rounded-[6px] border border-line bg-[#f5f8fa] p-5" data-testid="share-email-preview">
                <p className="text-[12px] text-ink-muted">
                  To: {contact?.email}
                  <br />
                  From: {owner?.email}
                </p>
                <p className="mt-2 text-[14px] font-semibold">{subject}</p>
                <div className="mt-3 rounded-[6px] bg-white p-5 text-[13px]">
                  {message ? <p className="mb-3 whitespace-pre-wrap">{message}</p> : null}
                  <p className="text-[15px] font-semibold">
                    {quote.number}: {quote.title}
                  </p>
                  <p className="mt-1 text-ink-muted">
                    {quote.lineItems.length} line items · Total {money2(quoteTotals(quote).total)}
                  </p>
                  <p className="mt-4 inline-flex h-9 items-center rounded-[4px] bg-[#33475b] px-5 text-[13px] font-semibold text-white">View quote</p>
                  <p className="mt-4 flex items-center gap-1.5 text-[12px] text-ink-muted">
                    <Icon name="paperclip" size={13} /> {quote.number}.pdf
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-[6px] border border-line" data-testid="share-link-preview">
                <p className="flex gap-1.5 border-b border-line-soft bg-white px-3 py-2" aria-hidden="true">
                  <span className="h-2 w-2 rounded-full bg-[#5f5f5f]" />
                  <span className="h-2 w-2 rounded-full bg-[#5f5f5f]" />
                  <span className="h-2 w-2 rounded-full bg-[#5f5f5f]" />
                </p>
                <div className="h-[400px] overflow-hidden">
                  <div className="pointer-events-none w-[200%] origin-top-left scale-50" inert>
                    <BuyerView quote={quote} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="border-t border-line px-6 py-3.5">
          <button type="button" onClick={onClose} className="inline-flex h-9 items-center rounded-[4px] border border-ink bg-white px-4 text-[13px] font-semibold hover:bg-[#f5f5f5]" data-testid="share-close">
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
