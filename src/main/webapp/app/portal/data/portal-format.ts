import dayjs from 'dayjs/esm';

/**
 * Formatting the portal agreed on once, so a date does not read three different ways on three
 * screens. Everything here is pure — no injection, no locale service — because these are used
 * inside `computed()` bodies where an injection context is not guaranteed.
 */

/** "24 Jul 2026". The record's default date form. */
export function formatDay(value: dayjs.Dayjs | null | undefined): string {
  return value ? value.format('DD MMM YYYY') : '—';
}

/** "24 Jul 2026, 02:00 PM". Used where the time of day carries meaning — appointments, alerts. */
export function formatDayTime(value: dayjs.Dayjs | null | undefined): string {
  return value ? value.format('DD MMM YYYY, hh:mm A') : '—';
}

/** "02:00 PM" */
export function formatTime(value: dayjs.Dayjs | null | undefined): string {
  return value ? value.format('hh:mm A') : '—';
}

/** Sorts newest first, putting undated records last rather than at the top. */
export function byDateDesc<T>(pick: (item: T) => dayjs.Dayjs | null | undefined) {
  return (a: T, b: T): number => {
    const left = pick(a);
    const right = pick(b);
    if (!left && !right) {
      return 0;
    }
    if (!left) {
      return 1;
    }
    if (!right) {
      return -1;
    }
    return right.valueOf() - left.valueOf();
  };
}

/** Sorts soonest first, putting undated records last. */
export function byDateAsc<T>(pick: (item: T) => dayjs.Dayjs | null | undefined) {
  return (a: T, b: T): number => {
    const left = pick(a);
    const right = pick(b);
    if (!left && !right) {
      return 0;
    }
    if (!left) {
      return 1;
    }
    if (!right) {
      return -1;
    }
    return left.valueOf() - right.valueOf();
  };
}

/**
 * Case-insensitive substring match across several fields at once — what every search box on the
 * portal does. An empty needle matches everything.
 */
export function matches(needle: string, ...fields: (string | number | null | undefined)[]): boolean {
  const query = needle.trim().toLowerCase();
  if (!query) {
    return true;
  }
  return fields.some(field => field != null && String(field).toLowerCase().includes(query));
}

/** Turns an enum-ish value into a sentence-cased label: `IN_TREATMENT` -> `In treatment`. */
export function humanise(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  const spaced = value.replace(/_/g, ' ').toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Splits a list into pages of `size`, clamping the page number into range. */
export function pageOf<T>(items: readonly T[], page: number, size: number): readonly T[] {
  const total = Math.max(1, Math.ceil(items.length / size));
  const clamped = Math.min(Math.max(1, page), total);
  return items.slice((clamped - 1) * size, clamped * size);
}

/** Number of pages `items` occupies at `size` per page — always at least one. */
export function pageCount(items: readonly unknown[], size: number): number {
  return Math.max(1, Math.ceil(items.length / size));
}
