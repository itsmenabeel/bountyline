"use client";

import { ChartCard } from "@/features/admin/components/chart-card";
import type { ChartRow } from "@/features/admin/stats";
import { formatMoney } from "@/lib/money";

/** The earnings page's payouts-by-program bars, with the shared card's table view. */
export function EarningsChart({
  rows,
  summary,
}: {
  rows: ChartRow[];
  summary: string;
}) {
  return (
    <ChartCard
      title="Payouts by program"
      summary={summary}
      rows={rows}
      orientation="horizontal"
      format={formatMoney}
      categoryHeader="Program"
      valueHeader="Paid to you"
    />
  );
}
