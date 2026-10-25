import { SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { expiresSoon, verifyAccessToken } from "./tokens";

const SECRET = "s".repeat(40);
const NOW = new Date(Date.UTC(2026, 9, 25, 12, 0, 0));
const nowSeconds = NOW.getTime() / 1000;

function sign(
  payload: Record<string, unknown>,
  { secret = SECRET, alg = "HS256", exp = nowSeconds + 900 } = {},
) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt(nowSeconds - 10)
    .setExpirationTime(exp)
    .sign(new TextEncoder().encode(secret));
}

describe("verifyAccessToken", () => {
  it("returns the user id, role, and expiry of a valid token", async () => {
    const token = await sign({ sub: "u1", role: "ADMIN" });
    expect(await verifyAccessToken(token, SECRET, NOW)).toEqual({
      userId: "u1",
      role: "ADMIN",
      exp: nowSeconds + 900,
    });
  });

  it("rejects a token signed with another secret", async () => {
    const token = await sign(
      { sub: "u1", role: "ADMIN" },
      { secret: "x".repeat(40) },
    );
    expect(await verifyAccessToken(token, SECRET, NOW)).toBeNull();
  });

  it("rejects an expired token", async () => {
    const token = await sign(
      { sub: "u1", role: "ADMIN" },
      { exp: nowSeconds - 1 },
    );
    expect(await verifyAccessToken(token, SECRET, NOW)).toBeNull();
  });

  it("rejects an unknown role, a missing subject, and garbage", async () => {
    expect(
      await verifyAccessToken(
        await sign({ sub: "u1", role: "ROOT" }),
        SECRET,
        NOW,
      ),
    ).toBeNull();
    expect(
      await verifyAccessToken(await sign({ role: "ADMIN" }), SECRET, NOW),
    ).toBeNull();
    expect(await verifyAccessToken("not.a.jwt", SECRET, NOW)).toBeNull();
  });

  it("rejects an unsigned token", async () => {
    const header = Buffer.from(JSON.stringify({ alg: "none" })).toString(
      "base64url",
    );
    const body = Buffer.from(
      JSON.stringify({ sub: "u1", role: "ADMIN", exp: nowSeconds + 900 }),
    ).toString("base64url");
    expect(
      await verifyAccessToken(`${header}.${body}.`, SECRET, NOW),
    ).toBeNull();
  });
});

describe("expiresSoon", () => {
  const claims = { userId: "u1", role: "ADMIN" as const, exp: nowSeconds + 60 };

  it("is true inside the margin and false outside it", () => {
    expect(expiresSoon(claims, 60, NOW.getTime())).toBe(true);
    expect(expiresSoon(claims, 30, NOW.getTime())).toBe(false);
  });
});
