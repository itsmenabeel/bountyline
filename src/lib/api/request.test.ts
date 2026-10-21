import { describe, expect, it } from "vitest";
import { ApiError, toApiError } from "./errors";
import {
  endpoint,
  endpointPath,
  listEndpoint,
  readEnvelope,
  resolveEnvelope,
  toSearchParams,
} from "./request";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("toSearchParams", () => {
  it("drops undefined, null, and empty values", () => {
    const params = toSearchParams({
      page: 2,
      mine: true,
      search: "",
      status: undefined,
      severity: null,
    });
    expect(params.toString()).toBe("page=2&mine=true");
  });
});

describe("endpointPath", () => {
  it("appends the query string only when there is one", () => {
    expect(endpointPath(endpoint({ path: "/users/me" }))).toBe("/users/me");
    expect(
      endpointPath(
        listEndpoint({
          path: "/programs",
          query: { page: 1, search: "acme web" },
        }),
      ),
    ).toBe("/programs?page=1&search=acme+web");
  });
});

describe("readEnvelope and resolveEnvelope", () => {
  it("returns the data of a single endpoint", async () => {
    const target = endpoint<{ id: string }>({ path: "/users/me" });
    const envelope = await readEnvelope(
      json(200, { success: true, message: "ok", data: { id: "u1" } }),
    );
    expect(resolveEnvelope(target, envelope)).toEqual({ id: "u1" });
  });

  it("returns items and meta for a list endpoint", async () => {
    const meta = { page: 2, limit: 10, total: 11, totalPages: 2 };
    const target = listEndpoint<{ id: string }>({ path: "/programs" });
    const envelope = await readEnvelope(
      json(200, { success: true, message: "ok", data: [{ id: "p1" }], meta }),
    );
    expect(resolveEnvelope(target, envelope)).toEqual({
      items: [{ id: "p1" }],
      meta,
    });
  });

  it("maps 422 issues to field errors without the request-part prefix", async () => {
    const failure = {
      success: false,
      message: "Validation failed",
      errors: [
        { path: "body.title", message: "Too short" },
        { path: "body.title", message: "Second message is ignored" },
        { path: "body.scope.inScope.0", message: "Required" },
        { path: "query.limit", message: "Too big" },
      ],
    };
    const error = await readEnvelope(json(422, failure)).catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(ApiError);
    const apiError = error as ApiError;
    expect(apiError.status).toBe(422);
    expect(apiError.fieldErrors).toEqual({
      title: "Too short",
      "scope.inScope.0": "Required",
      limit: "Too big",
    });
    expect(apiError.userMessage).toBe("Validation failed");
  });

  it("keeps the 409 code from payout conflicts", async () => {
    const failure = {
      success: false,
      message: "The program pool cannot cover this reward",
      errors: [{ code: "INSUFFICIENT_POOL" }],
    };
    const error = (await readEnvelope(json(409, failure)).catch(
      (e: unknown) => e,
    )) as ApiError;
    expect(error.code).toBe("INSUFFICIENT_POOL");
    expect(error.hasFieldErrors).toBe(false);
  });

  it("treats a non-JSON body, like a proxy error page, as an invalid response", async () => {
    const error = (await readEnvelope(
      new Response("<html>Bad gateway</html>", { status: 502 }),
    ).catch((e: unknown) => e)) as ApiError;
    expect(error.kind).toBe("invalid_response");
    expect(error.status).toBe(502);
  });
});

describe("ApiError.userMessage", () => {
  it("replaces rate-limit and internal error text with copy written for people", () => {
    const limited = new ApiError({
      kind: "http",
      status: 429,
      message: "Too many requests",
    });
    const internal = new ApiError({
      kind: "http",
      status: 500,
      message: "Internal server error",
    });
    const stripe = new ApiError({
      kind: "http",
      status: 502,
      message: "Payment provider is unavailable",
    });
    expect(limited.userMessage).toMatch(/wait 15 minutes/i);
    expect(internal.userMessage).toMatch(/went wrong on our side/i);
    expect(stripe.userMessage).toBe("Payment provider is unavailable");
  });

  it("classifies fetch failures", () => {
    expect(toApiError(new TypeError("fetch failed")).kind).toBe("network");
    expect(toApiError(new DOMException("timed out", "TimeoutError")).kind).toBe(
      "timeout",
    );
  });
});
