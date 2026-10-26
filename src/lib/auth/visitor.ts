import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { serverEnv } from "@/lib/env/server";
import type { Role } from "@/types/api";
import { readSessionCookies } from "./cookies";
import { verifyAccessToken } from "./tokens";

export interface Visitor {
  /** From a valid access token; null when signed out or the token has expired. */
  role: Role | null;
  /** A refresh token is present, so /login can renew the session without a password. */
  canResume: boolean;
}

/**
 * Who is looking at a public page, from the cookies alone, so public pages make no backend
 * call. proxy.ts doesn't run on public pages, so an expired access token stays expired here.
 * Read it inside a <Suspense> boundary.
 */
export const getVisitor = cache(async (): Promise<Visitor> => {
  const { accessToken, refreshToken } = readSessionCookies(await cookies());
  const claims = accessToken
    ? await verifyAccessToken(accessToken, serverEnv.JWT_ACCESS_SECRET)
    : null;
  return { role: claims?.role ?? null, canResume: Boolean(refreshToken) };
});
