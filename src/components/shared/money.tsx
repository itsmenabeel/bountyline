import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Cents } from "@/types/api";

/**
 * An amount in mono with tabular figures, so columns of money line up. `tone="money"` tints
 * it green for funds (pools, payouts, succeeded payments); green means money and nothing else.
 */
export function Money({
  cents,
  tone = "plain",
  className,
}: {
  cents: Cents;
  tone?: "plain" | "money";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-mono tabular-nums",
        tone === "money" && "text-money",
        className,
      )}
    >
      {formatMoney(cents)}
    </span>
  );
}
