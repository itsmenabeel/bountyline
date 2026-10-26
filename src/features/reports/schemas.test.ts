import { describe, expect, it } from "vitest";
import {
  commentSchema,
  reportWriteupSchema,
  toTriageRequest,
  triageSchema,
} from "./schemas";

const firstMessage = (result: { error?: { issues: { message: string }[] } }) =>
  result.error?.issues[0]?.message;

const valid = {
  title: "Stored XSS in profile bio",
  description: "The bio field renders HTML without escaping it.",
};

describe("reportWriteupSchema", () => {
  it("trims both fields", () => {
    expect(
      reportWriteupSchema.parse({
        title: `  ${valid.title} `,
        description: `\n${valid.description}\n`,
      }),
    ).toEqual(valid);
  });

  it("applies the backend's title bounds after trimming (5 to 200)", () => {
    const title = (value: string) =>
      firstMessage(reportWriteupSchema.safeParse({ ...valid, title: value }));
    expect(title("   ")).toBe("Give the report a title.");
    expect(title("  abcd  ")).toBe("Use at least 5 characters.");
    expect(title("abcde")).toBeUndefined();
    expect(title("a".repeat(200))).toBeUndefined();
    expect(title("a".repeat(201))).toBe("Use 200 characters or fewer.");
  });

  it("applies the backend's description bounds (20 to 20,000)", () => {
    const description = (value: string) =>
      firstMessage(
        reportWriteupSchema.safeParse({ ...valid, description: value }),
      );
    expect(description("")).toBe("Describe what you found.");
    expect(description("a".repeat(19))).toBe("Use at least 20 characters.");
    expect(description("a".repeat(20))).toBeUndefined();
    expect(description("a".repeat(20_001))).toBe(
      "Use 20,000 characters or fewer.",
    );
  });
});

describe("commentSchema", () => {
  it("needs 1 to 5,000 characters after trimming", () => {
    expect(firstMessage(commentSchema.safeParse({ body: "  \n " }))).toBe(
      "Write a comment first.",
    );
    expect(commentSchema.parse({ body: " Thanks! " }).body).toBe("Thanks!");
    expect(
      firstMessage(commentSchema.safeParse({ body: "a".repeat(5_001) })),
    ).toBe("Use 5,000 characters or fewer.");
  });
});

describe("triageSchema", () => {
  const issues = (values: Record<string, unknown>) =>
    triageSchema
      .safeParse({ note: "", ...values })
      .error?.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      );

  it("needs a status", () => {
    expect(issues({})).toEqual(["status: Choose where the report goes next."]);
  });

  it("needs a severity to accept, an original for a duplicate, a note to ask", () => {
    expect(issues({ status: "ACCEPTED" })).toEqual([
      "severity: Choose the severity it pays at.",
    ]);
    expect(issues({ status: "DUPLICATE" })).toEqual([
      "duplicateOfId: Pick the original report.",
    ]);
    expect(issues({ status: "NEEDS_INFO", note: "   " })).toEqual([
      "note: Tell the researcher what's missing.",
    ]);
    expect(issues({ status: "REJECTED" })).toBeUndefined();
  });

  it("caps the note at 1,000 characters", () => {
    expect(issues({ status: "REJECTED", note: "a".repeat(1_001) })).toEqual([
      "note: Use 1,000 characters or fewer.",
    ]);
  });
});

describe("toTriageRequest", () => {
  it("sends only the fields the chosen status takes", () => {
    expect(
      toTriageRequest({
        status: "REJECTED",
        severity: "HIGH",
        duplicateOfId: "x",
        note: "",
      }),
    ).toEqual({ status: "REJECTED" });
    expect(
      toTriageRequest({ status: "ACCEPTED", severity: "HIGH", note: "Valid." }),
    ).toEqual({ status: "ACCEPTED", severity: "HIGH", note: "Valid." });
    expect(
      toTriageRequest({ status: "DUPLICATE", duplicateOfId: "abc", note: "" }),
    ).toEqual({ status: "DUPLICATE", duplicateOfId: "abc" });
  });
});
