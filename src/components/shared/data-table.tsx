"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react";
import { Fragment, type ReactNode, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SortOrder } from "@/lib/list-params";
import { cn } from "@/lib/utils";

export interface DataTableColumn<TData, TSort extends string = string> {
  id: string;
  header: string;
  cell: (row: TData) => ReactNode;
  /** The backend `sortBy` value for this column. Makes the header a sort button. */
  sortKey?: TSort;
  /** Order on the first click. Text columns usually start ascending. */
  firstOrder?: SortOrder;
  align?: "start" | "end";
  className?: string;
}

export interface DataTableSort<TSort extends string = string> {
  sortBy: TSort;
  order: SortOrder;
}

interface DataTableProps<TData, TSort extends string> {
  columns: DataTableColumn<TData, TSort>[];
  data: TData[];
  getRowId: (row: TData) => string;
  /** Read by screen readers as the table's name. */
  caption: string;
  sort: DataTableSort<TSort>;
  onSortChange: (sort: DataTableSort<TSort>) => void;
  /** Rows on screen belong to the previous filter while the new page loads. */
  stale?: boolean;
  /** Shown in place of the rows when there are none. */
  empty: ReactNode;
  /**
   * A full-width row under a row, such as expanded details. Return null to render none.
   * Give it an id so the control that opens it can point at it with `aria-controls`.
   */
  renderDetail?: (row: TData) => ReactNode;
}

const ARIA_SORT = { asc: "ascending", desc: "descending" } as const;

/**
 * Server-sorted, server-paginated table (TanStack Table in manual mode). The first column
 * stays visible while wide tables scroll sideways inside their own container, so the page
 * itself never scrolls horizontally at 375px (design-plan §4.5).
 */
export function DataTable<TData, TSort extends string>({
  columns,
  data,
  getRowId,
  caption,
  sort,
  onSortChange,
  stale = false,
  empty,
  renderDetail,
}: DataTableProps<TData, TSort>) {
  const columnDefs = useMemo<ColumnDef<TData, unknown>[]>(
    () =>
      columns.map((column) => ({
        id: column.id,
        header: column.header,
        cell: ({ row }) => column.cell(row.original),
        meta: column,
      })),
    [columns],
  );

  const table = useReactTable({
    data,
    columns: columnDefs,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
  });

  function toggleSort(column: DataTableColumn<TData, TSort>) {
    if (!column.sortKey) return;
    if (sort.sortBy === column.sortKey) {
      onSortChange({
        sortBy: column.sortKey,
        order: sort.order === "asc" ? "desc" : "asc",
      });
    } else {
      onSortChange({
        sortBy: column.sortKey,
        order: column.firstOrder ?? "desc",
      });
    }
  }

  const rows = table.getRowModel().rows;

  return (
    <div className="relative overflow-hidden rounded-xl border bg-card">
      {/* A thin bar on top while the next page loads; the old rows stay readable, dimmed. */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-x-0 top-0 z-20 h-0.5 origin-left bg-primary transition-opacity duration-(--motion-base)",
          stale ? "animate-pulse opacity-100" : "opacity-0",
        )}
      />
      <Table
        aria-busy={stale || undefined}
        className={cn(
          "transition-opacity duration-(--motion-base)",
          stale && "opacity-60",
        )}
      >
        <TableCaption className="sr-only">{caption}</TableCaption>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id} className="hover:bg-transparent">
              {group.headers.map((header, index) => {
                const column = header.column.columnDef.meta as
                  | DataTableColumn<TData, TSort>
                  | undefined;
                const active = column?.sortKey === sort.sortBy;
                const SortIcon = active
                  ? sort.order === "asc"
                    ? ArrowUpIcon
                    : ArrowDownIcon
                  : ArrowUpDownIcon;
                return (
                  <TableHead
                    key={header.id}
                    scope="col"
                    aria-sort={
                      column?.sortKey && active
                        ? ARIA_SORT[sort.order]
                        : undefined
                    }
                    className={cn(
                      "h-11 px-4 text-muted-foreground",
                      column?.align === "end" && "text-right",
                      index === 0 && "sticky left-0 z-10 bg-card",
                      column?.className,
                    )}
                  >
                    {column?.sortKey ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column)}
                        className={cn(
                          "-mx-2 inline-flex h-8 items-center gap-1.5 rounded-md px-2 font-medium outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/70 pointer-coarse:h-11",
                          active && "text-foreground",
                          column.align === "end" && "flex-row-reverse",
                        )}
                      >
                        {column.header}
                        <SortIcon
                          aria-hidden="true"
                          className={cn("size-3.5", !active && "opacity-50")}
                        />
                      </button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="p-0">
                {empty}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const detail = renderDetail?.(row.original);
              return (
                <Fragment key={row.id}>
                  {/* Solid hover color: the sticky first cell needs an opaque background to cover
                  the cells scrolling under it, and both have to match. */}
                  <TableRow
                    className={cn(
                      "group/row hover:bg-muted",
                      detail && "border-b-0",
                    )}
                  >
                    {row.getVisibleCells().map((cell, index) => {
                      const column = cell.column.columnDef.meta as
                        | DataTableColumn<TData, TSort>
                        | undefined;
                      return (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            "px-4 py-3",
                            column?.align === "end" &&
                              "text-right tabular-nums",
                            index === 0 &&
                              "sticky left-0 z-10 bg-card group-hover/row:bg-muted",
                            column?.className,
                          )}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  {detail && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={columns.length}
                        className="px-4 pt-0 pb-4"
                      >
                        {detail}
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
