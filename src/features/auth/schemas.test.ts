import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./schemas";

const validRegister = {
  name: "Riley Researcher",
  email: "riley@example.com",
  password: "hunter22",
  role: "RESEARCHER",
} as const;

const firstMessage = (result: { error?: { issues: { message: string }[] } }) =>
  result.error?.issues[0]?.message;

describe("loginSchema", () => {
  it("trims and lowercases the email", () => {
    expect(
      loginSchema.parse({ email: "  Owner@BugBounty.dev ", password: "x" }),
    ).toEqual({ email: "owner@bugbounty.dev", password: "x" });
  });

  it("requires a password and leaves its spaces alone", () => {
    expect(
      firstMessage(loginSchema.safeParse({ email: "a@b.co", password: "" })),
    ).toBe("Enter your password.");
    expect(
      loginSchema.parse({ email: "a@b.co", password: " pass " }).password,
    ).toBe(" pass ");
  });

  it("rejects a malformed email and one over 254 characters", () => {
    expect(
      loginSchema.safeParse({ email: "not-an-email", password: "x" }).success,
    ).toBe(false);
    const long = `${"a".repeat(64)}@${"b".repeat(185)}.com`;
    expect(long).toHaveLength(254);
    expect(loginSchema.safeParse({ email: long, password: "x" }).success).toBe(
      true,
    );
    expect(
      loginSchema.safeParse({ email: `a${long}`, password: "x" }).success,
    ).toBe(false);
  });
});

describe("registerSchema", () => {
  it("accepts a valid sign-up and trims the name", () => {
    expect(
      registerSchema.parse({ ...validRegister, name: "  Riley  " }).name,
    ).toBe("Riley");
  });

  it("enforces the name length after trimming", () => {
    expect(
      registerSchema.safeParse({ ...validRegister, name: " R " }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ ...validRegister, name: "x".repeat(100) })
        .success,
    ).toBe(true);
    expect(
      registerSchema.safeParse({ ...validRegister, name: "x".repeat(101) })
        .success,
    ).toBe(false);
  });

  it.each([
    ["a1b2c3d", "Use at least 8 characters."],
    [`a1${"x".repeat(71)}`, "Use 72 characters or fewer."],
    ["12345678", "Add at least one letter."],
    ["abcdefgh", "Add at least one number."],
  ])("rejects the password %s", (password, message) => {
    expect(
      firstMessage(registerSchema.safeParse({ ...validRegister, password })),
    ).toBe(message);
  });

  it("accepts passwords of exactly 8 and 72 characters", () => {
    for (const password of ["abcdefg1", `a1${"x".repeat(70)}`]) {
      expect(
        registerSchema.safeParse({ ...validRegister, password }).success,
      ).toBe(true);
    }
  });

  it("offers researcher and program owner, never admin", () => {
    expect(
      registerSchema.safeParse({ ...validRegister, role: "PROGRAM_OWNER" })
        .success,
    ).toBe(true);
    expect(
      firstMessage(
        registerSchema.safeParse({ ...validRegister, role: "ADMIN" }),
      ),
    ).toBe("Pick a role.");
    expect(
      registerSchema.safeParse({ ...validRegister, role: undefined }).success,
    ).toBe(false);
  });
});
