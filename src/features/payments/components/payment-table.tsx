"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CreditCard, SearchX } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useMemo } from "react";
import { toast } from "sonner";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import {
  ClearFiltersButton,
  FilterBar,
  type FilterOption,
  SelectFilter,
} from "@/components/shared/filter-bar";
import { Money } from "@/components/shared/money";
import { LoadingFrame, TableSkeleton } from "@/components/shared/page-skeleton";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { PendingLabel } from "@/components/shared/pending-label";
import { QueryError } from "@/components/shared/query-error";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  type ListParamsState,
  useListParams,
  useLocalListParams,
} from "@/hooks/use-list-params";
import type { Paginated } from "@/lib/api/types";
import { PAYMENT_STATUS_LABEL } from "@/lib/constants/domain";
import { formatDate } from "@/lib/format";
import { hasActiveFilters } from "@/lib/list-params";
import { formatMoney } from "@/lib/money";
import { clientQuery, type QueryDescriptor } from "@/lib/query/descriptor";
import {
  PAYMENT_STATUSES,
  type Payment,
  type PaymentStatus,
  type Program,
} from "@/types/api";
import { type PaymentSort, paymentListParams } from "../params";
import { paymentListQuery } from "../queries";
import { useVerifyPayment } from "../use-verify-payment";
import { checkStatusMessage, verifyFailureMessage } from "../verify";

const STATUS_OPTIONS: FilterOption<PaymentStatus>[] = PAYMENT_STATUSES.map(
  (status) => ({ value: status, label: PAYMENT_STATUS_LABEL[status] }),
);

/** "Check status" on a PENDING row: asks Stripe now instead of waiting for its webhook. */
function CheckStatusButton({ payment }: { payment: Payment }) {
  const verify = useVerifyPayment();
  return (
    <Button
      variant="outline"
      size="sm"
      aria-label={`Check status of the ${formatMoney(payment.amount)} payment to ${payment.program.title}`}
      aria-disabled={verify.isPending || undefined}
      onClick={() => {
        if (verify.isPending) return;
        verify.mutate(payment.id, {
          onSuccess: (updated) => {
            const message = checkStatusMessage(updated);
            if (updated.status === "SUCCEEDED") toast.success(message);
            else if (updated.status === "FAILED") toast.error(message);
            else toast(message);
          },
          onError: (error) => toast.error(verifyFailureMessage(error)),
        });
      }}
    >
      {verify.isPending ? (
        <PendingLabel>Checking</PendingLabel>
      ) : (
        "Check status"
      )}
    </Button>
  );
}

function ProgramFilter({
  id,
  descriptor,
  value,
  onChange,
}: {
  id: string;
  descriptor: QueryDescriptor<Paginated<Program>>;
  value: string | undefined;
  onChange: (programId: string | undefined) => void;
}) {
  const programs = useQuery(clientQuery(descriptor));
  const options = useMemo<FilterOption[]>(
    () =>
      (programs.data?.items ?? []).map((program) => ({
        value: program.id,
        label: program.title,
      })),
    [programs.data],
  );
  return (
    <SelectFilter
      id={id}
      label="Program"
      allLabel="All programs"
      options={options}
      value={value}
      onChange={onChange}
    />
  );
}

export interface PaymentTableProps {
  /** Filter, sort, and page: from the URL on a page, from state inside a tab. */
  list: ListParamsState<typeof paymentListParams>;
  /** Fixes the list to one program and drops the program column and filter. */
  programId?: string;
  /** The programs to offer in the program filter. */
  programOptions?: QueryDescriptor<Paginated<Program>>;
  /** Program names link to `${programBasePath}/${id}`. */
  programBasePath: "/owner/programs" | "/admin/programs";
  /** Prefix for element ids, unique per page (Next keeps the last page in the DOM). */
  idPrefix: string;
  /** What an unfiltered, empty list says. */
  empty: { title: string; description: string; action?: ReactNode };
}

/**
 * Stripe payments as a table (design-plan §7.4, §7.5): program, amount, status, and date,
 * with a status filter and "Check status" on rows still PENDING.
 */
