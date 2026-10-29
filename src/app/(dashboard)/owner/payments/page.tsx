import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PaymentList } from "@/features/payments/components/payment-table";
import { paymentListParams } from "@/features/payments/params";
import { paymentListQuery } from "@/features/payments/queries";
import { ownerProgramOptionsQuery } from "@/features/programs/queries";
import { parseListParams } from "@/lib/list-params";
import { HydrateClient, prefetch } from "@/lib/query/server";

export const metadata: Metadata = { title: "Payments" };

export default async function OwnerPaymentsPage({
  searchParams,
}: PageProps<"/owner/payments">) {
  const params = parseListParams(paymentListParams, await searchParams);
  const programOptions = ownerProgramOptionsQuery();
  // The program filter's names load with the list, so a ?programId= link shows its program.
  await Promise.all([
    prefetch(paymentListQuery(params)),
    prefetch(programOptions),
  ]);
  return (
    <>
      <PageHeader
        title="Payments"
        description="Each Stripe checkout you started, newest first. A pending payment turns succeeded once Stripe confirms it; Check status asks Stripe now."
      />
      <HydrateClient>
        <PaymentList
          programOptions={programOptions}
          programBasePath="/owner/programs"
          idPrefix="owner-payments"
          empty={{
            title: "You haven't funded a program yet.",
            description:
              "Payments show here after you fund a pool from a program's page.",
            action: (
              <Button asChild>
                <Link href="/owner/programs">Go to programs</Link>
              </Button>
            ),
          }}
        />
      </HydrateClient>
    </>
  );
}
