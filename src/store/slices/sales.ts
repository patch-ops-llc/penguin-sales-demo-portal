import { labelsOf } from "@/verticals/labels";
import type { Company, Contact, Deal, LineItem, Pack } from "@/verticals/types";
import { addActivity, DAY, iso, newQuote, touch } from "./helpers";
import type { Action, World } from "./types";

export type BackOfficeState = {
  picked: string[];
  quoteId: string | null;
  dealId: string | null;
};

export type LeadCaptureState = {
  presetId: string;
  contactId: string;
  companyId: string;
  dealId: string | null;
  taskId: string | null;
  ownerId: string | null;
  findingsSent?: boolean;
  proposalQuoteId?: string | null;
} | null;

export type EmailToDealState = {
  matches: Record<string, string>;
  deals: Record<string, string>;
  quotes: Record<string, string>;
};

export type AiProspectingState = {
  drafted: boolean;
  version: number;
  edits: Record<string, string>;
  sent: boolean;
  meetingBooked: boolean;
  meetingSlotId: string | null;
};

export type SalesAction =
  | { t: "bo.pick"; sku: string }
  | { t: "bo.addToQuote"; at: number }
  | { t: "lc.submit"; presetId: string; at: number }
  | { t: "lc.sendFindings"; at: number }
  | { t: "lc.createProposal"; at: number }
  | { t: "ed.open"; threadId: string }
  | { t: "ed.match"; threadId: string; lineId: string; sku: string }
  | { t: "ed.createDeal"; threadId: string; at: number }
  | { t: "ed.createQuote"; threadId: string; at: number }
  | { t: "ap.draft" }
  | { t: "ap.version"; v: number }
  | { t: "ap.edit"; memberId: string; text: string }
  | { t: "ap.send"; at: number }
  | { t: "ap.bookMeeting"; slotId: string; at: number };

export function seedBackOffice(): BackOfficeState {
  return { picked: [], quoteId: null, dealId: null };
}

export function seedLeadCapture(): LeadCaptureState {
  return null;
}

export function seedEmailToDeal(): EmailToDealState {
  return { matches: {}, deals: {}, quotes: {} };
}

export function seedAiProspecting(): AiProspectingState {
  return { drafted: false, version: 0, edits: {}, sent: false, meetingBooked: false, meetingSlotId: null };
}

export function isSalesAction(a: Action): a is SalesAction {
  return a.t.startsWith("bo.") || a.t.startsWith("lc.") || a.t.startsWith("ed.") || a.t.startsWith("ap.");
}