export function PaymentTable({
  list: { params, defaults, setParams },
  programId,
  programOptions,
  programBasePath,
  idPrefix,
  empty,
}: PaymentTableProps) {
  const fixedProgram = programId !== undefined;
  const query = useQuery({
    ...clientQuery(
      paymentListQuery(fixedProgram ? { ...params, programId } : params),
    ),
    placeholderData: keepPreviousData,
  });
  const filtered = hasActiveFilters(params, defaults);
  const clear = () => setParams({ status: undefined, programId: undefined });

  const columns = useMemo<DataTableColumn<Payment, PaymentSort>[]>(() => {
    const program: DataTableColumn<Payment, PaymentSort> = {
      id: "program",
      header: "Program",
      className: "min-w-48 max-w-80",
      cell: (payment) => (
        <Link
          href={`${programBasePath}/${payment.programId}`}
          className="touch-link font-medium text-pretty underline-offset-4 hover:underline"
        >
          {payment.program.title}
        </Link>
      ),
    };
    const rest: DataTableColumn<Payment, PaymentSort>[] = [
      {
        id: "amount",
        header: "Amount",
        sortKey: "amount",
        align: "end",
        cell: (payment) => (
          <Money
            cents={payment.amount}
            tone={payment.status === "SUCCEEDED" ? "money" : "plain"}
          />
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: (payment) => (
          <StatusBadge kind="payment" status={payment.status} />
        ),
      },
      {
        id: "started",
        header: "Started",
        sortKey: "createdAt",
        className: "whitespace-nowrap text-muted-foreground",
        cell: (payment) => formatDate(payment.createdAt),
      },
      {
        id: "action",
        header: "Stripe",
        cell: (payment) =>
          payment.status === "PENDING" ? (
            <CheckStatusButton payment={payment} />
          ) : null,
      },
    ];
    return fixedProgram ? rest : [program, ...rest];
  }, [fixedProgram, programBasePath]);

  return (
    <div className="flex flex-col gap-4">
      <FilterBar label="Filter payments">
        <SelectFilter
          id={`${idPrefix}-status`}
          label="Status"
          allLabel="All statuses"
          options={STATUS_OPTIONS}
          value={params.status}
          onChange={(status) => setParams({ status })}
        />
        {programOptions && !fixedProgram && (
          <ProgramFilter
            id={`${idPrefix}-program`}
            descriptor={programOptions}
            value={params.programId}
            onChange={(next) => setParams({ programId: next })}
          />
        )}
        <ClearFiltersButton visible={filtered} onClear={clear} />
      </FilterBar>

      {query.data ? (
        <>
          <DataTable
            columns={columns}
            data={query.data.items}
            getRowId={(payment) => payment.id}
            caption="Payments"
            sort={{ sortBy: params.sortBy, order: params.order }}
            onSortChange={(sort) => setParams(sort)}
            stale={query.isPlaceholderData}
            empty={
              filtered ? (
                <EmptyState
                  icon={SearchX}
                  title="No payments match these filters."
                  action={
                    <Button variant="outline" onClick={clear}>
                      Clear filters
                    </Button>
                  }
                />
              ) : (
                <EmptyState icon={CreditCard} {...empty} />
              )
            }
          />
          <PaginationBar
            meta={query.data.meta}
            idPrefix={idPrefix}
            onPageChange={(page) => setParams({ page })}
            onLimitChange={(limit) => setParams({ limit })}
          />
        </>
      ) : query.isError ? (
        <QueryError
          title="We couldn't load payments."
          error={query.error}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      ) : (
        <LoadingFrame>
          <TableSkeleton />
        </LoadingFrame>
      )}
    </div>
  );
}

/** A page's payment table, with its filter, sort, and page in the URL. */
export function PaymentList(
  props: Omit<PaymentTableProps, "list" | "programId">,
) {
  const list = useListParams(paymentListParams);
  return <PaymentTable list={list} {...props} />;
}

/** One program's payments, for a tab on its page (the page's URL holds `?tab=`). */
export function ProgramPayments(
  props: Omit<PaymentTableProps, "list" | "programOptions"> & {
    programId: string;
  },
) {
  const list = useLocalListParams(paymentListParams);
  return <PaymentTable list={list} {...props} />;
}
