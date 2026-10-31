import { connection } from "next/server";
import { LocalTime } from "@/components/shared/local-time";
import { Money } from "@/components/shared/money";
import { StatCard } from "@/components/shared/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { publicRequest } from "@/lib/api/public";
import type { PublicStats } from "@/types/api";
import { marketingEndpoints } from "../endpoints";

const count = (value: number) => value.toLocaleString("en-US");

async function readStats(): Promise<PublicStats | null> {
  // Request time, so the build never waits on the API (Render sleeps); publicRequest still
  // shares one cached answer per minute across visitors.
  await connection();
  try {
    return await publicRequest(marketingEndpoints.stats());
  } catch {
    return null;
  }
}

/**
 * Platform numbers from GET /public/stats with the time the backend computed them
 * (design-plan §7.1). If the endpoint fails, the section doesn't render: the page shows no
 * hardcoded numbers.
 */
export async function PlatformStats() {
  const stats = await readStats();
  if (!stats) return null;

  return (
    <section
      aria-labelledby="platform-stats-heading"
      className="flex flex-col gap-4"
    >
      <div className="reveal flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 id="platform-stats-heading" className="text-2xl font-semibold">
          On Bountyline now
        </h2>
        <p className="text-sm text-muted-foreground">
          Updated <LocalTime iso={stats.generatedAt} />
        </p>
      </div>
      <dl className="reveal-group grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Active programs"
          value={count(stats.activePrograms)}
          helper={`${count(stats.researchers)} ${stats.researchers === 1 ? "researcher" : "researchers"} signed up`}
        />
        <StatCard
          label="In pools now"
          value={<Money cents={stats.availableInPools} tone="money" />}
          helper="Ready to pay valid reports"
        />
        <StatCard
          label="Paid to researchers"
          value={<Money cents={stats.totalPaidOut} tone="money" />}
          helper={`Across ${count(stats.payoutCount)} ${stats.payoutCount === 1 ? "payout" : "payouts"}`}
        />
        <StatCard
          label="Reports resolved"
          value={count(stats.reportsResolved)}
          // ACCEPTED, REWARDED, REJECTED, and DUPLICATE (backend RESOLVED_STATUSES).
          helper="Accepted, paid, or closed by the triage team"
        />
      </dl>
    </section>
  );
}

export function PlatformStatsSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <Skeleton className="h-8 w-56" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {["a", "b", "c", "d"].map((key) => (
          <Skeleton key={key} className="h-28 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
