import { useScroll } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DAY_HEIGHT_PX, DISTANCE_FROM_TOP_BOTTOM } from '@/lib/constants';
import { timeToScroll } from '@/lib/timeline';
import type { DayData } from '@/types/timeline';
import { useScrollProgress } from './use-scroll-progress';

export const useScrollTracking = (days: DayData[]) => {
    const hasInitialized = useRef(false);
    // Track scroll position and current day
    const lastScrollY = useRef(0);
    const { scrollY } = useScroll();
    const [currentDayIndex, setCurrentDayIndex] = useState(0);
    const totalHeight = days.length * DAY_HEIGHT_PX;

    // Initialize scroll position once on mount
    useEffect(() => {
        if (hasInitialized.current || days.length === 0) {
            return;
        }
        const today = days[0]!;
        const initialP = timeToScroll(Date.now(), today);
        const scrollTop = initialP * DAY_HEIGHT_PX;
        window.history.scrollRestoration = 'manual';
        window.scrollTo({ behavior: 'auto', left: 0, top: scrollTop });
        lastScrollY.current = scrollTop;
        hasInitialized.current = true;
        return () => {
            window.history.scrollRestoration = 'auto';
        };
    }, [days]);

    // Track scroll position, current day, and button visibility
    useEffect(() => {
        if (!hasInitialized.current || days.length === 0) {
            return;
        }

        const unsub = scrollY.on('change', (distanceFromTop) => {
            lastScrollY.current = distanceFromTop;

            // Update current day index
            const dayIndex = Math.floor(distanceFromTop / DAY_HEIGHT_PX);
            if (dayIndex !== currentDayIndex) {
                setCurrentDayIndex(dayIndex);
            }

            // Update button visibility
            const distanceFromBottom = totalHeight - distanceFromTop - window.innerHeight;
            const shouldShowPrev = distanceFromTop < DISTANCE_FROM_TOP_BOTTOM;
            const shouldShowNext = distanceFromBottom < DISTANCE_FROM_TOP_BOTTOM;

            setShowLoadPrev((prev) => (prev !== shouldShowPrev ? shouldShowPrev : prev));
            setShowLoadNext((prev) => (prev !== shouldShowNext ? shouldShowNext : prev));
        });
        return () => unsub();
    }, [scrollY, currentDayIndex, days.length, totalHeight]);

    const [showLoadPrev, setShowLoadPrev] = useState(false);
    const [showLoadNext, setShowLoadNext] = useState(false);
    const { scrollProgress, pNow } = useScrollProgress(scrollY);

    const onAddPrevDay = useCallback(() => {
        window.scrollTo({ behavior: 'auto', left: 0, top: lastScrollY.current + DAY_HEIGHT_PX });
    }, []);

    return { currentDayIndex, onAddPrevDay, pNow, scrollProgress, showLoadNext, showLoadPrev, totalHeight };
};
