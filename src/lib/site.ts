// Site-wide names and navigation, shared by the header, footer, and metadata.

export const SITE_NAME = "Bountyline";
export const SITE_DESCRIPTION =
  "Bug reports, triaged and paid from one funded pool.";

export interface NavItem {
  label: string;
  href: `/${string}`;
}

/** Public header links. Four keeps the bar readable at tablet width. */
export const PUBLIC_NAV: NavItem[] = [
  { label: "Programs", href: "/programs" },
  { label: "How it works", href: "/how-it-works" },
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/faq" },
];

export const AUTH_LINKS = {
  signIn: { label: "Sign in", href: "/login" },
  signUp: { label: "Get started", href: "/register" },
  // Each role's home replaces this href once the role is known (components/layout/account-links.tsx).
  // Until then /login works: proxy.ts sends signed-in visitors on to their dashboard.
  dashboard: { label: "Go to dashboard", href: "/login" },
} as const satisfies Record<string, NavItem>;

export const FOOTER_NAV: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Platform",
    items: [
      { label: "Programs", href: "/programs" },
      { label: "How it works", href: "/how-it-works" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    heading: "Company",
    items: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

/** The footer's Account links for a signed-out visitor; signed-in ones get their dashboard. */
export const FOOTER_ACCOUNT_LINKS: NavItem[] = [
  { label: "Sign in", href: "/login" },
  { label: "Create an account", href: "/register" },
];

/** True when `pathname` is the link's page or a page below it. */
export function isActivePath(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}
