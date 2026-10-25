import { jwtVerify } from "jose";
import { ROLES, type Role } from "@/types/api";

/** What the backend puts in an access token (shared/utils/jwt.ts): `sub`, `role`, and `exp`. */
export interface AccessClaims {
  userId: string;
  role: Role;
  /** Expiry, in seconds since the epoch. */
  exp: number;
}

const isRole = (value: unknown): value is Role =>
  typeof value === "string" && (ROLES as readonly string[]).includes(value);

/**
 * Verifies an access token signed with the backend's JWT_ACCESS_SECRET (HS256). Returns null
 * for anything that isn't a valid, unexpired token with the expected claims.
 */
export async function verifyAccessToken(
  token: string,
  secret: string,
  now = new Date(),
): Promise<AccessClaims | null> {
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { algorithms: ["HS256"], currentDate: now },
    );
    if (typeof payload.sub !== "string" || !isRole(payload.role)) return null;
    if (typeof payload.exp !== "number") return null;
    return { userId: payload.sub, role: payload.role, exp: payload.exp };
  } catch {
    return null;
  }
}

/** True when the token expires within `marginSeconds`, so it should be refreshed first. */
export function expiresSoon(
  claims: AccessClaims,
  marginSeconds: number,
  now = Date.now(),
) {
  return claims.exp - now / 1000 <= marginSeconds;
}
