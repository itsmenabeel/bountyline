import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { ReportTable } from "@/features/reports/components/report-table";
import { triageQueueParams } from "@/features/reports/params";
import { reportListQuery } from "@/features/reports/queries";
import { parseListParams } from "@/lib/list-params";
import { HydrateClient, prefetch } from "@/lib/query/server";

export const metadata: Metadata = { title: "Triage queue" };

export default async function TriageQueuePage({
  searchParams,
}: PageProps<"/admin/reports">) {
  const params = parseListParams(triageQueueParams, await searchParams);
  await prefetch(reportListQuery(params));
  return (
    <>
      <PageHeader
        title="Triage queue"
        description="Every report on the platform, oldest first. Open one to triage it."
      />
      <HydrateClient>
        <ReportTable variant="admin" />
      </HydrateClient>
    </>
  );
}
