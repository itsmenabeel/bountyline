import { describe, expect, it } from "vitest";
import { initials } from "./format";

describe("initials", () => {
  it("takes the first and last word", () => {
    expect(initials("Riley Researcher")).toBe("RR");
    expect(initials("Mary Ann van Dyke")).toBe("MD");
  });

  it("handles one word, extra spaces, and lowercase", () => {
    expect(initials("priya")).toBe("P");
    expect(initials("  sam   lee ")).toBe("SL");
  });

  it("keeps a non-Latin first character whole", () => {
    expect(initials("Émile Zola")).toBe("ÉZ");
    expect(initials("𝒜da Byron")).toBe("𝒜B");
  });

  it("falls back to a question mark for an empty name", () => {
    expect(initials("   ")).toBe("?");
  });
});
