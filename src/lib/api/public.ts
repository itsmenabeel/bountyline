import "server-only";
import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";
import { backendRequest } from "./backend";
import { isApiError } from "./errors";
import type { Endpoint } from "./request";

/**
 * GET /public/* for signed-out pages, cached on this server for a minute (the backend caches
 * the same reads for 60 s). A cached result is shared by every visitor, so it can't carry a
 * visitor's IP: these few calls count against this server's own rate-limit bucket.
 */
async function cachedPublicRequest<T>(target: Endpoint<T>): Promise<T> {
  "use cache";
  cacheLife("minutes");
  return backendRequest(target, { incoming: new Headers() });
}

/** Failures aren't cached. A 404 renders the not-found page; anything else reaches error.tsx. */
export async function publicRequest<T>(target: Endpoint<T>): Promise<T> {
  try {
    return await cachedPublicRequest(target);
  } catch (error) {
    if (isApiError(error) && error.status === 404) notFound();
    throw error;
  }
}
