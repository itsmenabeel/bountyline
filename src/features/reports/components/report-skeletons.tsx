import { LoadingFrame } from "@/components/shared/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

/** Title, the track card, then the write-up beside the facts, matching ReportDetail. */
export function ReportDetailSkeleton() {
  return (
    <LoadingFrame>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-full max-w-lg" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-28 rounded-xl" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </LoadingFrame>
  );
}
