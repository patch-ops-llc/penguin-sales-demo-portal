import type { ContractRenewalConfig, PremiumToSubscriptionConfig, RenewalChurnRiskConfig, RenewalsDemoId } from "@/shell/renewals/types";
import { flag, has, type DemoScript } from "./types";

export const renewalsReportFlag = (demoId: RenewalsDemoId) => `renewals.${demoId}.reportSeen`;

export const premiumToSubscription: DemoScript = {
  id: "premium-to-subscription",
  steps: [
    {
      id: "close-premium",
      title: "Close Premium deal Won",
      hint: "Dual-Pipeline Deals: click Mark Closed Won & send checkout link on Thistledown Veterinary Network",
      path: () => "/renewals/premium-to-subscription/pipelines",
      done: ({ w }) => w.renewals["premium-to-subscription"].premiumClosed,
      script: (_c, now) => [{ t: "ren.closePremium", at: now }],
    },
    {
      id: "complete-checkout",
      title: "Customer completes billing checkout",
      hint: "Off-platform billing checkout: confirm payment details and click Complete payment",
      path: () => "/renewals-app/premium-to-subscription/checkout",
      done: ({ w }) => w.renewals["premium-to-subscription"].checkoutCompleted,
      script: (_c, now) => [{ t: "ren.completeCheckout", at: now }],
    },
    {
      id: "verify-sync",
      title: "Verify Subscription deal & dates",
      hint: "Subscription deal: inspect Billing Checkout & Subscription Sync card (start/renewal dates & MRR), then click Confirm billing sync",
      path: ({ pack }) => {
        const cfg = pack.demos.renewals?.["premium-to-subscription"] as PremiumToSubscriptionConfig | undefined;
        return `/deals/${cfg?.subscriptionDeal.dealId ?? ""}`;
      },
      done: ({ w }) => w.renewals["premium-to-subscription"].syncVerified,
      script: (_c, now) => [{ t: "ren.verifySync", at: now }],
    },
    {
      id: "assign-cs",
      title: "Assign CS owner & kickoff tasks",
      hint: "Native CS Handoff card: click Assign CS owner & create kickoff tasks",
      path: ({ pack }) => {
        const cfg = pack.demos.renewals?.["premium-to-subscription"] as PremiumToSubscriptionConfig | undefined;
        return `/deals/${cfg?.subscriptionDeal.dealId ?? ""}`;
      },
      done: ({ w }) => w.renewals["premium-to-subscription"].csAssigned,
      script: (_c, now) => [{ t: "ren.assignCs", at: now }],
    },
    {
      id: "review-pipelines",
      title: "Verify dual-pipeline handoff",
      hint: "Dual-Pipeline Deals: confirm Closed Won in Premium & Onboarding Kickoff in Subscription, then click Open MRR & renewals report",
      path: () => "/renewals/premium-to-subscription/pipelines",
      done: ({ w }) => w.renewals["premium-to-subscription"].pipelinesReviewed,
      script: () => [{ t: "ren.reviewPipelines" }],
    },
    {
      id: "review-report",
      title: "Review MRR & renewals report",
      hint: "Analytics: filter MRR, conversion rate & upcoming renewals by plan tier, then click Complete review",
      path: ({ pack }) => {
        const cfg = pack.demos.renewals?.["premium-to-subscription"] as PremiumToSubscriptionConfig | undefined;
        return `/reports/${cfg?.reportId ?? ""}`;
      },
      done: (c) => has(c, renewalsReportFlag("premium-to-subscription")),
      script: () => [flag(renewalsReportFlag("premium-to-subscription"))],
    },
  ],
};

