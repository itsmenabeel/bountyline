import type { Metadata } from "next";
import { Money } from "@/components/shared/money";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { AdminStatsCharts } from "@/features/admin/components/admin-stats-charts";
import { adminEndpoints } from "@/features/admin/endpoints";
import { openReportCount } from "@/features/admin/stats";
import { serverRequest } from "@/lib/api/server";

export const metadata: Metadata = { title: "Overview" };

const count = (value: number) => value.toLocaleString("en-US");

export default async function AdminOverviewPage() {
  const stats = await serverRequest(adminEndpoints.dashboardStats());
  const { reports, money, programs, users } = stats;

  return (
    <>
      <PageHeader
        title="Overview"
        description="Reports waiting for triage and the money moving through the platform."
      />
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Open reports"
          value={count(openReportCount(stats))}
          helper={`${count(reports.byStatus.NEW)} not triaged yet`}
          href="/admin/reports"
        />
        <StatCard
          label="Reports, last 7 days"
          value={count(reports.createdLast7Days)}
        />
        <StatCard
          label="In pools"
          value={<Money cents={programs.totalPoolBalance} tone="money" />}
          helper={`Across ${count(programs.total)} programs`}
        />
        <StatCard
          label="Paid out"
          value={<Money cents={money.totalPaidOut} tone="money" />}
          helper={`${count(money.payoutCount)} ${money.payoutCount === 1 ? "payout" : "payouts"}`}
        />
        <StatCard
          label="Pending payments"
          value={count(money.pendingPayments)}
          helper="Stripe checkouts not confirmed yet"
        />
        <StatCard label="Banned users" value={count(users.banned)} />
      </dl>
      <AdminStatsCharts stats={stats} />
    </>
  );
}
