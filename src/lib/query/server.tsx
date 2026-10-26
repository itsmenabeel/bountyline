import "server-only";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { cache, type ReactNode } from "react";
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
 * Loads a descriptor into this request's cache with `serverRequest`. Uses `fetchQuery`, not
 * `prefetchQuery`, so a 404 renders not-found, a 401 ends the session, and other failures
 * reach error.tsx instead of disappearing into an unhydrated error state.
 */
export async function prefetch<T>(descriptor: QueryDescriptor<T>) {
  return getServerQueryClient().fetchQuery({
    queryKey: descriptor.queryKey,
    queryFn: () => serverRequest(descriptor.endpoint),
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
