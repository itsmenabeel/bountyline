import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <DashboardShell workspace="ADMIN">{children}</DashboardShell>;
}
