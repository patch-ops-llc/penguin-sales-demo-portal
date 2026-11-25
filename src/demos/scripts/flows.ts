import { answerScripted, scriptedTurn } from "@/demos/agent/scripted";
import type { Action } from "@/store/slices/types";
import { askedTurns } from "@/store/slices/agent";
import type { FlowDemoId } from "@/shell/claude/types";
import type { Pack } from "@/verticals/types";
import type { DemoScript, Step, StepCtx } from "./types";

/**
 * The three headless flows. Each step is one turn of the Claude conversation, an approval that
 * lands the write and cuts to the HubSpot record, or a short off-platform beat (an email arriving,
 * a reply, a form) between the two. Next plays the scripted turn through the same tool bridge a
 * live Claude turn uses, so the demo runs the same way with no key at all.
 */

const CLAUDE = () => "/claude";
const asked = (n: number) => ({ w }: StepCtx) => askedTurns(w) >= n;
const campaignPath = ({ w }: StepCtx) => (w.hf.campaigns[0] ? `/campaigns/${w.hf.campaigns[0].id}` : "/campaigns");
const ticketPath = ({ w }: StepCtx) => (w.hf.tickets[0] ? `/support/${w.hf.tickets[0].id}` : "/support");
const ticket = ({ w }: StepCtx) => w.hf.tickets[0];
const reported = ({ w }: StepCtx) => w.hf.reports.length > 0;

/** The actions an off-platform beat dispatches, dated now, plus the mark that it played. */
export function playBeat(pack: Pack, demoId: FlowDemoId, beatId: string, now: number): Action[] {
  const beat = pack.demos.flows?.flows[demoId]?.beats[beatId];
  if (!beat) return [];
  const dated = beat.actions.map((a) => ("at" in a ? { ...a, at: now } : a)) as Action[];
  return [...dated, { t: "hf.beat", id: beatId }];
}

function turn(id: FlowDemoId, n: number, title: string, hint: string, extra: Partial<Step> = {}): Step {
  return { id: `turn-${n}`, title, hint, path: CLAUDE, done: asked(n), script: (c, now) => scriptedTurn(c, now, id), ...extra };
}

function approve(id: FlowDemoId, stepId: string, title: string, hint: string, done: Step["done"], after: Step["after"]): Step {
  return { id: stepId, title, hint, path: CLAUDE, after, done, script: (c, now) => answerScripted(c, true, now, id) };
}

function beat(id: FlowDemoId, beatId: string, title: string, hint: string): Step {
  return {
    id: `beat-${beatId}`,
    title,
    hint,
    path: () => `/beat/${beatId}`,
    // Next plays the beat and stays on it, so the inbox is seen in its sent state before the cut back to Claude.
    after: () => `/beat/${beatId}`,
    done: ({ w }) => w.hf.beats.includes(beatId),
    script: ({ pack }, now) => playBeat(pack, id, beatId, now),
  };
}

export const agentCampaign: DemoScript = {
  id: "agent-campaign",
  steps: [
    turn("agent-campaign", 1, "Ask Claude what worked", "Type to Claude or press Next. Claude reads campaign attribution from HubSpot and ranks the campaigns by pipeline"),
    turn("agent-campaign", 2, "Ask for the campaign", "Claude proposes the segment and the campaign and shows exactly what it will create. Nothing lands until you approve"),
    approve("agent-campaign", "approve-campaign", "Approve: segment and campaign", "Click Approve (or press Next). HubSpot opens on the new campaign, linked to its segment", ({ w }) => w.hf.campaigns.length > 0, campaignPath),
    turn("agent-campaign", 3, "Ask for the drafts", "Back in Claude: the email, the landing page, and two social posts, in brand voice, ready to attach", { done: ({ w }) => askedTurns(w) >= 3 }),
    approve("agent-campaign", "approve-assets", "Approve the drafts", "The four assets land on the campaign as drafts", ({ w }) => (w.hf.campaigns[0]?.assets.length ?? 0) > 0, campaignPath),
    turn("agent-campaign", 4, "Schedule the email", "Tuesday at 9am to the segment. Claude shows the send before it locks it in"),
    approve("agent-campaign", "approve-schedule", "Approve the schedule", "The campaign is scheduled. Next: the email reaches a contact", ({ w }) => w.hf.campaigns[0]?.status === "scheduled" || w.hf.campaigns[0]?.status === "live", undefined),
    beat("agent-campaign", "campaign-inbox", "The email arrives, a form is submitted", "Off platform: Priya Nair at Kestrel Ops opens the email and books a demo. HubSpot logs the click and the form on her record"),
    turn("agent-campaign", 5, "Ask how it is doing", "Claude reads the campaign performance and offers to save it as a report"),
    approve("agent-campaign", "approve-report", "Approve: save the report", "HubSpot opens on the marketing dashboard with the new report", reported, () => "/dashboards/marketing"),
  ],
};

