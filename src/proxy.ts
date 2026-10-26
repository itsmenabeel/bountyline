import { type NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  clearSessionCookies,
  REFRESH_COOKIE,
  writeSessionCookies,
} from "@/lib/auth/cookies";
import {
  AUTH_PAGES,
  areaRoleFor,
  homeFor,
  safeNextPath,
} from "@/lib/auth/roles";
import { REQUEST_PATH_HEADER, resolveSession } from "@/lib/auth/session";

/**
 * Route protection (implementation-plan §4.5):
 * - a role area without a session redirects to /login?next=<path>
 * - a role area with another role's session renders /forbidden at the same URL
 * - /login and /register with a session redirect to that role's dashboard
 * Each request also refreshes an expiring access token and hands the new one to this render.
 * Layouts re-check the role against /users/me, and the backend enforces every rule again.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const areaRole = areaRoleFor(pathname);
  const isAuthPage = (AUTH_PAGES as readonly string[]).includes(pathname);
  // Server Actions post to the page that uses them and check their own input, so they only
  // get the token refresh, never a redirect (a redirect would break the action's response).
  const isAction = request.headers.has("next-action");

  const resolved = await resolveSession(request.cookies, request.headers);
  const { session } = resolved;

  let response: NextResponse;
  if (!isAction && areaRole && !session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    response = NextResponse.redirect(login);
  } else if (!isAction && isAuthPage && session) {
    // A `next` inside the user's own area wins, so "Sign in to submit" on a public program
    // lands a researcher whose session is still alive on the report form.
    const next = safeNextPath(
      request.nextUrl.searchParams.get("next"),
      session.role,
    );
    response = NextResponse.redirect(
      new URL(next ?? homeFor(session.role), request.url),
    );
  } else {
    const headers = new Headers(request.headers);
    headers.set(REQUEST_PATH_HEADER, `${pathname}${search}`);
    if (resolved.rotated) {
      // This render reads cookies from the forwarded request, so it needs the new pair too.
      request.cookies.set(ACCESS_COOKIE, resolved.rotated.accessToken);
      request.cookies.set(REFRESH_COOKIE, resolved.rotated.refreshToken);
      headers.set("cookie", request.cookies.toString());
    }

    // The rewrite applies to actions too: a form on /forbidden posts to the URL in the
    // address bar, and the action has to run against the page that rendered it.
    response =
      areaRole && session && session.role !== areaRole
        ? NextResponse.rewrite(new URL("/forbidden", request.url), {
            request: { headers },
          })
        : NextResponse.next({ request: { headers } });
  }

  if (resolved.rotated) writeSessionCookies(response.cookies, resolved.rotated);
  if (resolved.ended) clearSessionCookies(response.cookies);
  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/owner/:path*",
    "/researcher/:path*",
    "/payment/:path*",
    "/login",
    "/register",
  ],
};
