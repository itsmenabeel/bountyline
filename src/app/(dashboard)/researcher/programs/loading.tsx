import { Skeleton } from "@/components/ui/skeleton";
import { ProgramDirectorySkeleton } from "@/features/programs/components/program-skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <ProgramDirectorySkeleton />
    </div>
  );
}
