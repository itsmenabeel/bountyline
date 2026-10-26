import { Skeleton } from "@/components/ui/skeleton";

const CARDS = ["a", "b", "c", "d"] as const;

/** The directory's filters and a few cards, while the first page of programs loads. */
export function ProgramDirectorySkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Skeleton className="h-14 w-full sm:w-72" />
        <Skeleton className="h-14 w-full sm:w-48" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {CARDS.map((key) => (
          <Skeleton key={key} className="h-72 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** Title, then the pool card beside the description, matching ProgramDetail's layout. */
export function ProgramDetailSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-hidden="true">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-full max-w-lg" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Skeleton className="h-48 rounded-xl lg:order-2" />
        <div className="flex flex-col gap-3 lg:order-1">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full max-w-prose" />
          <Skeleton className="h-4 w-full max-w-prose" />
          <Skeleton className="h-4 w-2/3 max-w-prose" />
        </div>
      </div>
    </div>
  );
}
