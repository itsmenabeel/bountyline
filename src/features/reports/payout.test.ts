import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import {
  INSUFFICIENT_POOL_MESSAGE,
  payoutConfirmText,
  payoutDoneText,
  payoutPlan,
  rewardFailureMessage,
} from "./payout";

describe("payoutPlan", () => {
  it("covers a tier the pool can pay and gives the pool after", () => {
    expect(payoutPlan({ amount: 150_000, poolBalance: 1_000_000 })).toEqual({
      covered: true,
      poolAfter: 850_000,
      shortfall: 0,
    });
  });

  it("counts a pool that matches the tier exactly as covered", () => {
    expect(payoutPlan({ amount: 50_000, poolBalance: 50_000 })).toMatchObject({
      covered: true,
      poolAfter: 0,
    });
  });

  it("reports the shortfall when the pool is too small", () => {
    expect(payoutPlan({ amount: 660_000, poolBalance: 340_000 })).toMatchObject(
      { covered: false, shortfall: 320_000 },
    );
  });
});

describe("payout copy", () => {
  const parties = {
    researcher: "Riley Researcher",
    program: "Acme Web Application",
    amount: 150_000,
  };

  it("asks with the researcher, amount, and pool after (design-plan §12)", () => {
    expect(payoutConfirmText({ ...parties, poolAfter: 850_000 })).toBe(
      "Pay Riley Researcher $1,500.00 from Acme Web Application's pool? The pool drops to $8,500.00. You can't undo a payout.",
    );
  });

  it("confirms with the pool the backend reports", () => {
    expect(payoutDoneText({ ...parties, poolBalance: 850_000 })).toBe(
      "Paid Riley Researcher $1,500.00. Acme Web Application's pool now holds $8,500.00.",
    );
  });
});

describe("rewardFailureMessage", () => {
  const conflict = (code?: "INSUFFICIENT_POOL" | "ALREADY_REWARDED") =>
    new ApiError({ kind: "http", status: 409, message: "Conflict", code });

  it("maps the backend's 409 codes to their own copy", () => {
    expect(rewardFailureMessage(conflict("INSUFFICIENT_POOL"))).toBe(
      INSUFFICIENT_POOL_MESSAGE,
    );
    expect(rewardFailureMessage(conflict("ALREADY_REWARDED"))).toBe(
      "This report has already been paid.",
    );
  });

  it("treats another 409 as a report that moved on", () => {
    expect(rewardFailureMessage(conflict())).toMatch(/^Someone changed/);
  });

  it("names the action for other failures", () => {
    expect(
      rewardFailureMessage(new ApiError({ kind: "http", status: 500 })),
    ).toBe(
      "We couldn't pay this report. Something went wrong on our side. Try again in a minute.",
    );
  });
});
