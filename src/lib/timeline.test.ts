import { describe, expect, it } from 'bun:test';
import { buildTimeline, timeToScroll } from '@/lib/timeline';
import type { DayData } from '@/types/timeline';

describe('timeline', () => {
    describe('buildTimeline', () => {
        it('should build normalized timeline from valid day data', () => {
            const dayData: DayData = {
                date: new Date('2025-01-01'),
                dayIndex: 0,
                nextFajr: new Date('2025-01-02T05:00:00'),
                timings: [
                    { event: 'fajr', label: 'Fajr', value: new Date('2025-01-01T05:00:00') },
                    { event: 'sunrise', label: 'Sunrise', value: new Date('2025-01-01T06:30:00') },
                    { event: 'dhuhr', label: 'Dhuhr', value: new Date('2025-01-01T12:00:00') },
                    { event: 'asr', label: 'Asr', value: new Date('2025-01-01T15:00:00') },
                    { event: 'maghrib', label: 'Maghrib', value: new Date('2025-01-01T17:30:00') },
                    { event: 'isha', label: 'Isha', value: new Date('2025-01-01T19:00:00') },
                    { event: 'middleOfTheNight', label: 'Half Night', value: new Date('2025-01-02T00:15:00') },
                    { event: 'lastThirdOfTheNight', label: 'Last Third', value: new Date('2025-01-02T02:30:00') },
                ],
            };

            const timeline = buildTimeline(dayData);

            expect(timeline.fajr).toBe(0);
            expect(timeline.end).toBe(1);
            expect(timeline.sunrise).toBeGreaterThan(0);
            expect(timeline.sunrise).toBeLessThan(timeline.dhuhr);
            expect(timeline.dhuhr).toBeLessThan(timeline.asr);
            expect(timeline.asr).toBeLessThan(timeline.maghrib);
            expect(timeline.maghrib).toBeLessThan(timeline.isha);
            expect(timeline.isha).toBeLessThan(timeline.midNight);
            expect(timeline.midNight).toBeLessThan(timeline.lastThird);
            expect(timeline.lastThird).toBeLessThan(1);
        });

        it('should place dhuhr at midpoint between sunrise and maghrib', () => {
            const dayData: DayData = {
                date: new Date('2025-01-01'),
                dayIndex: 0,
                nextFajr: new Date('2025-01-02T05:00:00'),
                timings: [
                    { event: 'fajr', label: 'Fajr', value: new Date('2025-01-01T05:00:00') },
                    { event: 'sunrise', label: 'Sunrise', value: new Date('2025-01-01T06:00:00') },
                    { event: 'dhuhr', label: 'Dhuhr', value: new Date('2025-01-01T12:00:00') },
                    { event: 'asr', label: 'Asr', value: new Date('2025-01-01T15:00:00') },
                    { event: 'maghrib', label: 'Maghrib', value: new Date('2025-01-01T18:00:00') },
                    { event: 'isha', label: 'Isha', value: new Date('2025-01-01T19:30:00') },
                    {
                        event: 'middleOfTheNight',
                        label: 'Half Night',

                        value: new Date('2025-01-02T00:15:00'),
                    },
                    { event: 'lastThirdOfTheNight', label: 'Last Third', value: new Date('2025-01-02T02:30:00') },
                ],
            };

            const timeline = buildTimeline(dayData);

            expect(timeline.dhuhr).toBeCloseTo((timeline.sunrise + timeline.maghrib) / 2, 5);
        });

        it('should return fallback timeline when timings are missing', () => {
            const dayData: DayData = { date: new Date('2025-01-01'), dayIndex: 0, nextFajr: null, timings: [] };

            const timeline = buildTimeline(dayData);

            expect(timeline.fajr).toBeDefined();
            expect(timeline.end).toBe(1);
        });

        it('should clamp values to [0, 1] range', () => {
            const dayData: DayData = {
                date: new Date('2025-01-01'),
                dayIndex: 0,
                nextFajr: new Date('2025-01-02T05:00:00'),
                timings: [
                    { event: 'fajr', label: 'Fajr', value: new Date('2025-01-01T05:00:00') },
                    { event: 'sunrise', label: 'Sunrise', value: new Date('2025-01-01T06:30:00') },
                    { event: 'dhuhr', label: 'Dhuhr', value: new Date('2025-01-01T12:00:00') },
                    { event: 'asr', label: 'Asr', value: new Date('2025-01-01T15:00:00') },
                    { event: 'maghrib', label: 'Maghrib', value: new Date('2025-01-01T17:30:00') },
                    { event: 'isha', label: 'Isha', value: new Date('2025-01-01T19:00:00') },
                    { event: 'middleOfTheNight', label: 'Half Night', value: new Date('2025-01-02T00:15:00') },
                    { event: 'lastThirdOfTheNight', label: 'Last Third', value: new Date('2025-01-02T02:30:00') },
                ],
            };

            const timeline = buildTimeline(dayData);

            expect(timeline.fajr).toBeGreaterThanOrEqual(0);
            expect(timeline.sunrise).toBeGreaterThanOrEqual(0);
            expect(timeline.dhuhr).toBeGreaterThanOrEqual(0);
            expect(timeline.asr).toBeGreaterThanOrEqual(0);
            expect(timeline.maghrib).toBeGreaterThanOrEqual(0);
            expect(timeline.isha).toBeGreaterThanOrEqual(0);
            expect(timeline.midNight).toBeGreaterThanOrEqual(0);
            expect(timeline.lastThird).toBeGreaterThanOrEqual(0);

            expect(timeline.sunrise).toBeLessThanOrEqual(1);
            expect(timeline.dhuhr).toBeLessThanOrEqual(1);
            expect(timeline.asr).toBeLessThanOrEqual(1);
            expect(timeline.maghrib).toBeLessThanOrEqual(1);
            expect(timeline.isha).toBeLessThanOrEqual(1);
            expect(timeline.midNight).toBeLessThanOrEqual(1);
            expect(timeline.lastThird).toBeLessThanOrEqual(1);
        });
    });

    describe('timeToScroll', () => {
        const dayData: DayData = {
            date: new Date('2025-01-01'),
            dayIndex: 0,
            nextFajr: new Date('2025-01-02T05:00:00'),
            timings: [{ event: 'fajr', label: 'Fajr', value: new Date('2025-01-01T05:00:00') }],
        };

        it('should return 0 for time before fajr', () => {
            const nowMs = new Date('2025-01-01T04:00:00').getTime();
            expect(timeToScroll(nowMs, dayData)).toBe(0);
        });

        it('should return 0 for missing fajr time', () => {
            const invalidDay: DayData = { date: new Date('2025-01-01'), dayIndex: 0, nextFajr: null, timings: [] };
            expect(timeToScroll(Date.now(), invalidDay)).toBe(0);
        });

        it('should return proportion for time between fajr and next fajr', () => {
            const nowMs = new Date('2025-01-01T11:00:00').getTime();
            const result = timeToScroll(nowMs, dayData);

            expect(result).toBeGreaterThan(0);
            expect(result).toBeLessThan(1);
        });

        it('should return value close to 1 for time after next fajr', () => {
            const nowMs = new Date('2025-01-02T06:00:00').getTime();
            const result = timeToScroll(nowMs, dayData);

            expect(result).toBeCloseTo(0.999, 3);
        });

        it('should return 0.5 for time at midpoint', () => {
            const fajrMs = new Date('2025-01-01T05:00:00').getTime();
            const nextFajrMs = new Date('2025-01-02T05:00:00').getTime();
            const midMs = (fajrMs + nextFajrMs) / 2;

            const result = timeToScroll(midMs, dayData);
            expect(result).toBeCloseTo(0.5, 2);
        });
    });
});
