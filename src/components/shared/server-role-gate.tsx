import "server-only";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth/current-user";
import type { Role } from "@/types/api";

/** Server Component version of RoleGate. Render it inside a <Suspense> boundary. */
export async function ServerRoleGate({
  roles,
  children,
  fallback = null,
}: {
  roles: readonly Role[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { role } = await getCurrentUser();
  return roles.includes(role) ? children : fallback;
}
