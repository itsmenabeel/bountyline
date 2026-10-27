"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { ErrorSummary } from "@/components/shared/error-summary";
import { type Failure, FailureAlert } from "@/components/shared/failure-alert";
import { PendingLabel } from "@/components/shared/pending-label";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { type ErrorTarget, useErrorSummary } from "@/hooks/use-error-summary";
import { clientRequest } from "@/lib/api/client";
import { describedBy } from "@/lib/forms";
import type { Program, ProgramScope } from "@/types/api";
import { programEndpoints } from "../endpoints";
import { saveFailureMessage } from "../save-failure";
import {
  PROGRAM_RULES,
  type ProgramScopeOutput,
  type ProgramScopeValues,
  programScopeSchema,
} from "../schemas";
import { useSavedProgram } from "../use-saved-program";
import { ScopeListEditor } from "./scope-list-editor";
import { SettingsActions } from "./settings-section";

const LISTS = {
  inScope: {
    idPrefix: "settings-scope-in",
    label: "In scope",
    row: "In-scope asset",
  },
  outOfScope: {
    idPrefix: "settings-scope-out",
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
    return Number.isInteger(row)
      ? { id: `${list.idPrefix}-${row}`, label: `${list.row} ${row + 1}` }
      : { id: `${list.idPrefix}-0`, label: list.label };
  }
  return { id: "settings-rules", label: "Rules" };
};

const rows = (assets: string[]) => assets.map((value) => ({ value }));

/** The saved scope as form rows; in scope always shows at least one row. */
function toValues(scope: ProgramScope): ProgramScopeValues {
  return {
    inScope: scope.inScope.length > 0 ? rows(scope.inScope) : [{ value: "" }],
    outOfScope: rows(scope.outOfScope),
    rules: scope.rules ?? "",
  };
}

/** Scope lists and rules. The backend replaces the whole scope with what this sends. */
export function ProgramScopeForm({ program }: { program: Program }) {
  const saved = useSavedProgram();
  const [failure, setFailure] = useState<Failure | null>(null);
  const attempts = useRef(0);
  const form = useForm({
    resolver: zodResolver(programScopeSchema),
    mode: "onTouched",
    shouldFocusError: false,
    defaultValues: toValues(program.scope),
  });
  const summary = useErrorSummary(form, target);

  const save = useMutation({
    mutationFn: ({ inScope, outOfScope, rules }: ProgramScopeOutput) =>
      clientRequest(
        programEndpoints.update(program.id, {
          scope: { inScope, outOfScope, ...(rules && { rules }) },
        }),
      ),
    meta: { silentToast: true },
    onSuccess: (updated) => {
      saved(updated);
      form.reset(toValues(updated.scope));
      toast.success("Scope saved");
    },
    onError: (error) => {
      attempts.current += 1;
      setFailure({
        message: saveFailureMessage(error),
        attempt: attempts.current,
      });
    },
  });

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) => {
        if (save.isPending) return;
        setFailure(null);
        save.mutate(values);
      }, summary.onInvalid)}
      className="flex flex-col gap-5"
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
          description="Assets researchers may test, one per row. Paste a list to fill several rows."
          minRows={1}
        />
        <ScopeListEditor
          control={form.control}
          name="outOfScope"
          idPrefix={LISTS.outOfScope.idPrefix}
          legend={LISTS.outOfScope.label}
          rowLabel={LISTS.outOfScope.row}
          description="Optional. Assets researchers must leave alone."
        />
        <Controller
          name="rules"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="settings-rules">Rules</FieldLabel>
              <Textarea
                {...field}
                id="settings-rules"
                rows={6}
                aria-invalid={fieldState.invalid}
                aria-describedby={describedBy(
                  "settings-rules-help",
                  fieldState.error && "settings-rules-error",
                )}
              />
              <FieldDescription id="settings-rules-help">
                Optional, up to {count.format(PROGRAM_RULES.max)} characters.
                Markdown works here.
              </FieldDescription>
              <FieldError
                id="settings-rules-error"
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
          {save.isPending ? <PendingLabel>Saving</PendingLabel> : "Save scope"}
        </Button>
      </SettingsActions>
    </form>
  );
}
