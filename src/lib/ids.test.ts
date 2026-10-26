import { describe, expect, it } from "vitest";
import { isUuid, shortId } from "./ids";

describe("isUuid", () => {
  it("accepts the backend's ids and rejects anything else", () => {
    expect(isUuid("8f2c1a3b-0d4e-4f5a-9b6c-7d8e9f0a1b2c")).toBe(true);
    expect(isUuid("8F2C1A3B-0D4E-4F5A-9B6C-7D8E9F0A1B2C")).toBe(true);
    expect(isUuid("not-an-id")).toBe(false);
    expect(isUuid("8f2c1a3b-0d4e-4f5a-9b6c-7d8e9f0a1b2c/../x")).toBe(false);
  });
});

describe("shortId", () => {
  it("takes the first six hex digits, uppercased, after the prefix", () => {
    expect(shortId("8f2c1a3b-0d4e-4f5a-9b6c-7d8e9f0a1b2c", "R")).toBe(
      "R-8F2C1A",
    );
  });
});
