"use client";

import { useState } from "react";
import type { ApprovalFilter } from "@/store/quote-math";
import { useShell } from "@/store/store";
import { Ext } from "../ext";
import { Icon } from "../icons";
import { approvalRuleOf, type ApprovalRule } from "../quote/approval-rule";
import { A, Avatar, Button, cx, Empty, LineTabs } from "../ui";

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

const VIEW_ONLY = "Super Admin permissions are required to change quote approvals.";
const REQUIREMENT = "All approvers required";

/** HubSpot's settings switch: a dark track with a check when on. Changing it takes Super Admin permissions, so it only shows its state. */
function Switch({ on, label, testId }: { on: boolean; label: string; testId?: string }) {
  return (
    <span
      role="switch"
      aria-checked={on}
      aria-disabled="true"
      aria-label={label}
      title={VIEW_ONLY}
      data-testid={testId}
      className={cx("inline-flex h-7 w-[52px] shrink-0 cursor-default rounded-[4px] border p-[2px]", on ? "justify-end border-ink bg-ink" : "justify-start border-[#7c8a99] bg-white")}
    >
      <span className={cx("flex h-full w-[23px] items-center justify-center rounded-[2px]", on ? "bg-white text-ink" : "bg-[#7c8a99] text-white")}>
        <Icon name={on ? "check" : "close"} size={13} strokeWidth={2.2} />
      </span>
    </span>
  );
}

/** A dropdown as HubSpot draws it, showing the saved choice. */
function Picker({ children, testId, title = VIEW_ONLY }: { children: React.ReactNode; testId?: string; title?: string }) {
  return (
    <span title={title} data-testid={testId} className="flex min-h-9 w-full cursor-default items-center gap-2 rounded-[4px] border border-[#7c8a99] bg-white px-3 py-1.5 text-[13.5px]">
      <span className="min-w-0 flex-1">{children}</span>
      <span className="h-0 w-0 shrink-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-ink" aria-hidden="true" />
    </span>
  );
}

const sentence = (f: ApprovalFilter) => (
  <>
    <span className="font-semibold">{f.property}</span> {f.operator} <span className="font-semibold">{f.value}</span>
  </>
);

/** The filter that reads Penguin's line item flag carries the marker; the rule around it is HubSpot's own. */
function Marked({ filter, marked, className, children }: { filter: ApprovalFilter; marked: boolean; className?: string; children: React.ReactNode }) {
  if (filter.id !== "floor" || !marked) return <div className={className}>{children}</div>;
  return (
    <Ext id="floor-price-rule" className={cx(className, "pr-10")} pinClass="!right-1.5 !top-1.5">
      {children}
    </Ext>
  );
}

/** What the saved rule says, under the Quotes row of Standard approvals. */
function RuleSummary({ rule, marked }: { rule: ApprovalRule; marked: boolean }) {
  const row = "grid grid-cols-[170px_1fr] gap-4 py-3";
  return (
    <dl className="divide-y divide-line-soft border-t border-line-soft px-4 text-[13.5px]" data-testid="approval-rule-summary">
      <div className={row}>
        <dt className="text-ink-muted">And these conditions are met</dt>
        <dd>
          <ul>
            {rule.filters.map((f, i) => (
              <li key={f.id}>
                {i > 0 ? <p className="py-1 text-[12.5px] text-ink-muted">or</p> : null}
                <Marked filter={f} marked={marked} className="rounded-[6px] bg-[#f5f5f5] px-3 py-1.5">
                  <p data-testid={`settings-condition-${f.id}`}>{sentence(f)}</p>
                </Marked>
              </li>
            ))}
          </ul>
        </dd>
      </div>
      <div className={row}>
        <dt className="text-ink-muted">Approvers</dt>
        <dd className="flex items-center gap-2.5" data-testid="settings-approver">
          <Avatar name={rule.approver?.name ?? "?"} color={rule.approver?.color} size={28} />
          <span>
            <span className="font-semibold">{rule.approver?.name}</span>
            <span className="text-ink-muted">, {rule.approver?.title}</span>
          </span>
        </dd>
      </div>
      <div className={row}>
        <dt className="text-ink-muted">Approver requirements</dt>
        <dd>{REQUIREMENT}</dd>
      </div>
      <div className={row}>
        <dt className="text-ink-muted">With this approval note</dt>
        <dd data-testid="settings-approval-note">{rule.note}</dd>
      </div>
    </dl>
  );
}

