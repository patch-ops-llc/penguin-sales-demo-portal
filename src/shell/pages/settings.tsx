"use client";

import { useState } from "react";
import { useShell } from "@/store/store";
import { Icon } from "../icons";
import { Picker, SmallButton } from "../quote/approval-controls";
import { APPROVAL_WORKFLOW_NAME, approvalWorkflowFrom } from "../quote/approval-rule";
import { A, Button, cx, Empty, LineTabs } from "../ui";

// HubSpot's settings menu, cut down to the headings around the one screen this portal simulates.
const MENU: { group: string; items: string[] }[] = [
  { group: "Your Preferences", items: ["General", "Notifications", "Security"] },
  { group: "Account Management", items: ["Account Defaults", "Users & Teams", "Integrations", "Privacy & Consent"] },
  { group: "Data Management", items: ["Properties", "Objects", "Import & Export", "Audit Log"] },
];

const TABS = [
  { id: "setup", label: "Setup" },
  { id: "approvals", label: "Approvals", testId: "settings-tab-approvals" },
  { id: "esign", label: "E-signature" },
  { id: "reminders", label: "Reminders" },
] as const;
type TabId = (typeof TABS)[number]["id"];

/** HubSpot's settings switch: a dark track with a check when on. It shows its state and does not change it. */
function Switch({ on, label, testId }: { on: boolean; label: string; testId?: string }) {
  return (
    <span
      role="switch"
      aria-checked={on}
      aria-disabled="true"
      aria-label={label}
      data-testid={testId}
      className={cx("inline-flex h-7 w-[52px] shrink-0 cursor-default rounded-[4px] border p-[2px]", on ? "justify-end border-ink bg-ink" : "justify-start border-[#7c8a99] bg-white")}
    >
      <span className={cx("flex h-full w-[23px] items-center justify-center rounded-[2px]", on ? "bg-white text-ink" : "bg-[#7c8a99] text-white")}>
        <Icon name={on ? "check" : "close"} size={13} strokeWidth={2.2} />
      </span>
    </span>
  );
}

/** The right panel behind Edit on Standard approvals. No standard approval is set up, and advanced approvals are in use, so it stays empty. */
function StandardPanel({ onClose }: { onClose: () => void }) {
  const label = "mb-1 block text-[12.5px] font-semibold";
  return (
    // Below the demo bar's layer, so the presenter can still step the demo with the panel open.
    <div className="fixed inset-0 z-50 flex justify-end bg-[rgba(20,20,20,0.4)]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside role="dialog" aria-label="Standard quote approvals" className="hs-slide-in mb-[60px] flex w-[520px] max-w-full flex-col bg-white shadow-[-8px_0_28px_rgba(20,20,20,0.2)]" data-testid="standard-approvals-panel">
        <header className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-[17px] font-semibold">Standard quote approvals</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-ink-muted hover:bg-[#f0f0f0]">
            <Icon name="close" size={18} />
          </button>
        </header>
        <div className="hs-scroll min-h-0 flex-1 overflow-y-auto px-6 py-5 text-[13.5px]">
          <h3 className="text-[15px] font-bold">And these conditions are met</h3>
          <div className="mt-3 rounded-[10px] border border-line p-4" data-testid="standard-approvals-filters">
            <h4 className="text-[14px] font-bold">Filters</h4>
            <div className="mt-3 rounded-[6px] bg-[#f0f0f0] p-2.5">
              <SmallButton>
                <Icon name="plus" size={13} /> Add filter
              </SmallButton>
            </div>
          </div>

          <h3 className="mt-7 text-[15px] font-bold">Then do this</h3>
          <div className="mt-3 space-y-4">
            <div>
              <p className={label}>Approvers</p>
              <Picker testId="standard-approvals-approvers" />
            </div>
            <fieldset>
              <legend className={label}>Approver requirements</legend>
              {["All approvers required", "At least one approver required"].map((option) => (
                <label key={option} className="flex items-center gap-2 py-0.5">
                  <input type="radio" name="approver-requirement" checked={false} readOnly className="accent-ink" /> {option}
                </label>
              ))}
            </fieldset>
            <div>
              <label className={label} htmlFor="standard-approval-note">
                With this approval note
              </label>
              <textarea id="standard-approval-note" readOnly rows={3} value="" className="w-full cursor-default resize-none rounded-[4px] border border-[#7c8a99] px-3 py-2 text-[13.5px] focus:outline-none" />
              <p className="mt-1 text-[12.5px] text-ink-muted">Quote creators and approvers will see this note when an approval takes place.</p>
            </div>
          </div>
        </div>
        <footer className="flex items-center gap-2 border-t border-line px-6 py-3">
          <Button variant="primary" disabled>
            Save
          </Button>
          <Button onClick={onClose} data-testid="standard-approvals-close">
            Cancel
          </Button>
        </footer>
      </aside>
    </div>
  );
}

