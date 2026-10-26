import { ProgramDetailSkeleton } from "@/features/programs/components/program-skeletons";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-page px-4 py-10 md:px-6 lg:px-8">
      <ProgramDetailSkeleton />
    </div>
  );
}
