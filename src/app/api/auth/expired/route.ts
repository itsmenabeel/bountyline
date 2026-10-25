import { type NextRequest, NextResponse } from "next/server";
import { clearSessionCookies } from "@/lib/auth/cookies";

/**
 * Where a request lands when the backend rejects the session mid-render or mid-fetch.
 * Server Components can't change cookies, so they redirect here; this clears both cookies
 * and continues to /login, keeping `next` when it's a path on this site.
 */
export function GET(request: NextRequest) {
  const login = new URL("/login", request.url);
  const next = request.nextUrl.searchParams.get("next");
  if (
    next?.startsWith("/") &&
    !next.startsWith("//") &&
    !next.startsWith("/\\")
  ) {
    login.searchParams.set("next", next);
  }

  const response = NextResponse.redirect(login);
  clearSessionCookies(response.cookies);
  return response;
}
