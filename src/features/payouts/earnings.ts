import type { ChartRow } from "@/features/admin/stats";
import { formatMoney } from "@/lib/money";
import type { Payout } from "@/types/api";

// Payouts grouped by program for the earnings chart (design-plan §10, single series in money
// green). The payouts API has no totals per program, so the page groups a page of payouts.

const MONEY = "var(--chart-2)";
/** Bars past this fold into one "other programs" bar, so the chart stays readable. */
export const MAX_PROGRAM_BARS = 8;

export function payoutsByProgram(payouts: Payout[]): ChartRow[] {
  const totals = new Map<string, { label: string; value: number }>();
  for (const payout of payouts) {
    const entry = totals.get(payout.program.id) ?? {
      label: payout.program.title,
      value: 0,
    };
    entry.value += payout.amount;
    totals.set(payout.program.id, entry);
  }
  const rows = [...totals.entries()]
    .map(([key, { label, value }]) => ({ key, label, value, color: MONEY }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
  if (rows.length <= MAX_PROGRAM_BARS) return rows;

  const kept = rows.slice(0, MAX_PROGRAM_BARS - 1);
  const rest = rows.slice(MAX_PROGRAM_BARS - 1);
  return [
    ...kept,
    {
      key: "other",
      label: `${rest.length} other programs`,
      value: rest.reduce((sum, row) => sum + row.value, 0),
      color: MONEY,
    },
  ];
}

/** The line above the chart: the total, how many payouts, and the program that paid most. */
export function earningsSummary(rows: ChartRow[], payoutCount: number) {
  if (payoutCount === 0) return "No payouts yet.";
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const payouts =
    payoutCount === 1
      ? "1 payout"
      : `${payoutCount.toLocaleString("en-US")} payouts`;
  const [top] = rows;
  if (!top) return `${formatMoney(total)} from ${payouts}.`;
  if (rows.length === 1) {
    return `${formatMoney(total)} from ${payouts}, all from ${top.label}.`;
  }
  return `${formatMoney(total)} from ${payouts} across ${rows.length} programs. ${top.label} paid the most.`;
}