/** One filter in the editor: property, operator, value, stacked as HubSpot stacks them. */
function FilterGroup({ filter }: { filter: ApprovalFilter }) {
  const percent = filter.value.endsWith("%");
  return (
    <div className="rounded-[12px] border border-line p-3" data-testid={`settings-filter-${filter.id}`}>
      <Marked filter={filter} marked className="rounded-[6px] bg-[#f0f0f0] p-2.5">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Picker>{filter.property}</Picker>
            <Picker>{filter.operator}</Picker>
            {percent ? (
              <div className="flex items-center gap-2">
                <input readOnly value={filter.value.slice(0, -1)} aria-label={`${filter.property} value`} title={VIEW_ONLY} className="h-9 min-w-0 flex-1 cursor-default rounded-[4px] border border-[#7c8a99] bg-white px-3 text-[13.5px] focus:outline-none" />
                <span className="w-4 text-[13.5px]">%</span>
              </div>
            ) : (
              <Picker>{filter.value}</Picker>
            )}
          </div>
          <span className="mt-2 text-ink-muted" aria-hidden="true">
            <Icon name="close" size={16} />
          </span>
        </div>
      </Marked>
      <p className="px-1 py-1.5 text-[13px]">and</p>
      <div className="rounded-[6px] bg-[#f0f0f0] p-2.5">
        <span className="inline-flex h-8 cursor-default items-center gap-1.5 rounded-[4px] border border-[#7c8a99] bg-white px-3 text-[13px] text-ink-muted" title={VIEW_ONLY}>
          <Icon name="plus" size={13} /> Add filter
        </span>
      </div>
    </div>
  );
}

/** The right panel behind Edit: the rule's filters, its approvers, and its approval note. */
function RulePanel({ rule, onClose }: { rule: ApprovalRule; onClose: () => void }) {
  const label = "mb-1 block text-[12.5px] font-semibold";
  return (
    // Below the demo bar's layer, so the presenter can still step the demo with the panel open.
    <div className="fixed inset-0 z-50 flex justify-end bg-[rgba(20,20,20,0.4)]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside role="dialog" aria-label="Standard quote approvals" className="hs-slide-in mb-[60px] flex w-[520px] max-w-full flex-col bg-white shadow-[-8px_0_28px_rgba(20,20,20,0.2)]" data-testid="approval-rule-panel">
        <header className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-[17px] font-semibold">Standard quote approvals</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-ink-muted hover:bg-[#f0f0f0]">
            <Icon name="close" size={18} />
          </button>
        </header>
        <div className="hs-scroll min-h-0 flex-1 overflow-y-auto px-6 py-5 text-[13.5px]">
          <h3 className="text-[15px] font-bold">And these conditions are met</h3>
          <div className="mt-3 rounded-[10px] border border-line p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[14px] font-bold">Filters</h4>
              <span className="inline-flex h-7 cursor-default items-center rounded-[4px] border border-[#7c8a99] px-2.5 text-[12.5px] text-ink-muted" title={VIEW_ONLY}>
                Discard
              </span>
            </div>
            <div className="mt-3">
              {rule.filters.map((f, i) => (
                <div key={f.id}>
                  {i > 0 ? <p className="px-1 py-2 text-[13px] font-semibold">or</p> : null}
                  <FilterGroup filter={f} />
                </div>
              ))}
            </div>
          </div>

          <h3 className="mt-7 text-[15px] font-bold">Then do this</h3>
          <div className="mt-3 space-y-4">
            <div>
              <p className={label}>Approvers</p>
              <Picker testId="settings-panel-approver">
                {rule.approver?.name} ({rule.approver?.email})
              </Picker>
            </div>
            <fieldset>
              <legend className={label}>Approver requirements</legend>
              {[REQUIREMENT, "At least one approver required"].map((option) => (
                <label key={option} className="flex items-center gap-2 py-0.5" title={VIEW_ONLY}>
                  <input type="radio" name="approver-requirement" checked={option === REQUIREMENT} readOnly className="accent-ink" /> {option}
                </label>
              ))}
            </fieldset>
            <div>
              <label className={label} htmlFor="approval-rule-note">
                With this approval note
              </label>
              <textarea id="approval-rule-note" readOnly rows={3} value={rule.note} title={VIEW_ONLY} data-testid="settings-panel-note" className="w-full cursor-default resize-none rounded-[4px] border border-[#7c8a99] px-3 py-2 text-[13.5px] focus:outline-none" />
              <p className="mt-1 text-[12.5px] text-ink-muted">Quote creators and approvers will see this note when an approval takes place.</p>
            </div>
          </div>
        </div>
        <footer className="flex items-center gap-2 border-t border-line px-6 py-3">
          <Button variant="primary" disabled title={VIEW_ONLY}>
            Save
          </Button>
          <Button onClick={onClose} data-testid="approval-rule-close">
            Cancel
          </Button>
          <p className="ml-auto max-w-[220px] text-right text-[12px] text-ink-muted">{VIEW_ONLY}</p>
        </footer>
      </aside>
    </div>
  );
}

