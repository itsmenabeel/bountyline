"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { FileText, Inbox, SearchX } from "lucide-react";
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
import {
  OPEN_REPORT_STATUSES,
  REPORT_STATUS_LABEL,
  SEVERITY_LABEL,
} from "@/lib/constants/domain";
import { formatAge, formatDate } from "@/lib/format";
import { shortId } from "@/lib/ids";
import { hasActiveFilters } from "@/lib/list-params";
import { clientQuery } from "@/lib/query/descriptor";
import {
  REPORT_STATUSES,
  type Report,
  type ReportStatus,
  SEVERITIES,
  type Severity,
} from "@/types/api";
import {
  type ReportSort,
  reportListParams,
  triageQueueParams,
} from "../params";
import { reportListQuery } from "../queries";
import { DisclosureTrack } from "./disclosure-track";

export type ReportTableVariant = "researcher" | "admin";

const statusOptions = (statuses: readonly ReportStatus[]) =>
  statuses.map((status) => ({
    value: status,
    label: REPORT_STATUS_LABEL[status],
  }));

// Researchers follow every status. The triage queue's tabs are the states that still need
// the team; closed reports stay under All.
const STATUS_OPTIONS: Record<ReportTableVariant, FilterOption<ReportStatus>[]> =
  {
    researcher: statusOptions(REPORT_STATUSES),
    admin: statusOptions(OPEN_REPORT_STATUSES),
  };

const BASE_PATH: Record<ReportTableVariant, string> = {
  researcher: "/researcher/reports",
  admin: "/admin/reports",
};
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
 * dates, all in the URL. The backend scopes the rows: a researcher sees only their own, an
 * admin sees every report (the triage queue, oldest first).
 */
export function ReportTable({ variant }: { variant: ReportTableVariant }) {
  const isAdmin = variant === "admin";
  const basePath = BASE_PATH[variant];
  const { params, defaults, setParams } = useListParams(
    isAdmin ? triageQueueParams : reportListParams,
  );
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

  const columns = useMemo<DataTableColumn<Report, ReportSort>[]>(() => {
    const title: DataTableColumn<Report, ReportSort> = {
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
    };
    const status: DataTableColumn<Report, ReportSort> = {
      id: "status",
      header: "Status",
      className: "min-w-52",
      cell: (report) => (
        <div className="flex items-center gap-3">
          <StatusBadge kind="report" status={report.status} />
          <DisclosureTrack status={report.status} variant="compact" />
        </div>
      ),
    };
    const severity: DataTableColumn<Report, ReportSort> = {
      id: "severity",
      header: "Severity",
      cell: (report) => <SeverityBadge severity={report.severity} />,
    };

    if (!isAdmin) {
      return [
        title,
        status,
        severity,
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
      ];
    }
    return [
      // The title comes first because the first column stays pinned on phones.
      title,
      {
        id: "id",
        header: "ID",
        className: "whitespace-nowrap font-mono text-xs text-muted-foreground",
        cell: (report) => shortId(report.id, "R"),
      },
      {
        id: "researcher",
        header: "Researcher",
        className: "whitespace-nowrap",
        cell: (report) => (
          <div className="flex flex-col gap-0.5">
            <span>{report.researcher.name}</span>
            <span className="text-xs text-muted-foreground">
              Reputation {report.researcher.reputation.toLocaleString("en-US")}
            </span>
          </div>
        ),
      },
      severity,
      status,
      {
        id: "age",
        header: "Age",
        sortKey: "createdAt",
        firstOrder: "asc",
        className: "whitespace-nowrap text-muted-foreground",
        cell: (report) => (
          // Counted from the clock at render, so the server and the browser can disagree
          // for a moment around midnight UTC.
          <time dateTime={report.createdAt} suppressHydrationWarning>
            {formatAge(report.createdAt)}
          </time>
        ),
      },
    ];
  }, [basePath, isAdmin]);

  return (
    <div className="flex flex-col gap-4">
      <StatusTabs
        label="Status"
        allLabel="All"
        options={STATUS_OPTIONS[variant]}
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
              ) : isAdmin ? (
                <EmptyState
                  icon={Inbox}
                  title="No reports yet."
                  description="Reports show here as researchers submit them."
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
