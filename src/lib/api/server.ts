import "server-only";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { readSessionCookies } from "@/lib/auth/cookies";
import { REQUEST_PATH_HEADER } from "@/lib/auth/session";
import { backendRequest } from "./backend";
import { isApiError } from "./errors";
import type { Endpoint } from "./request";

/**
 * The Server Component transport: calls the backend directly with the access token from the
 * cookie (proxy.ts has already refreshed it). A 401 ends the session through
 * /api/auth/expired, because a render can't clear cookies; a 404 renders the not-found page.
 * Anything else throws ApiError for the nearest error.tsx.
 *
 * `connection()` marks the read as request-time. Without it, a runtime prefetch reached the
 * clock on the way to the backend and `next dev` logged "blocking-prerender-current-time".
 */
export async function serverRequest<T>(target: Endpoint<T>): Promise<T> {
  await connection();
  const [cookieStore, incoming] = await Promise.all([cookies(), headers()]);
  const { accessToken } = readSessionCookies(cookieStore);

  try {
    return await backendRequest(target, { incoming, accessToken });
  } catch (error) {
    if (isApiError(error) && error.status === 401) {
      const next = incoming.get(REQUEST_PATH_HEADER);
      redirect(
        next
          ? `/api/auth/expired?next=${encodeURIComponent(next)}`
          : "/api/auth/expired",
      );
    }
    if (isApiError(error) && error.status === 404) notFound();
    throw error;
  }
}
