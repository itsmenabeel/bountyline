import { endpoint, listEndpoint } from "@/lib/api/request";
import type {
  Report,
  ReportComment,
  ReportStatus,
  Severity,
} from "@/types/api";
import type { ReportSort } from "./params";
import type {
  CommentInput,
  ReportWriteupInput,
  TriageRequest,
} from "./schemas";

export interface ReportListQuery {
  page: number;
  limit: number;
  sortBy: ReportSort;
  order: "asc" | "desc";
  search?: string;
  status?: ReportStatus;
  severity?: Severity;
  programId?: string;
}

export const reportEndpoints = {
  /** Scoped by the backend: a researcher's own, an owner's programs', or all for admins. */
  list: (query: ReportListQuery) =>
    listEndpoint<Report>({ path: "/reports", query: { ...query } }),
  detail: (id: string) => endpoint<Report>({ path: `/reports/${id}` }),
  /** Researchers only, while NEW or NEEDS_INFO. A NEEDS_INFO edit goes back to triage. */
  update: (id: string, body: Partial<ReportWriteupInput>) =>
    endpoint<Report>({ method: "PATCH", path: `/reports/${id}`, body }),
  /** Admins only. The backend checks the move against REPORT_TRANSITIONS again. */
  triage: (id: string, body: TriageRequest) =>
    endpoint<Report>({ method: "PATCH", path: `/reports/${id}/status`, body }),
  remove: (id: string) =>
    endpoint<void>({ method: "DELETE", path: `/reports/${id}` }),
  /** Oldest first. */
  comments: (id: string, query: { page: number; limit: number }) =>
    listEndpoint<ReportComment>({
      path: `/reports/${id}/comments`,
      query: { ...query },
    }),
  addComment: (id: string, body: CommentInput) =>
    endpoint<ReportComment>({
      method: "POST",
      path: `/reports/${id}/comments`,
      body,
    }),
};
