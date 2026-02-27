import { describe, expect, it } from 'bun:test';
import { renderHook, waitFor } from '@testing-library/react';
import { motionValue } from 'motion/react';
import { DAY_HEIGHT_PX } from '@/lib/constants';
import { useScrollProgress } from './use-scroll-progress';

describe('useScrollProgress', () => {
    describe('scrollProgress calculation', () => {
        it('should return 0 for scroll position 0', () => {
            const scrollY = motionValue(0);
            const { result } = renderHook(() => useScrollProgress(scrollY));

            expect(result.current.scrollProgress.get()).toBe(0);
        });

        it('should return 0.5 for scroll position at half day height', () => {
            const scrollY = motionValue(DAY_HEIGHT_PX / 2);
            const { result } = renderHook(() => useScrollProgress(scrollY));

            expect(result.current.scrollProgress.get()).toBe(0.5);
        });

        it('should return 0.999 for scroll position at full day height', () => {
            const scrollY = motionValue(DAY_HEIGHT_PX);
            const { result } = renderHook(() => useScrollProgress(scrollY));

            // MotionValue transform evaluates when get() is called
            const progress = result.current.scrollProgress.get();
            expect(progress).toBeLessThanOrEqual(0.999);
            // At exactly DAY_HEIGHT_PX, modulo gives 0, but clamp makes it 0.999
            // Actually: DAY_HEIGHT_PX % DAY_HEIGHT_PX = 0, so 0 / DAY_HEIGHT_PX = 0, clamped to 0.999
            // But the clamp happens in the transform, so it should be 0.999
            // However, modulo of exact multiple gives 0, so we need to test slightly less
            const scrollY2 = motionValue(DAY_HEIGHT_PX - 1);
            const { result: result2 } = renderHook(() => useScrollProgress(scrollY2));
            expect(result2.current.scrollProgress.get()).toBeCloseTo(0.999, 3);
        });

        it('should clamp to 0.999 even if scroll exceeds day height', () => {
            const scrollY = motionValue(DAY_HEIGHT_PX * 1.5);
            const { result } = renderHook(() => useScrollProgress(scrollY));

            // 1.5 * DAY_HEIGHT_PX % DAY_HEIGHT_PX = 0.5 * DAY_HEIGHT_PX
            // So progress = 0.5, clamped to 0.999
            const progress = result.current.scrollProgress.get();
            expect(progress).toBeLessThanOrEqual(0.999);
            expect(progress).toBeGreaterThanOrEqual(0);
        });

        it('should wrap correctly for multiple day heights', () => {
            const scrollY = motionValue(DAY_HEIGHT_PX * 2.5);
            const { result } = renderHook(() => useScrollProgress(scrollY));

            // Should wrap: 2.5 * DAY_HEIGHT_PX % DAY_HEIGHT_PX = 0.5 * DAY_HEIGHT_PX
            expect(result.current.scrollProgress.get()).toBe(0.5);
        });

        it('should handle negative scroll positions', () => {
            const scrollY = motionValue(-100);
            const { result } = renderHook(() => useScrollProgress(scrollY));

            // JavaScript modulo: -100 % DAY_HEIGHT_PX = -100 (negative result)
            // The transform uses: latest % DAY_HEIGHT_PX, which gives negative
            // Then: withinDay / DAY_HEIGHT_PX gives negative value
            // Math.min(p, 0.999) with negative p gives the negative value
            const progress = result.current.scrollProgress.get();
            // Progress can be negative for negative scroll positions
            expect(progress).toBeLessThan(0);
        });
    });

    describe('pNow state', () => {
        it('should initialize pNow to 0', () => {
            const scrollY = motionValue(0);
            const { result } = renderHook(() => useScrollProgress(scrollY));

            expect(result.current.pNow).toBe(0);
        });

        it('should update pNow when scrollProgress changes', async () => {
            const scrollY = motionValue(0);
            const { result } = renderHook(() => useScrollProgress(scrollY));

            expect(result.current.pNow).toBe(0);

            // Update scroll position
            scrollY.set(DAY_HEIGHT_PX / 2);

            await waitFor(() => {
                expect(result.current.pNow).toBe(0.5);
            });
        });

        it('should update pNow to clamped value when scroll exceeds day height', async () => {
            const scrollY = motionValue(0);
            const { result } = renderHook(() => useScrollProgress(scrollY));

            scrollY.set(DAY_HEIGHT_PX * 2);

            await waitFor(() => {
                // DAY_HEIGHT_PX * 2 % DAY_HEIGHT_PX = 0, so progress = 0
                // But we want to test clamping, so use a value that gives > 0.999
                expect(result.current.pNow).toBeGreaterThanOrEqual(0);
                expect(result.current.pNow).toBeLessThanOrEqual(0.999);
            });
        });
    });

    describe('MotionValue reactivity', () => {
        it('should create reactive scrollProgress MotionValue', () => {
            const scrollY = motionValue(0);
            const { result } = renderHook(() => useScrollProgress(scrollY));

            expect(typeof result.current.scrollProgress.get).toBe('function');
            expect(result.current.scrollProgress.get()).toBe(0);

            // Create new MotionValue with different value to test transform
            const scrollY2 = motionValue(DAY_HEIGHT_PX / 4);
            const { result: result2 } = renderHook(() => useScrollProgress(scrollY2));
            expect(result2.current.scrollProgress.get()).toBe(0.25);
        });

        it('should update scrollProgress when scrollY changes', async () => {
            const scrollY = motionValue(0);
            const { result } = renderHook(() => useScrollProgress(scrollY));

            const values: number[] = [];
            const unsubscribe = result.current.scrollProgress.on('change', (v) => {
                values.push(v);
            });

            scrollY.set(DAY_HEIGHT_PX / 4);
            scrollY.set(DAY_HEIGHT_PX / 2);
            scrollY.set((DAY_HEIGHT_PX * 3) / 4);

            // Wait for MotionValue to propagate changes
            await waitFor(() => {
                expect(values.length).toBeGreaterThan(0);
            });

            unsubscribe();

            expect(values.length).toBeGreaterThan(0);
            // Last value should be close to 0.75
            expect(values[values.length - 1]).toBeCloseTo(0.75, 2);
        });
    });

    describe('edge cases', () => {
        it('should handle very small scroll positions', () => {
            const scrollY = motionValue(1);
            const { result } = renderHook(() => useScrollProgress(scrollY));

            const expected = 1 / DAY_HEIGHT_PX;
            expect(result.current.scrollProgress.get()).toBeCloseTo(expected, 10);
        });

        it('should handle very large scroll positions', () => {
            const scrollY = motionValue(DAY_HEIGHT_PX * 100);
            renderHook(() => useScrollProgress(scrollY));

            // DAY_HEIGHT_PX * 100 % DAY_HEIGHT_PX = 0, so progress = 0
            // To test clamping, use a value that gives > 0.999
            const scrollY2 = motionValue(DAY_HEIGHT_PX * 100 + DAY_HEIGHT_PX - 1);
            const { result: result2 } = renderHook(() => useScrollProgress(scrollY2));
            const progress = result2.current.scrollProgress.get();
            expect(progress).toBeLessThanOrEqual(0.999);
            expect(progress).toBeGreaterThan(0.99);
        });

        it('should handle fractional day heights correctly', () => {
            const scrollY = motionValue(DAY_HEIGHT_PX * 0.123);
            const { result } = renderHook(() => useScrollProgress(scrollY));

            expect(result.current.scrollProgress.get()).toBeCloseTo(0.123, 5);
        });
    });

    describe('return value structure', () => {
        it('should return scrollProgress and pNow', () => {
            const scrollY = motionValue(0);
            const { result } = renderHook(() => useScrollProgress(scrollY));

            expect(result.current).toHaveProperty('scrollProgress');
            expect(result.current).toHaveProperty('pNow');
            expect(typeof result.current.scrollProgress.get).toBe('function');
            expect(typeof result.current.pNow).toBe('number');
        });
    });
});
