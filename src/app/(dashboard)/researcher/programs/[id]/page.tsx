import { SendHorizontal } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProgramDetail } from "@/features/programs/components/program-detail";
import { getProgram } from "@/features/programs/server";
import { newReportHref } from "@/features/reports/links";

export async function generateMetadata({
  params,
}: PageProps<"/researcher/programs/[id]">): Promise<Metadata> {
  return { title: (await getProgram((await params).id)).title };
}

export default async function ResearcherProgramPage({
  params,
}: PageProps<"/researcher/programs/[id]">) {
  const program = await getProgram((await params).id);
  return (
    <ProgramDetail
      program={program}
      directory={{ href: "/researcher/programs", label: "Programs" }}
      action={
        <Button asChild size="lg">
          <Link href={newReportHref(program.id)}>
            <SendHorizontal aria-hidden="true" />
            Submit a report
          </Link>
        </Button>
      }
    />
  );
}
