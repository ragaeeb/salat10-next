import { describe, expect, it } from 'bun:test';
import { clamp01, crossFade, invLerp, lerp, pick } from '@/lib/utils';
import type { DayData } from '@/types/timeline';

describe('utils', () => {
    describe('clamp01', () => {
        it('should clamp values below 0 to 0', () => {
            expect(clamp01(-1)).toBe(0);
            expect(clamp01(-0.5)).toBe(0);
        });

        it('should clamp values above 1 to 1', () => {
            expect(clamp01(2)).toBe(1);
            expect(clamp01(1.5)).toBe(1);
        });

        it('should leave values in [0, 1] unchanged', () => {
            expect(clamp01(0)).toBe(0);
            expect(clamp01(0.5)).toBe(0.5);
            expect(clamp01(1)).toBe(1);
        });
    });

    describe('invLerp', () => {
        it('should return 0 when value equals start', () => {
            expect(invLerp(0, 10, 0)).toBe(0);
        });

        it('should return 1 when value equals end', () => {
            expect(invLerp(0, 10, 10)).toBe(1);
        });

        it('should return 0.5 for midpoint', () => {
            expect(invLerp(0, 10, 5)).toBe(0.5);
        });

        it('should clamp values outside range', () => {
            expect(invLerp(0, 10, -5)).toBe(0);
            expect(invLerp(0, 10, 15)).toBe(1);
        });

        it('should return 0 when start equals end', () => {
            expect(invLerp(5, 5, 5)).toBe(0);
            expect(invLerp(5, 5, 10)).toBe(0);
        });

        it('should handle negative ranges', () => {
            expect(invLerp(-10, 0, -5)).toBe(0.5);
        });
    });

    describe('lerp', () => {
        it('should return start when t is 0', () => {
            expect(lerp(0, 10, 0)).toBe(0);
        });

        it('should return end when t is 1', () => {
            expect(lerp(0, 10, 1)).toBe(10);
        });

        it('should return midpoint when t is 0.5', () => {
            expect(lerp(0, 10, 0.5)).toBe(5);
        });

        it('should handle negative ranges', () => {
            expect(lerp(-10, 10, 0.5)).toBe(0);
        });

        it('should extrapolate beyond range', () => {
            expect(lerp(0, 10, 2)).toBe(20);
            expect(lerp(0, 10, -1)).toBe(-10);
        });
    });

    describe('pick', () => {
        const timings: DayData['timings'] = [
            { event: 'fajr', label: 'Fajr', time: '5:00 AM', value: new Date('2025-01-01T05:00:00') },
            { event: 'dhuhr', label: 'Dhuhr', time: '12:00 PM', value: new Date('2025-01-01T12:00:00') },
            { event: 'asr', label: 'Asr', time: '3:00 PM', value: new Date('2025-01-01T15:00:00') },
        ];

        it('should find timing by event key', () => {
            const result = pick(timings, 'fajr');
            expect(result).toBeInstanceOf(Date);
            expect(result?.getHours()).toBe(5);
        });

        it('should return undefined for non-existent key', () => {
            expect(pick(timings, 'nonexistent')).toBeUndefined();
        });

        it('should return first match', () => {
            const duplicateTimings = [
                ...timings,
                { event: 'fajr', label: 'Fajr 2', time: '6:00 AM', value: new Date('2025-01-01T06:00:00') },
            ];
            const result = pick(duplicateTimings, 'fajr');
            expect(result?.getHours()).toBe(5);
        });

        it('should handle empty timings array', () => {
            expect(pick([], 'fajr')).toBeUndefined();
        });
    });

    describe('crossFade', () => {
        it('should indicate no previous when at first day', () => {
            const result = crossFade(0.5, 0, 5);
            expect(result.hasPrev).toBe(false);
            expect(result.topSeamStarsOpacity).toBe(0);
        });

        it('should indicate no next when at last day', () => {
            const result = crossFade(0.5, 4, 5);
            expect(result.hasNext).toBe(false);
            expect(result.bottomSeamFajrOpacity).toBe(0);
        });

        it('should have both prev and next for middle days', () => {
            const result = crossFade(0.5, 2, 5);
            expect(result.hasPrev).toBe(true);
            expect(result.hasNext).toBe(true);
        });

        it('should have zero opacity at midpoint', () => {
            const result = crossFade(0.5, 2, 5);
            expect(result.topSeamStarsOpacity).toBe(0);
            expect(result.bottomSeamFajrOpacity).toBe(0);
        });

        it('should handle single day', () => {
            const result = crossFade(0.5, 0, 1);
            expect(result.hasPrev).toBe(false);
            expect(result.hasNext).toBe(false);
            expect(result.topSeamStarsOpacity).toBe(0);
            expect(result.bottomSeamFajrOpacity).toBe(0);
        });
    });
});
