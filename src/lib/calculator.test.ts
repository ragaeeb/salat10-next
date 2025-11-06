import { beforeEach, describe, expect, it } from 'bun:test';

import {
    daily,
    type FormattedTiming,
    formatTimeRemaining,
    getActiveEvent,
    getNextEvent,
    getTimeUntilNext,
    isFard,
    monthly,
    yearly,
} from './calculator';

const labels = {
    asr: 'Asr',
    dhuhr: 'Dhuhr',
    fajr: 'Fajr',
    isha: 'Isha',
    lastThirdOfTheNight: 'Last third',
    maghrib: 'Maghrib',
    middleOfTheNight: 'Half',
    sunrise: 'Sunrise',
} as const;

const defaultConfig = {
    fajrAngle: 15,
    ishaAngle: 15,
    ishaInterval: 0,
    latitude: '45.3506',
    longitude: '-75.7930',
    method: 'NorthAmerica' as const,
    timeZone: 'America/Toronto',
};

describe('isFard', () => {
    it('should return the true for five obligatory prayers', () => {
        expect(isFard('fajr')).toBe(true);
        expect(isFard('dhuhr')).toBe(true);
        expect(isFard('asr')).toBe(true);
        expect(isFard('maghrib')).toBe(true);
        expect(isFard('isha')).toBe(true);
    });

    it('should return the false for non-fard events', () => {
        expect(isFard('sunrise')).toBe(false);
        expect(isFard('middleOfTheNight')).toBe(false);
        expect(isFard('lastThirdOfTheNight')).toBe(false);
    });

    it('should return the false for unknown events', () => {
        expect(isFard('unknown')).toBe(false);
        expect(isFard('sunset')).toBe(false);
    });
});

describe('daily', () => {
    it('should return the timings in chronological order', () => {
        const result = daily(labels, defaultConfig, new Date('2024-03-11T14:30:00-05:00'));

        expect(result.timings.length).toBeGreaterThan(0);
        expect(result.timings[0]?.event).toBe('fajr');

        // Verify chronological order
        for (let i = 1; i < result.timings.length; i++) {
            const prev = result.timings[i - 1]!;
            const curr = result.timings[i]!;
            expect(curr.value.getTime()).toBeGreaterThanOrEqual(prev.value.getTime());
        }
    });

    it('should includes all prayer events', () => {
        const result = daily(labels, defaultConfig, new Date('2024-03-11T14:30:00-05:00'));
        const events = result.timings.map((t) => t.event);

        expect(events).toContain('fajr');
        expect(events).toContain('sunrise');
        expect(events).toContain('dhuhr');
        expect(events).toContain('asr');
        expect(events).toContain('maghrib');
        expect(events).toContain('isha');
        expect(events).toContain('middleOfTheNight');
        expect(events).toContain('lastThirdOfTheNight');
    });

    it('should correctly marks fard prayers', () => {
        const result = daily(labels, defaultConfig, new Date('2024-03-11T14:30:00-05:00'));

        const fajr = result.timings.find((t) => t.event === 'fajr');
        expect(fajr?.isFard).toBe(true);

        const sunrise = result.timings.find((t) => t.event === 'sunrise');
        expect(sunrise?.isFard).toBe(false);
    });

    it('should formats times correctly', () => {
        const result = daily(labels, defaultConfig, new Date('2024-03-11T14:30:00-05:00'));

        for (const timing of result.timings) {
            expect(timing.time).toMatch(/\d{1,2}:\d{2} (AM|PM)/);
        }
    });

    it('should uses provided labels', () => {
        const customLabels = { ...labels, fajr: 'Custom Fajr' };

        const result = daily(customLabels, defaultConfig, new Date('2024-03-11T14:30:00-05:00'));
        const fajr = result.timings.find((t) => t.event === 'fajr');

        expect(fajr?.label).toBe('Custom Fajr');
    });

    it('should includes formatted date', () => {
        const result = daily(labels, defaultConfig, new Date('2024-03-11T14:30:00-05:00'));
        expect(result.date).toBeTruthy();
        expect(typeof result.date).toBe('string');
    });

    it('should calculates nextEventTime correctly during the day', () => {
        // Set time to 10:00 AM, should have next event (dhuhr or later)
        const result = daily(labels, defaultConfig, new Date('2024-03-11T10:00:00-05:00'));

        if (result.nextEventTime) {
            expect(result.nextEventTime.getTime()).toBeGreaterThan(Date.now() - 24 * 60 * 60 * 1000);
        }
    });

    it('should handles different calculation methods', () => {
        const configs = [
            { ...defaultConfig, method: 'MuslimWorldLeague' as const },
            { ...defaultConfig, method: 'Egyptian' as const },
            { ...defaultConfig, method: 'Karachi' as const },
        ];

        for (const config of configs) {
            const result = daily(labels, config, new Date('2024-03-11T14:30:00-05:00'));
            expect(result.timings.length).toBeGreaterThan(0);
        }
    });

    it('should handles custom angles', () => {
        const customConfig = { ...defaultConfig, fajrAngle: 18, ishaAngle: 18 };

        const result = daily(labels, customConfig, new Date('2024-03-11T14:30:00-05:00'));
        expect(result.timings.length).toBeGreaterThan(0);
    });
});

