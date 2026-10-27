"use client";

import { CircleAlertIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export interface SummaryError {
  /** The field's element id; the link focuses it. */
  id: string;
  label: string;
  message: string;
}

/**
 * Lists a form's errors after a submit with more than one problem, each linking to its field
 * (design-plan §9.1). It takes focus on each failed attempt, like FailureAlert.
 */
export function ErrorSummary({
  errors,
  attempt,
}: {
  errors: SummaryError[];
  /** Changes on every failed attempt, so the summary takes focus again. */
  attempt: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refocus on each new attempt.
  useEffect(() => {
    ref.current?.focus();
  }, [attempt]);

  return (
    <Alert
      ref={ref}
      tabIndex={-1}
      variant="destructive"
      className="outline-none focus-visible:ring-3 focus-visible:ring-ring/70"
    >
      <CircleAlertIcon aria-hidden="true" />
      <AlertTitle>
        {errors.length === 1
          ? "Fix this field to continue."
          : `Fix these ${errors.length} fields to continue.`}
      </AlertTitle>
      <AlertDescription>
        <ul className="flex flex-col gap-1">
          {errors.map((error) => (
            <li key={error.id}>
              <a
                href={`#${error.id}`}
                className="underline underline-offset-4"
                onClick={(event) => {
                  const field = document.getElementById(error.id);
                  if (!field) return;
                  event.preventDefault();
                  field.focus();
                  field.scrollIntoView({ block: "center" });
                }}
              >
                {error.label}: {error.message}
              </a>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
