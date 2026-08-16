import dayjs from 'dayjs/esm';

import { formatDay, formatDayTime, formatInstantDay, formatTime } from './portal-format';

/**
 * These cover the two mistakes that emptied `/record` and the profile's About tab, and the one that
 * put every appointment on the reader's clock instead of the clinic's. Both were invisible to the
 * suite because the portal had no tests at all.
 */
describe('portal-format', () => {
  describe('the clinic’s timezone, not the reader’s', () => {
    it('renders an instant in the record’s zone whatever the browser is set to', () => {
      // 09:30 in Accra. A reader in Berlin (UTC+2) must still see 09:30 — it is not their appointment.
      expect(formatDayTime(dayjs('2026-07-28T09:30:00Z'))).toBe('28 Jul 2026, 09:30 AM');
      expect(formatTime(dayjs('2026-07-28T09:30:00Z'))).toBe('09:30 AM');
    });

    it('keeps a late-evening record on the day it happened', () => {
      // The one that mattered: rendered locally from UTC+2 this alert moved to 01 May, 01:05 AM —
      // the wrong date on a clinical record.
      expect(formatDayTime(dayjs('2025-04-30T23:05:00Z'))).toBe('30 Apr 2025, 11:05 PM');
      expect(formatInstantDay(dayjs('2025-04-30T23:05:00Z'))).toBe('30 Apr 2025');
    });

    it('formats midnight as the day it starts, not the day before', () => {
      expect(formatInstantDay(dayjs('2026-07-12T00:00:00Z'))).toBe('12 Jul 2026');
      expect(formatDayTime(dayjs('2026-07-12T00:00:00Z'))).toBe('12 Jul 2026, 12:00 AM');
    });
  });

  describe('a calendar date is not an instant', () => {
    it('renders a birth date as written, whatever the reader’s zone', () => {
      // LocalDate has no time and no zone. The entity services parse it to *local* midnight, so
      // converting to UTC from anywhere east of it moves the date back a day — 19 April becomes
      // the 18th. This is the regression the first attempt at the timezone fix introduced.
      expect(formatDay(dayjs('1976-04-19'))).toBe('19 Apr 1976');
      expect(formatDay('1976-04-19')).toBe('19 Apr 1976');
    });

    it('renders the date an instant falls on in the clinic’s zone', () => {
      expect(formatInstantDay(dayjs('2025-04-30T23:05:00Z'))).toBe('30 Apr 2025');
    });

    it('falls back to a calendar date when a record has no instant', () => {
      // `loggedAt ?? createdDate` — the two are different kinds, and only the first may be shifted.
      expect(formatInstantDay(null, dayjs('2026-07-12'))).toBe('12 Jul 2026');
      expect(formatInstantDay(dayjs('2026-07-12T22:00:00Z'), dayjs('2020-01-01'))).toBe('12 Jul 2026');
      expect(formatInstantDay(null)).toBe('—');
    });
  });

  describe('tolerating an unconverted date', () => {
    it('formats an ISO date string rather than throwing', () => {
      // `birthDate` arrived as a string from an endpoint the entity service does not cover. This
      // used to throw `e.format is not a function` mid-render, which Angular showed as a blank
      // panel: the whole of /record, and every value on the profile's About tab.
      expect(formatDay('1976-04-19')).toBe('19 Apr 1976');
    });

    it('formats an ISO instant string in the record’s zone too', () => {
      expect(formatDayTime('2026-07-28T09:30:00Z')).toBe('28 Jul 2026, 09:30 AM');
    });
  });

  describe('nothing to show', () => {
    it.each([null, undefined, ''])('renders an em dash for %p', value => {
      expect(formatDay(value)).toBe('—');
      expect(formatDayTime(value)).toBe('—');
      expect(formatTime(value)).toBe('—');
    });

    it('renders an em dash for an unparseable value rather than "Invalid Date"', () => {
      expect(formatDay('not a date')).toBe('—');
      expect(formatDayTime(dayjs('not a date'))).toBe('—');
    });
  });
});
