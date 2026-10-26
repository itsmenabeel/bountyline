import {
  HeaderSkeleton,
  LoadingFrame,
} from "@/components/shared/page-skeleton";
import { StatCardSkeleton } from "@/components/shared/stat-card";
import { Skeleton } from "@/components/ui/skeleton";

const STATS = ["a", "b", "c", "d", "e", "f"] as const;
const CHARTS = ["a", "b", "c", "d"] as const;

/** Six stat tiles and four chart cards, at the sizes the overview lands with. */
export default function Loading() {
  return (
    <LoadingFrame>
      <HeaderSkeleton />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {STATS.map((key) => (
          <StatCardSkeleton key={key} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {CHARTS.map((key) => (
          <Skeleton key={key} className="h-80 rounded-xl" />
        ))}
      </div>
    </LoadingFrame>
  );
}
