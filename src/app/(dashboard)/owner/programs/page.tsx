import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { ProgramTable } from "@/features/programs/components/program-table";
import { programTableParams } from "@/features/programs/params";
import { programTableQuery } from "@/features/programs/queries";
import { parseListParams } from "@/lib/list-params";
import { HydrateClient, prefetch } from "@/lib/query/server";

export const metadata: Metadata = { title: "Programs" };

export default async function OwnerProgramsPage({
  searchParams,
}: PageProps<"/owner/programs">) {
  const params = parseListParams(programTableParams, await searchParams);
  await prefetch(programTableQuery("mine", params));
  return (
    <>
      <PageHeader
        title="Programs"
        description="Programs you run, in every status. Open one to see its scope and rewards."
      />
      <HydrateClient>
        <ProgramTable scope="mine" basePath="/owner/programs" />
      </HydrateClient>
    </>
  );
}
