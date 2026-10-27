"use client";

import { useState } from "react";
import type { FieldErrors, FieldValues, UseFormReturn } from "react-hook-form";
import type { SummaryError } from "@/components/shared/error-summary";
import { flattenFieldErrors } from "@/lib/forms";

/** Maps an error path ("inScope.2.value") to the element to focus and the label to show. */
export type ErrorTarget = (path: string) => { id: string; label: string };

function summarize<T extends FieldValues>(
  errors: FieldErrors<T>,
  target: ErrorTarget,
): SummaryError[] {
  const byId = new Map<string, SummaryError>();
  for (const { path, message } of flattenFieldErrors(errors)) {
    const { id, label } = target(path);
    // A list's own error and its first row's error point at the same input.
    if (!byId.has(id)) byId.set(id, { id, label, message });
  }
  return [...byId.values()];
}

/**
 * Focus handling for a failed submit (design-plan §9.1): one error focuses its field, more
 * than one shows an ErrorSummary that takes focus. Pair with `shouldFocusError: false`. The
 * summary tracks the live errors, so it shrinks as the person fixes fields.
 */
export function useErrorSummary<T extends FieldValues>(
  // Pick, so forms whose resolver transforms their values fit too.
  form: Pick<UseFormReturn<T>, "formState">,
  target: ErrorTarget,
) {
  const [attempt, setAttempt] = useState(0);
  const live = summarize(form.formState.errors, target);

  const onInvalid = (errors: FieldErrors<T>) => {
    const failed = summarize(errors, target);
    if (failed.length === 1 && failed[0]) {
      document.getElementById(failed[0].id)?.focus();
      return;
    }
    setAttempt((count) => count + 1);
  };

  return {
    /** Empty until a submit has failed with several errors. */
    errors: attempt > 0 ? live : [],
    attempt,
    onInvalid,
  };
}
