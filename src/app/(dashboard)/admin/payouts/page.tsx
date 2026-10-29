import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { PayoutTable } from "@/features/payouts/components/payout-table";
import { payoutListParams } from "@/features/payouts/params";
import { payoutListQuery } from "@/features/payouts/queries";
import { programOptionsQuery } from "@/features/programs/queries";
import { parseListParams } from "@/lib/list-params";
import { HydrateClient, prefetch } from "@/lib/query/server";

export const metadata: Metadata = { title: "Payouts" };

export default async function AdminPayoutsPage({
  searchParams,
}: PageProps<"/admin/payouts">) {
  const params = parseListParams(payoutListParams, await searchParams);
  await Promise.all([
    prefetch(payoutListQuery(params)),
    prefetch(programOptionsQuery()),
  ]);
  return (
    <>
      <PageHeader
        title="Payouts"
        description="Rewards paid from program pools to researchers, newest first."
      />
      <HydrateClient>
        <PayoutTable variant="admin" />
      </HydrateClient>
    </>
  );
}
