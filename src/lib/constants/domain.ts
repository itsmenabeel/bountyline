import type {
  PaymentStatus,
  ProgramStatus,
  ReportStatus,
  Role,
  Severity,
} from "@/types/api";

// The words the UI uses for the backend's enums, in sentence case (design-plan §12). Badges,
// filters, and the disclosure track all read these, so one status has one name everywhere.

export const SEVERITY_LABEL: Record<Severity, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  NEW: "New",
  TRIAGING: "In triage",
  NEEDS_INFO: "Needs info",
  ACCEPTED: "Accepted",
  REWARDED: "Rewarded",
  REJECTED: "Rejected",
  DUPLICATE: "Duplicate",
};

export const PROGRAM_STATUS_LABEL: Record<ProgramStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  PAUSED: "Paused",
  CLOSED: "Closed",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  SUCCEEDED: "Succeeded",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

/** Researchers may edit or delete a report only in these statuses (backend EDITABLE_STATUSES). */
export const REPORT_EDITABLE_STATUSES = [
  "NEW",
  "NEEDS_INFO",
] as const satisfies readonly ReportStatus[];

export function isReportEditable(status: ReportStatus) {
  return (REPORT_EDITABLE_STATUSES as readonly ReportStatus[]).includes(status);
}

export const ROLE_LABEL: Record<Role, string> = {
  RESEARCHER: "Researcher",
  PROGRAM_OWNER: "Program owner",
  ADMIN: "Triage team",
};

/**
 * Legal next statuses (backend REPORT_TRANSITIONS). REWARDED comes only from the payout
 * endpoint, so the triage panel offers `TRIAGE_TARGETS` instead.
 */
export const REPORT_TRANSITIONS: Record<ReportStatus, readonly ReportStatus[]> =
  {
    NEW: ["TRIAGING", "REJECTED", "DUPLICATE"],
    TRIAGING: ["ACCEPTED", "NEEDS_INFO", "REJECTED", "DUPLICATE"],
    NEEDS_INFO: ["TRIAGING"],
    ACCEPTED: ["REWARDED"],
    DUPLICATE: [],
    REJECTED: [],
    REWARDED: [],
  };

export type TriageTarget = Exclude<ReportStatus, "NEW" | "REWARDED">;

export function triageTargets(status: ReportStatus): TriageTarget[] {
  return REPORT_TRANSITIONS[status].filter(
    (next): next is TriageTarget => next !== "REWARDED" && next !== "NEW",
  );
}

/** Legal program status changes (backend PROGRAM_TRANSITIONS). CLOSED is final. */
export const PROGRAM_TRANSITIONS: Record<
  ProgramStatus,
  readonly Exclude<ProgramStatus, "DRAFT">[]
> = {
  DRAFT: ["ACTIVE", "CLOSED"],
  ACTIVE: ["PAUSED", "CLOSED"],
  PAUSED: ["ACTIVE", "CLOSED"],
  CLOSED: [],
};

/** Reports still moving through triage (dashboard "open reports"). */
export const OPEN_REPORT_STATUSES = [
  "NEW",
  "TRIAGING",
  "NEEDS_INFO",
  "ACCEPTED",
] as const satisfies readonly ReportStatus[];
