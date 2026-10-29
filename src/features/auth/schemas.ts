import { z } from "zod";

// Mirrors bug-bounty-platform src/modules/auth/auth.validation.ts. The server actions parse
// with these too, so the backend receives the trimmed, lowercased values.

export const SIGNUP_ROLES = ["RESEARCHER", "PROGRAM_OWNER"] as const;
export type SignupRole = (typeof SIGNUP_ROLES)[number];

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

const HAS_LETTER = /[A-Za-z]/;
const HAS_DIGIT = /\d/;

/** The live checklist under the sign-up password field. Same rules as `registerSchema`. */
export const PASSWORD_RULES = [
  {
    id: "length",
    label: `${PASSWORD_MIN} to ${PASSWORD_MAX} characters`,
    test: (value: string) =>
      value.length >= PASSWORD_MIN && value.length <= PASSWORD_MAX,
  },
  {
    id: "letter",
    label: "A letter",
    test: (value: string) => HAS_LETTER.test(value),
  },
  {
    id: "number",
    label: "A number",
    test: (value: string) => HAS_DIGIT.test(value),
  },
] as const;

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter your email address.")
  .pipe(
    z
      .email("Enter a valid email address.")
      .max(254, "Use 254 characters or fewer."),
  );

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});

/** A display name, 2 to 100 characters (backend register and PATCH /users/me). */
export const nameSchema = z
  .string()
  .trim()
  .min(1, { error: "Enter your name.", abort: true })
  .min(2, "Enter at least 2 characters.")
  .max(100, "Use 100 characters or fewer.");

export const registerSchema = z.object({
  name: nameSchema,
  email,
  password: z
    .string()
    .min(1, { error: "Create a password.", abort: true })
    .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters.`)
    .max(PASSWORD_MAX, `Use ${PASSWORD_MAX} characters or fewer.`)
    .regex(HAS_LETTER, "Add at least one letter.")
    .regex(HAS_DIGIT, "Add at least one number."),
  role: z.enum(SIGNUP_ROLES, "Pick a role."),
});

export type LoginValues = z.input<typeof loginSchema>;
export type LoginInput = z.output<typeof loginSchema>;
export type RegisterValues = z.input<typeof registerSchema>;
export type RegisterInput = z.output<typeof registerSchema>;
