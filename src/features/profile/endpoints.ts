import { endpoint } from "@/lib/api/request";
import type { User } from "@/types/api";

export const profileEndpoints = {
  me: () => endpoint<User>({ path: "/users/me" }),
  /** The name is the only field a person can change about their own account. */
  update: (body: { name: string }) =>
    endpoint<User>({ method: "PATCH", path: "/users/me", body }),
};
