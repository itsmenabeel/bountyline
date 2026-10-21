import { describe, expect, it } from "vitest";
import { EnvError, parsePublicEnv, parseServerEnv } from "./schema";

const validServer = {
  API_BASE_URL: "https://api.example.test/api/v1/",
  JWT_ACCESS_SECRET: "a".repeat(32),
  BFF_SHARED_SECRET: "b".repeat(48),
  DEMO_ADMIN_EMAIL: "admin@bugbounty.dev",
  DEMO_ADMIN_PASSWORD: "Admin@12345",
  DEMO_OWNER_EMAIL: "owner@bugbounty.dev",
  DEMO_OWNER_PASSWORD: "Demo@12345",
  DEMO_RESEARCHER_EMAIL: "researcher@bugbounty.dev",
  DEMO_RESEARCHER_PASSWORD: "Demo@12345",
};

describe("parseServerEnv", () => {
  it("accepts a complete environment and trims the trailing slash", () => {
    expect(parseServerEnv(validServer).API_BASE_URL).toBe(
      "https://api.example.test/api/v1",
    );
  });

  it("rejects a short secret and names the variable", () => {
    expect(() =>
      parseServerEnv({ ...validServer, BFF_SHARED_SECRET: "short" }),
    ).toThrow(/BFF_SHARED_SECRET/);
  });

  it("rejects a missing variable with an EnvError", () => {
    const { DEMO_ADMIN_PASSWORD: _, ...missing } = validServer;
    expect(() => parseServerEnv(missing)).toThrow(EnvError);
  });
});

describe("parsePublicEnv", () => {
  it("defaults the site URL for local development", () => {
    const env = parsePublicEnv({
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: "client.apps.googleusercontent.com",
      NEXT_PUBLIC_CONTACT_EMAIL: "nabeel23456787@gmail.com",
    });
    expect(env.NEXT_PUBLIC_SITE_URL).toBe("http://localhost:3000");
  });

  it("rejects a malformed contact email", () => {
    expect(() =>
      parsePublicEnv({
        NEXT_PUBLIC_GOOGLE_CLIENT_ID: "client.apps.googleusercontent.com",
        NEXT_PUBLIC_CONTACT_EMAIL: "not-an-email",
      }),
    ).toThrow(/NEXT_PUBLIC_CONTACT_EMAIL/);
  });
});
