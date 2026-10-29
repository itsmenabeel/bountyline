import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import type { PaymentStatus } from "@/types/api";
import { paymentListParams } from "./params";
import {
  checkStatusMessage,
  paymentOutcome,
  VERIFY_DELAYS_MS,
  verifyFailureMessage,
} from "./verify";

const payment = (status: PaymentStatus) => ({
  status,
  amount: 150_000,
  program: { id: "p1", title: "Acme Web Application" },
});

describe("paymentOutcome", () => {
  it("names the amount and the pool once the payment clears", () => {
    expect(paymentOutcome(payment("SUCCEEDED"))).toEqual({
      title: "Payment received",
      message: "$1,500.00 added to Acme Web Application's pool.",
    });
  });

  it("says Stripe is still confirming a pending payment", () => {
    expect(paymentOutcome(payment("PENDING")).message).toBe(
      "Stripe is still confirming the payment. We'll update the pool when it clears.",
    );
  });

  it("tells the owner the pool didn't change on a failure or an expired checkout", () => {
    expect(paymentOutcome(payment("FAILED")).message).toContain(
      "Acme Web Application's pool stays as it was",
    );
    expect(paymentOutcome(payment("CANCELLED")).message).toContain(
      "didn't charge your card",
    );
  });
});

describe("checkStatusMessage", () => {
  it("reuses the success sentence and has its own line for every other status", () => {
    expect(checkStatusMessage(payment("SUCCEEDED"))).toBe(
      "$1,500.00 added to Acme Web Application's pool.",
    );
    const others = (["PENDING", "FAILED", "CANCELLED"] as const).map((status) =>
      checkStatusMessage(payment(status)),
    );
    expect(new Set(others).size).toBe(3);
  });
});

describe("verifyFailureMessage", () => {
  it("has its own copy for Stripe being down and a missing payment", () => {
    expect(
      verifyFailureMessage(new ApiError({ kind: "http", status: 502 })),
    ).toBe("Stripe isn't answering right now. Try again in a minute.");
    expect(
      verifyFailureMessage(new ApiError({ kind: "http", status: 404 })),
    ).toBe("We couldn't find this payment.");
  });

  it("falls back to the general message for anything else", () => {
    expect(verifyFailureMessage(new ApiError({ kind: "network" }))).toBe(
      "We couldn't check with Stripe. We couldn't reach the server. Check your connection and try again.",
    );
  });
});

describe("VERIFY_DELAYS_MS", () => {
  it("backs off over three tries", () => {
    expect(VERIFY_DELAYS_MS).toEqual([2000, 4000, 8000]);
  });
});

describe("paymentListParams", () => {
  it("defaults to newest first with no filters", () => {
    expect(paymentListParams.parse({})).toEqual({
      page: 1,
      limit: 10,
      sortBy: "createdAt",
      order: "desc",
      search: undefined,
      status: undefined,
      programId: undefined,
    });
  });

  it("drops values the backend would answer with a 422", () => {
    const params = paymentListParams.parse({
      sortBy: "title",
      status: "PAID",
      programId: "not-a-uuid",
    });
    expect(params.sortBy).toBe("createdAt");
    expect(params.status).toBeUndefined();
    expect(params.programId).toBeUndefined();
  });

  it("keeps a known status, sort, and program id", () => {
    const programId = "8f2c1a3e-1111-4222-8333-444455556666";
    expect(
      paymentListParams.parse({
        sortBy: "amount",
        status: "PENDING",
        programId,
      }),
    ).toMatchObject({ sortBy: "amount", status: "PENDING", programId });
  });
});
