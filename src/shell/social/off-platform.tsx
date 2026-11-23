"use client";

import { useState } from "react";
import { nowMs } from "@/lib/format";
import { useShell } from "@/store/store";
import { Icon } from "../icons";
import { A, Avatar, Button, cx } from "../ui";

/**
 * Shared off-platform browser frame for Steps 5, 6, 7, and 8.
 * Makes it unmistakable that these screens happen outside HubSpot while keeping
 * an obvious one-click path back into HubSpot.
 */
function OffPlatformFrame({
  channelLabel,
  url,
  backTo,
  backLabel = "Return to HubSpot",
  action,
  testId,
  children,
}: {
  channelLabel: string;
  url: string;
  backTo: string;
  backLabel?: string;
  action?: React.ReactNode;
  testId: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#d9d9d9] p-3.5" data-testid={testId}>
      <div className="mb-2.5 flex items-center justify-between gap-3 text-[12.5px]">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-[11.5px] font-semibold text-white">
            <Icon name="globe" size={12} /> Off-platform &middot; {channelLabel}
          </span>
          <span className="text-ink-muted">Happens outside HubSpot, tracked back to your campaign.</span>
        </div>
        <div className="flex items-center gap-2">
          {action}
          <A
            to={backTo}
            data-testid="offplatform-back-hubspot"
            className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-ink bg-white px-3 text-[12.5px] font-semibold text-ink hover:bg-[#f5f5f5]"
          >
            <Icon name="arrowLeft" size={13} /> {backLabel}
          </A>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[10px] border border-[#bdbdbd] bg-white shadow-lg">
        <div className="flex items-center gap-3 border-b border-line bg-[#f1f1f1] px-4 py-2">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </span>
          <span className="flex h-7 flex-1 items-center gap-2 truncate rounded-full bg-white px-3 text-[12.5px] text-ink-muted ring-1 ring-line-soft">
            <Icon name="lock" size={12} className="shrink-0" />
            <span className="truncate">{url}</span>
          </span>
        </div>
        <div className="hs-scroll min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/** Step 5 (Off-platform): Simulated Google Search results page with Sponsored paid search ad. */
export function GoogleSearchAdPage() {
  const { pack, dispatch, navigate } = useShell();
  const cfg = pack.demos.socialAds;
  if (!cfg) return null;
  const g = cfg.googleAd;

  const continueToFeed = () => {
    dispatch({ t: "sa.seenGoogle" });
    navigate("/offplatform/social-feed");
  };

  return (
    <OffPlatformFrame
      channelLabel="Google Search"
      url={`https://www.google.com/search?q=${encodeURIComponent(g.query)}`}
      backTo="/social/calendar"
      testId="offplatform-google"
      action={
        <Button variant="primary" size="sm" onClick={continueToFeed} data-testid="google-to-feed">
          See ad in social feed <Icon name="arrowRight" size={14} />
        </Button>
      }
    >
      <div className="min-h-full bg-white">
        <div className="border-b border-[#ebebeb] px-10 pb-3 pt-5">
          <div className="flex items-center gap-7">
            <span className="select-none text-[26px] font-bold tracking-tight" aria-label="Google">
              <span className="text-[#4285f4]">G</span>
              <span className="text-[#ea4335]">o</span>
              <span className="text-[#fbbc05]">o</span>
              <span className="text-[#4285f4]">g</span>
              <span className="text-[#34a853]">l</span>
              <span className="text-[#ea4335]">e</span>
            </span>
            <div className="flex h-11 flex-1 max-w-[640px] items-center justify-between rounded-full border border-[#dfe1e5] bg-white px-5 shadow-[0_1px_6px_rgba(32,33,36,0.12)]">
              <span className="text-[15px] text-[#202124]">{g.query}</span>
              <Icon name="search" size={18} className="text-[#4285f4]" />
            </div>
          </div>
          <div className="mt-3.5 flex gap-6 pl-[116px] text-[13px] text-[#5f6368]">
            <span className="border-b-[3px] border-[#1a73e8] pb-2 font-semibold text-[#1a73e8]">All</span>
            <span>News</span>
            <span>Maps</span>
            <span>Videos</span>
          </div>
        </div>

        <div className="max-w-[780px] py-5 pl-[126px] pr-8">
          <p className="text-[12.5px] text-[#70757a]">About 1,420,000 results (0.34 seconds)</p>

          <article
            className="mt-4 rounded-[12px] border border-[#dce6f7] bg-[#f8fbff] p-4 shadow-[0_2px_10px_rgba(26,115,232,0.08)]"
            data-testid="google-sponsored-ad"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-bold text-[#202124]">Sponsored</span>
              <span className="rounded-full bg-[#e8f0fe] px-2.5 py-0.5 text-[11px] font-semibold text-[#1967d2]">
                HubSpot Google Ads Campaign &middot; Tracked
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2.5">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#0f3d56] text-[11px] font-bold text-white">CC</span>
              <div className="leading-tight">
                <p className="text-[13.5px] text-[#202124]">{g.sponsored.domain}</p>
                <p className="text-[12px] text-[#4d5156]">{g.sponsored.displayUrl}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={continueToFeed}
              data-testid="google-ad-headline"
              className="mt-2 block text-left text-[20px] font-medium text-[#1a0dab] hover:underline"
            >
              {g.sponsored.headline}
            </button>
            <p className="mt-1 text-[13.5px] leading-relaxed text-[#4d5156]">{g.sponsored.description}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-[12px] text-[#5f6368]">
              {g.sponsored.callouts.map((c) => (
                <span key={c} className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 ring-1 ring-[#dfe1e5]">
                  <Icon name="check" size={12} className="text-[#137333]" /> {c}
                </span>
              ))}
            </div>
            <div className="mt-3.5 grid grid-cols-2 gap-x-6 gap-y-2.5 border-t border-[#e1eaf8] pt-3">
              {g.sponsored.sitelinks.map((s) => (
                <button key={s.title} type="button" onClick={continueToFeed} className="text-left group">
                  <p className="text-[14px] font-medium text-[#1a0dab] group-hover:underline">{s.title}</p>
                  <p className="text-[12px] text-[#4d5156]">{s.detail}</p>
                </button>
              ))}
            </div>
          </article>

          <div className="mt-6 space-y-5">
            {g.organicResults.map((res) => (
              <article key={res.url}>
                <p className="text-[12.5px] text-[#202124]">
                  {res.siteName} <span className="text-[#4d5156]">&middot; {res.url}</span>
                </p>
                <p className="mt-0.5 text-[18px] font-medium text-[#1a0dab]">{res.title}</p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-[#4d5156]">{res.snippet}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </OffPlatformFrame>
  );
}

/** Step 6 (Off-platform): Simulated LinkedIn feed with Crestline's organic post and Sponsored paid social ad. */
export function SocialFeedPage() {
  const { pack, dispatch, navigate } = useShell();
  const [likedOrganic, setLikedOrganic] = useState(false);
  const cfg = pack.demos.socialAds;
  if (!cfg) return null;
  const f = cfg.socialFeed;

  const clickPaidAd = () => {
    dispatch({ t: "sa.clickSocialAd" });
    navigate("/offplatform/landing-page");
  };

  return (
    <OffPlatformFrame
      channelLabel="LinkedIn Social Feed"
      url="https://www.linkedin.com/feed/"
      backTo="/social/calendar"
      testId="offplatform-social-feed"
      action={
        <Button variant="primary" size="sm" onClick={clickPaidAd} data-testid="feed-to-landing">
          Click ad &rarr; Landing page <Icon name="arrowRight" size={14} />
        </Button>
      }
    >
      <div className="min-h-full bg-[#f4f2ee]">
        <div className="border-b border-[#e0dfdc] bg-white px-8 py-2.5">
          <div className="mx-auto flex max-w-[1040px] items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-[5px] bg-[#0a66c2] text-[16px] font-bold text-white">in</span>
              <div className="flex h-8 w-[280px] items-center gap-2 rounded-[4px] bg-[#edf3f8] px-3 text-[12.5px] text-[#5e6a75]">
                <Icon name="search" size={14} /> Search healthcare staffing, ICU RN...
              </div>
            </div>
            <div className="flex items-center gap-5 text-[12px] font-medium text-[#666]">
              <span className="font-semibold text-[#191919]">Home</span>
              <span>My Network</span>
              <span>Jobs</span>
              <span>Messaging</span>
              <span className="flex items-center gap-2 border-l border-[#e0dfdc] pl-4 text-[#191919]">
                <Avatar name={f.viewer.name} color="#2f7f80" size={26} />
                <span className="font-semibold">{f.viewer.name}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-[1040px] grid-cols-[240px_minmax(0,1fr)_240px] gap-5 px-6 py-5">
          <aside className="space-y-3">
            <div className="overflow-hidden rounded-[10px] border border-[#e0dfdc] bg-white">
              <div className="h-14 bg-gradient-to-r from-[#0f3d56] to-[#2f7f80]" />
              <div className="-mt-6 px-4 pb-4">
                <Avatar name={f.viewer.name} color="#2f7f80" size={48} />
                <p className="mt-2 text-[15px] font-bold text-[#191919]">{f.viewer.name}</p>
                <p className="text-[12.5px] leading-snug text-[#666]">
                  {f.viewer.title} at {f.viewer.organization}
                </p>
                <p className="mt-1 text-[11.5px] text-[#888]">{f.viewer.location}</p>
                <div className="mt-3 rounded-[6px] bg-[#f4f7fa] p-2.5 text-[11.5px] font-medium text-[#0f3d56]">
                  {f.viewer.openReqNote}
                </div>
              </div>
            </div>
          </aside>

          <div className="space-y-4">
            {/* 1. Paid Social Ad — primary conversion path */}
            <article className="overflow-hidden rounded-[10px] border-2 border-[#0a66c2]/30 bg-white shadow-sm" data-testid="social-paid-ad">
              <div className="flex items-center justify-between px-4 pt-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-[6px] bg-[#0f3d56] text-[13px] font-bold text-white">CC</span>
                  <div>
                    <p className="text-[14px] font-bold text-[#191919]">{f.paidAd.author}</p>
                    <p className="text-[12px] text-[#666]">{f.paidAd.sponsorLabel} &middot; Paid Social Ad</p>
                  </div>
                </div>
                <span className="rounded-full bg-[#e8f3ff] px-2.5 py-0.5 text-[11px] font-semibold text-[#0a66c2]">Targeted to Nursing Leaders</span>
              </div>
              <p className="px-4 py-3 text-[13.5px] leading-relaxed text-[#191919]">{f.paidAd.intro}</p>
              <div className="mx-4 overflow-hidden rounded-[8px] border border-[#dce6f0]">
                <div className="bg-gradient-to-r from-[#0f3d56] to-[#1a6275] px-5 py-5 text-white">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9de0d8]">Joint Commission Certified Staffing</p>
                  <p className="mt-1 text-[20px] font-bold leading-snug">{f.paidAd.headline}</p>
                  <ul className="mt-3 space-y-1 text-[12.5px] text-white/90">
                    {f.paidAd.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-1.5">
                        <Icon name="check" size={13} className="text-[#7ef0c7]" /> {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center justify-between gap-3 bg-[#eef3f8] px-4 py-3">
                  <div>
                    <p className="text-[13px] font-bold text-[#191919]">{f.paidAd.headline}</p>
                    <p className="text-[12px] text-[#5e6a75]">{f.paidAd.subheadline}</p>
                  </div>
                  <button
                    type="button"
                    onClick={clickPaidAd}
                    data-testid="social-ad-cta"
                    className="shrink-0 rounded-full bg-[#0a66c2] px-4 py-2 text-[13px] font-bold text-white shadow-sm hover:bg-[#004182]"
                  >
                    {f.paidAd.ctaLabel}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 text-[12px] text-[#666]">
                <span>{f.paidAd.likes} reactions &middot; {f.paidAd.comments} comments</span>
                <span className="font-medium text-[#0a66c2]">Click CTA to open landing page &rarr;</span>
              </div>
            </article>

            {/* 2. Organic Social Post from HubSpot Social Calendar */}
            <article className="rounded-[10px] border border-[#e0dfdc] bg-white p-4" data-testid="social-organic-post">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-[6px] bg-[#0f3d56] text-[13px] font-bold text-white">CC</span>
                  <div>
                    <p className="text-[14px] font-bold text-[#191919]">{f.organicPost.author}</p>
                    <p className="text-[12px] text-[#666]">
                      {f.organicPost.followers} &middot; {f.organicPost.postedAgo}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-[#eefaf1] px-2.5 py-0.5 text-[11px] font-semibold text-[#0b5b2b]">Organic Post</span>
              </div>
              <p className="mt-3 text-[13.5px] leading-relaxed text-[#191919]">{f.organicPost.copy}</p>
              <div className="mt-3 rounded-[8px] border border-[#dce6f0] bg-[#f4f8fb] px-5 py-4">
                <p className="text-[11.5px] font-semibold uppercase tracking-wide text-[#2f7f80]">Q1 Hospital Staffing Benchmark</p>
                <p className="mt-1 text-[24px] font-bold tracking-tight text-[#0f3d56]">{f.organicPost.statHeadline}</p>
                <p className="mt-0.5 text-[13px] text-[#4a5b6c]">{f.organicPost.statSub}</p>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-[#ebebeb] pt-2.5 text-[12.5px] text-[#666]">
                <button
                  type="button"
                  onClick={() => setLikedOrganic((v) => !v)}
                  className={cx("inline-flex items-center gap-1.5 rounded px-2 py-1 font-semibold hover:bg-[#f0f0f0]", likedOrganic && "text-[#0a66c2]")}
                >
                  <Icon name="thumbsUp" size={14} /> {likedOrganic ? "Liked" : "Like"} ({f.organicPost.likes + (likedOrganic ? 1 : 0)})
                </button>
                <span>
                  {f.organicPost.comments} comments &middot; {f.organicPost.reposts} reposts
                </span>
              </div>
            </article>
          </div>

          <aside className="space-y-3">
            <div className="rounded-[10px] border border-[#e0dfdc] bg-white p-3.5 text-[12.5px]">
              <p className="font-bold text-[#191919]">Healthcare Ops News</p>
              <ul className="mt-2.5 space-y-2.5 text-[#555]">
                <li>
                  <p className="font-semibold text-[#191919]">Winter ICU census up 18%</p>
                  <p className="text-[11.5px] text-[#777]">Mountain West &amp; Midwest networks</p>
                </li>
                <li>
                  <p className="font-semibold text-[#191919]">Compact RN states hit 41</p>
                  <p className="text-[11.5px] text-[#777]">Faster multi-state nurse mobilization</p>
                </li>
                <li>
                  <p className="font-semibold text-[#191919]">Joint Commission audit tips</p>
                  <p className="text-[11.5px] text-[#777]">Digital credentialing checklists</p>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </OffPlatformFrame>
  );
}

/** Steps 7 & 8 (Off-platform): Crestline Clinical Staffing landing page + staffing request form. */
export function LandingPage() {
  const { pack, world, dispatch, navigate } = useShell();
  const cfg = pack.demos.socialAds;
  const lead = cfg?.landingPage.lead;

  const [firstName, setFirstName] = useState(lead?.firstName ?? "");
  const [lastName, setLastName] = useState(lead?.lastName ?? "");
  const [email, setEmail] = useState(lead?.email ?? "");
  const [companyName, setCompanyName] = useState(lead?.companyName ?? "");
  const [rolesNeeded, setRolesNeeded] = useState(lead?.rolesNeeded ?? "");
  const [notes, setNotes] = useState(lead?.notes ?? "");

  if (!cfg || !lead) return null;
  const lp = cfg.landingPage;
  const submitted = world.sa.submitted;
  const formReady = world.sa.landingSeen;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ t: "sa.submitForm", at: nowMs(), overrides: { firstName, lastName, email, companyName, rolesNeeded, notes } });
  };

  return (
    <OffPlatformFrame
      channelLabel="Staffing Landing Page"
      url={lp.url}
      backTo={submitted && world.sa.contactId ? `/contacts/${world.sa.contactId}` : "/campaigns"}
      backLabel={submitted ? "View contact in HubSpot" : "Return to HubSpot"}
      testId="offplatform-landing-page"
    >
      <div className="min-h-full bg-[#f4f7fa]">
        <div className="flex items-center justify-between bg-[#0f3d56] px-10 py-3.5 text-white">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#2f9d8f] text-[13px] font-bold">CC</span>
            <p className="text-[17px] font-bold tracking-tight">{lp.companyName}</p>
          </div>
          <div className="flex items-center gap-4 text-[12.5px] text-white/80">
            <span>Travel Nursing</span>
            <span>Allied Health</span>
            <span>Joint Commission Credentialing</span>
            <span className="rounded-full bg-white/15 px-3 py-1 font-semibold text-white">48-Hr Rapid Response</span>
          </div>
        </div>

        <div className="border-b border-[#d5e3ec] bg-[#e9f3f8] px-10 py-2 text-[12px] text-[#0f3d56]">
          <span className="font-semibold">HubSpot UTM Tracking Captured:</span>{" "}
          <code className="rounded bg-white px-1.5 py-0.5 text-[11.5px]">utm_source={lp.utmSource}</code>{" "}
          <code className="rounded bg-white px-1.5 py-0.5 text-[11.5px]">utm_medium={lp.utmMedium}</code>{" "}
          <code className="rounded bg-white px-1.5 py-0.5 text-[11.5px]">utm_campaign={lp.utmCampaign}</code>
        </div>

        <div className="mx-auto grid max-w-[1040px] grid-cols-[1fr_470px] gap-10 px-10 py-8">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dff4f0] px-3 py-1 text-[12px] font-semibold text-[#00514f]">
              <Icon name="shield" size={13} /> {lp.badge}
            </span>
            <h1 className="mt-3 text-[32px] font-bold leading-tight tracking-tight text-[#0f3d56]">{lp.headline}</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-[#425869]">{lp.subheadline}</p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {lp.metrics.map((m) => (
                <div key={m.label} className="rounded-[10px] border border-[#d5dde5] bg-white p-3.5">
                  <p className="text-[22px] font-bold text-[#0f3d56]">{m.value}</p>
                  <p className="mt-0.5 text-[12px] leading-snug text-[#536878]">{m.label}</p>
                </div>
              ))}
            </div>

            <ul className="mt-6 space-y-2.5 text-[14px] text-[#243447]">
              {lp.proofPoints.map((pt) => (
                <li key={pt} className="flex items-start gap-2">
                  <Icon name="check" size={16} className="mt-0.5 shrink-0 text-[#1a7f5a]" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex items-start gap-2.5 rounded-[8px] border border-[#b9e1dc] bg-[#f1faf8] px-4 py-3 text-[12.5px] text-[#00514f]">
              <Icon name="shield" size={16} className="mt-0.5 shrink-0" />
              <span>{lp.complianceNotice}</span>
            </div>

            {!formReady && !submitted ? (
              <div className="mt-5">
                <Button variant="secondary" onClick={() => dispatch({ t: "sa.seenLanding" })} data-testid="landing-review-form">
                  Review staffing form details <Icon name="arrowRight" size={14} />
                </Button>
              </div>
            ) : null}
          </div>

          <div
            className={cx(
              "rounded-[12px] border bg-white p-6 shadow-[0_8px_28px_rgba(15,61,86,0.1)] transition-shadow",
              formReady && !submitted ? "border-[#0f3d56] ring-2 ring-[#0f3d56]/20" : "border-[#d5dde5]",
            )}
          >
            {submitted ? (
              <div className="hs-pop" data-testid="landing-submitted">
                <p className="flex items-center gap-2 text-[19px] font-bold text-[#0f3d56]">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#1a7f5a] text-white">
                    <Icon name="check" size={16} strokeWidth={2.4} />
                  </span>
                  Thank you, {firstName}.
                </p>
                <p className="mt-2 text-[14px] text-[#425869]">
                  Your staffing request for <strong>{companyName}</strong> is with our clinical recruiting desk.
                </p>
                <div className="mt-5 rounded-[8px] border border-line-soft bg-[#fafafa] p-4 text-ink">
                  <p className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Captured in HubSpot</p>
                  <ul className="mt-2.5 space-y-1.5 text-[13px]">
                    <li className="flex gap-2">
                      <Icon name="check" size={14} className="mt-0.5 shrink-0 text-[#0b5b2b]" />
                      Contact created: {firstName} {lastName} ({lead.title})
                    </li>
                    <li className="flex gap-2">
                      <Icon name="check" size={14} className="mt-0.5 shrink-0 text-[#0b5b2b]" />
                      Original source: Paid Social &middot; Campaign: Q1 Travel RN &amp; ICU Surge Staffing
                    </li>
                    <li className="flex gap-2">
                      <Icon name="check" size={14} className="mt-0.5 shrink-0 text-[#0b5b2b]" />
                      Ad clicks, social activity &amp; form submission logged to timeline
                    </li>
                    <li className="flex gap-2">
                      <Icon name="check" size={14} className="mt-0.5 shrink-0 text-[#0b5b2b]" />
                      Job-order deal created: $168,000 ({rolesNeeded})
                    </li>
                  </ul>
                  <Button
                    variant="primary"
                    className="mt-4 w-full"
                    data-testid="landing-go-hubspot"
                    onClick={() => navigate(`/contacts/${world.sa.contactId ?? lead.contactId}`)}
                  >
                    View contact in HubSpot <Icon name="arrowRight" size={15} />
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} data-testid="landing-form">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-[18px] font-bold text-[#0f3d56]">{lp.formTitle}</h2>
                  {formReady ? <span className="rounded-full bg-[#fff3ec] px-2.5 py-0.5 text-[11px] font-semibold text-[#a03400]">Ready to submit</span> : null}
                </div>
                <p className="mt-1 text-[12.5px] text-[#536878]">Prefilled for hospital hiring manager Rachel Morales (editable).</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
                  <label className="block">
                    <span className="font-semibold text-[#243447]">First name</span>
                    <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1 h-9 w-full rounded-[6px] border border-[#c5ced8] px-3 text-[13.5px]" />
                  </label>
                  <label className="block">
                    <span className="font-semibold text-[#243447]">Last name</span>
                    <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1 h-9 w-full rounded-[6px] border border-[#c5ced8] px-3 text-[13.5px]" />
                  </label>
                  <label className="col-span-2 block">
                    <span className="font-semibold text-[#243447]">Work email</span>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-9 w-full rounded-[6px] border border-[#c5ced8] px-3 text-[13.5px]" />
                  </label>
                  <label className="col-span-2 block">
                    <span className="font-semibold text-[#243447]">Hospital or clinic organization</span>
                    <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1 h-9 w-full rounded-[6px] border border-[#c5ced8] px-3 text-[13.5px]" />
                  </label>
                  <label className="col-span-2 block">
                    <span className="font-semibold text-[#243447]">Clinicians &amp; specialty needed</span>
                    <input value={rolesNeeded} onChange={(e) => setRolesNeeded(e.target.value)} className="mt-1 h-9 w-full rounded-[6px] border border-[#c5ced8] px-3 text-[13.5px]" />
                  </label>
                  <label className="col-span-2 block">
                    <span className="font-semibold text-[#243447]">Shift window &amp; staffing notes (no patient PHI)</span>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1 w-full resize-none rounded-[6px] border border-[#c5ced8] px-3 py-2 text-[13.5px]" />
                  </label>
                </div>
                <Button type="submit" variant="dark" className="mt-4 w-full !bg-[#0f3d56] hover:!bg-[#0a2c3f]" data-testid="landing-submit">
                  {lp.submitLabel}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </OffPlatformFrame>
  );
}
