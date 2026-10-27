import type { Metadata } from "next";
import { OwnerProgramView } from "@/features/programs/components/owner-program-view";
import { isOwnerProgramTab } from "@/features/programs/owner-tabs";
import { programDetailQuery } from "@/features/programs/queries";
import { getProgram } from "@/features/programs/server";
import { HydrateClient, prefetch } from "@/lib/query/server";

export async function generateMetadata({
  params,
}: PageProps<"/owner/programs/[id]">): Promise<Metadata> {
  return { title: (await getProgram((await params).id)).title };
}

export default async function OwnerProgramPage({
  params,
  searchParams,
}: PageProps<"/owner/programs/[id]">) {
  const { id } = await params;
  const { tab } = await searchParams;
  // getProgram is cached per request and already ran for the metadata, so the client's
  // query starts from that read instead of fetching it again.
  const program = await getProgram(id);
  await prefetch(programDetailQuery(id), async () => program);

  return (
    <HydrateClient>
      <OwnerProgramView
        id={id}
        initialTab={isOwnerProgramTab(tab) ? tab : "overview"}
      />
    </HydrateClient>
  );
}
