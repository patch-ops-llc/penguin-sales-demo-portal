import type { FlowConfig, FlowsConfig } from "@/shell/claude/types";

/**
 * The three headless flows for Lumenstack: a campaign built from Claude, a deal follow-up run from
 * Claude, and an at-risk renewal handled from Claude. Every name, address, and number is invented.
 * Penguin markers: only the Claude surface and the tool bridge (see extensions.ts).
 *
 * Each turn's tool calls go through the same bridge a live Claude turn uses, so pressing Next and
 * typing to the model leave the same records behind.
 */

// ---------- Flow 1: Marketing ----------

const campaign: FlowConfig = {
  demoId: "agent-campaign",
  actor: { name: "Maya Chen", title: "Demand Generation Manager", initials: "MC" },
  chatTitle: "Mid-market SaaS campaign",
  intro: "Claude is connected to Lumenstack's HubSpot. Ask what worked, then build the next campaign from here. Claude asks before it changes anything.",
  turns: [
    {
      user: "Which of our recent campaigns brought in the most pipeline?",
      text: "Pulling campaign attribution from HubSpot.\n\nBy pipeline created in the last quarter:\n1. Analytics benchmark report (email + landing page): 412 leads, 19 deals, $1.28M pipeline.\n2. Board-ready revenue dashboards webinar: 176 leads, 11 deals, $940K.\n3. Live boards product update (email): 288 leads, 9 deals, $610K.\n4. Snowflake partner co-marketing: 95 leads, 4 deals, $220K.\n\nThe benchmark report and the webinar did the heavy lifting; both landed best with mid-market SaaS finance and RevOps contacts.",
      toolCalls: [{ name: "get_campaign_attribution", args: {} }],
    },
    {
      user: "Build a campaign for mid-market SaaS contacts who opened our last two emails.",
      text: "Here is what I would set up. The segment is contacts at B2B SaaS companies with 200 to 1,000 employees who opened both the benchmark report and the Live boards update: 1,284 contacts, 61% finance or RevOps titles.\n\nThe campaign runs three weeks on one promise, board-ready revenue dashboards in a week, with an email to the segment, a landing page with a demo request form, and two social posts. Goal: 15 demo requests.\n\nApprove and I will create the segment and the campaign in HubSpot.",
      toolCalls: [
        {
          name: "create_segment",
          args: {
            name: "Mid-market SaaS · opened last 2 emails",
            criteria: ["Company industry is B2B SaaS or Software", "Company size is 200 to 1,000 employees", "Opened email: Analytics benchmark report", "Opened email: Live boards product update"],
            estimatedSize: 1284,
          },
        },
        {
          name: "create_campaign",
          args: {
            name: "Mid-market SaaS: Board-ready dashboards in a week",
            goal: "15 demo requests from engaged mid-market SaaS finance and RevOps contacts in three weeks",
            channels: ["Email", "Landing page", "LinkedIn", "X"],
            startsOn: "Tuesday",
          },
        },
      ],
      done: "Created. The segment has 1,284 contacts and the campaign is in HubSpot as a draft, linked to it. Next I can draft the assets.",
    },
    {
      user: "Draft the email and the landing page in our brand voice, plus two social posts.",
      text: "Drafts below, in Lumenstack's voice: direct, numbers first, no hype. The email leads with the three-tool problem the benchmark report surfaced; the landing page carries the same promise with a two-field demo form. Approve and I will attach them to the campaign as drafts.",
      toolCalls: [
        {
          name: "add_asset",
          args: {
            kind: "email",
            title: "Your board deck should not take three tools",
            body: "Hi {{first_name}},\n\nYou read our benchmark report, so you already know the number: finance teams at SaaS companies your size spend 11 hours a month stitching CRM pipeline, usage data, and ARR into one board deck.\n\nLumenstack puts the three in one dashboard that updates itself. Teams like Kestrel Ops had board-ready revenue dashboards live inside a week.\n\nWant to see it on your numbers? Book a 20-minute demo and we will build the first view live.\n\n{{demo_link}}\n\nMaya Chen\nLumenstack",
          },
        },
        {
          name: "add_asset",
          args: {
            kind: "landing",
            title: "Board-ready revenue dashboards in a week",
            body: "One dashboard for pipeline, usage, and ARR. Connect HubSpot, Snowflake, and your billing system; Lumenstack builds the board view and keeps it current.\n\n• Live in a week, not a quarter\n• Finance-grade ARR math, no spreadsheets\n• Every number traceable to its source\n\nForm: Work email · Company size · Book my demo",
          },
        },
        { name: "add_asset", args: { kind: "social", channel: "LinkedIn", title: "LinkedIn post", body: "11 hours a month. That is what finance teams at mid-market SaaS companies told us they spend turning CRM, usage, and billing data into one board deck.\n\nWe think it should take zero. Board-ready revenue dashboards, live in a week → {{landing_link}}" } },
        { name: "add_asset", args: { kind: "social", channel: "X", title: "X post", body: "Pipeline in HubSpot. Usage in Snowflake. ARR in billing. Your board deck in none of them.\n\nLumenstack puts all three in one live dashboard, in a week. {{landing_link}}" } },
      ],
      done: "Attached. Four drafts are on the campaign: the email, the landing page, and the two social posts. Say when to schedule.",
    },
    {
      user: "Looks good. Schedule the email to the segment for Tuesday at 9am.",
      text: "Scheduling the email to the 1,284 contacts in the segment for Tuesday at 9:00 AM in each contact's time zone. The landing page publishes with it; the social posts stay in drafts for your review. Approve to lock it in.",
      toolCalls: [{ name: "schedule_email", args: { sendAtLabel: "Tuesday 9:00 AM (contact time zone)", sendInDays: 2 } }],
      done: "Scheduled for Tuesday at 9:00 AM. The landing page goes live with the send; the social posts wait in drafts.",
    },
    {
      user: "How is the campaign doing? Save it as a report on the marketing dashboard.",
      text: "First 48 hours: 1,271 delivered, 548 opens (43%), 171 clicks (13%), and 23 demo requests, including Priya Nair, VP of Finance at Kestrel Ops, a Tier 1 ICP account.\n\nSuggested next step: route the 23 requests to the SDR team today and send the 377 clickers who did not submit a short follow-up on Thursday.\n\nI will save this as a report on the marketing dashboard once you approve.",
      toolCalls: [
        { name: "get_campaign_performance", args: {} },
        {
          name: "save_report",
          args: {
            dashboard: "marketing",
            title: "Mid-market SaaS campaign: first 48 hours",
            summary: "Email to the engaged mid-market SaaS segment. 23 demo requests against a goal of 15 for the full three weeks.",
            kpis: [
              { label: "Delivered", value: "1,271" },
              { label: "Open rate", value: "43.1%", delta: "+9 pts vs. average" },
              { label: "Click rate", value: "13.5%", delta: "+4 pts vs. average" },
              { label: "Demo requests", value: "23", delta: "Goal: 15" },
            ],
            columns: ["Channel", "Reach", "Clicks", "Demo requests"],
            rows: [
              ["Email", "1,271", "171", "19"],
              ["Landing page (direct)", "402", "—", "4"],
              ["LinkedIn (draft)", "—", "—", "—"],
              ["X (draft)", "—", "—", "—"],
            ],
          },
        },
      ],
      done: "Saved to the marketing dashboard as \"Mid-market SaaS campaign: first 48 hours\".",
    },
  ],
  beats: {
    "campaign-inbox": {
      id: "campaign-inbox",
      app: "Kestrel Ops Mail",
      address: "mail.kestrelops.example/inbox",
      mailbox: { name: "Priya Nair", title: "VP of Finance, Kestrel Ops", email: "priya.nair@kestrelops.example", initials: "PN" },
      caption: "Tuesday, 9:02 AM. The scheduled email reaches a contact in the segment.",
      messages: [
        {
          from: "Maya Chen, Lumenstack",
          fromEmail: "maya.chen@lumenstack.example",
          to: "priya.nair@kestrelops.example",
          subject: "Your board deck should not take three tools",
          body: "Hi Priya,\n\nYou read our benchmark report, so you already know the number: finance teams at SaaS companies your size spend 11 hours a month stitching CRM pipeline, usage data, and ARR into one board deck.\n\nLumenstack puts the three in one dashboard that updates itself. Teams like yours had board-ready revenue dashboards live inside a week.\n\nWant to see it on your numbers? Book a 20-minute demo and we will build the first view live.\n\nBook my demo →\n\nMaya Chen\nLumenstack",
          when: "9:02 AM",
          unread: true,
        },
      ],
      form: {
        eyebrow: "lumenstack.example/board-ready",
        headline: "Board-ready revenue dashboards in a week",
        fields: [
          { label: "Work email", value: "priya.nair@kestrelops.example" },
          { label: "Company size", value: "200 to 1,000 employees" },
        ],
        submitLabel: "Book my demo",
        thanks: "Thanks, Priya. We will be in touch today to pick a time.",
      },
      cta: "Open the email and submit the form",
      result: "HubSpot logs the click and the form submission on Priya's contact record and attributes both to the campaign.",
      actions: [{ t: "hf.engage", campaignId: "cmp-mid-market-saas-board-ready-dashboards-in-a-week", contactId: "ct-priya", stats: { sent: 1284, delivered: 1271, opens: 548, clicks: 171, submissions: 23 }, at: 0 }],
    },
  },
};

