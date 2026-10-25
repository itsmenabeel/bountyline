import { z } from "zod";

// Mirrors bug-bounty-platform src/modules/auth/auth.validation.ts. The server actions parse
// with these too, so the backend receives the trimmed, lowercased values.

export const SIGNUP_ROLES = ["RESEARCHER", "PROGRAM_OWNER"] as const;
export type SignupRole = (typeof SIGNUP_ROLES)[number];

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(
    z
      .email("Enter a valid email address.")
      .max(254, "Use 254 characters or fewer."),
  );

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter at least 2 characters.")
    .max(100, "Use 100 characters or fewer."),
  email,
  password: z
    .string()
    .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters.`)
    .max(PASSWORD_MAX, `Use ${PASSWORD_MAX} characters or fewer.`)
    .regex(/[A-Za-z]/, "Add at least one letter.")
    .regex(/\d/, "Add at least one number."),
  role: z.enum(SIGNUP_ROLES, "Pick a role."),
});

export type LoginValues = z.input<typeof loginSchema>;
export type LoginInput = z.output<typeof loginSchema>;
export type RegisterValues = z.input<typeof registerSchema>;
export type RegisterInput = z.output<typeof registerSchema>;
