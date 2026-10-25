import { redirect } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { SessionProvider } from "@/components/providers/session-provider";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { getCurrentUser } from "@/lib/auth/current-user";
import type { Role } from "@/types/api";
import { DashboardShell } from "./dashboard-shell";
import { UserMenu, UserMenuSkeleton } from "./user-menu";

/**
 * Creates the /users/me promise inside the caller's Suspense boundary and hands it down
 * unawaited, so nothing here blocks rendering (implementation-plan §4.11a).
 */
function WithSession({ children }: { children: ReactNode }) {
  return <SessionProvider user={getCurrentUser()}>{children}</SessionProvider>;
}

/**
 * proxy.ts checks the role in the access token, which can lag an admin's role change by up
 * to 15 minutes. This checks it against the database and leaves for /forbidden on a mismatch.
 * It renders nothing and runs beside the page, so the page's own data loads in parallel.
 */
async function RoleGuard({ workspace }: { workspace: Role }) {
  const user = await getCurrentUser();
  if (user.role !== workspace) redirect("/forbidden");
  return null;
}

/** The dashboard for one role: static shell first, then the session-dependent parts. */
export function RoleArea({
  workspace,
  children,
}: {
  workspace: Role;
  children: ReactNode;
}) {
  return (
    <DashboardShell
      workspace={workspace}
      userMenu={
        <Suspense fallback={<UserMenuSkeleton />}>
          <WithSession>
            <UserMenu />
          </WithSession>
        </Suspense>
      }
    >
      <Suspense fallback={null}>
        <RoleGuard workspace={workspace} />
      </Suspense>
      <Suspense fallback={<PageSkeleton />}>
        <WithSession>{children}</WithSession>
      </Suspense>
    </DashboardShell>
  );
}
