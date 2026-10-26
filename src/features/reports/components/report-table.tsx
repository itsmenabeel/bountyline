"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { FileText, SearchX } from "lucide-react";
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
  StatusTabs,
} from "@/components/shared/filter-bar";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { QueryError } from "@/components/shared/query-error";
import { SeverityBadge } from "@/components/shared/severity-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { directoryQuery } from "@/features/programs/queries";
import { useListParams } from "@/hooks/use-list-params";
import { REPORT_STATUS_LABEL, SEVERITY_LABEL } from "@/lib/constants/domain";
import { formatDate } from "@/lib/format";
import { hasActiveFilters } from "@/lib/list-params";
import { clientQuery } from "@/lib/query/descriptor";
import {
  REPORT_STATUSES,
  type Report,
  type ReportStatus,
  SEVERITIES,
  type Severity,
} from "@/types/api";
import { type ReportSort, reportListParams } from "../params";
import { reportListQuery } from "../queries";
import { DisclosureTrack } from "./disclosure-track";

const STATUS_OPTIONS: FilterOption<ReportStatus>[] = REPORT_STATUSES.map(
  (status) => ({ value: status, label: REPORT_STATUS_LABEL[status] }),
);
const SEVERITY_OPTIONS: FilterOption<Severity>[] = SEVERITIES.map(
  (severity) => ({ value: severity, label: SEVERITY_LABEL[severity] }),
);

// The program filter offers the programs the viewer can open, by title. The backend caps a
// page at 50, which covers every program on the platform today.
const PROGRAM_OPTIONS_QUERY = directoryQuery("signed-in", {
  page: 1,
  limit: 50,
  sortBy: "title",
  order: "asc",
  search: undefined,
});

/**
 * Reports with status tabs, severity and program filters, a title search, and sortable
 * dates, all in the URL. The backend scopes the rows: a researcher sees only their own.
 */
export function ReportTable({
  basePath,
}: {
  /** Title links go to `${basePath}/${id}`. */
  basePath: "/researcher/reports";
}) {
  const { params, defaults, setParams } = useListParams(reportListParams);
  const query = useQuery({
    ...clientQuery(reportListQuery(params)),
    placeholderData: keepPreviousData,
  });
  const programs = useQuery(clientQuery(PROGRAM_OPTIONS_QUERY));
  const programOptions = useMemo<FilterOption[]>(
    () =>
      (programs.data?.items ?? []).map((program) => ({
        value: program.id,
        label: program.title,
      })),
    [programs.data],
  );

  const onSearch = useCallback(
    (search: string | undefined) => setParams({ search }),
    [setParams],
  );
  const filtered = hasActiveFilters(params, defaults);
  const clear = () =>
    setParams({
      search: undefined,
      status: undefined,
      severity: undefined,
      programId: undefined,
    });

  const columns = useMemo<DataTableColumn<Report, ReportSort>[]>(
    () => [
      {
        id: "title",
        header: "Report",
        sortKey: "title",
        firstOrder: "asc",
        className: "min-w-56 max-w-96",
        cell: (report) => (
          <div className="flex min-w-0 flex-col gap-0.5">
            <Link
              href={`${basePath}/${report.id}`}
              className="font-medium text-pretty underline-offset-4 hover:underline"
            >
              {report.title}
            </Link>
            <span className="text-xs text-muted-foreground">
              {report.program.title}
            </span>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        className: "min-w-52",
        cell: (report) => (
          <div className="flex items-center gap-3">
            <StatusBadge kind="report" status={report.status} />
            <DisclosureTrack status={report.status} variant="compact" />
          </div>
        ),
      },
      {
        id: "severity",
        header: "Severity",
        cell: (report) => <SeverityBadge severity={report.severity} />,
      },
      {
        id: "created",
        header: "Submitted",
        sortKey: "createdAt",
        className: "whitespace-nowrap text-muted-foreground",
        cell: (report) => formatDate(report.createdAt),
      },
      {
        id: "updated",
        header: "Updated",
        sortKey: "updatedAt",
        className: "whitespace-nowrap text-muted-foreground",
        cell: (report) => formatDate(report.updatedAt),
      },
    ],
    [basePath],
  );

  return (
    <div className="flex flex-col gap-4">
      <StatusTabs
        label="Status"
        allLabel="All"
        options={STATUS_OPTIONS}
        value={params.status}
        onChange={(status) => setParams({ status })}
      />
      <FilterBar label="Filter reports">
        <SearchFilter
          id="report-search"
          label="Search"
          placeholder="Report title"
          value={params.search}
          onChange={onSearch}
        />
        <SelectFilter
          id="report-severity"
          label="Severity"
          allLabel="All severities"
          options={SEVERITY_OPTIONS}
          value={params.severity}
          onChange={(severity) => setParams({ severity })}
        />
        <SelectFilter
          id="report-program"
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
            getRowId={(report) => report.id}
            caption="Reports"
            sort={{ sortBy: params.sortBy, order: params.order }}
            onSortChange={(sort) => setParams(sort)}
            stale={query.isPlaceholderData}
            empty={
              filtered ? (
                <EmptyState
                  icon={SearchX}
                  title="No reports match these filters."
                  action={
                    <Button variant="outline" onClick={clear}>
                      Clear filters
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  icon={FileText}
                  title="You haven't submitted a report yet."
                  description="Pick an active program and read its scope first."
                  action={
                    <Button asChild>
                      <Link href="/researcher/programs">Browse programs</Link>
                    </Button>
                  }
                />
              )
            }
          />
          <PaginationBar
            meta={query.data.meta}
            idPrefix="reports"
            onPageChange={(page) => setParams({ page })}
            onLimitChange={(limit) => setParams({ limit })}
          />
        </>
      ) : query.isError ? (
        <QueryError
          title="We couldn't load reports."
          error={query.error}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      ) : null}
    </div>
  );
}
