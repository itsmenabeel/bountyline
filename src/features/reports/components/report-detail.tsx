import Link from "next/link";
import type { ReactNode } from "react";
import { MarkdownView } from "@/components/shared/markdown-view";
import { MonoId } from "@/components/shared/mono-id";
import { SeverityBadge } from "@/components/shared/severity-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { formatDate } from "@/lib/format";
import type { Cents, Report } from "@/types/api";
import { DisclosureTrack } from "./disclosure-track";

function Fact({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-sm text-muted-foreground">{term}</dt>
      <dd className="min-w-0 text-right text-sm">{children}</dd>
    </div>
  );
}

/**
 * One report: where it is in triage, the write-up, and the facts beside it. Each role's page
 * adds its own parts: a banner above the track, actions under the facts, and the comment
 * thread under the write-up.
 */
export function ReportDetail({
  report,
  directory,
  programHref,
  payoutAmount,
  banner,
  actions,
  comments,
}: {
  report: Report;
  /** The list this page came from, for the breadcrumb. */
  directory: { href: string; label: string };
  /** Where the program name links, or nothing when this role can't open it. */
  programHref?: string;
  /** What the report paid, once rewarded. */
  payoutAmount?: Cents;
  banner?: ReactNode;
  actions?: ReactNode;
  comments: ReactNode;
}) {
  const program = programHref ? (
    <Link
      href={programHref}
      className="font-medium underline-offset-4 hover:underline"
    >
      {report.program.title}
    </Link>
  ) : (
    report.program.title
  );

  return (
    <article className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={directory.href}>{directory.label}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="truncate">
                {report.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-balance md:text-3xl">
            {report.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
            <MonoId
              id={report.id}
              prefix="R"
              label="report"
              className="-ml-1.5"
            />
            <span>
              For {program}, submitted {formatDate(report.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {banner}

      <section
        aria-labelledby="report-progress"
        className="rounded-xl border bg-card p-5"
      >
        <h2 id="report-progress" className="sr-only">
          Progress
        </h2>
        <DisclosureTrack
          status={report.status}
          severity={report.severity}
          amount={payoutAmount}
          submittedAt={report.createdAt}
          updatedAt={report.updatedAt}
          duplicateOfId={report.duplicateOfId}
        />
      </section>

      {/* Phones read write-up, facts and actions, then comments. From lg the facts sit
          beside both, and the second row takes any extra height so a short write-up
          doesn't leave a gap above the comments. */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:grid-rows-[auto_1fr] lg:items-start">
        <section
          aria-labelledby="report-writeup"
          className="flex min-w-0 flex-col gap-3 lg:col-start-1 lg:row-start-1"
        >
          <h2 id="report-writeup" className="text-lg font-semibold">
            Write-up
          </h2>
          <div className="rounded-xl border bg-card p-5">
            <MarkdownView source={report.description} />
          </div>
        </section>

        <aside
          aria-label="Report details"
          className="flex flex-col gap-4 lg:col-start-2 lg:row-span-2 lg:row-start-1"
        >
          <div className="flex flex-col gap-4 rounded-xl border bg-card p-5">
            <dl className="flex flex-col divide-y">
              <Fact term="Status">
                <StatusBadge
                  kind="report"
                  status={report.status}
                  amount={payoutAmount}
                />
              </Fact>
              <Fact term="Severity">
                <SeverityBadge severity={report.severity} />
              </Fact>
              <Fact term="Program">{program}</Fact>
              <Fact term="Researcher">{report.researcher.name}</Fact>
              <Fact term="Submitted">{formatDate(report.createdAt)}</Fact>
              <Fact term="Last change">{formatDate(report.updatedAt)}</Fact>
            </dl>
            {actions}
          </div>
        </aside>

        <div className="min-w-0 lg:col-start-1 lg:row-start-2">{comments}</div>
      </div>
    </article>
  );
}
