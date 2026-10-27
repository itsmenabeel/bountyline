import { z } from "zod";
import { SEVERITY_LABEL } from "@/lib/constants/domain";
import { formatMoney, parseDollarsToCents } from "@/lib/money";
import {
  type ProgramScope,
  type RewardTier,
  SEVERITIES,
  type Severity,
} from "@/types/api";

// Mirrors bug-bounty-platform src/modules/program/program.validation.ts. Lengths count after
// trimming, as the backend's do. Two rules are ours and stricter: an asset can't be listed
// twice (the program page keys its lists by asset), and a higher severity can't pay less
// than a lower one.

export const PROGRAM_TITLE = { min: 3, max: 150 } as const;
export const PROGRAM_DESCRIPTION = { min: 10, max: 10_000 } as const;
export const SCOPE_ASSET = { max: 200 } as const;
export const SCOPE_LIST = { max: 100 } as const;
export const PROGRAM_RULES = { max: 5_000 } as const;
/** Cents: $1,000,000.00. */
export const TIER_AMOUNT = { max: 100_000_000 } as const;

const count = new Intl.NumberFormat("en-US");

// ---- Step 1: basics ----

export const programBasicsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { error: "Give the program a name.", abort: true })
    .min(PROGRAM_TITLE.min, `Use at least ${PROGRAM_TITLE.min} characters.`)
    .max(PROGRAM_TITLE.max, `Use ${PROGRAM_TITLE.max} characters or fewer.`),
  description: z
    .string()
    .trim()
    .min(1, { error: "Describe the program for researchers.", abort: true })
    .min(
      PROGRAM_DESCRIPTION.min,
      `Use at least ${PROGRAM_DESCRIPTION.min} characters.`,
    )
    .max(
      PROGRAM_DESCRIPTION.max,
      `Use ${count.format(PROGRAM_DESCRIPTION.max)} characters or fewer.`,
    ),
});

// ---- Step 2: scope ----

/** One row of a scope list. RHF's field arrays need objects, so each asset is `{ value }`. */
const assetRow = z.object({
  value: z
    .string()
    .trim()
    .max(SCOPE_ASSET.max, `Use ${SCOPE_ASSET.max} characters or fewer.`),
});

/** A scope list: blank rows drop out, repeats are flagged on the later row. */
const assetList = z
  .array(assetRow)
  .superRefine((rows, ctx) => {
    const seen = new Set<string>();
    rows.forEach((row, index) => {
      if (!row.value) return;
      const key = row.value.toLowerCase();
      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: [index, "value"],
          message: "This asset is already on the list.",
        });
      }
      seen.add(key);
    });
  })
  .transform((rows) => rows.map((row) => row.value).filter(Boolean))
  .refine((assets) => assets.length <= SCOPE_LIST.max, {
    error: `List ${SCOPE_LIST.max} assets or fewer.`,
  });

export const programScopeSchema = z.object({
  inScope: assetList.refine((assets) => assets.length > 0, {
    error: "List at least one asset researchers may test.",
  }),
  outOfScope: assetList,
  rules: z
    .string()
    .trim()
    .max(
      PROGRAM_RULES.max,
      `Use ${count.format(PROGRAM_RULES.max)} characters or fewer.`,
    ),
});

// ---- Step 3: reward tiers ----

const tierRow = z.object({
  severity: z.enum(SEVERITIES),
  enabled: z.boolean(),
  /** Dollars as typed; converted to cents through string parsing. */
  amount: z.string(),
});

const maxTier = formatMoney(TIER_AMOUNT.max);

