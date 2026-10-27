"use client";

import { HistoryIcon } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";

/**
 * Says a wizard opened on a saved draft and offers to throw it away. A plain notice: it
 * shows on load, so an alert role would interrupt the page.
 */
export function DraftNotice({
  message,
  discardDescription,
  onDiscard,
}: {
  message: string;
  /** What the person loses, for the confirm dialog. */
  discardDescription: string;
  onDiscard: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border bg-card px-3 py-2 text-sm">
      <p className="flex items-start gap-2 font-medium">
        <HistoryIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        {message}
      </p>
      <ConfirmDialog
        trigger={<Button variant="outline">Start over</Button>}
        title="Discard this draft?"
        description={discardDescription}
        confirmLabel="Discard draft"
        pendingLabel="Discarding"
        destructive
        onConfirm={async () => onDiscard()}
      />
    </div>
  );
}
