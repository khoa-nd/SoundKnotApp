/**
 * Timezone-aware "day" helpers.
 *
 * The server stores TIMESTAMPTZ in UTC. To answer "what happened today?"
 * we need to know the *user's* local day and convert its bounds to UTC.
 *
 * `tz` is an IANA timezone name, e.g. "Asia/Ho_Chi_Minh", "America/Los_Angeles".
 * Falsy / invalid values fall back to "UTC".
 */

export type LocalDayRange = {
  /** Start of the local day, as a UTC ISO timestamp. */
  startUtcISO: string;
  /** Exclusive end of the local day (start + 24h), as a UTC ISO timestamp. */
  endUtcISO: string;
  /** The local calendar date in YYYY-MM-DD form. */
  localDate: string;
  /** The IANA timezone actually used (after fallback). */
  timeZone: string;
};

function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Compute the UTC bounds of the local day for the given timezone at `now`.
 */
export function getLocalDayRange(
  tz: string | undefined | null,
  now: Date = new Date()
): LocalDayRange {
  const timeZone = tz && isValidTimeZone(tz) ? tz : "UTC";

  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = fmt.formatToParts(now).reduce<Record<string, string>>(
    (acc, p) => {
      if (p.type !== "literal") acc[p.type] = p.value;
      return acc;
    },
    {}
  );

  const y = Number(parts.year);
  const m = Number(parts.month);
  const d = Number(parts.day);
  const hh = Number(parts.hour);
  const mm = Number(parts.minute);
  const ss = Number(parts.second);

  // Treat the local wall-clock as if it were UTC, then derive the offset.
  const asIfUtcMs = Date.UTC(y, m - 1, d, hh, mm, ss);
  const offsetMs = asIfUtcMs - now.getTime();

  const localMidnightAsIfUtcMs = Date.UTC(y, m - 1, d, 0, 0, 0);
  const startMs = localMidnightAsIfUtcMs - offsetMs;
  const endMs = startMs + 24 * 60 * 60 * 1000;

  return {
    startUtcISO: new Date(startMs).toISOString(),
    endUtcISO: new Date(endMs).toISOString(),
    localDate: `${parts.year}-${parts.month}-${parts.day}`,
    timeZone,
  };
}

/**
 * Local calendar date (YYYY-MM-DD) in the given timezone.
 */
export function getLocalDate(
  tz: string | undefined | null,
  now: Date = new Date()
): string {
  return getLocalDayRange(tz, now).localDate;
}

/**
 * Local calendar date for "yesterday" relative to `now` in the given timezone.
 */
export function getLocalYesterday(
  tz: string | undefined | null,
  now: Date = new Date()
): string {
  const today = getLocalDayRange(tz, now);
  // Subtract 24h then format in the same timezone to avoid DST edge cases.
  const yesterdayInstant = new Date(
    new Date(today.startUtcISO).getTime() - 1
  );
  return getLocalDate(today.timeZone, yesterdayInstant);
}
