import { describe, expect, it } from "vitest";
import {
  ACCESS_COOKIE,
  type CookieStore,
  clearSessionCookies,
  REFRESH_COOKIE,
  readSessionCookies,
  type SessionCookieOptions,
  secondsUntilExpiry,
  writeSessionCookies,
} from "./cookies";

const NOW = Date.UTC(2026, 9, 25, 12, 0, 0);
const nowSeconds = NOW / 1000;

// Unsigned JWTs are enough here: the cookie code reads `exp` and never verifies.
const base64url = (value: object) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");
const jwt = (payload: object) =>
  `${base64url({ alg: "HS256", typ: "JWT" })}.${base64url(payload)}.signature`;

function memoryStore() {
  const jar = new Map<
    string,
    { value: string; options: SessionCookieOptions }
  >();
  const store: CookieStore = {
    get: (name) => jar.get(name),
    set: (name, value, options) => jar.set(name, { value, options }),
  };
  return { jar, store };
}

describe("secondsUntilExpiry", () => {
  it("counts down to the token's exp", () => {
    expect(secondsUntilExpiry(jwt({ exp: nowSeconds + 900 }), 1, NOW)).toBe(
      900,
    );
  });

  it("returns 0 for an expired token", () => {
    expect(secondsUntilExpiry(jwt({ exp: nowSeconds - 5 }), 1, NOW)).toBe(0);
  });

  it("falls back when the token is unreadable or has no exp", () => {
    expect(secondsUntilExpiry("not-a-jwt", 42, NOW)).toBe(42);
    expect(secondsUntilExpiry(jwt({ sub: "u1" }), 42, NOW)).toBe(42);
  });
});

describe("writeSessionCookies", () => {
  it("sets both httpOnly cookies, each expiring with its token", () => {
    const { jar, store } = memoryStore();
    const accessToken = jwt({
      sub: "u1",
      role: "ADMIN",
      exp: nowSeconds + 900,
    });
    const refreshToken = jwt({ sub: "u1", exp: nowSeconds + 604_800 });

    writeSessionCookies(store, { accessToken, refreshToken }, NOW);

    expect(jar.get(ACCESS_COOKIE)).toEqual({
      value: accessToken,
      options: {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 900,
      },
    });
    expect(jar.get(REFRESH_COOKIE)?.options.maxAge).toBe(604_800);
    expect(readSessionCookies(store)).toEqual({ accessToken, refreshToken });
  });
});

describe("clearSessionCookies", () => {
  it("expires both cookies", () => {
    const { jar, store } = memoryStore();
    writeSessionCookies(store, { accessToken: "a", refreshToken: "r" }, NOW);

    clearSessionCookies(store);

    for (const name of [ACCESS_COOKIE, REFRESH_COOKIE]) {
      expect(jar.get(name)?.value).toBe("");
      expect(jar.get(name)?.options.maxAge).toBe(0);
    }
    expect(readSessionCookies(store)).toEqual({
      accessToken: undefined,
      refreshToken: undefined,
    });
  });
});