export const rewardTiersSchema = z.object({
  tiers: z
    .array(tierRow)
    .superRefine((rows, ctx) => {
      if (!rows.some((row) => row.enabled)) {
        ctx.addIssue({
          code: "custom",
          message: "Turn on at least one severity and set its reward.",
        });
        return;
      }
      // Rows run Low to Critical. Each paid tier must pay at least the last one below it.
      let below: { severity: Severity; cents: number } | null = null;
      rows.forEach((row, index) => {
        if (!row.enabled) return;
        const path = [index, "amount"];
        const label = SEVERITY_LABEL[row.severity];
        if (!row.amount.trim()) {
          ctx.addIssue({
            code: "custom",
            path,
            message: `Enter the ${label} reward, or turn ${label} off.`,
          });
          return;
        }
        const cents = parseDollarsToCents(row.amount);
        if (cents === null) {
          ctx.addIssue({
            code: "custom",
            path,
            message: "Enter dollars, like 1,500 or 1500.00.",
          });
          return;
        }
        if (cents === 0) {
          ctx.addIssue({
            code: "custom",
            path,
            message: "Enter an amount above $0.",
          });
          return;
        }
        if (cents > TIER_AMOUNT.max) {
          ctx.addIssue({
            code: "custom",
            path,
            message: `Use ${maxTier} or less.`,
          });
          return;
        }
        if (below && cents < below.cents) {
          ctx.addIssue({
            code: "custom",
            path,
            message: `${label} can't pay less than ${SEVERITY_LABEL[below.severity]} (${formatMoney(below.cents)}).`,
          });
        }
        below = { severity: row.severity, cents };
      });
    })
    .transform((rows): RewardTier[] =>
      rows
        .filter((row) => row.enabled)
        .map((row) => ({
          severity: row.severity,
          amount: parseDollarsToCents(row.amount) ?? 0,
        })),
    ),
});

// ---- The wizard's draft ----

export type ProgramBasicsValues = z.input<typeof programBasicsSchema>;
export type ProgramScopeValues = z.input<typeof programScopeSchema>;
export type ProgramScopeOutput = z.output<typeof programScopeSchema>;
export type RewardTiersValues = z.input<typeof rewardTiersSchema>;
export type RewardTiersOutput = z.output<typeof rewardTiersSchema>;

/** What the wizard keeps between steps and reloads: the fields as typed, not yet parsed. */
export interface ProgramDraft {
  basics: ProgramBasicsValues;
  scope: ProgramScopeValues;
  tiers: RewardTiersValues;
}

export const EMPTY_PROGRAM_DRAFT: ProgramDraft = {
  basics: { title: "", description: "" },
  scope: { inScope: [{ value: "" }], outOfScope: [], rules: "" },
  tiers: {
    tiers: SEVERITIES.map((severity) => ({
      severity,
      enabled: true,
      amount: "",
    })),
  },
};

/** True once the owner has typed anything worth keeping. */
export function draftHasContent(draft: ProgramDraft) {
  const { basics, scope, tiers } = draft;
  return (
    Boolean(basics.title.trim() || basics.description.trim()) ||
    scope.inScope.some((row) => row.value.trim()) ||
    scope.outOfScope.some((row) => row.value.trim()) ||
    Boolean(scope.rules.trim()) ||
    tiers.tiers.some((row) => row.amount.trim())
  );
}

/** POST /programs */
export interface CreateProgramRequest {
  title: string;
  description: string;
  scope: ProgramScope;
}

export type ParsedProgramDraft =
  | { ok: true; program: CreateProgramRequest; tiers: RewardTier[] }
  /** The first step whose fields don't pass, so the wizard can send the owner back to it. */
  | { ok: false; step: 0 | 1 | 2 };

/** The whole draft as request bodies, or the step to fix first. */
export function parseProgramDraft(draft: ProgramDraft): ParsedProgramDraft {
  const basics = programBasicsSchema.safeParse(draft.basics);
  if (!basics.success) return { ok: false, step: 0 };
  const scope = programScopeSchema.safeParse(draft.scope);
  if (!scope.success) return { ok: false, step: 1 };
  const tiers = rewardTiersSchema.safeParse(draft.tiers);
  if (!tiers.success) return { ok: false, step: 2 };

  const { inScope, outOfScope, rules } = scope.data;
  return {
    ok: true,
    program: {
      ...basics.data,
      // The backend accepts an empty string, but leaving rules out says "no rules" plainly.
      scope: { inScope, outOfScope, ...(rules && { rules }) },
    },
    tiers: tiers.data.tiers,
  };
}
