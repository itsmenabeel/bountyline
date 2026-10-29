import { endpoint } from "@/lib/api/request";
import type { PublicStats } from "@/types/api";

export const marketingEndpoints = {
  /** Platform totals for signed-out pages (backend change B1), cached for a minute. */
  stats: () => endpoint<PublicStats>({ path: "/public/stats" }),
};
