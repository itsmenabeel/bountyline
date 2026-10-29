import { z } from "zod";
import { listParamsSchema } from "@/lib/list-params";

// The backend's sort whitelist for /payouts.
export const PAYOUT_SORTS = ["createdAt", "amount"] as const;
export type PayoutSort = (typeof PAYOUT_SORTS)[number];

/** Payout lists: a program filter, newest first. The backend has no search. */
export const payoutListParams = listParamsSchema({
  sortBy: PAYOUT_SORTS,
  defaultSort: "createdAt",
  filters: {
    // The backend answers a malformed id with a 422, so a bad one is dropped instead.
    programId: z.uuid().optional().catch(undefined),
  },
});
