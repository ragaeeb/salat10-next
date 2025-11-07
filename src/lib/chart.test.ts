import { describe, expect, it } from 'bun:test';
import { buildChartConfig, buildSeriesOrder, prepareChartData, reduceValues } from '@/lib/chart';
import type { Schedule } from '@/types/graph';

describe('buildSeriesOrder', () => {
    it('should return empty array for schedule with no timings', () => {
        const schedule: Schedule = { dates: [], label: 'Test' };
        expect(buildSeriesOrder(schedule)).toEqual([]);
    });

    it('should return events from first day with timings', () => {
        const schedule: Schedule = {
            dates: [
                { date: new Date(), timings: [] },
                {
                    date: new Date(),
                    timings: [
                        { event: 'fajr', label: 'Fajr', time: '5:00 AM', value: new Date() },
                        { event: 'dhuhr', label: 'Dhuhr', time: '12:00 PM', value: new Date() },
                    ],
                },
            ],
            label: 'Test',
        };
        expect(buildSeriesOrder(schedule)).toEqual(['fajr', 'dhuhr']);
    });

    it('should collect unique events across all days', () => {
        const schedule: Schedule = {
            dates: [
                { date: new Date(), timings: [{ event: 'fajr', label: 'Fajr', time: '5:00 AM', value: new Date() }] },
                {
                    date: new Date(),
                    timings: [
                        { event: 'fajr', label: 'Fajr', time: '5:00 AM', value: new Date() },
                        { event: 'asr', label: 'Asr', time: '3:00 PM', value: new Date() },
                    ],
                },
            ],
            label: 'Test',
        };
        expect(buildSeriesOrder(schedule)).toEqual(['fajr', 'asr']);
    });
});

describe('reduceValues', () => {
    it('should return initial value for empty array', () => {
        expect(reduceValues([], Math.min, 100)).toBe(100);
    });

    it('should skip null values', () => {
        expect(reduceValues([null, 5, null, 3], Math.min, 100)).toBe(3);
    });

    it('should skip NaN values', () => {
        expect(reduceValues([NaN, 5, 3], Math.min, 100)).toBe(3);
    });

    it('should return first valid value when only one exists', () => {
        expect(reduceValues([null, 7, null], Math.max, 0)).toBe(7);
    });

    it('should reduce values with Math.min', () => {
        expect(reduceValues([10, 5, 15, 3], Math.min, Number.POSITIVE_INFINITY)).toBe(3);
    });

    it('should reduce values with Math.max', () => {
        expect(reduceValues([10, 5, 15, 3], Math.max, Number.NEGATIVE_INFINITY)).toBe(15);
    });
});

describe('buildChartConfig', () => {
    it('should return null for null prepared data', () => {
        expect(buildChartConfig(null, null)).toBeNull();
    });

    it('should return null for empty series', () => {
        const prepared = { baseFajrMin: null, series: [], xValues: [] };
        expect(buildChartConfig(prepared, null)).toBeNull();
    });

    it('should return null when selected event not found', () => {
        const prepared = {
            baseFajrMin: 300,
            series: [
                { color: '#fff', event: 'fajr', label: 'Fajr', timeLabels: ['5:00 AM', '5:05 AM'], values: [300, 305] },
            ],
            xValues: [1, 2],
        };
        expect(buildChartConfig(prepared, 'nonexistent')).toBeNull();
    });

    it('should return null for non-finite min/max values', () => {
        const prepared = {
            baseFajrMin: null,
            series: [{ color: '#fff', event: 'fajr', label: 'Fajr', timeLabels: [null, null], values: [null, null] }],
            xValues: [1, 2],
        };
        expect(buildChartConfig(prepared, null)).toBeNull();
    });

    it('should build config for valid data', () => {
        const prepared = {
            baseFajrMin: 300,
            series: [
                {
                    color: '#3b82f6',
                    event: 'fajr',
                    label: 'Fajr',
                    timeLabels: ['5:00 AM', '5:05 AM'],
                    values: [300, 305],
                },
            ],
            xValues: [1672531200, 1672617600],
        };
        const config = buildChartConfig(prepared, null);

        expect(config).not.toBeNull();
        expect(config?.activeSeries.event).toBe('fajr');
        expect(config?.data[0]).toEqual(prepared.xValues);
        expect(config?.data[1]).toEqual([300, 305]);
        expect(config?.metrics.selectedEvent).toBe('fajr');
    });

    it('should handle padding and range calculations', () => {
        const prepared = {
            baseFajrMin: 300,
            series: [
                { color: '#fff', event: 'fajr', label: 'Fajr', timeLabels: ['5:00 AM', '5:00 AM'], values: [300, 300] },
            ],
            xValues: [1, 2],
        };
        const config = buildChartConfig(prepared, null);

        expect(config?.metrics.paddedMax).toBeGreaterThan(300);
        expect(config?.metrics.paddedMin).toBeLessThan(300);
    });

    it('should ensure paddedMin is not negative', () => {
        const prepared = {
            baseFajrMin: 5,
            series: [
                { color: '#fff', event: 'fajr', label: 'Fajr', timeLabels: ['12:05 AM', '12:10 AM'], values: [5, 10] },
            ],
            xValues: [1, 2],
        };
        const config = buildChartConfig(prepared, null);

        expect(config?.metrics.paddedMin).toBeGreaterThanOrEqual(0);
    });

    it('should select specified event when provided', () => {
        const prepared = {
            baseFajrMin: 300,
            series: [
                { color: '#fff', event: 'fajr', label: 'Fajr', timeLabels: ['5:00 AM', '5:05 AM'], values: [300, 305] },
                {
                    color: '#0ff',
                    event: 'dhuhr',
                    label: 'Dhuhr',
                    timeLabels: ['12:00 PM', '12:05 PM'],
                    values: [720, 725],
                },
            ],
            xValues: [1, 2],
        };
        const config = buildChartConfig(prepared, 'dhuhr');

        expect(config?.activeSeries.event).toBe('dhuhr');
    });
});

