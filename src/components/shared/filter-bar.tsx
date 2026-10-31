"use client";

import { SearchIcon, XIcon } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

/** A row of list controls: search first, then filters, then "Clear filters". Wraps on phones. */
export function FilterBar({
  label,
  children,
}: {
  /** Names the region for screen readers, e.g. "Filter programs". */
  label: string;
  children: ReactNode;
}) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: <search> isn't in every browser this site supports yet; role="search" is the documented fallback.
    <div
      role="search"
      aria-label={label}
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
    >
      {children}
    </div>
  );
}

/**
 * Search box that updates the URL 300 ms after the last keystroke. It keeps its own text
 * while the person types and only takes the URL's value when it changes from outside
 * (back/forward, "Clear filters"), so a slow update never overwrites newer typing.
 */
export function SearchFilter({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}) {
  const [text, setText] = useState(value ?? "");
  const debounced = useDebouncedValue(text);
  const lastSent = useRef(value ?? "");

  useEffect(() => {
    const next = debounced.trim();
    if (next === lastSent.current) return;
    lastSent.current = next;
    onChange(next || undefined);
  }, [debounced, onChange]);

  useEffect(() => {
    const external = value ?? "";
    if (external !== lastSent.current) {
      lastSent.current = external;
      setText(external);
    }
  }, [value]);

  return (
    <div className="flex min-w-0 flex-col gap-1.5 sm:w-72">
      <Label htmlFor={id}>{label}</Label>
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          id={id}
          type="search"
          value={text}
          placeholder={placeholder}
          maxLength={100}
          autoComplete="off"
          onChange={(event) => setText(event.target.value)}
        />
      </InputGroup>
    </div>
  );
}

const ALL = "__all";

export interface FilterOption<Value extends string = string> {
  value: Value;
  label: string;
}

/**
 * One filter as a select. "All" stands for no filter and clears the URL key. Typed by its
 * options, so `onChange` hands back the filter's own values, not any string.
 */
export function SelectFilter<Value extends string>({
  id,
  label,
  allLabel,
  options,
  value,
  onChange,
}: {
  id: string;
  label: string;
  allLabel: string;
  options: readonly FilterOption<Value>[];
  value: Value | undefined;
  onChange: (value: Value | undefined) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 sm:w-48">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value ?? ALL}
        onValueChange={(next) =>
          onChange(options.find((option) => option.value === next)?.value)
        }
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{allLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Sort order as one select, for lists without sortable column headers (card grids). Each
 * option's value names the field and direction, e.g. "poolBalance:desc".
 */
export function SortSelect<Value extends string>({
  id,
  label,
  options,
  value,
  onChange,
}: {
  id: string;
  label: string;
  options: readonly FilterOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 sm:w-48">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value}
        onValueChange={(next) => {
          const option = options.find((candidate) => candidate.value === next);
          if (option) onChange(option.value);
        }}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * One filter as a row of pressed/unpressed buttons above the list, for the filter people
 * switch most (report status). Buttons, not tabs: the list below is the same region whatever
 * is chosen, so there are no tab panels to point at. Scrolls sideways on phones.
 */
export function StatusTabs<Value extends string>({
  label,
  allLabel,
  options,
  value,
  onChange,
}: {
  label: string;
  allLabel: string;
  options: readonly FilterOption<Value>[];
  value: Value | undefined;
  onChange: (value: Value | undefined) => void;
}) {
  const choices: { value: Value | undefined; label: string }[] = [
    { value: undefined, label: allLabel },
    ...options,
  ];
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">{label}</legend>
      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {choices.map((choice) => {
          const pressed = choice.value === value;
          return (
            <button
              key={choice.value ?? ALL}
              type="button"
              aria-pressed={pressed}
              onClick={() => onChange(choice.value)}
              className={cn(
                "h-8 shrink-0 rounded-full border px-3 text-sm font-medium whitespace-nowrap outline-none transition-colors duration-(--motion-fast) focus-visible:ring-3 focus-visible:ring-ring/70 pointer-coarse:h-11 pointer-coarse:px-4",
                pressed
                  ? "border-foreground bg-foreground text-background"
                  : "border-input bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {choice.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Shown only while a filter or search is narrowing the list. */
export function ClearFiltersButton({
  visible,
  onClear,
}: {
  visible: boolean;
  onClear: () => void;
}) {
  if (!visible) return null;
  return (
    <Button
      variant="ghost"
      onClick={onClear}
      className="self-start sm:self-end"
    >
      <XIcon aria-hidden="true" />
      Clear filters
    </Button>
  );
}

/**
 * A From and To day as two native date inputs, each written to the URL as YYYY-MM-DD. A
 * range that ends before it starts stays in the URL as typed, shows an error, and filters
 * nothing until it's fixed (the list's query drops it).
 */
export function DateRangeFilter({
  idPrefix,
  from,
  to,
  onChange,
}: {
  idPrefix: string;
  from: string | undefined;
  to: string | undefined;
  /** Only the field that changed, so two quick edits can't overwrite each other. */
  onChange: (patch: { from?: string } | { to?: string }) => void;
}) {
  const invalid = Boolean(from && to && from > to);
  const errorId = `${idPrefix}-range-error`;
  return (
    <fieldset className="flex min-w-0 flex-col gap-1.5">
      <legend className="sr-only">Date range</legend>
      <div className="flex gap-3">
        {(["from", "to"] as const).map((edge) => {
          const id = `${idPrefix}-${edge}`;
          const value = edge === "from" ? from : to;
          return (
            <div
              key={edge}
              className="flex min-w-0 flex-1 flex-col gap-1.5 sm:w-40"
            >
              <Label htmlFor={id}>{edge === "from" ? "From" : "To"}</Label>
              <Input
                id={id}
                type="date"
                className="focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/70"
                value={value ?? ""}
                min={edge === "to" ? from : undefined}
                max={edge === "from" ? to : undefined}
                aria-invalid={invalid || undefined}
                aria-describedby={invalid ? errorId : undefined}
                onChange={(event) =>
                  onChange({ [edge]: event.target.value || undefined })
                }
              />
            </div>
          );
        })}
      </div>
      {invalid && (
        <p id={errorId} className="text-sm text-destructive">
          The end date comes before the start date.
        </p>
      )}
    </fieldset>
  );
}