describe('monthly', () => {
    it('should generates correct number of days', () => {
        const result = monthly(labels, defaultConfig, new Date('2024-03-11T00:00:00-05:00'));
        expect(result.label).toBe('March 2024');
        expect(result.dates.length).toBe(31); // March has 31 days
    });

    it('should handles February in leap year', () => {
        const result = monthly(labels, defaultConfig, new Date('2024-02-15T00:00:00-05:00'));
        expect(result.label).toBe('February 2024');
        expect(result.dates.length).toBe(29); // 2024 is a leap year
    });

    it('should handles February in non-leap year', () => {
        const result = monthly(labels, defaultConfig, new Date('2023-02-15T00:00:00-05:00'));
        expect(result.label).toBe('February 2023');
        expect(result.dates.length).toBe(28);
    });

    it('should each day has valid prayer times', () => {
        const result = monthly(labels, defaultConfig, new Date('2024-03-11T00:00:00-05:00'));

        for (const day of result.dates) {
            expect(day.timings.length).toBeGreaterThan(0);
            expect(day.date).toBeTruthy();
        }
    });

    it('should dates are sequential', () => {
        const result = monthly(labels, defaultConfig, new Date('2024-03-11T00:00:00-05:00'));

        // Verify each day comes after the previous
        for (let i = 1; i < result.dates.length; i++) {
            const prev = result.dates[i - 1]!;
            const curr = result.dates[i]!;
            // Compare the first timing (fajr) of each day
            const prevTime = prev.timings[0]!.value.getTime();
            const currTime = curr.timings[0]!.value.getTime();
            expect(currTime).toBeGreaterThan(prevTime);
        }
    });
});

describe('yearly', () => {
    it('should generates 365 days for non-leap year', () => {
        const result = yearly(labels, defaultConfig, new Date('2023-01-01T00:00:00-05:00'));
        expect(result.label).toBe(2023);
        expect(result.dates.length).toBe(365);
    });

    it('should generates 366 days for leap year', () => {
        const result = yearly(labels, defaultConfig, new Date('2024-01-01T00:00:00-05:00'));
        expect(result.label).toBe(2024);
        expect(result.dates.length).toBe(366);
    });

    it('should each day has valid prayer times', () => {
        const result = yearly(labels, defaultConfig, new Date('2024-01-01T00:00:00-05:00'));

        for (const day of result.dates) {
            expect(day.timings.length).toBeGreaterThan(0);
            expect(day.date).toBeTruthy();
        }
    });

    it('should spans entire year', () => {
        const result = yearly(labels, defaultConfig, new Date('2024-06-15T00:00:00-05:00'));

        // First day should be January 1
        const firstDay = result.dates[0]!;
        expect(firstDay.date).toContain('January');

        // Last day should be December 31
        const lastDay = result.dates[result.dates.length - 1]!;
        expect(lastDay.date).toContain('December');
    });
});

describe('getActiveEvent', () => {
    let timings: FormattedTiming[];

    beforeEach(() => {
        const result = daily(labels, defaultConfig, new Date('2024-03-11T00:00:00-05:00'));
        timings = result.timings;
    });

    it('should return the correct event during daytime prayers', () => {
        // Find dhuhr time and set timestamp to be during dhuhr
        const dhuhr = timings.find((t) => t.event === 'dhuhr')!;
        const timestamp = dhuhr.value.getTime() + 30 * 60 * 1000; // 30 minutes after dhuhr

        const active = getActiveEvent(timings, timestamp);
        expect(active).toBe('dhuhr');
    });

    it('should return the correct event at exact prayer time', () => {
        const fajr = timings.find((t) => t.event === 'fajr')!;
        const active = getActiveEvent(timings, fajr.value.getTime());
        expect(active).toBe('fajr');
    });

    it.skip('should return the last event when before first prayer (early morning)', () => {
        // Set timestamp to 1:00 AM (before Fajr, which is around 5:43 AM)
        const fajr = timings.find((t) => t.event === 'fajr')!;
        const earlyMorning = fajr.value.getTime() - 4 * 60 * 60 * 1000; // 4 hours before fajr
        const active = getActiveEvent(timings, earlyMorning);

        // Should return the last event (lastThirdOfTheNight from yesterday's cycle)
        expect(active).toBe('lastThirdOfTheNight');
    });

    it('should return the last event when all events are in future', () => {
        // Very early morning, all events haven't occurred yet
        const fajr = timings.find((t) => t.event === 'fajr')!;
        const veryEarly = fajr.value.getTime() - 1000; // 1 second before fajr
        const active = getActiveEvent(timings, veryEarly);

        expect(active).toBe(timings[timings.length - 1]?.event);
    });

    it('should handles night prayers correctly', () => {
        const isha = timings.find((t) => t.event === 'isha')!;
        const timestamp = isha.value.getTime() + 60 * 60 * 1000; // 1 hour after isha

        const active = getActiveEvent(timings, timestamp);
        // Should be isha or one of the night events
        expect(['isha', 'middleOfTheNight', 'lastThirdOfTheNight']).toContain(active);
    });

    it('should return the null for empty timings', () => {
        const active = getActiveEvent([], Date.now());
        expect(active).toBeNull();
    });
});

