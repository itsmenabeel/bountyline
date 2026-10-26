import { describe, expect, it } from "vitest";
import {
  hasActiveFilters,
  listDefaults,
  listParamsSchema,
  optionalEnum,
  parseListParams,
  patchListParams,
  serializeListParams,
} from "./list-params";

// Same shape as GET /programs (backend program.validation.ts).
const programParams = listParamsSchema({
  sortBy: ["createdAt", "title", "poolBalance"],
  defaultSort: "createdAt",
  filters: { status: optionalEnum(["DRAFT", "ACTIVE", "PAUSED", "CLOSED"]) },
});
const defaults = listDefaults(programParams);

describe("parseListParams", () => {
  it("fills defaults for an empty query", () => {
    expect(defaults).toEqual({
      page: 1,
      limit: 10,
      sortBy: "createdAt",
      order: "desc",
      search: undefined,
      status: undefined,
    });
  });

  it("reads page searchParams and URLSearchParams the same way", () => {
    const fromPage = parseListParams(programParams, {
      page: "3",
      limit: "25",
      sortBy: "title",
      order: "asc",
      search: "  acme ",
      status: ["ACTIVE", "PAUSED"],
    });
    const fromUrl = parseListParams(
      programParams,
      new URLSearchParams(
        "page=3&limit=25&sortBy=title&order=asc&search=acme&status=ACTIVE&status=PAUSED",
      ),
    );
    expect(fromPage).toEqual(fromUrl);
    expect(fromPage).toMatchObject({
      page: 3,
      limit: 25,
      search: "acme",
      status: "ACTIVE",
    });
  });

  it("replaces values the backend would reject with defaults", () => {
    const params = parseListParams(programParams, {
      page: "0",
      limit: "500",
      sortBy: "password",
      order: "sideways",
      search: "x".repeat(101),
      status: "DELETED",
    });
    expect(params).toEqual(defaults);
  });

  it("drops a blank search and accepts only the offered page sizes", () => {
    expect(
      parseListParams(programParams, { search: "   " }).search,
    ).toBeUndefined();
    expect(parseListParams(programParams, { limit: "50" }).limit).toBe(50);
    expect(parseListParams(programParams, { limit: "20" }).limit).toBe(10);
    expect(parseListParams(programParams, { page: "2.5" }).page).toBe(1);
  });
});

describe("serializeListParams", () => {
  it("leaves defaults out of the URL", () => {
    expect(serializeListParams(defaults, defaults)).toBe("");
    expect(
      serializeListParams({ ...defaults, status: "ACTIVE", page: 2 }, defaults),
    ).toBe("page=2&status=ACTIVE");
  });

  it("round-trips through parse", () => {
    const params = {
      ...defaults,
      sortBy: "poolBalance",
      order: "asc" as const,
      search: "web app",
    };
    const query = serializeListParams(params, defaults);
    expect(parseListParams(programParams, new URLSearchParams(query))).toEqual(
      params,
    );
  });
});

describe("patchListParams", () => {
  const onPage3 = { ...defaults, page: 3 };

  it("keeps the page when only the page changes", () => {
    expect(patchListParams(onPage3, { page: 4 }).page).toBe(4);
  });

  it("returns to page 1 when a filter, search, sort, or page size changes", () => {
    expect(patchListParams(onPage3, { status: "PAUSED" }).page).toBe(1);
    expect(patchListParams(onPage3, { search: "acme" }).page).toBe(1);
    expect(patchListParams(onPage3, { sortBy: "title" }).page).toBe(1);
    expect(patchListParams(onPage3, { limit: 25 }).page).toBe(1);
  });
});

describe("hasActiveFilters", () => {
  it("counts search and filters, not paging or sorting", () => {
    expect(
      hasActiveFilters({ ...defaults, page: 2, sortBy: "title" }, defaults),
    ).toBe(false);
    expect(hasActiveFilters({ ...defaults, search: "acme" }, defaults)).toBe(
      true,
    );
    expect(hasActiveFilters({ ...defaults, status: "CLOSED" }, defaults)).toBe(
      true,
    );
  });
});
