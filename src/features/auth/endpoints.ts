import { endpoint } from "@/lib/api/request";
import type { AuthResult } from "@/types/api";
import type { LoginInput, RegisterInput } from "./schemas";

export const authEndpoints = {
  login: (body: LoginInput) =>
    endpoint<AuthResult>({ method: "POST", path: "/auth/login", body }),
  register: (body: RegisterInput) =>
    endpoint<AuthResult>({ method: "POST", path: "/auth/register", body }),
  logout: (refreshToken: string) =>
    endpoint<unknown>({
      method: "POST",
      path: "/auth/logout",
      body: { refreshToken },
    }),
};
