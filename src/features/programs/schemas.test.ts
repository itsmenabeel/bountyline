import { describe, expect, it } from "vitest";
import {
  draftHasContent,
  EMPTY_PROGRAM_DRAFT,
  type ProgramDraft,
  parseProgramDraft,
  programBasicsSchema,
  programScopeSchema,
  type RewardTiersValues,
  rewardTiersSchema,
} from "./schemas";

type Issues = {
  error?: { issues: { message: string; path: PropertyKey[] }[] };
};

const firstMessage = (result: Issues) => result.error?.issues[0]?.message;
const issuePaths = (result: Issues) =>
  result.error?.issues.map((issue) => issue.path.join(".")) ?? [];

const rows = (...values: string[]) => values.map((value) => ({ value }));

describe("programBasicsSchema", () => {
  const valid = {
    title: "Acme Web Application",
    description: "Test the customer portal at app.acme.test.",
  };

  it("trims both fields", () => {
    expect(
      programBasicsSchema.parse({
        title: `  ${valid.title} `,
        description: `\n${valid.description}\n`,
      }),
    ).toEqual(valid);
  });

  it("applies the backend's title bounds after trimming (3 to 150)", () => {
    const title = (value: string) =>
      firstMessage(programBasicsSchema.safeParse({ ...valid, title: value }));
    expect(title("   ")).toBe("Give the program a name.");
    expect(title("  ab  ")).toBe("Use at least 3 characters.");
    expect(title("abc")).toBeUndefined();
    expect(title("a".repeat(150))).toBeUndefined();
    expect(title("a".repeat(151))).toBe("Use 150 characters or fewer.");
  });

  it("applies the backend's description bounds (10 to 10,000)", () => {
    const description = (value: string) =>
      firstMessage(
        programBasicsSchema.safeParse({ ...valid, description: value }),
      );
    expect(description("")).toBe("Describe the program for researchers.");
    expect(description("a".repeat(9))).toBe("Use at least 10 characters.");
    expect(description("a".repeat(10_000))).toBeUndefined();
    expect(description("a".repeat(10_001))).toBe(
      "Use 10,000 characters or fewer.",
    );
  });
});

describe("programScopeSchema", () => {
  const valid = { inScope: rows("app.acme.test"), outOfScope: [], rules: "" };

  it("drops blank rows and trims the rest", () => {
    expect(
      programScopeSchema.parse({
        inScope: rows(" app.acme.test ", "", "  "),
        outOfScope: rows("", "blog.acme.test"),
        rules: "  No DoS. ",
      }),
    ).toEqual({
      inScope: ["app.acme.test"],
      outOfScope: ["blog.acme.test"],
      rules: "No DoS.",
    });
  });

  it("needs at least one in-scope asset", () => {
    const result = programScopeSchema.safeParse({
      ...valid,
      inScope: rows("", " "),
    });
    expect(firstMessage(result)).toBe(
      "List at least one asset researchers may test.",
    );
    expect(issuePaths(result)).toEqual(["inScope"]);
  });

  it("caps each asset at 200 characters", () => {
    const result = programScopeSchema.safeParse({
      ...valid,
      inScope: rows("a".repeat(200), "b".repeat(201)),
    });
    expect(issuePaths(result)).toEqual(["inScope.1.value"]);
  });

  it("caps each list at 100 assets", () => {
    const many = Array.from({ length: 101 }, (_, i) => `host-${i}.acme.test`);
    const result = programScopeSchema.safeParse({
      ...valid,
      outOfScope: rows(...many),
    });
    expect(firstMessage(result)).toBe("List 100 assets or fewer.");
    expect(
      programScopeSchema.safeParse({
        ...valid,
        outOfScope: rows(...many.slice(1)),
      }).success,
    ).toBe(true);
  });

  it("flags a repeated asset on the later row, ignoring case", () => {
    const result = programScopeSchema.safeParse({
      ...valid,
      inScope: rows("app.acme.test", "api.acme.test", "APP.acme.test "),
    });
    expect(issuePaths(result)).toEqual(["inScope.2.value"]);
    expect(firstMessage(result)).toBe("This asset is already on the list.");
  });

  it("caps rules at 5,000 characters", () => {
    expect(
      firstMessage(
        programScopeSchema.safeParse({ ...valid, rules: "a".repeat(5_001) }),
      ),
    ).toBe("Use 5,000 characters or fewer.");
  });
});