function ApprovalsTab() {
  const { pack } = useShell();
  const rule = approvalRuleOf(pack);
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const card = "rounded-[10px] border border-line bg-white p-6";
  const rowBox = "mt-4 rounded-[8px] border border-line";
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
        <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-ink-muted" data-testid="settings-view-only">
          <Icon name="lock" size={13} /> View only. {VIEW_ONLY}
        </p>
      </section>

      <section className={card} data-testid="standard-approvals">
        <h2 className="text-[16px] font-bold">Standard approvals</h2>
        <p className="mt-1 text-[13.5px]">Use automation to set up approval on quotes that meet your choice of criteria and approvers. Standard quote approvals cannot be turned on at the same time as advanced quote approvals.</p>
        <div className={rowBox}>
          <div className="flex items-center gap-3 px-4 py-3">
            <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-2.5 text-left text-[14px] font-bold" data-testid="standard-approvals-toggle">
              <Icon name={open ? "chevronDown" : "chevronRight"} size={16} /> Quotes
            </button>
            <Button size="sm" onClick={() => setEditing(true)} data-testid="standard-approvals-edit">
              Edit
            </Button>
            <Switch on label="Standard approvals for quotes" testId="standard-approvals-switch" />
          </div>
          {open ? <RuleSummary rule={rule} marked={!editing} /> : null}
        </div>
      </section>

      <section className={card} data-testid="advanced-approvals">
        <h2 className="text-[16px] font-bold">Advanced approvals</h2>
        <p className="mt-1 text-[13.5px]">Use workflow automation for dynamic, property-driven logic, and sequential quote approval steps. Advanced quote approvals cannot be turned on at the same time as standard quote approvals.</p>
        <p className="mt-3 text-[13.5px]">
          Learn more about creating and managing advanced quote approvals on our <span className="font-semibold text-link">Knowledge Base article</span> <Icon name="external" size={12} className="inline align-[-1px] text-link" /> .
        </p>
        <div className={cx(rowBox, "flex items-center gap-3 px-4 py-3")}>
          <span className="flex min-w-0 flex-1 items-center gap-2.5 text-[14px] font-bold">
            <Icon name="chevronRight" size={16} /> Advanced quote approvals
          </span>
          <Button size="sm" disabled title="Standard approvals are turned on">
            Edit
          </Button>
          <Switch on={false} label="Advanced quote approvals" />
        </div>
      </section>

      {editing ? <RulePanel rule={rule} onClose={() => setEditing(false)} /> : null}
    </div>
  );
}

/**
 * Settings > Objects > Quotes, with the Approvals tab where HubSpot keeps the standard quote approval rule.
 * It shows the rule the quote's Approvals panel checks against, read from the same place.
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
            <ApprovalsTab />
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
