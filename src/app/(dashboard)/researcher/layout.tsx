import { RoleArea } from "@/components/layout/role-area";

export default function ResearcherLayout({
  children,
}: LayoutProps<"/researcher">) {
  return <RoleArea workspace="RESEARCHER">{children}</RoleArea>;
}
