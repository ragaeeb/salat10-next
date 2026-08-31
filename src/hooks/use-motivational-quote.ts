'use client';

import { useEffect, useRef, useState } from 'react';
import quotesData from '@/../public/quotes.json';
import { getRandomQuote } from '@/lib/quotes';
import { useCurrentData } from '@/store/usePrayerStore';
import type { Quote } from '@/types/quote';

export type MotivationalQuoteState = { error: boolean; loading: boolean; quote: Quote | null };

/**
 * Hook to load motivational quotes filtered by current prayer time
 *
 * Selects a random quote that's contextually appropriate for the current prayer
 * period (e.g., Fajr-related quotes during Fajr time). Uses direct JSON import
 * for performance - no API calls or loading states.
 *
 * The quote is selected once after current data becomes available and remains stable until page reload.
 *
 * @returns Quote state
 * @property {Quote | null} quote - Selected quote with text, author, and metadata
 * @property {boolean} loading - Always false (synchronous loading from JSON)
 * @property {boolean} error - Always false (no network errors possible)
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
    const [quote, setQuote] = useState<Quote | null>(null);
    const hasSelectedQuote = useRef(false);

    useEffect(() => {
        if (!currentData || hasSelectedQuote.current) {
            return;
        }

        hasSelectedQuote.current = true;
        setQuote(getRandomQuote(currentData, quotesData.quotes));
    }, [currentData]);

    return { error: false, loading: false, quote };
};
