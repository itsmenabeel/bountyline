"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
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

  const setParams = useCallback(
    (patch: Partial<z.output<Schema>>) => {
      const next = patchListParams(params, patch);
      const query = serializeListParams(next, defaults);
      window.history.replaceState(
        null,
        "",
        query ? `${pathname}?${query}` : pathname,
      );
    },
    [params, defaults, pathname],
  );

  return { params, defaults, setParams };
}
