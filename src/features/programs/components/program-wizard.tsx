"use client";

import { HistoryIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LoadingFrame } from "@/components/shared/page-skeleton";
import { PendingLabel } from "@/components/shared/pending-label";
import { WizardShell } from "@/components/shared/wizard-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import {
  PROGRAM_WIZARD_STEPS,
  type ProgramWizardStep,
  useProgramWizardStore,
} from "@/stores/program-wizard-store";
import type { Program } from "@/types/api";
import {
  draftHasContent,
  type ProgramDraft,
  parseProgramDraft,
} from "../schemas";
import { ProgramBasicsStep } from "./program-basics-step";
import { ProgramReviewStep } from "./program-review-step";
import { ProgramScopeStep } from "./program-scope-step";
import { ProgramTiersStep } from "./program-tiers-step";

const STEP_DESCRIPTION: Record<ProgramWizardStep, string> = {
  0: "Name the program and tell researchers what it covers.",
  1: "List the assets researchers may test and the ones they must leave alone.",
  2: "Set what each severity pays. The triage team rates each valid report and pays it from your pool.",
  3: "Check the details, then publish the program or keep it as a draft.",
};

/** The step frame with grey blocks where the fields go, before the saved draft loads. */
export function ProgramWizardSkeleton() {
  return (
    <LoadingFrame>
      <div className="flex items-center gap-2">
        {PROGRAM_WIZARD_STEPS.map((step) => (
          <Skeleton key={step} className="h-7 flex-1 rounded-full" />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-full max-w-sm" />
      </div>
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-72 w-full" />
    </LoadingFrame>
  );
}

/**
 * The four-step new-program flow (design-plan §9.1). The draft lives in a sessionStorage
 * store, so a reload or a visit to another page keeps it; it loads after mount to keep the
 * server render stable. Each step remounts from the draft, so Back and the step list never
 * lose what was typed.
 */
export function ProgramWizard() {
  const [ready, setReady] = useState(false);
  const [resumed, setResumed] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.resolve(useProgramWizardStore.persist.rehydrate()).then(() => {
      if (!active) return;
      setResumed(draftHasContent(useProgramWizardStore.getState().draft));
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!ready) return <ProgramWizardSkeleton />;
  return <WizardSteps resumed={resumed} />;
}

function WizardSteps({ resumed }: { resumed: boolean }) {
  const router = useRouter();
  const step = useProgramWizardStore((state) => state.step);
  const draft = useProgramWizardStore((state) => state.draft);
  const setStep = useProgramWizardStore((state) => state.setStep);
  const saveSection = useProgramWizardStore((state) => state.saveSection);
  const reset = useProgramWizardStore((state) => state.reset);
  const [showResumed, setShowResumed] = useState(resumed);
  // Bumped by "Start over", so the step's form remounts with the empty draft.
  const [generation, setGeneration] = useState(0);
  const [leaving, setLeaving] = useState(false);
  // While the review step's calls run, the step list can't send the owner elsewhere.
  const [submitting, setSubmitting] = useState(false);

  useUnsavedChanges(!leaving && draftHasContent(draft));

  // The step forms read their values once, when they mount; these keep them stable.
  const saveBasics = useCallback(
    (values: ProgramDraft["basics"]) => saveSection("basics", values),
    [saveSection],
  );
  const saveScope = useCallback(
    (values: ProgramDraft["scope"]) => saveSection("scope", values),
    [saveSection],
  );
  const saveTiers = useCallback(
    (values: ProgramDraft["tiers"]) => saveSection("tiers", values),
    [saveSection],
  );

  const parsed = useMemo(
    () => (step === 3 ? parseProgramDraft(draft) : null),
    [step, draft],
  );
  // A stored draft that no longer passes (edited storage, older rules) goes back to the
  // first step that needs fixing.
  useEffect(() => {
    if (parsed && !parsed.ok) setStep(parsed.step);
  }, [parsed, setStep]);

  const onDone = (program: Program, tab?: "settings") => {
    setLeaving(true);
    reset();
    router.push(`/owner/programs/${program.id}${tab ? `?tab=${tab}` : ""}`);
  };

  if (leaving) {
    return (
      <output className="flex items-center gap-2 text-sm">
        <PendingLabel>Opening the program page</PendingLabel>
      </output>
    );
  }

  const key = `${generation}-${step}`;
  const back =
    step > 0 ? () => setStep((step - 1) as ProgramWizardStep) : undefined;

  return (
    <div className="flex flex-col gap-6">
      {showResumed && (
        // A plain notice: it shows on load, so an alert role would interrupt the page.
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border bg-card px-3 py-2 text-sm">
          <p className="flex items-start gap-2 font-medium">
            <HistoryIcon
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />
            You're picking up a draft from earlier in this tab.
          </p>
          <ConfirmDialog
            trigger={<Button variant="outline">Start over</Button>}
            title="Discard this draft?"
            description="You'll lose the name, scope, and rewards you entered. You can't undo this."
            confirmLabel="Discard draft"
            pendingLabel="Discarding"
            destructive
            onConfirm={async () => {
              reset();
              setGeneration((count) => count + 1);
              setShowResumed(false);
            }}
          />
        </div>
      )}

      <WizardShell
        steps={PROGRAM_WIZARD_STEPS}
        current={step}
        onStepSelect={
          submitting ? undefined : (next) => setStep(next as ProgramWizardStep)
        }
        description={STEP_DESCRIPTION[step]}
      >
        {step === 0 && (
          <ProgramBasicsStep
            key={key}
            values={draft.basics}
            onChange={saveBasics}
            onContinue={() => setStep(1)}
          />
        )}
        {step === 1 && (
          <ProgramScopeStep
            key={key}
            values={draft.scope}
            onChange={saveScope}
            onContinue={() => setStep(2)}
            onBack={back}
          />
        )}
        {step === 2 && (
          <ProgramTiersStep
            key={key}
            values={draft.tiers}
            onChange={saveTiers}
            onContinue={() => setStep(3)}
            onBack={back}
          />
        )}
        {step === 3 && parsed?.ok && (
          <ProgramReviewStep
            key={key}
            program={parsed.program}
            tiers={parsed.tiers}
            onEdit={setStep}
            onBack={() => setStep(2)}
            onDone={onDone}
            onPendingChange={setSubmitting}
          />
        )}
      </WizardShell>
    </div>
  );
}
