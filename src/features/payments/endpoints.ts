import { endpoint, listEndpoint } from "@/lib/api/request";
import type {
  Cents,
  CheckoutResult,
  Payment,
  PaymentStatus,
} from "@/types/api";
import type { PaymentSort } from "./params";

export interface PaymentListQuery {
  page: number;
  limit: number;
  sortBy: PaymentSort;
  order: "asc" | "desc";
  status?: PaymentStatus;
  programId?: string;
  /** The `session_id` Stripe appends to the success URL. */
  sessionId?: string;
}

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
  /** Payments on the owner's programs, or every payment for admins. */
  list: (query: PaymentListQuery) =>
    listEndpoint<Payment>({ path: "/payments", query: { ...query } }),
  detail: (id: string) => endpoint<Payment>({ path: `/payments/${id}` }),
  /**
   * Asks Stripe where a PENDING payment stands and applies the answer: a paid session
   * credits the pool, an expired one turns CANCELLED. Other statuses come back unchanged.
   */
  verify: (id: string) =>
    endpoint<Payment>({ method: "POST", path: `/payments/${id}/verify` }),
};
