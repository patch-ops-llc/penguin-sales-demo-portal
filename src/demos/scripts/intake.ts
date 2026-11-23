import type { IntakeDemoId } from "@/shell/intake/types";
import { flag, has, type DemoScript } from "./types";

export const intakeReportFlag = (demoId: IntakeDemoId) => `intake.${demoId}.reportSeen`;

type IntakeStepText = {
  submitTitle: string;
  submitHint: string;
  reviewTitle: string;
  reviewHint: string;
  outreachTitle: string;
  outreachHint: string;
  followupTitle: string;
  followupHint: string;
  verifyTitle: string;
  verifyHint: string;
  reportTitle: string;
  reportHint: string;
};

function makeIntakeScript(demoId: IntakeDemoId, copy: IntakeStepText): DemoScript {
  const dealPath = (dealId: string | null, fallback?: string) => `/deals/${dealId ?? fallback ?? ""}`;

  return {
    id: demoId,
    steps: [
      {
        id: "submit-form",
        title: copy.submitTitle,
        hint: copy.submitHint,
        path: () => `/intake/${demoId}/submit`,
        done: ({ w }) => w.intake[demoId].submitted,
        script: (_c, now) => [{ t: "intake.submit", demoId, at: now }],
      },
      {
        id: "review-routing",
        title: copy.reviewTitle,
        hint: copy.reviewHint,
        path: ({ w, pack }) => dealPath(w.intake[demoId].dealId, pack.demos.intake?.[demoId]?.createdRecords.dealId),
        done: ({ w }) => w.intake[demoId].reviewed,
        script: (_c, now) => [{ t: "intake.review", demoId, at: now }],
      },
      {
        id: "send-outreach",
        title: copy.outreachTitle,
        hint: copy.outreachHint,
        path: ({ w, pack }) => dealPath(w.intake[demoId].dealId, pack.demos.intake?.[demoId]?.createdRecords.dealId),
        done: ({ w }) => w.intake[demoId].outreachSent,
        script: (_c, now) => [{ t: "intake.sendOutreach", demoId, at: now }],
      },
      {
        id: "complete-followup",
        title: copy.followupTitle,
        hint: copy.followupHint,
        path: () => `/intake/${demoId}/followup`,
        done: ({ w }) => w.intake[demoId].followupCompleted,
        script: ({ w, pack }, now) => [
          {
            t: "intake.completeFollowup",
            demoId,
            optionIds: w.intake[demoId].selectedOptionIds.length
              ? w.intake[demoId].selectedOptionIds
              : (pack.demos.intake?.[demoId]?.followup.defaultOptionIds ?? []),
            at: now,
          },
        ],
      },
      {
        id: "verify-stage",
        title: copy.verifyTitle,
        hint: copy.verifyHint,
        path: ({ w, pack }) => dealPath(w.intake[demoId].dealId, pack.demos.intake?.[demoId]?.createdRecords.dealId),
        done: ({ w }) => w.intake[demoId].completionReviewed,
        script: () => [{ t: "intake.reviewCompletion", demoId }],
      },
      {
        id: "review-report",
        title: copy.reportTitle,
        hint: copy.reportHint,
        path: ({ pack }) => `/reports/${pack.demos.intake?.[demoId]?.reportId ?? ""}`,
        done: (c) => has(c, intakeReportFlag(demoId)),
        script: () => [flag(intakeReportFlag(demoId))],
      },
    ],
  };
}

export const referralIntake: DemoScript = makeIntakeScript("referral-intake", {
  submitTitle: "Submit referring-clinic form",
  submitHint: "Off-platform portal: review non-PHI referral logistics and click Submit referral",
  reviewTitle: "Review routed referral deal",
  reviewHint: "HubSpot Deal: check location routing & provider validation, then click Confirm provider & routing",
  outreachTitle: "Email scheduling link to patient",
  outreachHint: "Coordinator outreach: review scheduling email and click Send scheduling link",
  followupTitle: "Patient picks appointment slot",
  followupHint: "Off-platform inbox: choose a Scottsdale North Cardiology slot and click Confirm appointment",
  verifyTitle: "Confirm Scheduled stage & sync",
  verifyHint: "Back in HubSpot: verify Scheduled stage and EHR write-back, then click Open referral funnel report",
  reportTitle: "Review referral funnel report",
  reportHint: "Analytics: filter by specialty & location, then click Complete review",
});

export const staffingJobOrders: DemoScript = makeIntakeScript("staffing-job-orders", {
  submitTitle: "Submit hospital staffing request",
  submitHint: "Off-platform portal: review travel-RN shift details and click Submit job order",
  reviewTitle: "Review job order & ATS shortlist",
  reviewHint: "HubSpot Deal: inspect ATS/VMS pre-credentialed RNs, then click Confirm ATS shortlist",
  outreachTitle: "Email shortlist to hiring manager",
  outreachHint: "Recruiter outreach: review candidate shortlist email and click Send candidate shortlist",
  followupTitle: "Manager selects travel RNs",
  followupHint: "Off-platform inbox: select travel RN candidates and click Confirm candidate selection",
  verifyTitle: "Confirm Placed deal & revenue",
  verifyHint: "Back in HubSpot: verify Placed stage and $57,200 revenue, then click Open fill-rate report",
  reportTitle: "Review fill-rate analytics",
  reportHint: "Analytics: filter fill rate & time to fill by specialty, then click Complete review",
});
