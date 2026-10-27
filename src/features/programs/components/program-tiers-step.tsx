"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ErrorSummary } from "@/components/shared/error-summary";
import { WizardActions } from "@/components/shared/wizard-shell";
import { Button } from "@/components/ui/button";
import { type ErrorTarget, useErrorSummary } from "@/hooks/use-error-summary";
import { SEVERITY_LABEL } from "@/lib/constants/domain";
import { formatMoney } from "@/lib/money";
import { SEVERITIES } from "@/types/api";
import {
  type RewardTiersValues,
  rewardTiersSchema,
  TIER_AMOUNT,
} from "../schemas";
import { TierEditor, tierInputId } from "./tier-editor";
import { useDraftSync, type WizardStepProps } from "./wizard-step";

const target: ErrorTarget = (path) => {
  const severity = SEVERITIES[Number(path.split(".")[1])];
  // "tiers" or "tiers.root" is the list's own error ("turn at least one on").
  return severity
    ? {
        id: tierInputId(severity, "amount"),
        label: `${SEVERITY_LABEL[severity]} reward`,
      }
    : { id: tierInputId("LOW", "enabled"), label: "Reward tiers" };
};

export function ProgramTiersStep({
  values,
  onChange,
  onContinue,
  onBack,
}: WizardStepProps<RewardTiersValues>) {
  const form = useForm({
    resolver: zodResolver(rewardTiersSchema),
    mode: "onTouched",
    shouldFocusError: false,
    defaultValues: values,
  });
  useDraftSync(form, onChange);
  const summary = useErrorSummary(form, target);

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(onContinue, summary.onInvalid)}
      className="flex flex-col gap-6"
    >
      {summary.errors.length > 0 && (
        <ErrorSummary errors={summary.errors} attempt={summary.attempt} />
      )}
      <TierEditor
        control={form.control}
        description={`Turn off any severity this program doesn't pay for. A higher severity can't pay less than a lower one, and each reward tops out at ${formatMoney(TIER_AMOUNT.max)}.`}
      />
      <WizardActions onBack={onBack}>
        <Button type="submit" size="lg">
          Review program
        </Button>
      </WizardActions>
    </form>
  );
}
