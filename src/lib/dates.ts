/**
 * Every date in this app is a calendar date, not an instant: a deadline of
 * "10 Aug" means the whole of 10 Aug regardless of clock time. To keep that
 * true, date-only values are stored at UTC midnight and always converted back
 * through these helpers rather than through the local-time Date accessors.
 */

/** "2026-08-10" → Date at 2026-08-10T00:00:00Z. Returns null for empty/invalid input. */
export function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Date → "2026-08-10", the value format `<input type="date">` expects. */
export function toDateInputValue(date: Date | null | undefined): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

/** Today as a calendar date at UTC midnight, using the machine's local calendar day. */
export function todayDateOnly(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

/** Whole days from today to `date`. Negative = in the past. Null when there is no date. */
export function daysUntil(date: Date | null | undefined, now: Date = new Date()): number | null {
  if (!date) return null;
  const target = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.round((target - todayDateOnly(now).getTime()) / 86_400_000);
}

/** "10 Aug 2026", matching the design. Em dash when the date is unset. */
export function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
