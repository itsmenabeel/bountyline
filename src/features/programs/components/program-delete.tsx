"use client";

import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { reportCountQuery, reportKeys } from "@/features/reports/queries";
import { clientRequest } from "@/lib/api/client";
import { OPEN_REPORT_STATUSES } from "@/lib/constants/domain";
import { formatMoney } from "@/lib/money";
import { clientQuery } from "@/lib/query/descriptor";
import type { Program } from "@/types/api";
import { programEndpoints } from "../endpoints";
import { programKeys } from "../queries";

const BLOCKED =
  "You can't delete a program with money in its pool or reports still open.";

/** One count per open status (the backend filters by one status at a time). */
function openReportQueries(programId: string) {
  return OPEN_REPORT_STATUSES.map((status) =>
    clientQuery(reportCountQuery(programId, status)),
  );
}

/**
 * Delete, offered only when the backend would allow it: an empty pool and no open reports
 * (design-plan §7.4). Otherwise the button stays disabled and the card says what's in the
 * way. `onLeave` stops the page's own query first, so it can't refetch the deleted program.
 */
export function ProgramDelete({
  program,
  onLeave,
}: {
  program: Program;
  onLeave: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const counts = useQueries({ queries: openReportQueries(program.id) });
  const checking = counts.some((count) => count.isPending);
  const failed = counts.some((count) => count.isError);
  const openReports = counts.reduce(
    (sum, count) => sum + (count.data?.meta.total ?? 0),
    0,
  );

  const blockers: string[] = [];
  if (program.poolBalance > 0) {
    blockers.push(`Its pool holds ${formatMoney(program.poolBalance)}.`);
  }
  if (openReports > 0) {
    blockers.push(
      openReports === 1
        ? "1 report is still open."
        : `${openReports.toLocaleString("en-US")} reports are still open.`,
    );
  }
  const blocked = blockers.length > 0;

  const remove = useMutation({
    mutationFn: () => clientRequest(programEndpoints.remove(program.id)),
    meta: { silentToast: true },
    onSuccess: () => {
      onLeave();
      queryClient.removeQueries({ queryKey: programKeys.detail(program.id) });
      void queryClient.invalidateQueries({ queryKey: programKeys.lists() });
      toast.success("Program deleted");
      router.replace("/owner/programs");
    },
    onError: (error) => {
      toast.error(
        error.status === 409
          ? BLOCKED
          : `We couldn't delete the program. ${error.userMessage}`,
      );
      // A report may have come in since the counts loaded.
      void queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
    },
  });

  const note = checking
    ? "Checking for open reports."
    : failed
      ? "We couldn't check for open reports. Deleting still checks on the server."
      : blocked
        ? `${BLOCKED} ${blockers.join(" ")}`
        : "Deleting removes the program from your list and the directory.";

  return (
    <div className="flex flex-col gap-3">
      <p id="delete-note" className="max-w-prose text-sm text-muted-foreground">
        {note}
      </p>
      <div>
        <ConfirmDialog
          trigger={
            <Button
              variant="destructive"
              disabled={checking || blocked}
              aria-describedby="delete-note"
            >
              <Trash2 aria-hidden="true" />
              Delete program
            </Button>
          }
          title={`Delete ${program.title}?`}
          description="It leaves your programs list and the directory, and you can't undo this."
          confirmLabel="Delete program"
          pendingLabel="Deleting"
          destructive
          onConfirm={() => remove.mutateAsync()}
        />
      </div>
    </div>
  );
}