export const renewalChurnRisk: DemoScript = {
  id: "renewal-churn-risk",
  steps: [
    {
      id: "trigger-renewal",
      title: "Trigger 90-day renewal workflow",
      hint: "Renewal Workflows: click Run 90-day renewal trigger to open the renewal deal & CSM alert",
      path: () => "/renewals/renewal-churn-risk/trigger",
      done: ({ w }) => w.renewals["renewal-churn-risk"].triggered,
      script: (_c, now) => [{ t: "ren.trigger", demoId: "renewal-churn-risk", at: now }],
    },
    {
      id: "inspect-health",
      title: "Inspect Account Health Score & build quote",
      hint: "Company record: review declining seat usage + 2 open tickets on Account Health Score, then click Flag At-Risk & build retention quote",
      path: ({ pack }) => {
        const cfg = pack.demos.renewals?.["renewal-churn-risk"] as RenewalChurnRiskConfig | undefined;
        return `/companies/${cfg?.companyId ?? ""}`;
      },
      done: ({ w }) => w.renewals["renewal-churn-risk"].atRiskFlagged,
      script: (_c, now) => [{ t: "ren.flagAtRiskAndQuote", at: now }],
    },
    {
      id: "request-approval",
      title: "Request Deal Desk approval",
      hint: "Quote editor: 15% retention discount exceeds the 10% limit. Click Request approval and submit",
      path: ({ pack }) => {
        const cfg = pack.demos.renewals?.["renewal-churn-risk"] as RenewalChurnRiskConfig | undefined;
        return `/quotes/${cfg?.quote.quoteId ?? ""}`;
      },
      done: ({ w, pack }) => {
        const cfg = pack.demos.renewals?.["renewal-churn-risk"] as RenewalChurnRiskConfig | undefined;
        const q = w.quotes.find((x) => x.id === cfg?.quote.quoteId);
        return Boolean(q && (q.approval || q.status === "Sent" || q.status === "Accepted"));
      },
      script: ({ pack }, now) => {
        const cfg = pack.demos.renewals?.["renewal-churn-risk"] as RenewalChurnRiskConfig | undefined;
        return cfg ? [{ t: "quote.requestApproval", id: cfg.quote.quoteId, note: cfg.quote.approvalNote, at: now }] : [];
      },
    },
    {
      id: "approve-quote",
      title: "Deal Desk approves retention discount",
      hint: "Switch View as: Deal desk, open Approvals, and click Approve to unlock the renewal quote",
      path: ({ pack }) => {
        const cfg = pack.demos.renewals?.["renewal-churn-risk"] as RenewalChurnRiskConfig | undefined;
        return `/quotes/${cfg?.quote.quoteId ?? ""}`;
      },
      done: ({ w, pack }) => {
        const cfg = pack.demos.renewals?.["renewal-churn-risk"] as RenewalChurnRiskConfig | undefined;
        const q = w.quotes.find((x) => x.id === cfg?.quote.quoteId);
        return Boolean(q && (q.approval?.status === "approved" || q.status === "Sent" || q.status === "Accepted"));
      },
      script: ({ pack }, now) => {
        const cfg = pack.demos.renewals?.["renewal-churn-risk"] as RenewalChurnRiskConfig | undefined;
        return cfg
          ? [
              { t: "persona", id: cfg.approverId },
              { t: "quote.approve", id: cfg.quote.quoteId, message: cfg.quote.approverMessage, at: now },
              { t: "persona", id: cfg.csmOwnerId },
            ]
          : [];
      },
    },
    {
      id: "share-quote",
      title: "Publish retention renewal quote",
      hint: "Quote editor: click Share, then click View as buyer",
      path: ({ pack }) => {
        const cfg = pack.demos.renewals?.["renewal-churn-risk"] as RenewalChurnRiskConfig | undefined;
        return `/quotes/${cfg?.quote.quoteId ?? ""}`;
      },
      done: ({ w, pack }) => {
        const cfg = pack.demos.renewals?.["renewal-churn-risk"] as RenewalChurnRiskConfig | undefined;
        const q = w.quotes.find((x) => x.id === cfg?.quote.quoteId);
        return Boolean(q && (q.status === "Sent" || q.status === "Accepted"));
      },
      script: ({ pack }, now) => {
        const cfg = pack.demos.renewals?.["renewal-churn-risk"] as RenewalChurnRiskConfig | undefined;
        return cfg ? [{ t: "quote.send", id: cfg.quote.quoteId, at: now }] : [];
      },
    },
    {
      id: "buyer-accept",
      title: "Customer accepts quote (off-platform)",
      hint: "Buyer quote page: review retention terms and click Accept",
      path: ({ pack }) => {
        const cfg = pack.demos.renewals?.["renewal-churn-risk"] as RenewalChurnRiskConfig | undefined;
        return `/quotes/${cfg?.quote.quoteId ?? ""}/buyer`;
      },
      done: ({ w }) => w.renewals["renewal-churn-risk"].quoteAccepted,
      script: ({ pack }, now) => {
        const cfg = pack.demos.renewals?.["renewal-churn-risk"] as RenewalChurnRiskConfig | undefined;
        return cfg ? [{ t: "quote.accept", id: cfg.quote.quoteId, at: now }] : [];
      },
    },
    {
      id: "verify-closed",
      title: "Confirm renewal deal Closed Won",
      hint: "HubSpot Deal: verify Renewed Won stage & retained ARR, then click Open Renewal Forecast report",
      path: ({ pack }) => {
        const cfg = pack.demos.renewals?.["renewal-churn-risk"] as RenewalChurnRiskConfig | undefined;
        return `/deals/${cfg?.renewalDeal.dealId ?? ""}`;
      },
      done: ({ w }) => w.renewals["renewal-churn-risk"].renewalVerified,
      script: () => [{ t: "ren.verifyClosedRenewal" }],
    },
    {
      id: "review-report",
      title: "Review Renewal forecast & retention risk",
      hint: "Analytics: filter renewing vs. at-risk MRR by risk tier, then click Complete review",
      path: ({ pack }) => {
        const cfg = pack.demos.renewals?.["renewal-churn-risk"] as RenewalChurnRiskConfig | undefined;
        return `/reports/${cfg?.reportId ?? ""}`;
      },
      done: (c) => has(c, renewalsReportFlag("renewal-churn-risk")),
      script: () => [flag(renewalsReportFlag("renewal-churn-risk"))],
    },
  ],
};

