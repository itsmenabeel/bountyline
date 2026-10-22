import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { FOOTER_NAV, SITE_NAME } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.5fr_repeat(3,1fr)] md:px-6 lg:px-8">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 font-semibold">
            <LogoMark className="size-6" />
            {SITE_NAME}
          </div>
          <p className="max-w-xs text-sm text-muted-foreground">
            Companies fund a bounty pool, and researchers get paid from it for
            reports our triage team confirms.
          </p>
        </div>
        {FOOTER_NAV.map((group) => (
          <nav key={group.heading} aria-labelledby={`footer-${group.heading}`}>
            <h2
              id={`footer-${group.heading}`}
              className="font-mono text-xs font-medium tracking-wide text-muted-foreground uppercase"
            >
              {group.heading}
            </h2>
            <ul className="mt-3 flex flex-col gap-1">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-8 items-center rounded-sm text-sm outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/70 pointer-coarse:min-h-11"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t">
        <p className="mx-auto w-full max-w-6xl px-4 py-5 text-xs text-muted-foreground md:px-6 lg:px-8">
          © {SITE_NAME}. Payments run through Stripe in test mode, so no real
          card gets charged.
        </p>
      </div>
    </footer>
  );
}
