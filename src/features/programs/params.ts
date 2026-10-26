import { listParamsSchema, optionalEnum } from "@/lib/list-params";
import { PROGRAM_STATUSES } from "@/types/api";

// The backend's sort whitelist for /programs and /public/programs.
export const PROGRAM_SORTS = ["createdAt", "title", "poolBalance"] as const;
export type ProgramSort = (typeof PROGRAM_SORTS)[number];

/** The card directory (public and researcher): search and sort. Only ACTIVE programs show. */
export const directoryParams = listParamsSchema({
  sortBy: PROGRAM_SORTS,
  defaultSort: "createdAt",
});

/** The owner and admin tables, which also filter by status. */
export const programTableParams = listParamsSchema({
  sortBy: PROGRAM_SORTS,
  defaultSort: "createdAt",
  filters: { status: optionalEnum(PROGRAM_STATUSES) },
});
