import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { UserTable } from "@/features/admin/components/user-table";
import { userListParams } from "@/features/admin/params";
import { userListQuery } from "@/features/admin/queries";
import { parseListParams } from "@/lib/list-params";
import { HydrateClient, prefetch } from "@/lib/query/server";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage({
  searchParams,
}: PageProps<"/admin/users">) {
  const params = parseListParams(userListParams, await searchParams);
  await prefetch(userListQuery(params));
  return (
    <>
      <PageHeader
        title="Users"
        description="Every account on the platform. Change a role, or ban someone who breaks the rules."
      />
      <HydrateClient>
        <UserTable />
      </HydrateClient>
    </>
  );
}
