import { z } from "zod";
import { listParamsSchema, optionalEnum } from "@/lib/list-params";
import { PAYMENT_STATUSES } from "@/types/api";

// The backend's sort whitelist for /payments.
export const PAYMENT_SORTS = ["createdAt", "amount"] as const;
export type PaymentSort = (typeof PAYMENT_SORTS)[number];

/** Payment lists: status and program filters, newest first. The backend has no search. */
export const paymentListParams = listParamsSchema({
  sortBy: PAYMENT_SORTS,
  defaultSort: "createdAt",
  filters: {
    status: optionalEnum(PAYMENT_STATUSES),
    // The backend answers a malformed id with a 422, so a bad one is dropped instead.
    programId: z.uuid().optional().catch(undefined),
  },
});
