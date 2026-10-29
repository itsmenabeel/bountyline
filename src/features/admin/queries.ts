import type { z } from "zod";
import { describeQuery } from "@/lib/query/descriptor";
import { adminEndpoints } from "./endpoints";
import { type auditLogParams, auditRange, type userListParams } from "./params";

export type UserListParams = z.output<typeof userListParams>;
export type AuditLogParams = z.output<typeof auditLogParams>;

export const adminKeys = {
  all: ["admin"] as const,
  users: () => [...adminKeys.all, "users"] as const,
  userList: (params: UserListParams) => [...adminKeys.users(), params] as const,
  auditLogs: (params: AuditLogParams) =>
    [...adminKeys.all, "audit-logs", params] as const,
};

export function userListQuery(params: UserListParams) {
  const { status, ...rest } = params;
  return describeQuery(
    adminKeys.userList(params),
    adminEndpoints.users({
      ...rest,
      isActive: status === undefined ? undefined : status === "active",
    }),
  );
}

/**
 * Users by name for the audit log's actor filter. The backend caps a page at 50, which
 * covers every account on the platform today; past that it would need a search.
 */
export function userOptionsQuery() {
  return userListQuery({
    page: 1,
    limit: 50,
    sortBy: "name",
    order: "asc",
    search: undefined,
    role: undefined,
    status: undefined,
  });
}

export function auditLogQuery(params: AuditLogParams) {
  const { page, limit, sortBy, order, action, entityType, actorId } = params;
  return describeQuery(
    adminKeys.auditLogs(params),
    adminEndpoints.auditLogs({
      page,
      limit,
      sortBy,
      order,
      action,
      entityType,
      actorId,
      ...auditRange(params.from, params.to),
    }),
  );
}
