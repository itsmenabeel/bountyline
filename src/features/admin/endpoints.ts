import { endpoint } from "@/lib/api/request";
import type { DashboardStats } from "@/types/api";

export const adminEndpoints = {
  dashboardStats: () =>
    endpoint<DashboardStats>({ path: "/admin/dashboard-stats" }),
};
