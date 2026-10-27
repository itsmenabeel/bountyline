import { z } from "zod";
import { formatMoney, parseDollarsToCents } from "@/lib/money";
import type { Cents } from "@/types/api";

// Mirrors bug-bounty-platform src/modules/payment/payment.validation.ts and
// src/shared/constants/payment.ts: one checkout adds $5.00 to $100,000.00, in integer cents.

export const FUNDING_AMOUNT = { min: 500, max: 10_000_000 } as const;

/** The fund dialog's one-tap amounts, in cents (design-plan §7.4). */
export const FUNDING_QUICK_PICKS: readonly Cents[] = [50_000, 150_000, 500_000];

export const fundPoolSchema = z.object({
  /** Dollars as typed; converted to cents through string parsing. */
  amount: z.string().transform((value, ctx): Cents => {
    if (!value.trim()) {
      ctx.addIssue({ code: "custom", message: "Enter the amount to add." });
      return z.NEVER;
    }
    const cents = parseDollarsToCents(value);
    if (cents === null) {
      ctx.addIssue({
        code: "custom",
        message: "Enter dollars, like 1,500 or 1500.00.",
      });
      return z.NEVER;
    }
    if (cents < FUNDING_AMOUNT.min) {
      ctx.addIssue({
        code: "custom",
        message: `Add at least ${formatMoney(FUNDING_AMOUNT.min)}.`,
      });
      return z.NEVER;
    }
    if (cents > FUNDING_AMOUNT.max) {
      ctx.addIssue({
        code: "custom",
        message: `Add ${formatMoney(FUNDING_AMOUNT.max)} or less in one payment.`,
      });
      return z.NEVER;
    }
    return cents;
  }),
});

export type FundPoolValues = z.input<typeof fundPoolSchema>;
export type FundPoolOutput = z.output<typeof fundPoolSchema>;

/** The typed amount in cents when it's one the backend accepts, otherwise null. */
export function fundingCents(amount: string): Cents | null {
  const result = fundPoolSchema.safeParse({ amount });
  return result.success ? result.data.amount : null;
}
