import "server-only";
import { cache } from "react";
import { profileEndpoints } from "@/features/profile/endpoints";
import { serverRequest } from "@/lib/api/server";

/**
 * The signed-in user from GET /users/me, read once per request however many components ask.
 * Role and ban status come from the database, not the token. Call it inside a <Suspense>
 * boundary: it reads cookies.
 */
export const getCurrentUser = cache(() => serverRequest(profileEndpoints.me()));
