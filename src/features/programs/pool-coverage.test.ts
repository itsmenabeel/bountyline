import { describe, expect, it } from "vitest";
import type { Program } from "@/types/api";
import {
  coverageText,
  lowPoolPrograms,
  lowPoolText,
  poolCoverage,
} from "./pool-coverage";

const tiers = [
  { severity: "LOW", amount: 10_000 },
  { severity: "HIGH", amount: 150_000 },
  { severity: "CRITICAL", amount: 500_000 },
] as const;

describe("poolCoverage", () => {
  it("counts whole payouts of the best-paying tier", () => {
    const coverage = poolCoverage({
      poolBalance: 3_400_000,
      rewardTiers: [...tiers],
    });
    expect(coverage?.tier.severity).toBe("CRITICAL");
    expect(coverage?.payouts).toBe(6);
    expect(coverageText(coverage)).toBe("Covers 6 Critical payouts");
  });

  it("finds the top tier even when tiers arrive unsorted", () => {
    const coverage = poolCoverage({
      poolBalance: 150_000,
      rewardTiers: [tiers[1], tiers[0]],
    });
    expect(coverageText(coverage)).toBe("Covers 1 High payout");
  });

  it("says when the pool can't cover one payout", () => {
    const coverage = poolCoverage({
      poolBalance: 340_000,
      rewardTiers: [...tiers],
    });
    expect(coverageText(coverage)).toBe("Can't cover a Critical payout");
  });

  it("handles a program without tiers", () => {
    expect(poolCoverage({ poolBalance: 0, rewardTiers: [] })).toBeNull();
    expect(coverageText(null)).toBe("No reward tiers yet");
  });
});

describe("lowPoolPrograms", () => {
  const program = (
    title: string,
    status: Program["status"],
    poolBalance: number,
    rewardTiers: Program["rewardTiers"] = [...tiers],
  ) => ({ title, status, poolBalance, rewardTiers }) as Program;

  it("lists live programs that can't pay one top-tier payout, biggest gap first", () => {
    const low = lowPoolPrograms([
      program("Covered", "ACTIVE", 600_000),
      program("Short", "ACTIVE", 340_000),
      program("Empty", "PAUSED", 0),
      program("Closed", "CLOSED", 0),
      program("Draft", "DRAFT", 0),
      program("No tiers", "ACTIVE", 0, []),
    ]);
    expect(low.map((entry) => entry.program.title)).toEqual(["Empty", "Short"]);
    expect(low[1]?.shortfall).toBe(160_000);
  });

  it("says what to add (design-plan §12, owner low pool)", () => {
    const [entry] = lowPoolPrograms([
      program("Acme Web Application", "ACTIVE", 340_000, [
        { severity: "CRITICAL", amount: 660_000 },
      ]),
    ]);
    expect(entry && lowPoolText(entry)).toBe(
      "Acme Web Application can't cover a Critical payout. Add at least $3,200.00 to keep it covered.",
    );
  });
});
