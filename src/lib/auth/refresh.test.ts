import { describe, expect, it, vi } from "vitest";
import { createRefresher, type RefreshOutcome } from "./refresh";

const rotated = (n: number): RefreshOutcome => ({
  status: "ok",
  tokens: { accessToken: `at${n}`, refreshToken: `rt${n}` },
});

describe("createRefresher", () => {
  it("shares one exchange between concurrent callers with the same token", async () => {
    const exchange = vi.fn(async () => rotated(1));
    const refresh = createRefresher(exchange);

    const results = await Promise.all([
      refresh("rt0"),
      refresh("rt0"),
      refresh("rt0"),
    ]);

    expect(exchange).toHaveBeenCalledTimes(1);
    expect(results).toEqual([rotated(1), rotated(1), rotated(1)]);
  });

  it("replays a rotation for 10 seconds, then exchanges again", async () => {
    let clock = 0;
    let calls = 0;
    const exchange = vi.fn(async () => rotated(++calls));
    const refresh = createRefresher(exchange, { now: () => clock });

    await refresh("rt0");
    clock = 9_000;
    expect(await refresh("rt0")).toEqual(rotated(1));
    clock = 10_001;
    expect(await refresh("rt0")).toEqual(rotated(2));
    expect(exchange).toHaveBeenCalledTimes(2);
  });

  it("doesn't cache failures, so the next caller tries again", async () => {
    const exchange = vi
      .fn<(token: string) => Promise<RefreshOutcome>>()
      .mockResolvedValueOnce({ status: "unavailable" })
      .mockResolvedValueOnce(rotated(1));
    const refresh = createRefresher(exchange);

    expect(await refresh("rt0")).toEqual({ status: "unavailable" });
    expect(await refresh("rt0")).toEqual(rotated(1));
  });

  it("turns a thrown exchange into 'unavailable'", async () => {
    const refresh = createRefresher(async () => {
      throw new TypeError("fetch failed");
    });
    expect(await refresh("rt0")).toEqual({ status: "unavailable" });
  });

  it("keeps different tokens apart", async () => {
    const exchange = vi.fn(async (token: string) =>
      rotated(token === "a" ? 1 : 2),
    );
    const refresh = createRefresher(exchange);
    expect(await refresh("a")).toEqual(rotated(1));
    expect(await refresh("b")).toEqual(rotated(2));
  });
});
