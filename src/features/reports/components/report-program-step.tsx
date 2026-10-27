"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { ErrorSummary } from "@/components/shared/error-summary";
import { WizardActions } from "@/components/shared/wizard-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { type ErrorTarget, useErrorSummary } from "@/hooks/use-error-summary";
import { describedBy } from "@/lib/forms";
import type { Program } from "@/types/api";
import { type ReportProgramValues, reportProgramSchema } from "../schemas";
import { ProgramPicker } from "./program-picker";
import { ProgramScopeCard } from "./program-scope-card";

const target: ErrorTarget = (path) =>
  path.startsWith("inScope")
    ? { id: "new-report-in-scope", label: "Scope check" }
    : { id: "new-report-program", label: "Program" };

/**
 * Step 1 of the report wizard: the program, its scope, and the researcher's confirmation that
 * the finding is in scope. The confirmation belongs to one program's scope, so picking
 * another program brings back that program's own answer (unchecked if it has none).
 */
export function ReportProgramStep({
  programs,
  values,
  savedInScope,
  onProgramChange,
  onInScopeChange,
  onContinue,
}: {
  programs: Program[];
  values: ReportProgramValues;
  /** The confirmation stored in another program's draft. */
  savedInScope: (programId: string) => boolean;
  onProgramChange: (programId: string) => void;
  onInScopeChange: (inScope: boolean) => void;
  onContinue: () => void;
}) {
  const form = useForm({
    resolver: zodResolver(reportProgramSchema),
    mode: "onTouched",
    shouldFocusError: false,
    defaultValues: values,
  });
  const summary = useErrorSummary(form, target);
  const programId = useWatch({ control: form.control, name: "programId" });
  const program = programs.find((item) => item.id === programId);

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(onContinue, summary.onInvalid)}
      className="flex flex-col gap-6"
    >
      {summary.errors.length > 0 && (
        <ErrorSummary errors={summary.errors} attempt={summary.attempt} />
      )}
      <FieldGroup>
        <Controller
          name="programId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="new-report-program">Program</FieldLabel>
              <ProgramPicker
                id="new-report-program"
                programs={programs}
                value={field.value}
                buttonRef={field.ref}
                invalid={fieldState.invalid}
                describedBy={describedBy(
                  "new-report-program-help",
                  fieldState.error && "new-report-program-error",
                )}
                onChange={(next) => {
                  field.onChange(next);
                  form.setValue("inScope", savedInScope(next));
                  form.clearErrors("inScope");
                  onProgramChange(next);
                }}
              />
              <FieldDescription id="new-report-program-help">
                Only programs taking reports show here.
              </FieldDescription>
              <FieldError
                id="new-report-program-error"
                errors={[fieldState.error]}
              />
            </Field>
          )}
        />

        {program && <ProgramScopeCard program={program} />}

        <Controller
          name="inScope"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field orientation="horizontal" data-invalid={fieldState.invalid}>
              <Checkbox
                id="new-report-in-scope"
                ref={field.ref}
                name={field.name}
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked === true);
                  onInScopeChange(checked === true);
                }}
                onBlur={field.onBlur}
                aria-invalid={fieldState.invalid}
                aria-describedby={describedBy(
                  "new-report-in-scope-help",
                  fieldState.error && "new-report-in-scope-error",
                )}
              />
              <FieldContent>
                <FieldLabel htmlFor="new-report-in-scope">
                  My finding targets an in-scope asset
                </FieldLabel>
                <FieldDescription id="new-report-in-scope-help">
                  The triage team rejects reports against assets outside the
                  program's scope.
                </FieldDescription>
                <FieldError
                  id="new-report-in-scope-error"
                  errors={[fieldState.error]}
                />
              </FieldContent>
            </Field>
          )}
        />
      </FieldGroup>
      <WizardActions>
        <Button type="submit" size="lg">
          Continue to write-up
        </Button>
      </WizardActions>
    </form>
  );
}
