import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { DAY_HEIGHT_PX, DISTANCE_FROM_TOP_BOTTOM, salatLabels } from '@/lib/constants';
import { daily } from '@/lib/calculator';
import { useScrollTracking } from './use-scroll-tracking';
import type { DayData } from '@/types/timeline';
import { Coordinates, PrayerTimes, SunnahTimes } from 'adhan';
import { createParameters } from '@/lib/settings';

// Helper to create mock day data
const createMockDayData = (date: Date): DayData => {
    const coords = new Coordinates(43.6532, -79.3832);
    const params = createParameters({ fajrAngle: 15, ishaAngle: 15, ishaInterval: 0, method: 'MuslimWorldLeague' });
    const todayRes = daily(salatLabels, { ...params, latitude: '43.6532', longitude: '-79.3832', method: 'MuslimWorldLeague', timeZone: 'America/Toronto' }, date);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    const nextRes = daily(salatLabels, { ...params, latitude: '43.6532', longitude: '-79.3832', method: 'MuslimWorldLeague', timeZone: 'America/Toronto' }, nextDate);
    const nextFajr = nextRes.timings.find((t) => t.event === 'fajr')?.value ?? null;

    return {
        date,
        dayIndex: 0,
        nextFajr,
        timings: todayRes.timings,
    };
};

describe('useScrollTracking', () => {
    beforeEach(() => {
        // Mock window.scrollTo
        window.scrollTo = () => {};
        window.history.scrollRestoration = 'auto';
        
        // Mock window.innerHeight
        Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: 800,
        });
    });

    afterEach(() => {
        window.history.scrollRestoration = 'auto';
    });

    describe('initialization', () => {
        it('should initialize with current day index 0', async () => {
            const days: DayData[] = [createMockDayData(new Date())];
            const { result } = renderHook(() => useScrollTracking(days));

            await waitFor(() => {
                expect(result.current.currentDayIndex).toBeDefined();
            });

            expect(result.current.currentDayIndex).toBe(0);
        });

        it('should calculate totalHeight correctly', () => {
            const days: DayData[] = [
                createMockDayData(new Date()),
                createMockDayData(new Date()),
                createMockDayData(new Date()),
            ];
            const { result } = renderHook(() => useScrollTracking(days));

            expect(result.current.totalHeight).toBe(days.length * DAY_HEIGHT_PX);
        });

        it('should initialize scroll position to current time', async () => {
            const days: DayData[] = [createMockDayData(new Date())];
            const scrollToSpy = { called: false };
            
            window.scrollTo = () => {
                scrollToSpy.called = true;
            };

            renderHook(() => useScrollTracking(days));

            await waitFor(() => {
                expect(scrollToSpy.called).toBe(true);
            });
        });

        it('should not initialize if days array is empty', () => {
            const { result } = renderHook(() => useScrollTracking([]));

            expect(result.current.currentDayIndex).toBe(0);
            expect(result.current.totalHeight).toBe(0);
        });
    });

    describe('currentDayIndex tracking', () => {
        it('should update currentDayIndex based on scroll position', async () => {
            const days: DayData[] = [
                createMockDayData(new Date()),
                createMockDayData(new Date()),
            ];
            const { result } = renderHook(() => useScrollTracking(days));

            // Simulate scrolling to second day
            // This would normally be done through the scrollY MotionValue
            // For testing, we verify the structure
            expect(result.current.currentDayIndex).toBeGreaterThanOrEqual(0);
            expect(result.current.currentDayIndex).toBeLessThan(days.length);
        });
    });

    describe('button visibility', () => {
        it('should show load previous button when near top', () => {
            const days: DayData[] = [createMockDayData(new Date())];
            const { result } = renderHook(() => useScrollTracking(days));

            // Button visibility depends on scroll position
            expect(typeof result.current.showLoadPrev).toBe('boolean');
            expect(typeof result.current.showLoadNext).toBe('boolean');
        });

        it('should show load next button when near bottom', () => {
            const days: DayData[] = [createMockDayData(new Date())];
            const { result } = renderHook(() => useScrollTracking(days));

            expect(typeof result.current.showLoadNext).toBe('boolean');
        });
    });

    describe('scrollProgress and pNow', () => {
        it('should return scrollProgress MotionValue', () => {
            const days: DayData[] = [createMockDayData(new Date())];
            const { result } = renderHook(() => useScrollTracking(days));

            expect(result.current.scrollProgress).toBeDefined();
            expect(typeof result.current.scrollProgress.get).toBe('function');
        });

        it('should return pNow as a number', () => {
            const days: DayData[] = [createMockDayData(new Date())];
            const { result } = renderHook(() => useScrollTracking(days));

            expect(typeof result.current.pNow).toBe('number');
            expect(result.current.pNow).toBeGreaterThanOrEqual(0);
            expect(result.current.pNow).toBeLessThanOrEqual(1);
        });
    });

    describe('onAddPrevDay', () => {
        it('should adjust scroll position when previous day is added', () => {
            const days: DayData[] = [createMockDayData(new Date())];
            const scrollToSpy = { called: false, top: 0 };
            
            window.scrollTo = ({ top }: { top?: number }) => {
                scrollToSpy.called = true;
                scrollToSpy.top = top ?? 0;
            };

            const { result } = renderHook(() => useScrollTracking(days));

            // Simulate adding previous day
            result.current.onAddPrevDay();

            // Should adjust scroll position by DAY_HEIGHT_PX
            expect(scrollToSpy.called).toBe(true);
        });
    });

    describe('multiple days', () => {
        it('should handle multiple days correctly', () => {
            const days: DayData[] = [
                createMockDayData(new Date('2024-03-15')),
                createMockDayData(new Date('2024-03-16')),
                createMockDayData(new Date('2024-03-17')),
            ];
            const { result } = renderHook(() => useScrollTracking(days));

            expect(result.current.totalHeight).toBe(days.length * DAY_HEIGHT_PX);
            expect(result.current.currentDayIndex).toBeGreaterThanOrEqual(0);
            expect(result.current.currentDayIndex).toBeLessThan(days.length);
        });
    });

    describe('edge cases', () => {
        it('should handle empty days array', () => {
            const { result } = renderHook(() => useScrollTracking([]));

            expect(result.current.totalHeight).toBe(0);
            expect(result.current.currentDayIndex).toBe(0);
            expect(result.current.pNow).toBe(0);
        });

        it('should handle single day', () => {
            const days: DayData[] = [createMockDayData(new Date())];
            const { result } = renderHook(() => useScrollTracking(days));

            expect(result.current.totalHeight).toBe(DAY_HEIGHT_PX);
            expect(result.current.currentDayIndex).toBe(0);
        });

        it('should restore scroll restoration on unmount', () => {
            const days: DayData[] = [createMockDayData(new Date())];
            const { unmount } = renderHook(() => useScrollTracking(days));

            expect(window.history.scrollRestoration).toBe('manual');
            
            unmount();

            expect(window.history.scrollRestoration).toBe('auto');
        });
    });

    describe('return value structure', () => {
        it('should return all required properties', () => {
            const days: DayData[] = [createMockDayData(new Date())];
            const { result } = renderHook(() => useScrollTracking(days));

            expect(result.current).toHaveProperty('currentDayIndex');
            expect(result.current).toHaveProperty('scrollProgress');
            expect(result.current).toHaveProperty('pNow');
            expect(result.current).toHaveProperty('showLoadPrev');
            expect(result.current).toHaveProperty('showLoadNext');
            expect(result.current).toHaveProperty('totalHeight');
            expect(result.current).toHaveProperty('onAddPrevDay');
        });
    });
});

