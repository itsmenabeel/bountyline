import { describe, expect, it } from "vitest";
import { coverageText, poolCoverage } from "./pool-coverage";

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
