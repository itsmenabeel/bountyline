import "server-only";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { connection } from "next/server";
import { cache, type ReactNode } from "react";
import type { Endpoint } from "@/lib/api/request";
import { serverRequest } from "@/lib/api/server";
import type { QueryDescriptor } from "./descriptor";
import { createQueryClient } from "./query-client";

/**
 * One QueryClient per request on the server, shared by every component that renders in it.
 * No retries: a failure should reach error.tsx now, and the browser retries on its own.
 */
export const getServerQueryClient = cache(() =>
  createQueryClient({}, { queries: { retry: false } }),
);

/**
 * Loads a descriptor into this request's cache, with `serverRequest` unless a page passes
 * another transport (`publicRequest` on signed-out pages). Uses `fetchQuery`, not
 * `prefetchQuery`, so a 404 renders not-found, a 401 ends the session, and other failures
 * reach error.tsx instead of disappearing into an unhydrated error state.
 *
 * TanStack Query stamps queries with `Date.now()` here and again in `dehydrate()`, which
 * Cache Components refuses while prerendering. `connection()` marks the render as
 * request-time first. `serverRequest` already reads cookies and makes an uncached fetch, but
 * a cached transport like `publicRequest` does neither, and /programs failed in dev without it.
 */
export async function prefetch<T>(
  descriptor: QueryDescriptor<T>,
  transport: (target: Endpoint<T>) => Promise<T> = serverRequest,
) {
  await connection();
  return getServerQueryClient().fetchQuery({
    queryKey: descriptor.queryKey,
    queryFn: () => transport(descriptor.endpoint),
  });
}

/** Sends this request's prefetched queries to the client components below it. */
export function HydrateClient({ children }: { children: ReactNode }) {
  return (
    <HydrationBoundary state={dehydrate(getServerQueryClient())}>
      {children}
    </HydrationBoundary>
  );
}
