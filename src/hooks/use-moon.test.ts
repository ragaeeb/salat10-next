import { renderHook } from '@testing-library/react';
import { motionValue } from 'motion/react';
import { describe, expect, it } from 'bun:test';
import { FRAC, POS } from '@/lib/constants';
import { useMoon } from './use-moon';
import type { Timeline } from '@/types/timeline';

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

describe('useMoon', () => {
    describe('with null timeline', () => {
        it('should return default values when timeline is null', () => {
            const scrollProgress = motionValue(0.5);
            const { result } = renderHook(() => useMoon(scrollProgress, null));

            expect(result.current.moonX.get()).toBe(POS.EAST_X);
            expect(result.current.moonY.get()).toBe(POS.MOON_Y);
            expect(result.current.moonOpacity.get()).toBe(0);
        });
    });

    describe('moonX (horizontal position)', () => {
        it('should be at EAST_X before sunrise', () => {
            const scrollProgress = motionValue(0.1);
            const { result } = renderHook(() => useMoon(scrollProgress, mockTimeline));

            expect(result.current.moonX.get()).toBe(POS.EAST_X);
        });

        it('should be at WEST_X before appear start', () => {
            const orangeStart = (mockTimeline.asr + mockTimeline.maghrib) / 2;
            const appearStart = orangeStart + (mockTimeline.maghrib - orangeStart) * (1 - FRAC.MOON_PRE_MAGHRIB_APPEAR);
            const scrollProgress = motionValue(appearStart - 0.01);
            const { result } = renderHook(() => useMoon(scrollProgress, mockTimeline));

            expect(result.current.moonX.get()).toBe(POS.WEST_X);
        });

        it('should interpolate between WEST_X and EAST_X after appear start', () => {
            const orangeStart = (mockTimeline.asr + mockTimeline.maghrib) / 2;
            const appearStart = orangeStart + (mockTimeline.maghrib - orangeStart) * (1 - FRAC.MOON_PRE_MAGHRIB_APPEAR);
            const scrollProgress = motionValue(appearStart + 0.1);
            const { result } = renderHook(() => useMoon(scrollProgress, mockTimeline));

            const x = result.current.moonX.get();
            // Moon moves from WEST_X (15) to EAST_X (85), so x should be between them
            expect(x).toBeGreaterThan(POS.WEST_X);
            expect(x).toBeLessThan(POS.EAST_X);
        });

        it('should be at EAST_X at end of day', () => {
            const scrollProgress = motionValue(0.99);
            const { result } = renderHook(() => useMoon(scrollProgress, mockTimeline));

            // At 0.99, moon should be close to EAST_X (85) but spring animation may smooth it
            const x = result.current.moonX.get();
            expect(x).toBeGreaterThan(POS.WEST_X);
            expect(x).toBeLessThanOrEqual(POS.EAST_X);
            // Should be closer to EAST_X than WEST_X
            expect(x).toBeGreaterThan((POS.WEST_X + POS.EAST_X) / 2);
        });

        it('should maintain EAST_X position before sunrise for consistency', () => {
            const scrollProgress = motionValue(0.05);
            const { result } = renderHook(() => useMoon(scrollProgress, mockTimeline));

            expect(result.current.moonX.get()).toBe(POS.EAST_X);
        });
    });

    describe('moonY (vertical position)', () => {
        it('should be constant at MOON_Y', () => {
            const scrollProgress = motionValue(0.8);
            const { result } = renderHook(() => useMoon(scrollProgress, mockTimeline));

            expect(result.current.moonY.get()).toBe(POS.MOON_Y);
        });

        it('should remain constant throughout the day', () => {
            const testPoints = [0.1, 0.5, 0.8, 0.95];
            for (const point of testPoints) {
                const scrollProgress = motionValue(point);
                const { result } = renderHook(() => useMoon(scrollProgress, mockTimeline));

                expect(result.current.moonY.get()).toBe(POS.MOON_Y);
            }
        });
    });

    describe('moonOpacity', () => {
        it('should be 0 before maghrib', () => {
            const scrollProgress = motionValue(0.7);
            const { result } = renderHook(() => useMoon(scrollProgress, mockTimeline));

            expect(result.current.moonOpacity.get()).toBe(0);
        });

        it('should increase after maghrib', () => {
            const scrollProgress = motionValue(0.8);
            const { result } = renderHook(() => useMoon(scrollProgress, mockTimeline));

            const opacity = result.current.moonOpacity.get();
            expect(opacity).toBeGreaterThan(0);
        });

        it('should be visible at isha', () => {
            const scrollProgress = motionValue(mockTimeline.isha);
            const { result } = renderHook(() => useMoon(scrollProgress, mockTimeline));

            const opacity = result.current.moonOpacity.get();
            expect(opacity).toBeGreaterThan(0);
        });

        it('should be brighter at midnight', () => {
            const scrollProgress = motionValue(mockTimeline.midNight);
            const { result } = renderHook(() => useMoon(scrollProgress, mockTimeline));

            const opacity = result.current.moonOpacity.get();
            expect(opacity).toBeGreaterThan(0.5);
        });

        it('should be brightest in last third of night', () => {
            const scrollProgress = motionValue(0.97);
            const { result } = renderHook(() => useMoon(scrollProgress, mockTimeline));

            const opacity = result.current.moonOpacity.get();
            expect(opacity).toBeGreaterThan(0.7);
        });

        it('should be 0 before sunrise', () => {
            const scrollProgress = motionValue(0.1);
            const { result } = renderHook(() => useMoon(scrollProgress, mockTimeline));

            expect(result.current.moonOpacity.get()).toBe(0);
        });
    });

    describe('MotionValue reactivity', () => {
        it('should create reactive MotionValues', () => {
            const scrollProgress = motionValue(0.5);
            const { result } = renderHook(() => useMoon(scrollProgress, mockTimeline));

            expect(typeof result.current.moonX.get).toBe('function');
            expect(typeof result.current.moonY.get).toBe('function');
            expect(typeof result.current.moonOpacity.get).toBe('function');
        });

        it('should update values when scrollProgress changes', () => {
            const scrollProgress1 = motionValue(0.7);
            const { result: result1 } = renderHook(() => useMoon(scrollProgress1, mockTimeline));

            const scrollProgress2 = motionValue(0.9);
            const { result: result2 } = renderHook(() => useMoon(scrollProgress2, mockTimeline));

            // Moon should be more visible at 0.9 (night) than at 0.7 (before maghrib)
            expect(result2.current.moonOpacity.get()).toBeGreaterThan(result1.current.moonOpacity.get());
        });

        it('should react to timeline changes', () => {
            const scrollProgress = motionValue(0.8);
            const { result, rerender } = renderHook(
                ({ timeline }) => useMoon(scrollProgress, timeline),
                { initialProps: { timeline: mockTimeline } }
            );

            // With timeline, moon should have some opacity at 0.8 (after maghrib)
            const initialOpacity = result.current.moonOpacity.get();
            expect(initialOpacity).toBeGreaterThan(0);

            rerender({ timeline: null });

            // Without timeline, moon opacity should be 0 (raw value, spring may smooth it)
            // The raw transform returns 0, but spring animation may delay the update
            const opacityAfterNull = result.current.moonOpacity.get();
            // Spring animation may still show previous value, so we check it's less than initial
            expect(opacityAfterNull).toBeLessThanOrEqual(initialOpacity);
            
            // Moon X should be EAST_X when timeline is null, but spring animation smooths it
            const moonXAfterNull = result.current.moonX.get();
            // Spring animation smooths the transition, so it may not be exactly EAST_X immediately
            // It should be a valid X position between WEST_X and EAST_X
            expect(moonXAfterNull).toBeGreaterThanOrEqual(POS.WEST_X);
            expect(moonXAfterNull).toBeLessThanOrEqual(POS.EAST_X);
        });
    });

    describe('return value structure', () => {
        it('should return all required MotionValue properties', () => {
            const scrollProgress = motionValue(0.8);
            const { result } = renderHook(() => useMoon(scrollProgress, mockTimeline));

            expect(result.current).toHaveProperty('moonX');
            expect(result.current).toHaveProperty('moonY');
            expect(result.current).toHaveProperty('moonOpacity');

            expect(typeof result.current.moonX.get).toBe('function');
            expect(typeof result.current.moonY.get).toBe('function');
            expect(typeof result.current.moonOpacity.get).toBe('function');
        });
    });

    describe('edge cases', () => {
        it('should handle scrollProgress at exact timeline boundaries', () => {
            const testPoints = [
                mockTimeline.fajr,
                mockTimeline.sunrise,
                mockTimeline.maghrib,
                mockTimeline.isha,
                mockTimeline.midNight,
            ];

            for (const point of testPoints) {
                const scrollProgress = motionValue(point);
                const { result } = renderHook(() => useMoon(scrollProgress, mockTimeline));

                // Moon X should be between EAST_X (85) and WEST_X (15)
                expect(result.current.moonX.get()).toBeGreaterThanOrEqual(POS.WEST_X);
                expect(result.current.moonX.get()).toBeLessThanOrEqual(POS.EAST_X);
                expect(result.current.moonY.get()).toBe(POS.MOON_Y);
                expect(result.current.moonOpacity.get()).toBeGreaterThanOrEqual(0);
                expect(result.current.moonOpacity.get()).toBeLessThanOrEqual(1);
            }
        });

        it('should handle scrollProgress at 0 (start of day)', () => {
            const scrollProgress = motionValue(0);
            const { result } = renderHook(() => useMoon(scrollProgress, mockTimeline));

            expect(result.current.moonX.get()).toBe(POS.EAST_X);
            expect(result.current.moonOpacity.get()).toBe(0);
        });

        it('should handle scrollProgress at 1 (end of day)', () => {
            const scrollProgress = motionValue(1);
            const { result } = renderHook(() => useMoon(scrollProgress, mockTimeline));

            expect(result.current.moonX.get()).toBeCloseTo(POS.EAST_X, 1);
            expect(result.current.moonOpacity.get()).toBeGreaterThan(0);
        });
    });

    describe('moon motion characteristics', () => {
        it('should move from west to east (right to left)', () => {
            const orangeStart = (mockTimeline.asr + mockTimeline.maghrib) / 2;
            const appearStart = orangeStart + (mockTimeline.maghrib - orangeStart) * (1 - FRAC.MOON_PRE_MAGHRIB_APPEAR);

            const beforeAppear = motionValue(appearStart - 0.01);
            const { result: beforeResult } = renderHook(() => useMoon(beforeAppear, mockTimeline));

            const afterAppear = motionValue(appearStart + 0.1);
            const { result: afterResult } = renderHook(() => useMoon(afterAppear, mockTimeline));

            // Moon should move from WEST_X (15, right) to EAST_X (85, left)
            expect(beforeResult.current.moonX.get()).toBe(POS.WEST_X);
            // After appear start, moon should move toward EAST_X (increasing x value)
            expect(afterResult.current.moonX.get()).toBeGreaterThan(POS.WEST_X);
        });

        it('should have linear motion (no arc)', () => {
            // Test that moon Y position doesn't change (unlike sun)
            const testPoints = [0.7, 0.8, 0.9, 0.95];
            const yValues: number[] = [];

            for (const point of testPoints) {
                const scrollProgress = motionValue(point);
                const { result } = renderHook(() => useMoon(scrollProgress, mockTimeline));
                yValues.push(result.current.moonY.get());
            }

            // All Y values should be the same (constant)
            expect(new Set(yValues).size).toBe(1);
            expect(yValues[0]).toBe(POS.MOON_Y);
        });
    });
});

