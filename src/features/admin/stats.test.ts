import { describe, expect, it } from "vitest";
import type { DashboardStats } from "@/types/api";
import {
  moneyRows,
  moneySummary,
  openReportCount,
  reportStatusRows,
  reportStatusSummary,
  roleSummary,
  severityRows,
  severitySummary,
} from "./stats";

const stats: DashboardStats = {
  users: {
    total: 9,
    banned: 1,
    byRole: { RESEARCHER: 5, PROGRAM_OWNER: 3, ADMIN: 1 },
  },
  programs: {
    total: 5,
    byStatus: { DRAFT: 1, ACTIVE: 3, PAUSED: 1, CLOSED: 0 },
    totalPoolBalance: 2_000_000,
  },
  reports: {
    total: 12,
    byStatus: {
      NEW: 3,
      TRIAGING: 2,
      NEEDS_INFO: 1,
      ACCEPTED: 1,
      REWARDED: 3,
      REJECTED: 1,
      DUPLICATE: 1,
    },
    bySeverity: { LOW: 2, MEDIUM: 1, HIGH: 1, CRITICAL: 1 },
    createdLast7Days: 4,
  },
  money: {
    totalFunded: 3_000_000,
    totalPaidOut: 450_000,
    payoutCount: 3,
    pendingPayments: 1,
  },
};

describe("admin stats", () => {
  it("counts open reports: new through accepted", () => {
    expect(openReportCount(stats)).toBe(7);
  });

  it("orders statuses by the lifecycle and tints only Rewarded green", () => {
    const rows = reportStatusRows(stats);
    expect(rows.map((row) => row.label)).toEqual([
      "New",
      "In triage",
      "Needs info",
      "Accepted",
      "Rewarded",
      "Rejected",
      "Duplicate",
    ]);
    expect(rows.filter((row) => row.color === "var(--chart-2)")).toHaveLength(
      1,
    );
  });

  it("runs severity Low to Critical on the chart ramp", () => {
    expect(severityRows(stats).map((row) => row.color)).toEqual([
      "var(--chart-severity-low)",
      "var(--chart-severity-medium)",
      "var(--chart-severity-high)",
      "var(--chart-severity-critical)",
    ]);
  });

  it("writes the one-line summaries, singular where it should be", () => {
    expect(reportStatusSummary(stats)).toBe(
      "7 reports are open; 3 are waiting for first triage.",
    );
    expect(severitySummary(stats)).toBe(
      "5 reports have a severity; 1 is Critical.",
    );
    expect(roleSummary(stats)).toBe("9 accounts, 1 banned.");
    expect(moneySummary(stats)).toBe(
      "$30,000.00 funded through Stripe; $4,500.00 paid to researchers in 3 payouts.",
    );
    expect(moneyRows(stats).map((row) => row.value)).toEqual([
      3_000_000, 450_000, 2_000_000,
    ]);
  });

  it("says so when there is nothing to chart", () => {
    const empty: DashboardStats = {
      ...stats,
      users: { ...stats.users, total: 0 },
      reports: {
        ...stats.reports,
        total: 0,
        bySeverity: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
      },
      money: { ...stats.money, totalFunded: 0, totalPaidOut: 0 },
    };
    expect(reportStatusSummary(empty)).toBe("No reports yet.");
    expect(
      reportStatusSummary({
        ...stats,
        reports: {
          ...stats.reports,
          byStatus: { ...stats.reports.byStatus, NEW: 0 },
        },
      }),
    ).toBe("4 reports are open; none are waiting for first triage.");
    expect(severitySummary(empty)).toBe("No report has a severity yet.");
    expect(roleSummary(empty)).toBe("No accounts yet.");
    expect(moneySummary(empty)).toBe("No money has moved yet.");
  });
});
