import { endpoint, listEndpoint } from "@/lib/api/request";
import type {
  AuditLog,
  DashboardStats,
  Role,
  User,
  UserStatusResult,
} from "@/types/api";
import type { AuditEntityType, UserSort } from "./params";

export interface UserListQuery {
  page: number;
  limit: number;
  sortBy: UserSort;
  order: "asc" | "desc";
  search?: string;
  role?: Role;
  isActive?: boolean;
}

export interface AuditLogQuery {
  page: number;
  limit: number;
  sortBy: "createdAt";
  order: "asc" | "desc";
  action?: string;
  entityType?: AuditEntityType;
  actorId?: string;
  /** ISO timestamps; the backend compares `createdAt` against both, inclusive. */
  from?: string;
  to?: string;
}

export const adminEndpoints = {
  dashboardStats: () =>
    endpoint<DashboardStats>({ path: "/admin/dashboard-stats" }),
  /** Every user who isn't deleted; `search` matches name or email. */
  users: (query: UserListQuery) =>
    listEndpoint<User>({ path: "/admin/users", query: { ...query } }),
  /** 409 for the admin's own account, the last admin, or an owner who still has programs. */
  changeRole: (id: string, role: Role) =>
    endpoint<User>({
      method: "PATCH",
      path: `/admin/users/${id}/role`,
      body: { role },
    }),
  /** Banning an owner pauses their ACTIVE programs; unbanning doesn't resume them. */
  changeStatus: (id: string, body: { isActive: boolean; reason?: string }) =>
    endpoint<UserStatusResult>({
      method: "PATCH",
      path: `/admin/users/${id}/status`,
      body,
    }),
  auditLogs: (query: AuditLogQuery) =>
    listEndpoint<AuditLog>({ path: "/admin/audit-logs", query: { ...query } }),
};
