'use client';

import { useCallback, useRef, useState } from 'react';

export type CopyStatus = 'idle' | 'copied' | 'error';

const DEFAULT_RESET_MS = 2000;

/**
 * Wraps clipboard writes with optimistic UI feedback and automatic reset.
 */
export const useCopyFeedback = (resetAfterMs: number = DEFAULT_RESET_MS) => {
    const [status, setStatus] = useState<CopyStatus>('idle');
    const timeoutRef = useRef<number | null>(null);

    const resetLater = useCallback(() => {
        if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = window.setTimeout(() => {
            setStatus('idle');
            timeoutRef.current = null;
        }, resetAfterMs);
    }, [resetAfterMs]);

    const copy = useCallback(
        async (value: string) => {
            try {
                await navigator.clipboard.writeText(value);
                setStatus('copied');
                resetLater();
                return true;
            } catch (error) {
                console.warn('Clipboard copy failed', error);
                setStatus('error');
                resetLater();
                return false;
            }
        },
        [resetLater],
    );

    return { copy, status };
};
