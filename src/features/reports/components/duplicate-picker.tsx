"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { type Ref, useState } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDebouncedValue } from "@/hooks/use-debounce";
import { shortId } from "@/lib/ids";
import { clientQuery } from "@/lib/query/descriptor";
import { cn } from "@/lib/utils";
import type { Report } from "@/types/api";
import { reportListQuery } from "../queries";

/**
 * Finds the original for a duplicate: reports in the same program that aren't duplicates
 * themselves, searched by title on the backend (its own rule for `duplicateOfId`).
 */
export function DuplicatePicker({
  id,
  reportId,
  programId,
  value,
  onChange,
  invalid,
  describedBy,
  buttonRef,
}: {
  id: string;
  reportId: string;
  programId: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  invalid: boolean;
  describedBy?: string;
  buttonRef?: Ref<HTMLButtonElement>;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Report | null>(null);
  const debounced = useDebouncedValue(search.trim());

  const query = useQuery({
    ...clientQuery(
      reportListQuery({
        page: 1,
        limit: 25,
        sortBy: "createdAt",
        order: "asc",
        search: debounced || undefined,
        programId,
        status: undefined,
        severity: undefined,
      }),
    ),
    enabled: open,
    placeholderData: keepPreviousData,
  });
  const candidates = (query.data?.items ?? []).filter(
    (report) => report.id !== reportId && report.duplicateOfId === null,
  );
  const current = value && selected?.id === value ? selected : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={buttonRef}
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-auto min-h-9 w-full justify-between py-1.5 text-left font-normal",
            invalid && "border-destructive",
          )}
        >
          {current ? (
            <span className="flex min-w-0 flex-col">
              <span className="font-mono text-xs text-muted-foreground">
                {shortId(current.id, "R")}
              </span>
              <span className="truncate">{current.title}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">
              Find the original report
            </span>
          )}
          <ChevronsUpDownIcon aria-hidden="true" className="opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) min-w-72 p-0"
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder="Search this program's reports"
          />
          <CommandList>
            <CommandEmpty>
              {query.isFetching
                ? "Searching…"
                : "No other report in this program matches."}
            </CommandEmpty>
            {candidates.length > 0 && (
              <CommandGroup heading="Same program, oldest first">
                {candidates.map((report) => (
                  <CommandItem
                    key={report.id}
                    value={report.id}
                    onSelect={() => {
                      setSelected(report);
                      onChange(report.id);
                      setOpen(false);
                    }}
                    className="items-start gap-2"
                  >
                    <CheckIcon
                      aria-hidden="true"
                      className={cn(
                        "mt-0.5",
                        value === report.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="font-mono text-xs text-muted-foreground">
                        {shortId(report.id, "R")}
                      </span>
                      <span className="line-clamp-2">{report.title}</span>
                      <StatusBadge kind="report" status={report.status} />
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
