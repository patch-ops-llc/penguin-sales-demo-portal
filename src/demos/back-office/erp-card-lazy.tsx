"use client";

import { lazy, Suspense } from "react";
import type { Company } from "@/verticals/types";

type ErpCardMod = typeof import("./erp-card");
let cached: ErpCardMod | null = null;

const loadErpCard = () =>
  import("./erp-card").then((m) => {
    cached = m;
    return m;
  });

const ErpCardInner = lazy(() => loadErpCard().then((m) => ({ default: m.ErpCard })));

export function preloadErpCard(): Promise<unknown> {
  return loadErpCard();
}

export function LazyErpCard({ company }: { company: Company }) {
  if (cached) {
    const Comp = cached.ErpCard;
    return <Comp company={company} />;
  }
  return (
    <Suspense fallback={null}>
      <ErpCardInner company={company} />
    </Suspense>
  );
}
