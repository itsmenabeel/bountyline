import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { AUTH_LINKS } from "@/lib/site";
import { NavLinkList, PublicMobileNav, PublicNavLinks } from "./public-nav";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4 md:px-6 lg:px-8">
        <Logo />
        <nav aria-label="Main" className="flex-1">
          <Suspense fallback={<NavLinkList />}>
            <PublicNavLinks />
          </Suspense>
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost">
            <Link href={AUTH_LINKS.signIn.href}>{AUTH_LINKS.signIn.label}</Link>
          </Button>
          <Button asChild>
            <Link href={AUTH_LINKS.signUp.href}>{AUTH_LINKS.signUp.label}</Link>
          </Button>
        </div>
        <PublicMobileNav />
      </div>
    </header>
  );
}
