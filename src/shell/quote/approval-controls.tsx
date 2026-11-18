"use client";

import type { ApprovalFilter } from "@/store/quote-math";
import { Ext } from "../ext";
import { Icon } from "../icons";
import { cx } from "../ui";

// The approval settings and the approval workflow are shown as saved: their controls show a value and do not change it.

/** A dropdown as HubSpot draws it, showing the saved choice. */
export function Picker({ children, testId, title }: { children?: React.ReactNode; testId?: string; title: string }) {
  return (
    <span title={title} data-testid={testId} className="flex min-h-9 w-full cursor-default items-center gap-2 rounded-[4px] border border-[#7c8a99] bg-white px-3 py-1.5 text-[13.5px]">
      <span className="min-w-0 flex-1">{children}</span>
      <span className="h-0 w-0 shrink-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-ink" aria-hidden="true" />
    </span>
  );
}

/** A button of the editor that is drawn but does nothing here, such as Discard. */
export function StillButton({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <span className="inline-flex h-8 cursor-default items-center gap-1.5 rounded-[4px] border border-[#7c8a99] bg-white px-3 text-[13px] text-ink-muted" title={title}>
      {children}
    </span>
  );
}

export const filterSentence = (f: ApprovalFilter) => (
  <>
    <span className="font-semibold">{f.property}</span> {f.operator} <span className="font-semibold">{f.value}</span>
  </>
);

/** The filter that reads Penguin's line item flag carries the marker; the rule around it is HubSpot's own. */
export function Marked({ filter, marked = true, className, children }: { filter: ApprovalFilter; marked?: boolean; className?: string; children: React.ReactNode }) {
  if (filter.id !== "floor" || !marked) return <div className={className}>{children}</div>;
  return (
    <Ext id="floor-price-rule" className={cx(className, "pr-10")} pinClass="!right-1.5 !top-1.5">
      {children}
    </Ext>
  );
}

/** One filter in an editor: property, operator, value, stacked as HubSpot stacks them. */
export function FilterFields({ filter, title }: { filter: ApprovalFilter; title: string }) {
  const percent = filter.value.endsWith("%");
  return (
    <Marked filter={filter} className="rounded-[6px] bg-[#f0f0f0] p-2.5">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Picker title={title}>{filter.property}</Picker>
          <Picker title={title}>{filter.operator}</Picker>
          {percent ? (
            <div className="flex items-center gap-2">
              <input readOnly value={filter.value.slice(0, -1)} aria-label={`${filter.property} value`} title={title} className="h-9 min-w-0 flex-1 cursor-default rounded-[4px] border border-[#7c8a99] bg-white px-3 text-[13.5px] focus:outline-none" />
              <span className="w-4 text-[13.5px]">%</span>
            </div>
          ) : (
            <Picker title={title}>{filter.value}</Picker>
          )}
        </div>
        <span className="mt-2 text-ink-muted" aria-hidden="true">
          <Icon name="close" size={16} />
        </span>
      </div>
    </Marked>
  );
}
