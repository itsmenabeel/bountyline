"use client";

import { PlusIcon, XIcon } from "lucide-react";
import type { ClipboardEvent, KeyboardEvent } from "react";
import {
  type Control,
  Controller,
  useFieldArray,
  useFormState,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  FieldDescription,
  FieldError,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { describedBy } from "@/lib/forms";
import {
  type ProgramScopeOutput,
  type ProgramScopeValues,
  SCOPE_LIST,
} from "../schemas";

type ListName = "inScope" | "outOfScope";

/** Lines of pasted text as assets: trimmed, blanks dropped. */
const pastedAssets = (text: string) =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

/**
 * One scope list as rows of mono inputs (design-plan §8). Enter adds a row below and moves
 * to it, and pasting several lines fills one row per line, so a list copied from a doc
 * lands in one go. `minRows` keeps that many rows on screen.
 */
export function ScopeListEditor({
  control,
  name,
  idPrefix,
  legend,
  description,
  rowLabel,
  minRows = 0,
}: {
  control: Control<ProgramScopeValues, unknown, ProgramScopeOutput>;
  name: ListName;
  /** Row inputs get `${idPrefix}-${index}`; the error summary links to them. */
  idPrefix: string;
  legend: string;
  description: string;
  /** "In-scope asset", read with the row number by screen readers. */
  rowLabel: string;
  minRows?: number;
}) {
  const { fields, append, insert, update, remove } = useFieldArray({
    control,
    name,
  });
  const { errors } = useFormState({ control, name });
  const listError = errors[name]?.root ?? errors[name];
  const listMessage = listError?.message;
  const full = fields.length >= SCOPE_LIST.max;
  const helpId = `${idPrefix}-help`;
  const errorId = `${idPrefix}-error`;

  const onKeyDown = (index: number) => (event: KeyboardEvent) => {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
    // Enter adds a row instead of submitting the step.
    event.preventDefault();
    if (!full) insert(index + 1, { value: "" });
  };

  // The button goes away with its row, so focus moves to the row above (or the next one up
  // the page) instead of falling back to the document.
  const removeRow = (index: number) => {
    remove(index);
    requestAnimationFrame(() => {
      const next =
        document.getElementById(`${idPrefix}-${Math.max(0, index - 1)}`) ??
        document.getElementById(`${idPrefix}-add`);
      next?.focus();
    });
  };

  const onPaste = (index: number) => (event: ClipboardEvent) => {
    const lines = pastedAssets(event.clipboardData.getData("text"));
    if (lines.length < 2) return;
    event.preventDefault();
    const room = SCOPE_LIST.max - fields.length;
    const [first = "", ...rest] = lines;
    update(index, { value: first });
    if (rest.length > 0 && room > 0) {
      insert(
        index + 1,
        rest.slice(0, room).map((value) => ({ value })),
        { shouldFocus: false },
      );
    }
  };

  return (
    <FieldSet>
      <FieldLegend variant="label">{legend}</FieldLegend>
      <FieldDescription id={helpId}>{description}</FieldDescription>
      {fields.length > 0 && (
        <ul className="flex flex-col gap-2">
          {fields.map((row, index) => (
            <Controller
              key={row.id}
              name={`${name}.${index}.value`}
              control={control}
              render={({ field, fieldState }) => {
                const rowErrorId = `${idPrefix}-${index}-error`;
                return (
                  <li className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <Input
                        {...field}
                        id={`${idPrefix}-${index}`}
                        aria-label={`${rowLabel} ${index + 1}`}
                        autoComplete="off"
                        spellCheck={false}
                        className="font-mono md:pointer-fine:text-sm"
                        aria-invalid={
                          fieldState.invalid ||
                          Boolean(listMessage) ||
                          undefined
                        }
                        aria-describedby={describedBy(
                          helpId,
                          fieldState.error && rowErrorId,
                          listMessage && index === 0 && errorId,
                        )}
                        onKeyDown={onKeyDown(index)}
                        onPaste={onPaste(index)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={fields.length <= minRows}
                        aria-label={`Remove ${rowLabel.toLowerCase()} ${index + 1}`}
                        onClick={() => removeRow(index)}
                      >
                        <XIcon aria-hidden="true" />
                      </Button>
                    </div>
                    <FieldError id={rowErrorId} errors={[fieldState.error]} />
                  </li>
                );
              }}
            />
          ))}
        </ul>
      )}
      <FieldError id={errorId}>{listMessage}</FieldError>
      <div>
        <Button
          id={`${idPrefix}-add`}
          type="button"
          variant="outline"
          disabled={full}
          onClick={() => append({ value: "" })}
        >
          <PlusIcon aria-hidden="true" />
          Add asset
        </Button>
        {full && (
          <p className="mt-2 text-sm text-muted-foreground">
            A list holds up to {SCOPE_LIST.max} assets.
          </p>
        )}
      </div>
    </FieldSet>
  );
}
