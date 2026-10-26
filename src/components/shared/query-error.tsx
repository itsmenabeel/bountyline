"use client";

import { CircleAlertIcon, RotateCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ApiError } from "@/lib/api/errors";

/**
 * In place of a list whose data never arrived (a failed refresh of data already on screen
 * toasts instead and keeps the rows). States the cause and offers the retry.
 */
export function QueryError({
  title,
  error,
  onRetry,
  retrying,
}: {
  title: string;
  error: ApiError;
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <Alert variant="destructive" role="alert">
      <CircleAlertIcon aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-3">
        <p>{error.userMessage}</p>
        <Button variant="outline" onClick={onRetry} disabled={retrying}>
          <RotateCcw aria-hidden="true" />
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  );
}
