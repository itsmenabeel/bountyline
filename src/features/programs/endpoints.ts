import { endpoint, listEndpoint } from "@/lib/api/request";
import type { Program, ProgramStatus, RewardTier } from "@/types/api";
import type { ProgramSort } from "./params";
import type { CreateProgramRequest } from "./schemas";

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
  /** Owners only. New programs start as DRAFT with no tiers. */
  create: (body: CreateProgramRequest) =>
    endpoint<Program>({ method: "POST", path: "/programs", body }),
  /** Owners only, before CLOSED. A new `scope` replaces the old one whole. */
  update: (id: string, body: Partial<CreateProgramRequest>) =>
    endpoint<Program>({ method: "PATCH", path: `/programs/${id}`, body }),
  /** Owners only, with an empty pool and no open reports (soft delete). */
  remove: (id: string) =>
    endpoint<void>({ method: "DELETE", path: `/programs/${id}` }),
  /** Upserts each listed tier; tiers left out of the list stay as they were. */
  setRewardTiers: (id: string, tiers: RewardTier[]) =>
    endpoint<Program>({
      method: "PUT",
      path: `/programs/${id}/reward-tiers`,
      body: { tiers },
    }),
  /** ACTIVE needs at least one tier; the backend checks the transition. */
  changeStatus: (id: string, status: Exclude<ProgramStatus, "DRAFT">) =>
    endpoint<Program>({
      method: "PATCH",
      path: `/programs/${id}/status`,
      body: { status },
    }),
  /** Signed-out directory (backend change B1): ACTIVE programs only. */
  publicList: (query: PublicProgramListQuery) =>
    listEndpoint<Program>({ path: "/public/programs", query: { ...query } }),
  publicDetail: (id: string) =>
    endpoint<Program>({ path: `/public/programs/${id}` }),
};
