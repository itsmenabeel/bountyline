import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * The one card on /payment/success and /payment/cancel (design-plan §6.1): an icon chip,
 * the page's h1 and sentence, optional facts, and the ways on. `live` announces a heading
 * that changes in place, as it does while the success page checks with Stripe.
 */
export function PaymentCard({
  icon,
  iconClassName = "bg-muted text-muted-foreground",
  title,
  message,
  live = false,
  children,
  actions,
}: {
  icon: ReactNode;
  iconClassName?: string;
  title: string;
  message: string;
  live?: boolean;
  children?: ReactNode;
  actions: ReactNode;
}) {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="flex flex-col gap-6">
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-lg [&_svg]:size-5",
            iconClassName,
          )}
        >
          {icon}
        </span>
        <div
          aria-live={live ? "polite" : undefined}
          className="flex flex-col gap-2"
        >
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{message}</p>
        </div>
        {children}
        <div className="flex flex-col gap-2 sm:flex-row">{actions}</div>
      </CardContent>
    </Card>
  );
}
