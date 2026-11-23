"use client";

import { lazy, Suspense } from "react";
import type { Quote } from "@/verticals/types";

type ApprovalViewsMod = typeof import("./approval-settings-views");
let cached: ApprovalViewsMod | null = null;

const loadApprovalSettings = () =>
  import("./approval-settings-views").then((m) => {
    cached = m;
    return m;
  });

const SettingsPageInner = lazy(() => loadApprovalSettings().then((m) => ({ default: m.SettingsPage })));
const ApprovalWorkflowPageInner = lazy(() => loadApprovalSettings().then((m) => ({ default: m.ApprovalWorkflowPage })));
const ApprovalsPanelInner = lazy(() => loadApprovalSettings().then((m) => ({ default: m.ApprovalsPanel })));
const RequestApprovalDialogInner = lazy(() => loadApprovalSettings().then((m) => ({ default: m.RequestApprovalDialog })));

export function preloadApprovalSettings(): Promise<unknown> {
  return loadApprovalSettings();
}

export function LazySettingsPage() {
  if (cached) {
    const Comp = cached.SettingsPage;
    return <Comp />;
  }
  return (
    <Suspense fallback={<div className="min-h-full bg-hs-bg" />}>
      <SettingsPageInner />
    </Suspense>
  );
}

export function LazyApprovalWorkflowPage() {
  if (cached) {
    const Comp = cached.ApprovalWorkflowPage;
    return <Comp />;
  }
  return (
    <Suspense fallback={<div className="min-h-full bg-hs-bg" />}>
      <ApprovalWorkflowPageInner />
    </Suspense>
  );
}

export function LazyApprovalsPanel({ quote, onClose }: { quote: Quote; onClose: () => void }) {
  if (cached) {
    const Comp = cached.ApprovalsPanel;
    return <Comp quote={quote} onClose={onClose} />;
  }
  return (
    <Suspense fallback={null}>
      <ApprovalsPanelInner quote={quote} onClose={onClose} />
    </Suspense>
  );
}

export function LazyRequestApprovalDialog({ quote, onClose }: { quote: Quote; onClose: () => void }) {
  if (cached) {
    const Comp = cached.RequestApprovalDialog;
    return <Comp quote={quote} onClose={onClose} />;
  }
  return (
    <Suspense fallback={null}>
      <RequestApprovalDialogInner quote={quote} onClose={onClose} />
    </Suspense>
  );
}
