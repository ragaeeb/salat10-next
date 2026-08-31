import { describe, expect, it } from 'bun:test';
import type { CalculationConfig } from '@/lib/calculator';
import { buildLiveDayData, getActivePrayerDate } from './use-live-celestial';

const sampleConfig: CalculationConfig = {
    fajrAngle: 18,
    ishaAngle: 17,
    ishaInterval: 0,
    latitude: '43.6532',
    longitude: '-79.3832',
    method: 'isna',
    timeZone: 'America/Toronto',
};

describe('use-live-celestial', () => {
    describe('buildLiveDayData', () => {
        it('should build day data with timings and nextFajr', () => {
            const date = new Date('2026-06-15T12:00:00-04:00');
            const dayData = buildLiveDayData(date, sampleConfig);

            expect(dayData).toBeDefined();
            expect(dayData.date).toBeDefined();
            expect(dayData.timings.length).toBeGreaterThan(0);
            expect(dayData.nextFajr).toBeDefined();

            const fajr = dayData.timings.find((t) => t.event === 'fajr');
            expect(fajr).toBeDefined();
            expect(dayData.nextFajr?.getTime()).toBeGreaterThan(fajr!.value.getTime());
        });
    });

    describe('getActivePrayerDate', () => {
        it('should return today data during regular daytime hours', () => {
            // Noon on June 15
            const noonDate = new Date('2026-06-15T12:00:00-04:00');
            const result = getActivePrayerDate(noonDate, sampleConfig);

            expect(result.isYesterday).toBe(false);
            expect(result.dayData.date.getDate()).toBe(15);
        });

        it('should return yesterday data when time is before Fajr in early morning', () => {
            // 2:00 AM EDT on June 15 (before Fajr, which is around ~4:00 AM EDT)
            const earlyMorningDate = new Date('2026-06-15T02:00:00-04:00');
            const result = getActivePrayerDate(earlyMorningDate, sampleConfig);

            expect(result.isYesterday).toBe(true);
            expect(result.dayData.date.getDate()).toBe(14);
            expect(result.dayData.nextFajr).toBeDefined();
        });

        it('should return today data immediately after Fajr', () => {
            // 9:00 AM EDT on June 15 (after Fajr)
            const morningDate = new Date('2026-06-15T09:00:00-04:00');
            const result = getActivePrayerDate(morningDate, sampleConfig);

            expect(result.isYesterday).toBe(false);
            expect(result.dayData.date.getDate()).toBe(15);
        });

        it('should use the configured timezone when deriving the prayer date', () => {
            const tokyoConfig = { ...sampleConfig, latitude: '35.6762', longitude: '139.6503', timeZone: 'Asia/Tokyo' };
            const now = new Date('2026-06-14T23:30:00Z');
            const result = getActivePrayerDate(now, tokyoConfig);

            expect(result.isYesterday).toBe(false);
            expect(result.dayData.date.getFullYear()).toBe(2026);
            expect(result.dayData.date.getMonth()).toBe(5);
            expect(result.dayData.date.getDate()).toBe(15);
        });
    });
});
