"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Coins, SearchX } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import {
  ClearFiltersButton,
  FilterBar,
  type FilterOption,
  SelectFilter,
} from "@/components/shared/filter-bar";
import { Money } from "@/components/shared/money";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { QueryError } from "@/components/shared/query-error";
import { Button } from "@/components/ui/button";
import { programOptionsQuery } from "@/features/programs/queries";
import { useListParams } from "@/hooks/use-list-params";
import { formatDate } from "@/lib/format";
import { hasActiveFilters } from "@/lib/list-params";
import { clientQuery } from "@/lib/query/descriptor";
import type { Payout } from "@/types/api";
import { type PayoutSort, payoutListParams } from "../params";
import { payoutListQuery } from "../queries";

const linkClass = "font-medium text-pretty underline-offset-4 hover:underline";

/**
 * Every payout on the platform for admins (design-plan §7.5): report, program, researcher,
 * amount, and date, with a program filter and sorting by amount or date. A payout is paid
 * the moment it exists, so the table has no status column.
 */
export function PayoutTable() {
  const { params, defaults, setParams } = useListParams(payoutListParams);
  const query = useQuery({
    ...clientQuery(payoutListQuery(params)),
    placeholderData: keepPreviousData,
  });
  const programs = useQuery(clientQuery(programOptionsQuery()));
  const programOptions = useMemo<FilterOption[]>(
    () =>
      (programs.data?.items ?? []).map((program) => ({
        value: program.id,
        label: program.title,
      })),
    [programs.data],
  );
  const filtered = hasActiveFilters(params, defaults);
  const clear = () => setParams({ programId: undefined });

  const columns = useMemo<DataTableColumn<Payout, PayoutSort>[]>(
    () => [
      {
        id: "report",
        header: "Report",
        className: "min-w-56 max-w-80",
        cell: (payout) => (
          <Link
            href={`/admin/reports/${payout.report.id}`}
            className={linkClass}
          >
            {payout.report.title}
          </Link>
        ),
      },
      {
        id: "program",
        header: "Program",
        className: "min-w-44",
        cell: (payout) => (
          <Link
            href={`/admin/programs/${payout.program.id}`}
            className="text-pretty underline-offset-4 hover:underline"
          >
            {payout.program.title}
          </Link>
        ),
      },
      {
        id: "researcher",
        header: "Researcher",
        className: "whitespace-nowrap",
        cell: (payout) => payout.researcher.name,
      },
      {
        id: "amount",
        header: "Amount",
        sortKey: "amount",
        align: "end",
        cell: (payout) => <Money cents={payout.amount} tone="money" />,
      },
      {
        id: "paid",
        header: "Paid",
        sortKey: "createdAt",
        className: "whitespace-nowrap text-muted-foreground",
        cell: (payout) => formatDate(payout.createdAt),
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      <FilterBar label="Filter payouts">
        <SelectFilter
          id="payout-program"
          label="Program"
          allLabel="All programs"
          options={programOptions}
          value={params.programId}
          onChange={(programId) => setParams({ programId })}
        />
        <ClearFiltersButton visible={filtered} onClear={clear} />
      </FilterBar>

      {query.data ? (
        <>
          <DataTable
            columns={columns}
            data={query.data.items}
            getRowId={(payout) => payout.id}
            caption="Payouts"
            sort={{ sortBy: params.sortBy, order: params.order }}
            onSortChange={(sort) => setParams(sort)}
            stale={query.isPlaceholderData}
            empty={
              filtered ? (
                <EmptyState
                  icon={SearchX}
                  title="No payouts match these filters."
                  action={
                    <Button variant="outline" onClick={clear}>
                      Clear filters
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  icon={Coins}
                  title="No payouts yet."
                  description="Payouts show here once the triage team pays an accepted report."
                />
              )
            }
          />
          <PaginationBar
            meta={query.data.meta}
            idPrefix="payouts"
            onPageChange={(page) => setParams({ page })}
            onLimitChange={(limit) => setParams({ limit })}
          />
        </>
      ) : query.isError ? (
        <QueryError
          title="We couldn't load payouts."
          error={query.error}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      ) : null}
    </div>
  );
}
