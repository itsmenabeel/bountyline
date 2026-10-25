"use client";

import { CircleAlertIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export interface Failure {
  message: string;
  /** Changes on every failed attempt, so a repeated message still takes focus. */
  attempt: number;
}

/** A failed submit's message. It takes focus, so keyboard and screen reader users land on it. */
export function FailureAlert({
  failure,
  className,
}: {
  failure: Failure;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refocus on each new attempt.
  useEffect(() => {
    ref.current?.focus();
  }, [failure.attempt]);

  return (
    <Alert
      ref={ref}
      tabIndex={-1}
      variant="destructive"
      className={cn(
        "outline-none focus-visible:ring-3 focus-visible:ring-ring/70",
        className,
      )}
    >
      <CircleAlertIcon aria-hidden="true" />
      <AlertDescription>{failure.message}</AlertDescription>
    </Alert>
  );
}