// ---------- Flow 2: Sales ----------

const dealFollowUp: FlowConfig = {
  demoId: "agent-deal-follow-up",
  actor: { name: "Jordan Avery", title: "Account Executive", initials: "JA" },
  chatTitle: "Today's follow-ups",
  intro: "Claude is connected to Lumenstack's HubSpot. Start the day here: ask what needs attention, follow up, and let HubSpot keep the record. Claude asks before it changes anything.",
  turns: [
    {
      user: "What should I focus on today?",
      text: "Reading your open deals, tasks, and recent activity.\n\n1. Marlowe Ridge Health, renewal and 20-seat expansion, $141,600, closes in 14 days. Priscilla Vance asked for a better number yesterday and the call task to her is due today. Biggest deal, nearest close, and an open ask: start here.\n2. Tessellate Freight Systems, analytics rollout, $100,000, closes in 18 days. Anika settled on 100 seats; Desmond still needs the security overview you owe him.\n3. Saltmarsh Hospitality, property managers expansion, $38,400, closes in 9 days. In Contract Review with no activity in a week; the admin workshop is not booked.",
      toolCalls: [{ name: "get_focus_list", args: {} }],
    },
    {
      user: "Let's take Marlowe. Give me the picture.",
      text: "Marlowe Ridge Health: 31 outpatient clinics, on the Growth plan since last year, renewing with 20 more seats. $141,600 in Solution Fit, close date in 14 days.\n\nPeople: Priscilla Vance, Director of Analytics, your champion. Tobias Reinhardt, VP Finance, holds the budget.\n\nRecent: yesterday Priscilla replied to quote Q-2087 saying Finance wants a better number given the extra seats. Twelve days ago Tobias said the analytics budget is flat next year but he is open to a multi-year commitment in exchange for price.\n\nOpen task: call Priscilla about the renewal quote, due today.\n\nThe lever is Tobias's own suggestion: a two-year term for the price Finance wants.",
      toolCalls: [{ name: "get_deal_brief", args: { dealId: "dl-marlowe" } }],
    },
    {
      user: "Draft a follow-up to Priscilla that proposes a pricing call this week with the two-year option, then log it and set a task.",
      text: "Here is the email. I will log it on the deal and create a follow-up task for Thursday once you approve.",
      toolCalls: [
        {
          name: "log_email",
          args: {
            dealId: "dl-marlowe",
            contactId: "ct-priscilla",
            subject: "Re: Renewal quote Q-2087: a better number for the 120 seats",
            body: "Hi Priscilla,\n\nThanks for the straight answer on Q-2087. I think we can get Finance the number they want.\n\nTobias mentioned the analytics budget is flat next year but that a longer commitment could work. On a two-year term I can take the per-seat price down for all 120 seats, including the 20 new ones, and lock it for both years.\n\nCould we do a 30-minute pricing call this week with you and Tobias? Thursday at 2:00 or Friday at 10:00 CT work on my side; I will bring both the one-year and two-year options.\n\nBest,\nJordan",
          },
        },
        { name: "create_task", args: { title: "Prep two-year pricing options for Marlowe pricing call", type: "To-do", priority: "High", dueInDays: 2, dealId: "dl-marlowe", contactId: "ct-priscilla", notes: "One-year vs two-year per-seat pricing for 120 seats. Tobias Reinhardt (VP Finance) joins." } },
      ],
      done: "Sent and logged on the Marlowe deal. The prep task is on your list for Thursday.",
    },
    {
      user: "Priscilla agreed to the pricing call Thursday with Tobias. Move the deal to Contract Review, set the next step, and push the close date out three weeks.",
      text: "Here are the changes: stage from Solution Fit to Contract Review, next step set to the Thursday pricing call with Priscilla and Tobias on the two-year option, and the close date moved out 21 days to leave room for Finance's approval after the call. Approve and I will update the deal.",
      toolCalls: [{ name: "update_deal", args: { dealId: "dl-marlowe", stage: "negotiation", nextStep: "Pricing call Thu 2:00 CT with Priscilla Vance and Tobias Reinhardt: present one-year vs two-year options for 120 seats", closeInDays: 21 } }],
      done: "Updated. Marlowe is in Contract Review with the pricing call as the next step and a close date three weeks out.",
    },
    {
      user: "Show me this quarter's pipeline by stage and save it to the sales dashboard.",
      text: "Open pipeline by stage: Discovery $316,500 across 3 deals, Solution Fit $180,100 across 4, Proposal Sent $526,800 across 3, Contract Review $632,400 across 4. Total $1.66M in 14 deals.\n\nBiggest movements this week: Marlowe Ridge Health into Contract Review (+$141,600 at that stage), Ostrander Biologics' $399,000 proposal went out, Elderbrook Senior Living pulled its close date in, and Pikewell Media closed lost (−$27,000).\n\nApprove and I will save this to the sales dashboard.",
      toolCalls: [
        { name: "get_pipeline_by_stage", args: {} },
        {
          name: "save_report",
          args: {
            dashboard: "sales",
            title: "Pipeline by stage, this quarter",
            summary: "Open pipeline across the sales team by stage, with the week's biggest movements.",
            kpis: [
              { label: "Open pipeline", value: "$1.66M", delta: "14 deals" },
              { label: "Contract Review", value: "$632K", delta: "+$141.6K this week" },
              { label: "Proposal Sent", value: "$527K" },
              { label: "Avg. deal", value: "$118K" },
            ],
            columns: ["Stage", "Deals", "Amount"],
            rows: [
              ["Discovery", "3", "$316,500"],
              ["Solution Fit", "4", "$180,100"],
              ["Proposal Sent", "3", "$526,800"],
              ["Contract Review", "4", "$632,400"],
            ],
          },
        },
      ],
      done: "Saved to the sales dashboard as \"Pipeline by stage, this quarter\".",
    },
  ],
  beats: {
    "deal-reply": {
      id: "deal-reply",
      app: "Marlowe Ridge Mail",
      address: "mail.marloweridgehealth.example/inbox",
      mailbox: { name: "Priscilla Vance", title: "Director of Analytics, Marlowe Ridge Health", email: "priscilla.vance@marloweridgehealth.example", initials: "PV" },
      caption: "Later that morning. Jordan's email lands in Priscilla's inbox and she answers.",
      messages: [
        {
          from: "Jordan Avery, Lumenstack",
          fromEmail: "jordan.avery@lumenstack.example",
          to: "priscilla.vance@marloweridgehealth.example",
          subject: "Re: Renewal quote Q-2087: a better number for the 120 seats",
          body: "Hi Priscilla,\n\nThanks for the straight answer on Q-2087. I think we can get Finance the number they want.\n\nTobias mentioned the analytics budget is flat next year but that a longer commitment could work. On a two-year term I can take the per-seat price down for all 120 seats, including the 20 new ones, and lock it for both years.\n\nCould we do a 30-minute pricing call this week with you and Tobias? Thursday at 2:00 or Friday at 10:00 CT work on my side; I will bring both the one-year and two-year options.\n\nBest,\nJordan",
          when: "10:48 AM",
          unread: true,
        },
      ],
      reply: {
        subject: "Re: Renewal quote Q-2087: a better number for the 120 seats",
        body: "Jordan,\n\nThursday at 2:00 works. Tobias will join; he is interested in the two-year option if the per-seat price holds for both years. Please send the invite.\n\nPriscilla",
      },
      cta: "Send Priscilla's reply",
      result: "HubSpot's connected inbox logs the reply on the Marlowe deal and on Priscilla's record.",
      actions: [
        {
          t: "log",
          kind: "email",
          byId: null,
          title: "Email from Priscilla Vance: Re: Renewal quote Q-2087",
          text: "Thursday at 2:00 works. Tobias will join; he is interested in the two-year option if the per-seat price holds for both years. Please send the invite.",
          contactIds: ["ct-priscilla"],
          companyIds: ["co-marlowe"],
          dealIds: ["dl-marlowe"],
          at: 0,
        },
      ],
    },
  },
};

