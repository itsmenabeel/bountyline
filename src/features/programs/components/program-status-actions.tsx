"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { clientRequest } from "@/lib/api/client";
import type { ApiError } from "@/lib/api/errors";
import { PROGRAM_TRANSITIONS } from "@/lib/constants/domain";
import type { Program, ProgramStatus } from "@/types/api";
import { programEndpoints } from "../endpoints";
import { programKeys } from "../queries";

type Target = Exclude<ProgramStatus, "DRAFT">;

/** What each status means for researchers, as the owner reads it. */
const STATUS_NOTE: Record<ProgramStatus, string> = {
  DRAFT:
    "Only you can see this program. Publishing lists it in the directory so researchers can report against it.",
  ACTIVE:
    "Researchers can see this program and submit reports. Pausing hides it and stops new reports; reports already in triage carry on.",
  PAUSED:
    "Researchers can't see this program or submit reports until you resume it. Reports already in triage carry on.",
  CLOSED:
    "This program is closed. Researchers can't see it or submit reports, and you can't edit, fund, or reopen it.",
};

/** The button and the toast for each move, by where it starts. */
function moveCopy(from: ProgramStatus, to: Target) {
  if (to === "CLOSED")
    return { label: "Close program", done: "Program closed" };
  if (to === "PAUSED")
    return { label: "Pause program", done: "Program paused" };
  return from === "DRAFT"
    ? { label: "Publish program", done: "Program published" }
    : { label: "Resume program", done: "Program resumed" };
}

function failureMessage(error: ApiError) {
  if (error.status === 409 && /reward tiers/i.test(error.message)) {
    return "Save at least one reward tier before you publish.";
  }
  if (error.status === 409) {
    return "This program's status changed somewhere else. The page now shows where it stands.";
  }
  return `We couldn't change the status. ${error.userMessage}`;
}

/**
 * The legal moves from PROGRAM_TRANSITIONS. Publish, pause, and resume update the page
 * at once and roll back if the backend refuses (design-plan §9.3); closing is final, so it
 * asks first and waits for the answer.
 */
export function ProgramStatusActions({ program }: { program: Program }) {
  const queryClient = useQueryClient();
  const key = programKeys.detail(program.id);
  const moves = PROGRAM_TRANSITIONS[program.status];
  const noTiers = program.rewardTiers.length === 0;

  const change = useMutation<
    Program,
    ApiError,
    Target,
    { previous: Program | undefined; from: ProgramStatus }
  >({
    mutationFn: (status) =>
      clientRequest(programEndpoints.changeStatus(program.id, status)),
    meta: { silentToast: true },
    onMutate: async (status) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Program>(key);
      if (previous && status !== "CLOSED") {
        queryClient.setQueryData(key, { ...previous, status });
      }
      // The status before the optimistic change, for the toast's wording.
      return { previous, from: previous?.status ?? program.status };
    },
    onError: (error, _status, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      toast.error(failureMessage(error));
      if (error.status === 409)
        void queryClient.invalidateQueries({ queryKey: key });
    },
    onSuccess: (updated, status, context) => {
      queryClient.setQueryData(key, updated);
      toast.success(moveCopy(context.from, status).done);
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: programKeys.lists() }),
  });
  if (moves.length === 0) {
    return (
      <div className="flex flex-col gap-2 text-sm">
        <StatusBadge kind="program" status={program.status} />
        <p className="text-muted-foreground">{STATUS_NOTE[program.status]}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Status</span>
          <StatusBadge kind="program" status={program.status} />
        </div>
        <p className="max-w-prose text-muted-foreground">
          {STATUS_NOTE[program.status]}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {moves
          .filter((to) => to !== "CLOSED")
          .map((to) => {
            const { label } = moveCopy(program.status, to);
            const blocked = to === "ACTIVE" && noTiers;
            return (
              <Button
                key={to}
                variant={to === "ACTIVE" ? "default" : "outline"}
                disabled={blocked}
                aria-describedby={blocked ? "status-needs-tiers" : undefined}
                aria-disabled={change.isPending || undefined}
                onClick={() => {
                  if (!change.isPending) change.mutate(to);
                }}
              >
                {label}
              </Button>
            );
          })}
        {moves.includes("CLOSED") && (
          <ConfirmDialog
            trigger={
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive"
                disabled={change.isPending}
              >
                Close program
              </Button>
            }
            title={`Close ${program.title}?`}
            description="Researchers can't see a closed program or submit reports to it, and you can't edit, fund, or reopen it. Reports already submitted stay in triage. You can't undo this."
            confirmLabel="Close program"
            pendingLabel="Closing"
            destructive
            onConfirm={() => change.mutateAsync("CLOSED")}
          />
        )}
      </div>
      {noTiers && moves.includes("ACTIVE") && (
        <p id="status-needs-tiers" className="text-sm text-muted-foreground">
          Save at least one reward tier above before you publish.
        </p>
      )}
    </div>
  );
}
