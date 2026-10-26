import { SEVERITY_LABEL } from "@/lib/constants/domain";
import type { Program, RewardTier } from "@/types/api";

export interface PoolCoverage {
  /** The best-paying tier: the payout the pool most needs to cover. */
  tier: RewardTier;
  /** Whole payouts of that tier the pool can fund right now. */
  payouts: number;
}

/** How many top-tier payouts the pool covers (design-plan §5), or null without tiers. */
export function poolCoverage(
  program: Pick<Program, "poolBalance" | "rewardTiers">,
): PoolCoverage | null {
  // The backend sorts tiers by amount, lowest first; taking the largest here keeps that from
  // mattering.
  const tier = program.rewardTiers.reduce<RewardTier | null>(
    (top, next) => (top && top.amount >= next.amount ? top : next),
    null,
  );
  if (!tier) return null;
  return { tier, payouts: Math.floor(program.poolBalance / tier.amount) };
}

/** "Covers 6 Critical payouts", "Can't cover a High payout", or "No reward tiers yet". */
export function coverageText(coverage: PoolCoverage | null) {
  if (!coverage) return "No reward tiers yet";
  const severity = SEVERITY_LABEL[coverage.tier.severity];
  if (coverage.payouts === 0) return `Can't cover a ${severity} payout`;
  return coverage.payouts === 1
    ? `Covers 1 ${severity} payout`
    : `Covers ${coverage.payouts.toLocaleString("en-US")} ${severity} payouts`;
}
