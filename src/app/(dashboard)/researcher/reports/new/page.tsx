import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { programOptionsQuery } from "@/features/programs/queries";
import { ReportWizard } from "@/features/reports/components/report-wizard";
import { isUuid } from "@/lib/ids";
import { HydrateClient, prefetch } from "@/lib/query/server";

export const metadata: Metadata = { title: "Submit a report" };

export default async function NewReportPage({
  searchParams,
}: PageProps<"/researcher/reports/new">) {
  const { programId } = await searchParams;
  const initialProgramId =
    typeof programId === "string" && isUuid(programId) ? programId : null;
  await prefetch(programOptionsQuery());

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/researcher/reports">My reports</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Submit a report</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <PageHeader
          title="Submit a report"
          description="Three steps. This tab keeps a draft for each program until you submit."
        />
      </div>
      <HydrateClient>
        <ReportWizard initialProgramId={initialProgramId} />
      </HydrateClient>
    </div>
  );
}
