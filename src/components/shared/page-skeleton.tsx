import { Skeleton } from "@/components/ui/skeleton";

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
