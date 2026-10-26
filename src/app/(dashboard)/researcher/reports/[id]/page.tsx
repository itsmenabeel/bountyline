import { MessageCircleQuestion, PencilLine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CommentThread } from "@/features/reports/components/comment-thread";
import { ReportDetail } from "@/features/reports/components/report-detail";
import { ResearcherReportActions } from "@/features/reports/components/researcher-report-actions";
import { getPayoutAmount, getReport } from "@/features/reports/server";
import { isReportEditable } from "@/lib/constants/domain";

export async function generateMetadata({
  params,
}: PageProps<"/researcher/reports/[id]">): Promise<Metadata> {
  return { title: (await getReport((await params).id)).title };
}

function NeedsInfoBanner({ editHref }: { editHref: string }) {
  return (
    <Alert className="border-primary/40">
      <MessageCircleQuestion aria-hidden="true" />
      <AlertTitle>The triage team asked for more detail.</AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-3">
        <p>Editing the report sends it back to triage.</p>
        <Button asChild>
          <Link href={editHref}>
            <PencilLine aria-hidden="true" />
            Reply with details
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export default async function ResearcherReportPage({
  params,
}: PageProps<"/researcher/reports/[id]">) {
  const report = await getReport((await params).id);
  const payoutAmount = await getPayoutAmount(report);
  const listHref = "/researcher/reports";
  const editHref = `${listHref}/${report.id}/edit`;

  return (
    <ReportDetail
      report={report}
      directory={{ href: listHref, label: "My reports" }}
      programHref={`/researcher/programs/${report.programId}`}
      payoutAmount={payoutAmount}
      banner={
        report.status === "NEEDS_INFO" ? (
          <NeedsInfoBanner editHref={editHref} />
        ) : undefined
      }
      actions={
        isReportEditable(report.status) ? (
          <ResearcherReportActions
            reportId={report.id}
            title={report.title}
            editHref={editHref}
            listHref={listHref}
          />
        ) : undefined
      }
      comments={
        <CommentThread
          reportId={report.id}
          audienceNote="The program owner and the triage team read the comments on this report."
        />
      }
    />
  );
}
