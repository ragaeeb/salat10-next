import { useScroll } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DAY_HEIGHT_PX, DISTANCE_FROM_TOP_BOTTOM } from '@/lib/constants';
import { timeToScroll } from '@/lib/timeline';
import type { DayData } from '@/types/timeline';
import { useScrollProgress } from './use-scroll-progress';

/**
 * Hook to track scroll position and manage timeline navigation
 *
 * Coordinates scroll position initialization, current day tracking, and button
 * visibility for loading adjacent days. Automatically scrolls to current prayer
 * time on mount and adjusts scroll position when days are added to prevent jumps.
 *
 * @param {DayData[]} days - Array of loaded day data with prayer timings
 * @returns Scroll tracking state and controls
 * @property {number} currentDayIndex - Index of currently visible day in the buffer
 * @property {MotionValue<number>} scrollProgress - Normalized progress (0-0.999) within current day
 * @property {number} pNow - Plain number version of scrollProgress for branching logic
 * @property {boolean} showLoadPrev - True when user is near top and should see "load previous" button
 * @property {boolean} showLoadNext - True when user is near bottom and should see "load next" button
 * @property {number} totalHeight - Total scrollable height in pixels
 * @property {() => void} onAddPrevDay - Adjust scroll position after adding previous day
 *
 * @example
 * ```tsx
 * const { days, addPreviousDay } = useDayBuffer(config);
 * const {
 *   currentDayIndex,
 *   scrollProgress,
 *   showLoadPrev,
 *   onAddPrevDay
 * } = useScrollTracking(days);
 *
 * return (
 *   <>
 *     {showLoadPrev && (
 *       <button onClick={() => {
 *         addPreviousDay();
 *         onAddPrevDay();
 *       }}>
 *         Load Previous Day
 *       </button>
 *     )}
 *     <Timeline day={days[currentDayIndex]} />
 *   </>
 * );
 * ```
 */
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
