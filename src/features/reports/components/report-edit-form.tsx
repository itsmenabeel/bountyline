"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { type Failure, FailureAlert } from "@/components/shared/failure-alert";
import { PendingLabel } from "@/components/shared/pending-label";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { clientRequest } from "@/lib/api/client";
import type { ApiError } from "@/lib/api/errors";
import type { Report } from "@/types/api";
import { reportEndpoints } from "../endpoints";
import { reportKeys } from "../queries";
import {
  REPORT_DESCRIPTION,
  REPORT_TITLE,
  type ReportWriteupInput,
  reportWriteupSchema,
} from "../schemas";

// The preview pulls in the Markdown renderer, so it loads only when someone opens the tab.
const MarkdownView = dynamic(
  () => import("@/components/shared/markdown-view").then((m) => m.MarkdownView),
  { loading: () => <Skeleton className="h-24 w-full" /> },
);

const FIELDS = ["title", "description"] as const;

const describedBy = (...ids: (string | false | undefined)[]) =>
  ids.filter(Boolean).join(" ") || undefined;

/** The backend's 409 names a raw status; this says what happened and what to do. */
function failureMessage(error: ApiError) {
  if (error.status === 409) {
    return "The triage team has moved this report on, so it can't be edited now. Open the report to see where it stands.";
  }
  return error.userMessage;
}

/**
 * Title and write-up for a report the researcher can still change. Saving a Needs info
 * report sends it back to triage, so the button says so.
 */
export function ReportEditForm({
  report,
  detailHref,
}: {
  report: Report;
  detailHref: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [failure, setFailure] = useState<Failure | null>(null);
  const attempts = useRef(0);
  const needsInfo = report.status === "NEEDS_INFO";
  const [tab, setTab] = useState("write");

  const form = useForm({
    resolver: zodResolver(reportWriteupSchema),
    mode: "onTouched",
    defaultValues: { title: report.title, description: report.description },
  });
  const description = useWatch({ control: form.control, name: "description" });

  const save = useMutation({
    mutationFn: (values: ReportWriteupInput) =>
      clientRequest(reportEndpoints.update(report.id, values)),
    // The form shows its own failure; a toast on top would say it twice.
    meta: { silentToast: true },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: reportKeys.all });
      toast.success(needsInfo ? "Report sent back to triage" : "Report saved");
      router.push(detailHref);
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

  const onSubmit = form.handleSubmit(
    (values) => {
      if (save.isPending) return;
      setFailure(null);
      save.mutate(values);
    },
    (errors) => {
      // A write-up error can't take focus while Preview hides the textarea.
      if (errors.description && tab !== "write") {
        setTab("write");
        requestAnimationFrame(() => form.setFocus("description"));
      }
    },
  );

  const submitLabel = needsInfo ? "Save and send to triage" : "Save changes";

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-6">
      <FieldGroup>
        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="report-title">Title</FieldLabel>
              <Input
                {...field}
                id="report-title"
                aria-invalid={fieldState.invalid}
                aria-describedby={describedBy(
                  "report-title-help",
                  fieldState.error && "report-title-error",
                )}
              />
              <FieldDescription id="report-title-help">
                Name the bug and where it is, in {REPORT_TITLE.min} to{" "}
                {REPORT_TITLE.max} characters.
              </FieldDescription>
              <FieldError id="report-title-error" errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="report-description">Write-up</FieldLabel>
              <Tabs value={tab} onValueChange={setTab} className="gap-3">
                <TabsList>
                  <TabsTrigger value="write">Write</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                {/* Kept mounted while Preview shows, so the label and error focus still
                    have a textarea to point at. */}
                <TabsContent
                  value="write"
                  forceMount
                  className="data-[state=inactive]:hidden"
                >
                  <Textarea
                    {...field}
                    id="report-description"
                    rows={16}
                    className="min-h-80 font-mono md:pointer-fine:text-sm"
                    aria-invalid={fieldState.invalid}
                    aria-describedby={describedBy(
                      "report-description-help",
                      fieldState.error && "report-description-error",
                    )}
                  />
                </TabsContent>
                <TabsContent
                  value="preview"
                  className="min-h-40 rounded-lg border bg-card p-4"
                >
                  {description.trim() ? (
                    <MarkdownView source={description} />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nothing to preview yet.
                    </p>
                  )}
                </TabsContent>
              </Tabs>
              <FieldDescription id="report-description-help">
                Markdown works here. Cover the steps to reproduce and the
                impact, in at least {REPORT_DESCRIPTION.min} characters.
              </FieldDescription>
              <FieldError
                id="report-description-error"
                errors={[fieldState.error]}
              />
            </Field>
          )}
        />
      </FieldGroup>

      {failure && <FailureAlert failure={failure} />}

      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          size="lg"
          aria-disabled={save.isPending || undefined}
        >
          {save.isPending ? <PendingLabel>Saving</PendingLabel> : submitLabel}
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link href={detailHref}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
