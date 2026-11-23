import type { DemoId } from "@/verticals/catalog";
import type { Pack } from "@/verticals/types";
import { customerAgent, customerAgentScriptFor } from "./customer-agent";
import { referralIntake, staffingJobOrders } from "./intake";
import { marketingStudio } from "./marketing-studio";
import { patientReactivation } from "./patient-reactivation";
import { discountApproval, guidedQuote } from "./quoting";
import { aiProspecting, backOffice, emailToDeal, leadCapture, pqlTrialProspecting } from "./sales";
import { socialAds } from "./social-ads";
import { customerOnboarding, incidentComms, postVisitFeedback } from "./tickets";
import type { DemoScript } from "./types";

export { createTicketsScript, ticketReportFlag } from "./tickets";
export { currentStep, hintOf, requiredSteps, stepText, type DemoScript, type Step, type StepCtx } from "./types";

export const SCRIPTS: Record<DemoId, DemoScript> = {
  "guided-quote": guidedQuote,
  "discount-approval": discountApproval,
  "back-office": backOffice,
  "lead-capture": leadCapture,
  "email-to-deal": emailToDeal,
  "ai-prospecting": aiProspecting,
  "customer-agent": customerAgent,
  "social-ads": socialAds,
  "marketing-studio": marketingStudio,
  "post-visit-feedback": postVisitFeedback,
  "patient-reactivation": patientReactivation,
  "referral-intake": referralIntake,
  "staffing-job-orders": staffingJobOrders,
  "incident-comms": incidentComms,
  "pql-trial-prospecting": pqlTrialProspecting,
  "customer-onboarding": customerOnboarding,
};

/** Resolves a demo script for one pack, picking the vertical customer-agent variant and filtering steps whose `when(pack)` is false. */
export function scriptFor(demo: DemoId, pack: Pack): DemoScript {
  const base = demo === "customer-agent" ? customerAgentScriptFor(pack) : SCRIPTS[demo];
  const steps = base.steps.filter((s) => !s.when || s.when(pack));
  return steps.length === base.steps.length ? base : { ...base, steps };
}
