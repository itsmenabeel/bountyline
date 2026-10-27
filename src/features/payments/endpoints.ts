import { endpoint } from "@/lib/api/request";
import type { Cents, CheckoutResult } from "@/types/api";

export const paymentEndpoints = {
  /**
   * Owners only, before CLOSED. Creates a PENDING payment and a Stripe Checkout session;
   * the pool grows once Stripe confirms the payment, not here.
   */
  checkout: (body: { programId: string; amount: Cents }) =>
    endpoint<CheckoutResult>({
      method: "POST",
      path: "/payments/checkout",
      body,
    }),
};
