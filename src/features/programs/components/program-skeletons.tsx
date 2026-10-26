import {
  FilterBarSkeleton,
  LoadingFrame,
} from "@/components/shared/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

const CARDS = ["a", "b", "c", "d"] as const;

/** The directory's filters and a few cards, without the frame (for loading pages to compose). */
export function ProgramGridSkeleton() {
  return (
    <>
      <FilterBarSkeleton />
      <div className="grid gap-4 lg:grid-cols-2">
        {CARDS.map((key) => (
          <Skeleton key={key} className="h-72 rounded-xl" />
        ))}
      </div>
    </>
  );
}

/** The directory while its first page loads, below a header that already rendered. */
export function ProgramDirectorySkeleton() {
  return (
    <LoadingFrame>
      <ProgramGridSkeleton />
    </LoadingFrame>
  );
}

/** Title, then the pool card beside the description, matching ProgramDetail's layout. */
export function ProgramDetailSkeleton() {
  return (
    <LoadingFrame>
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
    </LoadingFrame>
  );
}
