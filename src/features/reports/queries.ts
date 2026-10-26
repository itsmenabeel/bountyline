import type { z } from "zod";
import { describeQuery } from "@/lib/query/descriptor";
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
