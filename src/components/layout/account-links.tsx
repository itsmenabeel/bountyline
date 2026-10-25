import { cookies } from "next/headers";
import Link from "next/link";
import { cache, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { SheetClose } from "@/components/ui/sheet";
import { readSessionCookies } from "@/lib/auth/cookies";
import { homeFor } from "@/lib/auth/roles";
import { verifyAccessToken } from "@/lib/auth/tokens";
import { serverEnv } from "@/lib/env/server";
import { AUTH_LINKS } from "@/lib/site";

type Variant = "bar" | "sheet";

/**
 * Where "Go to dashboard" points, or null when nobody is signed in. Only the cookies are
 * read, so public pages make no backend call. With an expired access token but a refresh
 * token, /login refreshes the session and forwards to the dashboard (proxy.ts).
 */
const dashboardHref = cache(async (): Promise<string | null> => {
  const { accessToken, refreshToken } = readSessionCookies(await cookies());
  const claims = accessToken
    ? await verifyAccessToken(accessToken, serverEnv.JWT_ACCESS_SECRET)
    : null;
  if (claims) return homeFor(claims.role);
  return refreshToken ? AUTH_LINKS.dashboard.href : null;
});

// In the mobile sheet each link also closes the sheet.
function SheetItem({
  variant,
  children,
}: {
  variant: Variant;
  children: ReactNode;
}) {
  return variant === "sheet" ? (
    <SheetClose asChild>{children}</SheetClose>
  ) : (
    children
  );
}

/** The signed-out pair. Also the Suspense fallback while the cookies are read. */
export function SignedOutLinks({ variant }: { variant: Variant }) {
  const size = variant === "sheet" ? "lg" : "default";
  return (
    <>
      <SheetItem variant={variant}>
        <Button
          asChild
          variant={variant === "sheet" ? "outline" : "ghost"}
          size={size}
        >
          <Link href={AUTH_LINKS.signIn.href}>{AUTH_LINKS.signIn.label}</Link>
        </Button>
      </SheetItem>
      <SheetItem variant={variant}>
        <Button asChild size={size}>
          <Link href={AUTH_LINKS.signUp.href}>{AUTH_LINKS.signUp.label}</Link>
        </Button>
      </SheetItem>
    </>
  );
}

export async function AccountLinks({ variant }: { variant: Variant }) {
  const href = await dashboardHref();
  if (!href) return <SignedOutLinks variant={variant} />;

  return (
    <SheetItem variant={variant}>
      <Button asChild size={variant === "sheet" ? "lg" : "default"}>
        <Link href={href} prefetch={false}>
          {AUTH_LINKS.dashboard.label}
        </Link>
      </Button>
    </SheetItem>
  );
}
