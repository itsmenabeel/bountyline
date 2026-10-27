"use client";

import { useQuery } from "@tanstack/react-query";
import { Radar } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DraftNotice } from "@/components/shared/draft-notice";
import { EmptyState } from "@/components/shared/empty-state";
import { WizardSkeleton } from "@/components/shared/page-skeleton";
import { PendingLabel } from "@/components/shared/pending-label";
import { QueryError } from "@/components/shared/query-error";
import { WizardShell } from "@/components/shared/wizard-shell";
import { Button } from "@/components/ui/button";
import { programOptionsQuery } from "@/features/programs/queries";
import { useRehydrated } from "@/hooks/use-rehydrated";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { clientQuery } from "@/lib/query/descriptor";
import {
  EMPTY_REPORT_DRAFT,
  REPORT_WIZARD_STEPS,
  type ReportDraft,
  type ReportWizardStep,
  reportDraftHasContent,
  useReportDraftStore,
} from "@/stores/report-draft-store";
import type { Program, Report } from "@/types/api";
import { newReportHref } from "../links";
import { reportWriteupSchema } from "../schemas";
import { ReportProgramStep } from "./report-program-step";
import { ReportReviewStep } from "./report-review-step";
import { ReportWriteupStep } from "./report-writeup-step";

const STEP_DESCRIPTION: Record<ReportWizardStep, string> = {
  0: "Pick the program and check your finding against its scope.",
  1: "Describe the bug so the triage team can reproduce it.",
  2: "Check the report, then send it to the triage team.",
};

export function ReportWizardSkeleton() {
  return <WizardSkeleton steps={REPORT_WIZARD_STEPS.length} />;
}

/**
 * The three-step report submission (design-plan §9.1). `?programId=` picks the program, and
 * each program keeps its own draft in a sessionStorage store, so "Submit a report" on two
 * program pages opens two separate drafts. The program list comes from the server prefetch.
 */
export function ReportWizard({
  initialProgramId,
}: {
  initialProgramId: string | null;
}) {
  const ready = useRehydrated(useReportDraftStore.persist);
  const programs = useQuery(clientQuery(programOptionsQuery()));

  if (programs.isError) {
    return (
      <QueryError
        title="We couldn't load the programs taking reports."
        error={programs.error}
        onRetry={() => void programs.refetch()}
        retrying={programs.isFetching}
      />
    );
  }
  if (!ready || !programs.data) return <ReportWizardSkeleton />;

  const items = programs.data.items;
  if (items.length === 0) {
    return (
      <div className="rounded-xl border bg-card">
        <EmptyState
          icon={Radar}
          title="No program is taking reports right now."
          description="Programs show in the directory once an owner publishes one."
        />
      </div>
    );
  }

  const known = items.some((program) => program.id === initialProgramId);
  const programId = known ? initialProgramId : null;
  // Read once: WizardSteps keeps the first value, so typing doesn't bring the notice back.
  const draft = programId
    ? useReportDraftStore.getState().drafts[programId]
    : undefined;
  return (
    <WizardSteps
      programs={items}
      initialProgramId={programId}
      unavailable={Boolean(initialProgramId) && !known}
      resumed={reportDraftHasContent(draft)}
    />
  );
}

