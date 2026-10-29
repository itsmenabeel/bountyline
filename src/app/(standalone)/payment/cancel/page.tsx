import { Ban } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PaymentCard } from "@/features/payments/components/payment-card";

export const metadata: Metadata = {
  title: "Checkout cancelled",
  robots: { index: false },
};

/**
 * Stripe's cancel address. It carries no session or program id (implementation-plan §3.5),
 * so the page links to Programs and Payments instead of naming the program.
 */
export default function PaymentCancelPage() {
  return (
    <PaymentCard
      icon={<Ban aria-hidden="true" />}
      title="Checkout cancelled"
      message="Stripe didn't charge your card, and your pool stays as it was."
      actions={
        <>
          <Button asChild size="lg">
            <Link href="/owner/programs">Go to programs</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/owner/payments">View payments</Link>
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">
        Payments lists this checkout as pending until Stripe closes the session,
        within 24 hours. You can start a new one from the program page.
      </p>
    </PaymentCard>
  );
}
