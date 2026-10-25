import type { Role } from "@/types/api";

// Kept free of UI imports so proxy.ts and server actions can use it without pulling in icons.

export const ROLE_HOME = {
  RESEARCHER: "/researcher",
  PROGRAM_OWNER: "/owner",
  ADMIN: "/admin",
} as const satisfies Record<Role, `/${string}`>;

/** Path prefixes each role may open. Stripe returns owners to /payment/*. */
export const ROLE_AREAS = {
  RESEARCHER: ["/researcher"],
  PROGRAM_OWNER: ["/owner", "/payment"],
  ADMIN: ["/admin"],
} as const satisfies Record<Role, readonly `/${string}`[]>;

export function homeFor(role: Role) {
  return ROLE_HOME[role];
}

const inPrefix = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

/** The role whose area contains `pathname`, or null for pages outside every area. */
export function areaRoleFor(pathname: string): Role | null {
  for (const role of Object.keys(ROLE_AREAS) as Role[]) {
    if (ROLE_AREAS[role].some((area) => inPrefix(pathname, area))) return role;
  }
  return null;
}

/** Sign-in pages a signed-in visitor gets bounced from. */
export const AUTH_PAGES = ["/login", "/register"] as const;

// A throwaway origin for resolving relative paths. Any `next` that resolves elsewhere
// ("//evil.test", "/\\evil.test", "https://...") changes the origin and gets rejected.
const BASE = "http://bountyline.invalid";

/**
 * The `next` path to send a signed-in user to, or null when it isn't a relative path inside
 * that user's own area. Stops open redirects and avoids landing someone on /forbidden.
 */
export function safeNextPath(next: unknown, role: Role): string | null {
  if (typeof next !== "string" || !next.startsWith("/")) return null;

  let url: URL;
  try {
    url = new URL(next, BASE);
  } catch {
    return null;
  }
  if (url.origin !== BASE) return null;

  const inArea = ROLE_AREAS[role].some((area) => inPrefix(url.pathname, area));
  return inArea ? `${url.pathname}${url.search}${url.hash}` : null;
}
