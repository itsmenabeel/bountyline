import {
  Coins,
  CreditCard,
  FileText,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  type LucideIcon,
  Radar,
  ScanSearch,
  ScrollText,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import type { Role } from "@/types/api";

// Dashboard navigation per role (design-plan §6.3). Two levels at most; group labels only
// where a role has enough destinations to need them.

export interface DashboardNavItem {
  label: string;
  href: `/${string}`;
  icon: LucideIcon;
  /** Match only this exact path, so an overview link isn't active on every page below it. */
  exact?: boolean;
}

export interface DashboardNavGroup {
  label?: string;
  items: DashboardNavItem[];
}

export interface RoleWorkspace {
  /** Shown under the logo in the sidebar. */
  label: string;
  home: `/${string}`;
  profile: `/${string}`;
  nav: DashboardNavGroup[];
}

export const ROLE_WORKSPACES: Record<Role, RoleWorkspace> = {
  RESEARCHER: {
    label: "Researcher",
    home: "/researcher",
    profile: "/researcher/profile",
    nav: [
      {
        items: [
          {
            label: "Overview",
            href: "/researcher",
            icon: LayoutDashboard,
            exact: true,
          },
          { label: "Programs", href: "/researcher/programs", icon: Radar },
          { label: "My reports", href: "/researcher/reports", icon: FileText },
          { label: "Earnings", href: "/researcher/earnings", icon: Wallet },
          { label: "Profile", href: "/researcher/profile", icon: UserRound },
        ],
      },
    ],
  },
  PROGRAM_OWNER: {
    label: "Program owner",
    home: "/owner",
    profile: "/owner/profile",
    nav: [
      {
        items: [
          {
            label: "Overview",
            href: "/owner",
            icon: LayoutDashboard,
            exact: true,
          },
          { label: "Programs", href: "/owner/programs", icon: FolderKanban },
          { label: "Reports", href: "/owner/reports", icon: Inbox },
          { label: "Payments", href: "/owner/payments", icon: CreditCard },
          { label: "Profile", href: "/owner/profile", icon: UserRound },
        ],
      },
    ],
  },
  ADMIN: {
    label: "Admin",
    home: "/admin",
    profile: "/admin/profile",
    nav: [
      {
        items: [
          {
            label: "Overview",
            href: "/admin",
            icon: LayoutDashboard,
            exact: true,
          },
        ],
      },
      {
        label: "Triage",
        items: [
          { label: "Queue", href: "/admin/reports", icon: ScanSearch },
          { label: "Programs", href: "/admin/programs", icon: FolderKanban },
        ],
      },
      {
        label: "People",
        items: [{ label: "Users", href: "/admin/users", icon: Users }],
      },
      {
        label: "Money",
        items: [
          { label: "Payments", href: "/admin/payments", icon: CreditCard },
          { label: "Payouts", href: "/admin/payouts", icon: Coins },
        ],
      },
      {
        label: "Records",
        items: [
          { label: "Audit log", href: "/admin/audit-logs", icon: ScrollText },
        ],
      },
    ],
  },
};

export function isNavItemActive(pathname: string, item: DashboardNavItem) {
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}
