import { listEndpoint } from "@/lib/api/request";
import type { Payout } from "@/types/api";

export interface PayoutListQuery {
  page: number;
  limit: number;
  sortBy: "createdAt" | "amount";
  order: "asc" | "desc";
  programId?: string;
}

export const payoutEndpoints = {
  /** A researcher's own payouts, an owner's programs', or all for admins. */
  list: (query: PayoutListQuery) =>
    listEndpoint<Payout>({ path: "/payouts", query: { ...query } }),
};
