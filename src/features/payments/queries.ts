import type { z } from "zod";
import { describeQuery } from "@/lib/query/descriptor";
import { paymentEndpoints } from "./endpoints";
import type { paymentListParams } from "./params";

export type PaymentListParams = z.output<typeof paymentListParams>;

export const paymentKeys = {
  all: ["payments"] as const,
  lists: () => [...paymentKeys.all, "list"] as const,
  list: (params: PaymentListParams) =>
    [...paymentKeys.lists(), params] as const,
  detail: (id: string) => [...paymentKeys.all, "detail", id] as const,
};

export function paymentListQuery(params: PaymentListParams) {
  const { page, limit, sortBy, order, status, programId } = params;
  return describeQuery(
    paymentKeys.list(params),
    paymentEndpoints.list({ page, limit, sortBy, order, status, programId }),
  );
}

export function paymentDetailQuery(id: string) {
  return describeQuery(paymentKeys.detail(id), paymentEndpoints.detail(id));
}