function ApprovalsTab({ from }: { from?: string }) {
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const card = "rounded-[10px] border border-line bg-white p-6";
  const rowBox = "mt-4 rounded-[8px] border border-line";
  const workflow = approvalWorkflowFrom(from);
  return (
    <div className="max-w-[920px] space-y-5" data-testid="settings-approvals">
      <section className={card}>
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] font-bold">Quote approvals</h2>
            <p className="mt-1 text-[13.5px]">Turn on approvals for quotes to enroll them in an approval process. Maintain accuracy and consistency before sending quotes to buyers.</p>
          </div>
          <span className="text-[13.5px] font-semibold">Approvals</span>
          <Switch on label="Approvals" testId="approvals-switch" />
        </div>
      </section>

      <section className={card} data-testid="standard-approvals">
        <h2 className="text-[16px] font-bold">Standard approvals</h2>
        <p className="mt-1 text-[13.5px]">Use automation to set up approval on quotes that meet your choice of criteria and approvers. Standard quote approvals cannot be turned on at the same time as advanced quote approvals.</p>
        <div className={cx(rowBox, "flex items-center gap-3 px-4 py-3")}>
          <span className="flex min-w-0 flex-1 items-center gap-2.5 text-[14px] font-bold">
            <Icon name="chevronRight" size={16} /> Quotes
          </span>
          <Button size="sm" onClick={() => setEditing(true)} data-testid="standard-approvals-edit">
            Edit
          </Button>
          <Switch on={false} label="Standard approvals for quotes" testId="standard-approvals-switch" />
        </div>
      </section>

      <section className={card} data-testid="advanced-approvals">
        <h2 className="text-[16px] font-bold">Advanced approvals</h2>
        <p className="mt-1 text-[13.5px]">Use workflow automation for dynamic, property-driven logic, and sequential quote approval steps. Advanced quote approvals cannot be turned on at the same time as standard quote approvals.</p>
        <p className="mt-3 text-[13.5px]">
          Learn more about creating and managing advanced quote approvals on our <span className="font-semibold text-link">Knowledge Base article</span> <Icon name="external" size={12} className="inline align-[-1px] text-link" /> .
        </p>
        <div className={rowBox}>
          <div className="flex items-center gap-3 px-4 py-3">
            <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-2.5 text-left text-[14px] font-bold" data-testid="advanced-approvals-toggle">
              <Icon name={open ? "chevronDown" : "chevronRight"} size={16} /> Advanced quote approvals
            </button>
            <A to={workflow} className="inline-flex h-8 shrink-0 items-center rounded-[6px] border border-ink bg-white px-3 text-[12.5px] font-semibold hover:bg-[#f5f5f5]" data-testid="advanced-approvals-edit">
              Edit
            </A>
            <Switch on label="Advanced quote approvals" testId="advanced-approvals-switch" />
          </div>
          {open ? (
            <ul className="space-y-3 border-t border-line-soft px-4 py-3.5 text-[13.5px] font-semibold" data-testid="advanced-approvals-links">
              <li>
                <span className="cursor-default text-link">
                  Team approver settings
                </span>
              </li>
              <li>
                <A to={workflow} className="inline-flex items-center gap-1.5 text-link hover:underline" data-testid="approval-workflow-link">
                  {APPROVAL_WORKFLOW_NAME} <Icon name="external" size={12} />
                </A>
              </li>
            </ul>
          ) : null}
        </div>
      </section>

      {editing ? <StandardPanel onClose={() => setEditing(false)} /> : null}
    </div>
  );
}

/**
 * Settings > Objects > Quotes, with the Approvals tab where HubSpot turns quote approvals on.
 * Advanced approvals are on, and Edit leads to the workflow that holds the rule the quote's Approvals panel checks against.
 */
export function SettingsPage() {
  const { world, route } = useShell();
  const [tab, setTab] = useState<TabId>("approvals");
  const from = world.quotes.find((q) => q.id === route.query.get("from"));
  return (
    <div className="flex min-h-full" data-testid="settings-page">
      <aside className="w-[236px] shrink-0 border-r border-line bg-white px-3 py-4" aria-label="Settings">
        {/* A quote reopens with its Approvals panel showing, where the link to this screen is. */}
        <A to={from ? `/approvals/${from.id}` : "/quotes"} className="inline-flex items-center gap-1.5 rounded-[4px] px-2 py-1 text-[13px] font-semibold text-link hover:bg-[#eef5f5]" data-testid="settings-back">
          <Icon name="arrowLeft" size={14} /> {from ? `Back to ${from.number}` : "Back to quotes"}
        </A>
        <h2 className="mt-3 px-2 text-[20px] font-bold">Settings</h2>
        {MENU.map((group) => (
          <div key={group.group} className="mt-5">
            <p className="px-2 text-[13px] font-bold">{group.group}</p>
            <ul className="mt-1">
              {group.items.map((item) => (
                <li key={item} aria-current={item === "Objects" ? "page" : undefined} className={cx("flex h-8 items-center rounded-[4px] px-2 text-[13.5px]", item === "Objects" ? "bg-[#e5f5f8] font-semibold" : "text-ink-muted")}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </aside>

      <section className="min-w-0 flex-1 px-8 py-6">
        <h1 className="text-[24px] font-bold leading-tight">Objects</h1>
        <div className="mt-4 w-[280px]">
          <p className="mb-1 text-[12.5px] font-semibold">Select an object</p>
          <Picker testId="settings-object" title="Quotes">
            Quotes
          </Picker>
        </div>
        <LineTabs tabs={[...TABS]} value={tab} onChange={setTab} className="mt-5" />
        <div className="mt-6">
          {tab === "approvals" ? (
            <ApprovalsTab from={from?.id} />
          ) : (
            <div className="max-w-[920px] rounded-[10px] border border-line bg-white">
              <Empty title="This tab is not part of this demo">
                <button type="button" className="hs-link" onClick={() => setTab("approvals")}>
                  Go to Approvals
                </button>
              </Empty>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
