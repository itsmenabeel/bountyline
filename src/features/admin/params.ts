import { z } from "zod";
import { listParamsSchema, optionalEnum } from "@/lib/list-params";
import { ROLES } from "@/types/api";
import { AUDIT_ACTIONS } from "./audit";

// The backend's sort whitelist for /admin/users.
export const USER_SORTS = ["createdAt", "name", "email", "reputation"] as const;
export type UserSort = (typeof USER_SORTS)[number];

export const USER_STATUSES = ["active", "banned"] as const;
export type UserStatusFilter = (typeof USER_STATUSES)[number];

/** Users: name or email search, role, and active or banned. Newest first. */
export const userListParams = listParamsSchema({
  sortBy: USER_SORTS,
  defaultSort: "createdAt",
  filters: {
    role: optionalEnum(ROLES),
    status: optionalEnum(USER_STATUSES),
  },
});

export const AUDIT_ENTITY_TYPES = ["Program", "Report", "User"] as const;
export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number];

/** A calendar day as the date input writes it. */
const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => !Number.isNaN(Date.parse(value)))
  .optional()
  .catch(undefined);

/** The audit log: action, entity type, actor, and a day range. Newest first. */
export const auditLogParams = listParamsSchema({
  sortBy: ["createdAt"],
  defaultSort: "createdAt",
  filters: {
    action: optionalEnum(AUDIT_ACTIONS),
    entityType: optionalEnum(AUDIT_ENTITY_TYPES),
    // The backend answers a malformed id with a 422, so a bad one is dropped instead.
    actorId: z.uuid().optional().catch(undefined),
    from: day,
    to: day,
  },
});

/**
 * The day range as the backend's `from`/`to` timestamps, covering both days whole in UTC
 * (dates on screen are UTC too). A range that ends before it starts sends neither, which
 * matches the backend's rule (from ≤ to) and the filter's own error message.
 */
export function auditRange(from?: string, to?: string) {
  if (from && to && from > to) return {};
  return {
    from: from ? `${from}T00:00:00.000Z` : undefined,
    to: to ? `${to}T23:59:59.999Z` : undefined,
  };
}
