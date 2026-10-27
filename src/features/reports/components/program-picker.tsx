"use client";

import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { type Ref, useState } from "react";
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
import { coverageText, poolCoverage } from "@/features/programs/pool-coverage";
import { cn } from "@/lib/utils";
import type { Program } from "@/types/api";

/**
 * Picks the program a report goes to, from the programs taking reports. The list is small
 * (one page of 50), so the search runs in the browser over title and owner.
 */
export function ProgramPicker({
  id,
  programs,
  value,
  onChange,
  invalid,
  describedBy,
  buttonRef,
}: {
  id: string;
  programs: Program[];
  value: string;
  onChange: (programId: string) => void;
  invalid: boolean;
  describedBy?: string;
  buttonRef?: Ref<HTMLButtonElement>;
}) {
  const [open, setOpen] = useState(false);
  const current = programs.find((program) => program.id === value);

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
            "h-auto min-h-9 w-full justify-between py-1.5 text-left font-normal pointer-coarse:min-h-11",
            invalid && "border-destructive",
          )}
        >
          {current ? (
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-medium">{current.title}</span>
              <span className="truncate text-xs text-muted-foreground">
                Run by {current.owner.name}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">Choose a program</span>
          )}
          <ChevronsUpDownIcon aria-hidden="true" className="opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) min-w-72 p-0"
      >
        <Command>
          <CommandInput placeholder="Search programs" />
          <CommandList>
            <CommandEmpty>No program matches.</CommandEmpty>
            <CommandGroup heading="Taking reports">
              {programs.map((program) => (
                <CommandItem
                  key={program.id}
                  value={program.id}
                  keywords={[program.title, program.owner.name]}
                  onSelect={() => {
                    onChange(program.id);
                    setOpen(false);
                  }}
                  className="items-start gap-2"
                >
                  <CheckIcon
                    aria-hidden="true"
                    className={cn(
                      "mt-0.5",
                      value === program.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="line-clamp-2">{program.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {program.owner.name} ·{" "}
                      {coverageText(poolCoverage(program))}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
