import { endpoint } from "@/lib/api/request";
import type { AuthResult, TokenPair } from "@/types/api";
import type { LoginInput, RegisterInput, SignupRole } from "./schemas";

export const authEndpoints = {
  login: (body: LoginInput) =>
    endpoint<AuthResult>({ method: "POST", path: "/auth/login", body }),
  register: (body: RegisterInput) =>
    endpoint<AuthResult>({ method: "POST", path: "/auth/register", body }),
  /** `role` applies only when Google creates a new account. */
  google: (body: { idToken: string; role?: SignupRole }) =>
    endpoint<AuthResult>({ method: "POST", path: "/auth/google", body }),
  refresh: (refreshToken: string) =>
    endpoint<TokenPair>({
      method: "POST",
      path: "/auth/refresh-token",
      body: { refreshToken },
    }),
  logout: (refreshToken: string) =>
    endpoint<unknown>({
      method: "POST",
      path: "/auth/logout",
      body: { refreshToken },
    }),
};
