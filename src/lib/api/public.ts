import "server-only";
import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";
import { backendRequest } from "./backend";
import { isApiError } from "./errors";
import type { Endpoint } from "./request";

type CachedResult<T> = { found: true; data: T } | { found: false };

/**
 * GET /public/* for signed-out pages, cached on this server for a minute (the backend caches
 * the same reads for 60 s). A cached result is shared by every visitor, so it can't carry a
 * visitor's IP: these few calls count against this server's own rate-limit bucket.
 *
 * A 404 comes back as a value, not a throw: an error leaving a "use cache" function is
 * serialized and stops being an ApiError, so the caller couldn't recognize it. A missing
 * program is cached for the minute like any answer; other failures aren't cached.
 */
async function cachedPublicRequest<T>(
  target: Endpoint<T>,
): Promise<CachedResult<T>> {
  "use cache";
  cacheLife("minutes");
  try {
    return {
      found: true,
      data: await backendRequest(target, { incoming: new Headers() }),
    };
  } catch (error) {
    if (isApiError(error) && error.status === 404) return { found: false };
    throw error;
  }
}

/** A 404 renders the not-found page; anything else reaches error.tsx. */
export async function publicRequest<T>(target: Endpoint<T>): Promise<T> {
  const result = await cachedPublicRequest(target);
  if (!result.found) notFound();
  return result.data;
}
