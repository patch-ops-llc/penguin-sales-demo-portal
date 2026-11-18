"use client";

import { useSeen, useShell } from "@/store/store";
import type { WorkflowNode } from "@/verticals/types";
import { Ext } from "../ext";
import { num } from "../format";
import { Icon } from "../icons";
import { A, Card, cx, Empty, statusTone, Tag } from "../ui";

function Node({ node, lit }: { node: WorkflowNode; lit: boolean }) {
  const box = (
    <div className={cx("w-[250px] rounded-[8px] border bg-white px-3 py-2.5 text-left", lit ? "border-hs-orange shadow-[0_0_0_2px_rgba(255,72,0,0.18)]" : "border-line")} data-testid={`wf-node-${node.id}`} data-lit={lit}>
      <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink-muted">
        <Icon name={node.kind === "trigger" ? "form" : node.kind === "branch" ? "workflow" : "check"} size={12} />
        {node.kind === "trigger" ? "Trigger" : node.kind === "branch" ? "Branch" : "Action"}
      </p>
      <p className="mt-0.5 text-[13px] font-semibold leading-snug">{node.label}</p>
      {node.detail ? <p className="mt-0.5 text-[12px] leading-snug text-ink-muted">{node.detail}</p> : null}
    </div>
  );
  return node.extId ? (
    <Ext id={node.extId} pinClass="!right-2">
      {box}
    </Ext>
  ) : (
    box
  );
}

function Connector({ lit }: { lit: boolean }) {
  return <span className={cx("mx-auto block h-5 w-0.5", lit ? "bg-hs-orange" : "bg-[#c2c2c2]")} aria-hidden="true" />;
}

/** A read-only picture of a workflow, with the path the demo's record took lit up. */
export function WorkflowPage({ id }: { id: string }) {
  const { pack, world } = useShell();
  const workflow = pack.workflows.find((w) => w.id === id);
  const config = pack.demos.leadCapture;
  const lead = id === config.workflowId ? world.lc : null;
  useSeen("lc.workflow", Boolean(lead && world.flags["lc.contact"]));
  if (!workflow?.trunk) {
    return (
      <div className="p-10">
        <Card>
          <Empty title="This workflow is not part of the demo">
            <A to="/workflows" className="hs-link">
              Go to all workflows
            </A>
          </Empty>
        </Card>
      </div>
    );
  }
  const preset = lead ? config.presets.find((p) => p.id === lead.presetId) : undefined;
  const contact = lead ? world.contacts.find((c) => c.id === lead.contactId) : undefined;
  const lit = Boolean(preset);

  return (
    <div className="min-h-full" data-testid="workflow-page">
      <header className="flex items-center justify-between border-b border-line bg-white px-6 py-3.5">
        <div>
          <A to="/workflows" className="inline-flex items-center gap-1 text-[13px] font-semibold text-link hover:underline">
            <Icon name="chevronLeft" size={14} /> Workflows
          </A>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-[19px] font-semibold">{workflow.name}</h1>
            <Tag tone={statusTone(workflow.status)}>Workflow is {workflow.status.toLowerCase()}</Tag>
          </div>
          <p className="mt-0.5 text-[12.5px] text-ink-muted">
            {workflow.object}-based · {num(workflow.enrolled + (lead ? 1 : 0))} enrolled · {workflow.description}
          </p>
        </div>
        <Tag>Read-only view</Tag>
      </header>

      {preset && contact ? (
        <p className="mx-6 mt-4 flex items-center gap-2 rounded-[8px] border border-[#ffc9ae] bg-[#fff4ee] px-4 py-2.5 text-[13.5px]" data-testid="wf-path-banner">
          <span className="h-2.5 w-2.5 rounded-full bg-hs-orange" />
          <span>
            Showing the path{" "}
            <A to={`/contacts/${contact.id}`} className="hs-link">
              {contact.firstName} {contact.lastName}
            </A>{" "}
            took. {preset.route.summary}.
          </span>
        </p>
      ) : null}

      <div className="hs-scroll overflow-x-auto px-6 py-6">
        <div className="mx-auto flex w-max flex-col items-center">
          {workflow.trunk.map((node, i) => (
            <div key={node.id} className="flex flex-col items-center">
              {i > 0 ? <Connector lit={lit} /> : null}
              <Node node={node} lit={lit} />
            </div>
          ))}
          <Connector lit={lit} />
          <div className="flex items-start gap-5 border-t-2 border-[#c2c2c2] pt-0">
            {(workflow.branches ?? []).map((branch) => {
              const on = preset?.route.branchId === branch.id;
              return (
                <div key={branch.id} className="flex flex-col items-center" data-testid={`wf-branch-${branch.id}`} data-lit={on}>
                  <Connector lit={on} />
                  <div className={cx("mb-0 w-[250px] rounded-[8px] px-3 py-2 text-center", on ? "bg-hs-orange text-white" : "bg-[#e4e4e4]")}>
                    <p className="text-[13px] font-semibold">{branch.label}</p>
                    <p className={cx("text-[11.5px]", on ? "text-white/85" : "text-ink-muted")}>{branch.rule}</p>
                  </div>
                  {branch.nodes.map((node) => (
                    <div key={node.id} className={cx("flex flex-col items-center", !on && lit && "opacity-55")}>
                      <Connector lit={on} />
                      <Node node={node} lit={on} />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
