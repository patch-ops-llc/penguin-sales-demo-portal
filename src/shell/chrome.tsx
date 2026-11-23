"use client";

import { useMemo, useRef, useState } from "react";
import { HubSpotSprocket } from "@/components/brand";
import { useShell } from "@/store/store";
import { VERTICALS } from "@/verticals/catalog";
import type { Notification } from "@/verticals/types";
import { relative } from "./format";
import { Icon, type IconName } from "./icons";
import { APPROVAL_SETTINGS_PATH } from "./quote/approval-rule";
import { A, Avatar, cx, Menu, MenuItem, Tag, useClickOutside } from "./ui";

type NavItem = { to: string; label: string; icon: IconName };
const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "CRM",
    items: [
      { to: "/contacts", label: "Contacts", icon: "contacts" },
      { to: "/companies", label: "Companies", icon: "company" },
      { to: "/deals", label: "Deals", icon: "deal" },
      { to: "/inbox", label: "Inbox", icon: "inbox" },
      { to: "/tasks", label: "Tasks", icon: "task" },
    ],
  },
  {
    group: "Revenue",
    items: [
      { to: "/quotes", label: "Quotes", icon: "quote" },
      { to: "/products", label: "Products", icon: "product" },
    ],
  },
  { group: "Sales", items: [{ to: "/prospecting", label: "Prospecting", icon: "target" }] },
  { group: "Automation", items: [{ to: "/workflows", label: "Workflows", icon: "workflow" }] },
];

const MARKETING_NAV: { group: string; items: NavItem[] } = {
  group: "Marketing",
  items: [
    { to: "/campaigns", label: "Campaigns", icon: "megaphone" },
    { to: "/social/calendar", label: "Social", icon: "meeting" },
    { to: "/insights", label: "Insights", icon: "chart" },
  ],
};

