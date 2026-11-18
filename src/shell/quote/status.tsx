import { quoteStatusColor, quoteStatusLabel } from "@/store/quote-math";
import type { QuoteStatus as Status } from "@/verticals/types";
import { cx } from "../ui";

/** A quote's status as HubSpot shows it on records and in the quotes index: a colored dot and the status name. */
export function QuoteStatus({ status, className, testId }: { status: Status; className?: string; testId?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap", className)}>
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: quoteStatusColor(status) }} aria-hidden="true" />
      <span data-testid={testId}>{quoteStatusLabel(status)}</span>
    </span>
  );
}
