"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { ErrorSummary } from "@/components/shared/error-summary";
import { WizardActions } from "@/components/shared/wizard-shell";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { useDraftSync, type WizardStepProps } from "@/hooks/use-draft-sync";
import { type ErrorTarget, useErrorSummary } from "@/hooks/use-error-summary";
import { describedBy } from "@/lib/forms";
import {
  PROGRAM_RULES,
  type ProgramScopeValues,
  programScopeSchema,
  SCOPE_ASSET,
} from "../schemas";
import { ScopeListEditor } from "./scope-list-editor";

const LISTS = {
  inScope: { idPrefix: "scope-in", label: "In scope", row: "In-scope asset" },
  outOfScope: {
    idPrefix: "scope-out",
    label: "Out of scope",
    row: "Out-of-scope asset",
  },
} as const;

const count = new Intl.NumberFormat("en-US");

const target: ErrorTarget = (path) => {
  const [name, index] = path.split(".");
  if (name === "inScope" || name === "outOfScope") {
    const list = LISTS[name];
    const row = Number(index);
    // "inScope" or "inScope.root" is the list's own error; it points at the first row.
    return Number.isInteger(row)
      ? { id: `${list.idPrefix}-${row}`, label: `${list.row} ${row + 1}` }
      : { id: `${list.idPrefix}-0`, label: list.label };
  }
  return { id: "scope-rules", label: "Rules" };
};

export function ProgramScopeStep({
  values,
  onChange,
  onContinue,
  onBack,
}: WizardStepProps<ProgramScopeValues>) {
  const form = useForm({
    resolver: zodResolver(programScopeSchema),
    mode: "onTouched",
    shouldFocusError: false,
    defaultValues: values,
  });
  useDraftSync(form, onChange);
  const summary = useErrorSummary(form, target);

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(onContinue, summary.onInvalid)}
      className="flex flex-col gap-6"
    >
      {summary.errors.length > 0 && (
        <ErrorSummary errors={summary.errors} attempt={summary.attempt} />
      )}
      <FieldGroup className="gap-8">
        <ScopeListEditor
          control={form.control}
          name="inScope"
          idPrefix={LISTS.inScope.idPrefix}
          legend={LISTS.inScope.label}
          rowLabel={LISTS.inScope.row}
          description={`Hostnames, URLs, apps, or API paths researchers may test, one per row, up to ${SCOPE_ASSET.max} characters each. Paste a list to fill several rows.`}
          minRows={1}
        />
        <ScopeListEditor
          control={form.control}
          name="outOfScope"
          idPrefix={LISTS.outOfScope.idPrefix}
          legend={LISTS.outOfScope.label}
          rowLabel={LISTS.outOfScope.row}
          description="Optional. Assets researchers must leave alone, such as a marketing site or a third-party service."
        />
        <Controller
          name="rules"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="scope-rules">Rules</FieldLabel>
              <Textarea
                {...field}
                id="scope-rules"
                rows={6}
                aria-invalid={fieldState.invalid}
                aria-describedby={describedBy(
                  "scope-rules-help",
                  fieldState.error && "scope-rules-error",
                )}
              />
              <FieldDescription id="scope-rules-help">
                Optional, up to {count.format(PROGRAM_RULES.max)} characters.
                Markdown works here. Name the testing you don't allow, such as
                denial of service or social engineering.
              </FieldDescription>
              <FieldError id="scope-rules-error" errors={[fieldState.error]} />
            </Field>
          )}
        />
      </FieldGroup>
      <WizardActions onBack={onBack}>
        <Button type="submit" size="lg">
          Continue to reward tiers
        </Button>
      </WizardActions>
    </form>
  );
}
