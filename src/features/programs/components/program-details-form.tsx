"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Controller, type FieldErrors, useForm } from "react-hook-form";
import { toast } from "sonner";
import { ErrorSummary } from "@/components/shared/error-summary";
import { type Failure, FailureAlert } from "@/components/shared/failure-alert";
import {
  MarkdownEditor,
  type MarkdownTab,
} from "@/components/shared/markdown-editor";
import { PendingLabel } from "@/components/shared/pending-label";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { type ErrorTarget, useErrorSummary } from "@/hooks/use-error-summary";
import { clientRequest } from "@/lib/api/client";
import { describedBy } from "@/lib/forms";
import type { Program } from "@/types/api";
import { programEndpoints } from "../endpoints";
import { saveFailureMessage } from "../save-failure";
import {
  PROGRAM_TITLE,
  type ProgramBasicsValues,
  programBasicsSchema,
} from "../schemas";
import { useSavedProgram } from "../use-saved-program";
import { SettingsActions } from "./settings-section";

const FIELDS = ["title", "description"] as const;

const target: ErrorTarget = (path) =>
  path.startsWith("description")
    ? { id: "settings-description", label: "Description" }
    : { id: "settings-title", label: "Program name" };

/** Name and description, saved with PATCH /programs/:id. */
export function ProgramDetailsForm({ program }: { program: Program }) {
  const saved = useSavedProgram();
  const [tab, setTab] = useState<MarkdownTab>("write");
  const [failure, setFailure] = useState<Failure | null>(null);
  const attempts = useRef(0);
  const form = useForm({
    resolver: zodResolver(programBasicsSchema),
    mode: "onTouched",
    shouldFocusError: false,
    defaultValues: { title: program.title, description: program.description },
  });
  const summary = useErrorSummary(form, target);

  const save = useMutation({
    mutationFn: (values: ProgramBasicsValues) =>
      clientRequest(programEndpoints.update(program.id, values)),
    meta: { silentToast: true },
    onSuccess: (updated) => {
      saved(updated);
      form.reset({ title: updated.title, description: updated.description });
      toast.success("Details saved");
    },
    onError: (error) => {
      for (const field of FIELDS) {
        const message = error.fieldErrors[field];
        if (message) form.setError(field, { message });
      }
      attempts.current += 1;
      setFailure({
        message: saveFailureMessage(error),
        attempt: attempts.current,
      });
    },
  });

  const onInvalid = (errors: FieldErrors<ProgramBasicsValues>) => {
    // The description can't take focus while Preview hides it.
    if (errors.description && tab !== "write") {
      setTab("write");
      requestAnimationFrame(() => summary.onInvalid(errors));
      return;
    }
    summary.onInvalid(errors);
  };

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) => {
        if (save.isPending) return;
        setFailure(null);
        save.mutate(values);
      }, onInvalid)}
      className="flex flex-col gap-5"
    >
      {summary.errors.length > 0 && (
        <ErrorSummary errors={summary.errors} attempt={summary.attempt} />
      )}
      <FieldGroup>
        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="settings-title">Program name</FieldLabel>
              <Input
                {...field}
                id="settings-title"
                autoComplete="off"
                aria-invalid={fieldState.invalid}
                aria-describedby={describedBy(
                  "settings-title-help",
                  fieldState.error && "settings-title-error",
                )}
              />
              <FieldDescription id="settings-title-help">
                Use {PROGRAM_TITLE.min} to {PROGRAM_TITLE.max} characters.
              </FieldDescription>
              <FieldError
                id="settings-title-error"
                errors={[fieldState.error]}
              />
            </Field>
          )}
        />
        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="settings-description">
                Description
              </FieldLabel>
              <MarkdownEditor
                {...field}
                tab={tab}
                onTabChange={setTab}
                id="settings-description"
                rows={10}
                className="min-h-56"
                aria-invalid={fieldState.invalid}
                aria-describedby={describedBy(
                  "settings-description-help",
                  fieldState.error && "settings-description-error",
                )}
              />
              <FieldDescription id="settings-description-help">
                Markdown works here.
              </FieldDescription>
              <FieldError
                id="settings-description-error"
                errors={[fieldState.error]}
              />
            </Field>
          )}
        />
      </FieldGroup>
      {failure && <FailureAlert failure={failure} />}
      <SettingsActions>
        <Button
          type="submit"
          size="lg"
          aria-disabled={save.isPending || undefined}
        >
          {save.isPending ? (
            <PendingLabel>Saving</PendingLabel>
          ) : (
            "Save details"
          )}
        </Button>
      </SettingsActions>
    </form>
  );
}
