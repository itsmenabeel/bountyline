"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useRef, useState } from "react";
import { toast } from "sonner";
import { type Failure, FailureAlert } from "@/components/shared/failure-alert";
import { LazyMarkdownView } from "@/components/shared/lazy-markdown-view";
import { PendingLabel } from "@/components/shared/pending-label";
import { WizardActions } from "@/components/shared/wizard-shell";
import { Button } from "@/components/ui/button";
import { clientRequest } from "@/lib/api/client";
import type { ApiError } from "@/lib/api/errors";
import type { Program, Report } from "@/types/api";
import { reportEndpoints } from "../endpoints";
import { reportKeys } from "../queries";
import type { ReportWriteupInput } from "../schemas";

/** The submit failures a researcher can act on, in words; the rest use the API's message. */
function failureMessage(error: ApiError) {
  const kept = "Your draft stays saved in this tab.";
  if (error.status === 409) {
    return `This program stopped taking reports while you wrote yours. ${kept}`;
  }
  if (error.status === 404) {
    return `This program isn't available any more. ${kept}`;
  }
  if (error.status === 429) {
    return `You've reached the limit of 10 reports an hour. ${kept} Submit it later.`;
  }
  return `We couldn't submit the report. ${error.userMessage}`;
}

function ReviewSection({
  title,
  editLabel,
  onEdit,
  children,
}: {
  title: string;
  editLabel: string;
  onEdit?: () => void;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-base font-semibold">{title}</h3>
        {onEdit && (
          <Button
            type="button"
            variant="ghost"
            onClick={onEdit}
            aria-label={editLabel}
          >
            Edit
          </Button>
        )}
      </div>
      {children}
    </section>
  );
}

/**
 * Step 3 of the report wizard: the report as triage will read it, with Edit buttons back to
 * each step, and the submit. A failed submit keeps the draft, so nothing typed is lost.
 */
export function ReportReviewStep({
  program,
  writeup,
  onEdit,
  onBack,
  onDone,
  onPendingChange,
}: {
  program: Program;
  writeup: ReportWriteupInput;
  onEdit: (step: 0 | 1) => void;
  onBack: () => void;
  /** Called with the new report once it exists. */
  onDone: (report: Report) => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [failure, setFailure] = useState<Failure | null>(null);
  const attempts = useRef(0);

  const submit = useMutation({
    mutationFn: () =>
      clientRequest(
        reportEndpoints.create({ programId: program.id, ...writeup }),
      ),
    // The step shows its own failure; a toast on top would say it twice.
    meta: { silentToast: true },
    onMutate: () => {
      setFailure(null);
      onPendingChange(true);
    },
    onSuccess: async (report) => {
      await queryClient.invalidateQueries({ queryKey: reportKeys.all });
      toast.success("Report submitted");
      onDone(report);
    },
    onError: (error) => {
      attempts.current += 1;
      setFailure({ message: failureMessage(error), attempt: attempts.current });
      onPendingChange(false);
    },
  });
  const pending = submit.isPending || submit.isSuccess;

  return (
    <div className="flex flex-col gap-6">
      <ReviewSection
        title="Program"
        editLabel="Change program"
        onEdit={pending ? undefined : () => onEdit(0)}
      >
        <div className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{program.title}</span>
          <span className="text-muted-foreground">
            Run by {program.owner.name}. You confirmed the finding targets an
            in-scope asset.
          </span>
        </div>
      </ReviewSection>

      <ReviewSection
        title="Write-up"
        editLabel="Edit write-up"
        onEdit={pending ? undefined : () => onEdit(1)}
      >
        <dl className="flex flex-col gap-4 text-sm">
          <div className="flex flex-col gap-1.5">
            <dt className="text-muted-foreground">Title</dt>
            <dd className="font-medium [overflow-wrap:anywhere]">
              {writeup.title}
            </dd>
          </div>
          <div className="flex flex-col gap-1.5">
            <dt className="text-muted-foreground">Write-up</dt>
            <dd className="min-w-0">
              <LazyMarkdownView source={writeup.description} />
            </dd>
          </div>
        </dl>
      </ReviewSection>

      <p className="max-w-prose text-sm text-muted-foreground">
        The triage team rates the severity and decides the outcome. You can edit
        or delete the report until they pick it up.
      </p>

      {failure && <FailureAlert failure={failure} />}

      <WizardActions onBack={onBack} backDisabled={pending}>
        <Button
          type="button"
          size="lg"
          aria-disabled={pending || undefined}
          onClick={() => {
            if (!pending) submit.mutate();
          }}
        >
          {pending ? <PendingLabel>Submitting</PendingLabel> : "Submit report"}
        </Button>
      </WizardActions>
    </div>
  );
}