function Sidebar() {
  const { route, pack } = useShell();
  const [pinned, setPinned] = useState(false);
  const section = `/${route.segments[0] ?? ""}`;
  const navGroups = [
    ...(pack.demos.socialAds ? [MARKETING_NAV] : []),
    ...NAV,
    ...(pack.demos.customerAgent
      ? [
          {
            group: "Service",
            items: [
              { to: "/service", label: "Help Desk", icon: "chat" as IconName },
              { to: "/service-dashboard", label: "Service Dashboard", icon: "chart" as IconName },
            ],
          },
        ]
      : []),
  ];
  // Labels show only while the sidebar is open, so the collapsed rail is icons alone.
  const label = pinned ? "" : "opacity-0 group-hover/nav:opacity-100";
  return (
    <nav aria-label="Main" className={cx("group/nav relative z-30 shrink-0", pinned ? "w-[212px]" : "w-[52px]")}>
      <div className={cx("absolute inset-y-0 left-0 flex flex-col overflow-hidden bg-nav text-white transition-[width] duration-100", pinned ? "w-[212px]" : "w-[52px] hover:w-[212px] hover:shadow-[6px_0_18px_rgba(0,0,0,0.25)]")}>
        <div className="hs-scroll flex-1 overflow-y-auto overflow-x-hidden pb-2 pt-1">
          {navGroups.map((group) => (
            <div key={group.group} className="mt-2">
              <p className={cx("h-5 whitespace-nowrap px-4 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white/45", pinned ? "opacity-100" : "opacity-0 group-hover/nav:opacity-100")}>{group.group}</p>
              {group.items.map((item) => {
                const itemSection = `/${item.to.split("/")[1] ?? ""}`;
                const active = section === itemSection;
                return (
                  <A key={item.to} to={item.to} data-testid={`nav-${itemSection.slice(1)}`} className={cx("mx-1.5 flex h-9 items-center gap-3 whitespace-nowrap rounded-[6px] px-[11px] text-[13.5px]", active ? "bg-white/15 font-semibold" : "text-white/85 hover:bg-nav-hover")}>
                    <Icon name={item.icon} size={18} className="shrink-0" />
                    <span className={label}>{item.label}</span>
                  </A>
                );
              })}
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setPinned((p) => !p)} className="mx-1.5 mb-2 flex h-9 items-center gap-3 whitespace-nowrap rounded-[6px] px-[11px] text-[12.5px] text-white/70 hover:bg-nav-hover">
          <Icon name={pinned ? "chevronLeft" : "chevronRight"} size={18} className="shrink-0" />
          <span className={label}>{pinned ? "Collapse navigation" : "Keep navigation open"}</span>
        </button>
      </div>
    </nav>
  );
}

type Hit = { key: string; group: string; title: string; sub: string; to: string };

function Search() {
  const { world, navigate } = useShell();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  const hits = useMemo<Hit[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const match = (...values: (string | undefined)[]) => values.some((v) => v?.toLowerCase().includes(q));
    const out: Hit[] = [];
    for (const c of world.contacts) if (match(`${c.firstName} ${c.lastName}`, c.email)) out.push({ key: c.id, group: "Contacts", title: `${c.firstName} ${c.lastName}`, sub: c.email, to: `/contacts/${c.id}` });
    for (const c of world.companies) if (match(c.name, c.domain)) out.push({ key: c.id, group: "Companies", title: c.name, sub: c.domain, to: `/companies/${c.id}` });
    for (const d of world.deals) if (match(d.name)) out.push({ key: d.id, group: "Deals", title: d.name, sub: world.companies.find((c) => c.id === d.companyId)?.name ?? "", to: `/deals/${d.id}` });
    for (const x of world.quotes) if (match(x.number, x.title)) out.push({ key: x.id, group: "Quotes", title: `${x.number}: ${x.title}`, sub: x.status, to: `/quotes/${x.id}` });
    return out.slice(0, 12);
  }, [query, world]);

  return (
    <div ref={ref} className="relative w-[420px]">
      <Icon name="search" size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search HubSpot"
        aria-label="Search HubSpot"
        data-testid="global-search"
        className="h-8 w-full rounded-full border border-white/25 bg-white/10 pl-9 pr-3 text-[13.5px] text-white placeholder:text-white/60 focus:bg-white focus:text-ink focus:outline-none focus:placeholder:text-ink-muted"
      />
      {open && query.trim().length >= 2 ? (
        <div className="hs-pop absolute left-0 top-full z-[70] mt-1.5 max-h-[420px] w-[480px] overflow-y-auto rounded-[8px] border border-line bg-white py-1.5 text-ink shadow-[0_8px_28px_rgba(20,20,20,0.18)]" data-testid="search-results">
          {hits.length === 0 ? <p className="px-4 py-3 text-[13.5px] text-ink-muted">No records match &quot;{query.trim()}&quot;.</p> : null}
          {hits.map((hit, i) => (
            <div key={hit.key}>
              {i === 0 || hits[i - 1].group !== hit.group ? <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{hit.group}</p> : null}
              <button
                type="button"
                className="flex w-full items-baseline gap-2 px-4 py-1.5 text-left hover:bg-[#f0f0f0]"
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                  navigate(hit.to);
                }}
              >
                <span className="text-[13.5px] font-semibold">{hit.title}</span>
                <span className="truncate text-[12.5px] text-ink-muted">{hit.sub}</span>
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** A picture of the alert as it lands in Slack. It is an image of another product, so nothing in it is clickable. */
function SlackAlert({ slack, at }: { slack: NonNullable<Notification["slack"]>; at: string }) {
  return (
    <div className="mt-2 rounded-[8px] border border-line-soft bg-[#fafafa] p-2.5" data-testid="slack-alert">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-muted">
        <Icon name="slack" size={12} /> Also posted in Slack, {slack.channel}
      </p>
      <div className="mt-1.5 flex gap-2">
        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px] bg-white ring-1 ring-line-soft">
          <HubSpotSprocket size={16} />
        </span>
        <p className="text-[12.5px] leading-snug">
          <span className="font-bold">HubSpot</span> <span className="rounded bg-[#e8e8e8] px-1 text-[10px] font-semibold text-ink-muted">APP</span> <span className="text-[11px] text-ink-muted">{relative(at)}</span>
          <span className="mt-0.5 block">{slack.text}</span>
        </p>
      </div>
    </div>
  );
}

function Bell() {
  const { world, pack, persona, dispatch, navigate } = useShell();
  const ref = useRef<HTMLDivElement>(null);
  const open = world.ui.bell === "open";
  const items = world.notifications.filter((n) => n.personaId === persona.id);
  const unread = items.filter((n) => !n.read).length;
  const close = () => dispatch({ t: "ui", k: "bell", v: "closed" });
  useClickOutside(ref, close, open);

  const toggle = () => {
    if (open) return close();
    // Opening the bell as the rep who was assigned the new lead is the last beat of Lead capture.
    const sawLead = world.lc?.ownerId === persona.id || (world.lc && !world.lc.ownerId);
    dispatch([{ t: "ui", k: "bell", v: "open" }, ...(sawLead && world.flags["lc.workflow"] ? [{ t: "flag" as const, k: "lc.bell" }] : [])]);
  };

  const openItem = (n: Notification) => {
    const approval = n.kind === "approval" && n.id === `nt-approval-${pack.demos.discountApproval.quoteId}`;
    dispatch([{ t: "notif.read", id: n.id }, { t: "ui", k: "bell", v: "closed" }, ...(approval ? [{ t: "flag" as const, k: "da.requestOpened" }] : [])]);
    navigate(n.path);
  };

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={toggle} aria-label={`Notifications, ${unread} unread`} data-testid="bell" className="relative inline-flex h-8 w-8 items-center justify-center rounded-full text-white/90 hover:bg-nav-hover">
        <Icon name="bell" size={18} />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-hs-orange px-1 text-[10.5px] font-bold text-white ring-2 ring-nav" data-testid="bell-count">
            {unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="hs-pop absolute right-0 top-full z-[70] mt-1.5 w-[400px] rounded-[10px] border border-line bg-white text-ink shadow-[0_8px_28px_rgba(20,20,20,0.18)]" data-testid="bell-panel">
          <p className="border-b border-line-soft px-4 py-3 text-[14px] font-semibold">Notifications</p>
          <div className="hs-scroll max-h-[440px] overflow-y-auto">
            {items.length === 0 ? <p className="px-4 py-6 text-center text-[13.5px] text-ink-muted">Nothing new for {persona.name}.</p> : null}
            {items.map((n) => (
              <div key={n.id} className={cx("border-b border-line-soft px-4 py-3 last:border-b-0", !n.read && "bg-[#fff7f2]")}>
                <button type="button" onClick={() => openItem(n)} className="block w-full text-left" data-testid={`notif-${n.id}`}>
                  <span className="flex items-center gap-2">
                    {!n.read ? <span className="h-2 w-2 shrink-0 rounded-full bg-hs-orange" /> : null}
                    <span className="text-[13.5px] font-semibold">{n.title}</span>
                    <span className="ml-auto shrink-0 text-[11.5px] text-ink-muted">{relative(n.at)}</span>
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-ink-muted">{n.body}</span>
                  {(n.kind === "approval" || n.kind === "approved") && n.path.startsWith("/quotes/") ? <span className="mt-2 inline-flex h-7 items-center rounded-[4px] border border-ink px-3 text-[12.5px] font-semibold text-ink">Go to quote</span> : null}
                </button>
                {n.slack ? <SlackAlert slack={n.slack} at={n.at} /> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** The settings icon of the top bar. The one settings screen this portal simulates is where quote approvals are set. */
function SettingsGear() {
  const { route } = useShell();
  const active = route.segments[0] === "settings";
  return (
    <A to={APPROVAL_SETTINGS_PATH} aria-label="Settings" title="Settings" aria-current={active ? "page" : undefined} data-testid="settings-gear" className={cx("inline-flex h-8 w-8 items-center justify-center rounded-full text-white/90 hover:bg-nav-hover", active && "bg-white/15")}>
      <Icon name="settings" size={18} />
    </A>
  );
}

function AccountMenu() {
  const { pack, persona, vertical, switchVertical } = useShell();
  return (
    <Menu
      align="right"
      width={300}
      button={({ toggle }) => (
        <button type="button" onClick={toggle} data-testid="account-menu" className="flex h-9 items-center gap-2 rounded-full pl-1 pr-2 text-[13px] text-white hover:bg-nav-hover">
          <Avatar name={persona.name} color={persona.color} size={28} />
          <span className="max-w-[150px] truncate">{pack.portal.company}</span>
          <Icon name="chevronDown" size={14} />
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="flex items-center gap-3 px-3.5 pb-3 pt-2">
            <Avatar name={persona.name} color={persona.color} size={38} />
            <div className="min-w-0">
              <p className="text-[14px] font-semibold" data-testid="persona-name">
                {persona.name}
              </p>
              <p className="truncate text-[12px] text-ink-muted">{persona.title}</p>
            </div>
          </div>
          <div className="border-t border-line-soft px-3.5 py-2.5">
            <p className="text-[13.5px] font-semibold">{pack.portal.company}</p>
            <p className="text-[12px] text-ink-muted">Hub ID: {pack.portal.hubId}</p>
            <p className="mt-1.5">
              <Tag tone="amber">Demo environment: sample data</Tag>
            </p>
          </div>
          <div className="border-t border-line-soft py-1.5">
            <p className="px-3.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Accounts</p>
            {VERTICALS.map((v) => (
              <MenuItem
                key={v.id}
                active={v.id === vertical}
                disabled={v.status !== "live"}
                right={v.status !== "live" ? <Tag>Coming soon</Tag> : undefined}
                testId={`account-${v.id}`}
                onClick={() => {
                  close();
                  switchVertical(v.id);
                }}
              >
                <span className="block">{v.company}</span>
                <span className="block text-[12px] font-normal text-ink-muted">{v.name}</span>
              </MenuItem>
            ))}
          </div>
          <div className="border-t border-line-soft py-1.5">
            <a href="/launchpad" className="block px-3.5 py-2 text-[13.5px] hover:bg-[#f0f0f0]" data-testid="exit-launchpad">
              Exit to the launchpad
            </a>
          </div>
        </>
      )}
    </Menu>
  );
}

/** The frame of the simulated portal: dark top bar and sidebar around a light, rounded work area. */
export function Chrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-nav">
      <header className="relative z-[35] flex h-12 shrink-0 items-center gap-3 px-3 text-white">
        <A to="/deals" className="inline-flex h-9 w-9 items-center justify-center rounded-[6px] hover:bg-nav-hover" aria-label="HubSpot home">
          <HubSpotSprocket size={24} />
        </A>
        <Search />
        <div className="ml-auto flex items-center gap-1.5">
          <SettingsGear />
          <Bell />
          <AccountMenu />
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="hs-scroll relative min-w-0 flex-1 overflow-y-auto rounded-tl-[12px] bg-hs-bg" data-testid="shell-main" id="shell-main">
          {children}
        </main>
      </div>
    </div>
  );
}
