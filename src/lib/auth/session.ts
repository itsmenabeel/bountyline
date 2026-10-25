import "server-only";
import { authEndpoints } from "@/features/auth/endpoints";
import { backendRequest } from "@/lib/api/backend";
import { isApiError } from "@/lib/api/errors";
import { serverEnv } from "@/lib/env/server";
import type { Role, TokenPair } from "@/types/api";
import { type CookieStore, readSessionCookies } from "./cookies";
import { createRefresher, type RefreshOutcome } from "./refresh";
import { expiresSoon, verifyAccessToken } from "./tokens";

/**
 * Set by proxy.ts on every request it forwards: the path and query the visitor asked for.
 * Server Components read it to build the `next` link when a session ends mid-render.
 */
export const REQUEST_PATH_HEADER = "x-bountyline-path";

// Refresh a minute early so a token can't expire between this check and the backend call.
const REFRESH_MARGIN_SECONDS = 60;

const refreshTokens = createRefresher<Headers>(
  async (refreshToken, incoming): Promise<RefreshOutcome> => {
    try {
      const tokens = await backendRequest(authEndpoints.refresh(refreshToken), {
        incoming,
      });
      return { status: "ok", tokens };
    } catch (error) {
      // 401: used, revoked, expired, or the account was banned. Anything else is no verdict.
      if (isApiError(error) && error.status === 401)
        return { status: "rejected" };
      return { status: "unavailable" };
    }
  },
);

export interface Session {
  userId: string;
  role: Role;
  accessToken: string;
}

export interface ResolvedSession {
  session: Session | null;
  /** A new token pair this request rotated in; the caller stores it on its response. */
  rotated?: TokenPair;
  /** The backend refused the refresh token, so the caller clears both cookies. */
  ended: boolean;
}

/**
 * The visitor's session from the request cookies, refreshing the access token when it's
 * missing or about to expire. Role comes from the verified token here; layouts re-check it
 * against /users/me, and the backend enforces it on every call.
 */
export async function resolveSession(
  cookies: Pick<CookieStore, "get">,
  incoming: Headers,
): Promise<ResolvedSession> {
  const { accessToken, refreshToken } = readSessionCookies(cookies);
  const secret = serverEnv.JWT_ACCESS_SECRET;

  const current = accessToken
    ? await verifyAccessToken(accessToken, secret)
    : null;
  const currentSession =
    current && accessToken
      ? { userId: current.userId, role: current.role, accessToken }
      : null;

  if (current && !expiresSoon(current, REFRESH_MARGIN_SECONDS)) {
    return { session: currentSession, ended: false };
  }
  if (!refreshToken) return { session: currentSession, ended: false };

  const outcome = await refreshTokens(refreshToken, incoming);
  if (outcome.status === "rejected") return { session: null, ended: true };
  // No verdict: a token that is still valid, if only for seconds, carries this request.
  if (outcome.status === "unavailable") {
    return { session: currentSession, ended: false };
  }

  const claims = await verifyAccessToken(outcome.tokens.accessToken, secret);
  // A fresh token that fails verification means JWT_ACCESS_SECRET differs from the backend's.
  if (!claims) return { session: null, ended: false };
  return {
    session: {
      userId: claims.userId,
      role: claims.role,
      accessToken: outcome.tokens.accessToken,
    },
    rotated: outcome.tokens,
    ended: false,
  };
}
