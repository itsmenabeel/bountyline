import type { z } from "zod";
import { describeQuery } from "@/lib/query/descriptor";
import { payoutEndpoints } from "./endpoints";
import type { payoutListParams } from "./params";

export type PayoutListParams = z.output<typeof payoutListParams>;

export const payoutKeys = {
  all: ["payouts"] as const,
  lists: () => [...payoutKeys.all, "list"] as const,
  list: (params: PayoutListParams) => [...payoutKeys.lists(), params] as const,
};

export function payoutListQuery(params: PayoutListParams) {
  const { page, limit, sortBy, order, programId } = params;
  return describeQuery(
    payoutKeys.list(params),
    payoutEndpoints.list({ page, limit, sortBy, order, programId }),
  );
}
