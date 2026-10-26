import { StatCardSkeleton } from "@/components/shared/stat-card";
import { Skeleton } from "@/components/ui/skeleton";

const STATS = ["a", "b", "c", "d", "e", "f"] as const;
const CHARTS = ["a", "b", "c", "d"] as const;

export default function Loading() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {STATS.map((key) => (
          <StatCardSkeleton key={key} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {CHARTS.map((key) => (
          <Skeleton key={key} className="h-72 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
