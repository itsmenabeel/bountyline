"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, type FieldErrors, useForm } from "react-hook-form";
import { ErrorSummary } from "@/components/shared/error-summary";
import {
  MarkdownEditor,
  type MarkdownTab,
} from "@/components/shared/markdown-editor";
import { WizardActions } from "@/components/shared/wizard-shell";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useDraftSync, type WizardStepProps } from "@/hooks/use-draft-sync";
import { type ErrorTarget, useErrorSummary } from "@/hooks/use-error-summary";
import { describedBy } from "@/lib/forms";
import {
  PROGRAM_TITLE,
  type ProgramBasicsValues,
  programBasicsSchema,
} from "../schemas";

const target: ErrorTarget = (path) =>
  path.startsWith("description")
    ? { id: "program-description", label: "Description" }
    : { id: "program-title", label: "Program name" };

export function ProgramBasicsStep({
  values,
  onChange,
  onContinue,
}: WizardStepProps<ProgramBasicsValues>) {
  const [tab, setTab] = useState<MarkdownTab>("write");
  const form = useForm({
    resolver: zodResolver(programBasicsSchema),
    mode: "onTouched",
    shouldFocusError: false,
    defaultValues: values,
  });
  useDraftSync(form, onChange);
  const summary = useErrorSummary(form, target);

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
      onSubmit={form.handleSubmit(onContinue, onInvalid)}
      className="flex flex-col gap-6"
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
              <FieldLabel htmlFor="program-title">Program name</FieldLabel>
              <Input
                {...field}
                id="program-title"
                autoComplete="off"
                aria-invalid={fieldState.invalid}
                aria-describedby={describedBy(
                  "program-title-help",
                  fieldState.error && "program-title-error",
                )}
              />
              <FieldDescription id="program-title-help">
                Researchers see this name in the directory. Use{" "}
                {PROGRAM_TITLE.min} to {PROGRAM_TITLE.max} characters.
              </FieldDescription>
              <FieldError
                id="program-title-error"
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
              <FieldLabel htmlFor="program-description">Description</FieldLabel>
              <MarkdownEditor
                {...field}
                tab={tab}
                onTabChange={setTab}
                id="program-description"
                rows={12}
                className="min-h-64"
                aria-invalid={fieldState.invalid}
                aria-describedby={describedBy(
                  "program-description-help",
                  fieldState.error && "program-description-error",
                )}
              />
              <FieldDescription id="program-description-help">
                Markdown works here. Tell researchers what the product does and
                which parts you most want tested.
              </FieldDescription>
              <FieldError
                id="program-description-error"
                errors={[fieldState.error]}
              />
            </Field>
          )}
        />
      </FieldGroup>
      <WizardActions>
        <Button type="submit" size="lg">
          Continue to scope
        </Button>
      </WizardActions>
    </form>
  );
}
