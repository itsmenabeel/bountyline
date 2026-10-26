const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The backend answers a malformed id with a 422; pages check first and render not-found. */
export function isUuid(value: string) {
  return UUID.test(value);
}

/** A short label for an id, as in "R-8F2C1A". The full id stays available to copy. */
export function shortId(id: string, prefix: string) {
  return `${prefix}-${id.replaceAll("-", "").slice(0, 6).toUpperCase()}`;
}
