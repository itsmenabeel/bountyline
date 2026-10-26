"use client";

import { formatMoney } from "@/lib/money";
import type { DashboardStats } from "@/types/api";
import {
  moneyRows,
  moneySummary,
  reportStatusRows,
  reportStatusSummary,
  roleRows,
  roleSummary,
  severityRows,
  severitySummary,
} from "../stats";
import { ChartCard } from "./chart-card";

const count = (value: number) => value.toLocaleString("en-US");

/** The four overview charts (design-plan §10): bars only, no pies, no invented trends. */
export function AdminStatsCharts({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard
        title="Reports by status"
        summary={reportStatusSummary(stats)}
        rows={reportStatusRows(stats)}
        orientation="horizontal"
        format={count}
        categoryHeader="Status"
        valueHeader="Reports"
      />
      <ChartCard
        title="Reports by severity"
        summary={severitySummary(stats)}
        rows={severityRows(stats)}
        orientation="vertical"
        format={count}
        categoryHeader="Severity"
        valueHeader="Reports"
      />
      <ChartCard
        title="Users by role"
        summary={roleSummary(stats)}
        rows={roleRows(stats)}
        orientation="horizontal"
        format={count}
        categoryHeader="Role"
        valueHeader="Accounts"
      />
      <ChartCard
        title="Money"
        summary={moneySummary(stats)}
        rows={moneyRows(stats)}
        orientation="horizontal"
        format={formatMoney}
        categoryHeader="Measure"
        valueHeader="Amount"
      />
    </div>
  );
}
