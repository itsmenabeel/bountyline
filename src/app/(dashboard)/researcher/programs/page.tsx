import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { ProgramDirectory } from "@/features/programs/components/program-directory";
import { directoryParams } from "@/features/programs/params";
import { directoryQuery } from "@/features/programs/queries";
import { parseListParams } from "@/lib/list-params";
import { HydrateClient, prefetch } from "@/lib/query/server";

export const metadata: Metadata = { title: "Programs" };

export default async function ResearcherProgramsPage({
  searchParams,
}: PageProps<"/researcher/programs">) {
  const params = parseListParams(directoryParams, await searchParams);
  await prefetch(directoryQuery("signed-in", params));
  return (
    <>
      <PageHeader
        title="Programs"
        description="Active programs that accept reports. Read the scope before you test."
      />
      <HydrateClient>
        <ProgramDirectory source="signed-in" basePath="/researcher/programs" />
      </HydrateClient>
    </>
  );
}