function WizardSteps({
  programs,
  initialProgramId,
  unavailable,
  resumed,
}: {
  programs: Program[];
  initialProgramId: string | null;
  /** The link named a program that isn't taking reports (paused, closed, or gone). */
  unavailable: boolean;
  resumed: boolean;
}) {
  const router = useRouter();
  const [programId, setProgramId] = useState(initialProgramId);
  const stored = useReportDraftStore((state) =>
    programId ? state.drafts[programId] : undefined,
  );
  const save = useReportDraftStore((state) => state.save);
  const discard = useReportDraftStore((state) => state.discard);
  const draft: ReportDraft = stored ?? EMPTY_REPORT_DRAFT;
  const program = programs.find((item) => item.id === programId);
  const step: ReportWizardStep = program ? draft.step : 0;

  const [showResumed, setShowResumed] = useState(resumed);
  const [showUnavailable, setShowUnavailable] = useState(unavailable);
  // Bumped by "Start over", so the step's form remounts with the empty draft.
  const [generation, setGeneration] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useUnsavedChanges(!leaving && reportDraftHasContent(stored));

  const setStep = useCallback(
    (next: ReportWizardStep) => {
      if (programId) save(programId, { step: next });
    },
    [programId, save],
  );
  const saveWriteup = useCallback(
    (values: { title: string; description: string }) => {
      if (programId) save(programId, values);
    },
    [programId, save],
  );

  const writeup = useMemo(
    () => (step === 2 ? reportWriteupSchema.safeParse(draft) : null),
    [step, draft],
  );

  const onProgramChange = (next: string) => {
    setProgramId(next);
    setShowUnavailable(false);
    setShowResumed(false);
    // A program's own draft opens at step 1 from here; the researcher is choosing now.
    save(next, { step: 0 });
    // Keeps reloads and shared links on this program. Next syncs useSearchParams with
    // native history calls, so this skips a server round trip.
    window.history.replaceState(null, "", newReportHref(next));
  };

  const onDone = (report: Report) => {
    setLeaving(true);
    if (programId) discard(programId);
    router.push(`/researcher/reports/${report.id}`);
  };

  if (leaving) {
    return (
      <output className="flex items-center gap-2 text-sm">
        <PendingLabel>Opening your report</PendingLabel>
      </output>
    );
  }

  const key = `${generation}-${step}`;

  return (
    <div className="flex flex-col gap-6">
      {showResumed && program && (
        <DraftNotice
          message={`You're picking up your draft for ${program.title} from earlier in this tab.`}
          discardDescription="You'll lose the title and write-up you entered for this program. You can't undo this."
          onDiscard={() => {
            discard(program.id);
            setGeneration((count) => count + 1);
            setShowResumed(false);
          }}
        />
      )}
      {showUnavailable && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border bg-card px-3 py-2 text-sm">
          <p className="font-medium">
            The program in that link isn't taking reports right now. Pick
            another one below.
          </p>
          <Button asChild variant="outline">
            <Link href="/researcher/programs">Browse programs</Link>
          </Button>
        </div>
      )}

      <WizardShell
        steps={REPORT_WIZARD_STEPS}
        current={step}
        onStepSelect={
          submitting ? undefined : (next) => setStep(next as ReportWizardStep)
        }
        description={STEP_DESCRIPTION[step]}
      >
        {step === 0 && (
          <ReportProgramStep
            key={key}
            programs={programs}
            values={{ programId: programId ?? "", inScope: draft.inScope }}
            savedInScope={(id) =>
              useReportDraftStore.getState().drafts[id]?.inScope ?? false
            }
            onProgramChange={onProgramChange}
            onInScopeChange={(inScope) => {
              if (programId) save(programId, { inScope });
            }}
            onContinue={() => setStep(1)}
          />
        )}
        {step === 1 && (
          <ReportWriteupStep
            key={key}
            values={{ title: draft.title, description: draft.description }}
            onChange={saveWriteup}
            onContinue={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && program && (
          <WriteupReview
            key={key}
            program={program}
            writeup={writeup}
            onEdit={setStep}
            onDone={onDone}
            onPendingChange={setSubmitting}
          />
        )}
      </WizardShell>
    </div>
  );
}

/**
 * The review step once the stored write-up passes. One that doesn't (edited storage) goes
 * back to the write-up, where Continue shows what to fix.
 */
function WriteupReview({
  program,
  writeup,
  onEdit,
  onDone,
  onPendingChange,
}: {
  program: Program;
  writeup: ReturnType<typeof reportWriteupSchema.safeParse> | null;
  onEdit: (step: ReportWizardStep) => void;
  onDone: (report: Report) => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const passes = writeup?.success ?? false;
  useEffect(() => {
    if (!passes) onEdit(1);
  }, [passes, onEdit]);

  if (!writeup?.success) return null;
  return (
    <ReportReviewStep
      program={program}
      writeup={writeup.data}
      onEdit={onEdit}
      onBack={() => onEdit(1)}
      onDone={onDone}
      onPendingChange={onPendingChange}
    />
  );
}
