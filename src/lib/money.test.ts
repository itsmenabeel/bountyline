import { describe, expect, it } from "vitest";
import { formatMoney } from "./money";

describe("formatMoney", () => {
  it("formats cents as US dollars with two decimals", () => {
    expect(formatMoney(150_000)).toBe("$1,500.00");
    expect(formatMoney(5)).toBe("$0.05");
    expect(formatMoney(0)).toBe("$0.00");
  });

  it("keeps large pools exact", () => {
    expect(formatMoney(10_000_000_00)).toBe("$10,000,000.00");
    expect(formatMoney(340_099)).toBe("$3,400.99");
  });
});
