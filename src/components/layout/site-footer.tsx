import Link from "next/link";
import { Suspense } from "react";
import { LogoMark } from "@/components/brand/logo";
import {
  AUTH_LINKS,
  FOOTER_ACCOUNT_LINKS,
  FOOTER_NAV,
  type NavItem,
  SITE_NAME,
} from "@/lib/site";
import { dashboardHref } from "./account-links";

function FooterGroup({
  heading,
  items,
}: {
  heading: string;
  items: readonly NavItem[];
}) {
  return (
    <nav aria-labelledby={`footer-${heading}`}>
      <h2
        id={`footer-${heading}`}
        className="font-mono text-xs font-medium tracking-wide text-muted-foreground uppercase"
      >
        {heading}
      </h2>
      <ul className="mt-3 flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              prefetch={item.href === "/login" ? false : undefined}
              className="inline-flex min-h-8 items-center rounded-sm text-sm outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/70 pointer-coarse:min-h-11"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Sign-in links for visitors, the dashboard for a signed-in one (cookies only, like the header). */
async function AccountGroup() {
  const href = await dashboardHref();
  return (
    <FooterGroup
      heading="Account"
      items={
        href
          ? [{ label: AUTH_LINKS.dashboard.label, href: href as `/${string}` }]
          : FOOTER_ACCOUNT_LINKS
      }
    />
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto grid w-full max-w-page gap-10 px-4 py-12 md:grid-cols-[1.5fr_repeat(3,1fr)] md:px-6 lg:px-8">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 font-semibold">
            <LogoMark className="size-6" />
            {SITE_NAME}
          </div>
          <p className="max-w-xs text-sm text-muted-foreground">
            Organizations fund a bounty pool, and researchers get paid from it
            for reports our triage team confirms.
          </p>
        </div>
        {FOOTER_NAV.map((group) => (
          <FooterGroup
            key={group.heading}
            heading={group.heading}
            items={group.items}
          />
        ))}
        <Suspense
          fallback={
            <FooterGroup heading="Account" items={FOOTER_ACCOUNT_LINKS} />
          }
        >
          <AccountGroup />
        </Suspense>
      </div>
      <div className="border-t">
        <p className="mx-auto w-full max-w-page px-4 py-5 text-xs text-muted-foreground md:px-6 lg:px-8">
          © {SITE_NAME}. Payments run through Stripe in test mode, so no real
          card gets charged.
        </p>
      </div>
    </footer>
  );
}
