import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { ownerProgramOptionsQuery } from "@/features/programs/queries";
import { ReportTable } from "@/features/reports/components/report-table";
import { reportListParams } from "@/features/reports/params";
import { reportListQuery } from "@/features/reports/queries";
import { parseListParams } from "@/lib/list-params";
import { HydrateClient, prefetch } from "@/lib/query/server";

export const metadata: Metadata = { title: "Reports" };

export default async function OwnerReportsPage({
  searchParams,
}: PageProps<"/owner/reports">) {
  const params = parseListParams(reportListParams, await searchParams);
  // The program filter's names load with the list, so a ?programId= link shows its program.
  await Promise.all([
    prefetch(reportListQuery(params)),
    prefetch(ownerProgramOptionsQuery()),
  ]);
  return (
    <>
      <PageHeader
        title="Reports"
        description="Reports researchers sent to your programs and where each one stands in triage."
      />
      <HydrateClient>
        <ReportTable variant="owner" />
      </HydrateClient>
    </>
  );
}
