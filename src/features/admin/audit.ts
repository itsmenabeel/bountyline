import { z } from "zod";
import {
  ACCOUNT_ROLE_LABEL,
  PROGRAM_STATUS_LABEL,
  REPORT_STATUS_LABEL,
  SEVERITY_LABEL,
} from "@/lib/constants/domain";
import { formatMoney } from "@/lib/money";
import {
  type AuditLog,
  PROGRAM_STATUSES,
  REPORT_STATUSES,
  ROLES,
  SEVERITIES,
} from "@/types/api";

// Every action the backend writes to the audit log (writeAudit calls in its services).
export const AUDIT_ACTIONS = [
  "REPORT_STATUS_CHANGE",
  "REPORT_DELETED",
  "PAYOUT_ISSUED",
  "POOL_FUNDED",
  "PROGRAM_STATUS_CHANGE",
  "REWARD_TIERS_UPDATED",
  "PROGRAM_DELETED",
  "ROLE_UPDATED",
  "USER_BANNED",
  "USER_UNBANNED",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  REPORT_STATUS_CHANGE: "Report status changed",
  REPORT_DELETED: "Report deleted",
  PAYOUT_ISSUED: "Payout sent",
  POOL_FUNDED: "Pool funded",
  PROGRAM_STATUS_CHANGE: "Program status changed",
  REWARD_TIERS_UPDATED: "Reward tiers saved",
  PROGRAM_DELETED: "Program deleted",
  ROLE_UPDATED: "Role changed",
  USER_BANNED: "User banned",
  USER_UNBANNED: "User unbanned",
};

const isAuditAction = (value: string): value is AuditAction =>
  (AUDIT_ACTIONS as readonly string[]).includes(value);

/** The label for an action, or the raw name in sentence case for one added later. */
export function auditActionLabel(action: string) {
  if (isAuditAction(action)) return AUDIT_ACTION_LABEL[action];
  const words = action.toLowerCase().replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// Metadata is `unknown` on the wire. Each known action gets a small schema, and a record that
// doesn't match falls back to the action's label alone (implementation-plan §3.3).
const cents = z.number().int();
const reportMove = z.object({
  from: z.enum(REPORT_STATUSES),
  to: z.enum(REPORT_STATUSES),
  severity: z.enum(SEVERITIES).optional(),
  amount: cents.optional(),
  reason: z.string().optional(),
});
const programMove = z.object({
  from: z.enum(PROGRAM_STATUSES),
  to: z.enum(PROGRAM_STATUSES),
  reason: z.string().optional(),
});
const roleMove = z.object({ from: z.enum(ROLES), to: z.enum(ROLES) });
const ban = z.object({
  reason: z.string().optional(),
  pausedPrograms: z.number().int().optional(),
});
const money = z.object({ amount: cents });
const tiers = z.object({
  tiers: z.array(z.object({ severity: z.enum(SEVERITIES), amount: cents })),
});

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;

function describe(action: AuditAction, metadata: unknown): string | null {
  switch (action) {
    case "REPORT_STATUS_CHANGE": {
      const move = reportMove.safeParse(metadata);
      if (!move.success) return null;
      const { from, to, severity, amount, reason } = move.data;
      const parts = [
        `${REPORT_STATUS_LABEL[from]} to ${REPORT_STATUS_LABEL[to]}`,
      ];
      if (severity) parts.push(`at ${SEVERITY_LABEL[severity]}`);
      if (amount !== undefined) parts.push(`for ${formatMoney(amount)}`);
      if (reason === "researcher_update")
        parts.push("after the researcher's edit");
      return `${parts.join(" ")}.`;
    }
    case "PROGRAM_STATUS_CHANGE": {
      const move = programMove.safeParse(metadata);
      if (!move.success) return null;
      const { from, to, reason } = move.data;
      const why =
        reason === "owner_banned" ? ", because an admin banned the owner" : "";
      return `${PROGRAM_STATUS_LABEL[from]} to ${PROGRAM_STATUS_LABEL[to]}${why}.`;
    }
    case "ROLE_UPDATED": {
      const move = roleMove.safeParse(metadata);
      if (!move.success) return null;
      return `${ACCOUNT_ROLE_LABEL[move.data.from]} to ${ACCOUNT_ROLE_LABEL[move.data.to]}.`;
    }
    case "USER_BANNED": {
      const parsed = ban.safeParse(metadata);
      if (!parsed.success) return null;
      const { reason, pausedPrograms = 0 } = parsed.data;
      const parts = [reason ? `Reason: ${reason}` : "No reason given"];
      if (pausedPrograms > 0) {
        parts.push(`${plural(pausedPrograms, "program", "programs")} paused`);
      }
      return `${parts.join(". ")}.`;
    }
    case "POOL_FUNDED": {
      const parsed = money.safeParse(metadata);
      return parsed.success
        ? `${formatMoney(parsed.data.amount)} added through Stripe.`
        : null;
    }
    case "PAYOUT_ISSUED": {
      const parsed = money.safeParse(metadata);
      return parsed.success
        ? `${formatMoney(parsed.data.amount)} paid from the pool.`
        : null;
    }
    case "REWARD_TIERS_UPDATED": {
      const parsed = tiers.safeParse(metadata);
      if (!parsed.success || parsed.data.tiers.length === 0) return null;
      return `${parsed.data.tiers
        .map(
          (tier) =>
            `${SEVERITY_LABEL[tier.severity]} ${formatMoney(tier.amount)}`,
        )
        .join(", ")}.`;
    }
    case "REPORT_DELETED":
    case "PROGRAM_DELETED":
    case "USER_UNBANNED":
      return null;
  }
}

/** One line under the action, from the record's metadata, or null when there's nothing to add. */
export function auditSummary(log: Pick<AuditLog, "action" | "metadata">) {
  return isAuditAction(log.action) ? describe(log.action, log.metadata) : null;
}

/** Where the record's subject lives in the admin area, if it has a page there. */
export function auditEntityHref(
  log: Pick<AuditLog, "entityType" | "entityId">,
) {
  if (log.entityType === "Report") return `/admin/reports/${log.entityId}`;
  if (log.entityType === "Program") return `/admin/programs/${log.entityId}`;
  return null;
}
