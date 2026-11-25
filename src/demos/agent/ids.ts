/**
 * The agent-run demos and the clicked demo each one drives. Kept apart from the catalog so the
 * shell can ask "is this an agent demo, and of what" without pulling the tool bridge into a chunk
 * that does not need it.
 */
export const AGENT_BASE_DEMO = {
  "agent-guided-quote": "guided-quote",
  "agent-complaint-sla": "complaint-sla",
  "agent-loan-pipeline": "loan-application-pipeline",
} as const;

export type AgentDemoId = keyof typeof AGENT_BASE_DEMO;

export function isAgentDemo(id: string | null | undefined): id is AgentDemoId {
  return typeof id === "string" && id in AGENT_BASE_DEMO;
}

/** The clicked demo an agent demo runs, or the id itself when it is not an agent demo. */
export function baseDemoOf(id: string): string {
  return isAgentDemo(id) ? AGENT_BASE_DEMO[id] : id;
}
