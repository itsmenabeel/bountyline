/** Up to two initials for an avatar: "Riley Researcher" → "RR", "priya" → "P". */
export function initials(name: string) {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => Array.from(word)[0] ?? "");
  const first = letters[0] ?? "";
  const last = letters.length > 1 ? (letters.at(-1) ?? "") : "";
  return `${first}${last}`.toUpperCase() || "?";
}

// UTC on purpose: the server and the browser render the same text, so hydration never
// disagrees about a date near midnight.
const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** "Oct 12, 2026" for an ISO timestamp. */
export function formatDate(iso: string) {
  return shortDate.format(new Date(iso));
}

/**
 * The opening of a Markdown description as plain text, for cards: drops heading marks,
 * emphasis, code ticks, and link targets, and joins the lines.
 */
export function plainExcerpt(markdown: string) {
  return markdown
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** How long something has waited, in whole days: "Today", "1 day", "12 days". */
export function formatAge(iso: string, now: Date = new Date()) {
  const days = Math.max(
    0,
    Math.floor((now.getTime() - Date.parse(iso)) / DAY_MS),
  );
  if (days === 0) return "Today";
  return days === 1 ? "1 day" : `${days.toLocaleString("en-US")} days`;
}
