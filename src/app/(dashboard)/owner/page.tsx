import { CircleCheck, CreditCard, FolderKanban, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DashboardSection } from "@/components/shared/dashboard-section";
import { EmptyState } from "@/components/shared/empty-state";
import { Money } from "@/components/shared/money";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { paymentEndpoints } from "@/features/payments/endpoints";
import { programEndpoints } from "@/features/programs/endpoints";
import {
  lowPoolPrograms,
  lowPoolText,
} from "@/features/programs/pool-coverage";
import { countReports } from "@/features/reports/server";
import { serverRequest } from "@/lib/api/server";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Overview" };

const count = (value: number) => value.toLocaleString("en-US");
// The list keeps to the biggest gaps; Programs shows each program's coverage.
const LOW_POOL_ROWS = 5;

/**
 * design-plan §7.4: money across the owner's programs, reports waiting for triage, pools
 * that can't cover their top payout, and the latest Stripe payments. Totals add up the
 * first 50 programs (the backend's page cap), which covers every owner today.
 */
export default async function OwnerOverviewPage() {
  const [programs, waiting, pending, payments] = await Promise.all([
    serverRequest(
      programEndpoints.list({
        page: 1,
        limit: 50,
        sortBy: "title",
        order: "asc",
        mine: true,
      }),
    ),
    countReports("NEW"),
    serverRequest(
      paymentEndpoints.list({
        page: 1,
        limit: 1,
        sortBy: "createdAt",
        order: "desc",
        status: "PENDING",
      }),
    ),
    serverRequest(
      paymentEndpoints.list({
        page: 1,
        limit: 5,
        sortBy: "createdAt",
        order: "desc",
      }),
    ),
  ]);
  const mine = programs.items;
  const totalPool = mine.reduce((sum, program) => sum + program.poolBalance, 0);
  const active = mine.filter((program) => program.status === "ACTIVE").length;
  const low = lowPoolPrograms(mine);
  const moreLow = low.length - LOW_POOL_ROWS;

  return (
    <>
      <PageHeader
        title="Overview"
        description="Your programs, the money in their pools, and the reports coming in."
        actions={
          <Button asChild size="lg">
            <Link href="/owner/programs/new">
              <PlusIcon aria-hidden="true" />
              New program
            </Link>
          </Button>
        }
      />
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="In your pools"
          value={<Money cents={totalPool} tone="money" />}
          helper={`Across ${count(programs.meta.total)} ${programs.meta.total === 1 ? "program" : "programs"}`}
        />
        <StatCard
          label="Active programs"
          value={count(active)}
          helper="Taking reports now"
          href="/owner/programs?status=ACTIVE"
        />
        <StatCard
          label="Awaiting triage"
          value={count(waiting)}
          helper="New reports the triage team hasn't opened"
          href="/owner/reports?status=NEW"
        />
        <StatCard
          label="Pending payments"
          value={count(pending.meta.total)}
          helper="Stripe checkouts not confirmed yet"
          href="/owner/payments?status=PENDING"
        />
      </dl>

      {mine.length === 0 ? (
        <div className="rounded-xl border bg-card">
          <EmptyState
            icon={FolderKanban}
            title="You haven't created a program yet."
            description="Set the scope and reward tiers, then fund the pool through Stripe."
            action={
              <Button asChild>
                <Link href="/owner/programs/new">New program</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <DashboardSection
          title="Low pools"
          description="Programs whose pool can't pay their best-paying tier once."
          viewAll={
            moreLow > 0
              ? { href: "/owner/programs", label: "View programs" }
              : undefined
          }
        >
          {low.length > 0 ? (
            <ul className="flex flex-col divide-y rounded-xl border bg-card">
              {low.slice(0, LOW_POOL_ROWS).map((entry) => (
                <li
                  key={entry.program.id}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="text-sm text-pretty">{lowPoolText(entry)}</p>
                  <Button asChild variant="outline" className="shrink-0">
                    <Link href={`/owner/programs/${entry.program.id}`}>
                      Fund {entry.program.title}
                    </Link>
                  </Button>
                </li>
              ))}
              {moreLow > 0 && (
                <li className="px-4 py-3 text-sm text-muted-foreground">
                  {moreLow === 1
                    ? "1 more program can't cover its top payout."
                    : `${count(moreLow)} more programs can't cover their top payout.`}
                </li>
              )}
            </ul>
          ) : (
            <p className="flex items-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">
              <CircleCheck aria-hidden="true" className="size-4 text-money" />
              Each live program can pay its best-paying tier at least once.
            </p>
          )}
        </DashboardSection>
      )}

      <DashboardSection
        title="Recent payments"
        viewAll={
          payments.meta.total > 0
            ? { href: "/owner/payments", label: "View all payments" }
            : undefined
        }
      >
        {payments.items.length > 0 ? (
          <ul className="flex flex-col divide-y rounded-xl border bg-card">
            {payments.items.map((payment) => (
              <li
                key={payment.id}
                className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <Link
                    href={`/owner/programs/${payment.programId}`}
                    className="font-medium text-pretty underline-offset-4 hover:underline"
                  >
                    {payment.program.title}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    Started {formatDate(payment.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Money
                    cents={payment.amount}
                    tone={payment.status === "SUCCEEDED" ? "money" : "plain"}
                  />
                  <StatusBadge kind="payment" status={payment.status} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border bg-card">
            <EmptyState
              icon={CreditCard}
              title="You haven't funded a program yet."
              description="Payments show here after you fund a pool from a program's page."
            />
          </div>
        )}
      </DashboardSection>
    </>
  );
}
