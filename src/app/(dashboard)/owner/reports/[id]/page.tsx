import { Info } from "lucide-react";
import type { Metadata } from "next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CommentThread } from "@/features/reports/components/comment-thread";
import { ReportDetail } from "@/features/reports/components/report-detail";
import { getPayoutAmount, getReport } from "@/features/reports/server";

export async function generateMetadata({
  params,
}: PageProps<"/owner/reports/[id]">): Promise<Metadata> {
  return { title: (await getReport((await params).id)).title };
}

/** A report on one of the owner's programs: read and comment, no triage (design-plan §7.4). */
export default async function OwnerReportPage({
  params,
}: PageProps<"/owner/reports/[id]">) {
  const report = await getReport((await params).id);
  const payoutAmount = await getPayoutAmount(report);

  return (
    <ReportDetail
      report={report}
      directory={{ href: "/owner/reports", label: "Reports" }}
      programHref={`/owner/programs/${report.programId}`}
      payoutAmount={payoutAmount}
      banner={
        <Alert>
          <Info aria-hidden="true" />
          <AlertDescription>
            Platform admins triage reports. You can comment to add context.
          </AlertDescription>
        </Alert>
      }
      comments={
        <CommentThread
          reportId={report.id}
          audienceNote="The researcher and the triage team read the comments on this report."
        />
      }
    />
  );
}
