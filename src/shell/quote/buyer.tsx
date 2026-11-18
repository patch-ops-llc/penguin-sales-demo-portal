"use client";

import { useState } from "react";
import { nowMs } from "@/lib/format";
import { useShell } from "@/store/store";
import type { Quote } from "@/verticals/types";
import { Icon } from "../icons";
import { contactName } from "../pages/lists";
import { A, Avatar, Card, cx, Empty, Modal } from "../ui";
import { AcceptanceCard, QuoteDocument } from "./document";
import { useQuoteSettings } from "./settings";

const chip = "inline-flex h-8 items-center gap-1.5 rounded-[4px] border border-line bg-white px-3 text-[12.5px] hover:bg-[#f5f5f5]";

/**
 * The published quote as the buyer sees it: the sender, Print and Download, the acceptance banner,
 * and the document. The editor's preview shows the same thing with the actions switched off.
 */
export function BuyerView({ quote, interactive = false, narrow = false }: { quote: Quote; interactive?: boolean; narrow?: boolean }) {
  const { pack, dispatch } = useShell();
  const s = useQuoteSettings(quote);
  const [signing, setSigning] = useState(false);
  const owner = pack.personas.find((p) => p.id === quote.ownerId);
  const accepted = quote.status === "Accepted";
  const accept = () => {
    dispatch({ t: "quote.accept", id: quote.id, at: nowMs() });
    setSigning(false);
  };
  const print = interactive ? () => window.print() : undefined;
  return (
    <div className="flex min-h-full flex-col bg-[#e1e8f0]">
      <div className="flex items-center gap-3 border-b border-line-soft bg-white px-5 py-2.5">
        <Avatar name={owner?.name ?? pack.portal.company} color={owner?.color} size={30} />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[13px] font-semibold">{owner?.name}</p>
          <p className="truncate text-[12px] text-ink-muted">{owner?.email}</p>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button type="button" className={chip} onClick={print} disabled={!interactive}>
            Print
          </button>
          <button type="button" className={chip} onClick={print} disabled={!interactive}>
            Download (PDF)
          </button>
        </div>
      </div>
      <p className={cx("px-5 py-1.5 text-center text-[12.5px] font-semibold text-white", accepted ? "bg-[#00a38d]" : "bg-[#33475b]")} data-testid="buyer-banner">
        {accepted ? "Accepted" : "Waiting for acceptance"}
      </p>
      <div className={cx("mx-auto w-full flex-1 px-6 py-7", narrow ? "max-w-[430px] px-3" : "max-w-[940px]")}>
        <QuoteDocument quote={quote} acceptance={<AcceptanceCard quote={quote} onSign={interactive && !accepted ? (s.get("accept") === "esign" ? () => setSigning(true) : accept) : undefined} />} />
      </div>
      {signing ? <SignDialog quote={quote} onClose={() => setSigning(false)} onInsert={accept} /> : null}
    </div>
  );
}

/** The e-signature step, cut down to the one choice that matters in a demo: type the name and insert it. */
function SignDialog({ quote, onClose, onInsert }: { quote: Quote; onClose: () => void; onInsert: () => void }) {
  const { world } = useShell();
  const contact = world.contacts.find((c) => c.id === quote.contactId);
  const [name, setName] = useState(contactName(contact));
  return (
    <Modal
      title="Add your signature"
      onClose={onClose}
      width={520}
      testId="buyer-sign-dialog"
      footer={
        <>
          <button type="button" className={chip} onClick={onClose}>
            Cancel
          </button>
          <button type="button" disabled={!name.trim()} onClick={onInsert} data-testid="buyer-sign-insert" className="inline-flex h-8 items-center rounded-[4px] bg-[#0061fe] px-4 text-[12.5px] font-semibold text-white hover:bg-[#0052d9] disabled:bg-[#cfcfcf]">
            Insert
          </button>
        </>
      }
    >
      <div className="flex gap-5 border-b border-line-soft text-[13.5px]">
        <span className="-mb-px border-b-2 border-transparent pb-2 text-ink-muted">Draw</span>
        <span className="-mb-px border-b-2 border-[#0061fe] pb-2 font-semibold">Type</span>
        <span className="-mb-px border-b-2 border-transparent pb-2 text-ink-muted">Upload</span>
      </div>
      <input value={name} onChange={(e) => setName(e.target.value)} aria-label="Type your name" className="mt-4 h-9 w-full rounded-[4px] border border-line px-3 text-[13.5px] focus:border-ink focus:outline-none" />
      <p className="mt-4 flex h-24 items-center justify-center rounded-[6px] border border-dashed border-line bg-[#fafafa] text-[38px] [font-family:'Brush_Script_MT','Segoe_Script',cursive]">{name}</p>
      <p className="mt-3 text-[12px] text-ink-muted">By inserting your signature you agree to sign this quote electronically.</p>
    </Modal>
  );
}

/** The buyer's side: the quote page outside HubSpot, in a browser frame. */
export function BuyerPage({ id }: { id: string }) {
  const { world, pack } = useShell();
  const quote = world.quotes.find((q) => q.id === id);
  if (!quote || (quote.status !== "Sent" && quote.status !== "Accepted")) {
    return (
      <div className="flex-1 bg-hs-bg p-10">
        <Card>
          <Empty title="This quote has not been shared yet">
            The buyer&apos;s page exists once the quote is published.{" "}
            <A to={quote ? `/quotes/${quote.id}` : "/quotes"} className="hs-link">
              Back to the quote
            </A>
          </Empty>
        </Card>
      </div>
    );
  }
  const contact = world.contacts.find((c) => c.id === quote.contactId);
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#d9d9d9] p-4" data-testid="buyer-page">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[10px] border border-[#bdbdbd] bg-white shadow-lg">
        <div className="flex items-center gap-3 border-b border-line bg-[#f1f1f1] px-4 py-2">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </span>
          <span className="flex h-7 flex-1 items-center gap-2 rounded-full bg-white px-3 text-[12.5px] text-ink-muted ring-1 ring-line-soft">
            <Icon name="lock" size={12} /> {quoteLink(pack.portal.hubId, quote)}
          </span>
          <span className="text-[12px] text-ink-muted">Viewing as {contactName(contact)}, the buyer</span>
          <A to={`/quotes/${quote.id}`} className="inline-flex h-7 items-center gap-1 rounded-[6px] border border-line bg-white px-2.5 text-[12px] font-semibold" data-testid="buyer-back">
            <Icon name="arrowLeft" size={13} /> Back to HubSpot
          </A>
        </div>
        <div className="hs-scroll min-h-0 flex-1 overflow-y-auto">
          <BuyerView quote={quote} interactive />
        </div>
      </div>
    </div>
  );
}

/** The public link of a published quote, in the shape HubSpot gives it. */
export function quoteLink(hubId: string, quote: Pick<Quote, "id" | "number">): string {
  let hash = 0;
  for (const ch of `${hubId}${quote.id}`) hash = (hash * 33 + ch.charCodeAt(0)) >>> 0;
  return `${hubId}.hs-sites.com/${hash.toString(36)}${quote.number.replace(/\W/g, "").toLowerCase()}`;
}
