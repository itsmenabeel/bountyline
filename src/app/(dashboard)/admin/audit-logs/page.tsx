import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { AuditLogTable } from "@/features/admin/components/audit-log-table";
import { auditLogParams } from "@/features/admin/params";
import { auditLogQuery, userOptionsQuery } from "@/features/admin/queries";
import { parseListParams } from "@/lib/list-params";
import { HydrateClient, prefetch } from "@/lib/query/server";

export const metadata: Metadata = { title: "Audit log" };

export default async function AdminAuditLogPage({
  searchParams,
}: PageProps<"/admin/audit-logs">) {
  const params = parseListParams(auditLogParams, await searchParams);
  // The actor filter's names load with the list, so an ?actorId= link shows who it is.
  await Promise.all([
    prefetch(auditLogQuery(params)),
    prefetch(userOptionsQuery()),
  ]);
  return (
    <>
      <PageHeader
        title="Audit log"
        description="Who changed what, newest first: triage moves, payouts, funding, program changes, and account changes."
      />
      <HydrateClient>
        <AuditLogTable />
      </HydrateClient>
    </>
  );
}
