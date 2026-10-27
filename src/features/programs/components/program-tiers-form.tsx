"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ErrorSummary } from "@/components/shared/error-summary";
import { type Failure, FailureAlert } from "@/components/shared/failure-alert";
import { PendingLabel } from "@/components/shared/pending-label";
import { Button } from "@/components/ui/button";
import { type ErrorTarget, useErrorSummary } from "@/hooks/use-error-summary";
import { clientRequest } from "@/lib/api/client";
import { SEVERITY_LABEL } from "@/lib/constants/domain";
import { formatDollars } from "@/lib/money";
import { type Program, type RewardTier, SEVERITIES } from "@/types/api";
import { programEndpoints } from "../endpoints";
import { saveFailureMessage } from "../save-failure";
import {
  type RewardTiersOutput,
  type RewardTiersValues,
  rewardTiersSchema,
} from "../schemas";
import { useSavedProgram } from "../use-saved-program";
import { SettingsActions } from "./settings-section";
import { TierEditor, tierInputId } from "./tier-editor";

const ID_PREFIX = "settings-tier";

const target: ErrorTarget = (path) => {
  const severity = SEVERITIES[Number(path.split(".")[1])];
  return severity
    ? {
        id: tierInputId(severity, "amount", ID_PREFIX),
        label: `${SEVERITY_LABEL[severity]} reward`,
      }
    : { id: tierInputId("LOW", "enabled", ID_PREFIX), label: "Reward tiers" };
};

/** Saved tiers switched on with their amounts; the rest off and empty. */
function toValues(tiers: RewardTier[]): RewardTiersValues {
  return {
    tiers: SEVERITIES.map((severity) => {
      const saved = tiers.find((tier) => tier.severity === severity);
      return {
        severity,
        enabled: Boolean(saved),
        amount: saved ? formatDollars(saved.amount) : "",
      };
    }),
  };
}

/**
 * The reward tiers. A saved tier can't be switched off (decided 2026-10-27): the backend
 * only adds or updates tiers, and a payout reads its tier at the moment of payment, so a
 * removed tier would leave accepted reports at that severity unpayable.
 */
export function ProgramTiersForm({ program }: { program: Program }) {
  const saved = useSavedProgram();
  const [failure, setFailure] = useState<Failure | null>(null);
  const attempts = useRef(0);
  const form = useForm({
    resolver: zodResolver(rewardTiersSchema),
    mode: "onTouched",
    shouldFocusError: false,
    defaultValues: toValues(program.rewardTiers),
  });
  const summary = useErrorSummary(form, target);
  const locked = program.rewardTiers.map((tier) => tier.severity);

  const save = useMutation({
    mutationFn: ({ tiers }: RewardTiersOutput) =>
      clientRequest(programEndpoints.setRewardTiers(program.id, tiers)),
    meta: { silentToast: true },
    onSuccess: (updated) => {
      saved(updated);
      form.reset(toValues(updated.rewardTiers));
      toast.success("Reward tiers saved");
    },
    onError: (error) => {
      attempts.current += 1;
      setFailure({
        message: saveFailureMessage(error),
        attempt: attempts.current,
      });
    },
  });

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) => {
        if (save.isPending) return;
        setFailure(null);
        save.mutate(values);
      }, summary.onInvalid)}
      className="flex flex-col gap-5"
    >
      {summary.errors.length > 0 && (
        <ErrorSummary errors={summary.errors} attempt={summary.attempt} />
      )}
      <TierEditor
        control={form.control}
        idPrefix={ID_PREFIX}
        locked={locked}
        description={
          locked.length > 0
            ? "Saved tiers stay on: the triage team pays each report at its tier's amount on the day they pay it, so removing a tier would leave accepted reports at that severity unpaid. You can change any amount, and a new amount applies to accepted reports not yet paid."
            : "Turn on each severity this program pays for. A higher severity can't pay less than a lower one."
        }
      />
      {failure && <FailureAlert failure={failure} />}
      <SettingsActions>
        <Button
          type="submit"
          size="lg"
          aria-disabled={save.isPending || undefined}
        >
          {save.isPending ? (
            <PendingLabel>Saving</PendingLabel>
          ) : (
            "Save reward tiers"
          )}
        </Button>
      </SettingsActions>
    </form>
  );
}
