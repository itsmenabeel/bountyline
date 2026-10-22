import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function OwnerLayout({ children }: LayoutProps<"/owner">) {
  return <DashboardShell workspace="PROGRAM_OWNER">{children}</DashboardShell>;
}
