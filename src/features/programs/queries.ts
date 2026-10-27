import type { z } from "zod";
import { describeQuery } from "@/lib/query/descriptor";
import { programEndpoints } from "./endpoints";
import type { directoryParams, programTableParams } from "./params";

export type DirectoryParams = z.output<typeof directoryParams>;
export type ProgramTableParams = z.output<typeof programTableParams>;

/** Where the directory reads from: the public endpoint, or the signed-in one. */
export type DirectorySource = "public" | "signed-in";
/** Whose programs a table lists: the owner's own, or all of them (admin). */
export type ProgramTableScope = "mine" | "all";

export const programKeys = {
  all: ["programs"] as const,
  lists: () => [...programKeys.all, "list"] as const,
  directory: (source: DirectorySource, params: DirectoryParams) =>
    [...programKeys.lists(), "directory", source, params] as const,
  table: (scope: ProgramTableScope, params: ProgramTableParams) =>
    [...programKeys.lists(), "table", scope, params] as const,
};

export function directoryQuery(
  source: DirectorySource,
  params: DirectoryParams,
) {
  const { page, limit, sortBy, order, search } = params;
  const query = { page, limit, sortBy, order, search };
  return describeQuery(
    programKeys.directory(source, params),
    source === "public"
      ? programEndpoints.publicList(query)
      : programEndpoints.list(query),
  );
}

export function programTableQuery(
  scope: ProgramTableScope,
  params: ProgramTableParams,
) {
  return describeQuery(
    programKeys.table(scope, params),
    programEndpoints.list({ ...params, mine: scope === "mine" }),
  );
}

/**
 * The programs a signed-in viewer can open, by title, for pickers and filters: ACTIVE ones
 * for researchers, all of them for admins. The backend caps a page at 50, which covers every
 * program on the platform today; past that, pickers would need a server-side search.
 */
export function programOptionsQuery() {
  return directoryQuery("signed-in", {
    page: 1,
    limit: 50,
    sortBy: "title",
    order: "asc",
    search: undefined,
  });
}
