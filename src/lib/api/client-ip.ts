// Header names the backend reads in shared/constants/http.ts (backend change B2).
export const CLIENT_IP_HEADER = "X-Client-IP";
export const BFF_SECRET_HEADER = "X-BFF-Secret";

/**
 * The visitor's IP from the incoming request: Vercel's `x-real-ip`, else the first
 * `x-forwarded-for` entry. The backend checks the format and ignores anything that isn't an IP.
 */
export function clientIpFrom(incoming: Headers): string | undefined {
  const realIp = incoming.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = incoming.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || undefined;
}
