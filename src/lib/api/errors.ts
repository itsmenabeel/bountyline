import type { ApiErrorCode, ApiFailure } from "./types";

export type ApiErrorKind = "http" | "network" | "timeout" | "invalid_response";

interface ApiErrorInit {
  kind: ApiErrorKind;
  status?: number;
  message?: string;
  fieldErrors?: Record<string, string>;
  code?: ApiErrorCode;
}

// Copy for failures where the backend message isn't written for people (design-plan §12).
const MESSAGES = {
  network: "We couldn't reach the server. Check your connection and try again.",
  timeout:
    "The server took too long to answer. It may be starting up, so try again in a minute.",
  invalid:
    "The server sent a response we couldn't read. Try again in a minute.",
  rateLimited:
    "Too many attempts from this connection. Wait 15 minutes, then try again.",
  server: "Something went wrong on our side. Try again in a minute.",
} as const;

const REQUEST_PARTS = /^(body|query|params)\./;

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  /** HTTP status, or 0 when no response arrived. */
  readonly status: number;
  /** Field path (without the "body." prefix) to the first message for that field. */
  readonly fieldErrors: Record<string, string>;
  readonly code: ApiErrorCode | undefined;

  constructor({
    kind,
    status = 0,
    message,
    fieldErrors = {},
    code,
  }: ApiErrorInit) {
    super(message ?? MESSAGES.invalid);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.code = code;
  }

  static fromFailure(status: number, failure: ApiFailure) {
    const fieldErrors: Record<string, string> = {};
    let code: ApiErrorCode | undefined;

    for (const issue of failure.errors) {
      if ("code" in issue) {
        code ??= issue.code;
      } else {
        const field = issue.path.replace(REQUEST_PARTS, "");
        fieldErrors[field] ??= issue.message;
      }
    }
    return new ApiError({
      kind: "http",
      status,
      message: failure.message,
      fieldErrors,
      code,
    });
  }

  /** The message to show a person: the backend's own text, unless it isn't written for one. */
  get userMessage(): string {
    if (this.kind === "network") return MESSAGES.network;
    if (this.kind === "timeout") return MESSAGES.timeout;
    if (this.kind === "invalid_response") return MESSAGES.invalid;
    if (this.status === 429) return MESSAGES.rateLimited;
    if (this.status >= 500 && this.status !== 502 && this.status !== 503) {
      return MESSAGES.server;
    }
    return this.message;
  }

  get hasFieldErrors() {
    return Object.keys(this.fieldErrors).length > 0;
  }
}

export const isApiError = (error: unknown): error is ApiError =>
  error instanceof ApiError;

/** Turns whatever fetch threw (network failure, abort, timeout) into an ApiError. */
export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) return error;
  if (error instanceof DOMException && error.name === "TimeoutError") {
    return new ApiError({ kind: "timeout", message: MESSAGES.timeout });
  }
  return new ApiError({ kind: "network", message: MESSAGES.network });
}
