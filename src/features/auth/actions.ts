"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { type ZodError, z } from "zod";
import { backendRequest } from "@/lib/api/backend";
import { isApiError } from "@/lib/api/errors";
import type { Endpoint } from "@/lib/api/request";
import {
  clearSessionCookies,
  readSessionCookies,
  writeSessionCookies,
} from "@/lib/auth/cookies";
import { homeFor, safeNextPath } from "@/lib/auth/roles";
import { serverEnv } from "@/lib/env/server";
import { type AuthResult, ROLES, type Role } from "@/types/api";
import { authEndpoints } from "./endpoints";
import {
  type LoginValues,
  loginSchema,
  type RegisterValues,
  registerSchema,
  SIGNUP_ROLES,
  type SignupRole,
} from "./schemas";

// Server actions are public HTTP endpoints, so each one parses its own input. Tokens go
// straight into httpOnly cookies; the browser gets a redirect or an AuthFailure, never a token.

/** What an auth action returns when it fails. On success it redirects instead. */
export interface AuthFailure {
  ok: false;
  message: string;
  /** Field name to message, from client-side parsing or a backend 422. */
  fieldErrors: Record<string, string>;
}

type StatusCopy = Partial<Record<number, string>>;

const CHECK_FIELDS = "Check the highlighted fields and try again.";

const LOGIN_COPY: StatusCopy = {
  401: "That email and password don't match an account. If you signed up with Google, use the Google button.",
  403: "An admin disabled this account. Use the contact page if you think that's a mistake.",
};

const GOOGLE_RETRY =
  "Google couldn't confirm that sign-in. Try again, or use your email and password.";

const GOOGLE_COPY: StatusCopy = {
  401: GOOGLE_RETRY,
  403: LOGIN_COPY[403],
  409: "This email belongs to an account linked to a different Google account.",
  503: "Google sign-in is unavailable right now. Use your email and password.",
};

const REGISTER_COPY: StatusCopy = {
  409: "That email already has an account. Sign in instead, or use a different email.",
};

const DEMO_COPY: StatusCopy = {
  401: "The saved password for this demo account is out of date. Try another demo account.",
  403: "An admin disabled this demo account. Try another demo account.",
};

const LOGOUT_TIMEOUT_MS = 5_000;

function failure(
  message: string,
  fieldErrors: Record<string, string> = {},
): AuthFailure {
  return { ok: false, message, fieldErrors };
}

function invalidInput(error: ZodError): AuthFailure {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    fieldErrors[issue.path.join(".")] ??= issue.message;
  }
  return failure(CHECK_FIELDS, fieldErrors);
}

/** Calls a login-style endpoint, stores the tokens, and sends the user to their area. */
async function startSession(
  target: Endpoint<AuthResult>,
  copy: StatusCopy,
  next?: unknown,
): Promise<AuthFailure> {
  let role: Role;
  try {
    const result = await backendRequest(target, { incoming: await headers() });
    writeSessionCookies(await cookies(), result);
    role = result.user.role;
  } catch (error) {
    if (!isApiError(error)) throw error;
    if (error.status === 422 && error.hasFieldErrors) {
      return failure(CHECK_FIELDS, error.fieldErrors);
    }
    return failure(copy[error.status] ?? error.userMessage);
  }
  // redirect() works by throwing, so it stays outside the try block.
  redirect(safeNextPath(next, role) ?? homeFor(role));
}

/** Email and password sign-in. `next` is honored only inside the user's own area. */
export async function login(
  values: LoginValues,
  next?: string,
): Promise<AuthFailure> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) return invalidInput(parsed.error);
  return startSession(authEndpoints.login(parsed.data), LOGIN_COPY, next);
}

const demoRoleSchema = z.enum(ROLES);

function demoCredentials(role: Role) {
  switch (role) {
    case "ADMIN":
      return {
        email: serverEnv.DEMO_ADMIN_EMAIL,
        password: serverEnv.DEMO_ADMIN_PASSWORD,
      };
    case "PROGRAM_OWNER":
      return {
        email: serverEnv.DEMO_OWNER_EMAIL,
        password: serverEnv.DEMO_OWNER_PASSWORD,
      };
    case "RESEARCHER":
      return {
        email: serverEnv.DEMO_RESEARCHER_EMAIL,
        password: serverEnv.DEMO_RESEARCHER_PASSWORD,
      };
  }
}

/** One-click demo sign-in. The client sends only the role; credentials stay in server env. */
export async function demoLogin(
  role: Role,
  next?: string,
): Promise<AuthFailure> {
  const parsed = demoRoleSchema.safeParse(role);
  if (!parsed.success) return failure("Pick one of the three demo accounts.");
  return startSession(
    authEndpoints.login(demoCredentials(parsed.data)),
    DEMO_COPY,
    next,
  );
}

const googleSchema = z.object({
  idToken: z.string().min(1),
  role: z.enum(SIGNUP_ROLES).optional(),
});

/**
 * Signs in with the ID token from Google's button. An existing account with the same
 * verified email gets linked; otherwise the backend creates one with `role` (researcher
 * when omitted). `next` works as in `login`.
 */
export async function googleLogin(
  input: { idToken: string; role?: SignupRole },
  next?: string,
): Promise<AuthFailure> {
  const parsed = googleSchema.safeParse(input);
  if (!parsed.success) return failure(GOOGLE_RETRY);
  return startSession(authEndpoints.google(parsed.data), GOOGLE_COPY, next);
}

/** Creates a researcher or program owner account and signs it in. */
export async function register(values: RegisterValues): Promise<AuthFailure> {
  const parsed = registerSchema.safeParse(values);
  if (!parsed.success) return invalidInput(parsed.error);
  return startSession(authEndpoints.register(parsed.data), REGISTER_COPY);
}

/** Revokes the refresh token, clears both cookies, and returns to /login. */
export async function logout() {
  const store = await cookies();
  const { refreshToken } = readSessionCookies(store);
  if (refreshToken) {
    // The cookies go either way, and a token the backend didn't revoke expires on its own,
    // so a slow or failed call shouldn't keep anyone signed in.
    await backendRequest(authEndpoints.logout(refreshToken), {
      incoming: await headers(),
      timeoutMs: LOGOUT_TIMEOUT_MS,
    }).catch(() => undefined);
  }
  clearSessionCookies(store);
  redirect("/login");
}
