import { z } from "zod";

// List pages keep filter, sort, search, and page in the URL (project requirement R3). The
// server page and the client hook parse the URL with the same schema, so both render the
// same list. A value the backend would reject with a 422 (its paginationQuery rules: page ≥ 1,
// limit ≤ 50, a whitelisted sortBy) falls back to its default instead.

export const PAGE_SIZES = [10, 25, 50] as const;
export type PageSize = (typeof PAGE_SIZES)[number];
export type SortOrder = "asc" | "desc";

const SEARCH_MAX = 100;

/** An optional enum filter that drops values it doesn't know. */
export function optionalEnum<const T extends readonly [string, ...string[]]>(
  values: T,
) {
  return z.enum(values).optional().catch(undefined);
}

/**
 * The URL schema for one list: pagination, the resource's sort whitelist, a search term, and
 * any extra filters (build those with `optionalEnum` so a bad value can't break the page).
 */
export function listParamsSchema<
  const Sort extends readonly [string, ...string[]],
  Filters extends z.ZodRawShape = Record<never, never>,
>({
  sortBy,
  defaultSort,
  defaultOrder = "desc",
  filters,
}: {
  sortBy: Sort;
  defaultSort: Sort[number];
  defaultOrder?: SortOrder;
  filters?: Filters;
}) {
  return z
    .object({
      page: z.coerce.number().int().min(1).catch(1),
      limit: z.coerce
        .number()
        .int()
        .refine((value): value is PageSize =>
          (PAGE_SIZES as readonly number[]).includes(value),
        )
        .catch(PAGE_SIZES[0]),
      sortBy: z.enum(sortBy).catch(defaultSort),
      order: z.enum(["asc", "desc"]).catch(defaultOrder),
      search: z
        .string()
        .trim()
        .max(SEARCH_MAX)
        .optional()
        .catch(undefined)
        .transform((value) => value || undefined),
    })
    .extend((filters ?? {}) as Filters);
}

/** What every list schema produces; filters add their own keys. */
export interface ListParams {
  page: number;
  limit: number;
  sortBy: string;
  order: SortOrder;
  search?: string;
}

export type ParamValue = string | number | boolean | undefined;

/** Search params from a page (`await searchParams`) or the browser. Repeated keys keep the first. */
export type RawSearchParams =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

function toRecord(raw: RawSearchParams): Record<string, string> {
  const record: Record<string, string> = {};
  if (raw instanceof URLSearchParams) {
    for (const [key, value] of raw) record[key] ??= value;
    return record;
  }
  for (const [key, value] of Object.entries(raw)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first !== undefined) record[key] = first;
  }
  return record;
}

export function parseListParams<Schema extends z.ZodType>(
  schema: Schema,
  raw: RawSearchParams,
): z.output<Schema> {
  return schema.parse(toRecord(raw));
}

/** The schema's defaults: what an empty query string means. */
export function listDefaults<Schema extends z.ZodType>(
  schema: Schema,
): z.output<Schema> {
  return schema.parse({});
}

/**
 * The query string for `params`, leaving out every value equal to its default, so the URL
 * stays short and the same view always has the same address. Keys keep a stable order.
 */
export function serializeListParams(
  params: Record<string, ParamValue>,
  defaults: Record<string, ParamValue>,
) {
  const search = new URLSearchParams();
  for (const key of Object.keys(params).sort()) {
    const value = params[key];
    if (value === undefined || value === "" || value === defaults[key])
      continue;
    search.set(key, String(value));
  }
  return search.toString();
}

/**
 * Applies a change to the current params. Changing anything except `page` sends the list
 * back to page 1, because the old page number may not exist under the new filter.
 */
export function patchListParams<Params extends ListParams>(
  current: Params,
  patch: Partial<Params>,
): Params {
  const next = { ...current, ...patch };
  const onlyPage = Object.keys(patch).every((key) => key === "page");
  if (!onlyPage && patch.page === undefined) next.page = 1;
  return next;
}

/** True when a filter or search narrows the list, i.e. "Clear filters" has something to do. */
export function hasActiveFilters(
  params: Record<string, ParamValue>,
  defaults: Record<string, ParamValue>,
) {
  const ignored = new Set(["page", "limit", "sortBy", "order"]);
  return Object.keys(params).some(
    (key) =>
      !ignored.has(key) &&
      params[key] !== undefined &&
      params[key] !== defaults[key],
  );
}
