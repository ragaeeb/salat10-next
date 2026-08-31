import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { renderHook, waitFor } from '@testing-library/react';
import { defaultSettings } from '@/lib/constants';
import { computePrayerTimesForDate } from '@/lib/store-utils';
import { usePrayerStore } from '@/store/usePrayerStore';
import { useMotivationalQuote } from './use-motivational-quote';

/**
 * Note: This hook depends on:
 * 1. useCurrentData() from the Zustand store
 * 2. quotes.json request
 *
 * Since these are external dependencies, we test the hook's structure
 * and behavior rather than mocking the entire store. Integration tests
 * would be better suited for testing the full quote filtering logic.
 */
describe('useMotivationalQuote', () => {
    const originalFetch = globalThis.fetch;

    afterEach(() => {
        globalThis.fetch = originalFetch;
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

        it('should start loading without an error', () => {
            const { result } = renderHook(() => useMotivationalQuote());

            expect(result.current.loading).toBe(true);
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

        it('should fetch and select a quote only once while the hook is mounted', async () => {
            const currentData = computePrayerTimesForDate(
                { ...defaultSettings, latitude: '43.6532', longitude: '-79.3832' },
                new Date('2026-08-31T12:00:00Z'),
            );
            usePrayerStore.setState({ currentData });
            const fetchMock = mock(() =>
                Promise.resolve(new Response(JSON.stringify({ quotes: [{ body: 'Test quote' }] }))),
            );
            globalThis.fetch = fetchMock as typeof fetch;

            const random = spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValue(0.999999);

            try {
                const { result, rerender } = renderHook(() => useMotivationalQuote());

                await waitFor(() => expect(result.current.quote?.body).toBe('Test quote'));
                const selectedQuote = result.current.quote;

                rerender();

                expect(result.current.quote).toBe(selectedQuote);
                expect(fetchMock).toHaveBeenCalledTimes(1);
                expect(random).toHaveBeenCalledTimes(1);
            } finally {
                random.mockRestore();
            }
        });
    });
});
