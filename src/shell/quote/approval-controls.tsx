"use client";

import type { ApprovalFilter } from "@/store/quote-math";
import { Ext } from "../ext";
import { Icon } from "../icons";
import { cx } from "../ui";

/** A dropdown as HubSpot draws it, showing the saved choice. It does not open. */
export function Picker({ children, testId, title }: { children?: React.ReactNode; testId?: string; title?: string }) {
  return (
    <span title={title} data-testid={testId} className="flex min-h-9 w-full cursor-default items-center gap-2 rounded-[4px] border border-[#7c8a99] bg-white px-3 py-1.5 text-[13.5px]">
      <span className="min-w-0 flex-1">{children}</span>
      <span className="h-0 w-0 shrink-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-ink" aria-hidden="true" />
    </span>
  );
}

/** A small outlined button, as HubSpot draws Discard and Add filter. Without onClick it is drawn but does nothing. */
export function SmallButton({ children, onClick, testId }: { children: React.ReactNode; onClick?: () => void; testId?: string }) {
  const look = "inline-flex h-8 items-center gap-1.5 rounded-[4px] border border-[#7c8a99] bg-white px-3 text-[13px]";
  return onClick ? (
    <button type="button" onClick={onClick} data-testid={testId} className={cx(look, "font-semibold hover:bg-[#f5f5f5]")}>
      {children}
    </button>
  ) : (
    <span className={cx(look, "cursor-default text-ink-muted")}>{children}</span>
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

/**
 * One filter in the workflow's criteria: property, operator, value, stacked as HubSpot stacks them.
 * The percentage can be changed and the filter removed; the property and operator are fixed for each kind of filter.
 */
export function FilterFields({ filter, limit, onLimit, onRemove }: { filter: ApprovalFilter; limit: string; onLimit: (value: string) => void; onRemove: () => void }) {
  return (
    <Marked filter={filter} className="rounded-[6px] bg-[#f0f0f0] p-2.5">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Picker>{filter.property}</Picker>
          <Picker>{filter.operator}</Picker>
          {filter.id === "discount" ? (
            <div className="flex items-center gap-2">
              <input
                value={limit}
                onChange={(e) => onLimit(e.target.value)}
                inputMode="decimal"
                aria-label={`${filter.property} value`}
                data-testid="aw-limit"
                className="h-9 min-w-0 flex-1 rounded-[4px] border border-[#7c8a99] bg-white px-3 text-[13.5px] focus:border-ink focus:outline-none focus:ring-2 focus:ring-[#b6d9d7]"
              />
              <span className="w-4 text-[13.5px]">%</span>
            </div>
          ) : (
            <Picker>{filter.value}</Picker>
          )}
        </div>
        <button type="button" onClick={onRemove} aria-label={`Remove ${filter.property}`} data-testid={`aw-remove-${filter.id}`} className="mt-1.5 rounded p-0.5 hover:bg-[#dcdcdc]">
          <Icon name="close" size={16} />
        </button>
      </div>
    </Marked>
  );
}
