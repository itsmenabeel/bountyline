"use client";

import { useMounted } from "@/hooks/use-mounted";

const OPTIONS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
};
const utc = new Intl.DateTimeFormat("en-US", { ...OPTIONS, timeZone: "UTC" });

/**
 * A date and time in the viewer's time zone, for records where the hour matters (the audit
 * log). The server can't know that zone, so the first render shows UTC, labeled, and the
 * browser switches to local time after hydration.
 */
export function LocalTime({ iso }: { iso: string }) {
  const mounted = useMounted();
  const date = new Date(iso);
  const text = mounted
    ? new Intl.DateTimeFormat("en-US", OPTIONS).format(date)
    : `${utc.format(date)} UTC`;
  return <time dateTime={iso}>{text}</time>;
}
