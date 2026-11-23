import type { Activity, ApprovalFilterId, Company, Contact, Deal, InboxThread, Notification, Quote, Task } from "@/verticals/types";
import type { BranchLaunchAction, BranchLaunchState } from "./branch-launch";
import type { CoreAction } from "./core";
import type { CustomerAgentAction, CustomerAgentState } from "./customer-agent";
import type { IntakeAction, IntakeState } from "./intake";
import type { MarketingStudioAction, MarketingStudioState } from "./marketing-studio";
import type { PatientReactivationAction, PatientReactivationState } from "./patient-reactivation";
import type { GuidedQuoteState, QuotingAction } from "./quoting";
import type { RenewalsAction, RenewalsState } from "./renewals";
import type { AiProspectingState, BackOfficeState, EmailToDealState, LeadCaptureState, PqlTrialState, SalesAction } from "./sales";
import type { SocialAdsAction, SocialAdsState } from "./social-ads";
import type { TicketsAction, TicketsState } from "./tickets";

/** What the approval flow can ask of a step's approvers. The first is HubSpot's wording for every approver. */
export const APPROVERS_REQUIRED = ["All approvers", "Any approvers", "Sequential"];

export type ApprovalRuleEdit = {
  thresholdPct?: number;
  filters?: ApprovalFilterId[];
  approverId?: string;
  required?: string;
};

/**
 * The world is everything a rep can change during a session: the seeded records plus demo state.
 * It is always rebuilt as seed + list of actions, so reset is "drop the list" and stepping back
 * is "replay a shorter list". Nothing here is ever sent to the server.
 */
export type World = {
  companies: Company[];
  contacts: Contact[];
  deals: Deal[];
  quotes: Quote[];
  tasks: Task[];
  notifications: Notification[];
  activities: Activity[];
  threads: InboxThread[];
  persona: string;
  /** View state a scripted step may need to set, such as the open tab on a record. */
  ui: Record<string, string>;
  /** One-way markers for "the rep has seen this", used to work out the current step. */
  flags: Record<string, true>;
  gq: GuidedQuoteState;
  bo: BackOfficeState;
  lc: LeadCaptureState;
  ed: EmailToDealState;
  ap: AiProspectingState;
  pql: PqlTrialState;
  ca: CustomerAgentState;
  sa: SocialAdsState;
  ms: MarketingStudioState;
  tk: TicketsState;
  pr: PatientReactivationState;
  bl: BranchLaunchState;
  intake: IntakeState;
  renewals: RenewalsState;
  /** What the rep has changed in the quote approval rule. Parts left unset are the pack's. */
  approvalRule: ApprovalRuleEdit;
  seq: number;
};

export type Action =
  | CoreAction
  | QuotingAction
  | SalesAction
  | CustomerAgentAction
  | SocialAdsAction
  | MarketingStudioAction
  | TicketsAction
  | PatientReactivationAction
  | BranchLaunchAction
  | IntakeAction
  | RenewalsAction;
