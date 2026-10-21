// The backend wraps every response in one envelope (bug-bounty-platform README, "Architecture").

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

/** A 422 Zod issue. `path` is prefixed with the request part, e.g. "body.title". */
export interface ApiFieldIssue {
  path: string;
  message: string;
}

/** Machine-readable codes the backend attaches to some 409s. */
export type ApiErrorCode = "ALREADY_REWARDED" | "INSUFFICIENT_POOL";

export interface ApiCodeIssue {
  code: ApiErrorCode;
}

export interface ApiFailure {
  success: false;
  message: string;
  errors: Array<ApiFieldIssue | ApiCodeIssue>;
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

/** List endpoints resolve to items plus the pagination meta. */
export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}
