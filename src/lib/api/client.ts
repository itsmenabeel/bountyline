import { toApiError } from "./errors";
import {
  type Endpoint,
  endpointPath,
  readEnvelope,
  resolveEnvelope,
} from "./request";

const BFF_PREFIX = "/api/bff";

/** Clears the session cookies and returns to /login, then back to this page after sign-in. */
function endSession() {
  const next = `${window.location.pathname}${window.location.search}`;
  window.location.assign(`/api/auth/expired?next=${encodeURIComponent(next)}`);
}

/**
 * The browser transport: the same Endpoint descriptors as `serverRequest`, sent through the
 * BFF route so the access token never reaches client JavaScript. Throws ApiError on failure;
 * a 401 also sends the browser to sign in again.
 */
export async function clientRequest<T>(target: Endpoint<T>): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BFF_PREFIX}${endpointPath(target)}`, {
      method: target.method,
      headers:
        target.body === undefined
          ? { Accept: "application/json" }
          : { Accept: "application/json", "Content-Type": "application/json" },
      body: target.body === undefined ? undefined : JSON.stringify(target.body),
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch (error) {
    throw toApiError(error);
  }

  if (response.status === 401) endSession();
  return resolveEnvelope(target, await readEnvelope(response));
}