export const contractRenewal: DemoScript = {
  id: "contract-renewal",
  steps: [
    {
      id: "trigger-renewal",
      title: "Trigger 120-day renewal workflow",
      hint: "Renewal Workflows: click Run 120-day renewal trigger to create the renewal deal & AM task",
      path: () => "/renewals/contract-renewal/trigger",
      done: ({ w }) => w.renewals["contract-renewal"].triggered,
      script: (_c, now) => [{ t: "ren.trigger", demoId: "contract-renewal", at: now }],
    },
    {
      id: "book-qbr",
      title: "Client books QBR (off-platform)",
      hint: "Off-platform QBR scheduler: pick a quarterly review slot and click Confirm QBR meeting",
      path: () => "/renewals-app/contract-renewal/qbr",
      done: ({ w }) => w.renewals["contract-renewal"].qbrBooked,
      script: (_c, now) => [{ t: "ren.bookQbr", at: now }],
    },
    {
      id: "create-quote",
      title: "Create renewal quote from deal",
      hint: "HubSpot Deal: review QBR booking & 185-user scope, then click Create renewal quote",
      path: ({ pack }) => {
        const cfg = pack.demos.renewals?.["contract-renewal"] as ContractRenewalConfig | undefined;
        return `/deals/${cfg?.renewalDeal.dealId ?? ""}`;
      },
      done: ({ w }) => Boolean(w.renewals["contract-renewal"].renewalQuoteId),
      script: (_c, now) => [{ t: "ren.createContractQuote", at: now }],
    },
    {
      id: "share-quote",
      title: "Publish renewal quote to client",
      hint: "Quote editor: verify Managed IT Complete lines and click Share, then View as buyer",
      path: ({ pack }) => {
        const cfg = pack.demos.renewals?.["contract-renewal"] as ContractRenewalConfig | undefined;
        return `/quotes/${cfg?.quote.quoteId ?? ""}`;
      },
      done: ({ w, pack }) => {
        const cfg = pack.demos.renewals?.["contract-renewal"] as ContractRenewalConfig | undefined;
        const q = w.quotes.find((x) => x.id === cfg?.quote.quoteId);
        return Boolean(q && (q.status === "Sent" || q.status === "Accepted"));
      },
      script: ({ pack }, now) => {
        const cfg = pack.demos.renewals?.["contract-renewal"] as ContractRenewalConfig | undefined;
        return cfg ? [{ t: "quote.send", id: cfg.quote.quoteId, at: now }] : [];
      },
    },
    {
      id: "buyer-accept",
      title: "Client accepts renewal quote (off-platform)",
      hint: "Buyer quote page: review renewed Managed IT agreement and click Accept",
      path: ({ pack }) => {
        const cfg = pack.demos.renewals?.["contract-renewal"] as ContractRenewalConfig | undefined;
        return `/quotes/${cfg?.quote.quoteId ?? ""}/buyer`;
      },
      done: ({ w }) => w.renewals["contract-renewal"].quoteAccepted,
      script: ({ pack }, now) => {
        const cfg = pack.demos.renewals?.["contract-renewal"] as ContractRenewalConfig | undefined;
        return cfg ? [{ t: "quote.accept", id: cfg.quote.quoteId, at: now }] : [];
      },
    },
    {
      id: "sync-psa",
      title: "Sync PSA agreement & roll end date",
      hint: "HubSpot Deal: click Sync PSA agreement & roll end date to write the new term & seats back to the PSA",
      path: ({ pack }) => {
        const cfg = pack.demos.renewals?.["contract-renewal"] as ContractRenewalConfig | undefined;
        return `/deals/${cfg?.renewalDeal.dealId ?? ""}`;
      },
      done: ({ w }) => w.renewals["contract-renewal"].psaSynced,
      script: (_c, now) => [{ t: "ren.syncPsa", at: now }],
    },
    {
      id: "review-report",
      title: "Review Renewal pipeline & at-risk ARR",
      hint: "Analytics: filter renewal pipeline & at-risk ARR by service tier, then click Complete review",
      path: ({ pack }) => {
        const cfg = pack.demos.renewals?.["contract-renewal"] as ContractRenewalConfig | undefined;
        return `/reports/${cfg?.reportId ?? ""}`;
      },
      done: (c) => has(c, renewalsReportFlag("contract-renewal")),
      script: () => [flag(renewalsReportFlag("contract-renewal"))],
    },
  ],
};
