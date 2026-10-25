import "server-only";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
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
 */
export async function serverRequest<T>(target: Endpoint<T>): Promise<T> {
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
