"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { SearchX, Users } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useSession } from "@/components/providers/session-provider";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import {
  ClearFiltersButton,
  FilterBar,
  type FilterOption,
  SearchFilter,
  SelectFilter,
} from "@/components/shared/filter-bar";
import { Money } from "@/components/shared/money";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { QueryError } from "@/components/shared/query-error";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { useListParams } from "@/hooks/use-list-params";
import { ACCOUNT_ROLE_LABEL } from "@/lib/constants/domain";
import { formatDate } from "@/lib/format";
import { hasActiveFilters } from "@/lib/list-params";
import { clientQuery } from "@/lib/query/descriptor";
import { ROLES, type Role, type User } from "@/types/api";
import {
  type UserSort,
  type UserStatusFilter,
  userListParams,
} from "../params";
import { userListQuery } from "../queries";
import { UserActions } from "./user-actions";

const ROLE_OPTIONS: FilterOption<Role>[] = ROLES.map((role) => ({
  value: role,
  label: ACCOUNT_ROLE_LABEL[role],
}));

const STATUS_OPTIONS: FilterOption<UserStatusFilter>[] = [
  { value: "active", label: "Active" },
  { value: "banned", label: "Banned" },
];

/**
 * Every account on the platform (design-plan §7.5): search by name or email, filter by
 * role and status, sort by name, email, reputation, or join date. Each row has a menu to
 * change the role or ban the user, except the admin's own row.
 */
export function UserTable() {
  const me = useSession();
  const { params, defaults, setParams } = useListParams(userListParams);
  const query = useQuery({
    ...clientQuery(userListQuery(params)),
    placeholderData: keepPreviousData,
  });
  const onSearch = useCallback(
    (search: string | undefined) => setParams({ search }),
    [setParams],
  );
  const filtered = hasActiveFilters(params, defaults);
  const clear = () =>
    setParams({ search: undefined, role: undefined, status: undefined });

  const columns = useMemo<DataTableColumn<User, UserSort>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        sortKey: "name",
        firstOrder: "asc",
        className: "min-w-44 max-w-64",
        cell: (user) => (
          <span className="font-medium text-pretty">
            {user.name}
            {user.id === me.id && (
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                (you)
              </span>
            )}
          </span>
        ),
      },
      {
        id: "email",
        header: "Email",
        sortKey: "email",
        firstOrder: "asc",
        className: "text-muted-foreground",
        cell: (user) => user.email,
      },
      {
        id: "role",
        header: "Role",
        className: "whitespace-nowrap",
        cell: (user) => ACCOUNT_ROLE_LABEL[user.role],
      },
      {
        id: "reputation",
        header: "Reputation",
        sortKey: "reputation",
        align: "end",
        cell: (user) => user.reputation.toLocaleString("en-US"),
      },
      {
        id: "wallet",
        header: "Wallet",
        align: "end",
        cell: (user) => (
          <Money
            cents={user.walletBalance}
            tone={user.walletBalance > 0 ? "money" : "plain"}
          />
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: (user) => (
          <StatusBadge
            kind="user"
            status={user.isActive ? "ACTIVE" : "BANNED"}
          />
        ),
      },
      {
        id: "joined",
        header: "Joined",
        sortKey: "createdAt",
        className: "whitespace-nowrap text-muted-foreground",
        cell: (user) => formatDate(user.createdAt),
      },
      {
        id: "actions",
        header: "Actions",
        cell: (user) => <UserActions user={user} isSelf={user.id === me.id} />,
      },
    ],
    [me.id],
  );

  return (
    <div className="flex flex-col gap-4">
      <FilterBar label="Filter users">
        <SearchFilter
          id="user-search"
          label="Search"
          placeholder="Name or email"
          value={params.search}
          onChange={onSearch}
        />
        <SelectFilter
          id="user-role"
          label="Role"
          allLabel="All roles"
          options={ROLE_OPTIONS}
          value={params.role}
          onChange={(role) => setParams({ role })}
        />
        <SelectFilter
          id="user-status"
          label="Status"
          allLabel="Active and banned"
          options={STATUS_OPTIONS}
          value={params.status}
          onChange={(status) => setParams({ status })}
        />
        <ClearFiltersButton visible={filtered} onClear={clear} />
      </FilterBar>

      {query.data ? (
        <>
          <DataTable
            columns={columns}
            data={query.data.items}
            getRowId={(user) => user.id}
            caption="Users"
            sort={{ sortBy: params.sortBy, order: params.order }}
            onSortChange={(sort) => setParams(sort)}
            stale={query.isPlaceholderData}
            empty={
              filtered ? (
                <EmptyState
                  icon={SearchX}
                  title="No users match these filters."
                  action={
                    <Button variant="outline" onClick={clear}>
                      Clear filters
                    </Button>
                  }
                />
              ) : (
                <EmptyState icon={Users} title="No users yet." />
              )
            }
          />
          <PaginationBar
            meta={query.data.meta}
            idPrefix="users"
            onPageChange={(page) => setParams({ page })}
            onLimitChange={(limit) => setParams({ limit })}
          />
        </>
      ) : query.isError ? (
        <QueryError
          title="We couldn't load users."
          error={query.error}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      ) : null}
    </div>
  );
}
