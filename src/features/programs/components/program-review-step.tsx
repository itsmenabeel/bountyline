"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  CircleCheckIcon,
  CircleIcon,
  CircleXIcon,
  Loader2Icon,
} from "lucide-react";
import { type ReactNode, useRef, useState } from "react";
import { toast } from "sonner";
import { type Failure, FailureAlert } from "@/components/shared/failure-alert";
import { LazyMarkdownView } from "@/components/shared/lazy-markdown-view";
import { Money } from "@/components/shared/money";
import { PendingLabel } from "@/components/shared/pending-label";
import { SeverityBadge } from "@/components/shared/severity-badge";
import { WizardActions } from "@/components/shared/wizard-shell";
import { Button } from "@/components/ui/button";
import { clientRequest } from "@/lib/api/client";
import type { Program, RewardTier } from "@/types/api";
import {
  CreateProgramFailure,
  type CreateStage,
  createProgram,
  type StageProgress,
  type StageState,
} from "../create-program";
import { programKeys } from "../queries";
import type { CreateProgramRequest } from "../schemas";

const STAGE_LABEL: Record<CreateStage, string> = {
  create: "Create the program",
  tiers: "Save reward tiers",
  publish: "Publish",
};

const STATE_LABEL: Record<StageState, string> = {
  waiting: "waiting",
  running: "in progress",
  done: "done",
  failed: "failed",
};

function StageIcon({ state }: { state: StageState }) {
  if (state === "running")
    return <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />;
  if (state === "done")
    return (
      <CircleCheckIcon aria-hidden="true" className="size-4 text-primary" />
    );
  if (state === "failed")
    return (
      <CircleXIcon aria-hidden="true" className="size-4 text-destructive" />
    );
  return (
    <CircleIcon aria-hidden="true" className="size-4 text-muted-foreground" />
  );
}

/** Where the owner lands, and what the toast says, when a later call fails. */
function partialFailure(failure: CreateProgramFailure, title: string) {
  if (failure.stage === "tiers") {
    return `We created "${title}" as a draft but couldn't save its reward tiers. Set them in Settings, then publish.`;
  }
  return `We created "${title}" with its reward tiers but couldn't publish it. Publish it from Settings.`;
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
      <dl className="flex flex-col gap-4 text-sm">{children}</dl>
    </section>
  );
}

