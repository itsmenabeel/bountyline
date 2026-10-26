import type { Metadata } from "next";
import { ProgramDetail } from "@/features/programs/components/program-detail";
import { getProgram } from "@/features/programs/server";

export async function generateMetadata({
  params,
}: PageProps<"/admin/programs/[id]">): Promise<Metadata> {
  return { title: (await getProgram((await params).id)).title };
}

export default async function AdminProgramPage({
  params,
}: PageProps<"/admin/programs/[id]">) {
  const program = await getProgram((await params).id);
  return (
    <ProgramDetail
      program={program}
      directory={{ href: "/admin/programs", label: "Programs" }}
      showStatus
    />
  );
}
