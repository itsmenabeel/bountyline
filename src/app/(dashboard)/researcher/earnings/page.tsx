import type { Metadata } from "next";
import { Money } from "@/components/shared/money";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EarningsChart } from "@/features/payouts/components/earnings-chart";
import { PayoutTable } from "@/features/payouts/components/payout-table";
import { earningsSummary, payoutsByProgram } from "@/features/payouts/earnings";
import { payoutEndpoints } from "@/features/payouts/endpoints";
import { payoutListParams } from "@/features/payouts/params";
import { payoutListQuery } from "@/features/payouts/queries";
import { serverRequest } from "@/lib/api/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { parseListParams } from "@/lib/list-params";
import { HydrateClient, prefetch } from "@/lib/query/server";

export const metadata: Metadata = { title: "Earnings" };

// The chart groups one page of payouts; the backend caps a page at 50.
const CHART_PAYOUTS = 50;

/** design-plan §7.3: wallet and reputation, payouts by program, and every payout. */
export default async function ResearcherEarningsPage({
  searchParams,
}: PageProps<"/researcher/earnings">) {
  const params = parseListParams(payoutListParams, await searchParams);
  const [me, recent] = await Promise.all([
    getCurrentUser(),
    serverRequest(
      payoutEndpoints.list({
        page: 1,
        limit: CHART_PAYOUTS,
        sortBy: "createdAt",
        order: "desc",
      }),
    ),
    prefetch(payoutListQuery(params)),
  ]);
  const rows = payoutsByProgram(recent.items);
  const partial = recent.meta.total > recent.items.length;
  const summary = `${earningsSummary(rows, recent.items.length)}${
    partial ? ` Counting your ${CHART_PAYOUTS} most recent payouts.` : ""
  }`;

  return (
    <>
      <PageHeader
        title="Earnings"
        description="Payouts go to your platform wallet balance."
      />
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          label="Wallet"
          value={<Money cents={me.walletBalance} tone="money" />}
          helper="Rewards paid to you"
        />
        <StatCard
          label="Reputation"
          value={me.reputation.toLocaleString("en-US")}
          helper="Low 1, Medium 3, High 7, Critical 15 per rewarded report"
        />
        <StatCard
          label="Payouts"
          value={recent.meta.total.toLocaleString("en-US")}
          helper="Rewarded reports"
        />
      </dl>
      <EarningsChart rows={rows} summary={summary} />
      <section
        aria-labelledby="payouts-heading"
        className="flex flex-col gap-3"
      >
        <h2 id="payouts-heading" className="text-lg font-semibold">
          Payouts
        </h2>
        <HydrateClient>
          <PayoutTable variant="researcher" />
        </HydrateClient>
      </section>
    </>
  );
}