function Item({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <dt className="text-muted-foreground">{term}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

function Assets({ assets, empty }: { assets: string[]; empty: string }) {
  if (assets.length === 0) {
    return <span className="text-muted-foreground">{empty}</span>;
  }
  return (
    <ul className="flex flex-col divide-y rounded-lg border">
      {assets.map((asset) => (
        <li
          key={asset}
          className="px-3 py-2 font-mono [overflow-wrap:anywhere]"
        >
          {asset}
        </li>
      ))}
    </ul>
  );
}

/**
 * Steps 1 to 3 as they'll be saved, each with an Edit button back to its step, then the
 * choice to publish or keep a draft. Submitting runs the three backend calls and shows each
 * one's progress. A failure after the program exists hands the owner to its page (`onDone`)
 * with a toast naming the call that failed, since running the wizard again would create a
 * second program.
 */
export function ProgramReviewStep({
  program,
  tiers,
  onEdit,
  onBack,
  onDone,
  onPendingChange,
}: {
  program: CreateProgramRequest;
  tiers: RewardTier[];
  onEdit: (step: 0 | 1 | 2) => void;
  onBack: () => void;
  /** Called once the program exists and the wizard should hand over to its page. */
  onDone: (created: Program, tab?: "settings") => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"publish" | "draft" | null>(null);
  const [progress, setProgress] = useState<StageProgress>({});
  const [failure, setFailure] = useState<Failure | null>(null);
  const attempts = useRef(0);
  const pending = mode !== null;
  // Highest reward first, as the program page lists them.
  const sortedTiers = [...tiers].sort((a, b) => b.amount - a.amount);
  const { inScope, outOfScope, rules } = program.scope;

  async function submit(publish: boolean) {
    if (pending) return;
    setMode(publish ? "publish" : "draft");
    onPendingChange(true);
    setFailure(null);
    try {
      const created = await createProgram(
        { program, tiers, publish },
        clientRequest,
        setProgress,
      );
      await queryClient.invalidateQueries({ queryKey: programKeys.all });
      toast.success(publish ? "Program published" : "Draft saved");
      onDone(created);
    } catch (error) {
      if (!(error instanceof CreateProgramFailure)) throw error;
      if (error.program) {
        await queryClient.invalidateQueries({ queryKey: programKeys.all });
        toast.error(partialFailure(error, error.program.title), {
          description: error.error.userMessage,
          duration: 10_000,
        });
        onDone(error.program, "settings");
        return;
      }
      attempts.current += 1;
      setFailure({
        message: `We couldn't create the program. ${error.error.userMessage}`,
        attempt: attempts.current,
      });
      setMode(null);
      onPendingChange(false);
    }
  }

  const stages = Object.entries(progress) as [CreateStage, StageState][];

  return (
    <div className="flex flex-col gap-6">
      <ReviewSection
        title="Basics"
        editLabel="Edit basics"
        onEdit={pending ? undefined : () => onEdit(0)}
      >
        <Item term="Program name">
          <span className="font-medium">{program.title}</span>
        </Item>
        <Item term="Description">
          <div className="max-h-72 overflow-y-auto">
            <LazyMarkdownView source={program.description} />
          </div>
        </Item>
      </ReviewSection>

      <ReviewSection
        title="Scope"
        editLabel="Edit scope"
        onEdit={pending ? undefined : () => onEdit(1)}
      >
        <Item term="In scope">
          <Assets assets={inScope} empty="Nothing listed." />
        </Item>
        <Item term="Out of scope">
          <Assets assets={outOfScope} empty="Nothing listed." />
        </Item>
        <Item term="Rules">
          {rules ? (
            <LazyMarkdownView source={rules} />
          ) : (
            <span className="text-muted-foreground">No rules added.</span>
          )}
        </Item>
      </ReviewSection>

      <ReviewSection
        title="Reward tiers"
        editLabel="Edit reward tiers"
        onEdit={pending ? undefined : () => onEdit(2)}
      >
        <Item term="Reward per severity">
          <ul className="flex flex-col divide-y">
            {sortedTiers.map((tier) => (
              <li
                key={tier.severity}
                className="flex items-center justify-between gap-4 py-2"
              >
                <SeverityBadge severity={tier.severity} />
                <Money cents={tier.amount} />
              </li>
            ))}
          </ul>
        </Item>
      </ReviewSection>

      <p className="max-w-prose text-sm text-muted-foreground">
        A published program appears in the directory, and researchers can report
        against it. A draft stays private to you until you publish it. The pool
        starts at $0.00 in both cases; fund it from the program page.
      </p>

      {stages.length > 0 && (
        <div aria-live="polite">
          <ol aria-label="Progress" className="flex flex-col gap-2 text-sm">
            {stages.map(([stage, state]) => (
              <li key={stage} className="flex items-center gap-2">
                <StageIcon state={state} />
                <span
                  className={
                    state === "waiting" ? "text-muted-foreground" : undefined
                  }
                >
                  {STAGE_LABEL[stage]}
                </span>
                <span className="sr-only">: {STATE_LABEL[state]}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {failure && <FailureAlert failure={failure} />}

      <WizardActions onBack={onBack} backDisabled={pending}>
        <Button
          type="button"
          variant="outline"
          size="lg"
          aria-disabled={pending || undefined}
          onClick={() => void submit(false)}
        >
          {mode === "draft" ? (
            <PendingLabel>Saving draft</PendingLabel>
          ) : (
            "Save as draft"
          )}
        </Button>
        <Button
          type="button"
          size="lg"
          aria-disabled={pending || undefined}
          onClick={() => void submit(true)}
        >
          {mode === "publish" ? (
            <PendingLabel>Publishing</PendingLabel>
          ) : (
            "Publish program"
          )}
        </Button>
      </WizardActions>
    </div>
  );
}
