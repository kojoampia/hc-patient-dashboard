import dayjs from 'dayjs/esm';
import utc from 'dayjs/esm/plugin/utc';

// Registered here rather than in config/dayjs.ts: that file carries a JHipster needle and is
// regenerated, and this is the portal's own dependency. Extending twice is a no-op.
dayjs.extend(utc);

/**
 * Formatting the portal agreed on once, so a date does not read three different ways on three
 * screens. Everything here is pure — no injection, no locale service — because these are used
 * inside `computed()` bodies where an injection context is not guaranteed.
 *
 * ## Instants are the clinic's, not the reader's — calendar dates belong to nobody
 *
 * The record holds two different kinds of value and they need opposite treatment:
 *
 * - An **instant** — `visitedAt`, `openedAt`, `raisedAt`, `scheduledAt`, `loggedAt`, `recordedAt` —
 *   is a point in time. The care happened in Accra and the record was written in Accra time; a
 *   reader elsewhere is reading someone else's appointment, not scheduling their own, so shifting
 *   it to their clock states something the record does not say. Rendered locally from UTC+2, a
 *   23:05 alert became 01:05 the following morning — the wrong *day* on a clinical record. Use
 *   {@link formatDayTime}, {@link formatTime} or {@link formatInstantDay}.
 * - A **calendar date** — `birthDate`, `notedOn`, `startedOn`, `reportDate`, `createdDate`,
 *   `schedule` — is a `LocalDate` with no time and no zone. It must not be converted at all. The
 *   entity services parse these with `dayjs('1976-04-19')`, which lands on *local* midnight, so
 *   converting to UTC from any zone east of it moves the date back a day: a birthday of 19 April
 *   renders as the 18th. Use {@link formatDay}.
 *
 * Ghana keeps UTC all year with no daylight saving, so `.utc()` *is* Accra and no timezone database
 * is needed. The day a second locale appears this becomes a real zone lookup — which is why the
 * instant formatters go through {@link inZone} rather than calling `.format()` themselves.
 *
 * ## Strings are tolerated, and should not be
 *
 * The entity services convert their date fields to `dayjs` objects; anything fetched around them
 * arrives as an ISO string. Handing one to a formatter used to throw `e.format is not a function`
 * mid-render, which Angular reports as a blank panel rather than as an error anyone can act on —
 * `/record` and the profile's About tab were both empty for exactly this reason. Accepting a string
 * costs one coercion and turns that class of mistake into a correctly formatted date. Fix the
 * source anyway: the type still says `Dayjs` because that is what callers should pass.
 */

/** What a formatter will accept. `string` is a tolerated input, not an endorsed one — see above. */
export type DateLike = dayjs.Dayjs | string | null | undefined;

const DAY = 'DD MMM YYYY';
const DAY_TIME = 'DD MMM YYYY, hh:mm A';
const TIME = 'hh:mm A';

/** Parses without moving the value, or null when there is nothing to show. */
function parse(value: DateLike): dayjs.Dayjs | null {
  if (value == null || value === '') {
    return null;
  }
  const parsed = dayjs.isDayjs(value) ? value : dayjs(value);
  return parsed.isValid() ? parsed : null;
}

/** Parses and moves to the record's timezone. For instants only — see the note above. */
function inZone(value: DateLike): dayjs.Dayjs | null {
  return parse(value)?.utc() ?? null;
}

/** "19 Apr 1976" — a **calendar date**, rendered as written. Never shifted. */
export function formatDay(value: DateLike): string {
  return parse(value)?.format(DAY) ?? '—';
}

/**
 * "24 Jul 2026" — the date an **instant** falls on, in the clinic's timezone.
 *
 * @param instant the moment the thing happened.
 * @param fallback a calendar date to show when there is no instant — for the records that carry
 *   `loggedAt ?? createdDate`, where the two are different kinds and only the first can be shifted.
 */
export function formatInstantDay(instant: DateLike, fallback?: DateLike): string {
  const moment = inZone(instant);
  if (moment) {
    return moment.format(DAY);
  }
  return fallback === undefined ? '—' : formatDay(fallback);
}

/** "24 Jul 2026, 02:00 PM" — an **instant**, where the time of day carries meaning. */
export function formatDayTime(value: DateLike): string {
  return inZone(value)?.format(DAY_TIME) ?? '—';
}

/** "02:00 PM" — an **instant**. */
export function formatTime(value: DateLike): string {
  return inZone(value)?.format(TIME) ?? '—';
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
