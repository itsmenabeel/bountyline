"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PencilLine, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { clientRequest } from "@/lib/api/client";
import { reportEndpoints } from "../endpoints";
import { reportKeys } from "../queries";

/**
 * Edit and Delete, which the page shows only while the report is New or Needs info (the
 * backend enforces the same rule and answers a 409 if triage moved it in the meantime).
 */
export function ResearcherReportActions({
  reportId,
  title,
  editHref,
  listHref,
}: {
  reportId: string;
  title: string;
  editHref: string;
  listHref: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: () => clientRequest(reportEndpoints.remove(reportId)),
    onSuccess: () => {
      // The comment thread is still mounted; refetching it now would 404 and toast.
      queryClient.removeQueries({ queryKey: reportKeys.comments(reportId) });
      void queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
      toast.success("Report deleted");
      router.replace(listHref);
    },
  });

  return (
    <div className="flex flex-col gap-2 border-t pt-4">
      <Button asChild variant="outline">
        <Link href={editHref}>
          <PencilLine aria-hidden="true" />
          Edit report
        </Link>
      </Button>
      <ConfirmDialog
        trigger={
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 aria-hidden="true" />
            Delete report
          </Button>
        }
        title="Delete this report?"
        description={
          <>
            &ldquo;{title}&rdquo; leaves the triage queue and its comments go
            with it. You can&apos;t undo this.
          </>
        }
        confirmLabel="Delete report"
        pendingLabel="Deleting"
        destructive
        onConfirm={() => remove.mutateAsync()}
      />
    </div>
  );
}
