"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PaginationMeta } from "@/lib/api/types";
import { PAGE_SIZES, type PageSize } from "@/lib/list-params";

const count = new Intl.NumberFormat("en-US");

/**
 * "Showing 11–20 of 45", a rows-per-page select (10, 25, 50; the backend caps at 50), and
 * previous/next. Built from the backend's `meta`, so it never offers a page that doesn't
 * exist. Hidden when the list is empty.
 */
export function PaginationBar({
  meta,
  onPageChange,
  onLimitChange,
  idPrefix,
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: PageSize) => void;
  /** Keeps the select's id unique when a page has two lists. */
  idPrefix: string;
}) {
  if (meta.total === 0) return null;

  const first = (meta.page - 1) * meta.limit + 1;
  const last = Math.min(meta.page * meta.limit, meta.total);
  const totalPages = Math.max(meta.totalPages, 1);
  const selectId = `${idPrefix}-page-size`;

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <p aria-live="polite" className="text-muted-foreground tabular-nums">
        Showing {count.format(first)}–{count.format(last)} of{" "}
        {count.format(meta.total)}
      </p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <Label
            htmlFor={selectId}
            className="font-normal text-muted-foreground"
          >
            Rows per page
          </Label>
          <Select
            value={String(meta.limit)}
            onValueChange={(value) => onLimitChange(Number(value) as PageSize)}
          >
            <SelectTrigger id={selectId} size="sm" className="w-18">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous page"
            disabled={meta.page <= 1}
            onClick={() => onPageChange(meta.page - 1)}
          >
            <ChevronLeftIcon aria-hidden="true" />
          </Button>
          <span className="min-w-24 text-center tabular-nums">
            Page {count.format(meta.page)} of {count.format(totalPages)}
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next page"
            disabled={meta.page >= totalPages}
            onClick={() => onPageChange(meta.page + 1)}
          >
            <ChevronRightIcon aria-hidden="true" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
