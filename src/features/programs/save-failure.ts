import type { ApiError } from "@/lib/api/errors";

/** A settings save that failed, in words the owner can act on. */
export function saveFailureMessage(error: ApiError) {
  if (error.status === 409) {
    return "This program is closed now, so it can't be edited. Reload the page to see its current status.";
  }
  return `We couldn't save your changes. ${error.userMessage}`;
}
