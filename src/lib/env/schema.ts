import { z } from "zod";

// No "server-only" here: next.config.ts imports this file to validate at startup.

const secret = (name: string) =>
  z.string().min(32, `${name} must be at least 32 characters`);

const credential = (name: string) => z.string().min(1, `${name} is required`);

export const serverEnvSchema = z.object({
  // Backend base URL including /api/v1, without a trailing slash.
  API_BASE_URL: z.url().transform((url) => url.replace(/\/+$/, "")),
  // Same value as the backend; proxy.ts verifies access tokens with it.
  JWT_ACCESS_SECRET: secret("JWT_ACCESS_SECRET"),
  // Same value as the backend; proves server-side calls come from this app (backend change B2).
  BFF_SHARED_SECRET: secret("BFF_SHARED_SECRET"),
  DEMO_ADMIN_EMAIL: z.email(),
  DEMO_ADMIN_PASSWORD: credential("DEMO_ADMIN_PASSWORD"),
  DEMO_OWNER_EMAIL: z.email(),
  DEMO_OWNER_PASSWORD: credential("DEMO_OWNER_PASSWORD"),
  DEMO_RESEARCHER_EMAIL: z.email(),
  DEMO_RESEARCHER_PASSWORD: credential("DEMO_RESEARCHER_PASSWORD"),
});

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z
    .url()
    .default("http://localhost:3000")
    .transform((url) => url.replace(/\/+$/, "")),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z
    .string()
    .min(1, "NEXT_PUBLIC_GOOGLE_CLIENT_ID is required"),
  NEXT_PUBLIC_CONTACT_EMAIL: z.email(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type PublicEnv = z.infer<typeof publicEnvSchema>;

export class EnvError extends Error {
  constructor(scope: "server" | "public", error: z.ZodError) {
    super(
      `Invalid ${scope} environment. Check .env.local against .env.example.\n${z.prettifyError(error)}`,
    );
    this.name = "EnvError";
  }
}

export function parseServerEnv(source: Record<string, string | undefined>) {
  const parsed = serverEnvSchema.safeParse(source);
  if (!parsed.success) throw new EnvError("server", parsed.error);
  return parsed.data;
}

export function parsePublicEnv(source: Record<string, string | undefined>) {
  const parsed = publicEnvSchema.safeParse(source);
  if (!parsed.success) throw new EnvError("public", parsed.error);
  return parsed.data;
}
