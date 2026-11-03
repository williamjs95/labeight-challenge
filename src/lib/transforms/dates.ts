const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

interface DateParts {
  year: number;
  month: number;
  day: number;
}

/** Parses a strict ISO calendar date (rejects 2023-02-30, etc.). No time zones involved. */
export function parseIsoDate(iso: string): DateParts | null {
  const match = ISO_DATE.exec(iso);
  if (!match) return null;
  const [, y, m, d] = match.map(Number) as [number, number, number, number];
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (
    probe.getUTCFullYear() !== y ||
    probe.getUTCMonth() !== m - 1 ||
    probe.getUTCDate() !== d
  )
    return null;
  return { year: y, month: m, day: d };
}

export function isValidIsoDate(iso: string): boolean {
  return parseIsoDate(iso) !== null;
}

/** Formats an ISO date using `YYYY`, `MM` and `DD` tokens, e.g. "MM/DD/YYYY". */
export function formatDate(iso: string, format: string): string {
  const parts = parseIsoDate(iso);
  if (!parts) throw new Error(`Invalid ISO date: "${iso}"`);
  return format
    .replace("YYYY", String(parts.year).padStart(4, "0"))
    .replace("MM", String(parts.month).padStart(2, "0"))
    .replace("DD", String(parts.day).padStart(2, "0"));
}

/**
 * Age in whole years on a given day.
 * Someone born on Feb 29 turns a year older on Mar 1 in non-leap years.
 */
export function ageOn(birthIso: string, todayIso: string): number {
  const birth = parseIsoDate(birthIso);
  const today = parseIsoDate(todayIso);
  if (!birth || !today) throw new Error("ageOn expects valid ISO dates");
  const hadBirthday =
    today.month > birth.month ||
    (today.month === birth.month && today.day >= birth.day);
  return today.year - birth.year - (hadBirthday ? 0 : 1);
}

/** Local calendar date of a JS Date, as ISO `YYYY-MM-DD`. */
export function toIsoDate(date: Date): string {
  const y = String(date.getFullYear()).padStart(4, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
