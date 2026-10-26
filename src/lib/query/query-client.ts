import {
  MutationCache,
  QueryCache,
  QueryClient,
  type QueryClientConfig,
} from "@tanstack/react-query";
import { type ApiError, toApiError } from "@/lib/api/errors";

declare module "@tanstack/react-query" {
  interface Register {
    defaultError: ApiError;
    mutationMeta: {
      /** The mutation shows its own error (a form's inline alert), so skip the toast. */
      silentToast?: boolean;
    };
  }
}

const MAX_RETRIES = 2;
// Backend responses are cached for 60 s (B1); 30 s keeps lists fresh without refetching on
// every navigation (implementation-plan §4.6).
const STALE_TIME_MS = 30_000;

/**
 * Retry network failures, timeouts, and 5xx up to twice. 4xx answers won't change on a retry,
 * and a 429 would only spend more of the visitor's rate limit.
 */
export function shouldRetry(failureCount: number, error: unknown) {
  if (failureCount >= MAX_RETRIES) return false;
  const apiError = toApiError(error);
  if (apiError.kind !== "http") return true;
  return apiError.status >= 500;
}

export interface QueryClientHandlers {
  /** A refetch failed while the screen still shows older data. */
  onBackgroundError?: (error: ApiError) => void;
  /** A mutation failed and didn't opt out with `meta.silentToast`. */
  onMutationError?: (error: ApiError) => void;
}

export function createQueryClient(
  handlers: QueryClientHandlers = {},
  defaults: QueryClientConfig["defaultOptions"] = {},
) {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        // A first load that fails shows its error in place; only a failed refresh of data
        // already on screen needs a toast, or the failure would go unnoticed.
        if (query.state.data !== undefined) {
          handlers.onBackgroundError?.(toApiError(error));
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        if (mutation.meta?.silentToast) return;
        handlers.onMutationError?.(toApiError(error));
      },
    }),
    defaultOptions: {
      ...defaults,
      queries: {
        staleTime: STALE_TIME_MS,
        retry: shouldRetry,
        refetchOnWindowFocus: true,
        ...defaults.queries,
      },
    },
  });
}
