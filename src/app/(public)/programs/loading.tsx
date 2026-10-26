import {
  HeaderSkeleton,
  LoadingFrame,
} from "@/components/shared/page-skeleton";
import { ProgramGridSkeleton } from "@/features/programs/components/program-skeletons";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-page px-4 py-12 md:px-6 lg:px-8">
      <LoadingFrame>
        <HeaderSkeleton />
        <ProgramGridSkeleton />
      </LoadingFrame>
    </div>
  );
}
