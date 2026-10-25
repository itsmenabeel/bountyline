import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { AccountLinks, SignedOutLinks } from "./account-links";
import { NavLinkList, PublicMobileNav, PublicNavLinks } from "./public-nav";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 w-full max-w-page items-center gap-6 px-4 md:px-6 lg:px-8">
        <Logo />
        <nav aria-label="Main" className="flex-1">
          <Suspense fallback={<NavLinkList />}>
            <PublicNavLinks />
          </Suspense>
        </nav>
        {/* Reading the session cookies is request-time, so it streams in; the fallback is
            the signed-out pair, which keeps the header in the static shell. */}
        <div className="hidden items-center gap-2 md:flex">
          <Suspense fallback={<SignedOutLinks variant="bar" />}>
            <AccountLinks variant="bar" />
          </Suspense>
        </div>
        <PublicMobileNav
          account={
            <Suspense fallback={<SignedOutLinks variant="sheet" />}>
              <AccountLinks variant="sheet" />
            </Suspense>
          }
        />
      </div>
    </header>
  );
}
