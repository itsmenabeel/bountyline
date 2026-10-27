import { describe, expect, it } from "vitest";
import { FUNDING_AMOUNT, fundingCents, fundPoolSchema } from "./schemas";

const message = (amount: string) =>
  fundPoolSchema.safeParse({ amount }).error?.issues[0]?.message;

describe("fundPoolSchema", () => {
  it("turns typed dollars into integer cents", () => {
    expect(fundPoolSchema.parse({ amount: "1,500" })).toEqual({
      amount: 150_000,
    });
    expect(fundPoolSchema.parse({ amount: " $2500.5 " })).toEqual({
      amount: 250_050,
    });
  });

  it("asks for an amount when the field is empty", () => {
    expect(message("")).toBe("Enter the amount to add.");
    expect(message("   ")).toBe("Enter the amount to add.");
  });

  it("rejects text that isn't a dollar amount", () => {
    for (const amount of ["abc", "-50", "12.345", "1,50", "1e3"]) {
      expect(message(amount)).toBe("Enter dollars, like 1,500 or 1500.00.");
    }
  });

  it("applies the backend's bounds: $5.00 to $100,000.00", () => {
    expect(message("4.99")).toBe("Add at least $5.00.");
    expect(message("0")).toBe("Add at least $5.00.");
    expect(fundingCents("5")).toBe(FUNDING_AMOUNT.min);
    expect(fundingCents("100,000.00")).toBe(FUNDING_AMOUNT.max);
    expect(message("100000.01")).toBe(
      "Add $100,000.00 or less in one payment.",
    );
  });
});

describe("fundingCents", () => {
  it("returns null for anything the backend would refuse", () => {
    expect(fundingCents("")).toBeNull();
    expect(fundingCents("4")).toBeNull();
    expect(fundingCents("12.345")).toBeNull();
    expect(fundingCents("500")).toBe(50_000);
  });
});
