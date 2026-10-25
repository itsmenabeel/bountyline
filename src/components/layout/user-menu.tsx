"use client";

import {
  ChevronDownIcon,
  LogOutIcon,
  SunMoonIcon,
  UserRoundIcon,
} from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { useSession } from "@/components/providers/session-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { logout } from "@/features/auth/actions";
import { initials } from "@/lib/format";
import { ROLE_WORKSPACES } from "@/lib/nav";
import { AppearanceRadioGroup } from "./appearance-menu";

/** Same footprint as the menu trigger, shown while /users/me loads. */
export function UserMenuSkeleton() {
  return (
    <div className="flex items-center gap-2 px-1.5" aria-hidden="true">
      <Skeleton className="size-7 rounded-full" />
      <Skeleton className="hidden h-4 w-24 sm:block" />
    </div>
  );
}

export function UserMenu() {
  const user = useSession();
  const [signingOut, startSignOut] = useTransition();
  const { profile } = ROLE_WORKSPACES[user.role];

  function signOut(event: Event) {
    // Keep the menu open so the pending label shows until the redirect lands.
    event.preventDefault();
    startSignOut(async () => {
      await logout();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-9 gap-2 px-1.5 pointer-coarse:h-11"
          aria-label={`Account menu for ${user.name}`}
        >
          <Avatar className="size-7">
            <AvatarFallback className="text-xs font-medium">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-40 truncate sm:inline">
            {user.name}
          </span>
          <ChevronDownIcon
            aria-hidden="true"
            className="text-muted-foreground"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
          <span className="truncate font-medium text-foreground">
            {user.name}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={profile}>
            <UserRoundIcon aria-hidden="true" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <SunMoonIcon aria-hidden="true" />
            Appearance
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-40">
            <AppearanceRadioGroup />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={signingOut} onSelect={signOut}>
          <LogOutIcon aria-hidden="true" />
          {signingOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
