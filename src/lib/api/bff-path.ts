// Paths the BFF route refuses to forward. /auth/* issues and rotates tokens, which must
// stay in httpOnly cookies; the auth server actions are the only way in.
const BLOCKED_ROOTS = new Set(["auth"]);

/**
 * The backend path for the BFF catch-all segments, or null when the request may not be
 * forwarded. Each segment is re-encoded, and dot segments are refused so a request can't
 * climb out of /api/v1.
 */
export function toBackendPath(
  segments: readonly string[],
): `/${string}` | null {
  if (segments.length === 0) return null;
  for (const segment of segments) {
    if (segment === "" || segment === "." || segment === "..") return null;
  }
  const root = segments[0];
  if (root === undefined || BLOCKED_ROOTS.has(root.toLowerCase())) return null;
  return `/${segments.map(encodeURIComponent).join("/")}`;
}
