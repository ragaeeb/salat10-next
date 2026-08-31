import { afterEach, describe, expect, it, spyOn } from 'bun:test';
import { renderHook } from '@testing-library/react';
import { defaultSettings } from '@/lib/constants';
import { computePrayerTimesForDate } from '@/lib/store-utils';
import { usePrayerStore } from '@/store/usePrayerStore';
import { useMotivationalQuote } from './use-motivational-quote';

/**
 * Note: This hook depends on:
 * 1. useCurrentData() from the Zustand store
 * 2. quotes.json import
 *
 * Since these are external dependencies, we test the hook's structure
 * and behavior rather than mocking the entire store. Integration tests
 * would be better suited for testing the full quote filtering logic.
 */
describe('useMotivationalQuote', () => {
    afterEach(() => {
        usePrayerStore.setState({ currentData: null });
    });

    describe('return value structure', () => {
        it('should return quote, loading, and error properties', () => {
            const { result } = renderHook(() => useMotivationalQuote());

            expect(result.current).toHaveProperty('quote');
            expect(result.current).toHaveProperty('loading');
            expect(result.current).toHaveProperty('error');
            expect(typeof result.current.loading).toBe('boolean');
            expect(typeof result.current.error).toBe('boolean');
        });

        it('should always return loading: false and error: false', () => {
            const { result } = renderHook(() => useMotivationalQuote());

            // Hook uses synchronous JSON import, so loading is always false
            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBe(false);
        });
    });

    describe('hook behavior', () => {
        it('should return null quote when currentData is null', () => {
            // When store has no currentData, hook should return null quote
            const { result } = renderHook(() => useMotivationalQuote());

            // Result depends on store state, but structure should be consistent
            expect(result.current.quote).toBeNull();
        });

        it('should select a quote only once while the hook is mounted', () => {
            const currentData = computePrayerTimesForDate(
                { ...defaultSettings, latitude: '43.6532', longitude: '-79.3832' },
                new Date('2026-08-31T12:00:00Z'),
            );
            usePrayerStore.setState({ currentData });

            const random = spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValue(0.999999);

            try {
                const { result, rerender } = renderHook(() => useMotivationalQuote());
                const initialQuote = result.current.quote;

                rerender();

                expect(initialQuote).not.toBeNull();
                expect(result.current.quote).toBe(initialQuote);
                expect(random).toHaveBeenCalledTimes(1);
            } finally {
                random.mockRestore();
            }
        });
    });
});
