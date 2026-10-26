import { Skeleton } from "@/components/ui/skeleton";

const ROWS = ["a", "b", "c", "d", "e"] as const;

/** Generic dashboard page placeholder: a title, a description line, and a content block. */
export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

/** A list page: title, filters, and table rows, in the places the real ones land. */
export function ListPageSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Skeleton className="h-14 w-full sm:w-72" />
        <Skeleton className="h-14 w-full sm:w-48" />
      </div>
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
    </div>
  );
}
