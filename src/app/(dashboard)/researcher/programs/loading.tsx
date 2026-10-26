import {
  HeaderSkeleton,
  LoadingFrame,
} from "@/components/shared/page-skeleton";
import { ProgramGridSkeleton } from "@/features/programs/components/program-skeletons";

export default function Loading() {
  return (
    <LoadingFrame>
      <HeaderSkeleton />
      <ProgramGridSkeleton />
    </LoadingFrame>
  );
}
