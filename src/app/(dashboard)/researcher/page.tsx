import { FileText, SendHorizontal } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DashboardSection } from "@/components/shared/dashboard-section";
import { EmptyState } from "@/components/shared/empty-state";
import { Money } from "@/components/shared/money";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { ProgramCard } from "@/features/programs/components/program-card";
import { programEndpoints } from "@/features/programs/endpoints";
import { ReportList } from "@/features/reports/components/report-list";
import { reportEndpoints } from "@/features/reports/endpoints";
import { countReports } from "@/features/reports/server";
import { serverRequest } from "@/lib/api/server";
import { getCurrentUser } from "@/lib/auth/current-user";

export const metadata: Metadata = { title: "Overview" };

const count = (value: number) => value.toLocaleString("en-US");
const REPORTS = "/researcher/reports";

/** design-plan §7.3: money and standing, what needs a reply, recent reports, programs to try. */
export default async function ResearcherOverviewPage() {
  const [
    me,
    waiting,
    triaging,
    accepted,
    rewarded,
    needsInfo,
    recent,
    programs,
  ] = await Promise.all([
    getCurrentUser(),
    countReports("NEW"),
    countReports("TRIAGING"),
    countReports("ACCEPTED"),
    countReports("REWARDED"),
    serverRequest(
      reportEndpoints.list({
        page: 1,
        limit: 5,
        sortBy: "updatedAt",
        order: "desc",
        status: "NEEDS_INFO",
      }),
    ),
    serverRequest(
      reportEndpoints.list({
        page: 1,
        limit: 5,
        sortBy: "updatedAt",
        order: "desc",
      }),
    ),
    // The biggest pools first: the programs most able to pay.
    serverRequest(
      programEndpoints.list({
        page: 1,
        limit: 2,
        sortBy: "poolBalance",
        order: "desc",
      }),
    ),
  ]);
  const replies = needsInfo.meta.total;
  const open = waiting + triaging + accepted + replies;

  return (
    <>
      <PageHeader
        title="Overview"
        description="Your reports, what they've earned, and anything waiting on you."
        actions={
          <Button asChild size="lg">
            <Link href={`${REPORTS}/new`}>
              <SendHorizontal aria-hidden="true" />
              Submit a report
            </Link>
          </Button>
        }
      />
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Wallet"
          value={<Money cents={me.walletBalance} tone="money" />}
          helper="Rewards paid to you"
          href="/researcher/earnings"
        />
        <StatCard
          label="Reputation"
          value={count(me.reputation)}
          helper="Grows with each rewarded report"
        />
        <StatCard
          label="Open reports"
          value={count(open)}
          helper={
            replies > 0
              ? `${count(replies)} waiting on your reply`
              : `${count(waiting)} not triaged yet`
          }
          href={REPORTS}
        />
        <StatCard
          label="Rewarded"
          value={count(rewarded)}
          href={`${REPORTS}?status=REWARDED`}
        />
      </dl>

      {replies > 0 && (
        <DashboardSection
          title="Needs your reply"
          description="The triage team asked for more detail. Editing a report sends it back to triage."
          viewAll={
            replies > needsInfo.items.length
              ? { href: `${REPORTS}?status=NEEDS_INFO`, label: "View all" }
              : undefined
          }
        >
          <ReportList reports={needsInfo.items} basePath={REPORTS} />
        </DashboardSection>
      )}

      <DashboardSection
        title="Recent reports"
        viewAll={
          recent.meta.total > 0
            ? { href: REPORTS, label: "View all reports" }
            : undefined
        }
      >
        {recent.items.length > 0 ? (
          <ReportList reports={recent.items} basePath={REPORTS} />
        ) : (
          <div className="rounded-xl border bg-card">
            <EmptyState
              icon={FileText}
              title="You haven't submitted a report yet."
              description="Pick an active program and read its scope first."
              action={
                <Button asChild>
                  <Link href="/researcher/programs">Browse programs</Link>
                </Button>
              }
            />
          </div>
        )}
      </DashboardSection>

      {programs.items.length > 0 && (
        <DashboardSection
          title="Programs with the biggest pools"
          viewAll={{ href: "/researcher/programs", label: "Browse programs" }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            {programs.items.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                href={`/researcher/programs/${program.id}`}
                headingLevel="h3"
              />
            ))}
          </div>
        </DashboardSection>
      )}
    </>
  );
}
