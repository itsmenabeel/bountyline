import type { Metadata } from "next";
import { getProgram } from "@/features/programs/server";
import { CommentThread } from "@/features/reports/components/comment-thread";
import { ReportDetail } from "@/features/reports/components/report-detail";
import { TriagePanel } from "@/features/reports/components/triage-panel";
import { getPayoutAmount, getReport } from "@/features/reports/server";

export async function generateMetadata({
  params,
}: PageProps<"/admin/reports/[id]">): Promise<Metadata> {
  return { title: (await getReport((await params).id)).title };
}

export default async function TriageReportPage({
  params,
}: PageProps<"/admin/reports/[id]">) {
  const report = await getReport((await params).id);
  const [program, payoutAmount] = await Promise.all([
    getProgram(report.programId),
    getPayoutAmount(report),
  ]);

  return (
    <ReportDetail
      report={report}
      directory={{ href: "/admin/reports", label: "Triage queue" }}
      programHref={`/admin/programs/${report.programId}`}
      payoutAmount={payoutAmount}
      actions={
        // A status change re-renders this page; the key gives the panel a fresh form.
        <TriagePanel
          key={`${report.status}-${report.updatedAt}`}
          report={report}
          program={program}
          payoutAmount={payoutAmount}
        />
      }
      comments={
        <CommentThread
          reportId={report.id}
          audienceNote="The researcher and the program owner read the comments on this report."
        />
      }
    />
  );
}
