import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { PaymentList } from "@/features/payments/components/payment-table";
import { paymentListParams } from "@/features/payments/params";
import { paymentListQuery } from "@/features/payments/queries";
import { programOptionsQuery } from "@/features/programs/queries";
import { parseListParams } from "@/lib/list-params";
import { HydrateClient, prefetch } from "@/lib/query/server";

export const metadata: Metadata = { title: "Payments" };

export default async function AdminPaymentsPage({
  searchParams,
}: PageProps<"/admin/payments">) {
  const params = parseListParams(paymentListParams, await searchParams);
  const programOptions = programOptionsQuery();
  await Promise.all([
    prefetch(paymentListQuery(params)),
    prefetch(programOptions),
  ]);
  return (
    <>
      <PageHeader
        title="Payments"
        description="Every Stripe checkout owners started, newest first. Check status asks Stripe about a pending one now."
      />
      <HydrateClient>
        <PaymentList
          programOptions={programOptions}
          programBasePath="/admin/programs"
          idPrefix="admin-payments"
          empty={{
            title: "No payments yet.",
            description:
              "Payments show here once an owner funds a pool through Stripe.",
          }}
        />
      </HydrateClient>
    </>
  );
}
