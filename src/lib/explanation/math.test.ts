import { describe, expect, test } from 'bun:test';

import {
    apparentSolarLongitude,
    dateByAddingSeconds,
    dayOfYear,
    degreesToRadians,
    evaluateSeasonalAdjustment,
    hoursToDate,
    julianCentury,
    julianDay,
    normalizeToScale,
    radiansToDegrees,
    SECONDS_PER_HOUR,
    seasonAdjustedMorningTwilight,
    shortTimeZone,
    unwindAngle,
} from './math';

describe('astronomy math helpers', () => {
    test('angle conversions are inverses', () => {
        expect(radiansToDegrees(degreesToRadians(180))).toBeCloseTo(180);
        expect(degreesToRadians(radiansToDegrees(Math.PI))).toBeCloseTo(Math.PI);
    });

    test('julian day and century match reference values', () => {
        expect(julianDay(2000, 1, 1)).toBeCloseTo(2451544.5);
        expect(julianDay(2000, 1, 1, 12)).toBeCloseTo(2451545);
        expect(julianCentury(2451545.0)).toBeCloseTo(0);
    });

    test('seasonal adjustments remain bounded', () => {
        const dyy = dayOfYear(new Date('2024-03-11T00:00:00Z'));
        const morning = seasonAdjustedMorningTwilight(45.3506, dyy, 2024, new Date('2024-03-11T11:22:00Z'));
        const evening = seasonAdjustedEveningTwilight(45.3506, dyy, 2024, new Date('2024-03-11T23:05:00Z'), 'general');
        expect(morning.getTime()).toBeLessThan(new Date('2024-03-11T11:22:00Z').getTime());
        expect(evening.getTime()).toBeGreaterThan(new Date('2024-03-11T23:05:00Z').getTime());
    });

    test('evaluateSeasonalAdjustment transitions smoothly', () => {
        const values = [0, 30, 60, 120, 180, 240, 300];
        const adjustments = values.map((value) => evaluateSeasonalAdjustment(value, 10, 20, 30, 40));
        for (let i = 1; i < adjustments.length; i += 1) {
            expect(Math.abs(adjustments[i] - adjustments[i - 1])).toBeLessThan(20);
        }
    });

    test('time helpers create valid dates', () => {
        const base = new Date('2024-03-11T00:00:00Z');
        const plusOneHour = dateByAddingSeconds(base, SECONDS_PER_HOUR);
        expect(plusOneHour.getUTCHours()).toBe(1);
        const fractional = hoursToDate(18.5, base);
        expect(fractional.getUTCHours()).toBe(18);
        expect(fractional.getUTCMinutes()).toBe(30);
    });

    test('angle normalization wraps into expected range', () => {
        expect(normalizeToScale(725, 360)).toBeCloseTo(5);
        expect(unwindAngle(-90)).toBeCloseTo(270);
    });

    test('apparent solar longitude stays within 0-360 degrees', () => {
        const jd = julianDay(2024, 3, 11);
        const jc = julianCentury(jd);
        const lambda = apparentSolarLongitude(jc, 280);
        expect(lambda).toBeGreaterThanOrEqual(0);
        expect(lambda).toBeLessThan(360);
    });

    test('short timezone formatter returns abbreviation', () => {
        const label = shortTimeZone(new Date('2024-03-11T12:00:00Z'), 'America/Toronto');
        expect(label).toBe('EDT');
    });
});
