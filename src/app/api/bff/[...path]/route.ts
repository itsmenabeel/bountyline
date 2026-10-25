import { type NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/backend";
import { toBackendPath } from "@/lib/api/bff-path";
import { isApiError } from "@/lib/api/errors";
import type { ApiFailure } from "@/lib/api/types";
import { clearSessionCookies, writeSessionCookies } from "@/lib/auth/cookies";
import { resolveSession } from "@/lib/auth/session";

// Client components call the backend through here (lib/api/client.ts). The access token
// stays in its httpOnly cookie: this handler reads it, refreshes it when it's expiring,
// and forwards the call with the visitor's IP (backend change B2).

// The backend's JSON body limit (shared/constants/http.ts).
const MAX_BODY_BYTES = 100 * 1024;

function failure(status: number, message: string) {
  const body: ApiFailure = { success: false, message, errors: [] };
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

/** Browsers mark cross-site requests; a cookie-carrying write from another site stops here. */
function isCrossSite(request: NextRequest) {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return true;
  const origin = request.headers.get("origin");
  return origin !== null && origin !== request.nextUrl.origin;
}

async function forward(
  request: NextRequest,
  { params }: RouteContext<"/api/bff/[...path]">,
) {
  const path = toBackendPath((await params).path);
  if (!path) return failure(404, "This address doesn't exist.");

  const method = request.method;
  if (method !== "GET" && isCrossSite(request)) {
    return failure(403, "This request came from another site.");
  }

  let body: string | undefined;
  if (method !== "GET" && method !== "DELETE") {
    body = (await request.text()) || undefined;
    if (body && new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
      return failure(413, "That's more data than the server accepts at once.");
    }
  }

  const resolved = await resolveSession(request.cookies, request.headers);
  if (!resolved.session) {
    const response = failure(401, "Your session ended. Sign in again.");
    if (resolved.ended) clearSessionCookies(response.cookies);
    return response;
  }

  let upstream: Response;
  try {
    upstream = await backendFetch(
      `${path}${request.nextUrl.search}`,
      { method, body },
      { incoming: request.headers, accessToken: resolved.session.accessToken },
    );
  } catch (error) {
    // 503 keeps the message: ApiError.userMessage hides generic 5xx text but not 502/503.
    return failure(
      503,
      isApiError(error) ? error.userMessage : "We couldn't reach the server.",
    );
  }

  // Only the status, the body, and its type go back. No backend headers reach the browser.
  const response = new NextResponse(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("content-type") ?? "application/json",
      "Cache-Control": "no-store",
    },
  });
  if (resolved.rotated) writeSessionCookies(response.cookies, resolved.rotated);
  return response;
}

export {
  forward as DELETE,
  forward as GET,
  forward as PATCH,
  forward as POST,
  forward as PUT,
};
