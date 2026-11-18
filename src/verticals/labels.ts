import type { ApprovalLabels, BackOfficeLabels, DeepPartial, EmailLabels, GuidedLabels, Pack, PackLabels } from "./types";

// Wording the demo screens share. The defaults are Manufacturing's, so its pack sets none of
// them; another vertical overrides only the phrases that do not fit it.

const PACK: PackLabels = {
  pipeline: "Sales pipeline",
  territory: "Sales territory",
  timing: "Lead time",
  quoteTotal: "Total",
  recurring: { annual: "Annual recurring revenue", oneTime: "One-time" },
  synced: {
    title: "{backOffice} Sync",
    account: "{backOffice} Account Number",
    lastOrder: "{backOffice} Last Order Date",
    openBalance: "{backOffice} Open Balance",
    status: "{backOffice} Credit Status",
  },
};

const GUIDED: GuidedLabels = {
  source: "Prices and lead times from the {backOffice}",
  timing: "Quoted lead time",
  leadCheck: "Ships in {lead} days. Needed {need} ({days} days).",
};

const APPROVAL: ApprovalLabels = {
  rule: "A discount over {limit}%, or a line priced under its floor price, needs approval from {approver}, {title}.",
  costFeed: "Unit cost on every line is synced from the {backOffice}. Last sync {when}.",
  discount: "Discount",
};

const EMAIL: EmailLabels = {
  empty: "New requests for quotes and purchase orders land here.",
  flagged: "No exact match. Pick the right part:",
  confirm: "Confirm the flagged part first.",
  total: "Deal amount at list price",
  dealType: "Existing business",
};

const BACK_OFFICE: BackOfficeLabels = {
  live: "Live from the {system}, read {when}",
  tabs: { orders: "Orders", balance: "Balance", stock: "Stock and pricing" },
  orders: { number: "Order", date: "Date", po: "Customer PO", status: "Status", total: "Total" },
  balance: { open: "Open balance", overdue: "Overdue", limit: "Credit limit", status: "Credit status", invoice: "Invoice" },
  stock: { onHand: "On hand", none: "Built to order", nearLimit: "Near limit", timing: "Lead time", contract: "Contract price", list: "List price", last: "Last ordered" },
  add: {
    button: "Add to quote",
    help: "Starts a quote at this customer's contract price and usual quantity.",
    lineNote: "Contract price from the ERP",
    origin: "Created from the ERP card",
    dealType: "Existing business",
  },
};

function merge<T>(base: T, over: DeepPartial<T> | undefined): T {
  if (!over) return base;
  const out = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(over)) {
    if (value === undefined) continue;
    const current = out[key];
    out[key] = current && typeof current === "object" && !Array.isArray(current) ? merge(current, value as DeepPartial<typeof current>) : value;
  }
  return out as T;
}

export type Labels = { pack: PackLabels; guided: GuidedLabels; approval: ApprovalLabels; backOffice: BackOfficeLabels; email: EmailLabels };

const cache = new WeakMap<Pack, Labels>();

export function labelsOf(pack: Pack): Labels {
  let labels = cache.get(pack);
  if (!labels) {
    labels = {
      pack: merge(PACK, pack.labels),
      guided: merge(GUIDED, pack.demos.guidedQuote.labels),
      approval: merge(APPROVAL, pack.demos.discountApproval.labels),
      backOffice: merge(BACK_OFFICE, pack.demos.backOffice.labels),
      email: merge(EMAIL, pack.demos.emailToDeal.labels),
    };
    cache.set(pack, labels);
  }
  return labels;
}

/** Fills "{name}" placeholders in a label. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{([a-zA-Z]+)\}/g, (whole, name: string) => (name in vars ? String(vars[name]) : whole));
}

/** What the lead-time column shows for a line, product, or stock item. */
export function timingOf(item: { leadDays: number; timing?: string }): string {
  return item.timing ?? `${item.leadDays} days`;
}
