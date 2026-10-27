import type { z } from "zod";
import { describeQuery } from "@/lib/query/descriptor";
import type { ReportStatus } from "@/types/api";
import { reportEndpoints } from "./endpoints";
import type { reportListParams } from "./params";

export type ReportListParams = z.output<typeof reportListParams>;

/** Comments load in pages of this size, oldest first. */
export const COMMENT_PAGE_SIZE = 50;

export const reportKeys = {
  all: ["reports"] as const,
  lists: () => [...reportKeys.all, "list"] as const,
  list: (params: ReportListParams) => [...reportKeys.lists(), params] as const,
  detail: (id: string) => [...reportKeys.all, "detail", id] as const,
  comments: (id: string) => [...reportKeys.all, "comments", id] as const,
};

export function reportListQuery(params: ReportListParams) {
  return describeQuery(reportKeys.list(params), reportEndpoints.list(params));
}

/**
 * How many reports a program has in one status: a page of one, read for `meta.total`. Under
 * `lists()`, so every report mutation that refreshes lists refreshes these too.
 */
export function reportCountQuery(programId: string, status: ReportStatus) {
  return describeQuery(
    [...reportKeys.lists(), "count", programId, status],
    reportEndpoints.list({
      page: 1,
      limit: 1,
      sortBy: "createdAt",
      order: "desc",
      status,
      programId,
    }),
  );
}
