import type { DemoId } from "@/verticals/catalog";
import { customerAgent } from "./customer-agent";
import { marketingStudio } from "./marketing-studio";
import { discountApproval, guidedQuote } from "./quoting";
import { aiProspecting, backOffice, emailToDeal, leadCapture } from "./sales";
import { socialAds } from "./social-ads";
import type { DemoScript } from "./types";

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
};
