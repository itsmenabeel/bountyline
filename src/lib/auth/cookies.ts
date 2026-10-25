import { decodeJwt } from "jose";
import type { TokenPair } from "@/types/api";

// Session tokens live only in httpOnly cookies, so client JavaScript never sees them
// (implementation-plan §4.4).

export const ACCESS_COOKIE = "bb_at";
export const REFRESH_COOKIE = "bb_rt";

// Backend defaults (JWT_ACCESS_TTL 15m, JWT_REFRESH_TTL 7d), used only if a token has no exp.
const ACCESS_FALLBACK_SECONDS = 15 * 60;
const REFRESH_FALLBACK_SECONDS = 7 * 24 * 60 * 60;

export interface SessionCookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
}

/**
 * The part of a cookie store this module needs. `cookies()` inside a Server Function and
 * `NextResponse.cookies` in proxy.ts both provide it.
 */
export interface CookieStore {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, options: SessionCookieOptions): unknown;
}

/** Whole seconds until the token's `exp`, never negative. Doesn't verify the signature. */
export function secondsUntilExpiry(
  token: string,
  fallback: number,
  now = Date.now(),
) {
  let exp: unknown;
  try {
    exp = decodeJwt(token).exp;
  } catch {
    return fallback;
  }
  if (typeof exp !== "number") return fallback;
  return Math.max(0, Math.floor(exp - now / 1000));
}

function options(maxAge: number): SessionCookieOptions {
  return {
    httpOnly: true,
    // Browsers treat http://localhost as secure, so `next start` still works locally.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}

/** Stores a fresh token pair. Each cookie expires with its token. */
export function writeSessionCookies(
  store: CookieStore,
  tokens: TokenPair,
  now = Date.now(),
) {
  store.set(
    ACCESS_COOKIE,
    tokens.accessToken,
    options(
      secondsUntilExpiry(tokens.accessToken, ACCESS_FALLBACK_SECONDS, now),
    ),
  );
  store.set(
    REFRESH_COOKIE,
    tokens.refreshToken,
    options(
      secondsUntilExpiry(tokens.refreshToken, REFRESH_FALLBACK_SECONDS, now),
    ),
  );
}

/** Expires both cookies, with the same attributes they were set with. */
export function clearSessionCookies(store: CookieStore) {
  store.set(ACCESS_COOKIE, "", options(0));
  store.set(REFRESH_COOKIE, "", options(0));
}

export function readSessionCookies(store: CookieStore) {
  return {
    accessToken: store.get(ACCESS_COOKIE)?.value || undefined,
    refreshToken: store.get(REFRESH_COOKIE)?.value || undefined,
  };
}
