import { type RefObject, useEffect } from 'react';
import { DAY_HEIGHT_PX } from '@/lib/constants';
import { timeToScroll } from '@/lib/timeline';
import type { DayData } from '@/types/timeline';

export function useInitialScroll(
    hasInitialized: boolean,
    days: DayData[],
    lastScrollY: RefObject<number>,
    setHasInitialized: (value: boolean) => void,
) {
    useEffect(() => {
        if (hasInitialized || days.length === 0) {
            return;
        }
        const today = days[0]!;
        const initialP = timeToScroll(Date.now(), today);
        const scrollTop = initialP * DAY_HEIGHT_PX;
        window.history.scrollRestoration = 'manual';
        window.scrollTo({ behavior: 'auto', left: 0, top: scrollTop });
        lastScrollY.current = scrollTop;
        setHasInitialized(true);
        return () => {
            window.history.scrollRestoration = 'auto';
        };
    }, [hasInitialized, days, lastScrollY, setHasInitialized]);
}
