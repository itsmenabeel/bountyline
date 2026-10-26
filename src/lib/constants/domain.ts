import type {
  PaymentStatus,
  ProgramStatus,
  ReportStatus,
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
