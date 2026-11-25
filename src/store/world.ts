import type { Pack } from "@/verticals/types";
import {
  applyAgent,
  applyBranchLaunch,
  applyCore,
  applyCustomerAgent,
  applyFlows,
  applyIntake,
  applyMarketingStudio,
  applyPatientReactivation,
  applyQuoting,
  applyRenewals,
  applySales,
  applySocialAds,
  applyTickets,
  isAgentAction,
  isBranchLaunchAction,
  isCustomerAgentAction,
  isFlowsAction,
  isIntakeAction,
  isMarketingStudioAction,
  isPatientReactivationAction,
  isQuotingAction,
  isRenewalsAction,
  isSalesAction,
  isSocialAdsAction,
  isTicketsAction,
  seedAgent,
  seedAiProspecting,
  seedBackOffice,
  seedBranchLaunch,
  seedCustomerAgent,
  seedFlows,
  seedEmailToDeal,
  seedGuidedQuote,
  seedIntake,
  seedLeadCapture,
  seedMarketingStudio,
  seedPatientReactivation,
  seedPqlTrial,
  seedRenewals,
  seedSocialAds,
  seedTickets,
  type Action,
  type World,
} from "./slices";

export {
  APPROVERS_REQUIRED,
  nextDealQuoteId,
  quoteName,
  ruleOf,
  type Action,
  type AgentAction,
  type AgentState,
  type AiProspectingState,
  type ApprovalRuleEdit,
  type BackOfficeState,
  type BranchLaunchAction,
  type BranchLaunchState,
  type CoreAction,
  type CustomerAgentAction,
  type CustomerAgentState,
  type EmailToDealState,
  type GuidedQuoteState,
  type IntakeAction,
  type IntakeDemoState,
  type IntakeState,
  type LeadCaptureState,
  type MarketingStudioAction,
  type MarketingStudioState,
  type PatientReactivationAction,
  type PatientReactivationState,
  type PqlTrialState,
  type QuotingAction,
  type RenewalsAction,
  type RenewalsDemoState,
  type RenewalsState,
  type SalesAction,
  type SocialAdsAction,
  type SocialAdsState,
  type TicketRunState,
  type TicketsAction,
  type TicketsState,
  type TicketTimelineItem,
  type World,
} from "./slices";

export function seedWorld(pack: Pack): World {
  return {
    companies: pack.companies,
    contacts: pack.contacts,
    deals: pack.deals,
    quotes: pack.quotes,
    tasks: pack.tasks,
    notifications: pack.notifications,
    activities: pack.activities,
    threads: pack.threads,
    persona: pack.defaultPersonaId,
    ui: {},
    flags: {},
    gq: seedGuidedQuote(),
    bo: seedBackOffice(),
    lc: seedLeadCapture(),
    ed: seedEmailToDeal(),
    ap: seedAiProspecting(),
    pql: seedPqlTrial(),
    ca: seedCustomerAgent(),
    sa: seedSocialAds(),
    ms: seedMarketingStudio(pack),
    tk: seedTickets(),
    pr: seedPatientReactivation(),
    bl: seedBranchLaunch(),
    intake: seedIntake(pack),
    renewals: seedRenewals(pack),
    ag: seedAgent(),
    hf: seedFlows(),
    approvalRule: {},
    seq: 0,
  };
}

/** Applies one action to a world that is safe to mutate. Deterministic: timestamps come from the action. */
export function mutate(w: World, a: Action, pack: Pack): void {
  if (isQuotingAction(a)) return applyQuoting(w, a, pack);
  if (isSalesAction(a)) return applySales(w, a, pack);
  if (isCustomerAgentAction(a)) return applyCustomerAgent(w, a, pack);
  if (isFlowsAction(a)) return applyFlows(w, a, pack);
  if (isSocialAdsAction(a)) return applySocialAds(w, a, pack);
  if (isMarketingStudioAction(a)) return applyMarketingStudio(w, a, pack);
  if (isTicketsAction(a)) return applyTickets(w, a, pack);
  if (isPatientReactivationAction(a)) return applyPatientReactivation(w, a, pack);
  if (isBranchLaunchAction(a)) return applyBranchLaunch(w, a, pack);
  if (isIntakeAction(a)) return applyIntake(w, a, pack);
  if (isRenewalsAction(a)) return applyRenewals(w, a, pack);
  if (isAgentAction(a)) return applyAgent(w, a);
  return applyCore(w, a, pack);
}

/** Rebuilds the world from the seed and the list of actions. */
export function replay(seed: World, actions: Action[], pack: Pack): World {
  const world = structuredClone(seed);
  for (const action of actions) mutate(world, action, pack);
  return world;
}
