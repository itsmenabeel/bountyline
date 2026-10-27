import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import type { Endpoint } from "@/lib/api/request";
import type { Program } from "@/types/api";
import {
  CreateProgramFailure,
  createProgram,
  type StageProgress,
} from "./create-program";

const program = { id: "p1", title: "Acme" } as Program;
const input = {
  program: {
    title: "Acme",
    description: "Test the portal.",
    scope: { inScope: ["app.acme.test"], outOfScope: [] },
  },
  tiers: [{ severity: "HIGH" as const, amount: 150_000 }],
};

/** A fake transport that records calls and fails on the nth one (1-based). */
function transport(failOn?: number) {
  const calls: string[] = [];
  const request = async <T>(endpoint: Endpoint<T>): Promise<T> => {
    calls.push(`${endpoint.method} ${endpoint.path}`);
    if (calls.length === failOn) {
      throw new ApiError({ kind: "http", status: 409, message: "Nope" });
    }
    return program as T;
  };
  return { calls, request };
}

describe("createProgram", () => {
  it("creates, sets tiers, and publishes in that order", async () => {
    const { calls, request } = transport();
    const progress: StageProgress[] = [];
    await createProgram({ ...input, publish: true }, request, (p) =>
      progress.push(p),
    );
    expect(calls).toEqual([
      "POST /programs",
      "PUT /programs/p1/reward-tiers",
      "PATCH /programs/p1/status",
    ]);
    expect(progress.at(-1)).toEqual({
      create: "done",
      tiers: "done",
      publish: "done",
    });
  });

  it("stops after the tiers when saving a draft", async () => {
    const { calls, request } = transport();
    const progress: StageProgress[] = [];
    await createProgram({ ...input, publish: false }, request, (p) =>
      progress.push(p),
    );
    expect(calls).toHaveLength(2);
    expect(progress.at(-1)).toEqual({ create: "done", tiers: "done" });
  });

  it("reports a failed create with no program", async () => {
    const { request } = transport(1);
    const failure = await createProgram(
      { ...input, publish: true },
      request,
      () => {},
    ).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(CreateProgramFailure);
    expect(failure).toMatchObject({ stage: "create", program: null });
  });

  it("names the stage that failed after the program exists", async () => {
    const { calls, request } = transport(3);
    const progress: StageProgress[] = [];
    const failure = await createProgram(
      { ...input, publish: true },
      request,
      (p) => progress.push(p),
    ).catch((error: unknown) => error);
    expect(failure).toMatchObject({ stage: "publish", program });
    expect((failure as CreateProgramFailure).error.status).toBe(409);
    expect(calls).toHaveLength(3);
    expect(progress.at(-1)).toEqual({
      create: "done",
      tiers: "done",
      publish: "failed",
    });
  });

  it("turns a network failure into an ApiError", async () => {
    const request = async (): Promise<never> => {
      throw new TypeError("fetch failed");
    };
    const failure = await createProgram(
      { ...input, publish: false },
      request,
      () => {},
    ).catch((error: unknown) => error);
    expect((failure as CreateProgramFailure).error.kind).toBe("network");
  });
});