// ---------- Flow 3: Customer success ----------

const renewal: FlowConfig = {
  demoId: "agent-renewal",
  actor: { name: "Nadia Kowalski", title: "Customer Success Manager", initials: "NK" },
  chatTitle: "Renewals at risk",
  intro: "Claude is connected to Lumenstack's HubSpot and Service Hub. Find the renewals at risk, reach out, and resolve what comes back, from here. Claude asks before it changes anything.",
  turns: [
    {
      user: "Which customers renewing in the next 90 days look at risk?",
      text: "Reading renewal deals, open tickets, and recent conversations.\n\nThree of the twelve renewals in the next 90 days look at risk:\n1. Ambleforth Credit Union, $72,000, renews in 20 days. Health 48. Two open tickets about export failures and no reply in 10 days to the renewal proposal.\n2. Kittering Home Goods, $48,600, renews in 35 days. Health 61. One open ticket; Moira Kessler asked about seat reductions on the last call.\n3. Saltmarsh Hospitality, $38,400, renews in 71 days. Health 66. Usage down 22% since the property managers left the pilot.\n\nAmbleforth is the nearest and the quietest. I would start there.",
      toolCalls: [{ name: "get_renewals_at_risk", args: {} }],
    },
    {
      user: "Take Ambleforth.",
      text: "Ambleforth Credit Union: 410 employees, Madison. Customer for two years on the Growth plan. Member analytics renewal, $72,000, proposal sent, renews in 20 days; owner Theo Lindgren.\n\nContact: Ingrid Solberg, VP Member Experience, your sponsor. Last conversation was your email 10 days ago walking through the renewal; no reply.\n\nOpen tickets: TKT-5098 and TKT-5104, both scheduled export failures since the 4.12 release, open 6 and 4 days.\n\nThe risk is the quiet plus the two tickets. A check-in that acknowledges the export problem before she raises it is the move.",
      toolCalls: [{ name: "get_account_brief", args: { companyId: "co-ambleforth" } }],
    },
    {
      user: "Draft a check-in email to Ingrid and talking points for a call. Log the email, set a renewal task, and add a note on the company.",
      text: "Email and talking points below. Approve and I will log the email on the account, create the renewal task, and add the talking points as a note on Ambleforth.",
      toolCalls: [
        {
          name: "log_email",
          args: {
            companyId: "co-ambleforth",
            contactId: "ct-ingrid",
            subject: "Checking in ahead of your renewal",
            body: "Hi Ingrid,\n\nWith the renewal 20 days out, I wanted to check in properly rather than send another proposal reminder.\n\nI can see two open tickets on scheduled exports since our 4.12 release. I am sorry about that; it is exactly the kind of thing that should not be your problem in a renewal month, and I have asked our team for a status by tomorrow.\n\nCould we take 20 minutes this week? I would like to hear how the member analytics work has gone this year, what the board needs from it next, and make sure the renewal reflects that.\n\nThanks,\nNadia",
          },
        },
        { name: "create_task", args: { title: "Ambleforth renewal: call Ingrid Solberg", type: "Call", priority: "High", dueInDays: 2, companyId: "co-ambleforth", contactId: "ct-ingrid", dealId: "dl-ambleforth", notes: "Renewal in 20 days. Open export tickets TKT-5098 and TKT-5104. Use the talking points note on the company." } },
        {
          name: "add_note",
          args: {
            companyId: "co-ambleforth",
            text: "Talking points for the Ingrid Solberg renewal call:\n• Open with the export tickets: what broke in 4.12, what we are doing, when it is fixed.\n• Ask what the board wants from member analytics next year; listen for the lending team's request.\n• Renewal proposal is flat on price; offer the quarterly business review cadence we skipped this year.\n• Do not discuss seat reductions unless she raises them.",
          },
        },
      ],
      done: "Done. The email is logged on Ambleforth, the call task is on your list, and the talking points are pinned to the company.",
    },
    {
      user: "Log Ingrid's export problem as a ticket.",
      text: "Here is the ticket: High priority, linked to Ambleforth Credit Union and Ingrid Solberg, assigned to you, with her description of the failure. Approve and I will create it in the Support pipeline.",
      toolCalls: [
        {
          name: "create_ticket",
          args: {
            subject: "Scheduled member-analytics exports failing since 4.12",
            description: "Since the 4.12 release, Ambleforth's scheduled exports of member-analytics dashboards to the monthly board pack fail with a timeout after about 90 seconds. Manual exports work. The board pack is due on the 30th. Reported by Ingrid Solberg (VP Member Experience) by email; related to open tickets TKT-5098 and TKT-5104.",
            priority: "High",
            companyId: "co-ambleforth",
            contactId: "ct-ingrid",
          },
        },
      ],
      done: "Ticket TKT-5132 is open in Service Hub, High priority, linked to Ambleforth and Ingrid, assigned to you.",
    },
    {
      user: "How were similar problems resolved before? Propose a fix and a reply.",
      text: "Two matches in past tickets. TKT-4471, Northquay Marine Supply: scheduled exports timed out after the 4.9 release; resolved in 1.6 days by turning on export compatibility mode for the workspace and re-running the failed jobs, with a permanent fix in 4.9.2. TKT-4502, Fallowfield Energy: exports to SFTP failed after an upgrade; a credential re-authorization fixed it the same day.\n\nAmbleforth's symptom matches Northquay's. Proposed fix: enable export compatibility mode on their workspace now, re-run the three failed board-pack jobs, and confirm the 4.12.1 fix ships Thursday.\n\nHere is the reply. Approve and I will log it on the ticket and set it to waiting on the customer.",
      toolCalls: [
        { name: "search_past_tickets", args: { query: "scheduled export timeout after release" } },
        {
          name: "reply_on_ticket",
          args: {
            text: "Hi Ingrid,\n\nThank you for the detail. This matches an issue we have seen once before with scheduled exports after a release, and it has a known fix.\n\nWhat we have done: enabled export compatibility mode on Ambleforth's workspace and re-run the three failed board-pack exports. They should be in your export folder within the hour.\n\nWhat is next: the permanent fix ships in 4.12.1 on Thursday; nothing is needed on your side.\n\nCould you confirm the exports came through? I will keep this ticket open until you do.\n\nNadia",
          },
        },
      ],
      done: "Reply sent from the ticket. It is waiting on Ingrid.",
    },
    {
      user: "Ingrid confirmed the exports are back. Close the ticket.",
      text: "Resolution note: scheduled exports failed after 4.12 due to a timeout in the new export scheduler; mitigated with export compatibility mode and re-run jobs, permanent fix in 4.12.1; customer confirmed. Approve and I will close the ticket with this note.",
      toolCalls: [{ name: "close_ticket", args: { resolution: "Scheduled board-pack exports timed out after the 4.12 release (new export scheduler). Mitigated by enabling export compatibility mode on the Ambleforth workspace and re-running the three failed jobs; permanent fix ships in 4.12.1. Ingrid Solberg confirmed the exports are back. Related TKT-5098 and TKT-5104 close with the same note." } }],
      done: "Closed. The resolution is on the ticket and on Ambleforth's timeline.",
    },
    {
      user: "Show renewals at risk by month, the open tickets behind them, and our time to resolve. Save it to the customer success dashboard.",
      text: "Renewals at risk across the next 90 days: 12 renewals worth $612K, 4 at risk worth $212K.\n\nNext 30 days: 3 renewals, 1 at risk ($72,000, Ambleforth, now trending up), 2 open tickets, median time to resolve 1.8 days.\n31 to 60 days: 4 renewals, 2 at risk ($87,000), 3 open tickets, median 2.6 days.\n61 to 90 days: 5 renewals, 1 at risk ($38,400), 1 open ticket, median 1.4 days.\n\nThe tickets behind the risk are mostly export and integration issues; resolution time is good where an SE is assigned. Approve and I will save this to the customer success dashboard.",
      toolCalls: [
        { name: "get_renewal_risk_breakdown", args: {} },
        {
          name: "save_report",
          args: {
            dashboard: "service",
            title: "Renewals at risk, next 90 days",
            summary: "Renewals by window with the at-risk share, the open tickets behind the risk, and median time to resolve.",
            kpis: [
              { label: "Renewals, 90 days", value: "12", delta: "$612K ARR" },
              { label: "At risk", value: "4", delta: "$212K ARR" },
              { label: "Open tickets on at-risk accounts", value: "6" },
              { label: "Median time to resolve", value: "2.1 days", delta: "−0.6 days QoQ" },
            ],
            columns: ["Window", "Renewals", "At risk", "At-risk ARR", "Open tickets", "Median resolve"],
            rows: [
              ["Next 30 days", "3", "1", "$72,000", "2", "1.8 days"],
              ["31 to 60 days", "4", "2", "$87,000", "3", "2.6 days"],
              ["61 to 90 days", "5", "1", "$38,400", "1", "1.4 days"],
            ],
          },
        },
      ],
      done: "Saved to the customer success dashboard as \"Renewals at risk, next 90 days\".",
    },
  ],
  beats: {
    "renewal-reply": {
      id: "renewal-reply",
      app: "Ambleforth Mail",
      address: "mail.ambleforthcreditunion.example/inbox",
      mailbox: { name: "Ingrid Solberg", title: "VP Member Experience, Ambleforth Credit Union", email: "ingrid.solberg@ambleforthcreditunion.example", initials: "IS" },
      caption: "That afternoon. Nadia's check-in arrives and Ingrid writes back with a problem.",
      messages: [
        {
          from: "Nadia Kowalski, Lumenstack",
          fromEmail: "nadia.kowalski@lumenstack.example",
          to: "ingrid.solberg@ambleforthcreditunion.example",
          subject: "Checking in ahead of your renewal",
          body: "Hi Ingrid,\n\nWith the renewal 20 days out, I wanted to check in properly rather than send another proposal reminder.\n\nI can see two open tickets on scheduled exports since our 4.12 release. I am sorry about that; it is exactly the kind of thing that should not be your problem in a renewal month, and I have asked our team for a status by tomorrow.\n\nCould we take 20 minutes this week? I would like to hear how the member analytics work has gone this year, what the board needs from it next, and make sure the renewal reflects that.\n\nThanks,\nNadia",
          when: "2:16 PM",
          unread: true,
        },
      ],
      reply: {
        subject: "Re: Checking in ahead of your renewal",
        body: "Nadia,\n\nThank you for raising it before I did. The export problem is now blocking us: since 4.12 our scheduled member-analytics exports to the board pack fail with a timeout after about 90 seconds. Manual exports still work, but the board pack is due on the 30th and my team is rebuilding it by hand.\n\nHappy to talk this week once I know this is being handled.\n\nIngrid",
      },
      cta: "Send Ingrid's reply",
      result: "HubSpot's connected inbox logs the reply on Ambleforth's company record and on Ingrid's contact.",
      actions: [
        {
          t: "log",
          kind: "email",
          byId: null,
          title: "Email from Ingrid Solberg: Re: Checking in ahead of your renewal",
          text: "Since 4.12 our scheduled member-analytics exports to the board pack fail with a timeout after about 90 seconds. Manual exports still work, but the board pack is due on the 30th and my team is rebuilding it by hand. Happy to talk this week once I know this is being handled.",
          contactIds: ["ct-ingrid"],
          companyIds: ["co-ambleforth"],
          dealIds: ["dl-ambleforth"],
          at: 0,
        },
      ],
    },
    "renewal-fixed": {
      id: "renewal-fixed",
      app: "Ambleforth Mail",
      address: "mail.ambleforthcreditunion.example/inbox",
      mailbox: { name: "Ingrid Solberg", title: "VP Member Experience, Ambleforth Credit Union", email: "ingrid.solberg@ambleforthcreditunion.example", initials: "IS" },
      caption: "An hour later. The ticket reply arrives and Ingrid confirms the fix.",
      messages: [
        {
          from: "Nadia Kowalski, Lumenstack Support",
          fromEmail: "support@lumenstack.example",
          to: "ingrid.solberg@ambleforthcreditunion.example",
          subject: "Re: Scheduled member-analytics exports failing since 4.12 [TKT-5132]",
          body: "Hi Ingrid,\n\nThank you for the detail. This matches an issue we have seen once before with scheduled exports after a release, and it has a known fix.\n\nWhat we have done: enabled export compatibility mode on Ambleforth's workspace and re-run the three failed board-pack exports. They should be in your export folder within the hour.\n\nWhat is next: the permanent fix ships in 4.12.1 on Thursday; nothing is needed on your side.\n\nCould you confirm the exports came through? I will keep this ticket open until you do.\n\nNadia",
          when: "3:40 PM",
          unread: true,
        },
      ],
      reply: {
        subject: "Re: Scheduled member-analytics exports failing since 4.12 [TKT-5132]",
        body: "Nadia,\n\nAll three exports are in the folder and the board pack is building again. Thank you for the quick turnaround. Let's do that call Thursday.\n\nIngrid",
      },
      cta: "Send Ingrid's confirmation",
      result: "Service Hub threads the confirmation onto the ticket's timeline.",
      actions: [{ t: "hf.ticketInbound", id: "tkt-hf-1", text: "All three exports are in the folder and the board pack is building again. Thank you for the quick turnaround. Let's do that call Thursday.", at: 0 }],
    },
  },
};

