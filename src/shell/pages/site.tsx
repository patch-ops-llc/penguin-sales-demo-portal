"use client";

import { nowMs } from "@/lib/format";
import { useShell } from "@/store/store";
import { Icon } from "../icons";
import { A, Button, cx } from "../ui";

function Field({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <label className={cx("block text-[13px]", wide && "col-span-2")}>
      <span className="font-semibold text-[#243447]">{label}</span>
      <input readOnly value={value} className="mt-1 h-10 w-full rounded-[6px] border border-[#c5ced8] bg-white px-3 text-[14px] text-[#243447]" />
    </label>
  );
}

/**
 * The public website's Request a quote form, in a browser frame. It sits outside HubSpot, so it
 * has no HubSpot chrome. The rep picks one of three sample leads; each takes a different route.
 */
export function SitePage() {
  const { pack, world, dispatch } = useShell();
  const config = pack.demos.leadCapture;
  const submitted = world.lc;
  const presetId = submitted?.presetId ?? world.ui["lc.preset"] ?? config.scriptedPresetId;
  const preset = config.presets.find((p) => p.id === presetId) ?? config.presets[0];
  const form = preset.form;
  const owner = pack.personas.find((p) => p.id === preset.route.ownerId);

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
              <span>Products</span>
              <span>Industries</span>
              <span>Support</span>
              <span className="font-semibold text-white">Request a quote</span>
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
                  <p className="mt-2 text-[14px] text-[#4a5b6c]">Your request is in. {owner ? "An engineer in your region will reply within one business day." : "We will be in touch with resources that fit your project."}</p>
                  <div className="mt-5 rounded-[8px] border border-line-soft bg-[#fafafa] p-4 text-ink">
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">Meanwhile, in HubSpot</p>
                    <ul className="mt-2 space-y-1.5 text-[13px]">
                      {[
                        `Contact created: ${form.firstName} ${form.lastName}`,
                        `Company enriched: ${preset.company.industry}, ${preset.company.employees.toLocaleString("en-US")} employees`,
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
                    <Field label="I am interested in" value={form.interest} />
                    <label className="col-span-2 block text-[13px]">
                      <span className="font-semibold text-[#243447]">Tell us about your application</span>
                      <textarea readOnly value={form.message} rows={3} className="mt-1 w-full resize-none rounded-[6px] border border-[#c5ced8] bg-white px-3 py-2 text-[14px] text-[#243447]" />
                    </label>
                  </div>
                  <Button type="submit" variant="dark" className="mt-4 w-full !bg-[#16324a] hover:!bg-[#0f2436]" data-testid="lc-submit">
                    Submit request
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
