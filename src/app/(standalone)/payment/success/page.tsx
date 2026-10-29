import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PaymentCard } from "@/features/payments/components/payment-card";
import { PaymentResult } from "@/features/payments/components/payment-result";
import { paymentEndpoints } from "@/features/payments/endpoints";
import { paymentDetailQuery } from "@/features/payments/queries";
import { serverRequest } from "@/lib/api/server";
import { HydrateClient, prefetch } from "@/lib/query/server";

export const metadata: Metadata = {
  title: "Payment",
  robots: { index: false },
};

// The backend's limit for the sessionId filter; a longer value would get a 422.
const SESSION_ID_MAX = 255;

function PaymentNotFound() {
  return (
    <PaymentCard
      icon={<SearchX aria-hidden="true" />}
      title="We couldn't find this payment"
      message="This link from Stripe doesn't match a payment on your programs. Your payments page lists each checkout you started."
      actions={
        <>
          <Button asChild size="lg">
            <Link href="/owner/payments">View payments</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/owner/programs">Go to programs</Link>
          </Button>
        </>
      }
    />
  );
}

/**
 * Stripe's return address after a checkout (implementation-plan §4.9). The backend appends
 * `session_id`, which finds the payment; the client card then verifies it while it's PENDING.
 */
export default async function PaymentSuccessPage({
  searchParams,
}: PageProps<"/payment/success">) {
  const raw = (await searchParams).session_id;
  const sessionId = typeof raw === "string" ? raw.trim() : "";
  if (!sessionId || sessionId.length > SESSION_ID_MAX) {
    return <PaymentNotFound />;
  }

  const {
    items: [payment],
  } = await serverRequest(
    paymentEndpoints.list({
      page: 1,
      limit: 1,
      sortBy: "createdAt",
      order: "desc",
      sessionId,
    }),
  );
  if (!payment) return <PaymentNotFound />;

  await prefetch(paymentDetailQuery(payment.id), async () => payment);
  return (
    <HydrateClient>
      <PaymentResult id={payment.id} />
    </HydrateClient>
  );
}