export const saasFlows: FlowsConfig = {
  flows: { "agent-campaign": campaign, "agent-deal-follow-up": dealFollowUp, "agent-renewal": renewal },
  dashboards: {
    marketing: {
      id: "marketing",
      title: "Marketing dashboard",
      subtitle: "Demand generation · this quarter",
      owner: "Maya Chen",
      tiles: [
        { label: "Website sessions", value: "48,210", delta: "+8% QoQ", tone: "green" },
        { label: "New contacts", value: "1,912", delta: "+12% QoQ", tone: "green" },
        { label: "MQLs", value: "412", delta: "+6% QoQ", tone: "green" },
        { label: "Influenced pipeline", value: "$3.1M", delta: "−4% QoQ", tone: "amber" },
      ],
    },
    sales: {
      id: "sales",
      title: "Sales dashboard",
      subtitle: "Revenue team · this quarter",
      owner: "Jordan Avery",
      tiles: [
        { label: "Open pipeline", value: "$1.66M", delta: "14 deals", tone: "neutral" },
        { label: "Weighted pipeline", value: "$724K", delta: "+$96K WoW", tone: "green" },
        { label: "Closed won QTD", value: "$198K", delta: "61% of target", tone: "amber" },
        { label: "Avg. deal cycle", value: "41 days", delta: "−3 days QoQ", tone: "green" },
      ],
    },
    service: {
      id: "service",
      title: "Customer success dashboard",
      subtitle: "Renewals and support · next 90 days",
      owner: "Nadia Kowalski",
      tiles: [
        { label: "Net revenue retention", value: "108%", delta: "+2 pts YoY", tone: "green" },
        { label: "Renewals, 90 days", value: "12", delta: "$612K ARR", tone: "neutral" },
        { label: "At-risk ARR", value: "$212K", delta: "4 accounts", tone: "amber" },
        { label: "Median time to resolve", value: "2.1 days", delta: "−0.6 days QoQ", tone: "green" },
      ],
    },
  },
  campaignAttribution: [
    { campaign: "Analytics benchmark report", channel: "Email + landing page", period: "Last quarter", leads: 412, deals: 19, pipeline: 1_280_000 },
    { campaign: "Board-ready revenue dashboards webinar", channel: "Webinar", period: "Last quarter", leads: 176, deals: 11, pipeline: 940_000 },
    { campaign: "Live boards product update", channel: "Email", period: "Last quarter", leads: 288, deals: 9, pipeline: 610_000 },
    { campaign: "Snowflake partner co-marketing", channel: "Partner", period: "Last quarter", leads: 95, deals: 4, pipeline: 220_000 },
  ],
  dealRisks: [
    { dealId: "dl-marlowe", score: 92, reasons: ["Champion asked for a better number yesterday", "Call task due today", "Nearest close among your large deals"] },
    { dealId: "dl-tessellate", score: 74, reasons: ["Security overview still owed to Desmond Achebe", "Seat count settled; waiting on SSO answer"] },
    { dealId: "dl-saltmarsh", score: 61, reasons: ["No activity in 7 days while in Contract Review", "Admin workshop not booked"] },
  ],
  pipelineMovements: [
    { deal: "Marlowe Ridge Health: Renewal and 20-seat expansion", change: "Moved to Contract Review", amount: 141_600 },
    { deal: "Ostrander Biologics: Enterprise evaluation", change: "Proposal sent", amount: 399_000 },
    { deal: "Elderbrook Senior Living: Enterprise rollout", change: "Close date pulled in 9 days", amount: 438_000 },
    { deal: "Pikewell Media: Audience dashboards", change: "Closed lost", amount: -27_000 },
  ],
  renewalRisks: [
    { dealId: "dl-ambleforth", health: 48, lastContactDays: 10, openTickets: 2, reasons: ["Two open tickets on scheduled export failures since 4.12", "No reply in 10 days to the renewal proposal"] },
    { dealId: "dl-kittering", health: 61, lastContactDays: 9, openTickets: 1, reasons: ["Asked about seat reductions on the last call", "One open ticket"] },
    { dealId: "dl-saltmarsh", health: 66, lastContactDays: 7, openTickets: 0, reasons: ["Usage down 22% since the property managers left the pilot"] },
  ],
  pastTickets: [
    { number: "TKT-4471", company: "Northquay Marine Supply", subject: "Scheduled exports timing out after 4.9 release", resolvedIn: "1.6 days", resolution: "Enabled export compatibility mode on the workspace and re-ran the failed jobs; permanent fix shipped in 4.9.2.", keywords: ["export", "scheduled", "timeout", "release"] },
    { number: "TKT-4502", company: "Fallowfield Energy Cooperative", subject: "Exports to SFTP failing after upgrade", resolvedIn: "Same day", resolution: "SFTP credential re-authorization after the upgrade rotated the token.", keywords: ["export", "sftp", "upgrade"] },
    { number: "TKT-4610", company: "Greywether Construction", subject: "Dashboard filters reset on refresh", resolvedIn: "2.3 days", resolution: "Browser extension conflict; documented workaround and fixed in 4.10.", keywords: ["dashboard", "filters"] },
  ],
  renewalRiskByMonth: [
    { month: "Next 30 days", renewals: 3, atRisk: 1, arr: 72_000, openTickets: 2, medianResolve: "1.8 days" },
    { month: "31 to 60 days", renewals: 4, atRisk: 2, arr: 87_000, openTickets: 3, medianResolve: "2.6 days" },
    { month: "61 to 90 days", renewals: 5, atRisk: 1, arr: 38_400, openTickets: 1, medianResolve: "1.4 days" },
  ],
};
