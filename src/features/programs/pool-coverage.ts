import { SEVERITY_LABEL } from "@/lib/constants/domain";
import { formatMoney } from "@/lib/money";
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

export interface LowPool {
  program: Program;
  /** The best-paying tier, which the pool can't pay once. */
  tier: RewardTier;
  /** What the owner has to add to cover that tier once. */
  shortfall: number;
}

/**
 * Programs still taking or holding reports (ACTIVE or PAUSED) whose pool can't cover one
 * top-tier payout (design-plan §7.4, "Low pool"), biggest gap first.
 */
export function lowPoolPrograms(programs: Program[]): LowPool[] {
  return programs
    .filter(
      (program) => program.status === "ACTIVE" || program.status === "PAUSED",
    )
    .flatMap((program) => {
      const coverage = poolCoverage(program);
      if (!coverage || coverage.payouts > 0) return [];
      return [
        {
          program,
          tier: coverage.tier,
          shortfall: coverage.tier.amount - program.poolBalance,
        },
      ];
    })
    .sort((a, b) => b.shortfall - a.shortfall);
}

/** "Acme Web Application can't cover a Critical payout. Add at least $3,200.00 to keep it covered." */
export function lowPoolText({ program, tier, shortfall }: LowPool) {
  return `${program.title} can't cover a ${SEVERITY_LABEL[tier.severity]} payout. Add at least ${formatMoney(shortfall)} to keep it covered.`;
}
