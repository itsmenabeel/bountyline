"use client";

import type { ReactNode } from "react";
import { useSession } from "@/components/providers/session-provider";
import type { Role } from "@/types/api";

/**
 * Renders `children` only for the listed roles. It hides UI; the backend still decides what
 * each role may do. Needs a SessionProvider and a <Suspense> boundary above it.
 */
export function RoleGate({
  roles,
  children,
  fallback = null,
}: {
  roles: readonly Role[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { role } = useSession();
  return roles.includes(role) ? children : fallback;
}