describe('prepareChartData', () => {
    it('should return null for null schedule', () => {
        expect(prepareChartData(null)).toBeNull();
    });

    it('should return null for empty schedule', () => {
        expect(prepareChartData({ dates: [], label: 'Test' })).toBeNull();
    });

    it('should prepare chart data from schedule', () => {
        const date1 = new Date('2025-01-01T05:00:00');
        const date2 = new Date('2025-01-02T05:05:00');

        const schedule: Schedule = {
            dates: [
                { date: date1, timings: [{ event: 'fajr', label: 'Fajr', time: '5:00 AM', value: date1 }] },
                { date: date2, timings: [{ event: 'fajr', label: 'Fajr', time: '5:05 AM', value: date2 }] },
            ],
            label: 'Test',
        };

        const result = prepareChartData(schedule);

        expect(result).not.toBeNull();
        expect(result?.series).toHaveLength(1);
        expect(result?.series[0]?.event).toBe('fajr');
        expect(result?.xValues).toHaveLength(2);
    });

    it('should handle missing timings with null values', () => {
        const date1 = new Date('2025-01-01T05:00:00');

        const schedule: Schedule = {
            dates: [
                { date: date1, timings: [{ event: 'fajr', label: 'Fajr', time: '5:00 AM', value: date1 }] },
                { date: new Date('2025-01-02'), timings: [] },
            ],
            label: 'Test',
        };

        const result = prepareChartData(schedule);

        expect(result?.series[0]?.values[1]).toBeNull();
        expect(result?.series[0]?.timeLabels[1]).toBeNull();
    });

    it('should adjust values after midnight relative to fajr', () => {
        const fajrTime = new Date('2025-01-01T05:00:00');
        const ishaTime = new Date('2025-01-01T20:00:00');
        const midnightTime = new Date('2025-01-02T01:00:00');

        const schedule: Schedule = {
            dates: [
                {
                    date: fajrTime,
                    timings: [
                        { event: 'fajr', label: 'Fajr', time: '5:00 AM', value: fajrTime },
                        { event: 'isha', label: 'Isha', time: '8:00 PM', value: ishaTime },
                        { event: 'midnight', label: 'Midnight', time: '1:00 AM', value: midnightTime },
                    ],
                },
            ],
            label: 'Test',
        };

        const result = prepareChartData(schedule);
        const midnightSeries = result?.series.find((s) => s.event === 'midnight');

        // Midnight (1:00 AM) is before Fajr (5:00 AM), so it should be adjusted by adding 24 hours
        expect(midnightSeries?.values[0]).toBeGreaterThan(300); // Greater than Fajr's 300 minutes
    });
});
