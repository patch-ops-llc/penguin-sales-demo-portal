import type { Pack } from "@/verticals/types";
import { addActivity, iso, touch } from "./helpers";
import type { Action, World } from "./types";

export type PatientReactivationState = {
  segmentReviewed: boolean;
  seriesApproved: boolean;
  bookingOpened: boolean;
  booked: boolean;
  bookedSlotId: string | null;
  removalVerified: boolean;
};

export type PatientReactivationAction =
  | { t: "pr.reviewSegment" }
  | { t: "pr.approveSeries"; at: number }
  | { t: "pr.openBooking" }
  | { t: "pr.bookVisit"; slotId: string; at: number }
  | { t: "pr.verifyRemoval" };

export function seedPatientReactivation(): PatientReactivationState {
  return {
    segmentReviewed: false,
    seriesApproved: false,
    bookingOpened: false,
    booked: false,
    bookedSlotId: null,
    removalVerified: false,
  };
}

export function isPatientReactivationAction(a: Action): a is PatientReactivationAction {
  return a.t.startsWith("pr.");
}

export function applyPatientReactivation(w: World, a: PatientReactivationAction, pack: Pack): void {
  const cfg = pack.demos.patientReactivation;
  switch (a.t) {
    case "pr.reviewSegment":
      w.pr.segmentReviewed = true;
      return;
    case "pr.approveSeries": {
      if (!cfg || w.pr.seriesApproved) return;
      const at = iso(a.at);
      const touch1 = cfg.touches[0];
      if (touch1) {
        const subject = touch1.subject.replaceAll("{{contact.firstname}}", cfg.offPlatform.patientFirstName);
        addActivity(w, {
          at,
          type: "email",
          title: `Reactivation Touch 1 sent: ${subject}`,
          body: `Sent to ${cfg.totalOverdueCount.toLocaleString("en-US")} contacts in "${cfg.segmentName}". Non-PHI reminder tokens only.`,
          byId: w.persona,
          contactIds: [cfg.heroContactId],
        });
      }
      touch(w, at, { contactIds: [cfg.heroContactId] });
      w.pr.segmentReviewed = true;
      w.pr.seriesApproved = true;
      return;
    }
    case "pr.openBooking":
      w.pr.segmentReviewed = true;
      w.pr.seriesApproved = true;
      w.pr.bookingOpened = true;
      return;
    case "pr.bookVisit": {
      if (!cfg || w.pr.booked) return;
      const slot = cfg.offPlatform.slots.find((s) => s.id === a.slotId) ?? cfg.offPlatform.slots[0];
      const at = iso(a.at);
      const contact = w.contacts.find((c) => c.id === cfg.heroContactId);
      if (contact) {
        contact.leadStatus = "Scheduled";
        contact.extra = [
          { label: "Preferred clinic", value: cfg.offPlatform.clinicLocation },
          { label: "Last visit bucket", value: "Annual visit scheduled" },
          { label: "Annual visit status", value: "Scheduled — Annual Wellness" },
          { label: "Upcoming visit", value: `${slot.day} · ${slot.time} ${slot.tz}` },
          { label: "Dynamic segment", value: `Auto-removed from "${cfg.segmentName}"` },
          { label: "PHI policy", value: "Non-PHI eligibility tokens only" },
        ];
      }
      addActivity(w, {
        at: iso(a.at - 15_000),
        type: "meeting",
        title: `Annual wellness visit booked — ${cfg.offPlatform.clinicLocation}`,
        body: `${cfg.offPlatform.patientFullName} booked ${cfg.offPlatform.visitTypeLabel} for ${slot.day} at ${slot.time} ${slot.tz} via the reminder email link.`,
        byId: null,
        contactIds: [cfg.heroContactId],
      });
      addActivity(w, {
        at,
        type: "workflow",
        title: `Auto-removed from "${cfg.segmentName}"`,
        body: "Dynamic segment filter no longer matched (Annual visit status = Scheduled). Touches 2 & 3 automatically suppressed.",
        byId: null,
        contactIds: [cfg.heroContactId],
        linkPath: `/reports/${cfg.reportId}`,
        linkLabel: "View reactivation report",
      });
      touch(w, at, { contactIds: [cfg.heroContactId] });
      w.pr.bookingOpened = true;
      w.pr.booked = true;
      w.pr.bookedSlotId = slot.id;
      return;
    }
    case "pr.verifyRemoval":
      w.pr.removalVerified = true;
      return;
  }
}
