'use client';

import { useMemo } from 'react';
import quotesData from '@/../public/quotes.json';
import { getRandomQuote } from '@/lib/quotes';
import { useCurrentData } from '@/store/usePrayerStore';
import type { Quote } from '@/types/quote';

export type MotivationalQuoteState = { error: boolean; loading: boolean; quote: Quote | null };

/**
 * Loads a motivational quote filtered by current prayer times and date.
 * Uses direct JSON import for better performance and no API costs.
 */
export const useMotivationalQuote = (): MotivationalQuoteState => {
    const currentData = useCurrentData();

    const quote = useMemo(() => {
        if (!currentData) {
            return null;
        }
        return getRandomQuote(currentData, quotesData.quotes);
    }, [currentData]);

    return { error: false, loading: false, quote };
};
