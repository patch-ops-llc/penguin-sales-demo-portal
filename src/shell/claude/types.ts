/**
 * Headless flows: demos that start in a Claude conversation and cut to HubSpot only to show the
 * record that changed. Everything a flow says and shows comes from the pack, so the transcript,
 * the off-platform beats, and the dashboards are data, not code, and cost the shell nothing.
 */

export type FlowDemoId = "agent-campaign" | "agent-deal-follow-up" | "agent-renewal";

/** One scripted turn: what the person types (when they start the turn) and what Claude says and calls. */
export type FlowTurn = {
  /** The message that opens this turn. When absent the turn continues the previous one after an approval. */
  user?: string;
  text: string;
  toolCalls?: { name: string; args: Record<string, unknown> }[];
  /** What Claude says once the tools in this turn have run and, for writes, been approved. */
  done?: string;
};

/** A store action a beat dispatches; `at` is filled in when the beat runs. */
export type FlowBeatAction = { t: string } & Record<string, unknown>;

export type FlowBeatMessage = { from: string; fromEmail: string; to: string; subject: string; body: string; when: string; unread?: boolean };

/**
 * An off-platform beat: an email arriving in a customer's inbox, a reply going back, a form being
 * submitted. A short screen between Claude and HubSpot, not a HubSpot screen.
 */
export type FlowBeat = {
  id: string;
  /** Mail client chrome. */
  app: string;
  address: string;
  mailbox: { name: string; title: string; email: string; initials: string };
  /** What this moment is, for the caption above the window. */
  caption: string;
  messages: FlowBeatMessage[];
  /** A reply the person types back in this beat, shown as a draft the presenter sends. */
  reply?: { subject: string; body: string };
  /** A landing-page form the person submits in this beat. */
  form?: { eyebrow: string; headline: string; fields: { label: string; value: string }[]; submitLabel: string; thanks: string };
  cta: string;
  /** What HubSpot sees once the beat plays. */
  result: string;
  actions: FlowBeatAction[];
};

export type FlowDashboardTile = { label: string; value: string; delta?: string; tone?: "green" | "amber" | "red" | "neutral" };

export type FlowDashboard = {
  id: string;
  title: string;
  subtitle: string;
  owner: string;
  tiles: FlowDashboardTile[];
};

export type FlowConfig = {
  demoId: FlowDemoId;
  /** The person at the keyboard. Not a HubSpot persona: a marketer, a rep, a CSM. */
  actor: { name: string; title: string; initials: string };
  /** The Claude sidebar's chat title for this run. */
  chatTitle: string;
  /** First line in the empty conversation. */
  intro: string;
  turns: FlowTurn[];
  beats: Record<string, FlowBeat>;
};

export type CampaignAttributionRow = { campaign: string; channel: string; period: string; leads: number; deals: number; pipeline: number };
export type DealRisk = { dealId: string; reasons: string[]; score: number };
export type PipelineMovement = { deal: string; change: string; amount: number };
export type RenewalRisk = { dealId: string; health: number; lastContactDays: number; openTickets: number; reasons: string[] };
export type PastTicket = { number: string; company: string; subject: string; resolvedIn: string; resolution: string; keywords: string[] };
export type RenewalRiskMonth = { month: string; renewals: number; atRisk: number; arr: number; openTickets: number; medianResolve: string };

export type FlowsConfig = {
  flows: Partial<Record<FlowDemoId, FlowConfig>>;
  dashboards: Record<string, FlowDashboard>;
  /** What the read tools answer from, on top of the live store. */
  campaignAttribution: CampaignAttributionRow[];
  dealRisks: DealRisk[];
  pipelineMovements: PipelineMovement[];
  renewalRisks: RenewalRisk[];
  pastTickets: PastTicket[];
  renewalRiskByMonth: RenewalRiskMonth[];
};
