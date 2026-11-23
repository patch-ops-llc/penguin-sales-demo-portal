import type { Pack } from "../types";
import { postVisitFeedbackConfig } from "./post-visit-feedback";
import { socialAdsConfig } from "./social";

// Demo configurations for Healthcare (Crestline Clinical Staffing & Specialty Clinics).
// Includes Flow 3 (socialAds) and Healthcare #5 (post-visit-feedback via reusable Tickets workspace).
// Minimal valid configurations for the shared shell screens keep Companies, Deals, Quotes,
// Settings > Approvals, Inbox, and Prospecting working cleanly without missing defaults.

export const demos: Pack["demos"] = {
  socialAds: socialAdsConfig,
  tickets: {
    "post-visit-feedback": postVisitFeedbackConfig,
  },
  guidedQuote: {
    dealId: "dl-mercy-icu",
    contactId: "ct-karen",
    intro: "Configure travel clinician specialty, shift coverage, and credentialing package to price a 13-week healthcare staffing order.",
    fields: [
      {
        id: "specialty",
        label: "Clinical specialty",
        options: [
          { id: "icu", label: "ICU Travel RN", attrs: { sku: "CC-RN-ICU", price: 28000 } },
          { id: "er", label: "ER Travel RN", attrs: { sku: "CC-RN-ER", price: 27400 } },
        ],
      },
    ],
    quantity: { label: "Clinicians needed", options: [2, 4, 6] },
    needBy: { label: "Start target", options: [{ id: "2w", label: "2 weeks", days: 14 }] },
    constraints: [],
    lines: [
      {
        role: "Clinician placement",
        sku: "{specialty.sku}",
        name: "13-week travel RN placement",
        description: "All-in weekly bill rate, 36 hrs/wk for 13 weeks.",
        price: { base: 0, add: ["specialty.price"], multiply: [] },
        costRatio: 0.75,
        lead: { base: 2, add: [] },
        qtyPerUnit: 1,
        timing: "13 weeks",
      },
    ],
    notes: [],
    scripted: { selections: { specialty: "icu" }, quantity: 4, needBy: "2w" },
    quoteTitle: "Mercy Pines Health System: 4 ICU Travel RNs",
  },
  discountApproval: {
    quoteId: "q-4102",
    thresholdPct: 8,
    marginFloorPct: 20,
    approverId: "naomi",
    scriptedDiscountPct: 12,
  },
  backOffice: {
    companyId: "co-mercy-pines",
    contactId: "ct-karen",
    systemLabel: "Bullhorn ATS / VMS",
    syncedAt: "@-15mi",
    orders: [
      {
        id: "ord-hc-1",
        number: "JO-88412",
        date: "@-18d",
        status: "Active",
        po: "MPHS-2027-ICU",
        total: 112000,
        lines: [{ sku: "CC-RN-ICU", name: "Travel ICU Registered Nurse (13-week)", qty: 4, unitPrice: 28000 }],
      },
    ],
    invoices: [
      { id: "inv-hc-1", number: "INV-90412", date: "@-12d", dueDate: "@+18d", amount: 24800, balance: 24800, status: "Open" },
    ],
    stock: [
      { sku: "CC-RN-ICU", name: "Travel ICU Registered Nurse (13-week)", onHand: 18, leadDays: 2, contractPrice: 27400, listPrice: 28000, unitCost: 20600, lastOrdered: "@-18d", usualQty: 4, timing: "48 hrs" },
    ],
    scriptedSkus: ["CC-RN-ICU"],
    scriptedOrderId: "ord-hc-1",
    quoteTitle: "Mercy Pines Health System: Winter ICU Surge Extension",
    dealName: "Mercy Pines Health System: ICU Surge Extension",
  },
  leadCapture: {
    site: {
      company: "Crestline Clinical Staffing",
      url: "https://crestlineclinical.example/request-staffing",
      headline: "Rapid clinical staffing for hospitals and specialty clinics",
      sub: "Request pre-credentialed travel nurses and allied health clinicians in 48 hours.",
      formTitle: "Request clinical staffing",
      interests: ["ICU & ER Travel RNs", "Telemetry & Med-Surg RNs", "Allied Health & Surgical Techs"],
    },
    presets: [
      {
        id: "icu-surge",
        label: "Regional Hospital ICU Surge",
        outcome: "Routed to Marcus Delgado",
        form: {
          firstName: "Rachel",
          lastName: "Morales",
          email: "rachel.morales@cedarvalleymed.example",
          phone: "(303) 555-0194",
          title: "Director of Nursing Operations",
          company: "Cedar Valley Medical Center",
          interest: "ICU & ER Travel RNs",
          message: "Need 6 ICU & ER travel RNs for a 13-week winter census surge.",
        },
        company: {
          domain: "cedarvalleymed.example",
          industry: "Hospital & Health Care",
          city: "Denver",
          state: "CO",
          employees: 1450,
          revenue: 410000000,
          phone: "(303) 555-0100",
          description: "320-bed regional acute care hospital serving metro Denver.",
          territory: "Mountain West",
          type: "Prospect",
        },
        score: 92,
        reasons: [{ label: "Acute care hospital (1,000+ staff)", points: 45, detail: "High multi-shift placement volume." }],
        route: { branchId: "acute", ownerId: "marcus", summary: "Routed to Marcus Delgado (Healthcare Staffing AE)" },
      },
    ],
    scriptedPresetId: "icu-surge",
    workflowId: "wf-staffing-followup",
    dealStage: "new-rfq",
  },
  emailToDeal: {
    sampleIds: ["th-mercy-icu"],
    scriptedThreadId: "th-mercy-icu",
    dealStage: "new-rfq",
  },
  aiProspecting: {
    companyId: "co-cascadia-med",
    whyNow: {
      headline: "New 18-bed ICU wing opening next quarter",
      points: [{ label: "Facility expansion", detail: "Publicly announced 18-bed critical care wing in Tacoma.", source: "Hospital news" }],
    },
    buyingGroup: [
      { id: "bg-hannah", name: "Dr. Hannah Kowalski", title: "VP Clinical Operations", role: "Economic buyer", email: "hannah.kowalski@cascadiamed.example", contactId: "ct-hannah", why: "Oversees acute care nursing operations and agency budgets." },
    ],
    drafts: {
      "bg-hannah": [
        { tone: "Direct", subject: "ICU wing staffing readiness at Cascadia Regional", body: "Hi Dr. Kowalski,\n\nCongrats on the new 18-bed ICU expansion. We have 11 Washington-licensed CCRN travel nurses ready if you need surge coverage during ramp-up." },
      ],
    },
    followUp: { title: "Follow up with Dr. Hannah Kowalski on ICU expansion", dueInDays: 3 },
  },
};
