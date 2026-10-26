"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { FolderKanban, SearchX } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import {
  ClearFiltersButton,
  FilterBar,
  type FilterOption,
  SearchFilter,
  SelectFilter,
} from "@/components/shared/filter-bar";
import { Money } from "@/components/shared/money";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { QueryError } from "@/components/shared/query-error";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { useListParams } from "@/hooks/use-list-params";
import { PROGRAM_STATUS_LABEL } from "@/lib/constants/domain";
import { formatDate } from "@/lib/format";
import { hasActiveFilters } from "@/lib/list-params";
import { clientQuery } from "@/lib/query/descriptor";
import {
  PROGRAM_STATUSES,
  type Program,
  type ProgramStatus,
} from "@/types/api";
import { type ProgramSort, programTableParams } from "../params";
import { coverageText, poolCoverage } from "../pool-coverage";
import { type ProgramTableScope, programTableQuery } from "../queries";

const STATUS_OPTIONS: FilterOption<ProgramStatus>[] = PROGRAM_STATUSES.map(
  (status) => ({ value: status, label: PROGRAM_STATUS_LABEL[status] }),
);

const EMPTY_COPY: Record<
  ProgramTableScope,
  { title: string; description: string }
> = {
  mine: {
    title: "You haven't created a program yet.",
    description: "Your programs show here with their status and pool.",
  },
  all: {
    title: "No programs yet.",
    description: "Programs show here once an owner creates one.",
  },
};

/**
 * Programs of every status as a table: the owner's own (`mine`) or all of them (admin).
 * Filter, search, sort, and page live in the URL; the server page prefetches the first view.
 */
export function ProgramTable({
  scope,
  basePath,
}: {
  scope: ProgramTableScope;
  /** Title links go to `${basePath}/${id}`. */
  basePath: "/owner/programs" | "/admin/programs";
}) {
  const { params, defaults, setParams } = useListParams(programTableParams);
  const query = useQuery({
    ...clientQuery(programTableQuery(scope, params)),
    placeholderData: keepPreviousData,
  });
  const onSearch = useCallback(
    (search: string | undefined) => setParams({ search }),
    [setParams],
  );
  const filtered = hasActiveFilters(params, defaults);
  const clear = () => setParams({ search: undefined, status: undefined });

  const columns = useMemo<DataTableColumn<Program, ProgramSort>[]>(
    () => [
      {
        id: "title",
        header: "Program",
        sortKey: "title",
        firstOrder: "asc",
        className: "min-w-56 max-w-80",
        cell: (program) => (
          <div className="flex min-w-0 flex-col gap-0.5">
            <Link
              href={`${basePath}/${program.id}`}
              className="font-medium text-pretty underline-offset-4 hover:underline"
            >
              {program.title}
            </Link>
            {scope === "all" && (
              <span className="text-xs text-muted-foreground">
                Run by {program.owner.name}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: (program) => (
          <StatusBadge kind="program" status={program.status} />
        ),
      },
      {
        id: "pool",
        header: "Pool",
        sortKey: "poolBalance",
        align: "end",
        cell: (program) => <Money cents={program.poolBalance} tone="money" />,
      },
      {
        id: "coverage",
        header: "Coverage",
        className: "min-w-44 text-muted-foreground",
        cell: (program) => coverageText(poolCoverage(program)),
      },
      {
        id: "created",
        header: "Created",
        sortKey: "createdAt",
        className: "whitespace-nowrap text-muted-foreground",
        cell: (program) => formatDate(program.createdAt),
      },
    ],
    [basePath, scope],
  );

  return (
    <div className="flex flex-col gap-4">
      <FilterBar label="Filter programs">
        <SearchFilter
          id="program-search"
          label="Search"
          placeholder="Program name or keyword"
          value={params.search}
          onChange={onSearch}
        />
        <SelectFilter
          id="program-status"
          label="Status"
          allLabel="All statuses"
          options={STATUS_OPTIONS}
          value={params.status}
          onChange={(status) => setParams({ status })}
        />
        <ClearFiltersButton visible={filtered} onClear={clear} />
      </FilterBar>

      {query.data ? (
        <>
          <DataTable
            columns={columns}
            data={query.data.items}
            getRowId={(program) => program.id}
            caption="Programs"
            sort={{ sortBy: params.sortBy, order: params.order }}
            onSortChange={(sort) => setParams(sort)}
            stale={query.isPlaceholderData}
            empty={
              filtered ? (
                <EmptyState
                  icon={SearchX}
                  title="No programs match these filters."
                  action={
                    <Button variant="outline" onClick={clear}>
                      Clear filters
                    </Button>
                  }
                />
              ) : (
                <EmptyState icon={FolderKanban} {...EMPTY_COPY[scope]} />
              )
            }
          />
          <PaginationBar
            meta={query.data.meta}
            idPrefix="programs"
            onPageChange={(page) => setParams({ page })}
            onLimitChange={(limit) => setParams({ limit })}
          />
        </>
      ) : query.isError ? (
        <QueryError
          title="We couldn't load programs."
          error={query.error}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      ) : null}
    </div>
  );
}
