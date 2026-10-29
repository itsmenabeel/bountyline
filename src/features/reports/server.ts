import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import { payoutEndpoints } from "@/features/payouts/endpoints";
import { serverRequest } from "@/lib/api/server";
import { isUuid } from "@/lib/ids";
import type { Report, ReportStatus } from "@/types/api";
import { reportEndpoints } from "./endpoints";

/**
 * One report for a signed-in page, read once per request (the page and its metadata both
 * ask). A malformed id renders not-found; the backend would answer it with a 422. Someone
 * else's report is a 404 from the backend, so it renders not-found too.
 */
export const getReport = cache(async (id: string) => {
  if (!isUuid(id)) notFound();
  return serverRequest(reportEndpoints.detail(id));
});

/**
 * What a rewarded report paid. Reports don't carry the amount, so this finds the payout in
 * the viewer's payouts for that program (newest first; a report is paid once).
 */
export async function getPayoutAmount(report: Report) {
  if (report.status !== "REWARDED") return undefined;
  const { items } = await serverRequest(
    payoutEndpoints.list({
      programId: report.programId,
      page: 1,
      limit: 50,
      sortBy: "createdAt",
      order: "desc",
    }),
  );
  return items.find((payout) => payout.report.id === report.id)?.amount;
}

/** How many of the viewer's reports (scoped by the backend) sit in one status: a page of one. */
export async function countReports(status: ReportStatus) {
  const { meta } = await serverRequest(
    reportEndpoints.list({
      page: 1,
      limit: 1,
      sortBy: "createdAt",
      order: "desc",
      status,
    }),
  );
  return meta.total;
}
