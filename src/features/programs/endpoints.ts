import { endpoint, listEndpoint } from "@/lib/api/request";
import type { Program, ProgramStatus } from "@/types/api";
import type { ProgramSort } from "./params";

export interface ProgramListQuery {
  page: number;
  limit: number;
  sortBy: ProgramSort;
  order: "asc" | "desc";
  search?: string;
  status?: ProgramStatus;
  /** Owners only: their own programs, any status. */
  mine?: boolean;
}

export type PublicProgramListQuery = Omit<ProgramListQuery, "status" | "mine">;

export const programEndpoints = {
  /** ACTIVE programs for researchers, every program for admins, `mine` for owners. */
  list: ({ mine, ...query }: ProgramListQuery) =>
    listEndpoint<Program>({
      path: "/programs",
      query: { ...query, mine: mine || undefined },
    }),
  detail: (id: string) => endpoint<Program>({ path: `/programs/${id}` }),
  /** Signed-out directory (backend change B1): ACTIVE programs only. */
  publicList: (query: PublicProgramListQuery) =>
    listEndpoint<Program>({ path: "/public/programs", query: { ...query } }),
  publicDetail: (id: string) =>
    endpoint<Program>({ path: `/public/programs/${id}` }),
};
