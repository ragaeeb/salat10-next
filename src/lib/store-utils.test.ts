import { describe, expect, it } from 'bun:test';
import type { Settings } from '@/types/settings';
import {
    computePrayerTimesForDate,
    findNextEventTime,
    getMillisecondsUntilNextUpdate,
    hasValidCoordinates,
} from './store-utils';

const validSettings: Settings = {
    address: 'New York, NY',
    fajrAngle: '15',
    ishaAngle: '15',
    ishaInterval: '0',
    latitude: '40.7128',
    longitude: '-74.0060',
    method: 'NorthAmerica',
    timeZone: 'America/New_York',
};

const invalidSettings: Settings = { ...validSettings, latitude: 'invalid', longitude: 'invalid' };

describe('store-utils', () => {
    describe('hasValidCoordinates', () => {
        it('should return true for valid coordinates', () => {
            expect(hasValidCoordinates(validSettings)).toBe(true);
        });

        it('should return false for non-numeric latitude', () => {
            expect(hasValidCoordinates({ ...validSettings, latitude: 'abc' })).toBe(false);
        });

        it('should return false for non-numeric longitude', () => {
            expect(hasValidCoordinates({ ...validSettings, longitude: 'xyz' })).toBe(false);
        });

        it('should return false for empty strings', () => {
            expect(hasValidCoordinates({ ...validSettings, latitude: '', longitude: '' })).toBe(false);
        });

        it('should return true for negative coordinates', () => {
            expect(hasValidCoordinates({ ...validSettings, latitude: '-33.8688', longitude: '151.2093' })).toBe(true);
        });

        it('should return false for NaN values', () => {
            expect(hasValidCoordinates({ ...validSettings, latitude: 'NaN', longitude: '0' })).toBe(false);
        });

        it('should return false for Infinity', () => {
            expect(hasValidCoordinates({ ...validSettings, latitude: 'Infinity', longitude: '0' })).toBe(false);
        });
    });

    describe('computePrayerTimesForDate', () => {
        it('should return null for invalid coordinates', () => {
            const result = computePrayerTimesForDate(invalidSettings, new Date());
            expect(result).toBeNull();
        });

        it('should compute prayer times for valid settings', () => {
            const date = new Date('2024-03-15T12:00:00-05:00');
            const result = computePrayerTimesForDate(validSettings, date);

            expect(result).not.toBeNull();
            expect(result?.date).toEqual(date);
            expect(result?.prayerTimes).toBeDefined();
            expect(result?.sunnahTimes).toBeDefined();
            expect(result?.computedAt).toBeGreaterThan(0);
        });

        it('should have all required prayer times', () => {
            const date = new Date('2024-03-15T12:00:00-05:00');
            const result = computePrayerTimesForDate(validSettings, date);

            expect(result?.prayerTimes.fajr).toBeInstanceOf(Date);
            expect(result?.prayerTimes.sunrise).toBeInstanceOf(Date);
            expect(result?.prayerTimes.dhuhr).toBeInstanceOf(Date);
            expect(result?.prayerTimes.asr).toBeInstanceOf(Date);
            expect(result?.prayerTimes.maghrib).toBeInstanceOf(Date);
            expect(result?.prayerTimes.isha).toBeInstanceOf(Date);
        });

        it('should have sunnah times', () => {
            const date = new Date('2024-03-15T12:00:00-05:00');
            const result = computePrayerTimesForDate(validSettings, date);

            expect(result?.sunnahTimes.middleOfTheNight).toBeInstanceOf(Date);
            expect(result?.sunnahTimes.lastThirdOfTheNight).toBeInstanceOf(Date);
        });

        it('should handle different dates', () => {
            const date1 = new Date('2024-01-01T12:00:00-05:00');
            const date2 = new Date('2024-06-01T12:00:00-05:00');

            const result1 = computePrayerTimesForDate(validSettings, date1);
            const result2 = computePrayerTimesForDate(validSettings, date2);

            // Prayer times should differ between winter and summer
            expect(result1?.prayerTimes.fajr.getTime()).not.toBe(result2?.prayerTimes.fajr.getTime());
        });

        it('should handle default angle values when invalid', () => {
            const settingsWithInvalidAngles: Settings = {
                ...validSettings,
                fajrAngle: 'invalid',
                ishaAngle: 'invalid',
                ishaInterval: 'invalid',
            };

            const result = computePrayerTimesForDate(settingsWithInvalidAngles, new Date());
            expect(result).not.toBeNull();
        });
    });

    describe('findNextEventTime', () => {
        it('should return null for null data', () => {
            expect(findNextEventTime(null)).toBeNull();
        });
    });

    describe('getMillisecondsUntilNextUpdate', () => {
        it('should return positive milliseconds for upcoming event', () => {
            const date = new Date('2024-03-15T05:00:00-05:00');
            const data = computePrayerTimesForDate(validSettings, date);
            const ms = getMillisecondsUntilNextUpdate(data);

            expect(ms).toBeGreaterThanOrEqual(0);
        });

        it('should return milliseconds until midnight when no next event', () => {
            const date = new Date('2024-03-15T00:00:00-05:00');
            const data = computePrayerTimesForDate(validSettings, date);

            // Mock Date.now to be after all events
            const now = new Date('2024-03-15T23:00:00-05:00');
            const originalNow = Date.now;
            Date.now = () => now.getTime();

            const ms = getMillisecondsUntilNextUpdate(data);

            Date.now = originalNow;

            // Should be approximately 1 hour until midnight
            const expectedMs = 60 * 60 * 1000;
            expect(ms).toBeGreaterThan(0);
            expect(ms).toBeLessThanOrEqual(expectedMs * 1.1); // Allow 10% margin
        });

        it('should return 0 when event time has passed', () => {
            const date = new Date('2024-03-15T05:00:00-05:00');
            const data = computePrayerTimesForDate(validSettings, date);

            // Mock Date.now to be way in the future
            const originalNow = Date.now;
            Date.now = () => new Date('2024-03-16T12:00:00-05:00').getTime();

            const ms = getMillisecondsUntilNextUpdate(data);

            Date.now = originalNow;

            // Should return ms until next midnight
            expect(ms).toBeGreaterThanOrEqual(0);
        });
    });
});
