import type { AnalyticsReportSpec, TicketsDemoConfig } from "../types";

/**
 * Healthcare #5 (`post-visit-feedback`): Post-visit feedback to service ticket.
 * Unified Healthcare vertical: Crestline Clinical Staffing & Specialty Clinics.
 *
 * Guardrails:
 * - 100% fictional clinics, people, emails (`*.example`), phone numbers (`555-01xx`), and metrics.
 * - ZERO PHI / zero clinical or medical information: strictly front-desk check-in, lobby wait time,
 *   parking, and scheduling experience.
 * - Penguin marker (`by: "penguin"`) ONLY on `ehr-visit-trigger` (EHR Visit-Completion Trigger).
 *   ZERO Penguin markers on the native post-visit survey, low-score workflow, Service Hub ticket,
 *   location manager assignment, or native Analytics report.
 */
export const postVisitFeedbackConfig: TicketsDemoConfig = {
  demoId: "post-visit-feedback",
  mode: "feedback",
  pipelineName: "Clinic Experience & Feedback",
  stages: [
    { id: "new-low-csat", label: "New — Low CSAT" },
    { id: "manager-outreach", label: "Manager Outreach Sent" },
    { id: "resolved", label: "Resolved", closed: true },
  ],
  ticket: {
    id: "tkt-hc-feedback-1",
    number: "TKT-5104",
    subject: "Low post-visit CSAT (2/5): Check-in kiosk wait time at Scottsdale Ortho",
    category: "Check-In & Wait Time",
    locationLabel: "Scottsdale Orthopedic Center (Ridgecrest)",
    sourceLabel: "Post-Visit CSAT Survey",
    priority: "High",
    ownerId: "valerie",
    contactId: "ct-jordan-vance",
    companyId: "co-ridgecrest",
    initialStageId: "new-low-csat",
    inProgressStageId: "manager-outreach",
    resolvedStageId: "resolved",
    summary:
      "Patient visitor rated check-in experience 2/5 after a 38-minute lobby delay caused by a self-check-in kiosk outage. Auto-routed to the Scottsdale Clinic Location Manager for same-day service recovery.",
    complianceNote:
      "Service experience record only — zero clinical notes, diagnoses, or PHI stored in HubSpot (HIPAA / BAA-ready posture).",
  },
  queueSeeds: [
    {
      id: "tkt-hc-seed-1",
      number: "TKT-5101",
      subject: "Parking garage signage unclear at Denver Spine entrance",
      pipeline: "Clinic Experience & Feedback",
      stageId: "manager-outreach",
      priority: "Medium",
      ownerId: "devon",
      contactId: "ct-tanya",
      companyId: "co-mercy-pines",
      locationOrCategory: "Denver Spine Clinic",
      createdAt: "@-6h",
      slaLabel: "Due in 18h",
      scoreLabel: "3/5 CSAT",
    },
    {
      id: "tkt-hc-seed-2",
      number: "TKT-5098",
      subject: "Evening phone tree callback delay for appointment reschedule",
      pipeline: "Clinic Experience & Feedback",
      stageId: "resolved",
      priority: "High",
      ownerId: "valerie",
      contactId: "ct-benjamin",
      companyId: "co-northstar-cardio",
      locationOrCategory: "Minneapolis Cardio",
      createdAt: "@-1d",
      slaLabel: "Resolved in 2.6h",
      scoreLabel: "2/5 CSAT",
    },
    {
      id: "tkt-hc-seed-3",
      number: "TKT-5094",
      subject: "Waiting room Wi-Fi login issue during morning clinic hours",
      pipeline: "Clinic Experience & Feedback",
      stageId: "resolved",
      priority: "Low",
      ownerId: "devon",
      contactId: "ct-lauren",
      companyId: "co-bayside-ortho",
      locationOrCategory: "Tampa Rehab Clinic",
      createdAt: "@-2d",
      slaLabel: "Resolved in 4.1h",
      scoreLabel: "3/5 CSAT",
    },
  ],
  sla: {
    priority: "High",
    targetLabel: "Same-day 4h first response · 24h resolution SLA",
    dueLabel: "Due in 3h 45m",
    elapsedPct: 16,
    overdue: false,
  },
  offPlatform: {
    channelLabel: "Post-Visit CSAT Survey (SMS / Web)",
    windowTitle: "Crestline Specialty Clinics · Post-Visit Feedback",
    address: "feedback.ridgecrestclinics.example/survey/chk-88412",
    brandName: "Ridgecrest Specialty Clinics",
    brandSubtitle: "Crestline Specialty Clinic Network · Outpatient Experience",
    headline: "How was your check-in and visit experience today?",
    intro:
      "Thank you for visiting our Scottsdale Orthopedic Center today. Share quick feedback on check-in, wait time, and front-desk service so our clinic operations team can keep improving.",
    complianceNote:
      "Fictional demo data · Zero PHI: This survey collects front-desk and service-experience feedback only — never medical records, diagnoses, or clinical notes.",
    triggerExt: {
      extId: "ehr-visit-trigger",
      title: "EHR Visit-Completion Trigger",
      badge: "Checkout Synced",
      badgeTone: "purple",
      subtitle:
        "Custom Penguin integration listens for outpatient checkout events in the practice management / EHR system and fires the HubSpot CSAT survey within 15 minutes.",
      fields: [
        { label: "Source system", value: "Athena / Practice Management Checkout" },
        { label: "Event token", value: "CHK-88412 · Visit Completed" },
        { label: "Clinic location", value: "Scottsdale Orthopedic Center (AZ-04)" },
        { label: "PHI transmitted", value: "None — non-clinical location & timestamp only" },
      ],
      footnote: "Only non-PHI checkout metadata crosses into HubSpot to trigger the native Service Hub survey.",
    },
    feedback: {
      visitLocation: "Scottsdale Orthopedic Center",
      visitDateLabel: "Checked out today · 10:42 AM",
      visitDepartment: "Front-Desk Check-In & Lobby Operations",
      visitorName: "Jordan Vance",
      visitorEmail: "jordan.vance@desertmesa.example",
      scaleMax: 5,
      scriptedScore: 2,
      scoreLabels: {
        1: "Very poor",
        2: "Needs work",
        3: "Okay",
        4: "Good",
        5: "Great",
      },
      topics: ["Check-in wait time", "Lobby communication", "Front-desk kiosk", "Parking & arrival", "Appointment scheduling"],
      scriptedTopics: ["Check-in wait time", "Lobby communication", "Front-desk kiosk"],
      scriptedComment:
        "The lobby check-in kiosk froze and I waited 38 minutes before anyone updated the front-desk queue. The coordinator was polite once called, but proactive wait-time updates would have made a big difference.",
      lowScoreThreshold: 3,
      submitLabel: "Submit feedback",
      thankYouHeadline: "Thank you for your feedback, Jordan",
      thankYouBody:
        "We are sorry for the check-in wait today. Because you flagged wait-time friction, HubSpot automatically opened Ticket TKT-5104 and routed it to our Scottsdale Clinic Location Manager for a personal follow-up.",
    },
  },
  outreach: {
    heading: "Location Manager Outreach & Resolution",
    channelLabel: "Patient Outreach Email",
    recipientLabel: "Jordan Vance (jordan.vance@desertmesa.example)",
    subject: "Following up on your Scottsdale check-in experience today",
    defaultBody:
      "Hi Jordan,\n\nThank you for sharing honest feedback after your visit to our Scottsdale Orthopedic Center today. I am Valerie Chen, the Clinic Location Manager here, and I am truly sorry about the 38-minute lobby delay while our check-in kiosk was down.\n\nWe have restarted the front-desk kiosk, added a live wait-time update board, and assigned a dedicated greeter during peak morning check-ins. For your next visit, please reply directly to this message or call our direct front-desk line at (555) 0171-2453 and we will pre-check you in right away.\n\nWarm regards,\nValerie Chen\nClinic Location Manager — Scottsdale Orthopedic Center",
    followUpNote:
      "Spoke with front-desk lead: restarted Kiosk #2, added 15-minute lobby wait-time check-ins during 8–11 AM peak hours. Jordan replied appreciating the quick same-day outreach and confirmed they will keep their next appointment.",
    sendButtonLabel: "Send empathetic outreach",
    resolveButtonLabel: "Log note & resolve ticket",
    resolutionSummary: "Resolved within 4h SLA · Visitor confirmed service recovery",
  },
  externalCard: {
    extId: "ehr-visit-trigger",
    title: "EHR Visit-Completion Trigger",
    badge: "Checkout Event",
    badgeTone: "purple",
    subtitle: "Checkout event from practice management triggered the post-visit survey that opened this ticket.",
    fields: [
      { label: "Checkout ref", value: "CHK-88412 (Today, 10:42 AM)" },
      { label: "Clinic site code", value: "AZ-04 · Scottsdale Orthopedic" },
      { label: "Survey dispatch", value: "Sent +15 min post-checkout" },
      { label: "Data boundary", value: "Zero PHI · Operational tokens only" },
    ],
  },
  workflowNote: {
    id: "wf-feedback-ticket",
    name: "Service | Low Post-Visit CSAT -> Location Manager Ticket",
    trigger: "Post-visit CSAT survey score <= 3/5",
    action: "Open High-priority Service Hub ticket, route by Clinic Location to Valerie Chen, and start 4h response SLA.",
  },
  reportId: "patient-satisfaction",
  reportButtonLabel: "Satisfaction by Location Report",
};

