import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  EMPTY_PROGRAM_DRAFT,
  type ProgramDraft,
} from "@/features/programs/schemas";

export const PROGRAM_WIZARD_STEPS = [
  "Basics",
  "Scope",
  "Reward tiers",
  "Review",
] as const;

export type ProgramWizardStep = 0 | 1 | 2 | 3;

interface ProgramWizardState {
  step: ProgramWizardStep;
  draft: ProgramDraft;
  setStep: (step: ProgramWizardStep) => void;
  saveSection: <K extends keyof ProgramDraft>(
    section: K,
    values: ProgramDraft[K],
  ) => void;
  reset: () => void;
}

/**
 * The new-program wizard's step and typed values (design-plan §9.1). sessionStorage keeps
 * them through a reload or a trip to another page in the same tab, and drops them with the
 * tab. `skipHydration` keeps the server render and the first client render identical;
 * ProgramWizard calls `rehydrate()` after mount and renders the steps once it resolves.
 */
export const useProgramWizardStore = create<ProgramWizardState>()(
  persist(
    (set) => ({
      step: 0,
      draft: EMPTY_PROGRAM_DRAFT,
      setStep: (step) => set({ step }),
      saveSection: (section, values) =>
        set((state) => ({ draft: { ...state.draft, [section]: values } })),
      reset: () => set({ step: 0, draft: EMPTY_PROGRAM_DRAFT }),
    }),
    {
      name: "bountyline-program-draft",
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ step, draft }) => ({ step, draft }),
      skipHydration: true,
    },
  ),
);
