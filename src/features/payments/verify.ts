import type { ApiError } from "@/lib/api/errors";
import { formatMoney } from "@/lib/money";
import type { Payment, PaymentStatus } from "@/types/api";

/**
 * Waits before each verify call on the success page (implementation-plan §4.9). Stripe's
 * webhook usually lands first; after the last try the page offers "Check again".
 */
export const VERIFY_DELAYS_MS = [2000, 4000, 8000] as const;

type PaymentFacts = Pick<Payment, "amount" | "status" | "program">;

export interface PaymentOutcome {
  title: string;
  message: string;
}

const pool = (payment: PaymentFacts) => `${payment.program.title}'s pool`;

/** The success page's heading and sentence for each status (design-plan §7.6). */
export function paymentOutcome(payment: PaymentFacts): PaymentOutcome {
  const amount = formatMoney(payment.amount);
  switch (payment.status) {
    case "SUCCEEDED":
      return {
        title: "Payment received",
        message: `${amount} added to ${pool(payment)}.`,
      };
    case "PENDING":
      return {
        title: "Still confirming",
        message:
          "Stripe is still confirming the payment. We'll update the pool when it clears.",
      };
    case "FAILED":
      return {
        title: "Payment failed",
        message: `Stripe couldn't take this payment, so ${pool(payment)} stays as it was. You can try again from the program page.`,
      };
    case "CANCELLED":
      return {
        title: "Checkout expired",
        message:
          "Stripe closed this checkout before you paid and didn't charge your card.",
      };
  }
}

const CHECK_RESULT: Record<Exclude<PaymentStatus, "SUCCEEDED">, string> = {
  PENDING: "Stripe hasn't confirmed this payment yet. Check again in a minute.",
  FAILED: "Stripe couldn't take this payment.",
  CANCELLED: "Stripe closed this checkout and didn't charge your card.",
};

/** The toast after "Check status" in a payments table. */
export function checkStatusMessage(payment: PaymentFacts) {
  return payment.status === "SUCCEEDED"
    ? paymentOutcome(payment).message
    : CHECK_RESULT[payment.status];
}

export function verifyFailureMessage(error: ApiError) {
  if (error.status === 502) {
    return "Stripe isn't answering right now. Try again in a minute.";
  }
  if (error.status === 404) return "We couldn't find this payment.";
  return `We couldn't check with Stripe. ${error.userMessage}`;
}