/**
 * Shared native HubSpot Analytics report (`/reports/patient-satisfaction`).
 * ZERO Penguin markers (`creditsOutcome` intentionally omitted).
 */
export const patientSatisfactionReport: AnalyticsReportSpec = {
  id: "patient-satisfaction",
  title: "Patient satisfaction & resolution speed by location",
  subtitle: "Crestline Specialty Clinics · 30-day post-visit CSAT scores, low-score ticket recovery, and resolution speed (zero PHI)",
  badge: "Service Hub Reporting",
  badgeTone: "green",
  demoId: "post-visit-feedback",
  backLink: { to: "/tickets", label: "Back to Tickets" },
  completeFlag: "tk.post-visit-feedback.reportReviewed",
  filter: {
    label: "Clinic location",
    defaultOptionId: "all",
    options: [
      { id: "all", label: "All locations (4)" },
      {
        id: "scottsdale",
        label: "Scottsdale Ortho",
        kpis: [
          { id: "csat", label: "Avg Post-Visit CSAT", value: "4.5 / 5", delta: "+0.2 MoM", note: "412 operational surveys submitted", tone: "green" },
          { id: "sla", label: "Resolved Within SLA", value: "97.4%", delta: "+4.1% MoM", note: "Includes TKT-5104 resolved same-day", tone: "green" },
          { id: "speed", label: "Avg Resolution Time", value: "2.9 hrs", delta: "-42m faster", note: "Target: under 4.0 hours", tone: "teal" },
          { id: "recovery", label: "Low-Score Recovery", value: "91%", delta: "10 of 11 saved", note: "Visitors retaining follow-up appointments", tone: "blue" },
        ],
        breakdowns: [
          {
            id: "topics",
            title: "Scottsdale Feedback Topics (Low CSAT <= 3)",
            subtitle: "Non-clinical operational drivers tagged on Service Hub tickets",
            kind: "bars",
            badge: "11 tickets",
            badgeTone: "amber",
            rows: [
              { label: "Check-in wait time & kiosk", value: 5, displayValue: "5 tickets", meta: "Avg 2.4h resolve", pct: 45, tone: "orange" },
              { label: "Lobby queue communication", value: 3, displayValue: "3 tickets", meta: "Avg 2.8h resolve", pct: 27, tone: "amber" },
              { label: "Parking & wayfinding", value: 2, displayValue: "2 tickets", meta: "Avg 3.6h resolve", pct: 18, tone: "blue" },
              { label: "Scheduling desk callbacks", value: 1, displayValue: "1 ticket", meta: "Avg 2.1h resolve", pct: 10, tone: "teal" },
            ],
          },
          {
            id: "speed-dist",
            title: "Scottsdale Ticket Resolution Funnel",
            kind: "funnel",
            badge: "97.4% SLA",
            badgeTone: "green",
            rows: [
              { label: "Low-score surveys triggering ticket (<= 3/5)", value: 11, displayValue: "11", pct: 100, tone: "orange" },
              { label: "Manager outreach sent inside 4h SLA", value: 11, displayValue: "11 (100%)", pct: 100, tone: "blue" },
              { label: "Resolved within 24h SLA", value: 11, displayValue: "11 (100%)", pct: 100, tone: "teal" },
              { label: "Confirmed visitor recovery", value: 10, displayValue: "10 (91%)", pct: 91, tone: "green" },
            ],
          },
        ],
        table: {
          title: "Scottsdale Orthopedic Center — Recent Feedback Tickets",
          subtitle: "Non-clinical service experience log",
          columns: [
            { key: "ticket", label: "Ticket" },
            { key: "topic", label: "Operational Category", tag: true },
            { key: "score", label: "CSAT", align: "right" },
            { key: "owner", label: "Location Manager" },
            { key: "speed", label: "Resolution Speed", align: "right" },
            { key: "status", label: "Status", tag: true },
          ],
          rows: [
            {
              id: "tkt-5104",
              linkTo: "/tickets/tkt-hc-feedback-1",
              cells: {
                ticket: "TKT-5104 · Kiosk wait-time delay",
                topic: "Check-In & Wait Time",
                score: "2 / 5",
                owner: "Valerie Chen",
                speed: "1.4 hrs",
                status: "Resolved",
              },
              tones: { topic: "amber", status: "green" },
            },
            {
              id: "tkt-5089",
              cells: {
                ticket: "TKT-5089 · Morning lobby signage",
                topic: "Lobby Communication",
                score: "3 / 5",
                owner: "Valerie Chen",
                speed: "3.1 hrs",
                status: "Resolved",
              },
              tones: { topic: "blue", status: "green" },
            },
          ],
        },
      },
      {
        id: "denver",
        label: "Denver Spine",
        kpis: [
          { id: "csat", label: "Avg Post-Visit CSAT", value: "4.6 / 5", delta: "+0.1 MoM", note: "388 operational surveys submitted", tone: "green" },
          { id: "sla", label: "Resolved Within SLA", value: "94.8%", delta: "+1.9% MoM", note: "1 open signage ticket in progress", tone: "green" },
          { id: "speed", label: "Avg Resolution Time", value: "3.7 hrs", delta: "-18m faster", note: "Target: under 4.0 hours", tone: "teal" },
          { id: "recovery", label: "Low-Score Recovery", value: "88%", delta: "7 of 8 saved", note: "Direct manager follow-up", tone: "blue" },
        ],
        table: {
          title: "Denver Spine Clinic — Performance Summary",
          columns: [
            { key: "location", label: "Location" },
            { key: "manager", label: "Location Manager" },
            { key: "surveys", label: "Surveys", align: "right" },
            { key: "csat", label: "Avg CSAT", align: "right" },
            { key: "tickets", label: "Low-Score Tickets", align: "right" },
            { key: "speed", label: "Avg Resolution", align: "right" },
            { key: "sla", label: "SLA Status", tag: true },
          ],
          rows: [
            {
              id: "loc-denver",
              cells: {
                location: "Denver Spine Clinic",
                manager: "Devon Patel",
                surveys: "388",
                csat: "4.6 / 5",
                tickets: "8",
                speed: "3.7 hrs",
                sla: "94.8% On-Time",
              },
              tones: { sla: "green" },
            },
          ],
        },
      },
      {
        id: "minneapolis",
        label: "Minneapolis Cardio",
        kpis: [
          { id: "csat", label: "Avg Post-Visit CSAT", value: "4.8 / 5", delta: "+0.3 MoM", note: "319 operational surveys submitted", tone: "green" },
          { id: "sla", label: "Resolved Within SLA", value: "98.1%", delta: "+2.4% MoM", note: "Fastest location response in network", tone: "green" },
          { id: "speed", label: "Avg Resolution Time", value: "2.6 hrs", delta: "-51m faster", note: "Target: under 4.0 hours", tone: "teal" },
          { id: "recovery", label: "Low-Score Recovery", value: "93%", delta: "5 of 5 saved", note: "100% same-day outreach", tone: "blue" },
        ],
        table: {
          title: "Minneapolis Cardio — Performance Summary",
          columns: [
            { key: "location", label: "Location" },
            { key: "manager", label: "Location Manager" },
            { key: "surveys", label: "Surveys", align: "right" },
            { key: "csat", label: "Avg CSAT", align: "right" },
            { key: "tickets", label: "Low-Score Tickets", align: "right" },
            { key: "speed", label: "Avg Resolution", align: "right" },
            { key: "sla", label: "SLA Status", tag: true },
          ],
          rows: [
            {
              id: "loc-minneapolis",
              cells: {
                location: "Minneapolis Cardio",
                manager: "Valerie Chen",
                surveys: "319",
                csat: "4.8 / 5",
                tickets: "5",
                speed: "2.6 hrs",
                sla: "98.1% On-Time",
              },
              tones: { sla: "green" },
            },
          ],
        },
      },
      {
        id: "tampa",
        label: "Tampa Rehab",
        kpis: [
          { id: "csat", label: "Avg Post-Visit CSAT", value: "4.5 / 5", delta: "+0.2 MoM", note: "276 operational surveys submitted", tone: "green" },
          { id: "sla", label: "Resolved Within SLA", value: "94.1%", delta: "+3.0% MoM", note: "Wi-Fi & check-in issues resolved", tone: "green" },
          { id: "speed", label: "Avg Resolution Time", value: "4.1 hrs", delta: "-25m faster", note: "Close to 4.0h target", tone: "amber" },
          { id: "recovery", label: "Low-Score Recovery", value: "86%", delta: "6 of 7 saved", note: "Direct follow-up logged", tone: "blue" },
        ],
        table: {
          title: "Tampa Rehab Clinic — Performance Summary",
          columns: [
            { key: "location", label: "Location" },
            { key: "manager", label: "Location Manager" },
            { key: "surveys", label: "Surveys", align: "right" },
            { key: "csat", label: "Avg CSAT", align: "right" },
            { key: "tickets", label: "Low-Score Tickets", align: "right" },
            { key: "speed", label: "Avg Resolution", align: "right" },
            { key: "sla", label: "SLA Status", tag: true },
          ],
          rows: [
            {
              id: "loc-tampa",
              cells: {
                location: "Tampa Rehab Clinic",
                manager: "Devon Patel",
                surveys: "276",
                csat: "4.5 / 5",
                tickets: "7",
                speed: "4.1 hrs",
                sla: "94.1% On-Time",
              },
              tones: { sla: "amber" },
            },
          ],
        },
      },
    ],
  },
  kpis: [
    { id: "csat", label: "Avg Post-Visit CSAT", value: "4.6 / 5", delta: "+0.2 MoM", note: "1,395 non-PHI visit surveys across 4 clinics", tone: "green" },
    { id: "sla", label: "Resolved Within SLA", value: "96.2%", delta: "+3.1% MoM", note: "Includes TKT-5104 closed inside 4h SLA", tone: "green" },
    { id: "speed", label: "Avg Resolution Time", value: "3.4 hrs", delta: "-34m faster", note: "From low-score trigger to manager closure", tone: "teal" },
    { id: "recovery", label: "Low-Score Recovery", value: "89%", delta: "28 of 31 saved", note: "Visitors confirming follow-up visit retention", tone: "blue" },
  ],
  breakdowns: [
    {
      id: "csat-by-location",
      title: "Average Post-Visit CSAT by Location",
      subtitle: "5-point non-clinical service experience rating",
      kind: "bars",
      badge: "4 clinic sites",
      badgeTone: "teal",
      rows: [
        { label: "Minneapolis Cardio", value: 4.8, displayValue: "4.8 / 5", meta: "319 surveys", pct: 96, tone: "green" },
        { label: "Denver Spine Clinic", value: 4.6, displayValue: "4.6 / 5", meta: "388 surveys", pct: 92, tone: "teal" },
        { label: "Scottsdale Orthopedic Center", value: 4.5, displayValue: "4.5 / 5", meta: "412 surveys", pct: 90, tone: "blue" },
        { label: "Tampa Rehab Clinic", value: 4.5, displayValue: "4.5 / 5", meta: "276 surveys", pct: 90, tone: "blue" },
      ],
    },
    {
      id: "resolution-speed",
      title: "Ticket Resolution Speed & SLA Compliance by Location",
      subtitle: "Share of low-score feedback tickets resolved inside 24h SLA",
      kind: "bars",
      badge: "96.2% overall",
      badgeTone: "green",
      rows: [
        { label: "Minneapolis Cardio", value: 98.1, displayValue: "2.6 hrs · 98.1%", meta: "5 tickets", pct: 98, tone: "green" },
        { label: "Scottsdale Orthopedic Center", value: 97.4, displayValue: "2.9 hrs · 97.4%", meta: "11 tickets (incl. TKT-5104)", pct: 97, tone: "green" },
        { label: "Denver Spine Clinic", value: 94.8, displayValue: "3.7 hrs · 94.8%", meta: "8 tickets", pct: 95, tone: "teal" },
        { label: "Tampa Rehab Clinic", value: 94.1, displayValue: "4.1 hrs · 94.1%", meta: "7 tickets", pct: 94, tone: "amber" },
      ],
    },
  ],
  table: {
    title: "Satisfaction & Ticket Resolution by Clinic Location",
    subtitle: "30-day Service Hub operational rollup (zero PHI)",
    columns: [
      { key: "location", label: "Location" },
      { key: "manager", label: "Location Manager" },
      { key: "surveys", label: "Surveys", align: "right" },
      { key: "csat", label: "Avg CSAT", align: "right" },
      { key: "tickets", label: "Low-Score Tickets", align: "right" },
      { key: "speed", label: "Avg Resolution", align: "right" },
      { key: "sla", label: "SLA Status", tag: true },
    ],
    rows: [
      {
        id: "loc-scottsdale",
        linkTo: "/tickets/tkt-hc-feedback-1",
        cells: {
          location: "Scottsdale Orthopedic Center",
          manager: "Valerie Chen",
          surveys: "412",
          csat: "4.5 / 5",
          tickets: "11",
          speed: "2.9 hrs",
          sla: "97.4% On-Time",
        },
        tones: { sla: "green" },
      },
      {
        id: "loc-minneapolis",
        cells: {
          location: "Minneapolis Cardio",
          manager: "Valerie Chen",
          surveys: "319",
          csat: "4.8 / 5",
          tickets: "5",
          speed: "2.6 hrs",
          sla: "98.1% On-Time",
        },
        tones: { sla: "green" },
      },
      {
        id: "loc-denver",
        cells: {
          location: "Denver Spine Clinic",
          manager: "Devon Patel",
          surveys: "388",
          csat: "4.6 / 5",
          tickets: "8",
          speed: "3.7 hrs",
          sla: "94.8% On-Time",
        },
        tones: { sla: "green" },
      },
      {
        id: "loc-tampa",
        cells: {
          location: "Tampa Rehab Clinic",
          manager: "Devon Patel",
          surveys: "276",
          csat: "4.5 / 5",
          tickets: "7",
          speed: "4.1 hrs",
          sla: "94.1% On-Time",
        },
        tones: { sla: "amber" },
      },
    ],
  },
};
