import type { Pack } from "../types";
import { healthcareCustomerAgent } from "./customer-agent";
import { healthcareIntakeConfigs } from "./intake";
import { postVisitFeedbackConfig } from "./post-visit-feedback";
import { patientReactivationConfig } from "./reactivation";
import { socialAdsConfig } from "./social";

// Demo configurations for Healthcare (Crestline Clinical Staffing & Specialty Clinics).
// Live demos: Social media & paid ads (Flow 3), Clinic front desk (H1), Referral intake (H2), Referral-source outreach (H3),
// Patient reactivation (H4), Post-visit feedback (H5), and Staffing job orders (H6). 100% fictional data, zero PHI.

export const demos: Pack["demos"] = {
  socialAds: socialAdsConfig,
  customerAgent: healthcareCustomerAgent,
  patientReactivation: patientReactivationConfig,
  tickets: {
    "post-visit-feedback": postVisitFeedbackConfig,
  },
  intake: healthcareIntakeConfigs,
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
    companyId: "co-summit-creek",
    signalDetail: {
      fed: {
        title: "Referral-Volume Signal Feed",
        source: "EHR / Claims Analytics",
        detail: "Quarterly specialty referrals from Summit Creek Family Medicine dropped 34% while a newly credentialed internist joined and their Lakewood clinic opened.",
        bars: [
          { label: "Q2 referrals", value: 44, unit: "referrals" },
          { label: "Q3 referrals", value: 46, unit: "referrals" },
          { label: "Q4 referrals", value: 39, unit: "referrals" },
          { label: "Q1 (current)", value: 30, unit: "referrals", now: true },
        ],
        footnote: "Aggregated practice-level referral counts only (zero patient PHI).",
      },
      native: {
        title: "New physician credentialed & clinic location opened",
        source: "Breeze account research",
        detail: "NPI registry and clinic announcement confirmed Dr. Priya Nair, MD (Internal Medicine) completed credentialing 19 days ago and Summit Creek opened its third clinic location in Lakewood, CO.",
        footnote: "HubSpot Breeze combines credentialing and expansion signals with liaison CRM history.",
      },
    },
    whyNow: {
      headline: "Referrals fell 34% just as Summit Creek credentialed a new physician and opened a third clinic",
      points: [
        {
          label: "Referral volume drop",
          detail: "Quarterly cardiology & orthopedic referrals declined from 46 to 30 (-34% QoQ) after staff turnover at the referral desk.",
          source: "EHR Referral Feed",
        },
        {
          label: "New physician credentialed",
          detail: "Dr. Priya Nair, MD (Internal Medicine) joined 19 days ago and has not yet met Crestline's specialty clinic directors.",
          source: "NPI Directory",
        },
        {
          label: "New clinic location",
          detail: "Third primary-care clinic opened in Lakewood, CO last month with 8 new exam rooms and immediate specialty consult demand.",
          source: "Breeze research",
        },
      ],
    },
    buyingGroup: [
      {
        id: "bg-priya",
        name: "Dr. Priya Nair, MD",
        title: "Referring Physician (Internal Medicine)",
        role: "Referring physician",
        email: "priya.nair@summitcreekmed.example",
        contactId: null,
        why: "Newly credentialed internist at the Lakewood location; decides where complex cardiology and ortho patients are referred.",
      },
      {
        id: "bg-martha",
        name: "Martha Lindholm",
        title: "Practice & Office Manager",
        role: "Office manager",
        email: "martha.lindholm@summitcreekmed.example",
        contactId: "ct-martha",
        why: "Runs referral coordinator workflows, clinic scheduling handoffs, and provider lunch-and-learn calendars.",
      },
      {
        id: "bg-owen",
        name: "Dr. Owen Gallagher, DO",
        title: "Medical Director",
        role: "Clinical champion",
        email: "owen.gallagher@summitcreekmed.example",
        contactId: "ct-owen",
        why: "Historically referred 20+ patients per quarter to Crestline; key clinical sponsor across all 3 locations.",
      },
    ],
    drafts: {
      "bg-priya": [
        {
          tone: "Consultative",
          subject: "Welcome to Lakewood, Dr. Nair — fast-track specialty referrals & lunch-and-learn",
          body: "Hi Dr. Nair,\n\nWelcome to Summit Creek Family Medicine's new Lakewood clinic. I work with our cardiology and orthopedic specialists at Crestline Specialty Clinics just ten minutes east of your office.\n\nTo make specialty consults effortless as your panel ramps, we offer same-week diagnostic slots and 48-hour scheduling confirmations back to your care team. Could our cardiology lead and I bring lunch for a 30-minute lunch-and-learn with you and Martha later this month?\n\nBest regards,\nDevon Patel\nPhysician Liaison, Crestline Specialty Clinics",
        },
        {
          tone: "Direct",
          subject: "Same-week cardiology & ortho consults for your new Lakewood clinic",
          body: "Hi Dr. Nair,\n\nCongrats on joining Summit Creek's Lakewood location. Crestline Specialty Clinics holds dedicated same-week slots for primary-care referrals across cardiology, orthopedics, and outpatient imaging.\n\nWould you have 30 minutes over lunch next week to meet our medical lead and review our direct referral line?\n\nBest,\nDevon Patel",
        },
        {
          tone: "Warm",
          subject: "Introducing Crestline Specialty Clinics — lunch on us in Lakewood",
          body: "Hello Dr. Nair,\n\nCongratulations on your recent move to Summit Creek Family Medicine! We have partnered with Dr. Gallagher and Martha for years and would love to welcome you in person.\n\nI included our scheduling link below if a catered 30-minute lunch-and-learn works for you and the Lakewood team.\n\nWarmly,\nDevon Patel",
        },
      ],
      "bg-martha": [
        {
          tone: "Consultative",
          subject: "Streamlining Lakewood referrals + lunch-and-learn for Summit Creek",
          body: "Hi Martha,\n\nCongrats on opening the new Lakewood clinic and welcoming Dr. Priya Nair to the team! We noticed referrals from Summit Creek dipped slightly this quarter while your staff was busy with the expansion, and we want to make sure our intake desk is making life easier for your coordinators.\n\nWe recently launched 48-hour appointment confirmation notices for referring offices. Would Tuesday or Thursday at noon work for a quick catered lunch-and-learn with you, Dr. Nair, and Dr. Gallagher?\n\nBest regards,\nDevon Patel\nPhysician Liaison, Crestline Specialty Clinics",
        },
        {
          tone: "Direct",
          subject: "Quick check-in on Lakewood referral workflow + lunch-and-learn",
          body: "Hi Martha,\n\nHope the new Lakewood opening is going smoothly. We can set up direct non-PHI status confirmations for your referral coordinators in 15 minutes and introduce Dr. Nair to our specialty desk.\n\nCan we grab a 30-minute lunch slot next week? My scheduling link is below.\n\nThanks,\nDevon Patel",
        },
        {
          tone: "Warm",
          subject: "Congrats on Lakewood! Bringing lunch for you & Dr. Nair",
          body: "Hi Martha,\n\nHuge congratulations to you and the entire Summit Creek team on the Lakewood opening and adding Dr. Nair! Let us bring lunch from your favorite spot and walk through our new fast-track scheduling portal for your referral team.\n\nFeel free to pick any lunch slot that fits the clinic's calendar.\n\nBest,\nDevon Patel",
        },
      ],
      "bg-owen": [
        {
          tone: "Consultative",
          subject: "Supporting Summit Creek's Lakewood launch & Dr. Nair's new panel",
          body: "Hi Dr. Gallagher,\n\nCongratulations on opening the Lakewood clinic and adding Dr. Priya Nair to Summit Creek. We value our long partnership with your practice and want to ensure your providers continue seeing fast consult turnarounds as volume grows.\n\nI reached out to Martha and Dr. Nair about hosting a brief lunch-and-learn with our cardiology and ortho leads — hope you can join us.\n\nBest regards,\nDevon Patel\nPhysician Liaison, Crestline Specialty Clinics",
        },
        {
          tone: "Direct",
          subject: "Direct specialist access for Summit Creek's Lakewood expansion",
          body: "Hi Dr. Gallagher,\n\nAs Summit Creek ramps Lakewood and onboards Dr. Nair, we reserved priority specialty consult blocks for your providers. Let's reconnect over a 30-minute lunch-and-learn with Martha and Dr. Nair next week.\n\nBest,\nDevon Patel",
        },
        {
          tone: "Warm",
          subject: "Great to see Summit Creek expanding into Lakewood",
          body: "Hi Dr. Gallagher,\n\nAlways wonderful seeing Summit Creek grow. We would love to host lunch for you, Dr. Nair, and Martha to introduce our newest orthopedic surgeon and keep referrals effortless for your team.\n\nWarm regards,\nDevon Patel",
        },
      ],
    },
    followUp: { title: "Confirm lunch-and-learn headcount with Martha Lindholm", dueInDays: 3 },
    offPlatformMeeting: {
      inboxEmail: "martha.lindholm@summitcreekmed.example",
      recipientName: "Martha Lindholm",
      recipientTitle: "Practice & Office Manager",
      practiceName: "Summit Creek Family Medicine",
      senderName: "Devon Patel",
      senderTitle: "Physician Liaison, Crestline Specialty Clinics",
      meetingTitle: "Crestline x Summit Creek Provider Lunch-and-Learn",
      meetingLocation: "Summit Creek Family Medicine — Lakewood Clinic (Conference Room B)",
      meetingDuration: "30 min · Catered",
      bookingUrl: "https://meetings.crestlineclinical.example/liaison/summit-creek-lunch-and-learn",
      agenda: [
        "Introduce Dr. Priya Nair to Crestline Cardiology & Orthopedics leads",
        "Walk through 48-hour referral scheduling confirmations for office coordinators",
        "Share dedicated Lakewood same-week diagnostic consult blocks",
      ],
      slots: [
        { id: "slot-1", day: "Tue, Jan 26", time: "12:00 PM", tz: "MT" },
        { id: "slot-2", day: "Thu, Jan 28", time: "12:15 PM", tz: "MT" },
        { id: "slot-3", day: "Tue, Feb 2", time: "12:00 PM", tz: "MT" },
      ],
      defaultSlotId: "slot-1",
      complianceNote: "Practice-level physician liaison session · Zero patient PHI discussed or stored in HubSpot.",
    },
    reportId: "referral-outreach",
  },
};
