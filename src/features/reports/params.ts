import { z } from "zod";
import { listParamsSchema, optionalEnum } from "@/lib/list-params";
import { REPORT_STATUSES, SEVERITIES } from "@/types/api";

// The backend's sort whitelist for /reports.
export const REPORT_SORTS = ["createdAt", "updatedAt", "title"] as const;
export type ReportSort = (typeof REPORT_SORTS)[number];

const REPORT_FILTERS = {
  status: optionalEnum(REPORT_STATUSES),
  severity: optionalEnum(SEVERITIES),
  // The backend answers a malformed id with a 422, so a bad one is dropped instead.
  programId: z.uuid().optional().catch(undefined),
};

/** Report lists: status, severity, program, and a title search. Newest first. */
export const reportListParams = listParamsSchema({
  sortBy: REPORT_SORTS,
  defaultSort: "createdAt",
  filters: REPORT_FILTERS,
});

/**
 * The admin triage queue: the same filters, oldest first by default, so the report that
 * has waited longest is at the top.
 */
export const triageQueueParams = listParamsSchema({
  sortBy: REPORT_SORTS,
  defaultSort: "createdAt",
  defaultOrder: "asc",
  filters: REPORT_FILTERS,
});
