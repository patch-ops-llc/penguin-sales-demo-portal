"use client";

import { useEffect, useRef, useState } from "react";
import { nowMs } from "@/lib/format";
import { useShell } from "@/store/store";
import type { Quote } from "@/verticals/types";
import { Icon } from "../icons";
import { contactName } from "../pages/lists";
import { A, Avatar, Card, cx, Empty, Modal } from "../ui";
import { ClosingAgentLauncher, ClosingAgentPanel } from "./closing-agent";
import { AcceptanceCard, QuoteDocument } from "./document";
import { useQuoteSettings } from "./settings";

const chip = "inline-flex h-8 items-center gap-1.5 rounded-[4px] border border-line bg-white px-3 text-[12.5px] hover:bg-[#f5f5f5]";
const signPrimary = "inline-flex h-9 items-center rounded-[4px] bg-[#0061fe] px-5 text-[13.5px] font-semibold text-white hover:bg-[#0052d9] disabled:cursor-default disabled:bg-[#4a4a4a] disabled:text-[#a8a8a8]";
const signSecondary = "inline-flex h-9 items-center rounded-[4px] border border-[#6b6b6b] px-4 text-[13.5px] font-semibold text-white hover:bg-[#333]";

/** Where the buyer is in the e-signature sequence: Get started, Click to sign, Continue, I agree, Close. */
type Stage = "start" | "sign" | "review" | "done";

/**
 * The published quote as the buyer sees it: the sender, Print and Download, the acceptance banner,
 * and the document. The editor's preview shows the same thing with the actions switched off.
 */
export function BuyerView({ quote, interactive = false, narrow = false, onSigning }: { quote: Quote; interactive?: boolean; narrow?: boolean; onSigning?: (signing: boolean) => void }) {
  const { pack, dispatch } = useShell();
  const s = useQuoteSettings(quote);
  const root = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [dialog, setDialog] = useState(false);
  const [signature, setSignature] = useState("");
  const owner = pack.personas.find((p) => p.id === quote.ownerId);
  const accepted = quote.status === "Accepted";
  const accept = () => dispatch({ t: "quote.accept", id: quote.id, at: nowMs() });
  const print = interactive ? () => window.print() : undefined;
  const toField = () => root.current?.querySelector('[data-testid="sign-field"]')?.scrollIntoView({ block: "center", behavior: "smooth" });
  const exit = () => {
    setStage(null);
    setDialog(false);
    setSignature("");
  };
  const signing = stage !== null && stage !== "done";
  useEffect(() => onSigning?.(signing), [onSigning, signing]);
  // Signing opens at the top of the document, as the signing page does; Get started then moves to the signature field.
  const start = () => {
    setStage("start");
    root.current?.scrollIntoView({ block: "start" });
  };
  const onSign = !interactive || accepted ? undefined : s.get("accept") === "esign" ? start : accept;
  const field = signing ? { signature, onClick: () => setDialog(true) } : undefined;

  return (
    <div ref={root} className={cx("flex min-h-full flex-col", signing ? "bg-[#f3f3f3]" : "bg-[#e1e8f0]")}>
      {signing ? (
        <div className="sticky top-0 z-10 flex min-h-[60px] items-center gap-3 bg-[#1a1a1a] px-5 py-2.5 text-white" data-testid="signing-bar" data-stage={stage}>
          <button type="button" className="text-[12.5px] text-[#c9c9c9] underline-offset-2 hover:text-white hover:underline" onClick={exit} data-testid="sign-exit">
            Exit signing
          </button>
          <p className="ml-auto text-right text-[12.5px] text-[#c9c9c9]" data-testid="signing-status">
            {stage === "start" ? "" : stage === "review" ? "Review your signature. Click I agree to sign this document." : signature ? "All required fields are complete" : "1 required field left"}
          </p>
          {stage === "start" ? (
            <button
              type="button"
              className={signPrimary}
              data-testid="sign-get-started"
              onClick={() => {
                setStage("sign");
                toField();
              }}
            >
              Get started
            </button>
          ) : stage === "sign" ? (
            <button type="button" className={signPrimary} disabled={!signature} onClick={() => setStage("review")} data-testid="sign-continue">
              Continue
            </button>
          ) : (
            <>
              <button
                type="button"
                className={signSecondary}
                data-testid="sign-edit"
                onClick={() => {
                  setStage("sign");
                  setDialog(true);
                }}
              >
                Edit
              </button>
              <button
                type="button"
                className={signPrimary}
                data-testid="sign-agree"
                onClick={() => {
                  dispatch([
                    { t: "ui", k: `q.${quote.id}.sig`, v: signature },
                    { t: "quote.accept", id: quote.id, at: nowMs() },
                  ]);
                  setStage("done");
                }}
              >
                I agree
              </button>
            </>
          )}
        </div>
      ) : (
        <>
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
        </>
      )}
      <div className={cx("mx-auto w-full flex-1 px-6 py-7", narrow ? "max-w-[430px] px-3" : "max-w-[940px]")}>
        <QuoteDocument quote={quote} acceptance={<AcceptanceCard quote={quote} onSign={onSign} field={field} />} />
      </div>
      {dialog ? (
        <SignDialog
          quote={quote}
          current={signature}
          onClose={() => setDialog(false)}
          onInsert={(value) => {
            setSignature(value);
            setDialog(false);
          }}
        />
      ) : null}
      {stage === "done" ? (
        <Modal
          title="You signed this document"
          onClose={exit}
          width={480}
          testId="sign-done"
          footer={
            <button type="button" className="inline-flex h-8 items-center rounded-[4px] bg-[#0061fe] px-4 text-[12.5px] font-semibold text-white hover:bg-[#0052d9]" onClick={exit} data-testid="sign-close">
              Close
            </button>
          }
        >
          <p className="text-[13.5px]">
            Your signature is saved on {quote.number}. {pack.portal.company} has been notified, and you will get a copy by email once every signature is complete.
          </p>
        </Modal>
      ) : null}
    </div>
  );
}

