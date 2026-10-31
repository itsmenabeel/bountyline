import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/format";
import type { Report } from "@/types/api";
import { DisclosureTrack } from "./disclosure-track";

/**
 * A short list of reports for overview pages: title, program, status with the compact
 * track, and the last change. The full table lives on the reports page.
 */
export function ReportList({
  reports,
  basePath,
}: {
  reports: Report[];
  /** Titles link to `${basePath}/${id}`. */
  basePath: string;
}) {
  return (
    <ul className="flex flex-col divide-y rounded-xl border bg-card">
      {reports.map((report) => (
        <li
          key={report.id}
          className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
        >
          <div className="flex min-w-0 flex-col gap-0.5">
            <Link
              href={`${basePath}/${report.id}`}
              className="touch-link font-medium text-pretty underline-offset-4 hover:underline"
            >
              {report.title}
            </Link>
            <span className="text-xs text-muted-foreground">
              {report.program.title}, updated {formatDate(report.updatedAt)}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <StatusBadge kind="report" status={report.status} />
            <DisclosureTrack status={report.status} variant="compact" />
          </div>
        </li>
      ))}
    </ul>
  );
}
