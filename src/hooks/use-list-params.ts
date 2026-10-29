"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type { z } from "zod";
import {
  type ListParams,
  listDefaults,
  type ParamValue,
  parseListParams,
  patchListParams,
  serializeListParams,
} from "@/lib/list-params";

type ListSchema = z.ZodType<ListParams & Record<string, ParamValue>>;

/**
 * The list's filter, sort, search, and page, read from the URL with the same schema the
 * server page parses. `setParams` writes a patch back, drops defaults from the query string,
 * and returns to page 1 when anything but the page changes.
 *
 * It writes with `history.replaceState`, which Next's router picks up for useSearchParams
 * without a server round trip (docs: Linking and Navigating, Native History API). The server
 * renders the first load with prefetched data; after that each change is a client query, and
 * the table keeps the old rows, dimmed, until the new ones arrive. `router.replace` would
 * re-render the page on the server for every keystroke and hold the URL until it finished.
 * Replacing (not pushing) keeps search typing from filling the back button.
 *
 * Uses useSearchParams, so the component needs a <Suspense> boundary above it.
 */
export function useListParams<Schema extends ListSchema>(schema: Schema) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const defaults = useMemo(() => listDefaults(schema), [schema]);
  const params = useMemo(
    () => parseListParams(schema, searchParams),
    [schema, searchParams],
  );

  // Patches what the address bar holds now, not this render's params: two changes before a
  // re-render (the date range's two fields filled back to back) would otherwise have the
  // second undo the first.
  const setParams = useCallback(
    (patch: Partial<z.output<Schema>>) => {
      const current = parseListParams(
        schema,
        new URLSearchParams(window.location.search),
      );
      const next = patchListParams(current, patch);
      const query = serializeListParams(next, defaults);
      window.history.replaceState(
        null,
        "",
        query ? `${pathname}?${query}` : pathname,
      );
    },
    [schema, defaults, pathname],
  );

  return { params, defaults, setParams };
}

export type ListParamsState<Schema extends ListSchema> = ReturnType<
  typeof useListParams<Schema>
>;

/**
 * The same state as `useListParams`, held in component state instead of the URL. For a
 * list inside a tab whose page already owns the query string (`?tab=`), where writing the
 * list's params would drop the tab.
 */
export function useLocalListParams<Schema extends ListSchema>(
  schema: Schema,
): ListParamsState<Schema> {
  const defaults = useMemo(() => listDefaults(schema), [schema]);
  const [params, setState] = useState(defaults);
  const setParams = useCallback(
    (patch: Partial<z.output<Schema>>) =>
      setState((current) => patchListParams(current, patch)),
    [],
  );
  return { params, defaults, setParams };
}
