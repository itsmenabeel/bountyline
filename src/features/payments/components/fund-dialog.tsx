"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { BanknoteArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { type Failure, FailureAlert } from "@/components/shared/failure-alert";
import { PendingLabel } from "@/components/shared/pending-label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { coverageText, poolCoverage } from "@/features/programs/pool-coverage";
import { clientRequest } from "@/lib/api/client";
import type { ApiError } from "@/lib/api/errors";
import { describedBy } from "@/lib/forms";
import { formatDollars, formatMoney, parseDollarsToCents } from "@/lib/money";
import type { Cents, Program } from "@/types/api";
import { paymentEndpoints } from "../endpoints";
import {
  FUNDING_AMOUNT,
  FUNDING_QUICK_PICKS,
  type FundPoolOutput,
  type FundPoolValues,
  fundingCents,
  fundPoolSchema,
} from "../schemas";

/** "$1,500" for a quick pick: whole dollars read faster on a button. */
const wholeDollars = (cents: Cents) => formatMoney(cents).replace(/\.00$/, "");

function checkoutFailureMessage(error: ApiError) {
  if (error.status === 409) {
    return "This program is closed now, so it can't take new funds. Reload the page to see its current status.";
  }
  if (error.status === 502) {
    return "Stripe isn't answering right now, and nothing was charged. Try again in a minute.";
  }
  return `We couldn't open Stripe. ${error.userMessage}`;
}

/**
 * "Fund pool" (implementation-plan §4.9): the owner picks an amount, the backend opens a
 * Stripe Checkout session, and the browser leaves for Stripe's page. The pool grows once
 * Stripe confirms the payment; the success page (step 26) shows that.
 */
export function FundDialog({ program }: { program: Program }) {
  const [open, setOpen] = useState(false);
  // Set once Stripe's URL is in hand: the page is about to unload, so the dialog stays busy.
  const [leaving, setLeaving] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const attempts = useRef(0);
  const form = useForm<FundPoolValues, unknown, FundPoolOutput>({
    resolver: zodResolver(fundPoolSchema),
    mode: "onTouched",
    defaultValues: { amount: "" },
  });
  const typed = useWatch({ control: form.control, name: "amount" });
  const adding = fundingCents(typed);
  const after = program.poolBalance + (adding ?? 0);

  const checkout = useMutation({
    mutationFn: (amount: Cents) =>
      clientRequest(
        paymentEndpoints.checkout({ programId: program.id, amount }),
      ),
    meta: { silentToast: true },
    onSuccess: ({ checkoutUrl }) => {
      setLeaving(true);
      window.location.assign(checkoutUrl);
    },
    onError: (error) => {
      const message = error.fieldErrors.amount;
      if (message) form.setError("amount", { message });
      attempts.current += 1;
      setFailure({
        message: checkoutFailureMessage(error),
        attempt: attempts.current,
      });
    },
  });
  const busy = checkout.isPending || leaving;

  // Back from Stripe with the browser's back button, a page restored from the back/forward
  // cache would still say it's opening Stripe.
  const { reset: resetCheckout } = checkout;
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      setLeaving(false);
      resetCheckout();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [resetCheckout]);

  function changeOpen(next: boolean) {
    if (busy) return;
    if (next) {
      form.reset({ amount: "" });
      setFailure(null);
    }
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full">
          <BanknoteArrowUp aria-hidden="true" />
          Fund pool
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" showCloseButton={!busy}>
        <form
          noValidate
          onSubmit={form.handleSubmit(({ amount }) => {
            if (busy) return;
            setFailure(null);
            checkout.mutate(amount);
          })}
          className="flex flex-col gap-5"
        >
          <DialogHeader>
            <DialogTitle>Fund {program.title}</DialogTitle>
            <DialogDescription>
              Researchers get paid from this pool when the triage team accepts
              their reports.
            </DialogDescription>
          </DialogHeader>

          <Controller
            name="amount"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="fund-amount">Amount to add</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>$</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    {...field}
                    id="fund-amount"
                    inputMode="decimal"
                    autoComplete="off"
                    readOnly={busy}
                    aria-invalid={fieldState.invalid}
                    aria-describedby={describedBy(
                      "fund-amount-help",
                      fieldState.error && "fund-amount-error",
                    )}
                    className="tabular-nums"
                    onBlur={() => {
                      const cents = parseDollarsToCents(field.value);
                      if (cents !== null && cents > 0) {
                        field.onChange(formatDollars(cents));
                      }
                      field.onBlur();
                    }}
                  />
                </InputGroup>
                <FieldDescription id="fund-amount-help">
                  Add {formatMoney(FUNDING_AMOUNT.min)} to{" "}
                  {formatMoney(FUNDING_AMOUNT.max)} in one payment.
                </FieldDescription>
                <FieldError
                  id="fund-amount-error"
                  errors={[fieldState.error]}
                />
              </Field>
            )}
          />

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm text-muted-foreground">
              Common amounts
            </legend>
            <div className="flex flex-wrap gap-2">
              {FUNDING_QUICK_PICKS.map((cents) => (
                <Button
                  key={cents}
                  type="button"
                  variant="outline"
                  aria-pressed={adding === cents}
                  disabled={busy}
                  className="tabular-nums aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-primary dark:aria-pressed:border-primary dark:aria-pressed:bg-primary/20"
                  onClick={() =>
                    form.setValue("amount", formatDollars(cents), {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    })
                  }
                >
                  {wholeDollars(cents)}
                </Button>
              ))}
            </div>
          </fieldset>

          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 rounded-lg border bg-muted/40 p-4 text-sm">
            <dt className="text-muted-foreground">Pool now</dt>
            <dd className="text-right tabular-nums">
              {formatMoney(program.poolBalance)}
            </dd>
            <dt className="font-medium">After this payment</dt>
            <dd className="text-right font-semibold tabular-nums text-money">
              {formatMoney(after)}
            </dd>
            <dd className="col-span-2 text-muted-foreground">
              {coverageText(
                poolCoverage({
                  poolBalance: after,
                  rewardTiers: program.rewardTiers,
                }),
              )}
            </dd>
          </dl>

          <p className="text-sm text-muted-foreground">
            Stripe handles your card details on its own page, and the pool grows
            once Stripe confirms the payment. This is test mode: pay with card
            4242 4242 4242 4242, any future date, and any CVC.
          </p>

          {failure && <FailureAlert failure={failure} />}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={busy}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" aria-disabled={busy || undefined}>
              {busy ? (
                <PendingLabel>Opening Stripe</PendingLabel>
              ) : (
                "Continue to Stripe"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
