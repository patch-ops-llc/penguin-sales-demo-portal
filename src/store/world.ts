import type { Pack } from "@/verticals/types";
import {
  applyCore,
  applyCustomerAgent,
  applyMarketingStudio,
  applyQuoting,
  applySales,
  applySocialAds,
  isCustomerAgentAction,
  isMarketingStudioAction,
  isQuotingAction,
  isSalesAction,
  isSocialAdsAction,
  seedAiProspecting,
  seedBackOffice,
  seedCustomerAgent,
  seedEmailToDeal,
  seedGuidedQuote,
  seedLeadCapture,
  seedMarketingStudio,
  seedSocialAds,
  type Action,
  type World,
} from "./slices";

export {
  APPROVERS_REQUIRED,
  nextDealQuoteId,
  quoteName,
  ruleOf,
  type Action,
  type AiProspectingState,
  type ApprovalRuleEdit,
  type BackOfficeState,
  type CoreAction,
  type CustomerAgentAction,
  type CustomerAgentState,
  type EmailToDealState,
  type GuidedQuoteState,
  type LeadCaptureState,
  type MarketingStudioAction,
  type MarketingStudioState,
  type QuotingAction,
  type SalesAction,
  type SocialAdsAction,
  type SocialAdsState,
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
    ca: seedCustomerAgent(),
    sa: seedSocialAds(),
    ms: seedMarketingStudio(pack),
    approvalRule: {},
    seq: 0,
  };
}

/** Applies one action to a world that is safe to mutate. Deterministic: timestamps come from the action. */
export function mutate(w: World, a: Action, pack: Pack): void {
  if (isQuotingAction(a)) return applyQuoting(w, a, pack);
  if (isSalesAction(a)) return applySales(w, a, pack);
  if (isCustomerAgentAction(a)) return applyCustomerAgent(w, a, pack);
  if (isSocialAdsAction(a)) return applySocialAds(w, a, pack);
  if (isMarketingStudioAction(a)) return applyMarketingStudio(w, a, pack);
  return applyCore(w, a, pack);
}

/** Rebuilds the world from the seed and the list of actions. */
export function replay(seed: World, actions: Action[], pack: Pack): World {
  const world = structuredClone(seed);
  for (const action of actions) mutate(world, action, pack);
  return world;
}
