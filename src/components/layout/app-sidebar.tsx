"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { LogoMark } from "@/components/brand/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { isNavItemActive, ROLE_WORKSPACES } from "@/lib/nav";
import { SITE_NAME } from "@/lib/site";
import type { Role } from "@/types/api";

interface NavProps {
  workspace: Role;
  /** Undefined while the pathname is unknown (Suspense fallback): nothing is marked active. */
  pathname?: string;
}

function SidebarNav({ workspace, pathname }: NavProps) {
  const { isMobile, setOpenMobile } = useSidebar();
  const { nav } = ROLE_WORKSPACES[workspace];

  return nav.map((group) => (
    <SidebarGroup key={group.label ?? "main"}>
      {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {group.items.map((item) => {
            const active =
              pathname !== undefined && isNavItemActive(pathname, item);
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={item.label}
                  className="pointer-coarse:h-11"
                >
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => isMobile && setOpenMobile(false)}
                  >
                    <item.icon aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  ));
}

// usePathname suspends on routes with params unknown at build time (/admin/reports/[id]);
// the fallback renders the same nav without an active item.
function ActiveSidebarNav({ workspace }: { workspace: Role }) {
  return <SidebarNav workspace={workspace} pathname={usePathname()} />;
}

export function AppSidebar({ workspace }: { workspace: Role }) {
  const config = ROLE_WORKSPACES[workspace];

  return (
    <Sidebar collapsible="icon" aria-label={`${config.label} navigation`}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip={SITE_NAME}>
              <Link href={config.home}>
                <LogoMark className="size-8" />
                <span className="flex flex-col leading-tight">
                  <span className="font-semibold">{SITE_NAME}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {config.label}
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <Suspense fallback={<SidebarNav workspace={workspace} />}>
          <ActiveSidebarNav workspace={workspace} />
        </Suspense>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
