import type { AnalyticsReportSpec } from "../analytics-types";

/**
 * Declarative report specs for Healthcare (Crestline Clinical Staffing & Specialty Clinics).
 * Rendered by the shared lazy-loaded Analytics module (`/reports/:reportId`).
 *
 * Penguin marker boundaries:
 * - `referral-outreach` (H3): Native KPIs, charts, and table carry ZERO Penguin markers.
 *   ONLY the `creditsOutcome` card (`extId: "credits-outcome-bridge"`) carries a Penguin marker.
 * - `patient-reactivation` (H4): Pure native HubSpot report (NO `creditsOutcome`), ZERO Penguin markers.
 */
export const reports: Record<string, AnalyticsReportSpec> = {
  "referral-outreach": {
    id: "referral-outreach",
    title: "Before & After Referral Volume by Practice",
    subtitle: "Quarterly specialty referral recovery after Breeze Prospecting Agent liaison outreach · Aggregate non-PHI counts",
    badge: "Liaison attribution",
    badgeTone: "green",
    demoId: "ai-prospecting",
    backLink: { to: "/prospecting", label: "Back to Prospecting" },
    completeFlag: "ap.reportSeen",
    filter: {
      label: "Signal type",
      defaultOptionId: "all",
      options: [
        {
          id: "all",
          label: "All referring signals",
        },
        {
          id: "referral-drop",
          label: "Referral drop",
          kpis: [
            { id: "referrals-after", label: "Quarterly Referrals (After)", value: "104", delta: "+49% vs before", note: "Up from 70/qtr across 4 recovered practices", tone: "green" },
            { id: "meetings", label: "Lunch-and-Learns Booked", value: "5", delta: "83% conv.", note: "All 5 included referring physicians & office manager", tone: "teal" },
            { id: "practices", label: "Practices Recovered", value: "4 of 5", delta: "+34 referrals/qtr", note: "Returned to or exceeded prior baseline", tone: "green" },
            { id: "days-first", label: "Days to First Referral", value: "5.8 days", delta: "-4.6 days", note: "Median time from lunch-and-learn to new referral", tone: "blue" },
          ],
          breakdowns: [
            {
              id: "before-after",
              title: "Quarterly Referrals Before vs. After (Referral-Drop Cohort)",
              kind: "bars",
              badge: "Referral-drop signals",
              badgeTone: "amber",
              rows: [
                { label: "Summit Creek Family Medicine", value: 48, displayValue: "30 -> 48 / qtr", meta: "+60%", tone: "green" },
                { label: "Northstar Heart & Vascular", value: 31, displayValue: "22 -> 31 / qtr", meta: "+41%", tone: "teal" },
                { label: "Harborview Children's Specialty", value: 25, displayValue: "18 -> 25 / qtr", meta: "+39%", tone: "blue" },
              ],
            },
            {
              id: "funnel",
              title: "Referral-Drop Outreach Funnel",
              kind: "funnel",
              rows: [
                { label: "Referral-Drop Signals Fired", value: 6, displayValue: "6", pct: 100 },
                { label: "Buying Groups Enriched", value: 6, displayValue: "6", meta: "100%", pct: 100 },
                { label: "Liaison Outreach Approved & Sent", value: 6, displayValue: "6", meta: "100%", pct: 100 },
                { label: "Lunch-and-Learns Booked", value: 5, displayValue: "5", meta: "83%", pct: 83 },
                { label: "Referral Volume Recovered", value: 4, displayValue: "4", meta: "67%", pct: 67 },
              ],
            },
          ],
          table: {
            title: "Referral-Drop Practices — Before & After Outreach",
            columns: [
              { key: "practice", label: "Referring practice" },
              { key: "signal", label: "Triggering signal", tag: true },
              { key: "before", label: "Before / qtr", align: "right" },
              { key: "after", label: "After / qtr", align: "right" },
              { key: "lift", label: "Lift", tag: true },
              { key: "status", label: "Lunch-and-learn", tag: true },
            ],
            rows: [
              {
                id: "summit-creek",
                linkTo: "/companies/co-summit-creek",
                cells: { practice: "Summit Creek Family Medicine", signal: "Referral drop", before: "30", after: "48", lift: "+60%", status: "Booked" },
                tones: { signal: "amber", lift: "green", status: "green" },
              },
              {
                id: "northstar",
                linkTo: "/companies/co-northstar-cardio",
                cells: { practice: "Northstar Heart & Vascular", signal: "Referral drop", before: "22", after: "31", lift: "+41%", status: "Completed" },
                tones: { signal: "amber", lift: "green", status: "green" },
              },
              {
                id: "harborview",
                linkTo: "/companies/co-harborview-peds",
                cells: { practice: "Harborview Children's Specialty", signal: "Referral drop", before: "18", after: "25", lift: "+39%", status: "Completed" },
                tones: { signal: "amber", lift: "green", status: "green" },
              },
            ],
          },
          creditsOutcome: {
            extId: "credits-outcome-bridge",
            title: "HubSpot Credits & Outcomes Attribution",
            badge: "Referral-Drop Cohort",
            creditsUsed: 86,
            creditsAllocated: 500,
            primaryMetricLabel: "Referrals / 100 cr",
            primaryMetricValue: "+40 visits",
            secondaryMetricLabel: "Credits / meeting",
            secondaryMetricValue: "17 cr",
            summary: "Ties Breeze Prospecting Agent enrichment and role-tailored outreach credits directly to recovered referral volume.",
            breakdown: [
              { action: "Referring-practice buying group matching", credits: 34, outcomes: "6 practices & 18 contacts mapped", sharePct: 40 },
              { action: "Role-tailored physician & manager drafts", credits: 32, outcomes: "6 liaison sequences approved", sharePct: 37 },
              { action: "Why Now signal & referral-drop briefs", credits: 20, outcomes: "5 lunch-and-learns booked", sharePct: 23 },
            ],
          },
        },
        {
          id: "new-provider",
          label: "New physician & location",
          kpis: [
            { id: "referrals-after", label: "Quarterly Referrals (After)", value: "92", delta: "+31% vs before", note: "New referral channels opened by credentialed MDs", tone: "green" },
            { id: "meetings", label: "Lunch-and-Learns Booked", value: "6", delta: "60% conv.", note: "Welcomed newly credentialed physicians & clinic leads", tone: "teal" },
            { id: "practices", label: "Active Referring Practices", value: "5 of 7", delta: "+22 referrals/qtr", note: "New locations referring within 14 days", tone: "green" },
            { id: "days-first", label: "Days to First Referral", value: "7.1 days", delta: "-3.8 days", note: "Faster onboarding for newly credentialed providers", tone: "blue" },
          ],
          breakdowns: [
            {
              id: "before-after",
              title: "Quarterly Referrals Before vs. After (New Physician & Location)",
              kind: "bars",
              badge: "Growth signals",
              badgeTone: "blue",
              rows: [
                { label: "Ridgecrest Specialty Clinics", value: 34, displayValue: "24 -> 34 / qtr", meta: "+42%", tone: "teal" },
                { label: "Bayside Orthopedic Institute", value: 28, displayValue: "19 -> 28 / qtr", meta: "+47%", tone: "blue" },
                { label: "Prairie Winds Oncology Group", value: 18, displayValue: "12 -> 18 / qtr", meta: "+50%", tone: "orange" },
              ],
            },
            {
              id: "funnel",
              title: "New Provider & Clinic Expansion Funnel",
              kind: "funnel",
              rows: [
                { label: "NPI & Clinic Signals Fired", value: 10, displayValue: "10", pct: 100 },
                { label: "Buying Groups Enriched", value: 9, displayValue: "9", meta: "90%", pct: 90 },
                { label: "Liaison Outreach Sent", value: 8, displayValue: "8", meta: "80%", pct: 80 },
                { label: "Lunch-and-Learns Booked", value: 6, displayValue: "6", meta: "60%", pct: 60 },
                { label: "Active Referral Growth", value: 5, displayValue: "5", meta: "50%", pct: 50 },
              ],
            },
          ],
          table: {
            title: "New Physician & Location Practices — Before & After Outreach",
            columns: [
              { key: "practice", label: "Referring practice" },
              { key: "signal", label: "Triggering signal", tag: true },
              { key: "before", label: "Before / qtr", align: "right" },
              { key: "after", label: "After / qtr", align: "right" },
              { key: "lift", label: "Lift", tag: true },
              { key: "status", label: "Lunch-and-learn", tag: true },
            ],
            rows: [
              {
                id: "ridgecrest",
                linkTo: "/companies/co-ridgecrest",
                cells: { practice: "Ridgecrest Specialty Clinics", signal: "New physician", before: "24", after: "34", lift: "+42%", status: "Completed" },
                tones: { signal: "blue", lift: "green", status: "green" },
              },
              {
                id: "bayside",
                linkTo: "/companies/co-bayside-ortho",
                cells: { practice: "Bayside Orthopedic Institute", signal: "New location", before: "19", after: "28", lift: "+47%", status: "Booked" },
                tones: { signal: "teal", lift: "green", status: "green" },
              },
              {
                id: "prairie",
                linkTo: "/companies/co-prairie-oncology",
                cells: { practice: "Prairie Winds Oncology Group", signal: "New physician", before: "12", after: "18", lift: "+50%", status: "Completed" },
                tones: { signal: "blue", lift: "green", status: "green" },
              },
            ],
          },
          creditsOutcome: {
            extId: "credits-outcome-bridge",
            title: "HubSpot Credits & Outcomes Attribution",
            badge: "New Provider Cohort",
            creditsUsed: 98,
            creditsAllocated: 500,
            primaryMetricLabel: "Referrals / 100 cr",
            primaryMetricValue: "+22 visits",
            secondaryMetricLabel: "Credits / meeting",
            secondaryMetricValue: "16 cr",
            summary: "Measures Breeze Prospecting Agent credits spent welcoming newly credentialed physicians and clinic expansions.",
            breakdown: [
              { action: "NPI & clinic contact enrichment", credits: 40, outcomes: "9 practices enriched", sharePct: 41 },
              { action: "Role-tailored welcome outreach", credits: 36, outcomes: "8 approved sequences sent", sharePct: 37 },
              { action: "Account research & Why Now briefs", credits: 22, outcomes: "6 lunch-and-learns booked", sharePct: 22 },
            ],
          },
        },
      ],
    },
    kpis: [
      { id: "referrals-after", label: "Quarterly Referrals (After)", value: "196", delta: "+40% vs before", note: "Up from 140/qtr across 12 signaled referring practices", tone: "green" },
      { id: "meetings", label: "Lunch-and-Learns Booked", value: "11", delta: "69% conv.", note: "Includes Summit Creek Family Medicine booking", tone: "teal" },
      { id: "practices", label: "Practices Showing Lift", value: "9 of 12", delta: "+56 referrals/qtr", note: "Measured from aggregate EHR referral counts (zero PHI)", tone: "green" },
      { id: "days-first", label: "Avg Days to First Referral", value: "6.4 days", delta: "-4.2 days faster", note: "From lunch-and-learn to first specialty consult booked", tone: "blue" },
    ],
    breakdowns: [
      {
        id: "before-after",
        title: "Before vs. After Quarterly Referrals by Practice",
        subtitle: "Aggregate practice-level referrals before outreach vs. 90 days after",
        kind: "bars",
        badge: "Non-PHI counts",
        badgeTone: "teal",
        rows: [
          { label: "Summit Creek Family Medicine", value: 48, displayValue: "30 -> 48 / qtr", meta: "+60%", tone: "green" },
          { label: "Ridgecrest Specialty Clinics", value: 34, displayValue: "24 -> 34 / qtr", meta: "+42%", tone: "teal" },
          { label: "Northstar Heart & Vascular", value: 31, displayValue: "22 -> 31 / qtr", meta: "+41%", tone: "blue" },
          { label: "Bayside Orthopedic Institute", value: 28, displayValue: "19 -> 28 / qtr", meta: "+47%", tone: "orange" },
          { label: "Harborview Children's Specialty", value: 25, displayValue: "18 -> 25 / qtr", meta: "+39%", tone: "blue" },
        ],
      },
      {
        id: "funnel",
        title: "Referring-Practice Outreach Funnel",
        subtitle: "From EHR & NPI signal detection to post-outreach referral lift",
        kind: "funnel",
        badge: "Last 90 days",
        badgeTone: "neutral",
        rows: [
          { label: "Signaled Referring Practices", value: 16, displayValue: "16", pct: 100 },
          { label: "Buying Groups Enriched (MD + Manager)", value: 15, displayValue: "15", meta: "94%", pct: 94 },
          { label: "Role Outreach Approved & Sent", value: 14, displayValue: "14", meta: "88%", pct: 88 },
          { label: "Lunch-and-Learns Booked", value: 11, displayValue: "11", meta: "69%", pct: 69 },
          { label: "Practices with Referral Lift", value: 9, displayValue: "9", meta: "56%", pct: 56 },
        ],
      },
    ],
    table: {
      title: "Referring Practice Performance — Before & After Outreach",
      subtitle: "Click any practice to open its HubSpot company record",
      columns: [
        { key: "practice", label: "Referring practice" },
        { key: "signal", label: "Triggering signal", tag: true },
        { key: "before", label: "Before / qtr", align: "right" },
        { key: "after", label: "After / qtr", align: "right" },
        { key: "lift", label: "Lift", tag: true },
        { key: "status", label: "Lunch-and-learn", tag: true },
      ],
      rows: [
        {
          id: "summit-creek",
          linkTo: "/companies/co-summit-creek",
          cells: { practice: "Summit Creek Family Medicine", signal: "Referral drop + New MD", before: "30", after: "48", lift: "+60%", status: "Booked" },
          tones: { signal: "amber", lift: "green", status: "green" },
        },
        {
          id: "ridgecrest",
          linkTo: "/companies/co-ridgecrest",
          cells: { practice: "Ridgecrest Specialty Clinics", signal: "New physician", before: "24", after: "34", lift: "+42%", status: "Completed" },
          tones: { signal: "blue", lift: "green", status: "green" },
        },
        {
          id: "northstar",
          linkTo: "/companies/co-northstar-cardio",
          cells: { practice: "Northstar Heart & Vascular", signal: "Referral drop", before: "22", after: "31", lift: "+41%", status: "Completed" },
          tones: { signal: "amber", lift: "green", status: "green" },
        },
        {
          id: "bayside",
          linkTo: "/companies/co-bayside-ortho",
          cells: { practice: "Bayside Orthopedic Institute", signal: "New location", before: "19", after: "28", lift: "+47%", status: "Booked" },
          tones: { signal: "teal", lift: "green", status: "green" },
        },
        {
          id: "harborview",
          linkTo: "/companies/co-harborview-peds",
          cells: { practice: "Harborview Children's Specialty", signal: "Referral drop", before: "18", after: "25", lift: "+39%", status: "Completed" },
          tones: { signal: "amber", lift: "green", status: "green" },
        },
      ],
    },
    creditsOutcome: {
      extId: "credits-outcome-bridge",
      title: "HubSpot Credits & Outcomes Attribution",
      badge: "Credits-to-Outcome Model",
      creditsUsed: 184,
      creditsAllocated: 500,
      primaryMetricLabel: "Added referrals / 100 cr",
      primaryMetricValue: "+30 visits",
      secondaryMetricLabel: "Credits / lunch-and-learn",
      secondaryMetricValue: "17 cr",
      summary: "Connects Breeze Prospecting Agent enrichment and outreach credits directly to booked lunch-and-learns and recovered quarterly referrals.",
      breakdown: [
        { action: "Referring-practice & NPI buying-group matching", credits: 74, outcomes: "15 practices & 42 contacts mapped", sharePct: 40 },
        { action: "Role-tailored physician & office-manager drafts", credits: 68, outcomes: "14 liaison sequences approved", sharePct: 37 },
        { action: "Account research & Why Now summaries", credits: 42, outcomes: "11 lunch-and-learns booked", sharePct: 23 },
      ],
    },
  },

  "patient-reactivation": {
    id: "patient-reactivation",
    title: "Patient Reactivation Rate & Visits Booked by Location",
    subtitle: "Annual wellness visit reactivation across 4 Crestline Specialty Clinic locations · Last 60 days (zero PHI)",
    badge: "Zero-PHI metrics",
    badgeTone: "teal",
    demoId: "patient-reactivation",
    backLink: { to: "/reactivation/segment", label: "Back to Reactivation" },
    completeFlag: "pr.reportSeen",
    filter: {
      label: "Clinic location",
      defaultOptionId: "all",
      options: [
        {
          id: "all",
          label: "All locations",
        },
        {
          id: "denver",
          label: "Denver — Cherry Creek",
          kpis: [
            { id: "reached", label: "Overdue Segment", value: "384", delta: "Top clinic", note: "Non-PHI Overdue > 12 mo cohort", tone: "teal" },
            { id: "booked", label: "Annual Visits Booked", value: "136", delta: "+1 booked today", note: "Includes Camila Reyes auto-removed from segment", tone: "green" },
            { id: "rate", label: "Reactivation Rate", value: "35.4%", delta: "+4.4 pts vs avg", note: "Highest booking conversion across locations", tone: "green" },
            { id: "suppressed", label: "Auto-Removed Pre-Touch 3", value: "88%", delta: "Zero duplicates", note: "Touches 2 & 3 stopped automatically upon booking", tone: "blue" },
          ],
          breakdowns: [
            {
              id: "by-touch",
              title: "Visits Booked by Reminder Touch (Denver — Cherry Creek)",
              kind: "bars",
              badge: "Denver clinic",
              badgeTone: "green",
              rows: [
                { label: "Touch 1 (Day 0 Reminder)", value: 84, displayValue: "84 visits", meta: "62%", tone: "green" },
                { label: "Touch 2 (Day 10 Morning/Sat Slots)", value: 36, displayValue: "36 visits", meta: "26%", tone: "teal" },
                { label: "Touch 3 (Day 24 Final Check-In)", value: 16, displayValue: "16 visits", meta: "12%", tone: "blue" },
              ],
            },
            {
              id: "funnel",
              title: "Denver — Cherry Creek Reactivation Funnel",
              kind: "funnel",
              rows: [
                { label: "Overdue > 12 mo Segment", value: 384, displayValue: "384", pct: 100 },
                { label: "Touch 1 Delivered", value: 376, displayValue: "376", meta: "98%", pct: 98 },
                { label: "Reminder Email Opened", value: 262, displayValue: "262", meta: "68%", pct: 68 },
                { label: "Booking Link Clicked", value: 164, displayValue: "164", meta: "43%", pct: 43 },
                { label: "Annual Visit Booked & Removed", value: 136, displayValue: "136", meta: "35.4%", pct: 35 },
              ],
            },
          ],
          table: {
            title: "Denver — Cherry Creek Breakdown by Overdue Bucket",
            columns: [
              { key: "bucket", label: "Last-visit bucket (non-PHI)" },
              { key: "segment", label: "Overdue contacts", align: "right" },
              { key: "booked", label: "Visits booked", align: "right" },
              { key: "rate", label: "Reactivation rate", tag: true },
              { key: "avgDays", label: "Avg days to book", align: "right" },
            ],
            rows: [
              {
                id: "den-12-18",
                cells: { bucket: "12–18 months ago", segment: "242", booked: "96", rate: "39.7%", avgDays: "4.2 days" },
                tones: { rate: "green" },
              },
              {
                id: "den-18-24",
                cells: { bucket: "18–24 months ago", segment: "102", booked: "31", rate: "30.4%", avgDays: "7.8 days" },
                tones: { rate: "teal" },
              },
              {
                id: "den-24-plus",
                cells: { bucket: "24+ months ago", segment: "40", booked: "9", rate: "22.5%", avgDays: "11.4 days" },
                tones: { rate: "amber" },
              },
            ],
          },
        },
        {
          id: "scottsdale",
          label: "Scottsdale — North",
          kpis: [
            { id: "reached", label: "Overdue Segment", value: "326", delta: "2nd largest", note: "Non-PHI Overdue > 12 mo cohort", tone: "teal" },
            { id: "booked", label: "Annual Visits Booked", value: "104", delta: "+14 this week", note: "Online self-scheduling via reminder series", tone: "green" },
            { id: "rate", label: "Reactivation Rate", value: "31.9%", delta: "+0.9 pts vs avg", note: "Strong Touch 1 open & click engagement", tone: "green" },
            { id: "suppressed", label: "Auto-Removed Pre-Touch 3", value: "85%", delta: "Zero duplicates", note: "Automatic dynamic-list exit on booking", tone: "blue" },
          ],
          breakdowns: [
            {
              id: "by-touch",
              title: "Visits Booked by Reminder Touch (Scottsdale — North)",
              kind: "bars",
              badge: "Scottsdale clinic",
              badgeTone: "teal",
              rows: [
                { label: "Touch 1 (Day 0 Reminder)", value: 62, displayValue: "62 visits", meta: "60%", tone: "green" },
                { label: "Touch 2 (Day 10 Morning/Sat Slots)", value: 26, displayValue: "26 visits", meta: "25%", tone: "teal" },
                { label: "Touch 3 (Day 24 Final Check-In)", value: 16, displayValue: "16 visits", meta: "15%", tone: "blue" },
              ],
            },
            {
              id: "funnel",
              title: "Scottsdale — North Reactivation Funnel",
              kind: "funnel",
              rows: [
                { label: "Overdue > 12 mo Segment", value: 326, displayValue: "326", pct: 100 },
                { label: "Touch 1 Delivered", value: 318, displayValue: "318", meta: "98%", pct: 98 },
                { label: "Reminder Email Opened", value: 212, displayValue: "212", meta: "65%", pct: 65 },
                { label: "Booking Link Clicked", value: 124, displayValue: "124", meta: "38%", pct: 38 },
                { label: "Annual Visit Booked & Removed", value: 104, displayValue: "104", meta: "31.9%", pct: 32 },
              ],
            },
          ],
          table: {
            title: "Scottsdale — North Breakdown by Overdue Bucket",
            columns: [
              { key: "bucket", label: "Last-visit bucket (non-PHI)" },
              { key: "segment", label: "Overdue contacts", align: "right" },
              { key: "booked", label: "Visits booked", align: "right" },
              { key: "rate", label: "Reactivation rate", tag: true },
              { key: "avgDays", label: "Avg days to book", align: "right" },
            ],
            rows: [
              {
                id: "sco-12-18",
                cells: { bucket: "12–18 months ago", segment: "204", booked: "74", rate: "36.3%", avgDays: "5.1 days" },
                tones: { rate: "green" },
              },
              {
                id: "sco-18-24",
                cells: { bucket: "18–24 months ago", segment: "88", booked: "23", rate: "26.1%", avgDays: "8.9 days" },
                tones: { rate: "teal" },
              },
              {
                id: "sco-24-plus",
                cells: { bucket: "24+ months ago", segment: "34", booked: "7", rate: "20.6%", avgDays: "12.6 days" },
                tones: { rate: "amber" },
              },
            ],
          },
        },
        {
          id: "lakewood",
          label: "Lakewood — West",
          kpis: [
            { id: "reached", label: "Overdue Segment", value: "294", delta: "New clinic", note: "Expanded Saturday wellness hours added", tone: "teal" },
            { id: "booked", label: "Annual Visits Booked", value: "78", delta: "+11 this week", note: "Fastest week-over-week growth", tone: "green" },
            { id: "rate", label: "Reactivation Rate", value: "26.5%", delta: "+5.1 pts MoM", note: "Climbing after weekend slot rollout", tone: "teal" },
            { id: "suppressed", label: "Auto-Removed Pre-Touch 3", value: "79%", delta: "Zero duplicates", note: "Automatic dynamic-list exit on booking", tone: "blue" },
          ],
          breakdowns: [
            {
              id: "by-touch",
              title: "Visits Booked by Reminder Touch (Lakewood — West)",
              kind: "bars",
              badge: "Lakewood clinic",
              badgeTone: "blue",
              rows: [
                { label: "Touch 1 (Day 0 Reminder)", value: 42, displayValue: "42 visits", meta: "54%", tone: "green" },
                { label: "Touch 2 (Day 10 Morning/Sat Slots)", value: 20, displayValue: "20 visits", meta: "26%", tone: "teal" },
                { label: "Touch 3 (Day 24 Final Check-In)", value: 16, displayValue: "16 visits", meta: "20%", tone: "blue" },
              ],
            },
            {
              id: "funnel",
              title: "Lakewood — West Reactivation Funnel",
              kind: "funnel",
              rows: [
                { label: "Overdue > 12 mo Segment", value: 294, displayValue: "294", pct: 100 },
                { label: "Touch 1 Delivered", value: 282, displayValue: "282", meta: "96%", pct: 96 },
                { label: "Reminder Email Opened", value: 174, displayValue: "174", meta: "59%", pct: 59 },
                { label: "Booking Link Clicked", value: 96, displayValue: "96", meta: "33%", pct: 33 },
                { label: "Annual Visit Booked & Removed", value: 78, displayValue: "78", meta: "26.5%", pct: 27 },
              ],
            },
          ],
          table: {
            title: "Lakewood — West Breakdown by Overdue Bucket",
            columns: [
              { key: "bucket", label: "Last-visit bucket (non-PHI)" },
              { key: "segment", label: "Overdue contacts", align: "right" },
              { key: "booked", label: "Visits booked", align: "right" },
              { key: "rate", label: "Reactivation rate", tag: true },
              { key: "avgDays", label: "Avg days to book", align: "right" },
            ],
            rows: [
              {
                id: "lak-12-18",
                cells: { bucket: "12–18 months ago", segment: "172", booked: "52", rate: "30.2%", avgDays: "6.4 days" },
                tones: { rate: "green" },
              },
              {
                id: "lak-18-24",
                cells: { bucket: "18–24 months ago", segment: "84", booked: "20", rate: "23.8%", avgDays: "10.2 days" },
                tones: { rate: "teal" },
              },
              {
                id: "lak-24-plus",
                cells: { bucket: "24+ months ago", segment: "38", booked: "6", rate: "15.8%", avgDays: "14.1 days" },
                tones: { rate: "amber" },
              },
            ],
          },
        },
        {
          id: "boulder",
          label: "Boulder — Foothills",
          kpis: [
            { id: "reached", label: "Overdue Segment", value: "244", delta: "Steady", note: "Non-PHI Overdue > 12 mo cohort", tone: "teal" },
            { id: "booked", label: "Annual Visits Booked", value: "70", delta: "+9 this week", note: "High mobile booking completion", tone: "green" },
            { id: "rate", label: "Reactivation Rate", value: "28.7%", delta: "+2.4 pts MoM", note: "Consistent quarterly wellness return", tone: "green" },
            { id: "suppressed", label: "Auto-Removed Pre-Touch 3", value: "83%", delta: "Zero duplicates", note: "Automatic dynamic-list exit on booking", tone: "blue" },
          ],
          breakdowns: [
            {
              id: "by-touch",
              title: "Visits Booked by Reminder Touch (Boulder — Foothills)",
              kind: "bars",
              badge: "Boulder clinic",
              badgeTone: "teal",
              rows: [
                { label: "Touch 1 (Day 0 Reminder)", value: 40, displayValue: "40 visits", meta: "57%", tone: "green" },
                { label: "Touch 2 (Day 10 Morning/Sat Slots)", value: 18, displayValue: "18 visits", meta: "26%", tone: "teal" },
                { label: "Touch 3 (Day 24 Final Check-In)", value: 12, displayValue: "12 visits", meta: "17%", tone: "blue" },
              ],
            },
            {
              id: "funnel",
              title: "Boulder — Foothills Reactivation Funnel",
              kind: "funnel",
              rows: [
                { label: "Overdue > 12 mo Segment", value: 244, displayValue: "244", pct: 100 },
                { label: "Touch 1 Delivered", value: 234, displayValue: "234", meta: "96%", pct: 96 },
                { label: "Reminder Email Opened", value: 150, displayValue: "150", meta: "61%", pct: 61 },
                { label: "Booking Link Clicked", value: 80, displayValue: "80", meta: "33%", pct: 33 },
                { label: "Annual Visit Booked & Removed", value: 70, displayValue: "70", meta: "28.7%", pct: 29 },
              ],
            },
          ],
          table: {
            title: "Boulder — Foothills Breakdown by Overdue Bucket",
            columns: [
              { key: "bucket", label: "Last-visit bucket (non-PHI)" },
              { key: "segment", label: "Overdue contacts", align: "right" },
              { key: "booked", label: "Visits booked", align: "right" },
              { key: "rate", label: "Reactivation rate", tag: true },
              { key: "avgDays", label: "Avg days to book", align: "right" },
            ],
            rows: [
              {
                id: "bou-12-18",
                cells: { bucket: "12–18 months ago", segment: "148", booked: "48", rate: "32.4%", avgDays: "5.7 days" },
                tones: { rate: "green" },
              },
              {
                id: "bou-18-24",
                cells: { bucket: "18–24 months ago", segment: "68", booked: "16", rate: "23.5%", avgDays: "9.4 days" },
                tones: { rate: "teal" },
              },
              {
                id: "bou-24-plus",
                cells: { bucket: "24+ months ago", segment: "28", booked: "6", rate: "21.4%", avgDays: "13.0 days" },
                tones: { rate: "amber" },
              },
            ],
          },
        },
      ],
    },
    kpis: [
      { id: "reached", label: "Overdue Patients Reached", value: "1,248", delta: "4 clinics", note: "Dynamic segment fed by non-PHI overdue flags", tone: "teal" },
      { id: "booked", label: "Annual Visits Booked", value: "388", delta: "+1 booked today", note: "Includes Camila Reyes booked at Denver — Cherry Creek", tone: "green" },
      { id: "rate", label: "Overall Reactivation Rate", value: "31.1%", delta: "+4.6 pts vs target", note: "Share of overdue contacts booking an annual visit", tone: "green" },
      { id: "suppressed", label: "Auto-Removed Pre-Touch 3", value: "84%", delta: "Zero duplicates", note: "Contacts dropped from segment immediately on booking", tone: "blue" },
    ],
    breakdowns: [
      {
        id: "by-location",
        title: "Reactivation Rate by Clinic Location",
        subtitle: "Percentage of Overdue > 12 Months segment that booked an annual visit",
        kind: "bars",
        badge: "4 specialty clinics",
        badgeTone: "teal",
        rows: [
          { label: "Denver — Cherry Creek", value: 35.4, displayValue: "35.4%", meta: "136 / 384 booked", pct: 88, tone: "green" },
          { label: "Scottsdale — North", value: 31.9, displayValue: "31.9%", meta: "104 / 326 booked", pct: 80, tone: "teal" },
          { label: "Boulder — Foothills", value: 28.7, displayValue: "28.7%", meta: "70 / 244 booked", pct: 72, tone: "blue" },
          { label: "Lakewood — West", value: 26.5, displayValue: "26.5%", meta: "78 / 294 booked", pct: 66, tone: "orange" },
        ],
      },
      {
        id: "funnel",
        title: "Reactivation Campaign Funnel",
        subtitle: "End-to-end progression from overdue dynamic segment to auto-removed booking",
        kind: "funnel",
        badge: "3-touch series",
        badgeTone: "neutral",
        rows: [
          { label: "Overdue > 12 mo Segment", value: 1248, displayValue: "1,248", pct: 100 },
          { label: "Touch 1 Reminder Delivered", value: 1210, displayValue: "1,210", meta: "97%", pct: 97 },
          { label: "Reminder Email Opened", value: 798, displayValue: "798", meta: "64%", pct: 64 },
          { label: "Scheduling Link Clicked", value: 464, displayValue: "464", meta: "37%", pct: 37 },
          { label: "Annual Visit Booked & Auto-Removed", value: 388, displayValue: "388", meta: "31.1%", pct: 31 },
        ],
      },
    ],
    table: {
      title: "Reactivation Performance by Clinic Location",
      subtitle: "All counts reflect non-PHI annual wellness bookings only",
      columns: [
        { key: "location", label: "Clinic location" },
        { key: "segment", label: "Overdue segment", align: "right" },
        { key: "booked", label: "Visits booked", align: "right" },
        { key: "rate", label: "Reactivation rate", tag: true },
        { key: "touch1", label: "Touch 1 share", align: "right" },
        { key: "avgDays", label: "Avg days to book", align: "right" },
      ],
      rows: [
        {
          id: "loc-denver",
          cells: { location: "Denver — Cherry Creek", segment: "384", booked: "136", rate: "35.4%", touch1: "62%", avgDays: "5.2 days" },
          tones: { rate: "green" },
        },
        {
          id: "loc-scottsdale",
          cells: { location: "Scottsdale — North", segment: "326", booked: "104", rate: "31.9%", touch1: "60%", avgDays: "6.4 days" },
          tones: { rate: "green" },
        },
        {
          id: "loc-boulder",
          cells: { location: "Boulder — Foothills", segment: "244", booked: "70", rate: "28.7%", touch1: "57%", avgDays: "7.1 days" },
          tones: { rate: "teal" },
        },
        {
          id: "loc-lakewood",
          cells: { location: "Lakewood — West", segment: "294", booked: "78", rate: "26.5%", touch1: "54%", avgDays: "8.3 days" },
          tones: { rate: "teal" },
        },
      ],
    },
  },
};
