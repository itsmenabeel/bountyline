"use client";

import { createContext, type ReactNode, use } from "react";
import type { User } from "@/types/api";

// The server passes the /users/me promise without awaiting it, so the shell renders first
// and each reader suspends on its own (authentication-with-cache-components guide, step 3).
const SessionContext = createContext<Promise<User> | null>(null);

export function SessionProvider({
  user,
  children,
}: {
  user: Promise<User>;
  children: ReactNode;
}) {
  return <SessionContext value={user}>{children}</SessionContext>;
}

/** The signed-in user. Suspends until /users/me answers, so render it inside <Suspense>. */
export function useSession(): User {
  const user = use(SessionContext);
  if (!user) throw new Error("useSession needs a SessionProvider above it.");
  return use(user);
}
