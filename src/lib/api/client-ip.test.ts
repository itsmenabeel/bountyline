import { describe, expect, it } from "vitest";
import { clientIpFrom } from "./client-ip";

describe("clientIpFrom", () => {
  it("prefers x-real-ip", () => {
    const headers = new Headers({
      "x-real-ip": " 203.0.113.7 ",
      "x-forwarded-for": "198.51.100.1, 10.0.0.1",
    });
    expect(clientIpFrom(headers)).toBe("203.0.113.7");
  });

  it("falls back to the first x-forwarded-for entry", () => {
    const headers = new Headers({
      "x-forwarded-for": "198.51.100.1, 10.0.0.1",
    });
    expect(clientIpFrom(headers)).toBe("198.51.100.1");
  });

  it("returns undefined when neither header has a value", () => {
    expect(clientIpFrom(new Headers())).toBeUndefined();
    expect(clientIpFrom(new Headers({ "x-forwarded-for": " , " }))).toBe(
      undefined,
    );
  });
});