describe('getNextEvent', () => {
    let timings: FormattedTiming[];

    beforeEach(() => {
        const result = daily(labels, defaultConfig, new Date('2024-03-11T00:00:00-05:00'));
        timings = result.timings;
    });

    it('should return the next event during the day', () => {
        const fajr = timings.find((t) => t.event === 'fajr')!;
        const timestamp = fajr.value.getTime() + 30 * 60 * 1000; // 30 minutes after fajr

        const next = getNextEvent(timings, timestamp);
        expect(next).toBe('sunrise');
    });

    it('should return the null when no events remain', () => {
        const lastEvent = timings[timings.length - 1]!;
        const timestamp = lastEvent.value.getTime() + 60 * 1000; // 1 minute after last event

        const next = getNextEvent(timings, timestamp);
        expect(next).toBeNull();
    });

    it('should return the first event when before all events', () => {
        const fajr = timings.find((t) => t.event === 'fajr')!;
        const veryEarly = fajr.value.getTime() - 1000; // 1 second before fajr
        const next = getNextEvent(timings, veryEarly);

        expect(next).toBe('fajr');
    });

    it('should return the null for empty timings', () => {
        const next = getNextEvent([], Date.now());
        expect(next).toBeNull();
    });
});

describe('getTimeUntilNext', () => {
    let timings: FormattedTiming[];

    beforeEach(() => {
        const result = daily(labels, defaultConfig, new Date('2024-03-11T00:00:00-05:00'));
        timings = result.timings;
    });

    it('should return the positive milliseconds until next event', () => {
        const fajr = timings.find((t) => t.event === 'fajr')!;
        const timestamp = fajr.value.getTime() + 30 * 60 * 1000; // 30 minutes after fajr

        const timeUntil = getTimeUntilNext(timings, timestamp);
        expect(timeUntil).toBeGreaterThan(0);
    });

    it('should return the null when no events remain', () => {
        const lastEvent = timings[timings.length - 1]!;
        const timestamp = lastEvent.value.getTime() + 60 * 1000;

        const timeUntil = getTimeUntilNext(timings, timestamp);
        expect(timeUntil).toBeNull();
    });

    it('should calculates correct time difference', () => {
        const sunrise = timings.find((t) => t.event === 'sunrise')!;
        const fajr = timings.find((t) => t.event === 'fajr')!;
        const timestamp = fajr.value.getTime() + 10 * 60 * 1000; // 10 minutes after fajr

        const timeUntil = getTimeUntilNext(timings, timestamp);
        const expected = sunrise.value.getTime() - timestamp;

        expect(timeUntil).toBe(expected);
    });

    it('should return the null for empty timings', () => {
        const timeUntil = getTimeUntilNext([], Date.now());
        expect(timeUntil).toBeNull();
    });
});

describe('formatTimeRemaining', () => {
    it('should formats hours, minutes, seconds correctly', () => {
        const ms = 2 * 60 * 60 * 1000 + 30 * 60 * 1000 + 45 * 1000; // 2h 30m 45s
        expect(formatTimeRemaining(ms)).toBe('2h 30m 45s');
    });

    it('should handles zero values', () => {
        expect(formatTimeRemaining(0)).toBe('0h 0m 0s');
    });

    it('should handles only seconds', () => {
        const ms = 45 * 1000;
        expect(formatTimeRemaining(ms)).toBe('0h 0m 45s');
    });

    it('should handles only minutes', () => {
        const ms = 30 * 60 * 1000;
        expect(formatTimeRemaining(ms)).toBe('0h 30m 0s');
    });

    it('should handles only hours', () => {
        const ms = 5 * 60 * 60 * 1000;
        expect(formatTimeRemaining(ms)).toBe('5h 0m 0s');
    });

    it('should floors fractional values', () => {
        // 2.7 hours = 2h 42m, 30.8 minutes = 30m 48s, 45.9 seconds = 45s
        // Total: 2h + 42m + 30m + 48s + 45s = 2h 72m 93s = 3h 13m 33s
        const ms = 2.7 * 60 * 60 * 1000 + 30.8 * 60 * 1000 + 45.9 * 1000;
        expect(formatTimeRemaining(ms)).toBe('3h 13m 33s');
    });
});