export function applySales(w: World, a: SalesAction, pack: Pack): void {
  switch (a.t) {
    // ----- Back-office data -----
    case "bo.pick":
      w.bo.picked = w.bo.picked.includes(a.sku) ? w.bo.picked.filter((s) => s !== a.sku) : [...w.bo.picked, a.sku];
      return;
    case "bo.addToQuote": {
      const config = pack.demos.backOffice;
      const wording = labelsOf(pack).backOffice.add;
      if (w.bo.quoteId || w.bo.picked.length === 0) return;
      const at = iso(a.at);
      const lineItems: LineItem[] = config.stock
        .filter((s) => w.bo.picked.includes(s.sku))
        .map((s) => ({
          sku: s.sku,
          name: s.name,
          description: wording.lineNote,
          qty: s.usualQty,
          unitPrice: s.contractPrice,
          unitCost: s.unitCost,
          leadDays: s.leadDays,
          ...(s.timing ? { timing: s.timing } : {}),
          ...(s.recurring ? { recurring: true } : {}),
        }));
      const deal: Deal = {
        id: "dl-reorder",
        name: config.dealName,
        companyId: config.companyId,
        contactIds: [config.contactId],
        ownerId: w.persona,
        stage: "qualified",
        amount: lineItems.reduce((sum, l) => sum + l.qty * l.unitPrice, 0),
        closeDate: iso(a.at + 14 * DAY),
        createdAt: at,
        lastActivityAt: at,
        type: wording.dealType,
        lineItems,
        source: wording.origin,
        isNew: true,
      };
      w.deals.unshift(deal);
      const quote = newQuote(w, {
        id: "q-reorder",
        title: config.quoteTitle,
        dealId: deal.id,
        companyId: config.companyId,
        contactId: config.contactId,
        lineItems,
        origin: wording.origin,
        at: a.at,
      });
      w.bo.quoteId = quote.id;
      w.bo.dealId = deal.id;
      return;
    }

    // ----- Lead capture -----
    case "lc.submit": {
      const config = pack.demos.leadCapture;
      const preset = config.presets.find((p) => p.id === a.presetId);
      if (!preset || w.lc) return;
      const at = iso(a.at);
      const owner = preset.route.ownerId;
      const fullName = `${preset.form.firstName} ${preset.form.lastName}`;
      const workflowName = pack.workflows.find((x) => x.id === config.workflowId)?.name ?? "Lead routing";
      const company: Company = {
        id: "co-lead",
        name: preset.form.company,
        domain: preset.company.domain,
        industry: preset.company.industry,
        type: preset.company.type,
        city: preset.company.city,
        state: preset.company.state,
        employees: preset.company.employees,
        revenue: preset.company.revenue || null,
        phone: preset.company.phone,
        ownerId: owner,
        lifecycle: owner ? "Lead" : "Subscriber",
        createdAt: at,
        lastActivityAt: at,
        description: preset.company.description,
        territory: preset.company.territory,
        enrichedAt: at,
        ...(preset.company.extra ? { extra: preset.company.extra } : {}),
        isNew: true,
      };
      const contact: Contact = {
        id: "ct-lead",
        firstName: preset.form.firstName,
        lastName: preset.form.lastName,
        email: preset.form.email,
        phone: preset.form.phone,
        title: preset.form.title,
        companyId: company.id,
        ownerId: owner,
        lifecycle: owner ? "Lead" : "Subscriber",
        leadStatus: owner ? "New" : "Nurture",
        createdAt: at,
        lastActivityAt: at,
        source: `${config.site.formTitle} form`,
        score: preset.score,
        ...(preset.contactExtra ? { extra: preset.contactExtra } : {}),
        isNew: true,
      };
      w.companies.unshift(company);
      w.contacts.unshift(contact);
      const ids = { contactIds: [contact.id], companyIds: [company.id] };
      let dealId: string | null = null;
      let taskId: string | null = null;

      if (preset.task && owner) {
        taskId = "tk-lead";
        w.tasks.unshift({
          id: taskId,
          title: preset.task.title,
          type: preset.task.title.startsWith("Call") ? "Call" : "Email",
          priority: preset.route.branchId === "field" ? "High" : "Medium",
          dueAt: iso(a.at + preset.task.dueInMinutes * 60_000),
          ownerId: owner,
          status: "open",
          contactId: contact.id,
          companyId: company.id,
          notes: preset.task.notes,
          isNew: true,
        });
      }
      if (preset.deal && owner) {
        dealId = "dl-lead";
        w.deals.unshift({
          id: dealId,
          name: preset.deal.name,
          companyId: company.id,
          contactIds: [contact.id],
          ownerId: owner,
          stage: config.dealStage,
          amount: preset.deal.amount,
          closeDate: iso(a.at + 45 * DAY),
          createdAt: at,
          lastActivityAt: at,
          type: "New business",
          lineItems: [],
          source: `${workflowName} workflow`,
          isNew: true,
        });
        const task = w.tasks.find((t) => t.id === taskId);
        if (task) task.dealId = dealId;
      }
      if (preset.alert && owner) {
        w.notifications.unshift({
          id: "nt-lead",
          personaId: owner,
          at,
          kind: "lead",
          title: "New lead assigned to you",
          body: `${fullName}, ${preset.form.company}. Score ${preset.score}. ${preset.task?.title ?? ""}`.trim(),
          path: `/contacts/${contact.id}`,
          read: false,
          slack: preset.alert,
        });
      }

      const ownerName = pack.personas.find((p) => p.id === owner)?.name;
      // Newest first on the timeline: the workflow's last step is added last.
      addActivity(w, { at, type: "form", title: `Form submission: ${config.site.formTitle}`, body: `${preset.form.interest}. "${preset.form.message}"`, byId: null, ...ids });
      addActivity(w, {
        at,
        type: "sync",
        title: "Company enriched",
        body: `${preset.company.industry}, ${preset.company.employees.toLocaleString("en-US")} employees, ${preset.company.city}, ${preset.company.state}.${(preset.company.extra ?? []).map((e) => ` ${e.label}: ${e.value}.`).join("")}`,
        byId: null,
        ...ids,
      });
      addActivity(w, {
        at,
        type: "lifecycle",
        title: `Lead score set to ${preset.score}`,
        body: preset.reasons.filter((r) => r.points > 0).map((r) => r.label).join(", ") || "No scoring criteria met.",
        byId: null,
        ...ids,
      });
      addActivity(w, {
        at,
        type: "workflow",
        title: `Enrolled in workflow: ${workflowName}`,
        body: `${preset.route.summary}.`,
        byId: null,
        ...ids,
        linkPath: `/workflows/${config.workflowId}`,
        linkLabel: "View in workflow",
      });
      if (dealId) addActivity(w, { at, type: "deal", title: "Deal created by workflow", body: `${preset.deal!.name} was created in ${pack.stages.find((s) => s.id === config.dealStage)?.label ?? "the first stage"}.`, byId: null, ...ids, dealIds: [dealId] });
      if (taskId) addActivity(w, { at, type: "task", title: `Task assigned to ${ownerName}`, body: preset.task!.title, byId: null, ...ids, ...(dealId ? { dealIds: [dealId] } : {}) });

      w.lc = { presetId: preset.id, contactId: contact.id, companyId: company.id, dealId, taskId, ownerId: owner, findingsSent: false, proposalQuoteId: null };
      return;
    }
    case "lc.sendFindings": {
      const followUp = pack.demos.leadCapture.assessmentFollowUp;
      if (!followUp || !w.lc || w.lc.findingsSent) return;
      const at = iso(a.at);
      const actorId = w.lc.ownerId ?? w.persona;
      const ids = {
        contactIds: [w.lc.contactId],
        companyIds: [w.lc.companyId],
        ...(w.lc.dealId ? { dealIds: [w.lc.dealId] } : {}),
      };
      addActivity(w, {
        at: iso(a.at - 60_000),
        type: "meeting",
        title: followUp.callSummaryTitle,
        body: followUp.callSummaryBody,
        byId: actorId,
        ...ids,
      });
      addActivity(w, {
        at,
        type: "email",
        title: `Findings report emailed: ${followUp.emailSubject}`,
        body: followUp.emailPreview,
        byId: actorId,
        attachment: followUp.attachmentName,
        ...ids,
      });
      if (w.lc.taskId) {
        const task = w.tasks.find((t) => t.id === w.lc?.taskId);
        if (task) task.status = "done";
      }
      touch(w, at, { companyId: w.lc.companyId, contactIds: [w.lc.contactId], dealId: w.lc.dealId });
      w.lc = { ...w.lc, findingsSent: true };
      return;
    }
    case "lc.createProposal": {
      const followUp = pack.demos.leadCapture.assessmentFollowUp;
      if (!followUp || !w.lc || w.lc.proposalQuoteId) return;
      const at = iso(a.at);
      const actorId = w.lc.ownerId ?? w.persona;
      const lineItems: LineItem[] = followUp.proposalLines
        .map((pl) => {
          const p = pack.products.find((x) => x.sku === pl.sku);
          if (!p) return null;
          return {
            sku: p.sku,
            name: p.name,
            ...(pl.note ? { description: pl.note } : {}),
            qty: pl.qty,
            unitPrice: pl.unitPrice ?? p.price,
            unitCost: p.cost,
            leadDays: p.leadDays,
            ...(p.timing ? { timing: p.timing } : {}),
            ...(p.recurring ? { recurring: true } : {}),
          };
        })
        .filter((item): item is LineItem => item !== null);
      const totalAmount = lineItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);

      let dealId = w.lc.dealId;
      let deal = dealId ? w.deals.find((d) => d.id === dealId) : undefined;
      if (!deal) {
        dealId = "dl-lead";
        deal = {
          id: dealId,
          name: followUp.proposalTitle,
          companyId: w.lc.companyId,
          contactIds: [w.lc.contactId],
          ownerId: actorId,
          stage: followUp.proposalStage ?? "quote-sent",
          amount: totalAmount,
          closeDate: iso(a.at + 30 * DAY),
          createdAt: at,
          lastActivityAt: at,
          type: "New business",
          lineItems,
          source: "Security assessment findings",
          isNew: true,
        };
        w.deals.unshift(deal);
      } else {
        deal.lineItems = lineItems;
        deal.amount = totalAmount;
        deal.stage = followUp.proposalStage ?? "quote-sent";
        deal.lastActivityAt = at;
      }

      const quote = newQuote(w, {
        id: "q-lead-proposal",
        title: followUp.proposalTitle,
        dealId: deal.id,
        companyId: w.lc.companyId,
        contactId: w.lc.contactId,
        lineItems,
        origin: "Created from security assessment findings",
        at: a.at,
      });
      touch(w, at, { companyId: w.lc.companyId, contactIds: [w.lc.contactId], dealId: deal.id });
      w.lc = { ...w.lc, dealId: deal.id, findingsSent: true, proposalQuoteId: quote.id };
      return;
    }

    // ----- Email to deal -----
    case "ed.open": {
      const thread = w.threads.find((t) => t.id === a.threadId);
      if (!thread) return;
      thread.unread = false;
      w.ui["inbox.thread"] = thread.id;
      return;
    }
    case "ed.match":
      w.ed.matches[`${a.threadId}:${a.lineId}`] = a.sku;
      return;
    case "ed.createDeal": {
      const thread = w.threads.find((t) => t.id === a.threadId);
      const parsed = thread?.parsed;
      if (!thread || !parsed || w.ed.deals[thread.id] || !thread.companyId || !thread.contactId) return;
      const lineItems: LineItem[] = [];
      for (const l of parsed.lines) {
        const sku = l.sku ?? w.ed.matches[`${thread.id}:${l.id}`];
        const product = pack.products.find((p) => p.sku === sku);
        if (!product) return; // An unmatched line blocks deal creation.
        const unitPrice = l.prices?.[product.sku] ?? product.price;
        lineItems.push({
          sku: product.sku,
          name: product.name,
          qty: l.qty,
          unitPrice,
          unitCost: unitPrice === product.price ? product.cost : Math.round((unitPrice * product.cost) / (product.price || 1)),
          leadDays: product.leadDays,
          ...(product.timing ? { timing: product.timing } : {}),
          ...(product.recurring ? { recurring: true } : {}),
        });
      }
      const at = iso(a.at);
      const forCompany = parsed.dealFor?.companyId ?? thread.companyId;
      const forContacts = parsed.dealFor?.contactIds ?? [thread.contactId];
      const deal: Deal = {
        id: `dl-${thread.id}`,
        name: parsed.dealName,
        companyId: forCompany,
        contactIds: forContacts,
        ownerId: w.persona,
        stage: pack.demos.emailToDeal.dealStage,
        amount: lineItems.reduce((sum, l) => sum + l.qty * l.unitPrice, 0),
        closeDate: iso(a.at + parsed.closeInDays * DAY),
        createdAt: at,
        lastActivityAt: at,
        type: labelsOf(pack).email.dealType,
        lineItems,
        source: "Created from an email",
        isNew: true,
      };
      w.deals.unshift(deal);
      const ids = { contactIds: forContacts, companyIds: [forCompany], dealIds: [deal.id] };
      addActivity(w, {
        at: thread.at,
        type: "email",
        title: `Email from ${thread.from.name}: ${thread.subject}`,
        body: thread.preview,
        byId: null,
        ...ids,
        ...(thread.attachment ? { attachment: thread.attachment.name } : {}),
      });
      addActivity(w, { at, type: "deal", title: "Deal created from email", body: `${lineItems.length} line items from the parsed request. Company and contact associated.`, byId: w.persona, ...ids });
      touch(w, at, { companyId: forCompany, contactIds: forContacts });
      w.ed.deals[thread.id] = deal.id;
      return;
    }
    case "ed.createQuote": {
      const dealId = w.ed.deals[a.threadId];
      const deal = w.deals.find((d) => d.id === dealId);
      if (!deal || w.ed.quotes[a.threadId]) return;
      const quote = newQuote(w, {
        id: `q-${a.threadId}`,
        title: deal.name,
        dealId: deal.id,
        companyId: deal.companyId,
        contactId: deal.contactIds[0],
        lineItems: deal.lineItems,
        origin: "Created from the deal",
        at: a.at,
      });
      w.ed.quotes[a.threadId] = quote.id;
      return;
    }

    // ----- AI prospecting -----
    case "ap.draft":
      w.ap.drafted = true;
      return;
    case "ap.version":
      w.ap.version = ((a.v % 3) + 3) % 3;
      w.ap.edits = {};
      return;
    case "ap.edit":
      w.ap.edits[a.memberId] = a.text;
      return;
    case "ap.send": {
      const config = pack.demos.aiProspecting;
      if (!w.ap.drafted || w.ap.sent) return;
      const at = iso(a.at);
      const contactIds: string[] = [];
      // Send order matches the buying group; the timeline shows newest first.
      for (const member of config.buyingGroup) {
        let contactId = member.contactId;
        if (!contactId) {
          const [firstName, ...rest] = member.name.split(" ");
          contactId = `ct-${member.id}`;
          w.contacts.unshift({
            id: contactId,
            firstName,
            lastName: rest.join(" "),
            email: member.email,
            phone: "",
            title: member.title,
            companyId: config.companyId,
            ownerId: w.persona,
            lifecycle: "Lead",
            leadStatus: "Attempted to contact",
            createdAt: at,
            lastActivityAt: at,
            source: "Prospecting agent",
            isNew: true,
          });
        }
        contactIds.push(contactId);
        const draft = config.drafts[member.id]?.[w.ap.version];
        addActivity(w, {
          at,
          type: "email",
          title: `Email to ${member.name}: ${draft?.subject ?? "Outreach"}`,
          body: (w.ap.edits[member.id] ?? draft?.body ?? "").split("\n\n").slice(0, 2).join(" "),
          byId: w.persona,
          contactIds: [contactId],
          companyIds: [config.companyId],
        });
      }
      w.tasks.unshift({
        id: "tk-prospecting",
        title: config.followUp.title,
        type: "Call",
        priority: "Medium",
        dueAt: iso(a.at + config.followUp.dueInDays * DAY),
        ownerId: w.persona,
        status: "open",
        companyId: config.companyId,
        contactId: contactIds[0],
        isNew: true,
      });
      touch(w, at, { companyId: config.companyId, contactIds });
      w.ap.sent = true;
      return;
    }
    case "ap.bookMeeting": {
      const config = pack.demos.aiProspecting;
      const meeting = config.offPlatformMeeting;
      if (!meeting || w.ap.meetingBooked) return;
      const slot = meeting.slots.find((s) => s.id === a.slotId) ?? meeting.slots[0];
      const at = iso(a.at);
      const contactIds = config.buyingGroup.map((m) => m.contactId ?? `ct-${m.id}`).filter((cid) => w.contacts.some((c) => c.id === cid));
      let createdDealId: string | null = null;
      if (meeting.dealCreated && !w.deals.some((d) => d.id === meeting.dealCreated!.id)) {
        createdDealId = meeting.dealCreated.id;
        w.deals.unshift({
          id: meeting.dealCreated.id,
          name: meeting.dealCreated.name,
          companyId: config.companyId,
          contactIds,
          ownerId: w.persona,
          stage: meeting.dealCreated.stage,
          amount: meeting.dealCreated.amount,
          closeDate: iso(a.at + 60 * DAY),
          createdAt: at,
          lastActivityAt: at,
          type: "Expansion",
          lineItems: [],
          source: "Breeze Prospecting Agent",
          isNew: true,
        });
      }
      addActivity(w, {
        at,
        type: "meeting",
        title: `Meeting booked: ${meeting.meetingTitle}`,
        body: `${slot.day} at ${slot.time} ${slot.tz} · ${meeting.meetingLocation}. Confirmed by ${meeting.recipientName} (${meeting.recipientTitle}) from Breeze Prospecting outreach.`,
        byId: w.persona,
        contactIds,
        companyIds: [config.companyId],
        ...(createdDealId ? { dealIds: [createdDealId] } : {}),
        ...(config.reportId ? { linkPath: `/reports/${config.reportId}`, linkLabel: config.reportLabel ?? "View referral report" } : {}),
      });
      touch(w, at, { companyId: config.companyId, contactIds, dealId: createdDealId });
      w.ap.meetingBooked = true;
      w.ap.meetingSlotId = slot.id;
      return;
    }
  }
}