describe("rewardTiersSchema", () => {
  const tiers = (
    amounts: Partial<Record<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL", string>>,
  ): RewardTiersValues => ({
    tiers: (["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((severity) => ({
      severity,
      enabled: amounts[severity] !== undefined,
      amount: amounts[severity] ?? "",
    })),
  });

  it("returns the turned-on tiers in cents", () => {
    expect(
      rewardTiersSchema.parse(tiers({ MEDIUM: "250.50", CRITICAL: "5,000" })),
    ).toEqual({
      tiers: [
        { severity: "MEDIUM", amount: 25_050 },
        { severity: "CRITICAL", amount: 500_000 },
      ],
    });
  });

  it("ignores the amount of a tier that's turned off", () => {
    const values = tiers({ HIGH: "1500" });
    values.tiers[0] = { severity: "LOW", enabled: false, amount: "oops" };
    expect(rewardTiersSchema.safeParse(values).success).toBe(true);
  });

  it("needs at least one tier", () => {
    const result = rewardTiersSchema.safeParse(tiers({}));
    expect(firstMessage(result)).toBe(
      "Turn on at least one severity and set its reward.",
    );
    expect(issuePaths(result)).toEqual(["tiers"]);
  });

  it("checks each amount on its own row", () => {
    const amount = (value: string) => {
      const result = rewardTiersSchema.safeParse(tiers({ HIGH: value }));
      return { message: firstMessage(result), paths: issuePaths(result) };
    };
    expect(amount("")).toEqual({
      message: "Enter the High reward, or turn High off.",
      paths: ["tiers.2.amount"],
    });
    expect(amount("12.345").message).toBe(
      "Enter dollars, like 1,500 or 1500.00.",
    );
    expect(amount("0.00").message).toBe("Enter an amount above $0.");
    expect(amount("1,000,000.00").message).toBeUndefined();
    expect(amount("1,000,000.01").message).toBe("Use $1,000,000.00 or less.");
  });

  it("won't let a higher severity pay less than a lower one", () => {
    const result = rewardTiersSchema.safeParse(
      tiers({ LOW: "100", HIGH: "50", CRITICAL: "50" }),
    );
    expect(issuePaths(result)).toEqual(["tiers.2.amount"]);
    expect(firstMessage(result)).toBe(
      "High can't pay less than Low ($100.00).",
    );
    expect(
      rewardTiersSchema.safeParse(tiers({ LOW: "100", HIGH: "100" })).success,
    ).toBe(true);
  });
});

describe("parseProgramDraft", () => {
  const draft: ProgramDraft = {
    basics: {
      title: "Acme Web Application",
      description: "Test the customer portal.",
    },
    scope: { inScope: rows("app.acme.test"), outOfScope: [], rules: " " },
    tiers: {
      tiers: EMPTY_PROGRAM_DRAFT.tiers.tiers.map((row) => ({
        ...row,
        enabled: row.severity === "HIGH",
        amount: row.severity === "HIGH" ? "1500" : "",
      })),
    },
  };

  it("builds the create body and the tiers, leaving out empty rules", () => {
    expect(parseProgramDraft(draft)).toEqual({
      ok: true,
      program: {
        title: "Acme Web Application",
        description: "Test the customer portal.",
        scope: { inScope: ["app.acme.test"], outOfScope: [] },
      },
      tiers: [{ severity: "HIGH", amount: 150_000 }],
    });
  });

  it("names the first step that needs fixing", () => {
    expect(parseProgramDraft(EMPTY_PROGRAM_DRAFT)).toEqual({
      ok: false,
      step: 0,
    });
    expect(
      parseProgramDraft({ ...draft, scope: EMPTY_PROGRAM_DRAFT.scope }),
    ).toEqual({ ok: false, step: 1 });
    expect(
      parseProgramDraft({ ...draft, tiers: EMPTY_PROGRAM_DRAFT.tiers }),
    ).toEqual({ ok: false, step: 2 });
  });
});

describe("draftHasContent", () => {
  it("is false for the empty draft and true once anything is typed", () => {
    expect(draftHasContent(EMPTY_PROGRAM_DRAFT)).toBe(false);
    expect(
      draftHasContent({
        ...EMPTY_PROGRAM_DRAFT,
        scope: { ...EMPTY_PROGRAM_DRAFT.scope, inScope: rows(" ") },
      }),
    ).toBe(false);
    expect(
      draftHasContent({
        ...EMPTY_PROGRAM_DRAFT,
        basics: { title: "A", description: "" },
      }),
    ).toBe(true);
  });
});
