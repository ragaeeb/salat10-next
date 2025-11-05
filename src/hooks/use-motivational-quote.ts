'use client';

import { useEffect, useState } from 'react';
import type { Quote } from '@/types/quote';

export type MotivationalQuoteState = { error: boolean; loading: boolean; quote: Quote | null };

/**
 * Loads a motivational quote from the server once per mount.
 *
 * The hook exposes a small status object so consumers can render loading or error fallbacks
 * while keeping the fetch and cancellation logic isolated from UI components.
 */
export const useMotivationalQuote = (): MotivationalQuoteState => {
    const [state, setState] = useState<MotivationalQuoteState>({ error: false, loading: true, quote: null });

    useEffect(() => {
        let cancelled = false;

        const loadQuote = async () => {
            try {
                const response = await fetch('/api/quotes');
                if (!response.ok) {
                    throw new Error(`Failed to fetch quote: ${response.status}`);
                }
                const data: Quote = await response.json();

                if (!cancelled) {
                    setState({ error: false, loading: false, quote: data });
                }
            } catch (error) {
                console.warn('Quote fetch failed', error);
                if (!cancelled) {
                    setState({ error: true, loading: false, quote: null });
                }
            }
        };

        loadQuote();

        return () => {
            cancelled = true;
        };
    }, []);

    return state;
};
