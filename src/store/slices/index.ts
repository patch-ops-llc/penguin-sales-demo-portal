export { applyCore, type CoreAction } from "./core";
export { applyCustomerAgent, isCustomerAgentAction, seedCustomerAgent, type CustomerAgentAction, type CustomerAgentState } from "./customer-agent";
export { nextDealQuoteId, quoteName, ruleOf } from "./helpers";
export { applyMarketingStudio, isMarketingStudioAction, seedMarketingStudio, type MarketingStudioAction, type MarketingStudioState } from "./marketing-studio";
export {
  applyPatientReactivation,
  isPatientReactivationAction,
  seedPatientReactivation,
  type PatientReactivationAction,
  type PatientReactivationState,
} from "./patient-reactivation";
export { applyQuoting, isQuotingAction, seedGuidedQuote, type GuidedQuoteState, type QuotingAction } from "./quoting";
export {
  applySales,
  isSalesAction,
  seedAiProspecting,
  seedBackOffice,
  seedEmailToDeal,
  seedLeadCapture,
  type AiProspectingState,
  type BackOfficeState,
  type EmailToDealState,
  type LeadCaptureState,
  type SalesAction,
} from "./sales";
export { applySocialAds, isSocialAdsAction, seedSocialAds, type SocialAdsAction, type SocialAdsState } from "./social-ads";
export { applyTickets, getTicketRun, isTicketsAction, seedTickets, type TicketRunState, type TicketsAction, type TicketsState, type TicketTimelineItem } from "./tickets";
export { APPROVERS_REQUIRED, type Action, type ApprovalRuleEdit, type World } from "./types";
