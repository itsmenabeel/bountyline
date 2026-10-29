"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronDown, ScrollText, SearchX } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import {
  ClearFiltersButton,
  DateRangeFilter,
  FilterBar,
  type FilterOption,
  SelectFilter,
} from "@/components/shared/filter-bar";
import { LocalTime } from "@/components/shared/local-time";
import { MonoId } from "@/components/shared/mono-id";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { QueryError } from "@/components/shared/query-error";
import { Button } from "@/components/ui/button";
import { useListParams } from "@/hooks/use-list-params";
import { hasActiveFilters } from "@/lib/list-params";
import { clientQuery } from "@/lib/query/descriptor";
import { cn } from "@/lib/utils";
import type { AuditLog } from "@/types/api";
import {
  AUDIT_ACTION_LABEL,
  AUDIT_ACTIONS,
  type AuditAction,
  auditActionLabel,
  auditEntityHref,
  auditSummary,
} from "../audit";
import {
  AUDIT_ENTITY_TYPES,
  type AuditEntityType,
  auditLogParams,
} from "../params";
import { auditLogQuery, userOptionsQuery } from "../queries";
import { USER_ROLE_LABEL } from "../users";

const ACTION_OPTIONS: FilterOption<AuditAction>[] = AUDIT_ACTIONS.map(
  (action) => ({ value: action, label: AUDIT_ACTION_LABEL[action] }),
);

const ENTITY_OPTIONS: FilterOption<AuditEntityType>[] = AUDIT_ENTITY_TYPES.map(
  (type) => ({ value: type, label: type }),
);

const ID_PREFIX: Record<string, string> = {
  Program: "P",
  Report: "R",
  User: "U",
};

const hasDetails = (log: AuditLog) =>
  log.metadata !== null &&
  !(typeof log.metadata === "object" && Object.keys(log.metadata).length === 0);

const detailsId = (log: AuditLog) => `audit-${log.id}-details`;

/**
 * The admin audit log (design-plan §7.5): who did what to which record, newest first.
 * Filters for action, record type, actor, and a day range live in the URL. Each row's
 * "Details" opens the record's metadata as formatted JSON under it.
 */
export function AuditLogTable() {
  const { params, defaults, setParams } = useListParams(auditLogParams);
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const query = useQuery({
    ...clientQuery(auditLogQuery(params)),
    placeholderData: keepPreviousData,
  });
  const users = useQuery(clientQuery(userOptionsQuery()));
  const actorOptions = useMemo<FilterOption[]>(
    () =>
      (users.data?.items ?? []).map((user) => ({
        value: user.id,
        label: user.name,
      })),
    [users.data],
  );
  const filtered = hasActiveFilters(params, defaults);
  const clear = () =>
    setParams({
      action: undefined,
      entityType: undefined,
      actorId: undefined,
      from: undefined,
      to: undefined,
    });

  const columns = useMemo<DataTableColumn<AuditLog, "createdAt">[]>(() => {
    const toggle = (id: string) =>
      setOpen((current) => {
        const next = new Set(current);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    return [
      {
        id: "when",
        header: "When",
        sortKey: "createdAt",
        className: "whitespace-nowrap text-muted-foreground",
        cell: (log) => <LocalTime iso={log.createdAt} />,
      },
      {
        id: "action",
        header: "Action",
        className: "min-w-56 max-w-96",
        cell: (log) => {
          const summary = auditSummary(log);
          return (
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">
                {auditActionLabel(log.action)}
              </span>
              {summary && (
                <span className="text-xs text-pretty text-muted-foreground">
                  {summary}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "record",
        header: "Record",
        className: "whitespace-nowrap",
        cell: (log) => {
          const href = auditEntityHref(log);
          return (
            <div className="flex items-center gap-2">
              {href ? (
                <Link
                  href={href}
                  className="underline-offset-4 hover:underline"
                >
                  {log.entityType}
                </Link>
              ) : (
                <span>{log.entityType}</span>
              )}
              <MonoId
                id={log.entityId}
                prefix={ID_PREFIX[log.entityType] ?? "ID"}
                label={log.entityType.toLowerCase()}
              />
            </div>
          );
        },
      },
      {
        id: "actor",
        header: "By",
        className: "whitespace-nowrap",
        cell: (log) => (
          <div className="flex flex-col gap-0.5">
            <span>{log.actor.name}</span>
            <span className="text-xs text-muted-foreground">
              {USER_ROLE_LABEL[log.actor.role]}
            </span>
          </div>
        ),
      },
      {
        id: "details",
        header: "Details",
        cell: (log) =>
          hasDetails(log) ? (
            <Button
              variant="ghost"
              size="sm"
              aria-expanded={open.has(log.id)}
              aria-controls={detailsId(log)}
              onClick={() => toggle(log.id)}
            >
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "transition-transform duration-(--motion-base)",
                  open.has(log.id) && "rotate-180",
                )}
              />
              {open.has(log.id) ? "Hide" : "Show"}
              <span className="sr-only">
                {" "}
                details for {auditActionLabel(log.action)}
              </span>
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">None</span>
          ),
      },
    ];
  }, [open]);

  return (
    <div className="flex flex-col gap-4">
      <FilterBar label="Filter the audit log">
        <SelectFilter
          id="audit-action"
          label="Action"
          allLabel="All actions"
          options={ACTION_OPTIONS}
          value={params.action}
          onChange={(action) => setParams({ action })}
        />
        <SelectFilter
          id="audit-entity"
          label="Record"
          allLabel="All records"
          options={ENTITY_OPTIONS}
          value={params.entityType}
          onChange={(entityType) => setParams({ entityType })}
        />
        <SelectFilter
          id="audit-actor"
          label="By"
          allLabel="Anyone"
          options={actorOptions}
          value={params.actorId}
          onChange={(actorId) => setParams({ actorId })}
        />
        <DateRangeFilter
          idPrefix="audit"
          from={params.from}
          to={params.to}
          onChange={(range) => setParams(range)}
        />
        <ClearFiltersButton visible={filtered} onClear={clear} />
      </FilterBar>

      {query.data ? (
        <>
          <DataTable
            columns={columns}
            data={query.data.items}
            getRowId={(log) => log.id}
            caption="Audit log"
            sort={{ sortBy: params.sortBy, order: params.order }}
            onSortChange={(sort) => setParams(sort)}
            stale={query.isPlaceholderData}
            renderDetail={(log) =>
              open.has(log.id) && hasDetails(log) ? (
                <pre
                  id={detailsId(log)}
                  className="overflow-x-auto rounded-lg border bg-muted/40 p-4 font-mono text-xs leading-relaxed"
                >
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              ) : null
            }
            empty={
              filtered ? (
                <EmptyState
                  icon={SearchX}
                  title="No records match these filters."
                  action={
                    <Button variant="outline" onClick={clear}>
                      Clear filters
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  icon={ScrollText}
                  title="No records yet."
                  description="Status changes, payouts, funding, and account changes show here."
                />
              )
            }
          />
          <PaginationBar
            meta={query.data.meta}
            idPrefix="audit"
            onPageChange={(page) => setParams({ page })}
            onLimitChange={(limit) => setParams({ limit })}
          />
        </>
      ) : query.isError ? (
        <QueryError
          title="We couldn't load the audit log."
          error={query.error}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      ) : null}
    </div>
  );
}
