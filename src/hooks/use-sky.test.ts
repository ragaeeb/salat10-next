import { describe, expect, it } from 'bun:test';
import { renderHook } from '@testing-library/react';
import { motionValue } from 'motion/react';
import type { Timeline } from '@/types/timeline';
import { useSky } from './use-sky';

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

describe('useSky', () => {
    describe('with null timeline', () => {
        it('should return default values when timeline is null', () => {
            const scrollProgress = motionValue(0.5);
            const { result } = renderHook(() => useSky(scrollProgress, null));

            expect(result.current.skyColor.get()).toBe('rgba(0,0,0,1)');
            expect(result.current.starsOpacity.get()).toBe(0);
            expect(result.current.fajrGradientOpacity.get()).toBe(0);
            expect(result.current.sunsetGradientOpacity.get()).toBe(0);
            expect(result.current.lightRaysOpacity.get()).toBe(0);
        });
    });

    describe('skyColor', () => {
        it('should return night color before sunrise', () => {
            const scrollProgress = motionValue(0.1);
            const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

            expect(result.current.skyColor.get()).toBe('rgba(5, 7, 16, 0.98)');
        });

        it('should return day color between sunrise and dhuhr', () => {
            const scrollProgress = motionValue(0.2);
            const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

            expect(result.current.skyColor.get()).toBe('rgba(135, 206, 235, 0.30)');
        });

        it('should return afternoon color between dhuhr and asr', () => {
            const scrollProgress = motionValue(0.5);
            const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

            expect(result.current.skyColor.get()).toBe('rgba(150, 215, 245, 0.32)');
        });

        it('should return evening color between asr and maghrib', () => {
            const scrollProgress = motionValue(0.7);
            const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

            expect(result.current.skyColor.get()).toBe('rgba(160, 220, 255, 0.35)');
        });

        it('should transition between maghrib and isha', () => {
            const scrollProgress = motionValue(0.8);
            const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

            const color = result.current.skyColor.get();
            expect(color).toContain('rgba');
            expect(color).not.toBe('rgba(160, 220, 255, 0.35)');
        });

        it('should return dusk color between isha and midnight', () => {
            const scrollProgress = motionValue(0.87);
            const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

            expect(result.current.skyColor.get()).toBe('rgba(10, 12, 28, 0.90)');
        });

        it('should return late night color between midnight and last third', () => {
            const scrollProgress = motionValue(0.92);
            const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

            expect(result.current.skyColor.get()).toBe('rgba(6, 8, 20, 0.95)');
        });

        it('should return pre-dawn color after last third', () => {
            const scrollProgress = motionValue(0.97);
            const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

            expect(result.current.skyColor.get()).toBe('rgba(5, 7, 16, 0.98)');
        });
    });

    describe('starsOpacity', () => {
        it('should be 0 before isha', () => {
            const scrollProgress = motionValue(0.7);
            const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

            expect(result.current.starsOpacity.get()).toBe(0);
        });

        it('should transition between isha and midnight', () => {
            const scrollProgress = motionValue(0.87);
            const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

            const opacity = result.current.starsOpacity.get();
            expect(opacity).toBeGreaterThan(0);
            expect(opacity).toBeLessThan(1);
        });

        it('should be 1 after midnight', () => {
            const scrollProgress = motionValue(0.92);
            const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

            expect(result.current.starsOpacity.get()).toBe(1);
        });

        it('should remain 1 in last third of night', () => {
            const scrollProgress = motionValue(0.97);
            const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

            expect(result.current.starsOpacity.get()).toBe(1);
        });
    });

    describe('fajrGradientOpacity', () => {
        it('should be 0 before fajr', () => {
            const scrollProgress = motionValue(-0.1);
            const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

            expect(result.current.fajrGradientOpacity.get()).toBe(0);
        });

        it('should be visible at fajr', () => {
            const scrollProgress = motionValue(mockTimeline.fajr);
            const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

            expect(result.current.fajrGradientOpacity.get()).toBeGreaterThanOrEqual(0.7);
        });

        it('should increase between fajr and sunrise', () => {
            const scrollProgress = motionValue(0.07);
            const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

            const opacity = result.current.fajrGradientOpacity.get();
            expect(opacity).toBeGreaterThan(0.7);
            expect(opacity).toBeLessThanOrEqual(1);
        });

        it('should fade after sunrise', () => {
            const scrollProgress = motionValue(0.16);
            const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

            const opacity = result.current.fajrGradientOpacity.get();
            expect(opacity).toBeLessThan(1);
        });

        it('should be 0 well after sunrise', () => {
            const scrollProgress = motionValue(0.3);
            const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

            expect(result.current.fajrGradientOpacity.get()).toBe(0);
        });
    });

    describe('sunsetGradientOpacity', () => {
        it('should be 0 early in the day', () => {
            const scrollProgress = motionValue(0.3);
            const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

            expect(result.current.sunsetGradientOpacity.get()).toBe(0);
        });

        it('should be 0 before halfway between asr and maghrib', () => {
            const scrollProgress = motionValue(0.6);
            const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

            expect(result.current.sunsetGradientOpacity.get()).toBe(0);
        });

        it('should increase after halfway point', () => {
            const orangeStart = (mockTimeline.asr + mockTimeline.maghrib) / 2;
            const scrollProgress = motionValue(orangeStart + 0.01);
            const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

            const opacity = result.current.sunsetGradientOpacity.get();
            expect(opacity).toBeGreaterThan(0);
        });

        it('should be at maximum during hold period', () => {
            const scrollProgress = motionValue(0.78);
            const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

            expect(result.current.sunsetGradientOpacity.get()).toBe(1);
        });

        it('should fade before isha', () => {
            const scrollProgress = motionValue(0.84);
            const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

            const opacity = result.current.sunsetGradientOpacity.get();
            expect(opacity).toBeGreaterThan(0);
            expect(opacity).toBeLessThan(1);
        });

        it('should be 0 at isha', () => {
            const scrollProgress = motionValue(mockTimeline.isha);
            const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

            expect(result.current.sunsetGradientOpacity.get()).toBe(0);
        });

        it('should remain 0 after isha', () => {
            const scrollProgress = motionValue(0.9);
            const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

            expect(result.current.sunsetGradientOpacity.get()).toBe(0);
        });
    });

    describe('lightRaysOpacity', () => {
        it('should be 0 before fajr', () => {
            const scrollProgress = motionValue(-0.1);
            const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

            expect(result.current.lightRaysOpacity.get()).toBe(0);
        });

        it('should increase between fajr and sunrise', () => {
            const scrollProgress = motionValue(0.07);
            const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

            const opacity = result.current.lightRaysOpacity.get();
            expect(opacity).toBeGreaterThan(0);
            expect(opacity).toBeLessThanOrEqual(0.4);
        });

        it('should be at maximum at sunrise', () => {
            const scrollProgress = motionValue(mockTimeline.sunrise);
            const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

            expect(result.current.lightRaysOpacity.get()).toBeCloseTo(0.4, 2);
        });

        it('should fade after sunrise', () => {
            const scrollProgress = motionValue(0.16);
            const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

            const opacity = result.current.lightRaysOpacity.get();
            expect(opacity).toBeGreaterThanOrEqual(0);
            expect(opacity).toBeLessThan(0.4);
        });

        it('should be 0 well after sunrise', () => {
            const scrollProgress = motionValue(0.3);
            const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

            expect(result.current.lightRaysOpacity.get()).toBe(0);
        });

        it('should remain 0 during midday', () => {
            const scrollProgress = motionValue(0.5);
            const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

            expect(result.current.lightRaysOpacity.get()).toBe(0);
        });
    });

    describe('MotionValue reactivity', () => {
        it('should create reactive MotionValues that can be updated', () => {
            const scrollProgress = motionValue(0.1);
            const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

            // Verify initial values are readable
            expect(typeof result.current.skyColor.get()).toBe('string');
            expect(typeof result.current.starsOpacity.get()).toBe('number');

            // Verify values change with different scroll positions
            const result1 = renderHook(() => useSky(motionValue(0.2), mockTimeline));
            const result2 = renderHook(() => useSky(motionValue(0.7), mockTimeline));

            // Different scroll positions should produce different sky colors
            expect(result1.result.current.skyColor.get()).toBe('rgba(135, 206, 235, 0.30)');
            expect(result2.result.current.skyColor.get()).toBe('rgba(160, 220, 255, 0.35)');
        });

        it('should react to timeline changes', () => {
            const scrollProgress = motionValue(0.5);
            const { result, rerender } = renderHook(({ timeline }) => useSky(scrollProgress, timeline), {
                initialProps: { timeline: mockTimeline },
            });

            const initialColor = result.current.skyColor.get();
            expect(initialColor).toBe('rgba(150, 215, 245, 0.32)');

            // Rerender with null timeline
            rerender({ timeline: null });

            const updatedColor = result.current.skyColor.get();
            expect(updatedColor).toBe('rgba(0,0,0,1)');
        });
    });

    describe('return value structure', () => {
        it('should return all required MotionValue properties', () => {
            const scrollProgress = motionValue(0.5);
            const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

            expect(result.current).toHaveProperty('skyColor');
            expect(result.current).toHaveProperty('starsOpacity');
            expect(result.current).toHaveProperty('fajrGradientOpacity');
            expect(result.current).toHaveProperty('sunsetGradientOpacity');
            expect(result.current).toHaveProperty('lightRaysOpacity');

            // Verify they are MotionValues
            expect(typeof result.current.skyColor.get).toBe('function');
            expect(typeof result.current.starsOpacity.get).toBe('function');
            expect(typeof result.current.fajrGradientOpacity.get).toBe('function');
            expect(typeof result.current.sunsetGradientOpacity.get).toBe('function');
            expect(typeof result.current.lightRaysOpacity.get).toBe('function');
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
                const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

                // Should not throw and should return valid values
                expect(typeof result.current.skyColor.get()).toBe('string');
                expect(result.current.skyColor.get()).toContain('rgba');

                expect(result.current.starsOpacity.get()).toBeGreaterThanOrEqual(0);
                expect(result.current.starsOpacity.get()).toBeLessThanOrEqual(1);

                expect(result.current.fajrGradientOpacity.get()).toBeGreaterThanOrEqual(0);
                expect(result.current.fajrGradientOpacity.get()).toBeLessThanOrEqual(1);

                expect(result.current.sunsetGradientOpacity.get()).toBeGreaterThanOrEqual(0);
                expect(result.current.sunsetGradientOpacity.get()).toBeLessThanOrEqual(1);

                expect(result.current.lightRaysOpacity.get()).toBeGreaterThanOrEqual(0);
                expect(result.current.lightRaysOpacity.get()).toBeLessThanOrEqual(0.4);
            }
        });

        it('should handle scrollProgress at 0 (start of day)', () => {
            const scrollProgress = motionValue(0);
            const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

            expect(result.current.skyColor.get()).toBe('rgba(5, 7, 16, 0.98)');
            expect(result.current.starsOpacity.get()).toBe(0);
            expect(result.current.fajrGradientOpacity.get()).toBeGreaterThanOrEqual(0.7);
        });

        it('should handle scrollProgress at 1 (end of day)', () => {
            const scrollProgress = motionValue(1);
            const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

            expect(typeof result.current.skyColor.get()).toBe('string');
            expect(result.current.starsOpacity.get()).toBe(1);
            expect(result.current.fajrGradientOpacity.get()).toBe(0);
            expect(result.current.sunsetGradientOpacity.get()).toBe(0);
        });

        it('should handle negative scrollProgress', () => {
            const scrollProgress = motionValue(-0.5);
            const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

            // Should not crash and return valid values
            expect(typeof result.current.skyColor.get()).toBe('string');
            expect(result.current.starsOpacity.get()).toBeGreaterThanOrEqual(0);
        });

        it('should handle scrollProgress greater than 1', () => {
            const scrollProgress = motionValue(1.5);
            const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

            // Should not crash and return valid values
            expect(typeof result.current.skyColor.get()).toBe('string');
            expect(result.current.starsOpacity.get()).toBeLessThanOrEqual(1);
        });
    });

    describe('integration - gradients should not overlap inappropriately', () => {
        it('should not have both fajr and sunset gradients visible', () => {
            // Test multiple points throughout the day
            const testPoints = Array.from({ length: 20 }, (_, i) => i / 20);

            for (const point of testPoints) {
                const scrollProgress = motionValue(point);
                const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

                const fajrOpacity = result.current.fajrGradientOpacity.get();
                const sunsetOpacity = result.current.sunsetGradientOpacity.get();

                // Both should not be significantly visible at the same time
                if (fajrOpacity > 0.5) {
                    expect(sunsetOpacity).toBeLessThan(0.1);
                }
                if (sunsetOpacity > 0.5) {
                    expect(fajrOpacity).toBeLessThan(0.1);
                }
            }
        });

        it('should have stars only visible during night hours', () => {
            // Stars should be 0 during the day
            const dayPoints = [0.2, 0.4, 0.5, 0.6, 0.7]; // Between sunrise and maghrib area

            for (const point of dayPoints) {
                const scrollProgress = motionValue(point);
                const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

                expect(result.current.starsOpacity.get()).toBe(0);
            }
        });

        it('should have light rays only around sunrise', () => {
            // Light rays should be 0 except around fajr-sunrise period
            const otherPoints = [0.3, 0.5, 0.7, 0.9];

            for (const point of otherPoints) {
                const scrollProgress = motionValue(point);
                const { result } = renderHook(() => useSky(scrollProgress, mockTimeline));

                expect(result.current.lightRaysOpacity.get()).toBe(0);
            }
        });
    });
});
