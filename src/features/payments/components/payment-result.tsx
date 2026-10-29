"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Ban,
  Check,
  Clock,
  type LucideIcon,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Money } from "@/components/shared/money";
import { PendingLabel } from "@/components/shared/pending-label";
import { QueryError } from "@/components/shared/query-error";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { programDetailQuery } from "@/features/programs/queries";
import type { ApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/format";
import { clientQuery } from "@/lib/query/descriptor";
import type { PaymentStatus } from "@/types/api";
import { paymentDetailQuery } from "../queries";
import { useVerifyPayment } from "../use-verify-payment";
import {
  paymentOutcome,
  VERIFY_DELAYS_MS,
  verifyFailureMessage,
} from "../verify";
import { PaymentCard } from "./payment-card";

const ICON: Record<PaymentStatus, { icon: LucideIcon; className?: string }> = {
  SUCCEEDED: { icon: Check, className: "bg-money-subtle text-money" },
  PENDING: { icon: Clock },
  FAILED: {
    icon: TriangleAlert,
    className: "bg-destructive/10 text-destructive dark:bg-destructive/20",
  },
  CANCELLED: { icon: Ban },
};

/**
 * The success page's card (design-plan §7.6). Stripe sends the owner back before its
 * webhook may have landed, so a PENDING payment gets verified three times with backoff
 * (2 s, 4 s, 8 s); after that the card says Stripe is still confirming and offers
 * "Check again". The payment comes from the cache the server page seeded.
 */
export function PaymentResult({ id }: { id: string }) {
  const query = useQuery(clientQuery(paymentDetailQuery(id)));
  const payment = query.data;
  const { mutate: verify, isPending: checking } = useVerifyPayment();
  const [tries, setTries] = useState(0);
  const [failure, setFailure] = useState<ApiError | null>(null);
  const polling =
    payment?.status === "PENDING" && tries < VERIFY_DELAYS_MS.length;

  const program = useQuery({
    ...clientQuery(programDetailQuery(payment?.programId ?? "")),
    enabled: payment?.status === "SUCCEEDED",
  });

  useEffect(() => {
    if (!polling) return;
    const timer = window.setTimeout(() => {
      verify(id, {
        onSuccess: () => setFailure(null),
        onError: setFailure,
        onSettled: () => setTries((count) => count + 1),
      });
    }, VERIFY_DELAYS_MS[tries]);
    return () => window.clearTimeout(timer);
  }, [polling, tries, verify, id]);

  if (!payment) {
    return query.isError ? (
      <div className="w-full max-w-md">
        <QueryError
          title="We couldn't load this payment."
          error={query.error}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      </div>
    ) : null;
  }

  const outcome = paymentOutcome(payment);
  const { icon: Icon, className: iconClassName } = ICON[payment.status];
  const succeeded = payment.status === "SUCCEEDED";
  const busy = polling || checking;

  return (
    <PaymentCard
      live
      icon={
        polling ? <Spinner aria-hidden="true" /> : <Icon aria-hidden="true" />
      }
      iconClassName={polling ? undefined : iconClassName}
      title={polling ? "Checking with Stripe" : outcome.title}
      message={
        polling
          ? "Stripe sent you back here. We're asking Stripe whether the payment went through."
          : outcome.message
      }
      actions={
        <>
          {payment.status === "PENDING" ? (
            <Button
              size="lg"
              aria-disabled={busy || undefined}
              onClick={() => {
                if (busy) return;
                verify(id, {
                  onSuccess: () => setFailure(null),
                  onError: setFailure,
                });
              }}
            >
              {busy ? (
                <PendingLabel>Checking</PendingLabel>
              ) : (
                <>
                  <RotateCcw aria-hidden="true" />
                  Check again
                </>
              )}
            </Button>
          ) : (
            <Button asChild size="lg">
              <Link href={`/owner/programs/${payment.programId}`}>
                Back to program
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" size="lg">
            <Link href="/owner/payments">View payments</Link>
          </Button>
        </>
      }
    >
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-lg border bg-muted/40 p-4 text-sm">
        <dt className="text-muted-foreground">Program</dt>
        <dd className="text-right font-medium text-pretty">
          {payment.program.title}
        </dd>
        <dt className="text-muted-foreground">Amount</dt>
        <dd className="text-right">
          <Money cents={payment.amount} tone={succeeded ? "money" : "plain"} />
        </dd>
        <dt className="text-muted-foreground">Status</dt>
        <dd className="flex justify-end">
          <StatusBadge kind="payment" status={payment.status} />
        </dd>
        {succeeded && (
          <>
            <dt className="text-muted-foreground">Pool now</dt>
            <dd className="flex justify-end">
              {program.data ? (
                <Money
                  cents={program.data.poolBalance}
                  tone="money"
                  className="font-semibold"
                />
              ) : program.isError ? (
                <span className="text-muted-foreground">
                  On the program page
                </span>
              ) : (
                <Skeleton className="h-5 w-24" />
              )}
            </dd>
          </>
        )}
        <dt className="text-muted-foreground">Started</dt>
        <dd className="text-right">{formatDate(payment.createdAt)}</dd>
      </dl>

      {failure && !polling && payment.status === "PENDING" && (
        <p role="alert" className="text-sm text-destructive">
          {verifyFailureMessage(failure)}
        </p>
      )}
    </PaymentCard>
  );
}
