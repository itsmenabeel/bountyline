"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Coins } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { payoutKeys } from "@/features/payouts/queries";
import { programKeys } from "@/features/programs/queries";
import { clientRequest } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import { formatMoney } from "@/lib/money";
import type { Cents, Report } from "@/types/api";
import { reportEndpoints } from "../endpoints";
import {
  payoutConfirmText,
  payoutDoneText,
  payoutPlan,
  rewardFailureMessage,
} from "../payout";
import { reportKeys } from "../queries";

/**
 * "Pay $1,500.00 from pool" on an accepted report (design-plan §7.5). Money moves only after
 * a confirm that names the researcher, the amount, and the pool after. A pool too small for
 * the tier disables the button; `describedById` points at the line that says why.
 */
export function PayoutAction({
  report,
  amount,
  poolBalance,
  describedById,
}: {
  report: Pick<Report, "id" | "programId" | "program" | "researcher">;
  amount: Cents;
  poolBalance: Cents;
  describedById: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { covered, poolAfter } = payoutPlan({ amount, poolBalance });
  const parties = {
    researcher: report.researcher.name,
    program: report.program.title,
    amount,
  };
  const label = `Pay ${formatMoney(amount)} from pool`;

  const pay = useMutation({
    mutationFn: () => clientRequest(reportEndpoints.reward(report.id)),
    meta: { silentToast: true },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: reportKeys.all });
      void queryClient.invalidateQueries({
        queryKey: programKeys.detail(report.programId),
      });
      void queryClient.invalidateQueries({ queryKey: programKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: payoutKeys.all });
    },
  });

  async function confirm() {
    try {
      const result = await pay.mutateAsync();
      toast.success(
        payoutDoneText({
          ...parties,
          amount: result.payout.amount,
          poolBalance: result.program.poolBalance,
        }),
      );
    } catch (error) {
      const apiError = toApiError(error);
      toast.error(rewardFailureMessage(apiError));
      // A 409 means the page is out of date (pool spent, report already paid): close the
      // dialog and show the current state. Anything else leaves it open for a retry.
      if (apiError.status !== 409) throw apiError;
    }
    // The track, badges, and this panel come from the server render.
    router.refresh();
  }

  if (!covered) {
    return (
      <Button disabled aria-describedby={describedById} className="w-full">
        <Coins aria-hidden="true" />
        {label}
      </Button>
    );
  }

  return (
    <ConfirmDialog
      trigger={
        <Button aria-describedby={describedById} className="w-full">
          <Coins aria-hidden="true" />
          {label}
        </Button>
      }
      title="Pay this report?"
      description={payoutConfirmText({ ...parties, poolAfter })}
      confirmLabel={`Pay ${formatMoney(amount)}`}
      pendingLabel="Paying"
      onConfirm={confirm}
    />
  );
}
