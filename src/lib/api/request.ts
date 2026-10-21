import { ApiError } from "./errors";
import type { ApiFailure, ApiSuccess, Paginated } from "./types";

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
export type QueryValue = string | number | boolean | null | undefined;
export type Query = Record<string, QueryValue>;

/**
 * One description of a backend call, shared by the server transport (direct to the API)
 * and the client transport (through the BFF route). `TResult` is what the call resolves to.
 */
export interface Endpoint<TResult> {
  readonly method: HttpMethod;
  /** Path below API_BASE_URL, e.g. "/programs/abc". */
  readonly path: `/${string}`;
  readonly query?: Query;
  readonly body?: unknown;
  /** List endpoints resolve to `{ items, meta }` instead of the bare data. */
  readonly list: boolean;
  /** Type-only marker; never set at runtime. */
  readonly __result?: TResult;
}

type EndpointSpec = {
  method?: HttpMethod;
  path: `/${string}`;
  query?: Query;
  body?: unknown;
};

export function endpoint<T>(spec: EndpointSpec): Endpoint<T> {
  return { method: "GET", ...spec, list: false };
}

export function listEndpoint<T>(spec: EndpointSpec): Endpoint<Paginated<T>> {
  return { method: "GET", ...spec, list: true };
}

/** Drops empty values so defaults stay out of the URL and the backend applies its own. */
export function toSearchParams(query: Query = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  return params;
}

export function endpointPath(target: Endpoint<unknown>) {
  const search = toSearchParams(target.query).toString();
  return search ? `${target.path}?${search}` : target.path;
}

function isEnvelope(body: unknown): body is ApiSuccess<unknown> | ApiFailure {
  return (
    typeof body === "object" &&
    body !== null &&
    "success" in body &&
    typeof body.success === "boolean" &&
    "message" in body &&
    typeof body.message === "string"
  );
}

/** Parses the backend envelope, throwing ApiError for failures and unreadable bodies. */
export async function readEnvelope(
  response: Response,
): Promise<ApiSuccess<unknown>> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiError({ kind: "invalid_response", status: response.status });
  }

  if (!isEnvelope(body)) {
    throw new ApiError({ kind: "invalid_response", status: response.status });
  }
  if (!body.success) {
    const errors = Array.isArray(body.errors) ? body.errors : [];
    throw ApiError.fromFailure(response.status, { ...body, errors });
  }
  if (!response.ok) {
    throw new ApiError({
      kind: "http",
      status: response.status,
      message: body.message,
    });
  }
  return body;
}

/** Shapes a successful envelope into the endpoint's result type. */
export function resolveEnvelope<T>(
  target: Endpoint<T>,
  envelope: ApiSuccess<unknown>,
): T {
  if (!target.list) return envelope.data as T;

  const items = Array.isArray(envelope.data) ? envelope.data : [];
  const meta = envelope.meta ?? {
    page: 1,
    limit: items.length,
    total: items.length,
    totalPages: 1,
  };
  return { items, meta } as T;
}
