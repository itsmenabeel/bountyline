import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ColdStartHint } from "./cold-start-hint";

const ROWS = ["a", "b", "c", "d", "e"] as const;

/**
 * Wraps every loading placeholder: one "Loading" status for screen readers, the shapes
 * hidden from them, and after 5 seconds the line explaining that the server is waking up
 * (Render's free tier sleeps; implementation-plan §4.10). The shapes match the page that
 * replaces them, so nothing jumps when it arrives (design-plan §9.4).
 */
export function LoadingFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      {/* <output> is a status region, so screen readers hear "Loading" once. */}
      <output className="sr-only">Loading</output>
      <div aria-hidden="true" className="flex flex-col gap-6">
        {children}
      </div>
      <ColdStartHint pending className="pt-0" />
    </div>
  );
}

/** Title and description lines, as PageHeader lays them out. */
export function HeaderSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-full max-w-md" />
    </div>
  );
}

/** Generic dashboard page placeholder: a title, a description line, and a content block. */
export function PageSkeleton() {
  return (
    <LoadingFrame>
      <HeaderSkeleton />
      <Skeleton className="h-64 w-full rounded-xl" />
    </LoadingFrame>
  );
}

/** The table part of a list: header row and body rows with the column rhythm of DataTable. */
export function TableSkeleton() {
  return (
    <div className="flex flex-col divide-y overflow-hidden rounded-xl border bg-card">
      <Skeleton className="h-11 rounded-none" />
      {ROWS.map((row) => (
        <div key={row} className="flex items-center gap-6 px-4 py-4">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="ml-auto h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

/** The search box and one select, as FilterBar lays them out. */
export function FilterBarSkeleton() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Skeleton className="h-14 w-full sm:w-72" />
      <Skeleton className="h-14 w-full sm:w-48" />
    </div>
  );
}

const TABS = ["a", "b", "c", "d", "e"] as const;

/**
 * A list page: title, filters, and table rows, in the places the real ones land. `tabs` adds
 * the StatusTabs row that report lists put above their filters.
 */
export function ListPageSkeleton({ tabs = false }: { tabs?: boolean }) {
  return (
    <LoadingFrame>
      <HeaderSkeleton />
      {tabs && (
        <div className="flex gap-1.5">
          {TABS.map((tab) => (
            <Skeleton
              key={tab}
              className="h-8 w-20 rounded-full pointer-coarse:h-11"
            />
          ))}
        </div>
      )}
      <FilterBarSkeleton />
      <TableSkeleton />
    </LoadingFrame>
  );
}

/**
 * A wizard before its saved draft loads: the step markers, "Step n of N" and heading, and
 * two field blocks.
 */
export function WizardSkeleton({ steps }: { steps: number }) {
  return (
    <LoadingFrame>
      <div className="flex items-center gap-2">
        {Array.from({ length: steps }, (_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed placeholders that never reorder.
          <Skeleton key={index} className="h-7 flex-1 rounded-full" />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-full max-w-sm" />
      </div>
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-72 w-full" />
    </LoadingFrame>
  );
}
