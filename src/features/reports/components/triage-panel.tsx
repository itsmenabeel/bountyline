"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { type Failure, FailureAlert } from "@/components/shared/failure-alert";
import { Money } from "@/components/shared/money";
import { PendingLabel } from "@/components/shared/pending-label";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { clientRequest } from "@/lib/api/client";
import type { ApiError } from "@/lib/api/errors";
import {
  REPORT_STATUS_LABEL,
  SEVERITY_LABEL,
  type TriageTarget,
  triageTargets,
} from "@/lib/constants/domain";
import { formatMoney } from "@/lib/money";
import type { Cents, Program, Report, Severity } from "@/types/api";
import { reportEndpoints } from "../endpoints";
import { reportKeys } from "../queries";
import {
  TRIAGE_NOTE,
  type TriageInput,
  toTriageRequest,
  triageSchema,
} from "../schemas";
import { DuplicatePicker } from "./duplicate-picker";

type PanelProgram = Pick<Program, "poolBalance" | "rewardTiers">;

const FIELDS = ["status", "severity", "duplicateOfId", "note"] as const;

/** What each move means, in the words of the person making it. */
function describeTarget(target: TriageTarget, from: Report["status"]) {
  switch (target) {
    case "TRIAGING":
      return from === "NEEDS_INFO"
        ? "Carry on without waiting for the researcher's reply."
        : "You're picking it up for review.";
    case "NEEDS_INFO":
      return "Ask the researcher for detail you need to decide.";
    case "ACCEPTED":
      return "Valid and in scope. Choose the severity it pays at.";
    case "REJECTED":
      return "Out of scope, not reproducible, or not a security issue.";
    case "DUPLICATE":
      return "Another report in this program found it first.";
  }
}

const SUBMIT_LABEL: Record<TriageTarget, string> = {
  TRIAGING: "Move to triage",
  NEEDS_INFO: "Ask for more info",
  ACCEPTED: "Accept report",
  REJECTED: "Reject report",
  DUPLICATE: "Mark as duplicate",
};

const DONE_TOAST: Record<TriageTarget, string> = {
  TRIAGING: "Report moved to triage",
  NEEDS_INFO: "Asked the researcher for more info",
  ACCEPTED: "Report accepted",
  REJECTED: "Report rejected",
  DUPLICATE: "Report marked as duplicate",
};

function failureMessage(error: ApiError) {
  if (error.status === 409 && /changed|Cannot change/i.test(error.message)) {
    return "Someone changed this report while you had it open. Reload the page to see where it stands.";
  }
  return error.userMessage;
}

const describedBy = (...ids: (string | false | undefined)[]) =>
  ids.filter(Boolean).join(" ") || undefined;

/** The pool line under the severity: what accepting commits the program to pay. */
function PayoutPreview({
  amount,
  poolBalance,
}: {
  amount: Cents;
  poolBalance: Cents;
}) {
  const short = amount - poolBalance;
  return (
    <p className="text-sm text-muted-foreground">
      Pays <Money cents={amount} tone="money" />. The pool holds{" "}
      <Money cents={poolBalance} />
      {short > 0 ? (
        <>
          , so the owner needs to add <Money cents={short} /> before it can be
          paid.
        </>
      ) : (
        <>
          , leaving <Money cents={poolBalance - amount} /> after the payout.
        </>
      )}
    </p>
  );
}

/**
 * The admin's controls for one report (design-plan §7.5): legal moves only, a severity for
 * acceptance from this program's tiers, an original for duplicates, and a note. The note is
 * also posted as a comment, because the backend keeps it only in the audit log, where the
 * researcher can't read it.
 */
