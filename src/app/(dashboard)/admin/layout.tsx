import { RoleArea } from "@/components/layout/role-area";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <RoleArea workspace="ADMIN">{children}</RoleArea>;
}
