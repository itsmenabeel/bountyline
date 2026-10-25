import { endpoint } from "@/lib/api/request";
import type { User } from "@/types/api";

export const profileEndpoints = {
  me: () => endpoint<User>({ path: "/users/me" }),
};
