import "server-only";
import { serverEnv } from "@/lib/env/server";
import { BFF_SECRET_HEADER, CLIENT_IP_HEADER, clientIpFrom } from "./client-ip";
import { toApiError } from "./errors";
import {
  type Endpoint,
  endpointPath,
  readEnvelope,
  resolveEnvelope,
} from "./request";

// Render's free tier sleeps; the first request after a nap can take most of a minute.
const DEFAULT_TIMEOUT_MS = 70_000;

export interface BackendContext {
  /** Headers of the visitor's request, for the client IP. */
  incoming: Headers;
  accessToken?: string;
  timeoutMs?: number;
}

/**
 * The one way this server talks to the backend (server actions, proxy, BFF). It forwards
 * the visitor's IP with the shared secret, so the backend rate-limits each visitor
 * separately instead of treating every visitor as this server (backend change B2).
 * Throws ApiError for network failures and timeouts; returns any HTTP response as is.
 */
export async function backendFetch(
  pathAndQuery: string,
  init: { method: string; body?: string },
  { incoming, accessToken, timeoutMs = DEFAULT_TIMEOUT_MS }: BackendContext,
): Promise<Response> {
  const headers = new Headers({
    Accept: "application/json",
    [BFF_SECRET_HEADER]: serverEnv.BFF_SHARED_SECRET,
  });
  if (init.body !== undefined) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const clientIp = clientIpFrom(incoming);
  if (clientIp) headers.set(CLIENT_IP_HEADER, clientIp);

  try {
    return await fetch(`${serverEnv.API_BASE_URL}${pathAndQuery}`, {
      ...init,
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    throw toApiError(error);
  }
}

/** Calls an endpoint and unwraps the envelope. Throws ApiError on any failure. */
export async function backendRequest<T>(
  target: Endpoint<T>,
  context: BackendContext,
): Promise<T> {
  const response = await backendFetch(
    endpointPath(target),
    {
      method: target.method,
      body: target.body === undefined ? undefined : JSON.stringify(target.body),
    },
    context,
  );
  return resolveEnvelope(target, await readEnvelope(response));
}
