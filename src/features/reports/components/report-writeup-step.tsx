"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ListPlusIcon } from "lucide-react";
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
  REPORT_DESCRIPTION,
  REPORT_TITLE,
  reportWriteupSchema,
  withTemplate,
} from "../schemas";

type WriteupValues = { title: string; description: string };

const target: ErrorTarget = (path) =>
  path.startsWith("description")
    ? { id: "new-report-description", label: "Write-up" }
    : { id: "new-report-title", label: "Title" };

const FIRST_SECTION = "## Summary\n\n";

/**
 * Step 2 of the report wizard: title and Markdown write-up. "Insert template" adds the
 * headings triage reads first (design-plan §9.1) and puts the cursor under Summary.
 */
export function ReportWriteupStep({
  values,
  onChange,
  onContinue,
  onBack,
}: WizardStepProps<WriteupValues>) {
  const [tab, setTab] = useState<MarkdownTab>("write");
  const form = useForm({
    resolver: zodResolver(reportWriteupSchema),
    mode: "onTouched",
    shouldFocusError: false,
    defaultValues: values,
  });
  useDraftSync(form, onChange);
  const summary = useErrorSummary(form, target);

  const insertTemplate = () => {
    const before = form.getValues("description");
    const next = withTemplate(before);
    form.setValue("description", next, { shouldDirty: true });
    setTab("write");
    requestAnimationFrame(() => {
      const textarea = document.getElementById(
        "new-report-description",
      ) as HTMLTextAreaElement | null;
      if (!textarea) return;
      const caret =
        next.length - withTemplate("").length + FIRST_SECTION.length;
      textarea.focus();
      textarea.setSelectionRange(caret, caret);
    });
  };

  const onInvalid = (errors: FieldErrors<WriteupValues>) => {
    // The write-up can't take focus while Preview hides it.
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
              <FieldLabel htmlFor="new-report-title">Title</FieldLabel>
              <Input
                {...field}
                id="new-report-title"
                autoComplete="off"
                aria-invalid={fieldState.invalid}
                aria-describedby={describedBy(
                  "new-report-title-help",
                  fieldState.error && "new-report-title-error",
                )}
              />
              <FieldDescription id="new-report-title-help">
                Name the bug and where it is, in {REPORT_TITLE.min} to{" "}
                {REPORT_TITLE.max} characters.
              </FieldDescription>
              <FieldError
                id="new-report-title-error"
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
              <FieldLabel htmlFor="new-report-description">Write-up</FieldLabel>
              <MarkdownEditor
                {...field}
                tab={tab}
                onTabChange={setTab}
                id="new-report-description"
                rows={16}
                className="min-h-80"
                aria-invalid={fieldState.invalid}
                aria-describedby={describedBy(
                  "new-report-description-help",
                  fieldState.error && "new-report-description-error",
                )}
                toolbar={
                  <Button
                    type="button"
                    variant="outline"
                    onClick={insertTemplate}
                  >
                    <ListPlusIcon aria-hidden="true" />
                    Insert template
                  </Button>
                }
              />
              <FieldDescription id="new-report-description-help">
                Markdown works here. Cover the steps to reproduce and the
                impact, in at least {REPORT_DESCRIPTION.min} characters. The
                template adds headings for both.
              </FieldDescription>
              <FieldError
                id="new-report-description-error"
                errors={[fieldState.error]}
              />
            </Field>
          )}
        />
      </FieldGroup>
      <WizardActions onBack={onBack}>
        <Button type="submit" size="lg">
          Review report
        </Button>
      </WizardActions>
    </form>
  );
}
