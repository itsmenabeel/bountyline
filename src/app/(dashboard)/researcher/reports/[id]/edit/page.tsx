import { Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { ReportEditForm } from "@/features/reports/components/report-edit-form";
import { getReport } from "@/features/reports/server";
import { isReportEditable } from "@/lib/constants/domain";

export async function generateMetadata({
  params,
}: PageProps<"/researcher/reports/[id]/edit">): Promise<Metadata> {
  return { title: `Edit ${(await getReport((await params).id)).title}` };
}

export default async function EditReportPage({
  params,
}: PageProps<"/researcher/reports/[id]/edit">) {
  const report = await getReport((await params).id);
  const detailHref = `/researcher/reports/${report.id}`;

  if (!isReportEditable(report.status)) {
    return (
      <div className="rounded-xl border bg-card">
        <EmptyState
          icon={Lock}
          title="This report can't be edited now."
          description="Researchers can edit a report while it's New or Needs info. The triage team has moved this one on."
          action={
            <Button asChild variant="outline">
              <Link href={detailHref}>Open the report</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="Edit report"
        description={
          report.status === "NEEDS_INFO"
            ? "Add what the triage team asked for. Saving sends the report back to triage."
            : "You can change the report until the triage team picks it up."
        }
        actions={<StatusBadge kind="report" status={report.status} />}
      />
      <ReportEditForm report={report} detailHref={detailHref} />
    </div>
  );
}
