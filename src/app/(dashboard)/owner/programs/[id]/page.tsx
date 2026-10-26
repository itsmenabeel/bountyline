import type { Metadata } from "next";
import { ProgramDetail } from "@/features/programs/components/program-detail";
import { getProgram } from "@/features/programs/server";

export async function generateMetadata({
  params,
}: PageProps<"/owner/programs/[id]">): Promise<Metadata> {
  return { title: (await getProgram((await params).id)).title };
}

export default async function OwnerProgramPage({
  params,
}: PageProps<"/owner/programs/[id]">) {
  const program = await getProgram((await params).id);
  return (
    <ProgramDetail
      program={program}
      directory={{ href: "/owner/programs", label: "Programs" }}
      showStatus
    />
  );
}
