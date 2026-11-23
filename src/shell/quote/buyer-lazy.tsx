"use client";

import { lazy, Suspense } from "react";
import type { Quote } from "@/verticals/types";

type BuyerMod = typeof import("./buyer");
let cached: Promise<BuyerMod> | null = null;

function loadBuyer(): Promise<BuyerMod> {
  if (!cached) cached = import("./buyer");
  return cached;
}

export function preloadBuyer(): Promise<unknown> {
  return loadBuyer();
}

const BuyerPageInner = lazy(() => loadBuyer().then((m) => ({ default: m.BuyerPage })));
const BuyerViewInner = lazy(() => loadBuyer().then((m) => ({ default: m.BuyerView })));

export function LazyBuyerPage({ id }: { id: string }) {
  return (
    <Suspense fallback={<div className="flex min-h-0 flex-1 bg-[#d9d9d9]" />}>
      <BuyerPageInner id={id} />
    </Suspense>
  );
}

export function LazyBuyerView(props: { quote: Quote; interactive?: boolean; narrow?: boolean; onSigning?: (signing: boolean) => void }) {
  return (
    <Suspense fallback={<div className="min-h-full bg-[#e1e8f0]" />}>
      <BuyerViewInner {...props} />
    </Suspense>
  );
}
