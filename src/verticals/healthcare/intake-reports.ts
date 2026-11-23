import type { AnalyticsReportSpec } from "../analytics-types";

/**
 * Native HubSpot Analytics reports for Healthcare (Crestline Clinical Staffing & Specialty Clinics).
 * Both reports are pure native HubSpot dashboards (no `creditsOutcome` -> ZERO Penguin markers).
 */
export const healthcareReports: Record<string, AnalyticsReportSpec> = {
  "referral-funnel": {
    id: "referral-funnel",
    title: "Referral-to-Appointment Funnel by Specialty & Location",
    subtitle: "Native HubSpot specialty clinic intake funnel across referring practices, specialties, and locations · Last 30 days (zero PHI)",
    badge: "Native HubSpot Report",
    badgeTone: "green",
    demoId: "referral-intake",
    backLink: { to: "/deals/dl-intake-referral", label: "Back to referral deal" },
    completeFlag: "intake.referral-intake.reportSeen",
    filter: {
      label: "Specialty & Location",
      defaultOptionId: "all",
      options: [
        { id: "all", label: "All specialties & locations" },
        {
          id: "cardiology-scottsdale",
          label: "Cardiology · Scottsdale North",
          kpis: [
            { id: "referrals", label: "Referrals Received", value: "94", delta: "+14% MoM", note: "From 11 Scottsdale-area referring clinics", tone: "teal" },
            { id: "scheduled", label: "Visits Scheduled", value: "78", delta: "83.0% conv.", note: "Includes Jordan Alvarez (Oakwood)", tone: "green" },
            { id: "speed", label: "Median Time to Book", value: "1.4 days", delta: "-0.6 days", note: "Self-scheduling link sent within 3.2 hrs", tone: "blue" },
            { id: "value", label: "Scheduled Visit Value", value: "$144,300", delta: "+18%", note: "Estimated outpatient consult revenue", tone: "green" },
          ],
          breakdowns: [
            {
              id: "intake-funnel",
              title: "Scottsdale North Cardiology Funnel",
              kind: "funnel",
              badge: "83.0% booked",
              badgeTone: "green",
              rows: [
                { label: "Referral Form Submitted", value: 94, displayValue: "94", pct: 100 },
                { label: "Provider NPI Validated", value: 91, displayValue: "91", meta: "96.8%", pct: 97 },
                { label: "Scheduling Link Sent", value: 87, displayValue: "87", meta: "92.6%", pct: 93 },
                { label: "Appointment Scheduled", value: 78, displayValue: "78", meta: "83.0%", pct: 83 },
              ],
            },
            {
              id: "by-practice",
              title: "Scheduled Visits by Referring Practice",
              kind: "bars",
              rows: [
                { label: "Oakwood Family Medicine", value: 31, displayValue: "31 booked", meta: "86% conv.", tone: "green" },
                { label: "Desert Vista Primary Care", value: 24, displayValue: "24 booked", meta: "80% conv.", tone: "teal" },
                { label: "Canyon Creek Internal Med", value: 14, displayValue: "14 booked", meta: "82% conv.", tone: "blue" },
                { label: "Sunridge Medical Group", value: 9, displayValue: "9 booked", meta: "75% conv.", tone: "orange" },
              ],
            },
          ],
          table: {
            title: "Scottsdale North Cardiology Referring Practices",
            columns: [
              { key: "practice", label: "Referring Practice" },
              { key: "location", label: "Clinic Location", tag: true },
              { key: "received", label: "Referrals", align: "right" },
              { key: "scheduled", label: "Scheduled", align: "right" },
              { key: "rate", label: "Conversion", align: "right" },
              { key: "median", label: "Median Book Time", align: "right" },
            ],
            rows: [
              {
                id: "oakwood",
                linkTo: "/deals/dl-intake-referral",
                cells: { practice: "Oakwood Family Medicine", location: "Scottsdale North", received: "36", scheduled: "31", rate: "86.1%", median: "1.2 days" },
                tones: { location: "teal" },
              },
              {
                id: "desert-vista",
                cells: { practice: "Desert Vista Primary Care", location: "Scottsdale North", received: "30", scheduled: "24", rate: "80.0%", median: "1.5 days" },
                tones: { location: "teal" },
              },
              {
                id: "canyon-creek",
                cells: { practice: "Canyon Creek Internal Med", location: "Scottsdale North", received: "17", scheduled: "14", rate: "82.4%", median: "1.6 days" },
                tones: { location: "teal" },
              },
            ],
          },
        },
        {
          id: "ortho-phoenix",
          label: "Orthopedics · Phoenix West",
          kpis: [
            { id: "referrals", label: "Referrals Received", value: "82", delta: "+9% MoM", note: "Sports medicine & joint consults", tone: "teal" },
            { id: "scheduled", label: "Visits Scheduled", value: "66", delta: "80.5% conv.", note: "Auto-routed to Phoenix West coordinators", tone: "green" },
            { id: "speed", label: "Median Time to Book", value: "1.9 days", delta: "-0.4 days", note: "92% receive link within 4 hours", tone: "blue" },
            { id: "value", label: "Scheduled Visit Value", value: "$138,600", delta: "+12%", note: "Estimated outpatient orthopedic revenue", tone: "green" },
          ],
          breakdowns: [
            {
              id: "intake-funnel",
              title: "Phoenix West Orthopedics Funnel",
              kind: "funnel",
              badge: "80.5% booked",
              badgeTone: "green",
              rows: [
                { label: "Referral Form Submitted", value: 82, displayValue: "82", pct: 100 },
                { label: "Provider NPI Validated", value: 79, displayValue: "79", meta: "96.3%", pct: 96 },
                { label: "Scheduling Link Sent", value: 75, displayValue: "75", meta: "91.5%", pct: 91 },
                { label: "Appointment Scheduled", value: 66, displayValue: "66", meta: "80.5%", pct: 81 },
              ],
            },
            {
              id: "by-practice",
              title: "Scheduled Visits by Referring Practice",
              kind: "bars",
              rows: [
                { label: "Westside Urgent & Primary", value: 28, displayValue: "28 booked", meta: "82% conv.", tone: "green" },
                { label: "Estrella Family Health", value: 22, displayValue: "22 booked", meta: "79% conv.", tone: "teal" },
                { label: "Red Mountain Physicians", value: 16, displayValue: "16 booked", meta: "80% conv.", tone: "blue" },
              ],
            },
          ],
          table: {
            title: "Phoenix West Orthopedics Referring Practices",
            columns: [
              { key: "practice", label: "Referring Practice" },
              { key: "location", label: "Clinic Location", tag: true },
              { key: "received", label: "Referrals", align: "right" },
              { key: "scheduled", label: "Scheduled", align: "right" },
              { key: "rate", label: "Conversion", align: "right" },
              { key: "median", label: "Median Book Time", align: "right" },
            ],
            rows: [
              {
                id: "westside",
                cells: { practice: "Westside Urgent & Primary", location: "Phoenix West", received: "34", scheduled: "28", rate: "82.4%", median: "1.7 days" },
                tones: { location: "blue" },
              },
              {
                id: "estrella",
                cells: { practice: "Estrella Family Health", location: "Phoenix West", received: "28", scheduled: "22", rate: "78.6%", median: "2.0 days" },
                tones: { location: "blue" },
              },
            ],
          },
        },
        {
          id: "surgery-tempe",
          label: "Ambulatory Surgery · Tempe",
          kpis: [
            { id: "referrals", label: "Referrals Received", value: "58", delta: "+11% MoM", note: "Outpatient pre-op & surgical consults", tone: "teal" },
            { id: "scheduled", label: "Visits Scheduled", value: "46", delta: "79.3% conv.", note: "Pre-op scheduling coordinated online", tone: "green" },
            { id: "speed", label: "Median Time to Book", value: "2.1 days", delta: "-0.5 days", note: "Same-day intake coordinator assignment", tone: "blue" },
            { id: "value", label: "Scheduled Visit Value", value: "$124,200", delta: "+15%", note: "Estimated ambulatory consult revenue", tone: "green" },
          ],
          breakdowns: [
            {
              id: "intake-funnel",
              title: "Tempe Ambulatory Surgery Funnel",
              kind: "funnel",
              badge: "79.3% booked",
              badgeTone: "green",
              rows: [
                { label: "Referral Form Submitted", value: 58, displayValue: "58", pct: 100 },
                { label: "Provider NPI Validated", value: 56, displayValue: "56", meta: "96.6%", pct: 97 },
                { label: "Scheduling Link Sent", value: 52, displayValue: "52", meta: "89.7%", pct: 90 },
                { label: "Appointment Scheduled", value: 46, displayValue: "46", meta: "79.3%", pct: 79 },
              ],
            },
            {
              id: "by-practice",
              title: "Scheduled Visits by Referring Practice",
              kind: "bars",
              rows: [
                { label: "Tempe Health Partners", value: 25, displayValue: "25 booked", meta: "81% conv.", tone: "green" },
                { label: "Mesa Valley Physicians", value: 21, displayValue: "21 booked", meta: "78% conv.", tone: "teal" },
              ],
            },
          ],
          table: {
            title: "Tempe Ambulatory Surgery Referring Practices",
            columns: [
              { key: "practice", label: "Referring Practice" },
              { key: "location", label: "Clinic Location", tag: true },
              { key: "received", label: "Referrals", align: "right" },
              { key: "scheduled", label: "Scheduled", align: "right" },
              { key: "rate", label: "Conversion", align: "right" },
              { key: "median", label: "Median Book Time", align: "right" },
            ],
            rows: [
              {
                id: "tempe-hp",
                cells: { practice: "Tempe Health Partners", location: "Tempe Center", received: "31", scheduled: "25", rate: "80.6%", median: "1.9 days" },
                tones: { location: "orange" },
              },
              {
                id: "mesa-valley",
                cells: { practice: "Mesa Valley Physicians", location: "Tempe Center", received: "27", scheduled: "21", rate: "77.8%", median: "2.3 days" },
                tones: { location: "orange" },
              },
            ],
          },
        },
      ],
    },
    kpis: [
      { id: "referrals", label: "Referrals Received", value: "234", delta: "+12% MoM", note: "Across 3 clinic locations · 0 manual re-entry", tone: "teal" },
      { id: "scheduled", label: "Visits Scheduled", value: "190", delta: "81.2% conv.", note: "Up from 64% before automated intake routing", tone: "green" },
      { id: "speed", label: "Median Time to Book", value: "1.7 days", delta: "-1.1 days", note: "From referring-clinic submit to booked slot", tone: "blue" },
      { id: "value", label: "Scheduled Visit Value", value: "$407,100", delta: "+16%", note: "Includes Oakwood → Scottsdale North Cardiology", tone: "green" },
    ],
    breakdowns: [
      {
        id: "intake-funnel",
        title: "End-to-End Referral-to-Appointment Funnel",
        subtitle: "Tracks every referral stage from off-platform submission to confirmed slot",
        kind: "funnel",
        badge: "81.2% scheduled",
        badgeTone: "green",
        rows: [
          { label: "Referral Form Submitted", value: 234, displayValue: "234", pct: 100 },
          { label: "Provider NPI Validated & Routed", value: 226, displayValue: "226", meta: "96.6%", pct: 97 },
          { label: "Patient Scheduling Link Sent", value: 214, displayValue: "214", meta: "91.5%", pct: 91 },
          { label: "Appointment Scheduled", value: 190, displayValue: "190", meta: "81.2%", pct: 81 },
        ],
      },
      {
        id: "by-specialty-location",
        title: "Scheduled Visits by Specialty & Location",
        subtitle: "Booked volume and conversion rate across Crestline clinic sites",
        kind: "bars",
        rows: [
          { label: "Cardiology · Scottsdale North", value: 78, displayValue: "78 booked", meta: "83.0% conv.", tone: "green" },
          { label: "Orthopedics · Phoenix West", value: 66, displayValue: "66 booked", meta: "80.5% conv.", tone: "teal" },
          { label: "Ambulatory Surgery · Tempe", value: 46, displayValue: "46 booked", meta: "79.3% conv.", tone: "blue" },
        ],
      },
    ],
    table: {
      title: "Top Referring Practices",
      subtitle: "Last 30 days · non-PHI referral logistics",
      columns: [
        { key: "practice", label: "Referring Practice" },
        { key: "specialty", label: "Primary Specialty", tag: true },
        { key: "location", label: "Clinic Location", tag: true },
        { key: "received", label: "Referrals", align: "right" },
        { key: "scheduled", label: "Scheduled", align: "right" },
        { key: "rate", label: "Conversion", align: "right" },
      ],
      rows: [
        {
          id: "oakwood",
          linkTo: "/deals/dl-intake-referral",
          cells: { practice: "Oakwood Family Medicine", specialty: "Cardiology", location: "Scottsdale North", received: "36", scheduled: "31", rate: "86.1%" },
          tones: { specialty: "green", location: "teal" },
        },
        {
          id: "westside",
          cells: { practice: "Westside Urgent & Primary", specialty: "Orthopedics", location: "Phoenix West", received: "34", scheduled: "28", rate: "82.4%" },
          tones: { specialty: "blue", location: "blue" },
        },
        {
          id: "tempe-hp",
          cells: { practice: "Tempe Health Partners", specialty: "Ambulatory Surgery", location: "Tempe Center", received: "31", scheduled: "25", rate: "80.6%" },
          tones: { specialty: "orange", location: "orange" },
        },
        {
          id: "desert-vista",
          cells: { practice: "Desert Vista Primary Care", specialty: "Cardiology", location: "Scottsdale North", received: "30", scheduled: "24", rate: "80.0%" },
          tones: { specialty: "green", location: "teal" },
        },
      ],
    },
  },

  "staffing-fill-rate": {
    id: "staffing-fill-rate",
    title: "Fill Rate & Time to Fill by Specialty",
    subtitle: "Native HubSpot healthcare staffing job-order pipeline, fill velocity, and placement revenue · Last 90 days",
    badge: "Native HubSpot Report",
    badgeTone: "green",
    demoId: "staffing-job-orders",
    backLink: { to: "/deals/dl-intake-staffing", label: "Back to job order" },
    completeFlag: "intake.staffing-job-orders.reportSeen",
    filter: {
      label: "Clinical Specialty",
      defaultOptionId: "all",
      options: [
        { id: "all", label: "All specialties" },
        {
          id: "icu",
          label: "ICU / Critical Care",
          kpis: [
            { id: "fill-rate", label: "ICU Fill Rate", value: "88.9%", delta: "+6.4 pts", note: "16 of 18 critical-care job orders placed", tone: "green" },
            { id: "time-to-fill", label: "Avg Time to Fill", value: "3.8 days", delta: "-1.4 days", note: "Pre-credentialed ATS shortlists cut review lag", tone: "blue" },
            { id: "revenue", label: "Placed Revenue", value: "$617,200", delta: "+22%", note: "Includes Summit Ridge ($57,200 placed)", tone: "green" },
            { id: "orders", label: "Active ICU Orders", value: "6", delta: "24 shifts", note: "Mountain West & Pacific Northwest hospitals", tone: "teal" },
          ],
          breakdowns: [
            {
              id: "job-order-funnel",
              title: "ICU Job-Order Conversion Funnel",
              kind: "funnel",
              badge: "88.9% filled",
              badgeTone: "green",
              rows: [
                { label: "ICU Staffing Requests", value: 18, displayValue: "18 orders", pct: 100 },
                { label: "Shortlists Sent (< 48 hrs)", value: 18, displayValue: "18 orders", meta: "100%", pct: 100 },
                { label: "Candidates Selected", value: 17, displayValue: "17 orders", meta: "94.4%", pct: 94 },
                { label: "Placed & Revenue Recorded", value: 16, displayValue: "16 orders", meta: "88.9%", pct: 89 },
              ],
            },
            {
              id: "by-shift",
              title: "ICU Placements by Shift Window",
              kind: "bars",
              rows: [
                { label: "Night Shift (7p–7a)", value: 382000, displayValue: "$382,000", meta: "10 orders · 3.6d TTF", tone: "green" },
                { label: "Day Shift (7a–7p)", value: 168000, displayValue: "$168,000", meta: "4 orders · 4.1d TTF", tone: "teal" },
                { label: "Rotating 12-Hr Surge", value: 67200, displayValue: "$67,200", meta: "2 orders · 4.4d TTF", tone: "blue" },
              ],
            },
          ],
          table: {
            title: "Recent ICU / Critical Care Job Orders",
            columns: [
              { key: "order", label: "Job Order" },
              { key: "shift", label: "Shift", tag: true },
              { key: "stage", label: "Stage", tag: true },
              { key: "ttf", label: "Time to Fill", align: "right" },
              { key: "revenue", label: "Placement Revenue", align: "right" },
            ],
            rows: [
              {
                id: "summit-icu",
                linkTo: "/deals/dl-intake-staffing",
                cells: { order: "Summit Ridge Medical Center (2 ICU RNs)", shift: "Nights 7p–7a", stage: "Placed", ttf: "2.4 days", revenue: "$57,200" },
                tones: { shift: "blue", stage: "green" },
              },
              {
                id: "mercy-icu",
                linkTo: "/deals/dl-mercy-icu",
                cells: { order: "Mercy Pines Health System (4 ICU RNs)", shift: "Nights 7p–7a", stage: "Credentialing & Offer", ttf: "3.9 days", revenue: "$113,200" },
                tones: { shift: "blue", stage: "amber" },
              },
              {
                id: "cascadia-icu",
                linkTo: "/deals/dl-cascadia-icu",
                cells: { order: "Cascadia Regional Medical (5 ICU RNs)", shift: "Nights 7p–7a", stage: "Shortlist Sent", ttf: "4.1 days", revenue: "$140,000" },
                tones: { shift: "blue", stage: "teal" },
              },
            ],
          },
        },
        {
          id: "er",
          label: "Emergency (ER)",
          kpis: [
            { id: "fill-rate", label: "ER Fill Rate", value: "85.7%", delta: "+4.2 pts", note: "12 of 14 ER travel-RN orders filled", tone: "green" },
            { id: "time-to-fill", label: "Avg Time to Fill", value: "4.3 days", delta: "-0.9 days", note: "Fast-track ACLS/TNCC credentialing", tone: "blue" },
            { id: "revenue", label: "Placed Revenue", value: "$384,800", delta: "+15%", note: "13-week trauma & urgent ER assignments", tone: "green" },
            { id: "orders", label: "Active ER Orders", value: "5", delta: "16 shifts", note: "South Central & Mountain West", tone: "teal" },
          ],
          breakdowns: [
            {
              id: "job-order-funnel",
              title: "Emergency (ER) Job-Order Funnel",
              kind: "funnel",
              badge: "85.7% filled",
              badgeTone: "green",
              rows: [
                { label: "ER Staffing Requests", value: 14, displayValue: "14 orders", pct: 100 },
                { label: "Shortlists Sent", value: 13, displayValue: "13 orders", meta: "92.9%", pct: 93 },
                { label: "Candidates Selected", value: 12, displayValue: "12 orders", meta: "85.7%", pct: 86 },
                { label: "Placed & Revenue Recorded", value: 12, displayValue: "12 orders", meta: "85.7%", pct: 86 },
              ],
            },
            {
              id: "by-shift",
              title: "ER Placements by Facility Type",
              kind: "bars",
              rows: [
                { label: "Level-1 / Level-2 Trauma", value: 246600, displayValue: "$246,600", meta: "7 orders · 4.1d TTF", tone: "green" },
                { label: "Regional Urgent & ER", value: 138200, displayValue: "$138,200", meta: "5 orders · 4.6d TTF", tone: "teal" },
              ],
            },
          ],
          table: {
            title: "Recent Emergency (ER) Job Orders",
            columns: [
              { key: "order", label: "Job Order" },
              { key: "shift", label: "Shift", tag: true },
              { key: "stage", label: "Stage", tag: true },
              { key: "ttf", label: "Time to Fill", align: "right" },
              { key: "revenue", label: "Placement Revenue", align: "right" },
            ],
            rows: [
              {
                id: "silverline-er",
                linkTo: "/deals/dl-silverline-er",
                cells: { order: "Silverline Urgent & Trauma Care (4 ER RNs)", shift: "Rotating 12-hr", stage: "Staffing Request", ttf: "4.3 days", revenue: "$109,600" },
                tones: { shift: "amber", stage: "neutral" },
              },
            ],
          },
        },
        {
          id: "tele-pacu",
          label: "Telemetry & PACU",
          kpis: [
            { id: "fill-rate", label: "Tele / PACU Fill Rate", value: "84.6%", delta: "+3.8 pts", note: "11 of 13 orders placed", tone: "green" },
            { id: "time-to-fill", label: "Avg Time to Fill", value: "4.6 days", delta: "-0.7 days", note: "Acute & outpatient surgery centers", tone: "blue" },
            { id: "revenue", label: "Placed Revenue", value: "$275,200", delta: "+11%", note: "High 13-week extension rate (46%)", tone: "green" },
            { id: "orders", label: "Active Orders", value: "4", delta: "11 shifts", note: "West & Southeast specialty networks", tone: "teal" },
          ],
          breakdowns: [
            {
              id: "job-order-funnel",
              title: "Telemetry & PACU Job-Order Funnel",
              kind: "funnel",
              badge: "84.6% filled",
              badgeTone: "green",
              rows: [
                { label: "Staffing Requests", value: 13, displayValue: "13 orders", pct: 100 },
                { label: "Shortlists Sent", value: 12, displayValue: "12 orders", meta: "92.3%", pct: 92 },
                { label: "Candidates Selected", value: 11, displayValue: "11 orders", meta: "84.6%", pct: 85 },
                { label: "Placed", value: 11, displayValue: "11 orders", meta: "84.6%", pct: 85 },
              ],
            },
            {
              id: "by-shift",
              title: "Telemetry & PACU Breakdown",
              kind: "bars",
              rows: [
                { label: "Telemetry Travel RN", value: 173600, displayValue: "$173,600", meta: "7 orders · 4.8d TTF", tone: "teal" },
                { label: "Outpatient PACU / Pre-Op RN", value: 101600, displayValue: "$101,600", meta: "4 orders · 4.2d TTF", tone: "blue" },
              ],
            },
          ],
          table: {
            title: "Recent Telemetry & PACU Job Orders",
            columns: [
              { key: "order", label: "Job Order" },
              { key: "shift", label: "Shift", tag: true },
              { key: "stage", label: "Stage", tag: true },
              { key: "ttf", label: "Time to Fill", align: "right" },
              { key: "revenue", label: "Placement Revenue", align: "right" },
            ],
            rows: [
              {
                id: "redwood-tele",
                linkTo: "/deals/dl-redwood-tele",
                cells: { order: "Redwood Valley Health (5 Telemetry RNs)", shift: "Days 7a–7p", stage: "Interviews", ttf: "4.8 days", revenue: "$124,000" },
                tones: { shift: "teal", stage: "blue" },
              },
              {
                id: "bayside-pacu",
                linkTo: "/deals/dl-bayside-pacu",
                cells: { order: "Bayside Orthopedic Institute (2 PACU RNs)", shift: "Outpatient Day", stage: "Placed", ttf: "4.1 days", revenue: "$51,200" },
                tones: { shift: "teal", stage: "green" },
              },
            ],
          },
        },
        {
          id: "allied",
          label: "Allied Health",
          kpis: [
            { id: "fill-rate", label: "Allied Fill Rate", value: "81.8%", delta: "+2.9 pts", note: "9 of 11 allied job orders filled", tone: "green" },
            { id: "time-to-fill", label: "Avg Time to Fill", value: "5.1 days", delta: "-0.6 days", note: "Surgical techs & respiratory therapists", tone: "blue" },
            { id: "revenue", label: "Placed Revenue", value: "$150,800", delta: "+9%", note: "OR suites & pediatric specialty hospitals", tone: "green" },
            { id: "orders", label: "Active Allied Orders", value: "3", delta: "7 shifts", note: "Southwest & Northeast networks", tone: "teal" },
          ],
          breakdowns: [
            {
              id: "job-order-funnel",
              title: "Allied Health Job-Order Funnel",
              kind: "funnel",
              badge: "81.8% filled",
              badgeTone: "green",
              rows: [
                { label: "Allied Requests", value: 11, displayValue: "11 orders", pct: 100 },
                { label: "Shortlists Sent", value: 10, displayValue: "10 orders", meta: "90.9%", pct: 91 },
                { label: "Placed", value: 9, displayValue: "9 orders", meta: "81.8%", pct: 82 },
              ],
            },
            {
              id: "by-shift",
              title: "Allied Health Breakdown",
              kind: "bars",
              rows: [
                { label: "Respiratory Therapist (Critical Care)", value: 89600, displayValue: "$89,600", meta: "5 orders · 4.9d TTF", tone: "green" },
                { label: "Certified Surgical Technologist", value: 61200, displayValue: "$61,200", meta: "4 orders · 5.4d TTF", tone: "orange" },
              ],
            },
          ],
          table: {
            title: "Recent Allied Health Job Orders",
            columns: [
              { key: "order", label: "Job Order" },
              { key: "shift", label: "Role", tag: true },
              { key: "stage", label: "Stage", tag: true },
              { key: "ttf", label: "Time to Fill", align: "right" },
              { key: "revenue", label: "Placement Revenue", align: "right" },
            ],
            rows: [
              {
                id: "harborview-rt",
                linkTo: "/deals/dl-harborview-rt",
                cells: { order: "Harborview Children's Specialty (3 RTs)", shift: "Respiratory", stage: "Placed", ttf: "4.9 days", revenue: "$67,200" },
                tones: { shift: "teal", stage: "green" },
              },
              {
                id: "ridgecrest-cst",
                linkTo: "/deals/dl-ridgecrest-cst",
                cells: { order: "Ridgecrest Specialty Clinics (2 CSTs + PACU)", shift: "OR Suite", stage: "Shortlist Sent", ttf: "5.4 days", revenue: "$68,000" },
                tones: { shift: "orange", stage: "teal" },
              },
            ],
          },
        },
      ],
    },
    kpis: [
      { id: "fill-rate", label: "Overall Fill Rate", value: "86.4%", delta: "+5.1 pts", note: "48 of 56 hospital job orders placed in Q1", tone: "green" },
      { id: "time-to-fill", label: "Avg Time to Fill", value: "4.2 days", delta: "-1.1 days", note: "Request submitted to clinician placed", tone: "blue" },
      { id: "revenue", label: "Placed Revenue", value: "$1,428,000", delta: "+17%", note: "Includes Summit Ridge ($57,200 placed)", tone: "green" },
      { id: "orders", label: "Active Job Orders", value: "18", delta: "58 open shifts", note: "Across 10 health systems & clinic groups", tone: "teal" },
    ],
    breakdowns: [
      {
        id: "job-order-funnel",
        title: "Staffing Job-Order Pipeline Funnel",
        subtitle: "Tracks hospital requests through shortlist delivery and placement",
        kind: "funnel",
        badge: "86.4% filled",
        badgeTone: "green",
        rows: [
          { label: "Staffing Request Submitted", value: 56, displayValue: "56 orders", pct: 100 },
          { label: "ATS Shortlist Emailed", value: 53, displayValue: "53 orders", meta: "94.6%", pct: 95 },
          { label: "Hiring Manager Selected", value: 49, displayValue: "49 orders", meta: "87.5%", pct: 88 },
          { label: "Placed & Revenue Recorded", value: 48, displayValue: "48 orders", meta: "86.4%", pct: 86 },
        ],
      },
      {
        id: "by-specialty",
        title: "Placed Revenue & Time to Fill by Specialty",
        subtitle: "13-week placement revenue and fill speed per clinical specialty",
        kind: "bars",
        rows: [
          { label: "ICU / Critical Care", value: 617200, displayValue: "$617,200", meta: "88.9% fill · 3.8d TTF", tone: "green" },
          { label: "Emergency (ER)", value: 384800, displayValue: "$384,800", meta: "85.7% fill · 4.3d TTF", tone: "teal" },
          { label: "Telemetry & PACU", value: 275200, displayValue: "$275,200", meta: "84.6% fill · 4.6d TTF", tone: "blue" },
          { label: "Allied Health", value: 150800, displayValue: "$150,800", meta: "81.8% fill · 5.1d TTF", tone: "orange" },
        ],
      },
    ],
    table: {
      title: "Recent Staffing Job Orders",
      subtitle: "Click any job order to inspect its HubSpot deal record",
      columns: [
        { key: "order", label: "Job Order" },
        { key: "specialty", label: "Specialty", tag: true },
        { key: "stage", label: "Stage", tag: true },
        { key: "ttf", label: "Time to Fill", align: "right" },
        { key: "revenue", label: "Revenue", align: "right" },
      ],
      rows: [
        {
          id: "summit-icu",
          linkTo: "/deals/dl-intake-staffing",
          cells: { order: "Summit Ridge Medical Center: 2 ICU Night-Shift RNs", specialty: "ICU / Critical Care", stage: "Placed", ttf: "2.4 days", revenue: "$57,200" },
          tones: { specialty: "green", stage: "green" },
        },
        {
          id: "mercy-icu",
          linkTo: "/deals/dl-mercy-icu",
          cells: { order: "Mercy Pines Health System: 4 ICU Travel RNs", specialty: "ICU / Critical Care", stage: "Credentialing & Offer", ttf: "3.9 days", revenue: "$113,200" },
          tones: { specialty: "green", stage: "amber" },
        },
        {
          id: "bayside-pacu",
          linkTo: "/deals/dl-bayside-pacu",
          cells: { order: "Bayside Orthopedic Institute: 2 PACU Travel RNs", specialty: "Telemetry & PACU", stage: "Placed", ttf: "4.1 days", revenue: "$51,200" },
          tones: { specialty: "blue", stage: "green" },
        },
        {
          id: "harborview-rt",
          linkTo: "/deals/dl-harborview-rt",
          cells: { order: "Harborview Children's Specialty: 3 Respiratory Therapists", specialty: "Allied Health", stage: "Placed", ttf: "4.9 days", revenue: "$67,200" },
          tones: { specialty: "orange", stage: "green" },
        },
      ],
    },
  },
};
