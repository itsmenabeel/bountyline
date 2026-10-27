import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const REPORT_WIZARD_STEPS = [
  "Program and scope",
  "Write-up",
  "Review",
] as const;

export type ReportWizardStep = 0 | 1 | 2;

/** One program's report in progress, with the fields as typed. */
export interface ReportDraft {
  step: ReportWizardStep;
  inScope: boolean;
  title: string;
  description: string;
}

export const EMPTY_REPORT_DRAFT: ReportDraft = {
  step: 0,
  inScope: false,
  title: "",
  description: "",
};

/** True once the researcher has written anything worth keeping. */
export function reportDraftHasContent(draft: ReportDraft | undefined) {
  return Boolean(draft && (draft.title.trim() || draft.description.trim()));
}

interface ReportDraftState {
  /** Keyed by program id, so each program's "Submit a report" opens its own draft. */
  drafts: Record<string, ReportDraft>;
  save: (programId: string, patch: Partial<ReportDraft>) => void;
  discard: (programId: string) => void;
}

/**
 * Report drafts per program (design-plan §9.1), in sessionStorage like the program wizard's
 * draft: they survive a reload or a trip elsewhere in the tab. `skipHydration` keeps the
 * server render stable; ReportWizard rehydrates after mount.
 */
export const useReportDraftStore = create<ReportDraftState>()(
  persist(
    (set) => ({
      drafts: {},
      save: (programId, patch) =>
        set((state) => ({
          drafts: {
            ...state.drafts,
            [programId]: {
              ...(state.drafts[programId] ?? EMPTY_REPORT_DRAFT),
              ...patch,
            },
          },
        })),
      discard: (programId) =>
        set((state) => {
          const { [programId]: _gone, ...drafts } = state.drafts;
          return { drafts };
        }),
    }),
    {
      name: "bountyline-report-drafts",
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ drafts }) => ({ drafts }),
      skipHydration: true,
    },
  ),
);
