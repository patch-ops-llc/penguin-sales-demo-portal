"use client";

import { lazy, Suspense } from "react";
import type { Quote } from "@/verticals/types";
import type { ModuleId } from "./settings";

type LineItemsMod = typeof import("./line-items-editor");
type SidebarMod = typeof import("./sidebar");
type ClosingSettingsMod = typeof import("./closing-agent-settings");

let cachedLineItems: LineItemsMod | null = null;
let cachedSidebar: SidebarMod | null = null;
let cachedClosingSettings: ClosingSettingsMod | null = null;

const loadLineItemsEditor = () =>
  import("./line-items-editor").then((m) => {
    cachedLineItems = m;
    return m;
  });

const loadEditorSidebar = () =>
  import("./sidebar").then((m) => {
    cachedSidebar = m;
    return m;
  });

const loadClosingAgentSettings = () =>
  import("./closing-agent-settings").then((m) => {
    cachedClosingSettings = m;
    return m;
  });

const LineItemsEditorInner = lazy(() => loadLineItemsEditor().then((m) => ({ default: m.LineItemsEditor })));
const EditorSidebarInner = lazy(() => loadEditorSidebar().then((m) => ({ default: m.EditorSidebar })));
const ClosingAgentSettingsInner = lazy(() => loadClosingAgentSettings().then((m) => ({ default: m.ClosingAgentSettings })));

export function preloadQuoteEditorPanels(): Promise<unknown> {
  return Promise.all([loadLineItemsEditor(), loadEditorSidebar()]);
}

export function LazyLineItemsEditor({ quote, onClose }: { quote: Quote; onClose: () => void }) {
  if (cachedLineItems) {
    const Comp = cachedLineItems.LineItemsEditor;
    return <Comp quote={quote} onClose={onClose} />;
  }
  return (
    <Suspense fallback={<div className="flex min-h-0 flex-1 bg-[#f5f8fa]" />}>
      <LineItemsEditorInner quote={quote} onClose={onClose} />
    </Suspense>
  );
}

export function LazyEditorSidebar(props: {
  quote: Quote;
  module: ModuleId | null;
  onSelect: (id: ModuleId | null) => void;
  onClose: () => void;
  onEditLines: () => void;
}) {
  if (cachedSidebar) {
    const Comp = cachedSidebar.EditorSidebar;
    return <Comp {...props} />;
  }
  return (
    <Suspense fallback={null}>
      <EditorSidebarInner {...props} />
    </Suspense>
  );
}

export function LazyClosingAgentSettings({ quote, onClose }: { quote: Quote; onClose: () => void }) {
  if (cachedClosingSettings) {
    const Comp = cachedClosingSettings.ClosingAgentSettings;
    return <Comp quote={quote} onClose={onClose} />;
  }
  return (
    <Suspense fallback={null}>
      <ClosingAgentSettingsInner quote={quote} onClose={onClose} />
    </Suspense>
  );
}
