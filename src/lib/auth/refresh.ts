import type { TokenPair } from "@/types/api";

/**
 * - `ok`: the backend rotated the pair.
 * - `rejected`: the backend refused the refresh token (401). The session is over.
 * - `unavailable`: no verdict (network failure, timeout, 429, 5xx). Keep the cookies and let
 *   a later request try again.
 */
export type RefreshOutcome =
  | { status: "ok"; tokens: TokenPair }
  | { status: "rejected" }
  | { status: "unavailable" };

/** Calls the backend. `context` is whatever the caller passes, e.g. the visitor's headers. */
export type RefreshExchange<Context> = (
  refreshToken: string,
  context: Context,
) => Promise<RefreshOutcome>;

// Long enough for the browser to store the new cookies from the first response.
const SHARE_RESULT_MS = 10_000;

/**
 * Refresh tokens work once (backend auth.service `refresh`). When a page fires several
 * requests at once with the same expiring session, only the first may rotate it, so this
 * shares one exchange per refresh token and replays a successful result for 10 seconds.
 * The map is per server instance; that covers concurrent requests from one page load.
 */
export function createRefresher<Context = void>(
  exchange: RefreshExchange<Context>,
  { shareMs = SHARE_RESULT_MS, now = () => Date.now() } = {},
) {
  const inFlight = new Map<
    string,
    { promise: Promise<RefreshOutcome>; settledAt?: number }
  >();

  function prune() {
    const current = now();
    for (const [token, entry] of inFlight) {
      if (
        entry.settledAt !== undefined &&
        current - entry.settledAt > shareMs
      ) {
        inFlight.delete(token);
      }
    }
  }

  return function refresh(
    refreshToken: string,
    context: Context,
  ): Promise<RefreshOutcome> {
    prune();
    const existing = inFlight.get(refreshToken);
    if (existing) return existing.promise;

    const entry: { promise: Promise<RefreshOutcome>; settledAt?: number } = {
      promise: exchange(refreshToken, context)
        .catch((): RefreshOutcome => ({ status: "unavailable" }))
        .then((outcome) => {
          // Only a rotation is worth replaying; a failure should be retried by the next caller.
          if (outcome.status === "ok") entry.settledAt = now();
          else inFlight.delete(refreshToken);
          return outcome;
        }),
    };
    inFlight.set(refreshToken, entry);
    return entry.promise;
  };
}
