"use client";

import { nowMs } from "@/lib/format";
import { useShell } from "@/store/store";
import { money } from "../format";
import { Icon } from "../icons";
import { A, Button, Card, cx, Prop, Tag, type Tone } from "../ui";

function Field({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <label className={cx("block text-[13px]", wide && "col-span-2")}>
      <span className="font-semibold text-[#243447]">{label}</span>
      <input readOnly value={value} className="mt-1 h-10 w-full rounded-[6px] border border-[#c5ced8] bg-white px-3 text-[14px] text-[#243447]" />
    </label>
  );
}

const SEVERITY_TONE: Record<"Critical" | "High" | "Medium", Tone> = {
  Critical: "red",
  High: "orange",
  Medium: "amber",
};

/**
 * Off-platform prospect email inbox showing the security assessment findings report and
 * direct handoff into a HubSpot proposal quote (IT Services #6). Native HubSpot email + quote — ZERO Penguin markers.
 */
function AssessmentFindingsPage() {
  const { pack, world, dispatch, navigate } = useShell();
  const followUp = pack.demos.leadCapture.assessmentFollowUp;
  if (!followUp) return null;

  const presetId = world.lc?.presetId ?? pack.demos.leadCapture.scriptedPresetId;
  const preset = pack.demos.leadCapture.presets.find((p) => p.id === presetId) ?? pack.demos.leadCapture.presets[0];
  const findingsSent = Boolean(world.lc?.findingsSent);
  const proposalQuoteId = world.lc?.proposalQuoteId ?? null;

  const lineSummary = followUp.proposalLines
    .map((pl) => {
      const p = pack.products.find((x) => x.sku === pl.sku);
      if (!p) return null;
      const unitPrice = pl.unitPrice ?? p.price;
      return { sku: p.sku, name: p.name, qty: pl.qty, unitPrice, total: pl.qty * unitPrice, note: pl.note };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
  const proposalTotal = lineSummary.reduce((sum, item) => sum + item.total, 0);

  const sendFindings = () => {
    dispatch({ t: "lc.sendFindings", at: nowMs() });
  };

  const createProposal = () => {
    dispatch({ t: "lc.createProposal", at: nowMs() });
    navigate("/quotes/q-lead-proposal");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#dfe3e8] p-3.5" data-testid="lc-findings-page">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 text-[12.5px]">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-[11.5px] font-semibold text-white">
            <Icon name="external" size={12} /> Off-platform &middot; {followUp.channelLabel}
          </span>
          <span className="text-ink-muted">Assessment findings emailed to prospect and synced to HubSpot timeline.</span>
        </div>
        <div className="flex items-center gap-2">
          {proposalQuoteId ? (
            <Button variant="primary" size="sm" data-testid="lc-open-proposal-top" onClick={() => navigate(`/quotes/${proposalQuoteId}`)}>
              Open proposal quote <Icon name="arrowRight" size={14} />
            </Button>
          ) : null}
          <A
            to="/tasks"
            data-testid="lc-findings-back"
            className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-ink bg-white px-3 text-[12.5px] font-semibold text-ink hover:bg-[#f5f5f5]"
          >
            <Icon name="arrowLeft" size={13} /> Return to HubSpot
          </A>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] border border-[#b8c0cc] bg-white shadow-[0_12px_36px_rgba(15,23,42,0.14)]">
        <div className="flex items-center gap-3 border-b border-[#e2e8f0] bg-[#f1f5f9] px-4 py-2">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </span>
          <span className="text-[12px] font-semibold text-[#475569]">{followUp.windowTitle}</span>
          <span className="flex h-7 flex-1 items-center gap-2 truncate rounded-full bg-white px-3 text-[12px] text-[#64748b] ring-1 ring-[#cbd5e1]">
            <Icon name="lock" size={11} className="shrink-0" />
            <span className="truncate">{followUp.inboxAddress}</span>
          </span>
        </div>

        <div className="hs-scroll min-h-0 flex-1 overflow-y-auto bg-[#f6f8fa] px-6 py-6">
          <div className="mx-auto grid max-w-[1100px] gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Card testId="lc-findings-email-card">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft pb-3">
                <div>
                  <p className="text-[11.5px] font-semibold uppercase tracking-wide text-link">Security Assessment Findings Email</p>
                  <h1 className="mt-0.5 text-[18px] font-bold text-ink">{followUp.emailSubject}</h1>
                </div>
                <Tag tone={findingsSent ? "green" : "amber"}>{findingsSent ? "Delivered & Logged" : "Ready to Send"}</Tag>
              </div>

              <dl className="mt-3 grid gap-2 text-[12.5px] sm:grid-cols-2">
                <Prop label="From">
                  {followUp.senderName} ({followUp.senderEmail})
                </Prop>
                <Prop label="To">
                  {preset.form.firstName} {preset.form.lastName} ({preset.form.email})
                </Prop>
              </dl>

              <div className="mt-3 whitespace-pre-line rounded-[8px] border border-line-soft bg-[#fafafa] p-4 text-[13.5px] leading-relaxed text-ink">
                {followUp.emailBody}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-[#cde0ee] bg-[#f4f9fc] px-3.5 py-2.5 text-[12.5px]">
                <span className="flex items-center gap-2 font-semibold text-ink">
                  <Icon name="paperclip" size={14} className="text-link" />
                  {followUp.attachmentName}
                </span>
                <span className="text-ink-muted">{followUp.attachmentMeta}</span>
              </div>

              <div className="mt-4 space-y-2.5">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">Key Assessment Findings ({followUp.findings.length})</p>
                {followUp.findings.map((finding) => (
                  <div key={finding.id} className="rounded-[8px] border border-line-soft bg-white p-3" data-testid={`lc-finding-${finding.id}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[13.5px] font-semibold text-ink">{finding.title}</span>
                      <Tag tone={SEVERITY_TONE[finding.severity]}>{finding.severity} Risk</Tag>
                    </div>
                    <p className="mt-1 text-[12.5px] text-ink-muted">{finding.detail}</p>
                    <p className="mt-1 text-[12px] font-medium text-[#0b5b2b]">Recommended: {finding.remediation}</p>
                  </div>
                ))}
              </div>
            </Card>

            <div className="space-y-4">
              <Card title="Assessment Call Summary" right={<Tag tone="teal">Completed</Tag>} testId="lc-call-summary-card">
                <p className="text-[13px] font-semibold text-ink">{followUp.callSummaryTitle}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">{followUp.callSummaryBody}</p>
              </Card>

              <Card title="Proposal Scope from Findings" right={<Tag tone="blue">{money(proposalTotal)}</Tag>} testId="lc-proposal-handoff-card">
                <p className="text-[12.5px] text-ink-muted">
                  Remediation lines mapped directly to Quillon&apos;s HubSpot product library.
                </p>
                <ul className="mt-3 divide-y divide-line-soft text-[12.5px]">
                  {lineSummary.map((item) => (
                    <li key={item.sku} className="py-2 first:pt-0 last:pb-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-semibold text-ink">{item.name}</span>
                        <span className="shrink-0 font-semibold tabular-nums">{money(item.total)}</span>
                      </div>
                      <p className="mt-0.5 text-[11.5px] text-ink-muted">
                        Qty {item.qty} &times; {money(item.unitPrice)}
                        {item.note ? ` · ${item.note}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 space-y-2 border-t border-line-soft pt-3">
                  {!findingsSent ? (
                    <Button variant="primary" className="w-full" icon="send" onClick={sendFindings} data-testid="lc-send-findings">
                      Send findings report to {preset.form.firstName}
                    </Button>
                  ) : !proposalQuoteId ? (
                    <>
                      <div className="rounded-[8px] border border-[#bfe3cd] bg-[#f2fbf5] px-3 py-2 text-[12.5px] font-medium text-[#0b5b2b]" data-testid="lc-findings-sent-banner">
                        Findings email delivered and logged on {preset.form.company}&apos;s HubSpot timeline.
                      </div>
                      <Button variant="primary" className="w-full" onClick={createProposal} data-testid="lc-create-proposal">
                        Create proposal quote from findings <Icon name="arrowRight" size={14} />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="rounded-[8px] border border-[#bfe3cd] bg-[#f2fbf5] px-3 py-2 text-[12.5px] font-medium text-[#0b5b2b]" data-testid="lc-proposal-created-banner">
                        Proposal quote created in HubSpot and linked to the deal.
                      </div>
                      <Button variant="primary" className="w-full" onClick={() => navigate(`/quotes/${proposalQuoteId}`)} data-testid="lc-view-proposal">
                        Open proposal quote <Icon name="arrowRight" size={14} />
                      </Button>
                      <Button variant="secondary" className="w-full" onClick={() => navigate(`/reports/${followUp.reportId}`)} data-testid="lc-open-funnel-report">
                        {followUp.reportLabel}
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The public website's Request a quote form, in a browser frame. It sits outside HubSpot, so it
 * has no HubSpot chrome. The rep picks one of three sample leads; each takes a different route.
 */
export function SitePage({ id }: { id?: string }) {
  const { pack, world, dispatch } = useShell();
  if (id === "findings" && pack.demos.leadCapture.assessmentFollowUp) {
    return <AssessmentFindingsPage />;
  }
  const config = pack.demos.leadCapture;
  const submitted = world.lc;
  const presetId = submitted?.presetId ?? world.ui["lc.preset"] ?? config.scriptedPresetId;
  const preset = config.presets.find((p) => p.id === presetId) ?? config.presets[0];
  const form = preset.form;
  const owner = pack.personas.find((p) => p.id === preset.route.ownerId);
  const site = config.site;
  const nav = site.nav ?? ["Products", "Industries", "Support", "Request a quote"];
  const thanks = site.thanks ?? { routed: "An engineer in your region will reply within one business day.", nurture: "We will be in touch with resources that fit your project." };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#d9d9d9] p-4" data-testid="site-page">
      <div className="mb-3 flex items-center gap-2 text-[12.5px]">
        <span className="font-semibold text-ink-muted">Sample lead:</span>
        {config.presets.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={Boolean(submitted)}
            onClick={() => dispatch({ t: "ui", k: "lc.preset", v: p.id })}
            aria-pressed={p.id === preset.id}
            data-testid={`lc-preset-${p.id}`}
            className={cx("rounded-full border px-3 py-1 text-left", p.id === preset.id ? "border-ink bg-ink font-semibold text-white" : "border-[#b5b5b5] bg-white hover:border-ink disabled:opacity-50")}
          >
            {p.label} <span className={p.id === preset.id ? "text-white/70" : "text-ink-muted"}>· {p.outcome}</span>
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[10px] border border-[#bdbdbd] bg-white shadow-lg">
        <div className="flex items-center gap-3 border-b border-line bg-[#f1f1f1] px-4 py-2">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </span>
          <span className="flex h-7 flex-1 items-center gap-2 rounded-full bg-white px-3 text-[12.5px] text-ink-muted ring-1 ring-line-soft">
            <Icon name="lock" size={12} /> {config.site.url}
          </span>
        </div>

        <div className="hs-scroll min-h-0 flex-1 overflow-y-auto bg-[#f4f7fa]">
          <div className="flex items-center justify-between bg-[#16324a] px-10 py-4 text-white">
            <p className="text-[18px] font-bold tracking-tight">{config.site.company}</p>
            <p className="flex gap-6 text-[13px] text-white/75">
              {nav.map((item, i) => (
                <span key={item} className={i === nav.length - 1 ? "font-semibold text-white" : undefined}>
                  {item}
                </span>
              ))}
            </p>
          </div>

          <div className="mx-auto grid max-w-[980px] grid-cols-[1fr_520px] gap-10 px-10 py-10">
            <div>
              <h1 className="text-[34px] font-bold leading-tight tracking-tight text-[#16324a]">{config.site.headline}</h1>
              <p className="mt-3 text-[15px] leading-relaxed text-[#4a5b6c]">{config.site.sub}</p>
              <ul className="mt-6 space-y-2 text-[14px] text-[#243447]">
                {config.site.interests.map((interest) => (
                  <li key={interest} className="flex items-center gap-2">
                    <Icon name="check" size={15} className="text-[#1a7f5a]" /> {interest}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[12px] border border-[#d5dde5] bg-white p-6 shadow-[0_6px_24px_rgba(22,50,74,0.08)]">
              {submitted ? (
                <div className="hs-pop" data-testid="lc-submitted">
                  <p className="flex items-center gap-2 text-[18px] font-bold text-[#16324a]">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#1a7f5a] text-white">
                      <Icon name="check" size={16} strokeWidth={2.4} />
                    </span>
                    Thanks, {form.firstName}.
                  </p>
                  <p className="mt-2 text-[14px] text-[#4a5b6c]">Your request is in. {owner ? thanks.routed : thanks.nurture}</p>
                  <div className="mt-5 rounded-[8px] border border-line-soft bg-[#fafafa] p-4 text-ink">
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">Meanwhile, in HubSpot</p>
                    <ul className="mt-2 space-y-1.5 text-[13px]">
                      {[
                        `Contact created: ${form.firstName} ${form.lastName}`,
                        `Company enriched: ${preset.company.industry}, ${preset.company.employees.toLocaleString("en-US")} employees${(preset.company.extra ?? []).map((e) => `, ${e.label.toLowerCase()} ${e.value}`).join("")}`,
                        `Lead score set to ${preset.score}`,
                        preset.route.summary,
                        ...(preset.task ? [`Task created: ${preset.task.title}`] : []),
                        ...(preset.alert ? [`Alert posted in Slack, ${preset.alert.channel}`] : []),
                      ].map((line) => (
                        <li key={line} className="flex gap-2">
                          <Icon name="check" size={14} className="mt-0.5 shrink-0 text-[#0b5b2b]" /> {line}
                        </li>
                      ))}
                    </ul>
                    <A to="/contacts" className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-[6px] bg-hs-orange px-4 text-[13.5px] font-semibold text-white hover:bg-hs-orange-strong" data-testid="lc-go-hubspot">
                      Go to HubSpot <Icon name="arrowRight" size={15} />
                    </A>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    dispatch({ t: "lc.submit", presetId: preset.id, at: nowMs() });
                  }}
                  data-testid="lc-form"
                >
                  <h2 className="text-[18px] font-bold text-[#16324a]">{config.site.formTitle}</h2>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <Field label="First name" value={form.firstName} />
                    <Field label="Last name" value={form.lastName} />
                    <Field label="Work email" value={form.email} wide />
                    <Field label="Company" value={form.company} />
                    <Field label="Job title" value={form.title} />
                    <Field label="Phone" value={form.phone} />
                    <Field label={site.interestLabel ?? "I am interested in"} value={form.interest} />
                    <label className="col-span-2 block text-[13px]">
                      <span className="font-semibold text-[#243447]">{site.messageLabel ?? "Tell us about your application"}</span>
                      <textarea readOnly value={form.message} rows={3} className="mt-1 w-full resize-none rounded-[6px] border border-[#c5ced8] bg-white px-3 py-2 text-[14px] text-[#243447]" />
                    </label>
                    {site.consent ? (
                      <label className="col-span-2 flex items-start gap-2 text-[12.5px] text-[#243447]" data-testid="lc-consent">
                        <input type="checkbox" checked readOnly className="mt-0.5 h-4 w-4 accent-[#16324a]" />
                        <span>{site.consent}</span>
                      </label>
                    ) : null}
                  </div>
                  <Button type="submit" variant="dark" className="mt-4 w-full !bg-[#16324a] hover:!bg-[#0f2436]" data-testid="lc-submit">
                    {site.submit ?? "Submit request"}
                  </Button>
                  <p className="mt-2 text-center text-[11.5px] text-[#6b7a89]">The form is filled from the sample lead chosen above.</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
