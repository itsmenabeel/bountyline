import { RoleArea } from "@/components/layout/role-area";

export default function OwnerLayout({ children }: LayoutProps<"/owner">) {
  return <RoleArea workspace="PROGRAM_OWNER">{children}</RoleArea>;
}
