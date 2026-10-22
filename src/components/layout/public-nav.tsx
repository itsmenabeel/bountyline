"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AUTH_LINKS, isActivePath, PUBLIC_NAV, SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";

// With Cache Components, usePathname suspends on routes whose params aren't known at
// build time (/programs/[id]). The header renders NavLinkList without an active item as
// the Suspense fallback, so the header itself stays in the static shell.

export function NavLinkList({ pathname }: { pathname?: string }) {
  return (
    <ul className="hidden items-center gap-1 md:flex">
      {PUBLIC_NAV.map((item) => {
        const active =
          pathname !== undefined && isActivePath(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-(--motion-fast) outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/70",
                active &&
                  "text-foreground after:absolute after:inset-x-3 after:-bottom-[13px] after:h-0.5 after:rounded-full after:bg-primary",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function PublicNavLinks() {
  return <NavLinkList pathname={usePathname()} />;
}

// Rendered only while the sheet is open, so its usePathname call never runs during prerender.
function MobileNavLinks() {
  const pathname = usePathname();

  return (
    <ul className="flex flex-col">
      {PUBLIC_NAV.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <li key={item.href}>
            <SheetClose asChild>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-12 items-center rounded-md px-3 text-base font-medium outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/70",
                  active && "bg-muted",
                )}
              >
                {item.label}
              </Link>
            </SheetClose>
          </li>
        );
      })}
    </ul>
  );
}

export function PublicMobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open menu"
        >
          <MenuIcon aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-xs">
        <SheetHeader>
          <SheetTitle>{SITE_NAME}</SheetTitle>
          <SheetDescription className="sr-only">
            Site navigation
          </SheetDescription>
        </SheetHeader>
        <nav aria-label="Main" className="px-4">
          <MobileNavLinks />
        </nav>
        <Separator />
        <div className="flex flex-col gap-2 px-4 pb-4">
          <SheetClose asChild>
            <Button asChild variant="outline" size="lg">
              <Link href={AUTH_LINKS.signIn.href}>
                {AUTH_LINKS.signIn.label}
              </Link>
            </Button>
          </SheetClose>
          <SheetClose asChild>
            <Button asChild size="lg">
              <Link href={AUTH_LINKS.signUp.href}>
                {AUTH_LINKS.signUp.label}
              </Link>
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
