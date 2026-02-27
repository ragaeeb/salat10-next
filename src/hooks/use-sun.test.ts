import { describe, expect, it } from 'bun:test';
import { renderHook } from '@testing-library/react';
import { motionValue } from 'motion/react';
import { POS } from '@/lib/constants';
import type { Timeline } from '@/types/timeline';
import { useSun } from './use-sun';

const mockTimeline: Timeline = {
    asr: 0.6,
    dhuhr: 0.4,
    end: 1,
    fajr: 0,
    isha: 0.85,
    lastThird: 0.95,
    maghrib: 0.75,
    midNight: 0.9,
    sunrise: 0.15,
};

describe('useSun', () => {
    describe('with null timeline', () => {
        it('should return default values when timeline is null', () => {
            const scrollProgress = motionValue(0.5);
            const { result } = renderHook(() => useSun(scrollProgress, null));

            expect(result.current.sunX.get()).toBe(POS.EAST_X);
            expect(result.current.sunY.get()).toBe(POS.LOW_Y);
            expect(result.current.sunOpacity.get()).toBe(0);
            expect(result.current.sunColorR.get()).toBe(255);
            expect(result.current.sunColorG.get()).toBe(223);
            expect(result.current.sunColorB.get()).toBe(102);
        });
    });

    describe('sunX (horizontal position)', () => {
        it('should be at EAST_X before sunrise', () => {
            const scrollProgress = motionValue(0.1);
            const { result } = renderHook(() => useSun(scrollProgress, mockTimeline));

            expect(result.current.sunX.get()).toBe(POS.EAST_X);
        });

        it('should be at WEST_X after maghrib', () => {
            const scrollProgress = motionValue(0.8);
            const { result } = renderHook(() => useSun(scrollProgress, mockTimeline));

            expect(result.current.sunX.get()).toBe(POS.WEST_X);
        });

        it('should interpolate between EAST_X and WEST_X during daylight', () => {
            const scrollProgress = motionValue(0.45); // Between sunrise (0.15) and maghrib (0.75)
            const { result } = renderHook(() => useSun(scrollProgress, mockTimeline));

            const x = result.current.sunX.get();
            expect(x).toBeLessThan(POS.EAST_X);
            expect(x).toBeGreaterThan(POS.WEST_X);
        });

        it('should be at exact midpoint at solar noon', () => {
            const noon = (mockTimeline.sunrise + mockTimeline.maghrib) / 2;
            const scrollProgress = motionValue(noon);
            const { result } = renderHook(() => useSun(scrollProgress, mockTimeline));

            const x = result.current.sunX.get();
            const midpoint = (POS.EAST_X + POS.WEST_X) / 2;
            expect(Math.abs(x - midpoint)).toBeLessThan(0.5);
        });
    });

    describe('sunY (vertical position - parabolic arc)', () => {
        it('should be at LOW_Y before sunrise', () => {
            const scrollProgress = motionValue(0.1);
            const { result } = renderHook(() => useSun(scrollProgress, mockTimeline));

            expect(result.current.sunY.get()).toBe(POS.LOW_Y);
        });

        it('should be at LOW_Y after maghrib', () => {
            const scrollProgress = motionValue(0.8);
            const { result } = renderHook(() => useSun(scrollProgress, mockTimeline));

            expect(result.current.sunY.get()).toBe(POS.LOW_Y);
        });

        it('should be higher than LOW_Y during daylight', () => {
            const scrollProgress = motionValue(0.4);
            const { result } = renderHook(() => useSun(scrollProgress, mockTimeline));

            const y = result.current.sunY.get();
            expect(y).toBeLessThan(POS.LOW_Y); // Lower Y value = higher on screen
        });

        it('should reach maximum height at solar noon', () => {
            const noon = (mockTimeline.sunrise + mockTimeline.maghrib) / 2;
            const scrollProgress = motionValue(noon);
            const { result } = renderHook(() => useSun(scrollProgress, mockTimeline));

            const y = result.current.sunY.get();

            // Should be at peak (lowest Y value)
            // Check nearby values are higher (closer to LOW_Y)
            const beforeNoon = motionValue(noon - 0.05);
            const { result: beforeResult } = renderHook(() => useSun(beforeNoon, mockTimeline));

            const afterNoon = motionValue(noon + 0.05);
            const { result: afterResult } = renderHook(() => useSun(afterNoon, mockTimeline));

            expect(y).toBeLessThanOrEqual(beforeResult.current.sunY.get());
            expect(y).toBeLessThanOrEqual(afterResult.current.sunY.get());
        });
    });

    describe('sunOpacity', () => {
        it('should be 0 before sunrise', () => {
            const scrollProgress = motionValue(0.1);
            const { result } = renderHook(() => useSun(scrollProgress, mockTimeline));

            expect(result.current.sunOpacity.get()).toBe(0);
        });

        it('should be visible after sunrise', () => {
            const scrollProgress = motionValue(0.2);
            const { result } = renderHook(() => useSun(scrollProgress, mockTimeline));

            expect(result.current.sunOpacity.get()).toBeGreaterThan(0);
        });

        it('should be 0 at maghrib', () => {
            const scrollProgress = motionValue(mockTimeline.maghrib);
            const { result } = renderHook(() => useSun(scrollProgress, mockTimeline));

            expect(result.current.sunOpacity.get()).toBe(0);
        });

        it('should remain 0 after maghrib', () => {
            const scrollProgress = motionValue(0.8);
            const { result } = renderHook(() => useSun(scrollProgress, mockTimeline));

            expect(result.current.sunOpacity.get()).toBe(0);
        });
    });

    describe('sunColor (RGB channels)', () => {
        it('should have day color early in the day', () => {
            const scrollProgress = motionValue(0.3);
            const { result } = renderHook(() => useSun(scrollProgress, mockTimeline));

            expect(result.current.sunColorR.get()).toBe(255);
            expect(result.current.sunColorG.get()).toBe(223);
            expect(result.current.sunColorB.get()).toBe(102);
        });

        it('should transition to warmer colors near sunset', () => {
            const orangeStart = (mockTimeline.asr + mockTimeline.maghrib) / 2;
            const scrollProgress = motionValue(orangeStart + 0.05);
            const { result } = renderHook(() => useSun(scrollProgress, mockTimeline));

            expect(result.current.sunColorR.get()).toBe(255);
            expect(result.current.sunColorG.get()).toBeLessThan(223);
            expect(result.current.sunColorB.get()).toBeLessThan(102);
        });

        it('should have dusk color at maghrib', () => {
            const scrollProgress = motionValue(mockTimeline.maghrib);
            const { result } = renderHook(() => useSun(scrollProgress, mockTimeline));

            expect(result.current.sunColorR.get()).toBe(255);
            expect(result.current.sunColorG.get()).toBe(140);
            expect(result.current.sunColorB.get()).toBe(0);
        });

        it('should maintain dusk color after maghrib', () => {
            const scrollProgress = motionValue(0.8);
            const { result } = renderHook(() => useSun(scrollProgress, mockTimeline));

            expect(result.current.sunColorR.get()).toBe(255);
            expect(result.current.sunColorG.get()).toBe(140);
            expect(result.current.sunColorB.get()).toBe(0);
        });
    });

    describe('MotionValue reactivity', () => {
        it('should create reactive MotionValues that can be updated', () => {
            const scrollProgress = motionValue(0.3);
            const { result } = renderHook(() => useSun(scrollProgress, mockTimeline));

            // Verify initial values are readable
            expect(typeof result.current.sunX.get()).toBe('number');
            expect(typeof result.current.sunColorR.get()).toBe('number');

            // Verify values change with different scroll positions
            const orangeStart = (mockTimeline.asr + mockTimeline.maghrib) / 2;
            const result1 = renderHook(() => useSun(motionValue(0.3), mockTimeline));
            const result2 = renderHook(() => useSun(motionValue(orangeStart + 0.05), mockTimeline));

            // Day colors at 0.3
            expect(result1.result.current.sunColorG.get()).toBe(223);
            expect(result1.result.current.sunColorB.get()).toBe(102);

            // Warmer colors near sunset
            expect(result2.result.current.sunColorG.get()).toBeLessThan(223);
            expect(result2.result.current.sunColorB.get()).toBeLessThan(102);
        });

        it('should react to timeline changes for color values', () => {
            const scrollProgress = motionValue(0.5);
            const { result, rerender } = renderHook(({ timeline }) => useSun(scrollProgress, timeline), {
                initialProps: { timeline: mockTimeline },
            });

            const initialColorR = result.current.sunColorR.get();
            expect(initialColorR).toBe(255);

            // Rerender with null timeline - color values update immediately
            rerender({ timeline: null });

            // Should return default day colors
            expect(result.current.sunColorR.get()).toBe(255);
            expect(result.current.sunColorG.get()).toBe(223);
            expect(result.current.sunColorB.get()).toBe(102);
        });
    });

    describe('return value structure', () => {
        it('should return all required MotionValue properties', () => {
            const scrollProgress = motionValue(0.5);
            const { result } = renderHook(() => useSun(scrollProgress, mockTimeline));

            expect(result.current).toHaveProperty('sunX');
            expect(result.current).toHaveProperty('sunY');
            expect(result.current).toHaveProperty('sunOpacity');
            expect(result.current).toHaveProperty('sunColorR');
            expect(result.current).toHaveProperty('sunColorG');
            expect(result.current).toHaveProperty('sunColorB');

            // Verify they are MotionValues
            expect(typeof result.current.sunX.get).toBe('function');
            expect(typeof result.current.sunY.get).toBe('function');
            expect(typeof result.current.sunOpacity.get).toBe('function');
            expect(typeof result.current.sunColorR.get).toBe('function');
            expect(typeof result.current.sunColorG.get).toBe('function');
            expect(typeof result.current.sunColorB.get).toBe('function');
        });
    });

    describe('edge cases', () => {
        it('should handle scrollProgress at exact timeline boundaries', () => {
            const testPoints = [
                mockTimeline.fajr,
                mockTimeline.sunrise,
                mockTimeline.dhuhr,
                mockTimeline.asr,
                mockTimeline.maghrib,
                mockTimeline.isha,
                mockTimeline.midNight,
                mockTimeline.lastThird,
            ];

            for (const point of testPoints) {
                const scrollProgress = motionValue(point);
                const { result } = renderHook(() => useSun(scrollProgress, mockTimeline));

                // Should not throw and should return valid values
                expect(result.current.sunX.get()).toBeGreaterThanOrEqual(POS.WEST_X);
                expect(result.current.sunX.get()).toBeLessThanOrEqual(POS.EAST_X);
                expect(result.current.sunY.get()).toBeGreaterThanOrEqual(POS.LOW_Y - POS.SUN_PEAK_Y_DELTA);
                expect(result.current.sunY.get()).toBeLessThanOrEqual(POS.LOW_Y);
                expect(result.current.sunOpacity.get()).toBeGreaterThanOrEqual(0);
                expect(result.current.sunOpacity.get()).toBeLessThanOrEqual(1);
            }
        });

        it('should handle scrollProgress at 0 (start of day)', () => {
            const scrollProgress = motionValue(0);
            const { result } = renderHook(() => useSun(scrollProgress, mockTimeline));

            expect(result.current.sunX.get()).toBe(POS.EAST_X);
            expect(result.current.sunY.get()).toBe(POS.LOW_Y);
            expect(result.current.sunOpacity.get()).toBe(0);
        });

        it('should handle scrollProgress at 1 (end of day)', () => {
            const scrollProgress = motionValue(1);
            const { result } = renderHook(() => useSun(scrollProgress, mockTimeline));

            expect(result.current.sunX.get()).toBe(POS.WEST_X);
            expect(result.current.sunY.get()).toBe(POS.LOW_Y);
            expect(result.current.sunOpacity.get()).toBe(0);
        });
    });
});
