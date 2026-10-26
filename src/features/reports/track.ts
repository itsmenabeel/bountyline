import { REPORT_STATUS_LABEL } from "@/lib/constants/domain";
import type { ReportStatus } from "@/types/api";

// The backend moves every report through one state machine (REPORT_TRANSITIONS):
// NEW → TRIAGING ⇄ NEEDS_INFO → ACCEPTED → REWARDED, with REJECTED or DUPLICATE ending it
// early. The disclosure track draws that path (design-plan §5).

export type TrackStepId =
  | "submitted"
  | "triage"
  | "accepted"
  | "rewarded"
  | "closed";

export type TrackStepState = "complete" | "current" | "upcoming";

export interface TrackStep {
  id: TrackStepId;
  label: string;
  state: TrackStepState;
}

export type TrackOutcome = "open" | "rewarded" | "rejected" | "duplicate";

export interface Track {
  steps: TrackStep[];
  /** Index of the step the report is on; the last step once it has ended. */
  currentIndex: number;
  outcome: TrackOutcome;
  /** The triage team asked the researcher for more detail. */
  needsInfo: boolean;
  /** "Accepted, step 3 of 4": the compact track's accessible name. */
  summary: string;
}

const OPEN_PATH = [
  { id: "submitted", label: "Submitted" },
  { id: "triage", label: "In triage" },
  { id: "accepted", label: "Accepted" },
  { id: "rewarded", label: "Rewarded" },
] as const satisfies readonly { id: TrackStepId; label: string }[];

const OPEN_INDEX: Partial<Record<ReportStatus, number>> = {
  NEW: 0,
  TRIAGING: 1,
  NEEDS_INFO: 1,
  ACCEPTED: 2,
  REWARDED: 3,
};

function stateAt(index: number, current: number, ended: boolean) {
  if (index < current || (ended && index === current)) return "complete";
  return index === current ? "current" : "upcoming";
}

export function buildTrack(status: ReportStatus): Track {
  const label = REPORT_STATUS_LABEL[status];

  if (status === "REJECTED" || status === "DUPLICATE") {
    // Later steps drop off: the line ends at a cap after triage.
    const steps: TrackStep[] = [
      { id: "submitted", label: "Submitted", state: "complete" },
      { id: "triage", label: "In triage", state: "complete" },
      { id: "closed", label, state: "current" },
    ];
    return {
      steps,
      currentIndex: 2,
      outcome: status === "REJECTED" ? "rejected" : "duplicate",
      needsInfo: false,
      summary: `${label}, step 3 of 3`,
    };
  }

  const current = OPEN_INDEX[status] ?? 0;
  const ended = status === "REWARDED";
  return {
    steps: OPEN_PATH.map((step, index) => ({
      ...step,
      state: stateAt(index, current, ended),
    })),
    currentIndex: current,
    outcome: ended ? "rewarded" : "open",
    needsInfo: status === "NEEDS_INFO",
    summary: `${label}, step ${current + 1} of ${OPEN_PATH.length}`,
  };
}
