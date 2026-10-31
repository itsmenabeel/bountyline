import { Suspense } from "react";
import { ProgramDirectory } from "@/features/programs/components/program-directory";
import { ProgramDirectorySkeleton } from "@/features/programs/components/program-skeletons";
import { directoryParams } from "@/features/programs/params";
import { directoryQuery } from "@/features/programs/queries";
import { publicRequest } from "@/lib/api/public";
import { parseListParams } from "@/lib/list-params";
import { pageMetadata } from "@/lib/metadata";
import { HydrateClient, prefetch } from "@/lib/query/server";

export const metadata = pageMetadata({
  title: "Programs",
  description:
    "Active bug bounty programs on Bountyline, with each program's pool, rewards, and scope.",
  path: "/programs",
});

/** Reads the URL, so it renders at request time inside the page's Suspense boundary. */
async function Directory({ searchParams }: PageProps<"/programs">) {
  const params = parseListParams(directoryParams, await searchParams);
  await prefetch(directoryQuery("public", params), publicRequest);
  return (
    <HydrateClient>
      <ProgramDirectory source="public" basePath="/programs" />
    </HydrateClient>
  );
}

export default function ProgramsPage(props: PageProps<"/programs">) {
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-8 px-4 py-12 md:px-6 lg:px-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Programs
        </h1>
        <p className="max-w-prose text-base text-muted-foreground md:text-lg">
          Each program sets its scope and what it pays per severity. Read both
          before you start testing.
        </p>
      </div>
      <Suspense fallback={<ProgramDirectorySkeleton />}>
        <Directory {...props} />
      </Suspense>
    </div>
  );
}
