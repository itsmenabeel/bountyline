import { z } from "zod";
import type { ApiError } from "@/lib/api/errors";
import type { Role, User } from "@/types/api";

// Mirrors bug-bounty-platform admin.validation.ts: a ban reason is optional, up to 500.
export const BAN_REASON_MAX = 500;

export const banSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(BAN_REASON_MAX, `Keep the reason to ${BAN_REASON_MAX} characters.`),
});
export type BanValues = z.input<typeof banSchema>;

/** The status request body: an empty reason stays out, as the backend wants 1–500 or none. */
export function banRequest(isActive: boolean, reason = "") {
  const trimmed = reason.trim();
  return trimmed ? { isActive, reason: trimmed } : { isActive };
}

/** "Riley Researcher banned. 2 programs paused." */
export function statusDoneText(
  user: Pick<User, "name" | "isActive">,
  pausedPrograms: number,
) {
  if (user.isActive) return `${user.name} unbanned`;
  if (pausedPrograms === 0) return `${user.name} banned`;
  const programs =
    pausedPrograms === 1 ? "1 program" : `${pausedPrograms} programs`;
  return `${user.name} banned. ${programs} paused until the owner resumes them.`;
}

const OWNS_PROGRAMS = /owns programs/i;
const LAST_ADMIN = /other active admin/i;

/** The backend's 409s here are rules about who can change; each gets its own sentence. */
export function userChangeFailure(error: ApiError, action: "role" | "status") {
  if (error.status === 409 && OWNS_PROGRAMS.test(error.message)) {
    return "This owner still has programs. Delete or close them before you change the role.";
  }
  if (error.status === 409 && LAST_ADMIN.test(error.message)) {
    return "The platform needs at least one other active admin, so this account stays as it is.";
  }
  if (error.status === 409 && /your own account/i.test(error.message)) {
    return "You can't change your own account here.";
  }
  if (error.status === 409) {
    return "Someone changed this user while you had the page open. The list now shows where they stand.";
  }
  const what = action === "role" ? "change the role" : "change the status";
  return `We couldn't ${what}. ${error.userMessage}`;
}

/**
 * Role names on the users page. Comments call admins "Triage team" (ROLE_LABEL), but here
 * the admin is managing accounts, and the account type reads plainer.
 */
export const USER_ROLE_LABEL: Record<Role, string> = {
  RESEARCHER: "Researcher",
  PROGRAM_OWNER: "Program owner",
  ADMIN: "Admin",
};

export const ROLE_NOUN: Record<Role, string> = {
  RESEARCHER: "a researcher",
  PROGRAM_OWNER: "a program owner",
  ADMIN: "an admin",
};

/** What a role change means for the person, for the confirm step. */
export function roleChangeText(user: Pick<User, "name">, role: Role) {
  return `${user.name} becomes ${ROLE_NOUN[role]}. Their dashboard changes the next time they load a page.`;
}
