import { describe, expect, it } from "vitest";
import { formatDate, initials, plainExcerpt } from "./format";

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

describe("formatDate", () => {
  it("formats in UTC so server and browser agree", () => {
    expect(formatDate("2026-10-12T09:14:00.000Z")).toBe("Oct 12, 2026");
    expect(formatDate("2026-10-12T23:59:59.000Z")).toBe("Oct 12, 2026");
  });
});

describe("plainExcerpt", () => {
  it("strips Markdown syntax and joins lines", () => {
    expect(
      plainExcerpt(
        "## Scope\n\nTest **only** the `api` host.\n- See [rules](https://x.test)",
      ),
    ).toBe("Scope Test only the api host. See rules");
  });
});
