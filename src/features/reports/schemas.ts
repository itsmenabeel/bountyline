import { z } from "zod";

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
