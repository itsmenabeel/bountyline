import type { ApiError } from "@/lib/api/errors";
import { formatMoney } from "@/lib/money";
import type { Cents } from "@/types/api";

export interface PayoutPlan {
  /** The pool can pay the tier now. The backend checks again inside its transaction. */
  covered: boolean;
  poolAfter: Cents;
  /** What the owner has to add first; 0 when covered. */
  shortfall: Cents;
}

export function payoutPlan({
  amount,
  poolBalance,
}: {
  amount: Cents;
  poolBalance: Cents;
}): PayoutPlan {
  return {
    covered: poolBalance >= amount,
    poolAfter: poolBalance - amount,
    shortfall: Math.max(0, amount - poolBalance),
  };
}

interface PayoutParties {
  researcher: string;
  program: string;
  amount: Cents;
}

/** The confirm dialog's question (design-plan §12, "Payout confirm"). */
export function payoutConfirmText({
  researcher,
  program,
  amount,
  poolAfter,
}: PayoutParties & { poolAfter: Cents }) {
  return `Pay ${researcher} ${formatMoney(amount)} from ${program}'s pool? The pool drops to ${formatMoney(poolAfter)}. You can't undo a payout.`;
}

/** The toast once the backend has paid, with the pool it reports back. */
export function payoutDoneText({
  researcher,
  program,
  amount,
  poolBalance,
}: PayoutParties & { poolBalance: Cents }) {
  return `Paid ${researcher} ${formatMoney(amount)}. ${program}'s pool now holds ${formatMoney(poolBalance)}.`;
}

export const INSUFFICIENT_POOL_MESSAGE =
  "This program's pool can't cover the reward. The owner needs to add funds first.";

/** 409 codes get the design-plan §7.5 copy; any other 409 means the report moved on. */
export function rewardFailureMessage(error: ApiError) {
  if (error.code === "INSUFFICIENT_POOL") return INSUFFICIENT_POOL_MESSAGE;
  if (error.code === "ALREADY_REWARDED") {
    return "This report has already been paid.";
  }
  if (error.status === 409) {
    return "Someone changed this report while you had it open. The page now shows where it stands.";
  }
  return `We couldn't pay this report. ${error.userMessage}`;
}
