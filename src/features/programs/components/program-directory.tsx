"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { FilePlus2, Radar, SearchX } from "lucide-react";
import Link from "next/link";
import { useCallback } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import {
  ClearFiltersButton,
  FilterBar,
  SearchFilter,
  SortSelect,
} from "@/components/shared/filter-bar";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { QueryError } from "@/components/shared/query-error";
import { Button } from "@/components/ui/button";
import { newReportHref } from "@/features/reports/links";
import { useListParams } from "@/hooks/use-list-params";
import { hasActiveFilters } from "@/lib/list-params";
import { clientQuery } from "@/lib/query/descriptor";
import { cn } from "@/lib/utils";
import { directoryParams, type ProgramSort } from "../params";
import { type DirectorySource, directoryQuery } from "../queries";
import { ProgramCard } from "./program-card";

type SortValue = `${ProgramSort}:${"asc" | "desc"}`;

const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "poolBalance:desc", label: "Largest pool" },
  { value: "poolBalance:asc", label: "Smallest pool" },
  { value: "title:asc", label: "Title, A to Z" },
  { value: "title:desc", label: "Title, Z to A" },
];

/**
 * Active programs as cards with search, sort, and paging in the URL. The public page and
 * the researcher's Programs page share it; researchers also get "Submit report" per card.
 * The server page prefetches the same query, so the first render needs no client fetch.
 */
export function ProgramDirectory({
  source,
  basePath,
}: {
  source: DirectorySource;
  /** Card links go to `${basePath}/${id}`. */
  basePath: "/programs" | "/researcher/programs";
}) {
  const { params, defaults, setParams } = useListParams(directoryParams);
  const query = useQuery({
    ...clientQuery(directoryQuery(source, params)),
    placeholderData: keepPreviousData,
  });
  const onSearch = useCallback(
    (search: string | undefined) => setParams({ search }),
    [setParams],
  );
  const filtered = hasActiveFilters(params, defaults);
  const clear = () => setParams({ search: undefined });
  const isResearcher = source === "signed-in";

  return (
    <div className="flex flex-col gap-6">
      <FilterBar label="Find programs">
        <SearchFilter
          id="program-search"
          label="Search"
          placeholder="Program name or keyword"
          value={params.search}
          onChange={onSearch}
        />
        <SortSelect
          id="program-sort"
          label="Sort by"
          options={SORT_OPTIONS}
          value={`${params.sortBy}:${params.order}`}
          onChange={(value) => {
            const [sortBy, order] = value.split(":") as [
              ProgramSort,
              "asc" | "desc",
            ];
            setParams({ sortBy, order });
          }}
        />
        <ClearFiltersButton visible={filtered} onClear={clear} />
      </FilterBar>

      {query.data ? (
        <>
          {query.data.items.length === 0 ? (
            <div className="rounded-xl border bg-card">
              {filtered ? (
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
                <EmptyState
                  icon={Radar}
                  title="No programs are open for reports right now."
                  description="Programs show here once their owners publish them."
                />
              )}
            </div>
          ) : (
            <ul
              aria-busy={query.isPlaceholderData || undefined}
              aria-label="Programs"
              className={cn(
                "grid gap-4 transition-opacity duration-(--motion-base) lg:grid-cols-2",
                query.isPlaceholderData && "opacity-60",
              )}
            >
              {query.data.items.map((program) => (
                <li key={program.id} className="flex">
                  <ProgramCard
                    program={program}
                    href={`${basePath}/${program.id}`}
                    action={
                      isResearcher ? (
                        <Button asChild variant="outline">
                          <Link href={newReportHref(program.id)}>
                            <FilePlus2 aria-hidden="true" />
                            Submit report
                          </Link>
                        </Button>
                      ) : undefined
                    }
                  />
                </li>
              ))}
            </ul>
          )}
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
