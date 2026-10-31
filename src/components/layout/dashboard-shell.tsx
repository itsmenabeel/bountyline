"use client";

import { type ReactNode, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ROLE_WORKSPACES } from "@/lib/nav";
import { useUiStore } from "@/stores/ui-store";
import type { Role } from "@/types/api";
import { AppSidebar } from "./app-sidebar";

/**
 * Sidebar (lg and up) or drawer (below lg), a top bar, and the page in <main>.
 * Client because the sidebar's open state lives in the persisted UI store. Pages arrive as
 * children, so they stay Server Components.
 */
export function DashboardShell({
  workspace,
  userMenu,
  children,
}: {
  workspace: Role;
  /** Streams in behind its own Suspense boundary; the rest of the shell is static. */
  userMenu: ReactNode;
  children: ReactNode;
}) {
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);

  useEffect(() => {
    void useUiStore.persist.rehydrate();
  }, []);

  return (
    // Every tooltip lives in the dashboard, so public pages don't load the tooltip code.
    <TooltipProvider>
      <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <AppSidebar workspace={workspace} />
        <SidebarInset>
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-1 data-vertical:h-5 data-vertical:self-center"
            />
            <span className="font-mono text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {ROLE_WORKSPACES[workspace].label}
            </span>
            <div className="ml-auto flex items-center gap-1">{userMenu}</div>
          </header>
          <main
            id="main-content"
            tabIndex={-1}
            className="mx-auto flex w-full max-w-dashboard flex-1 flex-col gap-6 px-4 py-6 outline-none md:px-6 lg:px-8"
          >
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
