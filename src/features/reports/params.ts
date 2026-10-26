import { z } from "zod";
import { listParamsSchema, optionalEnum } from "@/lib/list-params";
import { REPORT_STATUSES, SEVERITIES } from "@/types/api";

// The backend's sort whitelist for /reports.
export const REPORT_SORTS = ["createdAt", "updatedAt", "title"] as const;
export type ReportSort = (typeof REPORT_SORTS)[number];

/** Report lists: status, severity, program, and a title search. */
export const reportListParams = listParamsSchema({
  sortBy: REPORT_SORTS,
  defaultSort: "createdAt",
  filters: {
    status: optionalEnum(REPORT_STATUSES),
    severity: optionalEnum(SEVERITIES),
    // The backend answers a malformed id with a 422, so a bad one is dropped instead.
    programId: z.uuid().optional().catch(undefined),
  },
});
