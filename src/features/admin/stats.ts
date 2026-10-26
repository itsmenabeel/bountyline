import {
  OPEN_REPORT_STATUSES,
  REPORT_STATUS_LABEL,
  SEVERITY_LABEL,
} from "@/lib/constants/domain";
import { formatMoney } from "@/lib/money";
import type { DashboardStats, ReportStatus, Role, Severity } from "@/types/api";

// Turns GET /admin/dashboard-stats into chart rows and the one-line summaries above each
// chart (design-plan §10). The endpoint has no time series, so there are no trends here.

export interface ChartRow {
  key: string;
  label: string;
  value: number;
  /** A CSS color for the bar, from the chart tokens in globals.css. */
  color: string;
}

const NEUTRAL = "var(--chart-1)";
const MONEY = "var(--chart-2)";

const count = (value: number) => value.toLocaleString("en-US");
const plural = (value: number, one: string, many: string) =>
  `${count(value)} ${value === 1 ? one : many}`;

/** Lifecycle order: the way a report moves, then the two ways it can end early. */
const LIFECYCLE: ReportStatus[] = [
  "NEW",
  "TRIAGING",
  "NEEDS_INFO",
  "ACCEPTED",
  "REWARDED",
  "REJECTED",
  "DUPLICATE",
];

export function openReportCount(stats: DashboardStats) {
  return OPEN_REPORT_STATUSES.reduce(
    (sum, status) => sum + stats.reports.byStatus[status],
    0,
  );
}

export function reportStatusRows(stats: DashboardStats): ChartRow[] {
  return LIFECYCLE.map((status) => ({
    key: status,
    label: REPORT_STATUS_LABEL[status],
    value: stats.reports.byStatus[status],
    // Rewarded is the one status that means money moved.
    color: status === "REWARDED" ? MONEY : NEUTRAL,
  }));
}

export function reportStatusSummary(stats: DashboardStats) {
  if (stats.reports.total === 0) return "No reports yet.";
  const open = openReportCount(stats);
  const waiting = stats.reports.byStatus.NEW;
  const waitingText =
    waiting === 0
      ? "none are"
      : waiting === 1
        ? "1 is"
        : `${count(waiting)} are`;
  return `${plural(open, "report is", "reports are")} open; ${waitingText} waiting for first triage.`;
}

const SEVERITY_ORDER: Severity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export function severityRows(stats: DashboardStats): ChartRow[] {
  return SEVERITY_ORDER.map((severity) => ({
    key: severity,
    label: SEVERITY_LABEL[severity],
    value: stats.reports.bySeverity[severity],
    color: `var(--chart-severity-${severity.toLowerCase()})`,
  }));
}

export function severitySummary(stats: DashboardStats) {
  const rated = SEVERITY_ORDER.reduce(
    (sum, severity) => sum + stats.reports.bySeverity[severity],
    0,
  );
  if (rated === 0) return "No report has a severity yet.";
  return `${plural(rated, "report has", "reports have")} a severity; ${count(stats.reports.bySeverity.CRITICAL)} ${stats.reports.bySeverity.CRITICAL === 1 ? "is" : "are"} Critical.`;
}

const ROLE_ORDER: { role: Role; label: string }[] = [
  { role: "RESEARCHER", label: "Researchers" },
  { role: "PROGRAM_OWNER", label: "Program owners" },
  { role: "ADMIN", label: "Admins" },
];

export function roleRows(stats: DashboardStats): ChartRow[] {
  return ROLE_ORDER.map(({ role, label }) => ({
    key: role,
    label,
    value: stats.users.byRole[role],
    color: NEUTRAL,
  }));
}

export function roleSummary(stats: DashboardStats) {
  if (stats.users.total === 0) return "No accounts yet.";
  return `${plural(stats.users.total, "account", "accounts")}, ${count(stats.users.banned)} banned.`;
}

export function moneyRows(stats: DashboardStats): ChartRow[] {
  return [
    {
      key: "funded",
      label: "Funded",
      value: stats.money.totalFunded,
      color: MONEY,
    },
    {
      key: "paid",
      label: "Paid out",
      value: stats.money.totalPaidOut,
      color: MONEY,
    },
    {
      key: "pools",
      label: "In pools now",
      value: stats.programs.totalPoolBalance,
      color: MONEY,
    },
  ];
}

export function moneySummary(stats: DashboardStats) {
  const { totalFunded, totalPaidOut, payoutCount } = stats.money;
  if (totalFunded === 0 && totalPaidOut === 0) return "No money has moved yet.";
  return `${formatMoney(totalFunded)} funded through Stripe; ${formatMoney(totalPaidOut)} paid to researchers in ${plural(payoutCount, "payout", "payouts")}.`;
}
