'use client';

import { useScroll } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useCalculationConfig } from '@/hooks/use-calculation-config';
import { useDayBuffer } from '@/hooks/use-days';
import { useScrollProgress } from '@/hooks/use-scroll-progress';
import { DAY_HEIGHT_PX, DISTANCE_FROM_TOP_BOTTOM } from '@/lib/constants';
import { buildTimeline, timeToScroll } from '@/lib/timeline';
import { Controls } from './controls';
import { CurrentPhase } from './current-phase';
import { Qamar } from './qamar';
import { Samaa } from './samaa';
import { Shams } from './shams';

export default function ParallaxPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();
    const { config, settings } = useCalculationConfig();

    // Day buffer management
    const { days, addPreviousDay, addNextDay } = useDayBuffer(config);

    // Track scroll position and current day
    const lastScrollY = useRef(0);
    const hasInitialized = useRef(false);
    const [currentDayIndex, setCurrentDayIndex] = useState(0);
    const [showLoadPrev, setShowLoadPrev] = useState(false);
    const [showLoadNext, setShowLoadNext] = useState(false);

    // Derived values
    const totalHeight = days.length * DAY_HEIGHT_PX;
    const totalHeightStyle = useMemo(() => ({ height: totalHeight }), [totalHeight]);
    const currentDay = days[currentDayIndex];
    const timeline = useMemo(() => (currentDay ? buildTimeline(currentDay) : null), [currentDay]);
    const { scrollProgress, pNow } = useScrollProgress(scrollY);

    // Handle loading previous day with scroll adjustment
    const handleLoadPrev = useCallback(() => {
        addPreviousDay();
        requestAnimationFrame(() => {
            window.scrollTo({ behavior: 'auto', left: 0, top: lastScrollY.current + DAY_HEIGHT_PX });
        });
    }, [addPreviousDay]);

    // Handle loading next day
    const handleLoadNext = useCallback(() => {
        addNextDay();
    }, [addNextDay]);

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

    return (
        <>
            <div ref={containerRef} style={totalHeightStyle} />

            <div className="fixed inset-0">
                <Samaa
                    pNow={pNow}
                    timeline={timeline}
                    scrollProgress={scrollProgress}
                    totalDays={days.length}
                    currentDayIndex={currentDayIndex}
                />
                <Shams timeline={timeline} scrollProgress={scrollProgress} />
                <Qamar timeline={timeline} scrollProgress={scrollProgress} />
                <CurrentPhase
                    timeZone={settings.timeZone}
                    scrollProgress={scrollProgress}
                    currentDay={currentDay}
                    timeline={timeline}
                />

                <Controls
                    showLoadNext={showLoadNext}
                    showLoadPrev={showLoadPrev}
                    handleLoadNext={handleLoadNext}
                    handleLoadPrev={handleLoadPrev}
                />
            </div>
        </>
    );
}
