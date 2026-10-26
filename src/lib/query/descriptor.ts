import { type QueryKey, queryOptions } from "@tanstack/react-query";
import { clientRequest } from "@/lib/api/client";
import type { Endpoint } from "@/lib/api/request";

/**
 * A query key paired with the endpoint that fills it. Server pages prefetch a descriptor
 * with `serverRequest` and client components read the same one with `clientRequest`, so the
 * hydrated cache entry and the client's query can't drift apart.
 */
export interface QueryDescriptor<T> {
  queryKey: QueryKey;
  endpoint: Endpoint<T>;
}

export function describeQuery<T>(
  queryKey: QueryKey,
  endpoint: Endpoint<T>,
): QueryDescriptor<T> {
  return { queryKey, endpoint };
}

/** TanStack options for the browser: fetches through the BFF route. */
export function clientQuery<T>(descriptor: QueryDescriptor<T>) {
  return queryOptions({
    queryKey: descriptor.queryKey,
    queryFn: () => clientRequest(descriptor.endpoint),
  });
}
