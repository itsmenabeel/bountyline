import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { createQueryClient, shouldRetry } from "./query-client";

const http = (status: number) =>
  new ApiError({ kind: "http", status, message: `HTTP ${status}` });

describe("shouldRetry", () => {
  it("retries network failures, timeouts, and 5xx up to twice", () => {
    for (const error of [
      new ApiError({ kind: "network" }),
      new ApiError({ kind: "timeout" }),
      http(500),
      http(503),
      new TypeError("fetch failed"),
    ]) {
      expect(shouldRetry(0, error)).toBe(true);
      expect(shouldRetry(1, error)).toBe(true);
      expect(shouldRetry(2, error)).toBe(false);
    }
  });

  it("never retries 4xx, including 429", () => {
    for (const status of [400, 401, 403, 404, 409, 422, 429]) {
      expect(shouldRetry(0, http(status))).toBe(false);
    }
  });
});

describe("createQueryClient", () => {
  it("reports a failed refresh of shown data, not a failed first load", async () => {
    const onBackgroundError = vi.fn();
    const client = createQueryClient(
      { onBackgroundError },
      { queries: { retry: false } },
    );

    await client
      .fetchQuery({
        queryKey: ["first"],
        queryFn: () => Promise.reject(http(500)),
      })
      .catch(() => undefined);
    expect(onBackgroundError).not.toHaveBeenCalled();

    client.setQueryData(["shown"], { ok: true });
    await client
      .fetchQuery({
        queryKey: ["shown"],
        queryFn: () => Promise.reject(http(503)),
        staleTime: 0,
      })
      .catch(() => undefined);
    expect(onBackgroundError).toHaveBeenCalledTimes(1);
    expect(onBackgroundError.mock.calls[0]?.[0]).toBeInstanceOf(ApiError);
  });

  it("skips the mutation toast when meta.silentToast is set", async () => {
    const onMutationError = vi.fn();
    const client = createQueryClient({ onMutationError });
    const failing = () => Promise.reject(http(409));

    await client
      .getMutationCache()
      .build(client, { mutationFn: failing })
      .execute(undefined)
      .catch(() => undefined);
    await client
      .getMutationCache()
      .build(client, { mutationFn: failing, meta: { silentToast: true } })
      .execute(undefined)
      .catch(() => undefined);

    expect(onMutationError).toHaveBeenCalledTimes(1);
    expect(onMutationError.mock.calls[0]?.[0].status).toBe(409);
  });
});
