import { SendHorizontal } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ReportTable } from "@/features/reports/components/report-table";
import { reportListParams } from "@/features/reports/params";
import { reportListQuery } from "@/features/reports/queries";
import { parseListParams } from "@/lib/list-params";
import { HydrateClient, prefetch } from "@/lib/query/server";

export const metadata: Metadata = { title: "My reports" };

export default async function ResearcherReportsPage({
  searchParams,
}: PageProps<"/researcher/reports">) {
  const params = parseListParams(reportListParams, await searchParams);
  await prefetch(reportListQuery(params));
  return (
    <>
      <PageHeader
        title="My reports"
        description="Every report you've submitted and where it stands in triage."
        actions={
          <Button asChild size="lg">
            <Link href="/researcher/reports/new">
              <SendHorizontal aria-hidden="true" />
              Submit a report
            </Link>
          </Button>
        }
      />
      <HydrateClient>
        <ReportTable variant="researcher" />
      </HydrateClient>
    </>
  );
}
