import { LoadingFrame } from "@/components/shared/page-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** The result card's shapes while the page finds the payment. */
export default function Loading() {
  return (
    <div className="w-full max-w-md">
      <LoadingFrame>
        <Card>
          <CardContent className="flex flex-col gap-6">
            <Skeleton className="size-10 rounded-lg" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-36 w-full rounded-lg" />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Skeleton className="h-10 w-full sm:w-36" />
              <Skeleton className="h-10 w-full sm:w-36" />
            </div>
          </CardContent>
        </Card>
      </LoadingFrame>
    </div>
  );
}