export function TriagePanel({
  report,
  program,
  payoutAmount,
}: {
  report: Report;
  program: PanelProgram;
  payoutAmount?: Cents;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [failure, setFailure] = useState<Failure | null>(null);
  const attempts = useRef(0);
  const targets = triageTargets(report.status);
  // Highest reward first, like the program page.
  const tiers = [...program.rewardTiers].sort((a, b) => b.amount - a.amount);
  const tierFor = (severity: Severity | undefined) =>
    tiers.find((tier) => tier.severity === severity);

  const form = useForm({
    resolver: zodResolver(triageSchema),
    mode: "onTouched",
    defaultValues: {
      status: undefined,
      severity: tierFor(report.severity ?? undefined)?.severity,
      duplicateOfId: undefined,
      note: "",
    },
  });
  const target = useWatch({ control: form.control, name: "status" });
  const severity = useWatch({ control: form.control, name: "severity" });
  const chosenTier = tierFor(severity);

  const triage = useMutation({
    mutationFn: async (values: TriageInput) => {
      await clientRequest(
        reportEndpoints.triage(report.id, toTriageRequest(values)),
      );
      if (!values.note) return { notePosted: true };
      try {
        await clientRequest(
          reportEndpoints.addComment(report.id, { body: values.note }),
        );
        return { notePosted: true };
      } catch {
        return { notePosted: false };
      }
    },
    meta: { silentToast: true },
    onSuccess: ({ notePosted }, values) => {
      void queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: reportKeys.comments(report.id),
      });
      toast.success(DONE_TOAST[values.status]);
      if (!notePosted) {
        toast.error(
          "The status changed, but the note didn't post. Add it as a comment.",
        );
      }
      // The track, badges, and this panel come from the server render.
      router.refresh();
    },
    onError: (error) => {
      for (const field of FIELDS) {
        const message = error.fieldErrors[field];
        if (message) form.setError(field, { message });
      }
      attempts.current += 1;
      setFailure({ message: failureMessage(error), attempt: attempts.current });
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    if (triage.isPending) return;
    setFailure(null);
    triage.mutate(values);
  });

  if (report.status === "ACCEPTED") {
    const tier = tierFor(report.severity ?? undefined);
    return (
      <section
        aria-labelledby="triage-heading"
        className="flex flex-col gap-2 border-t pt-4"
      >
        <h2 id="triage-heading" className="text-base font-semibold">
          Triage
        </h2>
        <p className="text-sm text-muted-foreground">
          Accepted
          {report.severity ? ` at ${SEVERITY_LABEL[report.severity]}` : ""}. It
          waits for the payout.
        </p>
        {tier && (
          <PayoutPreview
            amount={tier.amount}
            poolBalance={program.poolBalance}
          />
        )}
      </section>
    );
  }

  if (targets.length === 0) {
    return (
      <section
        aria-labelledby="triage-heading"
        className="flex flex-col gap-2 border-t pt-4"
      >
        <h2 id="triage-heading" className="text-base font-semibold">
          Triage
        </h2>
        <p className="text-sm text-muted-foreground">
          {report.status === "REWARDED" && payoutAmount !== undefined ? (
            <>
              Paid <Money cents={payoutAmount} tone="money" /> from the pool.
              Triage is complete.
            </>
          ) : (
            `${REPORT_STATUS_LABEL[report.status]} is final, so this report takes no more status changes.`
          )}
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="triage-heading"
      className="flex flex-col gap-4 border-t pt-4"
    >
      <h2 id="triage-heading" className="text-base font-semibold">
        Triage
      </h2>
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        <FieldGroup className="gap-5">
          <Controller
            name="status"
            control={form.control}
            render={({ field, fieldState }) => (
              <FieldSet>
                <FieldLegend variant="label">Move to</FieldLegend>
                <RadioGroup
                  name={field.name}
                  value={field.value ?? ""}
                  onValueChange={(next) => {
                    field.onChange(next);
                    form.clearErrors();
                  }}
                  aria-invalid={fieldState.invalid}
                  aria-describedby={describedBy(
                    fieldState.error && "triage-status-error",
                  )}
                  className="gap-2"
                >
                  {targets.map((option, index) => {
                    const noTiers = option === "ACCEPTED" && tiers.length === 0;
                    return (
                      <FieldLabel
                        key={option}
                        htmlFor={`triage-status-${option}`}
                      >
                        <Field
                          orientation="horizontal"
                          data-invalid={fieldState.invalid}
                          data-disabled={noTiers || undefined}
                        >
                          <FieldContent>
                            <FieldTitle>
                              {option === "TRIAGING"
                                ? "In triage"
                                : REPORT_STATUS_LABEL[option]}
                            </FieldTitle>
                            <FieldDescription>
                              {noTiers
                                ? "The program has no reward tiers yet, so nothing can be accepted."
                                : describeTarget(option, report.status)}
                            </FieldDescription>
                          </FieldContent>
                          <RadioGroupItem
                            ref={index === 0 ? field.ref : undefined}
                            id={`triage-status-${option}`}
                            value={option}
                            disabled={noTiers}
                            aria-invalid={fieldState.invalid}
                            onBlur={field.onBlur}
                          />
                        </Field>
                      </FieldLabel>
                    );
                  })}
                </RadioGroup>
                <FieldError
                  id="triage-status-error"
                  errors={[fieldState.error]}
                />
              </FieldSet>
            )}
          />

          {target === "ACCEPTED" && (
            <Controller
              name="severity"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="triage-severity">Severity</FieldLabel>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(next) => {
                      field.onChange(next);
                      form.clearErrors("severity");
                    }}
                  >
                    <SelectTrigger
                      ref={field.ref}
                      id="triage-severity"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                      aria-describedby={describedBy(
                        chosenTier && "triage-severity-pays",
                        fieldState.error && "triage-severity-error",
                      )}
                    >
                      <SelectValue placeholder="Choose a severity" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiers.map((tier) => (
                        <SelectItem key={tier.severity} value={tier.severity}>
                          {SEVERITY_LABEL[tier.severity]},{" "}
                          {formatMoney(tier.amount)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {chosenTier && (
                    <div id="triage-severity-pays">
                      <PayoutPreview
                        amount={chosenTier.amount}
                        poolBalance={program.poolBalance}
                      />
                    </div>
                  )}
                  <FieldError
                    id="triage-severity-error"
                    errors={[fieldState.error]}
                  />
                </Field>
              )}
            />
          )}

          {target === "DUPLICATE" && (
            <Controller
              name="duplicateOfId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="triage-original">
                    Original report
                  </FieldLabel>
                  <DuplicatePicker
                    id="triage-original"
                    reportId={report.id}
                    programId={report.programId}
                    value={field.value}
                    onChange={(next) => {
                      field.onChange(next);
                      form.clearErrors("duplicateOfId");
                    }}
                    invalid={fieldState.invalid}
                    describedBy={describedBy(
                      fieldState.error && "triage-original-error",
                    )}
                    buttonRef={field.ref}
                  />
                  <FieldError
                    id="triage-original-error"
                    errors={[fieldState.error]}
                  />
                </Field>
              )}
            />
          )}

          <Controller
            name="note"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="triage-note">
                  Note to researcher
                  {target === "NEEDS_INFO" ? "" : " (optional)"}
                </FieldLabel>
                <Textarea
                  {...field}
                  id="triage-note"
                  rows={3}
                  aria-invalid={fieldState.invalid}
                  aria-describedby={describedBy(
                    "triage-note-help",
                    fieldState.error && "triage-note-error",
                  )}
                />
                <FieldDescription id="triage-note-help">
                  {target === "NEEDS_INFO" ? "Say what you need. " : ""}
                  It&apos;s posted as a comment, so the researcher and the
                  program owner read it. Up to{" "}
                  {TRIAGE_NOTE.max.toLocaleString("en-US")} characters.
                </FieldDescription>
                <FieldError
                  id="triage-note-error"
                  errors={[fieldState.error]}
                />
              </Field>
            )}
          />
        </FieldGroup>

        {failure && <FailureAlert failure={failure} />}

        <Button
          type="submit"
          aria-disabled={triage.isPending || undefined}
          className="w-full"
        >
          {triage.isPending ? (
            <PendingLabel>Updating</PendingLabel>
          ) : target ? (
            SUBMIT_LABEL[target]
          ) : (
            "Update status"
          )}
        </Button>
      </form>
    </section>
  );
}
