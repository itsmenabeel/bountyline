"use client";

import { useEffect } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

/** What a wizard hands each of its form steps. */
export interface WizardStepProps<T> {
  /** The draft's values for this step, as last typed. */
  values: T;
  /** Called on every change, so the draft survives a reload or a trip elsewhere. */
  onChange: (values: T) => void;
  /** Called after the step's fields pass validation. */
  onContinue: () => void;
  onBack?: () => void;
}

/** Copies every change into the wizard's draft, without re-rendering the form. */
export function useDraftSync<T extends FieldValues>(
  // Pick, so forms whose resolver transforms their values fit too.
  form: Pick<UseFormReturn<T>, "subscribe">,
  onChange: (values: T) => void,
) {
  const { subscribe } = form;
  useEffect(
    () =>
      subscribe({
        formState: { values: true },
        // RHF hands over its own values object and keeps mutating it; the draft needs a copy.
        callback: ({ values }) => onChange(structuredClone(values)),
      }),
    [subscribe, onChange],
  );
}
