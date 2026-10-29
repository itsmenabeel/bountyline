import { describe, expect, it } from "vitest";
import type { Payout } from "@/types/api";
import {
  earningsSummary,
  MAX_PROGRAM_BARS,
  payoutsByProgram,
} from "./earnings";

let next = 0;
const payout = (programId: string, title: string, amount: number) =>
  ({
    id: `pay-${next++}`,
    amount,
    status: "PAID",
    createdAt: "2026-10-26T00:00:00.000Z",
    report: { id: "r", title: "Report" },
    program: { id: programId, title },
    researcher: { id: "u", name: "Riley" },
  }) satisfies Payout;

describe("payoutsByProgram", () => {
  it("adds payouts per program, biggest first", () => {
    const rows = payoutsByProgram([
      payout("a", "Acme", 50_000),
      payout("n", "Northwind", 150_000),
      payout("a", "Acme", 500_000),
    ]);
    expect(rows.map(({ label, value }) => [label, value])).toEqual([
      ["Acme", 550_000],
      ["Northwind", 150_000],
    ]);
  });

  it("folds the smallest programs into one bar past the cap", () => {
    const many = Array.from({ length: 10 }, (_, index) =>
      payout(`p${index}`, `Program ${index}`, (index + 1) * 1_000),
    );
    const rows = payoutsByProgram(many);
    expect(rows).toHaveLength(MAX_PROGRAM_BARS);
    expect(rows.at(-1)).toMatchObject({
      label: "3 other programs",
      value: 6_000,
    });
  });
});

describe("earningsSummary", () => {
  it("gives the total, the count, and the program that paid most", () => {
    const rows = payoutsByProgram([
      payout("a", "Acme", 500_000),
      payout("n", "Northwind", 150_000),
    ]);
    expect(earningsSummary(rows, 2)).toBe(
      "$6,500.00 from 2 payouts across 2 programs. Acme paid the most.",
    );
  });

  it("handles one program and none", () => {
    const rows = payoutsByProgram([payout("a", "Acme", 10_000)]);
    expect(earningsSummary(rows, 1)).toBe(
      "$100.00 from 1 payout, all from Acme.",
    );
    expect(earningsSummary([], 0)).toBe("No payouts yet.");
  });
});
