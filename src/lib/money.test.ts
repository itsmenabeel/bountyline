import { describe, expect, it } from "vitest";
import { formatDollars, formatMoney, parseDollarsToCents } from "./money";

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

describe("formatDollars", () => {
  it("leaves the currency sign to the field's prefix", () => {
    expect(formatDollars(150_000)).toBe("1,500.00");
    expect(formatDollars(50)).toBe("0.50");
  });
});

describe("parseDollarsToCents", () => {
  it("reads whole dollars, with or without thousands commas", () => {
    expect(parseDollarsToCents("1500")).toBe(150_000);
    expect(parseDollarsToCents("1,500")).toBe(150_000);
    expect(parseDollarsToCents("1,000,000")).toBe(100_000_000);
  });

  it("reads one or two decimals without float error", () => {
    expect(parseDollarsToCents("1,250.5")).toBe(125_050);
    expect(parseDollarsToCents("0.29")).toBe(29);
    expect(parseDollarsToCents("19.99")).toBe(1_999);
    expect(parseDollarsToCents(".5")).toBe(50);
    expect(parseDollarsToCents("12.")).toBe(1_200);
  });

  it("accepts a leading dollar sign and surrounding spaces", () => {
    expect(parseDollarsToCents(" $1,500.00 ")).toBe(150_000);
    expect(parseDollarsToCents("$ 20")).toBe(2_000);
  });

  it("rejects anything that isn't a plain amount", () => {
    for (const input of [
      "",
      "  ",
      ".",
      "$",
      "-5",
      "1.234",
      "1,50",
      "15,00.00",
      "1e3",
      "abc",
      "12 50",
    ]) {
      expect(parseDollarsToCents(input), input).toBeNull();
    }
  });
});