const PAD = { w: 320, h: 96 };

/** The signature dialog: draw, type, or upload, then Insert. */
function SignDialog({ quote, current, onClose, onInsert }: { quote: Quote; current: string; onClose: () => void; onInsert: (signature: string) => void }) {
  const { world } = useShell();
  const contact = world.contacts.find((c) => c.id === quote.contactId);
  const [tab, setTab] = useState<"draw" | "type" | "upload">(current.startsWith("d:") ? "draw" : current.startsWith("u:") ? "upload" : "type");
  const [name, setName] = useState(current.startsWith("t:") ? current.slice(2) : contactName(contact));
  const [path, setPath] = useState(current.startsWith("d:") ? current.slice(2) : "");
  const [image, setImage] = useState(current.startsWith("u:") ? current.slice(2) : "");
  const value = tab === "type" ? (name.trim() ? `t:${name.trim()}` : "") : tab === "draw" ? (path ? `d:${path}` : "") : image ? `u:${image}` : "";

  const point = (e: React.PointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    return `${Math.round(((e.clientX - box.left) / box.width) * PAD.w)} ${Math.round(((e.clientY - box.top) / box.height) * PAD.h)}`;
  };
  // The image is redrawn onto a pad-sized canvas, so what is kept with the quote stays a few kilobytes.
  const upload = async (file: File | undefined) => {
    if (!file) return;
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = PAD.w;
      canvas.height = PAD.h;
      const scale = Math.min(PAD.w / bitmap.width, PAD.h / bitmap.height);
      canvas.getContext("2d")?.drawImage(bitmap, (PAD.w - bitmap.width * scale) / 2, (PAD.h - bitmap.height * scale) / 2, bitmap.width * scale, bitmap.height * scale);
      setImage(canvas.toDataURL("image/png"));
    } catch {
      setImage("");
    }
  };
  const pad = "mt-4 flex h-[120px] w-full items-center justify-center rounded-[6px] border border-dashed border-line bg-[#fafafa]";

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
          <button type="button" disabled={!value} onClick={() => onInsert(value)} data-testid="buyer-sign-insert" className="inline-flex h-8 items-center rounded-[4px] bg-[#0061fe] px-4 text-[12.5px] font-semibold text-white hover:bg-[#0052d9] disabled:bg-[#cfcfcf]">
            Insert
          </button>
        </>
      }
    >
      <div className="flex gap-5 border-b border-line-soft text-[13.5px]" role="tablist">
        {(["draw", "type", "upload"] as const).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            data-testid={`sign-tab-${id}`}
            className={cx("-mb-px border-b-2 pb-2 capitalize", tab === id ? "border-[#0061fe] font-semibold" : "border-transparent text-ink-muted hover:text-ink")}
          >
            {id}
          </button>
        ))}
      </div>
      {tab === "type" ? (
        <>
          <input value={name} onChange={(e) => setName(e.target.value)} aria-label="Type your name" className="mt-4 h-9 w-full rounded-[4px] border border-line px-3 text-[13.5px] focus:border-ink focus:outline-none" />
          <p className={cx(pad, "text-[38px] [font-family:'Brush_Script_MT','Segoe_Script',cursive]")}>{name}</p>
        </>
      ) : tab === "draw" ? (
        <>
          <svg
            viewBox={`0 0 ${PAD.w} ${PAD.h}`}
            className={cx(pad, "cursor-crosshair touch-none")}
            data-testid="sign-pad"
            role="img"
            aria-label="Draw your signature"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              const at = point(e);
              setPath((p) => `${p}M${at}`);
            }}
            onPointerMove={(e) => {
              if (e.buttons !== 1) return;
              const next = point(e);
              setPath((p) => (p ? `${p}L${next}` : p));
            }}
          >
            <path d={path} fill="none" stroke="#141414" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="mt-2 flex items-center justify-between text-[12px] text-ink-muted">
            Draw your signature in the box.
            <button type="button" className="hs-link" onClick={() => setPath("")} disabled={!path}>
              Clear
            </button>
          </p>
        </>
      ) : (
        <label className={cx(pad, "cursor-pointer flex-col gap-1 text-[13px] text-ink-muted hover:bg-[#f3f3f3]")}>
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element -- a data URL made in the browser; there is nothing for the image optimizer to fetch.
            <img src={image} alt="Uploaded signature" className="h-[96px] w-auto" />
          ) : (
            <>
              <span className="font-semibold text-ink">Upload an image of your signature</span>
              <span>PNG or JPG</span>
            </>
          )}
          <input type="file" accept="image/png,image/jpeg" className="sr-only" onChange={(e) => void upload(e.target.files?.[0])} data-testid="sign-upload" />
        </label>
      )}
    </Modal>
  );
}

/** The buyer's side: the quote page outside HubSpot, in a browser frame. */
export function BuyerPage({ id }: { id: string }) {
  const { world, pack } = useShell();
  const [signing, setSigning] = useState(false);
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
        <div className="relative flex min-h-0 flex-1">
          <div className="hs-scroll min-h-0 min-w-0 flex-1 overflow-y-auto">
            <BuyerView quote={quote} interactive onSigning={setSigning} />
          </div>
          {/* The signing page is the document alone, so the agent steps aside while the buyer signs. */}
          {signing ? null : (
            <>
              <div className="hidden min-h-0 lg:flex">
                <ClosingAgentPanel quote={quote} />
              </div>
              <ClosingAgentLauncher quote={quote} className="lg:hidden" />
            </>
          )}
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
