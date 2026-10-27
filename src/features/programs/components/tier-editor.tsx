"use client";

import {
  type Control,
  Controller,
  useFieldArray,
  useFormState,
  useWatch,
} from "react-hook-form";
import { SeverityBadge } from "@/components/shared/severity-badge";
import {
  FieldDescription,
  FieldError,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Switch } from "@/components/ui/switch";
import { SEVERITY_LABEL } from "@/lib/constants/domain";
import { describedBy } from "@/lib/forms";
import { formatDollars, parseDollarsToCents } from "@/lib/money";
import type { Severity } from "@/types/api";
import type { RewardTiersOutput, RewardTiersValues } from "../schemas";

export const tierInputId = (
  severity: Severity,
  part: "enabled" | "amount",
  idPrefix = "tier",
) => `${idPrefix}-${severity.toLowerCase()}-${part}`;

/**
 * Four severity rows, Low to Critical, each with a switch and a dollar amount (design-plan
 * §8). A switched-off row keeps its amount, so switching it back on restores it. Amounts
 * reformat on blur ("1500" becomes "1,500.00") once they parse. `locked` severities keep
 * their switch on: the settings page passes the saved tiers, which the backend can't remove.
 */
export function TierEditor({
  control,
  description,
  idPrefix = "tier",
  locked = [],
  disabled = false,
}: {
  control: Control<RewardTiersValues, unknown, RewardTiersOutput>;
  description: string;
  /** Ids are `${idPrefix}-<severity>-enabled|amount`; unique per page (see progress notes). */
  idPrefix?: string;
  locked?: readonly Severity[];
  disabled?: boolean;
}) {
  const { fields } = useFieldArray({ control, name: "tiers" });
  const rows = useWatch({ control, name: "tiers" });
  const { errors } = useFormState({ control, name: "tiers" });
  const listMessage = (errors.tiers?.root ?? errors.tiers)?.message;
  const helpId = `${idPrefix}-list-help`;
  const errorListId = `${idPrefix}-list-error`;

  return (
    <FieldSet disabled={disabled}>
      <FieldLegend variant="label">Reward per severity</FieldLegend>
      <FieldDescription id={helpId}>{description}</FieldDescription>
      <ul className="flex flex-col divide-y rounded-xl border bg-card">
        {fields.map((tier, index) => {
          const enabled = rows[index]?.enabled ?? tier.enabled;
          const label = SEVERITY_LABEL[tier.severity];
          const enabledId = tierInputId(tier.severity, "enabled", idPrefix);
          const amountId = tierInputId(tier.severity, "amount", idPrefix);
          const isLocked = locked.includes(tier.severity);
          return (
            <li
              key={tier.id}
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <Controller
                name={`tiers.${index}.enabled`}
                control={control}
                render={({ field }) => (
                  <label
                    htmlFor={enabledId}
                    className="flex min-h-9 items-center gap-3 pointer-coarse:min-h-11"
                  >
                    <Switch
                      id={enabledId}
                      ref={field.ref}
                      name={field.name}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      onBlur={field.onBlur}
                      disabled={isLocked || undefined}
                      aria-describedby={describedBy(
                        isLocked && helpId,
                        listMessage && errorListId,
                      )}
                    />
                    <SeverityBadge severity={tier.severity} />
                    {isLocked && (
                      <span className="text-xs text-muted-foreground">
                        Saved
                      </span>
                    )}
                  </label>
                )}
              />
              <Controller
                name={`tiers.${index}.amount`}
                control={control}
                render={({ field, fieldState }) => {
                  const errorId = `${amountId}-error`;
                  return (
                    <div className="flex flex-col gap-1.5 sm:w-48">
                      <InputGroup data-disabled={!enabled || undefined}>
                        <InputGroupAddon>
                          <InputGroupText>$</InputGroupText>
                        </InputGroupAddon>
                        <InputGroupInput
                          {...field}
                          id={amountId}
                          inputMode="decimal"
                          autoComplete="off"
                          disabled={!enabled}
                          aria-label={`${label} reward in dollars`}
                          aria-invalid={fieldState.invalid}
                          aria-describedby={describedBy(
                            fieldState.error && errorId,
                          )}
                          className="text-right tabular-nums"
                          onBlur={() => {
                            const cents = parseDollarsToCents(field.value);
                            if (cents !== null && cents > 0) {
                              field.onChange(formatDollars(cents));
                            }
                            field.onBlur();
                          }}
                        />
                      </InputGroup>
                      <FieldError id={errorId} errors={[fieldState.error]} />
                    </div>
                  );
                }}
              />
            </li>
          );
        })}
      </ul>
      <FieldError id={errorListId}>{listMessage}</FieldError>
    </FieldSet>
  );
}
