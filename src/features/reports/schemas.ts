import { z } from "zod";
import type { TriageTarget } from "@/lib/constants/domain";
import { SEVERITIES, type Severity } from "@/types/api";

// Mirrors bug-bounty-platform src/modules/report/report.validation.ts and
// comment.validation.ts. Lengths count after trimming, as the backend's do.

export const REPORT_TITLE = { min: 5, max: 200 } as const;
export const REPORT_DESCRIPTION = { min: 20, max: 20_000 } as const;
export const COMMENT_BODY = { max: 5_000 } as const;

const count = new Intl.NumberFormat("en-US");

export const reportWriteupSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { error: "Give the report a title.", abort: true })
    .min(REPORT_TITLE.min, `Use at least ${REPORT_TITLE.min} characters.`)
    .max(REPORT_TITLE.max, `Use ${REPORT_TITLE.max} characters or fewer.`),
  description: z
    .string()
    .trim()
    .min(1, { error: "Describe what you found.", abort: true })
    .min(
      REPORT_DESCRIPTION.min,
      `Use at least ${REPORT_DESCRIPTION.min} characters.`,
    )
    .max(
      REPORT_DESCRIPTION.max,
      `Use ${count.format(REPORT_DESCRIPTION.max)} characters or fewer.`,
    ),
});

export type ReportWriteupInput = z.output<typeof reportWriteupSchema>;

// ---- Submission wizard, step 1 ----

/** The program picker and the scope confirmation (design-plan §9.1). */
export const reportProgramSchema = z.object({
  programId: z.string().min(1, "Pick the program your finding belongs to."),
  inScope: z.boolean().refine((confirmed) => confirmed, {
    error: "Confirm that your finding targets an in-scope asset.",
  }),
});

export type ReportProgramValues = z.input<typeof reportProgramSchema>;

/** POST /reports */
export interface CreateReportRequest extends ReportWriteupInput {
  programId: string;
}

/**
 * Headings the write-up step can insert, in the order triage reads a report. Each free-text
 * section has an empty line to type on with a blank line after it, so text typed under a
 * heading stays a separate paragraph from the next one.
 */
export const REPORT_TEMPLATE = [
  "## Summary",
  "",
  "",
  "",
  "## Steps to reproduce",
  "",
  "1. ",
  "",
  "## Impact",
  "",
  "",
  "",
  "## Suggested fix",
  "",
  "",
].join("\n");

/** The write-up with the template added: on its own if empty, else after a blank line. */
export function withTemplate(description: string) {
  const current = description.trimEnd();
  return current ? `${current}\n\n${REPORT_TEMPLATE}` : REPORT_TEMPLATE;
}

export const commentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Write a comment first.")
    .max(
      COMMENT_BODY.max,
      `Use ${count.format(COMMENT_BODY.max)} characters or fewer.`,
    ),
});

export type CommentInput = z.output<typeof commentSchema>;

// ---- Triage (admin), mirroring triageReportSchema ----

export const TRIAGE_NOTE = { max: 1_000 } as const;

const TRIAGE_STATUSES = [
  "TRIAGING",
  "NEEDS_INFO",
  "ACCEPTED",
  "REJECTED",
  "DUPLICATE",
] as const satisfies readonly TriageTarget[];

/**
 * The backend's rules plus one of ours: asking for more info needs a question, because the
 * note is what the researcher answers (it's posted to the thread as a comment).
 */
export const triageSchema = z
  .object({
    status: z.enum(TRIAGE_STATUSES, {
      error: "Choose where the report goes next.",
    }),
    severity: z.enum(SEVERITIES).optional(),
    duplicateOfId: z.string().optional(),
    note: z
      .string()
      .trim()
      .max(
        TRIAGE_NOTE.max,
        `Use ${count.format(TRIAGE_NOTE.max)} characters or fewer.`,
      ),
  })
  .superRefine((values, ctx) => {
    if (values.status === "ACCEPTED" && !values.severity) {
      ctx.addIssue({
        code: "custom",
        path: ["severity"],
        message: "Choose the severity it pays at.",
      });
    }
    if (values.status === "DUPLICATE" && !values.duplicateOfId) {
      ctx.addIssue({
        code: "custom",
        path: ["duplicateOfId"],
        message: "Pick the original report.",
      });
    }
    if (values.status === "NEEDS_INFO" && !values.note) {
      ctx.addIssue({
        code: "custom",
        path: ["note"],
        message: "Tell the researcher what's missing.",
      });
    }
  });

export type TriageInput = z.output<typeof triageSchema>;

/** The PATCH body: only the fields the chosen status takes (the backend 422s the rest). */
export interface TriageRequest {
  status: TriageTarget;
  severity?: Severity;
  duplicateOfId?: string;
  note?: string;
}

export function toTriageRequest(values: TriageInput): TriageRequest {
  return {
    status: values.status,
    ...(values.status === "ACCEPTED" && { severity: values.severity }),
    ...(values.status === "DUPLICATE" && {
      duplicateOfId: values.duplicateOfId,
    }),
    ...(values.note && { note: values.note }),
  };
}
