'use client';

import { useEffect, useRef, useState } from 'react';
import { getRandomQuote } from '@/lib/quotes';
import { useCurrentData } from '@/store/usePrayerStore';
import type { Quote } from '@/types/quote';

export type MotivationalQuoteState = { error: boolean; loading: boolean; quote: Quote | null };

/**
 * Hook to load motivational quotes filtered by current prayer time
 *
 * Selects a random quote that's contextually appropriate for the current prayer
 * period (e.g., Fajr-related quotes during Fajr time). The quote catalog is
 * loaded after hydration so it stays out of the initial JavaScript bundle.
 *
 * The quote is selected once after current data becomes available and remains stable until page reload.
 *
 * @returns Quote state
 * @property {Quote | null} quote - Selected quote with text, author, and metadata
 * @property {boolean} loading - Whether the quote catalog is loading
 * @property {boolean} error - Whether the quote catalog failed to load
 *
 * @example
 * ```tsx
 * const { quote } = useMotivationalQuote();
 *
 * return (
 *   <div>
 *     {quote && (
 *       <>
 *         <p>{quote.text}</p>
 *         <cite>{quote.author}</cite>
 *       </>
 *     )}
 *   </div>
 * );
 * ```
 */
export const useMotivationalQuote = (): MotivationalQuoteState => {
    const currentData = useCurrentData();
    const [state, setState] = useState<MotivationalQuoteState>({ error: false, loading: true, quote: null });
    const hasSelectedQuote = useRef(false);

    useEffect(() => {
        if (!currentData || hasSelectedQuote.current) {
            return;
        }

        const controller = new AbortController();

        fetch('/quotes.json', { signal: controller.signal })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to load quotes: ${response.status}`);
                }

                return response.json() as Promise<{ quotes: Quote[] }>;
            })
            .then(({ quotes }) => {
                hasSelectedQuote.current = true;
                setState({ error: false, loading: false, quote: getRandomQuote(currentData, quotes) });
            })
            .catch(() => {
                if (!controller.signal.aborted) {
                    setState({ error: true, loading: false, quote: null });
                }
            });

        return () => controller.abort();
    }, [currentData]);

    return state;
};
