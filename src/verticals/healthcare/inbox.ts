import type { InboxThread } from "../types";

// Sample inbound staffing emails for Crestline Clinical Staffing's CRM Inbox.
// Keeps the shared Inbox view populated and coherent inside the Healthcare vertical.

export const threads: InboxThread[] = [
  {
    id: "th-mercy-icu",
    from: { name: "Karen Holloway", email: "karen.holloway@mercypineshealth.example" },
    companyId: "co-mercy-pines",
    contactId: "ct-karen",
    subject: "Updated Q1 ICU & Telemetry shift schedule",
    preview: "Attaching our revised 13-week winter census forecast — hoping to lock 4 more night-shift RNs before February.",
    at: "@-3h",
    unread: true,
    body: [
      { text: "Hi Marcus,\n\nThanks for turning around the first batch of credentialed ICU profiles so quickly. " },
      { text: "Our CNO just approved 4 additional night-shift ICU travel RNs for a 13-week assignment starting next month. " },
      { text: "Can you confirm weekly bill rates and send over any compact-licensed candidates ready for interviews this week?\n\nBest,\nKaren Holloway\nDirector of Nursing, Mercy Pines Health System" },
    ],
  },
  {
    id: "th-ridgecrest-or",
    from: { name: "Tanya Brooks", email: "tanya.brooks@ridgecrestclinics.example" },
    companyId: "co-ridgecrest",
    contactId: "ct-tanya",
    subject: "Ambulatory surgery center CST coverage",
    preview: "Following up on our Facebook question — we have 2 orthopedic OR suites needing certified surgical techs.",
    at: "@-9h",
    unread: true,
    body: [
      { text: "Hi Crestline team,\n\nWe saw your credentialing checklist post and wanted to reach out directly. " },
      { text: "Ridgecrest Specialty Clinics is adding two orthopedic surgery blocks in Scottsdale and needs 2 certified surgical technologists (CST) for 13 weeks.\n\nPlease send over availability and credentialing lead time.\n\nThanks,\nTanya Brooks" },
    ],
  },
  {
    id: "th-cascadia-cred",
    from: { name: "Dr. Hannah Kowalski", email: "hannah.kowalski@cascadiamed.example" },
    companyId: "co-cascadia-med",
    contactId: "ct-hannah",
    subject: "Joint Commission credentialing packet format",
    preview: "Our compliance office reviewed your sample verification packet and approved Crestline as a preferred vendor.",
    at: "@-2d",
    unread: false,
    body: [
      { text: "Hi Devon,\n\nGood news — our hospital compliance committee reviewed Crestline's Joint Commission verification checklist and cleared you for our preferred ICU & ER vendor tier.\n\nLet's schedule 15 minutes this week to align on Q1 night-shift demand.\n\nRegards,\nDr. Hannah Kowalski" },
    ],
  },
];
