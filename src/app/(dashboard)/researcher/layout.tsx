import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function ResearcherLayout({
  children,
}: LayoutProps<"/researcher">) {
  return <DashboardShell workspace="RESEARCHER">{children}</DashboardShell>;
}
