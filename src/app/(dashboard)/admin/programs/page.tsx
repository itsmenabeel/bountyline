import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { ProgramTable } from "@/features/programs/components/program-table";
import { programTableParams } from "@/features/programs/params";
import { programTableQuery } from "@/features/programs/queries";
import { parseListParams } from "@/lib/list-params";
import { HydrateClient, prefetch } from "@/lib/query/server";

export const metadata: Metadata = { title: "Programs" };

export default async function AdminProgramsPage({
  searchParams,
}: PageProps<"/admin/programs">) {
  const params = parseListParams(programTableParams, await searchParams);
  await prefetch(programTableQuery("all", params));
  return (
    <>
      <PageHeader
        title="Programs"
        description="Every program on the platform, in every status."
      />
      <HydrateClient>
        <ProgramTable scope="all" basePath="/admin/programs" />
      </HydrateClient>
    </>
  );
}