export const agentDealFollowUp: DemoScript = {
  id: "agent-deal-follow-up",
  steps: [
    turn("agent-deal-follow-up", 1, "Ask what to focus on", "Type to Claude or press Next. Claude ranks your open deals and tasks by what needs attention today"),
    turn("agent-deal-follow-up", 2, "Ask for the deal brief", "Marlowe Ridge Health: people, the last conversations, the open task, and the lever"),
    turn("agent-deal-follow-up", 3, "Ask for the follow-up", "Claude drafts the email to Priscilla and proposes a task. Both wait for approval"),
    approve("agent-deal-follow-up", "approve-email", "Approve: send, log, and task", "HubSpot opens on the deal: the email is on the timeline and the task is set", ({ w }) => w.tasks.some((t) => t.isNew), () => "/deals/dl-marlowe"),
    beat("agent-deal-follow-up", "deal-reply", "Priscilla replies", "Off platform: the email lands in her inbox and she agrees to the pricing call. The connected inbox logs the reply on the deal"),
    turn("agent-deal-follow-up", 4, "Tell Claude to move the deal", "Stage, next step, and close date, shown as a diff before anything changes"),
    approve("agent-deal-follow-up", "approve-deal", "Approve the deal update", "HubSpot opens on the deal in Contract Review with the next step and the new close date", ({ w }) => w.deals.find((d) => d.id === "dl-marlowe")?.stage === "negotiation", () => "/deals/dl-marlowe"),
    turn("agent-deal-follow-up", 5, "Ask for pipeline by stage", "Claude reads the team's open pipeline and offers to save the report"),
    approve("agent-deal-follow-up", "approve-report", "Approve: save the report", "HubSpot opens on the sales dashboard with the new report", reported, () => "/dashboards/sales"),
  ],
};

export const agentRenewal: DemoScript = {
  id: "agent-renewal",
  steps: [
    turn("agent-renewal", 1, "Ask which renewals are at risk", "Type to Claude or press Next. Claude scores the next 90 days of renewals from deals, tickets, and conversations", {
      script: (c, now) => [{ t: "persona", id: "nadia" }, ...scriptedTurn({ w: { ...c.w, persona: "nadia" }, pack: c.pack }, now, "agent-renewal")],
    }),
    turn("agent-renewal", 2, "Ask for the account brief", "Ambleforth Credit Union: the renewal, the sponsor, the open tickets, and the quiet"),
    turn("agent-renewal", 3, "Ask for the check-in", "An email to Ingrid, talking points for the call, a task, and a note, all waiting for approval"),
    approve("agent-renewal", "approve-checkin", "Approve: email, task, and note", "HubSpot opens on the company: the email, the task, and the talking points are on the record", ({ w }) => w.tasks.some((t) => t.isNew), () => "/companies/co-ambleforth"),
    beat("agent-renewal", "renewal-reply", "Ingrid replies with a problem", "Off platform: scheduled exports have failed since the 4.12 release. The connected inbox logs the reply on Ambleforth"),
    turn("agent-renewal", 4, "Tell Claude to log the ticket", "Claude drafts a High-priority Service Hub ticket from her reply and waits for approval"),
    approve("agent-renewal", "approve-ticket", "Approve the ticket", "Service Hub opens on the new ticket, linked to Ambleforth and Ingrid", ({ w }) => w.hf.tickets.length > 0, ticketPath),
    turn("agent-renewal", 5, "Ask how it was fixed before", "Claude searches past tickets, proposes the fix, and drafts the reply"),
    approve("agent-renewal", "approve-reply", "Approve the reply", "The reply goes out from the ticket, which moves to waiting on the customer", (c) => ticket(c)?.status === "waiting" || ticket(c)?.status === "closed", undefined),
    beat("agent-renewal", "renewal-fixed", "Ingrid confirms the fix", "Off platform: the exports are back. Service Hub threads her confirmation onto the ticket"),
    turn("agent-renewal", 6, "Tell Claude to close it", "Claude writes the resolution note and waits for approval"),
    approve("agent-renewal", "approve-close", "Approve: close the ticket", "Service Hub opens on the closed ticket with its full timeline", (c) => ticket(c)?.status === "closed", ticketPath),
    turn("agent-renewal", 7, "Ask for renewal risk by month", "Renewals, at-risk ARR, the tickets behind them, and time to resolve. Claude offers to save it"),
    approve("agent-renewal", "approve-report", "Approve: save the report", "HubSpot opens on the customer success dashboard with the new report", reported, () => "/dashboards/service"),
  ],
};
